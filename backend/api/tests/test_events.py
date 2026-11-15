"""POST /v1/events:batch (RFC-0002): consent gate, limits, per-event checks, run order, idempotency.

T-INT-02 (batch validation) and T-INT-03 (re-sending a batch creates no new rows). Database tests (skipped
without a test database).
"""

import gzip
import json
import secrets
import time
import uuid
from collections.abc import Iterator
from typing import Any

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import Engine, text
from support import World, sha

from rahyaab_api.ratelimit import hit

URL = "/v1/events:batch"
JOIN_URL = "/v1/auth/student/join"


def uuid7(ms: int | None = None) -> str:
    ms = int(time.time() * 1000) if ms is None else ms
    value = (ms << 80) | (0x7 << 76) | (secrets.randbits(12) << 64) | (0b10 << 62) | secrets.randbits(62)
    return str(uuid.UUID(int=value))


@pytest.fixture
def pack(admin: Engine) -> Iterator[str]:
    """A content pack with one item, as the dev seed has (dev-2026.11.0)."""
    pack_id = f"test-{secrets.token_hex(4)}"
    with admin.begin() as conn:
        conn.execute(
            text(
                "INSERT INTO content_pack (id, class_mode, min_app, sha256, signature, manifest, size_bytes, "
                "storage_uri) VALUES (:id, 'matric', '0.1.0', 'x', 'x', '{}', 1, 'test://none')"
            ),
            {"id": pack_id},
        )
        conn.execute(
            text(
                "INSERT INTO item (id, kind, construct, pair, content_version) VALUES "
                "('w1_pick', 'choice', 'interests', 'R-S', :p)"
            ),
            {"p": pack_id},
        )
    yield pack_id
    with admin.begin() as conn:
        conn.execute(text("DELETE FROM game_run WHERE content_version = :p"), {"p": pack_id})
        conn.execute(text("DELETE FROM item WHERE content_version = :p"), {"p": pack_id})
        conn.execute(text("DELETE FROM content_pack WHERE id = :p"), {"p": pack_id})


class Player:
    """A joined student and their phone, building envelope v3 events like the app's run.ts."""

    def __init__(self, api: TestClient, world: World, pack: str, consented: bool = True) -> None:
        self.api, self.pack = api, pack
        class_id, code = world.add_class()
        overrides: dict[str, Any] = {"claim_code": world.add_slip(class_id)} if consented else {}
        joined = api.post(JOIN_URL, json=world.body(code, **overrides)).json()
        self.student_id = uuid.UUID(joined["student_id"])
        self.headers = {"Authorization": f"Bearer {joined['access_token']}"}
        self.session = uuid7()
        self.run = uuid7()
        self.ms = 0.0

    def event(self, seq: int, event_type: str = "choice_made", **overrides: Any) -> dict[str, Any]:
        self.ms += 10
        e: dict[str, Any] = {
            "event_id": uuid7(),
            "schema_version": "3.0.0",
            "session_id": self.session,
            "run_id": self.run,
            "seq": seq,
            "week": 1,
            "story_version": "sample-pick-one@1.0.0",
            "content_version": self.pack,
            "event_type": event_type,
            "monotonic_ms": self.ms,
            "wall_clock_utc_min": "2026-11-15T10:04Z",
            "input_type": "touch",
            "a11y_mode": False,
            "practice": False,
        }
        if event_type == "choice_made":
            e["item_id"], e["data"] = "w1_pick", {"pair": "R-S", "picked": "R", "side": "left"}
        e.update(overrides)
        return e

    def start(self) -> dict[str, Any]:
        return self.event(0, "run_start", data={"module": "sample-pick-one", "contract": "1.0.0"})

    def send(self, events: list[Any], gzipped: bool = False, key: str | None = None) -> Any:
        headers = {
            **self.headers,
            "Idempotency-Key": key or str(uuid.uuid4()),
            "Content-Type": "application/json",
        }
        body = json.dumps({"events": events}).encode()
        if gzipped:
            body, headers["Content-Encoding"] = gzip.compress(body), "gzip"
        return self.api.post(URL, content=body, headers=headers)


def ids(events: list[dict[str, Any]]) -> list[str]:
    return [e["event_id"] for e in events]


def stored(world: World, run_id: str) -> int:
    return int(world.scalar("SELECT count(*) FROM raw_event WHERE run_id = :r", r=run_id))


def test_without_consent_nothing_is_stored(api: TestClient, world: World, pack: str) -> None:
    p = Player(api, world, pack, consented=False)
    r = p.send([p.start()])
    assert r.status_code == 403 and r.json()["code"] == "consent_required"
    assert world.scalar("SELECT count(*) FROM game_run WHERE id = :r", r=p.run) == 0


