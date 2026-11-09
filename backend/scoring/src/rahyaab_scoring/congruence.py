"""M3 baseline (b): congruence ranking, as defined in design/game/frameworks/scoring.json and SRS §12.6.

fit = w_interest * cos(Phi(theta_riasec), path_riasec) + w_ability * ability_support + w_marks * marks_support
Every term is in [0, 1]. Missing terms are dropped and the remaining weights renormalised.
"""

from __future__ import annotations

import math
from collections.abc import Mapping, Sequence
from dataclasses import dataclass

RIASEC = ("R", "I", "A", "S", "E", "C")
WEIGHTS = {"interest": 0.55, "ability": 0.35, "marks": 0.10}


def phi(x: float) -> float:
    """Standard normal CDF: maps a theta score to (0, 1) and keeps the order."""
    return 0.5 * (1.0 + math.erf(x / math.sqrt(2.0)))


def cosine(a: Sequence[float], b: Sequence[float]) -> float:
    na = math.sqrt(sum(x * x for x in a))
    nb = math.sqrt(sum(y * y for y in b))
    if na == 0.0 or nb == 0.0:
        return 0.0
    return sum(x * y for x, y in zip(a, b, strict=True)) / (na * nb)


def ability_support(theta_ability: Mapping[str, float | None], families: Sequence[str]) -> float | None:
    """Equal-weight mean of Phi(theta) over the path's ability families; unmeasured families are dropped."""
    measured = [phi(v) for f in families if (v := theta_ability.get(f)) is not None and math.isfinite(v)]
    return sum(measured) / len(measured) if measured else None


def marks_support(marks: Mapping[str, float] | None, subjects: Sequence[str]) -> float | None:
    """Mean of the path's relevant subject percentages / 100."""
    if not marks:
        return None
    vals = [marks[s] / 100.0 for s in subjects if s in marks and 0.0 <= marks[s] <= 100.0]
    return sum(vals) / len(vals) if vals else None


@dataclass(frozen=True)
class Fit:
    path_id: str
    fit: float
    contributions: dict[str, float]


def path_fit(
    path_id: str,
    theta_riasec: Mapping[str, float],
    path_riasec: Mapping[str, float],
    theta_ability: Mapping[str, float | None],
    path_families: Sequence[str],
    marks: Mapping[str, float] | None = None,
    path_subjects: Sequence[str] = (),
) -> Fit:
    student = [phi(theta_riasec[t]) for t in RIASEC]
    profile = [path_riasec[t] for t in RIASEC]
    terms: dict[str, float] = {"interest": cosine(student, profile)}
    if (a := ability_support(theta_ability, path_families)) is not None:
        terms["ability"] = a
    if (m := marks_support(marks, path_subjects)) is not None:
        terms["marks"] = m
    total_w = sum(WEIGHTS[k] for k in terms)
    contributions = {k: WEIGHTS[k] / total_w * v for k, v in terms.items()}
    return Fit(path_id, sum(contributions.values()), contributions)


def rank(fits: Sequence[Fit], top: int = 3) -> list[Fit]:
    """Highest fit first; ties broken by path id so the order is deterministic."""
    return sorted(fits, key=lambda f: (-round(f.fit, 12), f.path_id))[:top]
