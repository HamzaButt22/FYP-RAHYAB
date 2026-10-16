"""Application service used by the Flask API and the game: session lifecycle + analytics trigger."""
from __future__ import annotations

from analytics.pipeline import PipelineOutput, process_session
from analytics.event_schema import ALL_EVENT_TYPES


class ValidationError(ValueError):
    pass


def validate_event(e: dict) -> dict:
    """Validate one inbound event (API ingestion). Returns a normalised copy."""
    for key in ("event_type", "timestamp", "t_ms"):
        if key not in e or e[key] in (None, ""):
            raise ValidationError(f"event is missing required field {key!r}")
    if e["event_type"] not in ALL_EVENT_TYPES:
        raise ValidationError(f"unknown event_type {e['event_type']!r}")
    try:
        t_ms = int(e["t_ms"])
    except (TypeError, ValueError):
        raise ValidationError("t_ms must be an integer")
    if t_ms < 0:
        raise ValidationError("t_ms must be >= 0")
    meta = e.get("metadata") or {}
    if not isinstance(meta, dict):
        raise ValidationError("metadata must be an object")
    level = e.get("level_id")
    if level is not None and level not in (1, 2, 3, 4):
        raise ValidationError("level_id must be 1-4 or null")
    return {**e, "t_ms": t_ms, "metadata": meta}


def ingest_events(repo, session_id: str, events: list[dict]) -> int:
    session = repo.get_session(session_id)
    if session is None:
        raise KeyError(f"unknown session {session_id!r}")
    clean = [validate_event(e) for e in events]
    return repo.insert_events(session_id, session["player_id"], clean)


def complete_session(repo, session_id: str, duration_ms: int | None = None) -> PipelineOutput:
    """Mark the session completed and run Raw Telemetry -> Features -> OCEAN -> stored results."""
    session = repo.get_session(session_id)
    if session is None:
        raise KeyError(f"unknown session {session_id!r}")
    if duration_ms is None:
        events = repo.get_events(session_id)
        duration_ms = max((e["t_ms"] for e in events), default=0)
    repo.end_session(session_id, "completed", duration_ms=duration_ms)
    return process_session(repo, session_id)
