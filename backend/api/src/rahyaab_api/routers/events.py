"""Gameplay events from the phone's outbox (POST /v1/events:batch, RFC-0002, envelope v3.0.0 SRS §12.5).

The server never trusts the phone's order or its results. Checks, in order:
1. the access token (auth.py), then the **consent gate** (NFR-45): no parent or adult consent, no upload
   (403 consent_required; the phone keeps its events);
2. limits (NFR-67): 60 batches per student per hour, ≤ 1 MB as sent (gzip allowed), ≤ 4 MB unpacked,
   ≤ 500 events;
3. each event on its own, so one bad event never fails the batch:
   - readable (a UUID event_id; otherwise it is only counted in `unreadable`),
   - already stored → `duplicates`,
   - the envelope schema, no free text, ≤ 1 KB → else rejected `schema` / `size`,
   - a version-7 event_id made within [now − 60 days, now + 1 day] → else `clock`,
   - a known content version and item → else `unknown_version` / `unknown_item`,
   - its run: a new run starts with `run_start` at seq 0 (that creates the sitting and the run); a run that is
     not known yet waits (`deferred: unknown_run`); another student's run is refused (`sequence`),
   - seq is the next number of the run (a gap waits: `deferred: sequence_gap`; an old number is `sequence`),
     and monotonic time never goes back (`monotonic`).
   Final failures go to `quarantine` with the reason; they still use up their seq, so later events of the
   run are not stuck behind them. Accepted events are stored append-only (raw_event).
"""

from __future__ import annotations

import json
import math
import zlib
from datetime import UTC, datetime, timedelta
from typing import Annotated, Any, Literal
from uuid import UUID

from fastapi import APIRouter, Depends, Header, Request
from pydantic import BaseModel, ConfigDict, Field, ValidationError
from sqlalchemy import Connection, Engine, text
from starlette.concurrency import run_in_threadpool

from rahyaab_api.auth import CurrentStudent, current_student
from rahyaab_api.db import get_engine
from rahyaab_api.problems import ProblemError
from rahyaab_api.ratelimit import Limit, enforce

router = APIRouter(tags=["telemetry"])

BATCH_LIMIT = Limit("events:student", 60, 60 * 60)  # docs/api/README.md §3
MAX_BODY = 1024 * 1024  # as sent (gzip or not)
MAX_INFLATED = 4 * 1024 * 1024  # gzip-bomb guard
MAX_EVENTS = 500
MAX_EVENT_BYTES = 1024
MAX_TEXT = 64  # no free text: ids and short codes only
MAX_QUARANTINE_BYTES = 1500  # quarantine.payload is checked at 2048 bytes as stored jsonb
CLOCK_PAST = timedelta(days=60)
CLOCK_FUTURE = timedelta(days=1)

EVENT_TYPES = Literal[
    "session_start",
    "session_end",
    "run_start",
    "help_opened",
    "pause",
    "resume",
    "quit",
    "plan_presented",
    "plan_committed",
    "scene_start",
    "choice_made",
    "reaction",
    "value_choice",
    "calibration_tap",
    "task_item_presented",
    "task_action",
    "task_result",
    "letter_update",
    "week_complete",
    "sim_complete",
    "reflection",
]


class Event(BaseModel):
    """Envelope v3.0.0, as `Event` in docs/api/openapi.yaml."""

    model_config = ConfigDict(extra="forbid")

    event_id: UUID
    schema_version: Literal["3.0.0"]
    session_id: UUID
    run_id: UUID
    seq: int = Field(ge=0, le=1_000_000)
    week: int | None = Field(default=None, ge=0, le=4)
    story_version: str | None = Field(default=None, max_length=MAX_TEXT)
    content_version: str = Field(min_length=1, max_length=MAX_TEXT)
    event_type: EVENT_TYPES
    monotonic_ms: float = Field(ge=0, allow_inf_nan=False)
    wall_clock_utc_min: str | None = Field(default=None, pattern=r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}Z$")
    input_type: Literal["touch", "other"] | None = None
    a11y_mode: bool = False
    practice: bool | None = None
    item_id: str | None = Field(default=None, max_length=64, pattern=r"^[A-Za-z0-9_.:-]+$")
    data: dict[str, Any] | None = None


class Deferred(BaseModel):
    id: UUID
    reason: Literal["unknown_run", "sequence_gap"]


class Rejected(BaseModel):
    id: UUID
    reason: Literal["schema", "sequence", "monotonic", "size", "unknown_version", "unknown_item", "clock"]


class BatchResult(BaseModel):
    accepted: list[UUID] = []
    duplicates: list[UUID] = []
    deferred: list[Deferred] = []
    rejected: list[Rejected] = []
    unreadable: int = 0  # entries without a readable event_id: nothing to acknowledge, nothing stored


