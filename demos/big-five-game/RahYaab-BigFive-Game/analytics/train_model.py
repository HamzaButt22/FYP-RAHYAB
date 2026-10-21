"""Calibrate / train the ML replacement for the weighted model.

Input CSV (one row per participant) with:
  * feature columns named like the behavioural features, e.g. exploration_rate, helping_rate ...
  * five target columns 0-100 from a VALIDATED questionnaire (BFI-2, IPIP-NEO ...):
      openness, conscientiousness, extraversion, agreeableness, neuroticism

Usage:
  python -m analytics.train_model --csv data/training.csv
  python -m analytics.train_model --csv data/training.csv --questionnaire-validated

The script prints cross-validated R^2 per trait. A model is only marked `validated` if the
researcher asserts the questionnaire data are valid, there are >= 100 participants and the
mean cross-validated R^2 is >= 0.10 (a deliberately modest bar for behavioural-proxy models).
"""
from __future__ import annotations

import argparse
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.linear_model import Ridge
from sklearn.model_selection import KFold, cross_val_predict
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

from analytics.feature_engineering import FEATURE_GROUPS
from analytics.personality_scoring import MODEL_DIR, TRAITS

MIN_PARTICIPANTS_FOR_VALIDATION = 100
MIN_MEAN_CV_R2 = 0.10


def train(df: pd.DataFrame, questionnaire_validated: bool = False, out_path: Path | None = None,
          alpha: float = 5.0, folds: int = 5) -> dict:
    feature_names = [c for c in FEATURE_GROUPS if c in df.columns]
    if not feature_names:
        raise ValueError("training CSV contains none of the known behavioural feature columns")
    missing_targets = [t for t in TRAITS if t not in df.columns]
    if missing_targets:
        raise ValueError(f"training CSV is missing target columns: {missing_targets}")
    X = df[feature_names].astype(float)
    means = X.mean()
    X = X.fillna(means)
    y = df[list(TRAITS)].astype(float)
    pipe = Pipeline([("scale", StandardScaler()), ("ridge", Ridge(alpha=alpha))])
    n_splits = max(2, min(folds, len(df)))
    cv = cross_val_predict(pipe, X.values, y.values, cv=KFold(n_splits, shuffle=True, random_state=0))
    ss_res = ((y.values - cv) ** 2).sum(axis=0)
    ss_tot = ((y.values - y.values.mean(axis=0)) ** 2).sum(axis=0)
    r2 = 1.0 - ss_res / np.where(ss_tot == 0, 1.0, ss_tot)
    metrics = {t: float(v) for t, v in zip(TRAITS, r2)}
    metrics["mean_cv_r2"] = float(r2.mean())
    metrics["n_participants"] = int(len(df))
    pipe.fit(X.values, y.values)
    validated = bool(questionnaire_validated and len(df) >= MIN_PARTICIPANTS_FOR_VALIDATION
                     and metrics["mean_cv_r2"] >= MIN_MEAN_CV_R2)
    out_path = Path(out_path or MODEL_DIR / "ml_model.joblib")
    out_path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump({
        "pipeline": pipe, "feature_names": feature_names, "train_means": means.to_dict(),
        "metrics": metrics, "validated": validated, "version": f"ml-ridge-n{len(df)}",
        "disclaimer": ("Ridge regression trained on telemetry features and questionnaire scores. "
                       + ("Passed the project's minimum validation bar." if validated else
                          "NOT validated: too few participants, weak fit, or questionnaire not asserted valid.")),
    }, out_path)
    metrics["validated"] = validated
    metrics["path"] = str(out_path)
    return metrics


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--csv", required=True)
    ap.add_argument("--out", default=None)
    ap.add_argument("--questionnaire-validated", action="store_true",
                    help="assert the questionnaire scores come from a validated instrument")
    args = ap.parse_args()
    metrics = train(pd.read_csv(args.csv), args.questionnaire_validated, args.out)
    for k, v in metrics.items():
        print(f"{k:>20}: {v}")


if __name__ == "__main__":
    main()
