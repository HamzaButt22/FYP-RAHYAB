"""Interim interest scorer (M1, provisional): win counts of the forced-choice pairs.

Until the Thurstonian IRT scorer exists (scoring.json m1_interests), interest scores come from counting:
in a forced choice between two types (pair "R-S", picked "R"), the picked type wins one comparison.

    theta_k = probit((wins_k + 0.5) / (comparisons_k + 1))
    se_k    = sqrt(p_k * (1 - p_k) / (comparisons_k + 1)) / pdf(theta_k)   (delta method, probit scale)

Every result made with this scorer is marked provisional. It reads the same inputs as the real scorer
(the choices), so swapping it later changes no caller. Coverage follows pairs.json: every pair should be
seen at least `each_pair_min` times.
"""

from __future__ import annotations

import math
from collections.abc import Iterable
from dataclasses import dataclass
from statistics import NormalDist

RIASEC = ("R", "I", "A", "S", "E", "C")
PAIRS = tuple(f"{a}-{b}" for i, a in enumerate(RIASEC) for b in RIASEC[i + 1 :])  # the 15 pairs, R-I first
EACH_PAIR_MIN = 2  # pairs.json coverage_targets.each_pair_min
MODEL_ID = "m1-counts-2026.11.0"
_NORMAL = NormalDist()


@dataclass(frozen=True)
class Choice:
    """One forced choice: the pair shown ("R-S" or "S-R") and the type picked."""

    pair: str
    picked: str


@dataclass(frozen=True)
class InterestScores:
    theta: dict[str, float]
    se: dict[str, float]
    comparisons: dict[str, int]
    coverage: float  # 0..1, share of the pair coverage target reached
    choices: int  # valid choices counted


def canonical_pair(pair: str) -> str | None:
    """'S-R' -> 'R-S'; None for anything that is not two different RIASEC letters."""
    parts = pair.split("-")
    if len(parts) != 2 or parts[0] == parts[1] or not all(p in RIASEC for p in parts):
        return None
    a, b = sorted(parts, key=RIASEC.index)
    return f"{a}-{b}"


def score(choices: Iterable[Choice]) -> InterestScores:
    wins = dict.fromkeys(RIASEC, 0)
    seen = dict.fromkeys(RIASEC, 0)
    per_pair = dict.fromkeys(PAIRS, 0)
    counted = 0
    for c in choices:
        pair = canonical_pair(c.pair)
        if pair is None or c.picked not in pair.split("-"):
            continue  # a malformed choice is ignored, never guessed
        a, b = pair.split("-")
        seen[a] += 1
        seen[b] += 1
        wins[c.picked] += 1
        per_pair[pair] += 1
        counted += 1
    theta: dict[str, float] = {}
    se: dict[str, float] = {}
    for t in RIASEC:
        p = (wins[t] + 0.5) / (seen[t] + 1)
        theta[t] = _NORMAL.inv_cdf(p)
        se[t] = math.sqrt(p * (1.0 - p) / (seen[t] + 1)) / _NORMAL.pdf(theta[t])
    coverage = sum(min(n, EACH_PAIR_MIN) for n in per_pair.values()) / (EACH_PAIR_MIN * len(PAIRS))
    return InterestScores(theta, se, seen, coverage, counted)
