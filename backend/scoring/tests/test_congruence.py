import json
import math
from pathlib import Path

from rahyaab_scoring.congruence import RIASEC, Fit, cosine, path_fit, phi, rank

STREAMS = Path(__file__).resolve().parents[3] / "design" / "game" / "frameworks" / "streams.json"


def test_phi_bounds_and_order() -> None:
    assert 0.0 < phi(-5) < phi(0) == 0.5 < phi(5) < 1.0


def test_cosine_handles_zero_vector() -> None:
    assert cosine([0, 0], [1, 1]) == 0.0


def test_fit_terms_are_bounded_and_renormalised_without_marks() -> None:
    theta = dict.fromkeys(RIASEC, 0.0)
    f = path_fit("x", theta, dict.fromkeys(RIASEC, 0.5), {"numerical": 1.0}, ["numerical"])
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
