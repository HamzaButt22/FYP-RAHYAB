"""Step 3: behavioural feature vector -> Big Five (OCEAN) estimate.

Two interchangeable models share the `PersonalityModel` interface:

* `WeightedScoringEngine`  - transparent weighted model, weights live in scoring_config.json.
                              PROTOTYPE: not psychometrically validated.
* `MLPersonalityModel`     - scikit-learn model trained on (telemetry features, validated
                              questionnaire scores). Drop-in replacement; the game and the
                              dashboard only ever call `get_model().predict(features)`.
"""
from __future__ import annotations

import json
import os
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional

from analytics.normalization import classify, min_max, to_score

TRAITS = ("openness", "conscientiousness", "extraversion", "agreeableness", "neuroticism")
TRAIT_LABELS = {"openness": "Openness", "conscientiousness": "Conscientiousness",
                "extraversion": "Extraversion", "agreeableness": "Agreeableness", "neuroticism": "Neuroticism"}
DEFAULT_CONFIG_PATH = Path(__file__).with_name("scoring_config.json")
MODEL_DIR = Path(__file__).resolve().parents[1] / "data" / "models"


@dataclass
class Contribution:
    feature: str
    raw_value: float
    unit_value: float         # normalised 0..1 (after inversion for negative weights)
    weight: float
    points: float             # contribution to the 0..100 trait score


@dataclass
class PersonalityPrediction:
    scores: dict[str, float]
    labels: dict[str, str]
    coverage: dict[str, float]
    contributions: dict[str, list[Contribution]]
    model_name: str
    model_version: str
    is_validated: bool
    disclaimer: str
    confidence: dict[str, str] = field(default_factory=dict)
    insufficient: dict[str, bool] = field(default_factory=dict)

    def to_dict(self) -> dict:
        return {
            "scores": self.scores, "labels": self.labels, "coverage": self.coverage,
            "model_name": self.model_name, "model_version": self.model_version,
            "is_validated": self.is_validated, "disclaimer": self.disclaimer,
            "confidence": self.confidence, "insufficient": self.insufficient,
        }


class PersonalityModel(ABC):
    name: str
    version: str
    is_validated: bool

    @abstractmethod
    def predict(self, features: dict[str, float]) -> PersonalityPrediction:
        """Map a behavioural feature dict to a Big Five estimate."""


# ============================================================================ weighted model
class WeightedScoringEngine(PersonalityModel):
    def __init__(self, config_path: Optional[str | os.PathLike] = None, config: Optional[dict] = None):
        if config is None:
            config = json.loads(Path(config_path or DEFAULT_CONFIG_PATH).read_text(encoding="utf-8"))
        self.config = config
        self.name = config["model_name"]
        self.version = config["model_version"]
        self.is_validated = bool(config.get("is_validated", False))
        self.disclaimer = config.get("disclaimer", "")
        self.ranges = {k: v for k, v in config.get("feature_ranges", {}).items() if not k.startswith("_")}
        self.min_coverage = float(config.get("min_coverage", 0.4))
        cls = config.get("classification", {})
        self.low_max, self.high_min = cls.get("low_max", 39), cls.get("high_min", 70)
        self._validate()

    def _validate(self) -> None:
        for trait in TRAITS:
            if trait not in self.config["traits"]:
                raise ValueError(f"scoring config is missing trait {trait!r}")
            for term in self.config["traits"][trait]["terms"]:
                if abs(term["weight"]) <= 0:
                    raise ValueError(f"zero weight for {term['feature']} in {trait}")

    def _unit(self, feature: str, value: float) -> float:
        lo_hi = self.ranges.get(feature)
        if lo_hi:
            return min_max(value, lo_hi[0], lo_hi[1])
        return min(1.0, max(0.0, float(value)))      # rates already live in 0..1

    def predict(self, features: dict[str, float]) -> PersonalityPrediction:
        scores, labels, coverage, contribs, conf, insufficient = {}, {}, {}, {}, {}, {}
        for trait in TRAITS:
            terms = self.config["traits"][trait]["terms"]
            total_w = sum(abs(t["weight"]) for t in terms)
            avail = [t for t in terms if t["feature"] in features]
            avail_w = sum(abs(t["weight"]) for t in avail)
            coverage[trait] = round(avail_w / total_w, 3) if total_w else 0.0
            conf[trait] = self.config["traits"][trait].get("confidence", "low")
            items: list[Contribution] = []
            if avail_w == 0:
                scores[trait] = 50.0                      # no evidence -> neutral midpoint, flagged below
                insufficient[trait] = True
            else:
                acc = 0.0
                for t in avail:
                    u = self._unit(t["feature"], features[t["feature"]])
                    adj = u if t["weight"] > 0 else 1.0 - u
                    pts = 100.0 * abs(t["weight"]) * adj / avail_w
                    acc += pts
                    items.append(Contribution(t["feature"], float(features[t["feature"]]), round(adj, 3),
                                              t["weight"], round(pts, 2)))
                scores[trait] = to_score(acc / 100.0)
                insufficient[trait] = coverage[trait] < self.min_coverage
            labels[trait] = classify(scores[trait], self.low_max, self.high_min)
            contribs[trait] = items
        return PersonalityPrediction(scores, labels, coverage, contribs, self.name, self.version,
                                     self.is_validated, self.disclaimer, conf, insufficient)


