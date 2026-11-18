"""Interim interest scorer, rules engine and top-3 recommendation (FR-45, FR-46, FR-51, FR-56)."""

import json
import random
from pathlib import Path

import pytest

from rahyaab_scoring import interests, recommend, rules
from rahyaab_scoring.interests import PAIRS, Choice

FRAMEWORKS = Path(__file__).resolve().parents[3] / "design" / "game" / "frameworks"
STREAMS = json.loads((FRAMEWORKS / "streams.json").read_text(encoding="utf-8"))
SCORING = json.loads((FRAMEWORKS / "scoring.json").read_text(encoding="utf-8"))
SCHEDULE = json.loads((FRAMEWORKS / "pairs.json").read_text(encoding="utf-8"))["target_schedule"]
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


def test_the_profile_group_ids_count_for_biology() -> None:
    # The profile stores a class 9-10 student's Matric group as the class-8 path id (streams.json).
    matric_ids = {p["id"] for p in STREAMS["by_class"]["8"]["paths"]}
    assert {"matric_science_bio", "matric_science_cs", "matric_humanities", "matric_technical"} <= matric_ids
    assert rules.has_biology("matric_science_bio") is True
    assert rules.has_biology("matric_science_cs") is False
    assert rules.has_biology("matric_humanities") is False
    assert rules.has_biology("matric_technical") is None  # varies by board: nothing is assumed


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


def flipped(prefer: str, flips: int) -> list[Choice]:
    """Round 1 follows `prefer`; round 2 answers the first `flips` of FLIP_ORDER the other way."""
    first = play(prefer, rounds=1)
    changed = set(FLIP_ORDER[:flips])
    second = [Choice(c.pair, other(c) if c.pair in changed else c.picked) for c in first]
    return first + second


FLIP_ORDER = [PAIRS[i] for i in (0, 5, 9, 12, 14, 1, 6, 10)]


def other(c: Choice) -> str:
    return next(t for t in c.pair.split("-") if t != c.picked)


def random_tapper(seed: int) -> list[Choice]:
    """The game's own 30-slot schedule (pairs.json), each answer a coin flip."""
    rng = random.Random(seed)
    return [Choice(f"{s['left']}-{s['right']}", rng.choice((s["left"], s["right"]))) for s in SCHEDULE]


def test_tc_score_13_repeated_pairs_measure_consistency() -> None:  # FR-43
    assert interests.score(play("IRCSEA")).agreement == 1.0
    assert interests.score(flipped("IRCSEA", 5)).agreement == pytest.approx(10 / 15)
    assert interests.score(play("IRCSEA", rounds=1)).agreement is None  # nothing repeated: unknown
    s = interests.score(play("IRCSEA", rounds=1) + play("IRCSEA", rounds=1)[:7])
    assert s.repeated_pairs == 7 and s.agreement is None  # too few repeats to judge
    with pytest.raises(recommend.InsufficientEvidence) as e:
        recommend.recommend(flipped("IRCSEA", 7), context(), STREAMS, SCORING)  # 8 of 15 the same: a coin
    assert e.value.reason == "inconsistent_choices"


def test_tc_score_14_random_tapping_is_not_ranked_and_never_looks_sure() -> None:  # FR-51, NFR-60
    ranked_early, opened = 0, []
    for seed in range(300):
        picks = random_tapper(seed)
        try:
            recommend.recommend(picks, context(), STREAMS, SCORING)
            ranked_early += 1
        except recommend.InsufficientEvidence as e:
            assert e.reason in {"no_clear_pattern", "inconsistent_choices"}
        opened.append(recommend.recommend(picks, context(weeks=5), STREAMS, SCORING))
    assert ranked_early / 300 <= 0.15  # was 100% with the 0.15 minimum alone
    assert sum(r.confidence == "medium" for r in opened) / 300 <= 0.03  # was 98% "fairly sure"
    assert sum(r.ranked[0]["fit_band"] == "strong" for r in opened) / 300 <= 0.03  # was 70% "strong"


def test_tc_score_15_a_clear_consistent_student_is_fairly_sure() -> None:  # FR-43: not the other way round
    clear = recommend.recommend(play("IRCSEA"), context(), STREAMS, SCORING)
    assert clear.confidence == "medium" and clear.ranked[0]["fit_band"] == "strong"
    wobbly = recommend.recommend(flipped("IRCSEA", 5), context(), STREAMS, SCORING)  # ranked, but 10 of 15
    assert wobbly.confidence == "low"
    # Low confidence: never "strong".
    assert {c["fit_band"] for c in wobbly.ranked} <= {"good", "worth_a_look"}


def test_an_extra_week_result_on_thin_evidence_is_only_worth_a_look() -> None:  # FR-51
    for picks in (play("IRCSEA", rounds=1)[:5], [], random_tapper(1)):
        r = recommend.recommend(picks, context(weeks=5), STREAMS, SCORING)
        assert r.confidence == "low" and {c["fit_band"] for c in r.ranked} == {"worth_a_look"}


def test_the_cut_offs_in_code_match_scoring_json() -> None:
    rules_ = SCORING["confidence"]["interim_rules"]
    assert rules_["rank"]["min_differentiation"] == recommend.RANK_MIN_DIFFERENTIATION
    assert rules_["rank"]["min_agreement"] == recommend.RANK_MIN_AGREEMENT
    assert rules_["medium"]["min_differentiation"] == recommend.MEDIUM_MIN_DIFFERENTIATION
    assert rules_["medium"]["min_agreement"] == recommend.MEDIUM_MIN_AGREEMENT
    assert rules_["min_repeated_pairs"] == interests.MIN_REPEATED_PAIRS


def test_same_inputs_same_hash_and_order_does_not_matter() -> None:  # V7
    a = recommend.recommend(play("IRCSEA"), context(), STREAMS, SCORING)
    b = recommend.recommend(list(reversed(play("IRCSEA"))), context(), STREAMS, SCORING)
    c = recommend.recommend(play("SAECRI"), context(), STREAMS, SCORING)
    assert a.input_hash == b.input_hash != c.input_hash
    assert a.ranked == b.ranked


def test_other_classes_are_not_supported_yet() -> None:
    with pytest.raises(recommend.NotSupported):
        recommend.recommend(play("IRCSEA"), recommend.Context(grade=11), STREAMS, SCORING)