def _bad_request(title: str) -> ProblemError:
    return ProblemError(400, "invalid_batch", title)


def _too_large() -> ProblemError:
    return ProblemError(413, "batch_too_large", "Send fewer events at a time")


def _free_text_problem(value: object, depth: int = 0) -> bool:
    """True when `data` holds free text, odd types or deep nesting (the app's rules.ts, mirrored)."""
    if depth > 5:
        return True
    if value is None or isinstance(value, bool):
        return False
    if isinstance(value, int | float):
        return isinstance(value, float) and not math.isfinite(value)
    if isinstance(value, str):
        return len(value) > MAX_TEXT
    if isinstance(value, list):
        return any(_free_text_problem(v, depth + 1) for v in value)
    if isinstance(value, dict):
        return any(_free_text_problem(v, depth + 1) for v in value.values())
    return True


def uuid7_time(event_id: UUID) -> datetime | None:
    """The creation time inside a version-7 UUID, or None for another version."""
    if event_id.version != 7:
        return None
    return datetime.fromtimestamp((event_id.int >> 80) / 1000, tz=UTC)


def _quarantine_payload(raw: object) -> str:
    dumped = json.dumps(raw, ensure_ascii=False, default=str)
    if len(dumped.encode("utf-8")) <= MAX_QUARANTINE_BYTES:
        return dumped
    stub: dict[str, object] = {"truncated": True}
    if isinstance(raw, dict):
        for key in ("event_type", "seq", "run_id", "content_version"):
            value = raw.get(key)
            if isinstance(value, str | int) and len(str(value)) <= MAX_TEXT:
                stub[key] = value
    return json.dumps(stub)


async def _read_body(request: Request) -> bytes:
    """The request body, refusing more than MAX_BODY as sent or MAX_INFLATED once unpacked."""
    received = bytearray()
    async for chunk in request.stream():
        received.extend(chunk)
        if len(received) > MAX_BODY:
            raise _too_large()
    if request.headers.get("content-encoding", "").lower() != "gzip":
        return bytes(received)
    inflater = zlib.decompressobj(16 + zlib.MAX_WBITS)
    try:
        body = inflater.decompress(bytes(received), MAX_INFLATED + 1)
    except zlib.error:
        raise _bad_request("The batch is not valid gzip") from None
    if len(body) > MAX_INFLATED or inflater.unconsumed_tail:
        raise _too_large()
    return body


def _has_consent(engine: Engine, student_id: UUID) -> bool:
    with engine.connect() as conn:
        return (
            conn.execute(
                text(
                    "SELECT 1 FROM consent WHERE student_id = :s AND type IN ('parent', 'self') "
                    "AND withdrawn_at IS NULL"
                ),
                {"s": student_id},
            ).first()
            is not None
        )


@router.post("/events:batch", response_model=BatchResult)
async def upload_event_batch(
    request: Request,
    student: Annotated[CurrentStudent, Depends(current_student)],
    idempotency_key: Annotated[str, Header(alias="Idempotency-Key")],
) -> BatchResult:
    try:
        UUID(idempotency_key)
    except ValueError:
        raise _bad_request("Idempotency-Key must be a UUID") from None
    engine = get_engine(request)
    if not await run_in_threadpool(_has_consent, engine, student.student_id):
        raise ProblemError(403, "consent_required", "Keep playing; nothing is sent until your family says OK")
    await run_in_threadpool(enforce, engine, BATCH_LIMIT, str(student.student_id))
    body = await _read_body(request)
    try:
        parsed = json.loads(body)
    except (ValueError, UnicodeDecodeError):
        raise _bad_request("The batch is not valid JSON") from None
    events = parsed.get("events") if isinstance(parsed, dict) else None
    if not isinstance(events, list) or not events:
        raise _bad_request("Send { events: [...] } with at least one event")
    if len(events) > MAX_EVENTS:
        raise _too_large()
    return await run_in_threadpool(ingest, engine, student, events)


# ------------------------------------------------------------------------------------------ ingest
class _Run:
    def __init__(self, exists: bool, owner: UUID | None, next_seq: int, last_ms: float) -> None:
        self.exists = exists
        self.owner = owner
        self.next_seq = next_seq
        self.last_ms = last_ms
        self.blocked: Literal["unknown_run", "sequence_gap"] | None = None


