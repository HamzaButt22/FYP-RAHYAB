"""Small, dependency-light normalisation helpers used by the scoring engines."""
from __future__ import annotations

import math
from typing import Iterable, Optional

LOW_MAX = 39
HIGH_MIN = 70


def clip01(x: float) -> float:
    if x is None or (isinstance(x, float) and math.isnan(x)):
        return 0.0
    return max(0.0, min(1.0, float(x)))


def min_max(x: float, lo: float, hi: float, invert: bool = False) -> float:
    """Map x from [lo, hi] to [0, 1] (clipped). `invert=True` flips the direction."""
    if hi == lo:
        raise ValueError("min_max range must have non-zero width")
    v = clip01((float(x) - lo) / (hi - lo))
    return 1.0 - v if invert else v


def to_score(unit_value: float) -> float:
    """[0, 1] -> [0, 100] rounded to one decimal."""
    return round(clip01(unit_value) * 100.0, 1)


def classify(score: float, low_max: float = LOW_MAX, high_min: float = HIGH_MIN) -> str:
    """0-39 Low, 40-69 Moderate, 70-100 High."""
    if score < 0 or score > 100:
        raise ValueError("score must be within 0..100")
    r = math.floor(score + 0.5)     # classify on the whole number shown to the player
    if r <= low_max:
        return "Low"
    if r < high_min:
        return "Moderate"
    return "High"


class Standardizer:
    """Z-score standardiser (used when calibrating weights / training ML models)."""

    def __init__(self) -> None:
        self.mean_: Optional[list[float]] = None
        self.std_: Optional[list[float]] = None

    def fit(self, columns: Iterable[Iterable[float]]) -> "Standardizer":
        means, stds = [], []
        for col in columns:
            vals = [float(v) for v in col]
            m = sum(vals) / len(vals)
            var = sum((v - m) ** 2 for v in vals) / max(1, len(vals) - 1)
            means.append(m)
            stds.append(math.sqrt(var) or 1.0)
        self.mean_, self.std_ = means, stds
        return self

    def transform_row(self, row: Iterable[float]) -> list[float]:
        assert self.mean_ is not None and self.std_ is not None, "call fit() first"
        return [(float(v) - m) / s for v, m, s in zip(row, self.mean_, self.std_)]
