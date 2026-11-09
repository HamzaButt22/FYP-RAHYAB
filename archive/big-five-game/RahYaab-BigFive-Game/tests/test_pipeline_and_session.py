import pytest

from analytics.pipeline import analyse_events, process_session
from backend.services import assessment_service as svc


def test_pipeline_end_to_end_from_dummy_dataset(loaded_session):
    repo, pid, sid = loaded_session
    out = process_session(repo, sid)
    assert out.cleaning_report["rows_out"] > 100
    assert len(repo.get_features(sid)) >= 20
    res = repo.get_result(sid)
    assert res["is_validated"] is False and res["model_name"] == "WeightedScoringEngine"
    assert set(res["scores"]) == {"openness", "conscientiousness", "extraversion", "agreeableness", "neuroticism"}
    assert res["evidence"]["openness"]["indicators"]


def test_evidence_uses_careful_wording(dummy):
    out = analyse_events(dummy["explorer"])
    for ev in out.evidence.values():
        assert "definitely" not in ev["headline"].lower() and "you are" not in ev["headline"].lower()
        assert "patterns associated with" in ev["headline"] or "Not enough" in ev["headline"]


def test_complete_session_marks_status_and_stores_results(loaded_session):
    repo, pid, sid = loaded_session
    out = svc.complete_session(repo, sid)
    s = repo.get_session(sid)
    assert s["status"] == "completed" and s["duration_ms"] > 0 and s["ended_at"]
    assert repo.get_result(sid)["scores"] == out.prediction.scores


def test_complete_unknown_or_empty_session(repo):
    with pytest.raises(KeyError):
        svc.complete_session(repo, "nope")
    pid = repo.create_player("E")
    sid = repo.create_session(pid)
    with pytest.raises(ValueError):
        svc.complete_session(repo, sid)


def test_reprocessing_replaces_rows_instead_of_duplicating(loaded_session):
    repo, pid, sid = loaded_session
    process_session(repo, sid)
    n = len(repo.get_features(sid))
    process_session(repo, sid)
    assert len(repo.get_features(sid)) == n


def test_event_validation():
    with pytest.raises(svc.ValidationError):
        svc.validate_event({"event_type": "NOPE", "timestamp": "t", "t_ms": 1})
    with pytest.raises(svc.ValidationError):
        svc.validate_event({"event_type": "SESSION_START", "timestamp": "t"})
    assert svc.validate_event({"event_type": "SESSION_START", "timestamp": "t", "t_ms": "5"})["t_ms"] == 5
