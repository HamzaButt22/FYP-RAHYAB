import json
import math
from pathlib import Path

import pytest

from rahyaab_scoring.congruence import (
    RIASEC,
    Fit,
    cosine,
    differentiation,
    is_differentiated,
    path_fit,
    pearson,
    phi,
    rank,
)

STREAMS = Path(__file__).resolve().parents[3] / "design" / "game" / "frameworks" / "streams.json"


def test_phi_bounds_and_order() -> None:
    assert 0.0 < phi(-5) < phi(0) == 0.5 < phi(5) < 1.0


def test_cosine_handles_zero_vector() -> None:
    assert cosine([0, 0], [1, 1]) == 0.0


def test_fit_terms_are_bounded_and_renormalised_without_marks() -> None:
    theta = {"R": 1.0, "I": 0.5, "A": -0.5, "S": 0.0, "E": -1.0, "C": 0.2}
    profile = {"R": 0.8, "I": 0.7, "A": 0.1, "S": 0.2, "E": 0.2, "C": 0.6}
    f = path_fit("x", theta, profile, {"numerical": 1.0}, ["numerical"])
    assert set(f.contributions) == {"interest", "ability"}
    assert 0.0 <= f.fit <= 1.0
    assert math.isclose(sum(f.contributions.values()), f.fit)


def test_unmeasured_ability_is_dropped_not_zeroed() -> None:  # TC-SCORE-07, TC-SCORE-10
    theta = dict.fromkeys(RIASEC, 0.0)
    f = path_fit(
        "x",
        theta,
        dict.fromkeys(RIASEC, 0.5),
        {"spatial": None, "numerical": float("nan")},
        ["spatial", "numerical"],
    )
    assert "ability" not in f.contributions
    assert math.isfinite(f.fit)


def test_investigative_student_prefers_an_investigative_path() -> None:
    paths = json.loads(STREAMS.read_text(encoding="utf-8"))["by_class"]["9-10"]["paths"]
    theta = {"R": -0.5, "I": 2.0, "A": -1.0, "S": 1.0, "E": -1.0, "C": -0.5}
    fits = [path_fit(p["id"], theta, p["riasec"], {}, p.get("abilities", [])) for p in paths]
    top = rank(fits)
    assert len(top) == 3
    assert top[0].fit >= top[1].fit >= top[2].fit
    assert top[0].path_id in {"pre_medical", "pre_engineering", "ics", "general_science"}


def test_rank_is_deterministic_on_ties() -> None:
    fits = [Fit("b", 0.5, {}), Fit("a", 0.5, {})]
    assert [f.path_id for f in rank(fits)] == ["a", "b"]


# ---------------------------------------------------------------------- profile shape (review 12 Nov 2026)
def _paths() -> dict[str, dict[str, float]]:
    data = json.loads(STREAMS.read_text(encoding="utf-8"))["by_class"]["9-10"]["paths"]
    return {p["id"]: p["riasec"] for p in data}


def _top(theta: dict[str, float]) -> list[str]:
    fits = [path_fit(pid, theta, profile, {}, []) for pid, profile in _paths().items()]
    return [f.path_id for f in rank(fits)]


def test_pearson_is_shape_only_and_handles_flat_profiles() -> None:
    a = [0.2, 0.4, 0.9, 0.8, 0.5, 0.3]
    shifted = [x + 0.3 for x in a]
    assert pearson(a, shifted) == pytest.approx(1.0)  # same shape, different level
    assert pearson(a, [0.5] * 6) is None  # a flat profile has no shape


def test_a_flat_student_gets_no_interest_ranking() -> None:  # FR-51
    flat = dict.fromkeys(RIASEC, 0.0)
    assert differentiation(flat) == pytest.approx(0.0)
    assert not is_differentiated(flat)
    fits = [path_fit(pid, flat, profile, {}, []) for pid, profile in _paths().items()]
    assert all("interest" not in f.contributions for f in fits)  # no guess from interests


def test_clear_profiles_rank_the_matching_paths_first() -> None:
    artistic_social = {"R": -1.0, "I": -0.3, "A": 1.5, "S": 1.0, "E": 0.0, "C": -0.6}
    realistic = {"R": 1.5, "I": 0.3, "A": -1.0, "S": -1.0, "E": -0.6, "C": 0.0}
    assert _top(artistic_social)[0] == "fa_humanities"
    assert set(_top(realistic)) <= {"pre_engineering", "dae", "tech_vocational", "general_science"}


def test_interest_match_is_bounded() -> None:
    theta = {"R": 2.0, "I": -2.0, "A": 1.0, "S": -1.0, "E": 0.5, "C": -0.5}
    for pid, profile in _paths().items():
        match = path_fit(pid, theta, profile, {}, []).contributions["interest"]
        assert 0.0 <= match <= 1.0, pid
