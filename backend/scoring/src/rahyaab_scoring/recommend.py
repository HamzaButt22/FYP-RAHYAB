"""Top-3 recommendation (M3, FR-46, FR-51, FR-53, FR-56): rank, band, explain, add Plan B and doors.

Pipeline for one student (class 9-10 for now; other class modes come in FYP-2):
1. Interest scores from the forced choices (interests.py, provisional) and ability scores when measured.
2. Evidence check (FR-51): too little play -> InsufficientEvidence, never a guessed ranking. Besides
   coverage, the answers must show a clear pattern: differentiation >= RANK_MIN_DIFFERENTIATION and, when
   pairs were repeated, repeated-pair agreement >= RANK_MIN_AGREEMENT. After the extra week
   (weeks_played >= 5) the result always opens, with low confidence and every band "worth_a_look".
3. Congruence fit for every path of the class (congruence.py), the top 3 in order.
4. Per card: fit band, 2-3 reason codes from the contributions, doors from the rules engine, Plan B.
   A low-confidence result never shows "strong" (the band is capped at "good").
5. Confidence (scoring.json confidence.interim_rules): high needs the pilot's stability delta, so before
   the pilot it is at most "medium". With the interim counting scorer, "medium" needs coverage >= 80%,
   differentiation >= MEDIUM_MIN_DIFFERENTIATION and agreement >= MEDIUM_MIN_AGREEMENT; anything else is
   "low". The interim scorer's SE is not used for confidence: its delta-method SE grows when a student
   answers a type the same way every time, so a clear student looked unsure and a random one looked sure
   (persona simulation, 18 Nov 2026). The SE rule returns with the Thurstonian IRT scorer.
6. input_hash: sha256 of the canonical inputs and every model version, so the same inputs always give the
   same stored result (RFC-0003, V7).
"""

from __future__ import annotations

import hashlib
import json
from collections.abc import Mapping, Sequence
from dataclasses import dataclass, field
from typing import Any

from rahyaab_scoring import congruence, interests, rules
from rahyaab_scoring.congruence import RIASEC

M3_ID = "m3-congruence-2026.11.1"  # .1: evidence and confidence rules corrected (migration 0010)
SUPPORTED_GRADES = {9: "9-10", 10: "9-10"}
MODE_FOR = {"9-10": "matric"}
# Provisional cut-offs from the persona simulation of 18 Nov 2026 (scoring.json confidence.interim_rules):
# random tapping passes the ranking check about 11% of the time and is "medium" about 1% of the time;
# consistent players pass about 99%. Re-checked in V1 and set on the pilot.
RANK_MIN_DIFFERENTIATION = 0.5
RANK_MIN_AGREEMENT = 0.6
MEDIUM_MIN_DIFFERENTIATION = 0.55
MEDIUM_MIN_AGREEMENT = 0.7
BAND_ORDER = ("worth_a_look", "good", "strong")


class InsufficientEvidence(Exception):
    """Not enough play to rank paths honestly (FR-51)."""

    def __init__(self, reason: str, coverage: float) -> None:
        super().__init__(reason)
        self.reason = reason
        self.coverage = coverage


class NotSupported(Exception):
    """A class mode the recommender does not cover yet."""


@dataclass(frozen=True)
class Context:
    grade: int
    board: str | None = None
    current_group: str | None = None
    weeks_played: int = 0
    marks: Mapping[str, float] | None = None


@dataclass(frozen=True)
class Result:
    mode: str
    ranked: list[dict[str, Any]]
    confidence: str
    provisional: bool
    features: dict[str, Any]
    contributions: dict[str, dict[str, float]]
    rules_applied: list[str]
    model_versions: dict[str, str]
    input_hash: str
    is_differentiated: bool
    extras: dict[str, Any] = field(default_factory=dict)


def fit_band(fit: float, bands: Mapping[str, float]) -> str:
    if fit >= bands["strong"]:
        return "strong"
    if fit >= bands["good"]:
        return "good"
    return "worth_a_look"


def _evidence_problem(s: interests.InterestScores) -> str | None:
    if s.coverage < 0.8:
        return "low_coverage"
    if sum(1 for t in RIASEC if s.se[t] > 0.6) >= 3:
        return "uncertain_interests"
    return None


def _pattern_problem(s: interests.InterestScores, differentiation: float) -> str | None:
    """No ranking before the extra week unless the answers show a clear, consistent pattern."""
    if s.agreement is not None and s.agreement < RANK_MIN_AGREEMENT:
        return "inconsistent_choices"
    if differentiation < RANK_MIN_DIFFERENTIATION:
        return "no_clear_pattern"
    return None


def _confidence(s: interests.InterestScores, differentiation: float) -> str:
    # "high" needs the stability delta set on the pilot (scoring.json confidence.delta). Until then, and
    # always with the provisional scorer, the honest ceiling is "medium".
    if (
        s.coverage >= 0.8
        and differentiation >= MEDIUM_MIN_DIFFERENTIATION
        and s.agreement is not None
        and s.agreement >= MEDIUM_MIN_AGREEMENT
    ):
        return "medium"
    return "low"


def _capped(band: str, confidence: str, thin_evidence: bool) -> str:
    """An extra-week result on thin evidence is only "worth a look"; low confidence never says "strong"."""
    if thin_evidence:
        return "worth_a_look"
    if confidence == "low":
        return min(band, "good", key=BAND_ORDER.index)
    return band


