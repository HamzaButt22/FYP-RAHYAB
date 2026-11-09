"""Step 1 of the pipeline: raw telemetry rows -> clean, analysis-ready DataFrame."""
from __future__ import annotations

import json
from typing import Any

import pandas as pd

from analytics.constants import DECISION_TIME_CAP_MS
from analytics.event_schema import ALL_EVENT_TYPES

COLUMNS = ["event_id", "session_id", "level_id", "timestamp", "t_ms", "event_type", "action",
           "decision_time_ms", "risk_level", "metadata"]


def events_to_dataframe(rows: list[dict]) -> pd.DataFrame:
    df = pd.DataFrame(rows)
    for col in COLUMNS:
        if col not in df.columns:
            df[col] = None
    return df[COLUMNS].copy()


def _as_meta(value: Any) -> dict:
    if isinstance(value, dict):
        return value
    if isinstance(value, str) and value:
        try:
            parsed = json.loads(value)
            return parsed if isinstance(parsed, dict) else {}
        except json.JSONDecodeError:
            return {}
    return {}


def clean_events(rows_or_df) -> tuple[pd.DataFrame, dict]:
    """Validate and normalise raw events.

    * drops rows with missing/unknown event type or invalid timestamps
    * parses metadata JSON into a dict column called `meta`
    * caps absurd decision times (player went AFK) and nulls negative ones
    * removes exact duplicates (same ms, type, action and metadata)
    * sorts chronologically (stable)
    """
    df = rows_or_df.copy() if isinstance(rows_or_df, pd.DataFrame) else events_to_dataframe(rows_or_df)
    report = {"rows_in": int(len(df)), "dropped_missing_fields": 0, "dropped_unknown_type": 0,
              "dropped_duplicates": 0, "capped_decision_times": 0, "negative_decision_times": 0}
    if df.empty:
        df["meta"] = []
        report["rows_out"] = 0
        return df, report

    df["meta"] = df["metadata"].map(_as_meta)
    df["t_ms"] = pd.to_numeric(df["t_ms"], errors="coerce")
    before = len(df)
    df = df[df["event_type"].notna() & df["t_ms"].notna() & (df["t_ms"] >= 0)]
    report["dropped_missing_fields"] = before - len(df)

    before = len(df)
    df = df[df["event_type"].isin(ALL_EVENT_TYPES)]
    report["dropped_unknown_type"] = before - len(df)

    key = df["t_ms"].astype(int).astype(str) + "|" + df["event_type"] + "|" + df["action"].fillna("") + "|" + \
        df["meta"].map(lambda m: json.dumps(m, sort_keys=True, default=str))
    before = len(df)
    df = df[~key.duplicated(keep="first")]
    report["dropped_duplicates"] = before - len(df)

    df["decision_time_ms"] = pd.to_numeric(df["decision_time_ms"], errors="coerce")
    neg = df["decision_time_ms"] < 0
    report["negative_decision_times"] = int(neg.sum())
    df.loc[neg, "decision_time_ms"] = float("nan")
    capped = df["decision_time_ms"] > DECISION_TIME_CAP_MS
    report["capped_decision_times"] = int(capped.sum())
    df.loc[capped, "decision_time_ms"] = DECISION_TIME_CAP_MS
    df["risk_level"] = pd.to_numeric(df["risk_level"], errors="coerce")

    df["t_ms"] = df["t_ms"].astype(int)
    df = df.sort_values("t_ms", kind="stable").reset_index(drop=True)
    report["rows_out"] = int(len(df))
    return df, report
