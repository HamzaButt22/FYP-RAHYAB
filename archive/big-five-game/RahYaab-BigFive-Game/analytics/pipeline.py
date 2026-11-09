"""Raw telemetry -> cleaning -> feature extraction -> OCEAN analysis -> stored results.

`process_session()` is what the game calls automatically when an assessment ends
(and what the API's /complete endpoint calls). No manual scripts are required.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Optional

import pandas as pd

from analytics.cleaning import clean_events
from analytics.feature_engineering import FeatureSet, extract_features
from analytics.personality_scoring import PersonalityModel, PersonalityPrediction, get_model
from analytics.report import build_evidence
from analytics.summary import per_level_summary, telemetry_summary


@dataclass
class PipelineOutput:
    events: pd.DataFrame
    cleaning_report: dict
    feature_set: FeatureSet
    prediction: PersonalityPrediction
    evidence: dict
    summary: dict
    levels: list

    def result_dict(self) -> dict:
        d = self.prediction.to_dict()
        d["evidence"] = self.evidence
        return d


def analyse_events(rows, model: Optional[PersonalityModel] = None) -> PipelineOutput:
    """Pure function over event rows (list of dicts or DataFrame); no database access."""
    df, report = clean_events(rows)
    fs = extract_features(df)
    model = model or get_model()
    prediction = model.predict(fs.features)
    evidence = build_evidence(prediction, fs)
    return PipelineOutput(df, report, fs, prediction, evidence, telemetry_summary(df, fs), per_level_summary(df))


def process_session(repo, session_id: str, model: Optional[PersonalityModel] = None, save: bool = True) -> PipelineOutput:
    session = repo.get_session(session_id)
    if session is None:
        raise KeyError(f"unknown session {session_id!r}")
    rows = repo.get_events(session_id)
    if not rows:
        raise ValueError(f"session {session_id!r} has no telemetry events")
    out = analyse_events(rows, model)
    if save:
        repo.replace_features(session_id, session["player_id"], out.feature_set.as_db_rows())
        repo.save_result(session_id, session["player_id"], out.result_dict())
    return out