def ingest(engine: Engine, student: CurrentStudent, raw_events: list[object]) -> BatchResult:
    """Checks and stores one batch in one transaction. Never raises for a bad event."""
    result = BatchResult()
    now = datetime.now(UTC)
    quarantine: list[tuple[UUID, UUID | None, str, object]] = []
    valid: list[tuple[Event, object]] = []
    seen: set[UUID] = set()

    def reject(event_id: UUID, run_id: UUID | None, reason: str, raw: object) -> None:
        result.rejected.append(Rejected(id=event_id, reason=reason))  # type: ignore[arg-type]
        quarantine.append((event_id, run_id, reason, raw))

    # Pass 1: what can be checked without the database.
    for raw in raw_events:
        event_id = _readable_id(raw)
        if event_id is None:
            result.unreadable += 1
            continue
        if event_id in seen:
            result.duplicates.append(event_id)
            continue
        seen.add(event_id)
        try:
            event = Event.model_validate(raw)
        except ValidationError:
            reject(event_id, _readable_id(raw, "run_id"), "schema", raw)
            continue
        if event.data is not None and _free_text_problem(event.data):
            reject(event_id, event.run_id, "schema", raw)
            continue
        if len(json.dumps(raw, ensure_ascii=False).encode("utf-8")) > MAX_EVENT_BYTES:
            reject(event_id, event.run_id, "size", raw)
            continue
        made = uuid7_time(event.event_id)
        if made is None or not now - CLOCK_PAST <= made <= now + CLOCK_FUTURE:
            reject(event_id, event.run_id, "clock", raw)
            continue
        valid.append((event, raw))

    with engine.begin() as conn:
        stored = _already_stored(conn, [e.event_id for e, _ in valid])
        versions = _known_versions(conn, {e.content_version for e, _ in valid})
        items = _known_items(conn, {(e.item_id, e.content_version) for e, _ in valid if e.item_id})
        runs = _load_runs(conn, {e.run_id for e, _ in valid})
        to_insert: list[Event] = []

        for event, raw in sorted(valid, key=lambda pair: (str(pair[0].run_id), pair[0].seq)):
            if event.event_id in stored:
                result.duplicates.append(event.event_id)
                continue
            if event.content_version not in versions:
                reject(event.event_id, event.run_id, "unknown_version", raw)
                continue
            if event.item_id and (event.item_id, event.content_version) not in items:
                reject(event.event_id, event.run_id, "unknown_item", raw)
                continue
            run = runs[event.run_id]
            if run.exists and run.owner != student.student_id:
                reject(event.event_id, event.run_id, "sequence", raw)  # someone else's run id
                continue
            if run.blocked:  # an earlier event of this run must arrive first
                result.deferred.append(Deferred(id=event.event_id, reason=run.blocked))
                continue
            if not run.exists:
                if event.event_type != "run_start" or event.seq != 0:
                    run.blocked = "unknown_run"
                    result.deferred.append(Deferred(id=event.event_id, reason="unknown_run"))
                    continue
                if not _start_run(conn, student, event):
                    reject(event.event_id, event.run_id, "sequence", raw)  # the sitting is not theirs
                    continue
                run.exists, run.owner = True, student.student_id
            if event.seq > run.next_seq:
                run.blocked = "sequence_gap"
                result.deferred.append(Deferred(id=event.event_id, reason="sequence_gap"))
                continue
            if event.seq < run.next_seq:
                reject(event.event_id, event.run_id, "sequence", raw)
                continue
            run.next_seq += 1  # a rejected event still uses its number, so the run never gets stuck
            if event.monotonic_ms < run.last_ms:
                reject(event.event_id, event.run_id, "monotonic", raw)
                continue
            run.last_ms = event.monotonic_ms
            to_insert.append(event)

        inserted = _insert_events(conn, to_insert)
        for event in to_insert:
            (result.accepted if event.event_id in inserted else result.duplicates).append(event.event_id)
        _insert_quarantine(conn, student.student_id, quarantine)
    return result


def _readable_id(raw: object, key: str = "event_id") -> UUID | None:
    if not isinstance(raw, dict) or not isinstance(raw.get(key), str):
        return None
    try:
        return UUID(raw[key])
    except ValueError:
        return None


def _already_stored(conn: Connection, ids: list[UUID]) -> set[UUID]:
    if not ids:
        return set()
    rows = conn.execute(text("SELECT event_id FROM raw_event WHERE event_id = ANY(:ids)"), {"ids": ids})
    return set(rows.scalars())


def _known_versions(conn: Connection, versions: set[str]) -> set[str]:
    if not versions:
        return set()
    rows = conn.execute(text("SELECT id FROM content_pack WHERE id = ANY(:v)"), {"v": list(versions)})
    return set(rows.scalars())


