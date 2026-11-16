import json
from pathlib import Path

from feature_engineering import compute_session_features, load_jsonl

ROOT = Path(__file__).resolve().parents[1]
SESSION_LOG = ROOT / "example_session_log.jsonl"


def test_load_jsonl_reads_example_log():
    records = load_jsonl(SESSION_LOG)
    assert records
    assert records[0]["event"] == "session_start"


def test_compute_session_features_has_expected_keys():
    records = load_jsonl(SESSION_LOG)
    features = compute_session_features(records)
    assert "total_events" in features
    assert "R_score_mean" in features
    assert "I_score_mean" in features
    assert "A_score_mean" in features
    assert "S_score_mean" in features
    assert "E_score_mean" in features
    assert "C_score_mean" in features
    assert features["total_events"] > 0


def test_feature_values_are_numeric():
    records = load_jsonl(SESSION_LOG)
    features = compute_session_features(records)
    for value in features.values():
        assert isinstance(value, (int, float))
