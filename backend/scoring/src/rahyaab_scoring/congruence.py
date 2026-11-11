"""M3 baseline (b): congruence ranking, as defined in design/game/frameworks/scoring.json and SRS §12.6.

fit = w_interest * interest_match + w_ability * ability_support + w_marks * marks_support

interest_match = (r + 1) / 2, where r is the Pearson correlation between the student's interest profile
Phi(theta_RIASEC) and the path's O*NET-derived profile. Correlation compares the SHAPE of the two profiles
(which types are high and which are low), not their overall level. The earlier cosine similarity also
rewarded paths with flat profiles, so a student with no clear interests still got a confident-looking top 3
(review of 12 Nov 2026).

Holland's differentiation (highest minus lowest of the six interest scores) is reported with every result.
Below MIN_DIFFERENTIATION the profile is too flat to rank paths by interest: `interest_match` is dropped and
`is_differentiated` is False, so the app says "no clear interest pattern yet" (FR-51) instead of guessing.

Every term is in [0, 1]. Missing terms are dropped and the remaining weights renormalised.
"""

from __future__ import annotations

import math
from collections.abc import Mapping, Sequence
from dataclasses import dataclass

RIASEC = ("R", "I", "A", "S", "E", "C")
WEIGHTS = {"interest": 0.55, "ability": 0.35, "marks": 0.10}
# Provisional: on the Phi scale, a spread below 0.15 means all six interests lie within a narrow band.
# Calibrated in the V1 simulation on the reference sample (SCIENTIFIC_BASIS.md V1); kept in scoring.json.
MIN_DIFFERENTIATION = 0.15


def phi(x: float) -> float:
    """Standard normal CDF: maps a theta score to (0, 1) and keeps the order."""
    return 0.5 * (1.0 + math.erf(x / math.sqrt(2.0)))


def cosine(a: Sequence[float], b: Sequence[float]) -> float:
    """Kept for the sensitivity comparison in the V1 simulation; not used for ranking."""
    na = math.sqrt(sum(x * x for x in a))
    nb = math.sqrt(sum(y * y for y in b))
    if na == 0.0 or nb == 0.0:
        return 0.0
    return sum(x * y for x, y in zip(a, b, strict=True)) / (na * nb)


def pearson(a: Sequence[float], b: Sequence[float]) -> float | None:
    """Pearson correlation of two profiles; None when either profile is flat (no shape to compare)."""
    ma, mb = sum(a) / len(a), sum(b) / len(b)
    da = [x - ma for x in a]
    db = [y - mb for y in b]
    sa = math.sqrt(sum(x * x for x in da))
    sb = math.sqrt(sum(y * y for y in db))
    if sa < 1e-12 or sb < 1e-12:
        return None
    return sum(x * y for x, y in zip(da, db, strict=True)) / (sa * sb)


def student_profile(theta_riasec: Mapping[str, float]) -> list[float]:
    return [phi(theta_riasec[t]) for t in RIASEC]


def differentiation(theta_riasec: Mapping[str, float]) -> float:
    """Holland's differentiation: highest minus lowest of the six interest scores (Phi scale, 0-1)."""
    profile = student_profile(theta_riasec)
    return max(profile) - min(profile)


def is_differentiated(theta_riasec: Mapping[str, float], minimum: float = MIN_DIFFERENTIATION) -> bool:
    return differentiation(theta_riasec) >= minimum


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
    min_differentiation: float = MIN_DIFFERENTIATION,
) -> Fit:
    terms: dict[str, float] = {}
    if is_differentiated(theta_riasec, min_differentiation):
        r = pearson(student_profile(theta_riasec), [path_riasec[t] for t in RIASEC])
        if r is not None:
            terms["interest"] = (r + 1.0) / 2.0
    if (a := ability_support(theta_ability, path_families)) is not None:
        terms["ability"] = a
    if (m := marks_support(marks, path_subjects)) is not None:
        terms["marks"] = m
    if not terms:
        return Fit(path_id, 0.0, {})
    total_w = sum(WEIGHTS[k] for k in terms)
    contributions = {k: WEIGHTS[k] / total_w * v for k, v in terms.items()}
    return Fit(path_id, sum(contributions.values()), contributions)


def rank(fits: Sequence[Fit], top: int = 3) -> list[Fit]:
    """Highest fit first; ties broken by path id so the order is deterministic."""
    return sorted(fits, key=lambda f: (-round(f.fit, 12), f.path_id))[:top]
