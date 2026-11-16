import sqlite3

import pytest

from backend.database.db import connect


def test_tables_created_automatically(repo):
    with connect(repo.db_path) as c:
        names = {r["name"] for r in c.execute("SELECT name FROM sqlite_master WHERE type='table'")}
    assert {"players", "sessions", "levels", "game_events", "behavioral_features", "personality_results"} <= names


def test_levels_reference_data_seeded(repo):
    assert [l["level_id"] for l in repo.list_levels()] == [1, 2, 3, 4]


def test_player_session_event_roundtrip(repo):
    pid = repo.create_player("Ayesha")
    sid = repo.create_session(pid, seed=5)
    n = repo.insert_events(sid, pid, [
        {"timestamp": "2026-10-06T15:32:21", "t_ms": 10, "event_type": "DECISION_RESPONSE", "level_id": 2,
         "action": "explore", "decision_time_ms": 2310, "risk_level": 0.7, "metadata": {"a": [1, 2], "b": "x"}}])
    assert n == 1
    ev = repo.get_events(sid)[0]
    assert ev["metadata"] == {"a": [1, 2], "b": "x"} and ev["decision_time_ms"] == 2310 and ev["risk_level"] == 0.7
    assert repo.get_session(sid)["player_name"] == "Ayesha"


def test_foreign_keys_enforced(repo):
    with pytest.raises(sqlite3.IntegrityError):
        repo.insert_events("NOPE", 1, [{"timestamp": "x", "t_ms": 0, "event_type": "SESSION_START"}])


def test_cascade_delete(repo):
    pid = repo.create_player("X")
    sid = repo.create_session(pid)
    repo.insert_events(sid, pid, [{"timestamp": "t", "t_ms": 0, "event_type": "SESSION_START"}])
    repo.delete_session(sid)
    assert repo.count_events(sid) == 0


def test_invalid_session_status_rejected(repo):
    pid = repo.create_player("X")
    sid = repo.create_session(pid)
    with pytest.raises(ValueError):
        repo.end_session(sid, "weird")


def test_features_and_results_persist(repo):
    pid = repo.create_player("X")
    sid = repo.create_session(pid)
    repo.replace_features(sid, pid, {"exploration_rate": ("exploration", 0.5)})
    repo.replace_features(sid, pid, {"exploration_rate": ("exploration", 0.7), "helping_rate": ("social", 1.0)})
    assert {f["feature_name"]: f["feature_value"] for f in repo.get_features(sid)} == {"exploration_rate": 0.7, "helping_rate": 1.0}
    res = {"scores": dict(openness=10, conscientiousness=20, extraversion=30, agreeableness=40, neuroticism=50),
           "labels": {"openness": "Low"}, "model_name": "m", "model_version": "1", "is_validated": False}
    repo.save_result(sid, pid, res)
    got = repo.get_result(sid)
    assert got["scores"]["neuroticism"] == 50 and got["is_validated"] is False