# ================================================================================= ML model
class MLPersonalityModel(PersonalityModel):
    """Ridge-regression model trained on telemetry features + validated questionnaire scores.

    Train with:  python -m analytics.train_model --csv your_data.csv
    The model is only flagged `is_validated` when the training script is told the
    questionnaire data are valid AND the cross-validated fit passes a minimum bar.
    """

    def __init__(self, path: Optional[str | os.PathLike] = None):
        import joblib
        self.path = Path(path or MODEL_DIR / "ml_model.joblib")
        bundle = joblib.load(self.path)
        self.pipeline = bundle["pipeline"]
        self.feature_names: list[str] = bundle["feature_names"]
        self.name = "MLPersonalityModel"
        self.version = bundle.get("version", "ml-1")
        self.is_validated = bool(bundle.get("validated", False))
        self.metrics = bundle.get("metrics", {})
        self.disclaimer = bundle.get("disclaimer", "Statistical model trained on collected data; see metrics.")
        self.train_means = bundle["train_means"]

    def predict(self, features: dict[str, float]) -> PersonalityPrediction:
        import numpy as np
        present = [f for f in self.feature_names if f in features]
        coverage_all = len(present) / len(self.feature_names)
        row = np.array([[features.get(f, self.train_means[f]) for f in self.feature_names]], dtype=float)
        pred = self.pipeline.predict(row)[0]
        scores, labels, coverage, contribs, conf, insuff = {}, {}, {}, {}, {}, {}
        scaler = self.pipeline.named_steps["scale"]
        z = (row[0] - scaler.mean_) / scaler.scale_
        coefs = self.pipeline.named_steps["ridge"].coef_
        for i, trait in enumerate(TRAITS):
            scores[trait] = to_score(float(pred[i]) / 100.0)
            labels[trait] = classify(scores[trait])
            coverage[trait] = round(coverage_all, 3)
            conf[trait] = "model-based"
            insuff[trait] = coverage_all < 0.4
            ranked = sorted(zip(self.feature_names, z, coefs[i]), key=lambda t: -abs(t[1] * t[2]))[:6]
            contribs[trait] = [Contribution(f, float(features.get(f, self.train_means[f])), round(float(zv), 3),
                                            round(float(c), 4), round(float(zv * c), 2)) for f, zv, c in ranked]
        return PersonalityPrediction(scores, labels, coverage, contribs, self.name, self.version,
                                     self.is_validated, self.disclaimer, conf, insuff)


def get_model(kind: Optional[str] = None) -> PersonalityModel:
    """Factory. `RAHYAAB_MODEL=ml` switches to the trained ML model if one exists."""
    kind = (kind or os.environ.get("RAHYAAB_MODEL", "weighted")).lower()
    if kind == "ml":
        return MLPersonalityModel()
    return WeightedScoringEngine()
