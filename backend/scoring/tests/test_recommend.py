"""Interim interest scorer, rules engine and top-3 recommendation (FR-45, FR-46, FR-51, FR-56)."""

import json
from pathlib import Path

import pytest

from rahyaab_scoring import interests, recommend, rules
from rahyaab_scoring.interests import PAIRS, Choice

FRAMEWORKS = Path(__file__).resolve().parents[3] / "design" / "game" / "frameworks"
STREAMS = json.loads((FRAMEWORKS / "streams.json").read_text(encoding="utf-8"))
SCORING = json.loads((FRAMEWORKS / "scoring.json").read_text(encoding="utf-8"))
ORDER = "RIASEC"


def play(prefer: str, rounds: int = 2) -> list[Choice]:
    """Every pair `rounds` times; the type earlier in `prefer` always wins."""
    out = []
    for _ in range(rounds):
        for pair in PAIRS:
            a, b = pair.split("-")
            out.append(Choice(pair, a if prefer.index(a) < prefer.index(b) else b))
    return out


# ------------------------------------------------------------------------------------------ interests
def test_winning_types_score_higher_and_se_shrinks_with_play() -> None:
    few = interests.score(play("IRCSEA", rounds=1))
    many = interests.score(play("IRCSEA", rounds=3))
    assert many.theta["I"] > many.theta["R"] > many.theta["A"]
    assert many.se["I"] < few.se["I"]
    assert many.coverage == 1.0 and few.coverage == 0.5


def test_malformed_choices_are_ignored_and_pairs_are_order_free() -> None:
    s = interests.score([Choice("S-R", "R"), Choice("R-R", "R"), Choice("R-X", "R"), Choice("R-S", "A")])
    assert s.choices == 1 and s.comparisons["R"] == 1 and s.comparisons["S"] == 1
    assert interests.canonical_pair("S-R") == "R-S" and interests.canonical_pair("Q-R") is None


# ------------------------------------------------------------------------------------------ rules
def test_doors_follow_the_gates_with_sources() -> None:
    eng = {d.to: d for d in rules.doors_for("pre_engineering", STREAMS).doors}
    assert eng["engineering"].state == "open" and eng["engineering"].verification == "primary"
    assert eng["engineering"].sources  # a primary gate always names its source
    assert eng["medicine"].state == "closed" and eng["medicine"].route == "additional_subject"


def test_unverified_gates_are_never_stated_as_rules() -> None:
    (door,) = rules.doors_for("a_level", STREAMS).doors
    assert door.check_with_board and door.state == "extra_step" and door.verification == "unverified"


def test_biology_requirement_uses_the_current_group() -> None:
    def medicine(group: str | None) -> rules.Door:
        return next(d for d in rules.doors_for("pre_medical", STREAMS, group).doors if d.to == "medicine")

    assert medicine("science_biology").state == "open" and medicine("science_biology").note is None
    assert medicine("science_computer").state == "extra_step"
    assert medicine("science_computer").route == "switch_group_window"
    assert medicine(None).state == "open" and medicine(None).note == "needs_biology_at_matric"


def test_paths_without_gates_have_no_doors_and_are_never_removed() -> None:
    assert rules.doors_for("tech_vocational", STREAMS).doors == ()


# ------------------------------------------------------------------------------------------ top-3
def context(weeks: int = 4) -> recommend.Context:
    return recommend.Context(grade=9, weeks_played=weeks)


def test_top3_cards_are_complete() -> None:  # FR-46, FR-53
    r = recommend.recommend(play("IRCSEA"), context(), STREAMS, SCORING)
    assert r.mode == "matric" and len(r.ranked) == 3
    assert len({c["stream_id"] for c in r.ranked}) == 3
    fits = [c["fit"] for c in r.ranked]
    assert fits == sorted(fits, reverse=True)
    for card in r.ranked:
        assert card["fit_band"] in {"strong", "good", "worth_a_look"}
        assert 2 <= len(card["reasons"]) <= 3
        assert len(card["plan_b"]) >= 1 and card["stream_id"] not in card["plan_b"]
    assert r.provisional and r.confidence in {"medium", "low"}  # never "high" before the pilot


def test_an_investigative_realistic_student_gets_science_paths() -> None:
    r = recommend.recommend(play("IRCSEA"), context(), STREAMS, SCORING)
    assert r.ranked[0]["stream_id"] in {"pre_engineering", "pre_medical", "ics", "general_science"}
    assert any(x["code"] == "interest_match" for x in r.ranked[0]["reasons"])


def test_reasons_come_only_from_stored_contributions() -> None:  # FR-56
    r = recommend.recommend(play("SAECRI"), context(), STREAMS, SCORING)
    for card in r.ranked:
        codes = {x["code"] for x in card["reasons"]}
        if "ability_support" in codes:
            assert "ability" in r.contributions[card["stream_id"]]
        assert "ability_support" not in codes  # no task results yet, so no ability claims


def test_too_little_play_gives_no_ranking() -> None:  # FR-51
    with pytest.raises(recommend.InsufficientEvidence) as e:
        recommend.recommend(play("IRCSEA", rounds=1)[:5], context(), STREAMS, SCORING)
    assert e.value.reason == "low_coverage"


def test_after_the_extra_week_the_result_always_opens_with_low_confidence() -> None:  # FR-51
    r = recommend.recommend(play("IRCSEA", rounds=1)[:5], context(weeks=5), STREAMS, SCORING)
    assert len(r.ranked) == 3 and r.confidence == "low"


def test_a_flat_profile_is_not_ranked_by_interest() -> None:
    flat = [Choice(p, p.split("-")[i % 2]) for i, p in enumerate(PAIRS * 2)]
    with pytest.raises(recommend.InsufficientEvidence):
        recommend.recommend(flat, context(), STREAMS, SCORING)


def test_same_inputs_same_hash_and_order_does_not_matter() -> None:  # V7
    a = recommend.recommend(play("IRCSEA"), context(), STREAMS, SCORING)
    b = recommend.recommend(list(reversed(play("IRCSEA"))), context(), STREAMS, SCORING)
    c = recommend.recommend(play("SAECRI"), context(), STREAMS, SCORING)
    assert a.input_hash == b.input_hash != c.input_hash
    assert a.ranked == b.ranked


def test_other_classes_are_not_supported_yet() -> None:
    with pytest.raises(recommend.NotSupported):
        recommend.recommend(play("IRCSEA"), recommend.Context(grade=11), STREAMS, SCORING)
