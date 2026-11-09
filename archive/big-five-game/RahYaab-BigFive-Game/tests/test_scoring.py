import json

import pandas as pd
import pytest

from analytics.cleaning import clean_events
from analytics.feature_engineering import extract_features
from analytics.personality_scoring import (DEFAULT_CONFIG_PATH, TRAITS, MLPersonalityModel, PersonalityModel,
                                           WeightedScoringEngine, get_model)
from analytics.train_model import train


def test_weights_live_in_config_and_model_is_flagged_unvalidated():
    cfg = json.loads(DEFAULT_CONFIG_PATH.read_text())
    assert cfg["is_validated"] is False and "NOT" in cfg["disclaimer"]
    assert set(TRAITS) <= set(cfg["traits"])
    eng = WeightedScoringEngine()
    assert eng.is_validated is False and isinstance(eng, PersonalityModel)


def test_openness_formula_exact():
    cfg = {"model_name": "t", "model_version": "1", "is_validated": False, "feature_ranges": {},
           "traits": {t: {"terms": [{"feature": "f_" + t, "weight": 1.0}]} for t in TRAITS}}
    cfg["traits"]["openness"]["terms"] = [{"feature": "a", "weight": 0.75}, {"feature": "b", "weight": 0.25}]
    cfg["traits"]["neuroticism"]["terms"] = [{"feature": "x", "weight": 0.5}, {"feature": "y", "weight": -0.5}]
    pred = WeightedScoringEngine(config=cfg).predict({"a": 1.0, "b": 0.0, "x": 1.0, "y": 1.0})
    assert pred.scores["openness"] == pytest.approx(75.0)
    assert pred.scores["neuroticism"] == pytest.approx(50.0)           # 0.5*1 + 0.5*(1-1)
    assert pred.labels["openness"] == "High" and pred.labels["neuroticism"] == "Moderate"


def test_missing_features_reduce_coverage_not_score():
    eng = WeightedScoringEngine()
    pred = eng.predict({"helping_rate": 1.0})
    assert pred.scores["agreeableness"] == 100.0                         # re-normalised over available evidence
    assert pred.coverage["agreeableness"] == pytest.approx(0.30, abs=0.01)
    assert pred.insufficient["agreeableness"] is True                    # below min_coverage -> flagged
    assert pred.insufficient["openness"] is True and pred.scores["openness"] == 50.0


def test_scores_always_within_0_100(dummy):
    eng = WeightedScoringEngine()
    for events in dummy.values():
        df, _ = clean_events(events)
        pred = eng.predict(extract_features(df).features)
        assert all(0 <= v <= 100 for v in pred.scores.values())
    extreme = eng.predict({"exploration_rate": 9, "route_diversity": -4, "error_rate": 50})
    assert all(0 <= v <= 100 for v in extreme.scores.values())


def test_deterministic_and_behaviour_dependent(dummy):
    eng = WeightedScoringEngine()
    out = {}
    for label, events in dummy.items():
        df, _ = clean_events(events)
        f = extract_features(df).features
        assert eng.predict(f).scores == eng.predict(dict(f)).scores      # same telemetry -> same result, no randomness
        out[label] = eng.predict(f).scores
    assert out["explorer"] != out["anxious"] != out["reckless"]
    assert out["explorer"]["openness"] > out["anxious"]["openness"]
    assert out["anxious"]["neuroticism"] > out["explorer"]["neuroticism"]
    assert out["anxious"]["neuroticism"] > out["reckless"]["neuroticism"]


def test_ml_model_is_drop_in_replacement(tmp_path):
    import numpy as np
    rng = np.random.default_rng(0)
    n = 120
    cols = ["exploration_rate", "helping_rate", "risk_taking_rate", "average_decision_time"]
    X = pd.DataFrame(rng.random((n, len(cols))), columns=cols)
    df = X.copy()
    df["openness"] = 100 * X["exploration_rate"]
    df["agreeableness"] = 100 * X["helping_rate"]
    df["extraversion"] = 50.0 + 10 * rng.standard_normal(n)
    df["conscientiousness"] = 50.0 + 10 * rng.standard_normal(n)
    df["neuroticism"] = 100 * (1 - X["risk_taking_rate"])
    path = tmp_path / "m.joblib"
    metrics = train(df, questionnaire_validated=True, out_path=path)
    assert metrics["validated"] is True and metrics["openness"] > 0.9
    ml = MLPersonalityModel(path)
    pred = ml.predict({"exploration_rate": 0.9, "helping_rate": 0.1, "risk_taking_rate": 0.5})
    assert isinstance(ml, PersonalityModel) and pred.scores["openness"] > 70 and pred.scores["agreeableness"] < 30
    weak = train(df.head(30), questionnaire_validated=True, out_path=tmp_path / "w.joblib")
    assert weak["validated"] is False                                   # too few participants -> never flagged valid


def test_model_factory_switch(monkeypatch):
    monkeypatch.delenv("RAHYAAB_MODEL", raising=False)
    assert isinstance(get_model(), WeightedScoringEngine)