def test_a_run_is_stored_once_and_resending_changes_nothing(api: TestClient, world: World, pack: str) -> None:
    p = Player(api, world, pack)
    batch = [p.start(), p.event(1, "scene_start", item_id="w1_pick"), p.event(2)]
    r = p.send(batch, gzipped=True)
    assert r.status_code == 200
    assert r.json() == {
        "accepted": ids(batch),
        "duplicates": [],
        "deferred": [],
        "rejected": [],
        "unreadable": 0,
    }
    run = world.scalar(
        "SELECT json_build_object('story', gr.story_version, 'week', gr.week, 'student', s.student_id) "
        "FROM game_run gr JOIN sitting s ON s.id = gr.sitting_id WHERE gr.id = :r",
        r=p.run,
    )
    assert run == {"story": "sample-pick-one@1.0.0", "week": 1, "student": str(p.student_id)}
    again = p.send(batch).json()  # T-INT-03: the same batch again creates nothing
    assert sorted(again["duplicates"]) == sorted(ids(batch)) and again["accepted"] == []
    assert stored(world, p.run) == 3


def test_events_wait_for_their_run_and_for_gaps(api: TestClient, world: World, pack: str) -> None:
    p = Player(api, world, pack)
    start, first, second, third = p.start(), p.event(1), p.event(2), p.event(3)
    r = p.send([first]).json()
    assert r["deferred"] == [{"id": first["event_id"], "reason": "unknown_run"}]
    r = p.send([start, second, third]).json()  # 1 is missing: 2 and 3 wait
    assert r["accepted"] == [start["event_id"]]
    assert [d["reason"] for d in r["deferred"]] == ["sequence_gap", "sequence_gap"]
    r = p.send([first, second, third]).json()
    assert r["accepted"] == ids([first, second, third])
    assert stored(world, p.run) == 4


def test_old_numbers_and_time_going_back_are_rejected(api: TestClient, world: World, pack: str) -> None:
    p = Player(api, world, pack)
    p.send([p.start(), p.event(1)])
    replay = p.event(1)  # a new event id with a number already used
    backwards = p.event(2, monotonic_ms=1.0)
    after = p.event(3)
    r = p.send([replay, backwards, after]).json()
    assert {x["reason"] for x in r["rejected"]} == {"sequence", "monotonic"}
    assert r["accepted"] == [after["event_id"]]  # a rejected event uses its number, so the run goes on
    reasons = world.scalar(
        "SELECT array_agg(reason ORDER BY reason) FROM quarantine WHERE student_id = :s", s=p.student_id
    )
    assert reasons == ["monotonic", "sequence"]


def test_bad_events_are_rejected_one_by_one(api: TestClient, world: World, pack: str) -> None:
    p = Player(api, world, pack)
    good = p.start()
    old = int((time.time() - 90 * 86400) * 1000)
    bad = {
        "schema": p.event(1, event_type="mood_swipe"),
        "free_text": p.event(1, data={"note": "x" * 65}),
        "size": p.event(1, data={f"k{i}": "v" * 60 for i in range(20)}),
        "clock_v4": p.event(1, event_id=str(uuid.uuid4())),
        "clock_old": p.event(1, event_id=uuid7(old)),
        "version": p.event(1, content_version="no-such-pack"),
        "item": p.event(1, item_id="not_in_the_pack"),
    }
    r = p.send([good, *bad.values(), {"no": "id"}, "not an object"]).json()
    assert r["accepted"] == [good["event_id"]] and r["unreadable"] == 2
    by_id = {x["id"]: x["reason"] for x in r["rejected"]}
    assert [by_id[e["event_id"]] for e in bad.values()] == [
        "schema",
        "schema",
        "size",
        "clock",
        "clock",
        "unknown_version",
        "unknown_item",
    ]
    assert world.scalar("SELECT count(*) FROM quarantine WHERE student_id = :s", s=p.student_id) == 7


def test_someone_elses_run_is_refused(api: TestClient, world: World, pack: str) -> None:
    owner, other = Player(api, world, pack), Player(api, world, pack)
    owner.send([owner.start()])
    other.run, other.session = owner.run, owner.session
    r = other.send([other.event(1)]).json()
    assert r["rejected"][0]["reason"] == "sequence"
    assert stored(world, owner.run) == 1


def test_limits_on_the_batch(api: TestClient, world: World, pack: str) -> None:
    p = Player(api, world, pack)
    assert p.send([p.event(i) for i in range(501)]).status_code == 413
    bomb = gzip.compress(b'{"events": [' + b" " * (5 * 1024 * 1024) + b"]}")
    headers = {**p.headers, "Idempotency-Key": str(uuid.uuid4()), "Content-Encoding": "gzip"}
    assert api.post(URL, content=bomb, headers=headers).status_code == 413
    assert api.post(URL, content=b"{not json", headers={**headers, "Content-Encoding": ""}).status_code == 400
    assert p.send([], key=str(uuid.uuid4())).status_code == 400
    assert p.send([p.start()], key="not-a-uuid").status_code == 400
    no_key = api.post(URL, json={"events": [p.start()]}, headers=p.headers)
    assert no_key.status_code == 422
    assert api.post(URL, json={"events": [p.start()]}).status_code == 401


def test_batches_are_rate_limited_per_student(
    api: TestClient, world: World, pack: str, admin: Engine
) -> None:
    p = Player(api, world, pack)
    key = f"events:student:{sha(str(p.student_id))}"
    for _ in range(60):
        hit(admin, key, 3600)
    r = p.send([p.start()])
    assert r.status_code == 429 and int(r.headers["Retry-After"]) > 0
    with admin.begin() as conn:
        conn.execute(text("DELETE FROM rate_limit WHERE key = :k"), {"k": key})
