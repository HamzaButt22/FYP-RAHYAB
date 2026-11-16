import json

import pytest

from analytics.event_schema import EventType as E
from game.telemetry import GameClock, TelemetryLogger


def make(repo, tmp_path=None, flush=1000):
    pid = repo.create_player("T")
    sid = repo.create_session(pid)
    clock = GameClock()
    lg = TelemetryLogger(repo, sid, pid, clock, jsonl_dir=tmp_path, flush_size=flush)
    return lg, clock, sid


def test_events_are_persisted_not_just_printed(repo):
    lg, clock, sid = make(repo)
    lg.set_level(1)
    clock.tick(1.5)
    lg.log(E.EXPLORATION, action="enter_optional_area", zone_id="cave")
    assert repo.count_events(sid) == 0           # buffered
    lg.close()
    ev = repo.get_events(sid)
    assert len(ev) == 1 and ev[0]["level_id"] == 1 and ev[0]["t_ms"] == 1500 and ev[0]["metadata"]["zone_id"] == "cave"
    assert ev[0]["timestamp"].startswith("20")


def test_unknown_event_type_rejected(repo):
    lg, _, _ = make(repo)
    with pytest.raises(ValueError):
        lg.log("NOT_AN_EVENT")


def test_auto_flush_when_buffer_full(repo):
    lg, _, sid = make(repo, flush=5)
    for _ in range(5):
        lg.log(E.PLAYER_INTERACTION, action="x")
    assert repo.count_events(sid) == 5


def test_decision_latency_and_selection_changes(repo):
    lg, clock, sid = make(repo)
    opts = [{"key": "a", "kind": "safe", "risk_level": 0.1}, {"key": "b", "kind": "risky", "risk_level": 0.8}]
    lg.begin_decision("d1", "risk", opts, gate_id="g1")
    clock.tick(2.31)
    lg.note_selection_change("d1")
    lg.note_selection_change("d1")
    dt = lg.end_decision("d1", "b")
    lg.close()
    assert dt == pytest.approx(2310, abs=1)
    resp = repo.get_events(sid, ["DECISION_RESPONSE"])[0]
    assert resp["decision_time_ms"] == pytest.approx(2310, abs=1) and resp["risk_level"] == 0.8
    assert resp["metadata"]["chosen_kind"] == "risky" and resp["metadata"]["selection_changes"] == 2 and resp["metadata"]["gate_id"] == "g1"
    assert len(repo.get_events(sid, ["DECISION"])) == 1


def test_orphan_response_does_not_crash(repo):
    lg, _, sid = make(repo)
    assert lg.end_decision("never_started", "x") == 0.0


def test_movement_is_summarised_with_cells_and_reversals(repo):
    lg, clock, sid = make(repo)
    lg.set_level(1)
    x = 50.0
    for i in range(40):                           # walk right then back left: 1 reversal
        step_dir = (1, 0) if i < 20 else (-1, 0)
        x += 10 * step_dir[0]
        clock.tick(1 / 30)
        lg.track_movement(x, 300, 1 / 30, step_dir)
    lg.close()
    moves = repo.get_events(sid, ["PLAYER_MOVE"])
    assert moves and sum(m["metadata"]["reversals"] for m in moves) == 1
    cells = {tuple(c) for m in moves for c in m["metadata"]["cells"]}
    assert len(cells) >= 3


def test_jsonl_backup_written(repo, tmp_path):
    lg, _, sid = make(repo, tmp_path)
    lg.log(E.SESSION_START, level_id=None)
    lg.close()
    lines = (tmp_path / f"{sid}.jsonl").read_text().strip().splitlines()
    assert json.loads(lines[0])["event_type"] == "SESSION_START"
