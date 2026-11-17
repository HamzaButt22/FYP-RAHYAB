"""Top-3 recommendation (M3, FR-46, FR-51, FR-53, FR-56): rank, band, explain, add Plan B and doors.

Pipeline for one student (class 9-10 for now; other class modes come in FYP-2):
1. Interest scores from the forced choices (interests.py, provisional) and ability scores when measured.
2. Evidence check (FR-51): too little play -> InsufficientEvidence, never a guessed ranking. After the
   extra week (weeks_played >= 5) the result always opens, with low confidence.
3. Congruence fit for every path of the class (congruence.py), the top 3 in order.
4. Per card: fit band, 2-3 reason codes from the contributions, doors from the rules engine, Plan B.
5. Confidence from scoring.json: high needs the pilot's stability delta, so before the pilot it is at
   most "medium"; any key SE > .50 or coverage < 80% makes it "low"; a provisional scorer caps it too.
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

M3_ID = "m3-congruence-2026.11.0"
SUPPORTED_GRADES = {9: "9-10", 10: "9-10"}
MODE_FOR = {"9-10": "matric"}


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


def _confidence(s: interests.InterestScores) -> str:
    if any(s.se[t] > 0.5 for t in RIASEC) or s.coverage < 0.8:
        return "low"
    # "high" needs the stability delta set on the pilot (scoring.json confidence.delta). Until then, and
    # always with the provisional scorer, the honest ceiling is "medium".
    return "medium"


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

    problem = _evidence_problem(scores)
    after_extra_week = context.weeks_played >= 5
    if problem and not after_extra_week:
        raise InsufficientEvidence(problem, scores.coverage)

    m3 = scoring["m3_recommender"]
    min_diff = float(m3["congruence"]["min_differentiation"]["value"])
    differentiated = congruence.is_differentiated(scores.theta, min_diff)
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

    cards: list[dict[str, Any]] = []
    for f in top:
        doors = door_rules[f.path_id].doors
        cards.append(
            {
                "stream_id": f.path_id,
                "fit": round(f.fit, 4),
                "fit_band": fit_band(f.fit, bands),
                "reasons": _reasons(student_phi, profiles[f.path_id], f.contributions, doors),
                "doors": [d.as_json() for d in doors],
                "plan_b": _plan_b(f.path_id, [x.path_id for x in top], ranked_ids, profiles),
            }
        )

    confidence = "low" if (problem or not differentiated) else _confidence(scores)
    versions = {"irt": interests.MODEL_ID, "m3": M3_ID, "rules": f"streams-{streams['version']}"}
    features = {
        "theta": {t: round(scores.theta[t], 4) for t in RIASEC},
        "se": {t: round(scores.se[t], 4) for t in RIASEC},
        "coverage": round(scores.coverage, 4),
        "choices": scores.choices,
        "chosen": dict(scores.wins),  # per type: chosen / offered, shown in "Why this?" (FR-56)
        "offered": dict(scores.comparisons),
        "differentiation": round(congruence.differentiation(scores.theta), 4),
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