def _known_items(conn: Connection, pairs: set[tuple[str | None, str]]) -> set[tuple[str, str]]:
    if not pairs:
        return set()
    rows = conn.execute(
        text(
            "SELECT id, content_version FROM item WHERE (id, content_version) IN "
            "(SELECT * FROM unnest(CAST(:ids AS text[]), CAST(:versions AS text[])))"
        ),
        {"ids": [i for i, _ in pairs], "versions": [v for _, v in pairs]},
    )
    return {(r.id, r.content_version) for r in rows}


def _load_runs(conn: Connection, run_ids: set[UUID]) -> dict[UUID, _Run]:
    """Each run's owner, next seq and last time; existing runs are locked until the batch is stored."""
    runs = {run_id: _Run(False, None, 0, 0.0) for run_id in run_ids}
    if not run_ids:
        return runs
    rows = conn.execute(
        text(
            """
            SELECT gr.id, s.student_id,
                   greatest(
                     (SELECT max(seq) FROM raw_event re WHERE re.run_id = gr.id),
                     (SELECT max((q.payload->>'seq')::int) FROM quarantine q
                      WHERE q.run_id = gr.id AND q.student_id = s.student_id
                        AND q.payload->>'seq' ~ '^[0-9]{1,7}$')
                   ) AS last_seq,
                   (SELECT max(monotonic_ms) FROM raw_event re WHERE re.run_id = gr.id) AS last_ms
            FROM game_run gr JOIN sitting s ON s.id = gr.sitting_id
            WHERE gr.id = ANY(:ids)
            ORDER BY gr.id
            FOR UPDATE OF gr
            """
        ),
        {"ids": list(run_ids)},
    )
    for r in rows:
        last_seq = -1 if r.last_seq is None else int(r.last_seq)
        runs[r.id] = _Run(True, r.student_id, last_seq + 1, float(r.last_ms or 0.0))
    return runs


def _start_run(conn: Connection, student: CurrentStudent, event: Event) -> bool:
    """Creates the sitting (once per app session) and the run from its run_start event."""
    started = uuid7_time(event.event_id)
    conn.execute(
        text(
            "INSERT INTO sitting (id, student_id, device_id, started_at) VALUES (:id, :s, :d, :at) "
            "ON CONFLICT (id) DO NOTHING"
        ),
        {"id": event.session_id, "s": student.student_id, "d": student.device_id, "at": started},
    )
    owner = conn.execute(
        text("SELECT student_id FROM sitting WHERE id = :id"), {"id": event.session_id}
    ).scalar_one()
    if owner != student.student_id:
        return False
    created = conn.execute(
        text(
            "INSERT INTO game_run (id, sitting_id, week, story_version, content_version, practice) "
            "VALUES (:id, :sit, :week, :story, :content, :practice) ON CONFLICT (id) DO NOTHING RETURNING id"
        ),
        {
            "id": event.run_id,
            "sit": event.session_id,
            "week": event.week or 0,
            "story": event.story_version or "unknown",
            "content": event.content_version,
            "practice": bool(event.practice),
        },
    ).first()
    return created is not None


def _insert_events(conn: Connection, events: list[Event]) -> set[UUID]:
    if not events:
        return set()
    rows = conn.execute(
        text(
            """
            INSERT INTO raw_event (event_id, run_id, seq, type, monotonic_ms, item_id, a11y_mode, data)
            SELECT * FROM unnest(CAST(:ids AS uuid[]), CAST(:runs AS uuid[]), CAST(:seqs AS int[]),
                                 CAST(:types AS text[]), CAST(:ms AS float8[]), CAST(:items AS text[]),
                                 CAST(:a11y AS bool[]), CAST(:data AS jsonb[]))
            ON CONFLICT (event_id) DO NOTHING
            RETURNING event_id
            """
        ),
        {
            "ids": [e.event_id for e in events],
            "runs": [e.run_id for e in events],
            "seqs": [e.seq for e in events],
            "types": [e.event_type for e in events],
            "ms": [e.monotonic_ms for e in events],
            "items": [e.item_id for e in events],
            "a11y": [e.a11y_mode for e in events],
            "data": [json.dumps(e.data or {}, ensure_ascii=False) for e in events],
        },
    )
    return set(rows.scalars())


def _insert_quarantine(
    conn: Connection, student_id: UUID, rows: list[tuple[UUID, UUID | None, str, object]]
) -> None:
    for event_id, run_id, reason, raw in rows:
        conn.execute(
            text(
                "INSERT INTO quarantine (event_id, student_id, run_id, reason, payload) "
                "VALUES (:e, :s, :r, :reason, CAST(:p AS jsonb)) ON CONFLICT (event_id) DO NOTHING"
            ),
            {"e": event_id, "s": student_id, "r": run_id, "reason": reason, "p": _quarantine_payload(raw)},
        )
