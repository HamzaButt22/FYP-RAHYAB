"""Telemetry summary shown on the in-game analytics screen and in the dashboard."""
from __future__ import annotations

import pandas as pd

from analytics.event_schema import EventType as E
from analytics.feature_engineering import FeatureSet, level_attempt_spans


def telemetry_summary(df: pd.DataFrame, fs: FeatureSet) -> dict:
    f, n = fs.features, fs.counts
    if df.empty:
        return {k: 0 for k in ("total_play_time_s", "levels_completed", "decisions_made", "errors", "strategy_changes",
                               "total_events", "failures", "session_length_s")} | {
            "average_decision_time_s": None, "exploration_rate": None, "risk_taking_rate": None,
            "helping_rate": None, "retry_rate": None}
    spans = level_attempt_spans(df)
    play_ms = sum(s["end_ms"] - s["start_ms"] for s in spans)
    levels_completed = int(df[df["event_type"] == E.LEVEL_COMPLETE]["level_id"].nunique())
    return {
        "total_play_time_s": round(play_ms / 1000.0, 1),
        "session_length_s": round(float(df["t_ms"].max()) / 1000.0, 1),
        "levels_completed": levels_completed,
        "decisions_made": int(n.get("decisions_made", 0)),
        "average_decision_time_s": round(f["average_decision_time"], 2) if "average_decision_time" in f else None,
        "exploration_rate": round(f["exploration_rate"], 3) if "exploration_rate" in f else None,
        "risk_taking_rate": round(f["risk_taking_rate"], 3) if "risk_taking_rate" in f else None,
        "helping_rate": round(f["helping_rate"], 3) if "helping_rate" in f else None,
        "retry_rate": round(f["retry_rate"], 3) if "retry_rate" in f else None,
        "strategy_changes": int(n.get("strategy_changes", 0)),
        "errors": int(n.get("errors", 0)),
        "failures": int((df["event_type"] == E.FAILURE).sum()) + int((df["event_type"] == E.LEVEL_FAILED).sum()),
        "total_events": int(len(df)),
    }


def per_level_summary(df: pd.DataFrame) -> list[dict]:
    out = []
    for s in level_attempt_spans(df):
        out.append({**s, "duration_s": round((s["end_ms"] - s["start_ms"]) / 1000.0, 1)})
    return out