def _reasons(
    student: Mapping[str, float],
    path_profile: Mapping[str, float],
    contributions: Mapping[str, float],
    doors: Sequence[rules.Door],
) -> list[dict[str, Any]]:
    out: list[dict[str, Any]] = []
    top_student = sorted(RIASEC, key=lambda t: (-student[t], RIASEC.index(t)))[:3]
    shared = [t for t in top_student if path_profile[t] >= 0.5]
    if "interest" in contributions and shared:
        out.append({"code": "interest_match", "types": shared[:2]})
    if "ability" in contributions:
        out.append({"code": "ability_support"})
    open_doors = [d.to for d in doors if d.state == "open"]
    if open_doors:
        out.append({"code": "keeps_doors_open", "doors": open_doors})
    if len(out) < 2:
        strongest = max(RIASEC, key=lambda t: path_profile[t])
        out.append({"code": "path_strength", "types": [strongest]})
    return out[:3]


def _plan_b(
    path_id: str,
    top_ids: Sequence[str],
    ranked_all: Sequence[str],
    profiles: Mapping[str, Mapping[str, float]],
) -> list[str]:
    others = [p for p in ranked_all if p not in top_ids]
    if not others:
        others = [p for p in ranked_all if p != path_id]
    base = [profiles[path_id][t] for t in RIASEC]

    def similarity(pid: str) -> float:
        r = congruence.pearson(base, [profiles[pid][t] for t in RIASEC])
        return -2.0 if r is None else r

    best = max(others, key=lambda pid: (similarity(pid), -ranked_all.index(pid)))
    return [best]


def input_hash(payload: Mapping[str, Any]) -> str:
    canonical = json.dumps(payload, sort_keys=True, separators=(",", ":"), ensure_ascii=False)
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()


def recommend(
    choices: Sequence[interests.Choice],
    context: Context,
    streams: Mapping[str, Any],
    scoring: Mapping[str, Any],
    theta_ability: Mapping[str, float | None] | None = None,
) -> Result:
    group = SUPPORTED_GRADES.get(context.grade)
    if group is None:
        raise NotSupported(f"class {context.grade} is not supported yet")
    paths = streams["by_class"][group]["paths"]
    theta_ability = dict(theta_ability or {})
    scores = interests.score(choices)
    provisional = True  # interests.MODEL_ID is the interim scorer

    differentiation = congruence.differentiation(scores.theta)
    problem = _evidence_problem(scores) or _pattern_problem(scores, differentiation)
    after_extra_week = context.weeks_played >= 5
    if problem and not after_extra_week:
        raise InsufficientEvidence(problem, scores.coverage)

    m3 = scoring["m3_recommender"]
    min_diff = float(m3["congruence"]["min_differentiation"]["value"])
    differentiated = differentiation >= min_diff
    fits = [
        congruence.path_fit(
            p["id"],
            scores.theta,
            p["riasec"],
            theta_ability,
            p.get("abilities", []),
            context.marks,
            p.get("subjects", []),
            min_diff,
        )
        for p in paths
    ]
    if all(not f.contributions for f in fits) and not after_extra_week:
        raise InsufficientEvidence("no_clear_pattern", scores.coverage)

    ordered = congruence.rank(fits, top=len(fits))
    top = ordered[:3]
    profiles = {p["id"]: p["riasec"] for p in paths}
    door_rules = rules.all_doors([f.path_id for f in top], streams, context.current_group)
    student_phi = dict(zip(RIASEC, congruence.student_profile(scores.theta), strict=True))
    bands = m3["fit_bands"]
    ranked_ids = [f.path_id for f in ordered]
    confidence = "low" if (problem or not differentiated) else _confidence(scores, differentiation)
    thin_evidence = bool(problem) or not differentiated

    cards: list[dict[str, Any]] = []
    for f in top:
        doors = door_rules[f.path_id].doors
        cards.append(
            {
                "stream_id": f.path_id,
                "fit": round(f.fit, 4),
                "fit_band": _capped(fit_band(f.fit, bands), confidence, thin_evidence),
                "reasons": _reasons(student_phi, profiles[f.path_id], f.contributions, doors),
                "doors": [d.as_json() for d in doors],
                "plan_b": _plan_b(f.path_id, [x.path_id for x in top], ranked_ids, profiles),
            }
        )

    versions = {"irt": interests.MODEL_ID, "m3": M3_ID, "rules": f"streams-{streams['version']}"}
    features = {
        "theta": {t: round(scores.theta[t], 4) for t in RIASEC},
        "se": {t: round(scores.se[t], 4) for t in RIASEC},
        "coverage": round(scores.coverage, 4),
        "choices": scores.choices,
        "chosen": dict(scores.wins),  # per type: chosen / offered, shown in "Why this?" (FR-56)
        "offered": dict(scores.comparisons),
        "differentiation": round(differentiation, 4),
        "repeated_pairs": scores.repeated_pairs,
        "agreement": None if scores.agreement is None else round(scores.agreement, 4),
        "weeks_played": context.weeks_played,
    }
    hash_input = {
        "choices": sorted((interests.canonical_pair(c.pair) or c.pair, c.picked) for c in choices),
        "context": {
            "grade": context.grade,
            "board": context.board,
            "group": context.current_group,
            "weeks": context.weeks_played,
            "marks": dict(context.marks or {}),
        },
        "ability": {k: v for k, v in sorted(theta_ability.items())},
        "versions": versions,
        "scoring_version": scoring.get("version"),
    }
    applied = sorted({g for pr in door_rules.values() for g in pr.rules_applied})
    return Result(
        mode=MODE_FOR[group],
        ranked=cards,
        confidence=confidence,
        provisional=provisional,
        features=features,
        contributions={f.path_id: {k: round(v, 4) for k, v in f.contributions.items()} for f in top},
        rules_applied=applied,
        model_versions=versions,
        input_hash=input_hash(hash_input),
        is_differentiated=differentiated,
        extras={"evidence_problem": problem, "after_extra_week": after_extra_week},
    )
