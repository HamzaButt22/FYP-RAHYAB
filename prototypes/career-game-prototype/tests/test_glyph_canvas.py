import math
import os
import random

import pytest

from engine.glyph_sequence import (
    CORRECT, ERROR, INERT, INPUT, LOCKED, PLAYBACK, ROUND_CLEAR,
    INERT_CLICK_EVENT, NODE_CLICK_EVENT, PLAYBACK_END_EVENT, START_EVENT,
    MEASURED_FEATURES,
    NODE_COUNT,
    START_LENGTH,
    GlyphSequenceGame,
    compile_profile,
    generate_sequence,
    hit_node,
    node_positions,
    summarise_session,
)
from engine.stream_transformation_engine import FEATURE_ORDER, STREAMS, StreamTransformationEngine

CX, CY, R = 512, 384, 220


def ev(kind, ms, data):
    return {"event_type": kind, "monotonic_ms": ms, "data": data}


def script(seed, steps):
    """Builds a telemetry stream by driving a shadow model. Steps: (action, ms[, node])."""
    shadow = GlyphSequenceGame(seed)
    events = [ev(START_EVENT, 0.0, {"seed": seed})]
    for step in steps:
        action, ms = step[0], step[1]
        if action == "unlock":
            shadow.finish_playback()
            events.append(ev(PLAYBACK_END_EVENT, ms, {}))
            continue
        expected = shadow.expected
        if action == "inert":
            shadow.press(None)
            events.append(ev(INERT_CLICK_EVENT, ms, {"selected_node_index": None, "expected_node_index": expected}))
            continue
        if action == "right":
            node = expected if expected is not None else 0
        elif action == "wrong":
            node = (expected + 1) % NODE_COUNT
        else:
            node = step[2]
        shadow.press(node)
        events.append(ev(NODE_CLICK_EVENT, ms, {"selected_node_index": node, "expected_node_index": expected}))
    return events


def clear_round(unlock_ms, length, deliberation=1000, spacing=400):
    steps = [("unlock", unlock_ms)]
    steps += [("right", unlock_ms + deliberation + i * spacing) for i in range(length)]
    return steps


CLEAN = clear_round(1000, 4) + clear_round(6000, 5)

PANIC = (
    [("unlock", 1000), ("right", 2000), ("wrong", 2400),
     ("right", 2500), ("right", 2600), ("right", 2700)]   # mashing during the locked replay
    + clear_round(6000, 4) + clear_round(10000, 5)
)

CALM_ERROR = (
    [("unlock", 1000), ("right", 2000), ("wrong", 2400)]
    + clear_round(6000, 4) + clear_round(10000, 5)
)


# --- Radial layout ----------------------------------------------------------

def test_five_nodes_sit_on_the_ring():
    pts = node_positions(CX, CY, R)
    assert len(pts) == NODE_COUNT == 5
    for x, y in pts:
        assert math.isclose(math.hypot(x - CX, y - CY), R)


def test_node_order_matches_clockwise_diagram():
    pts = node_positions(CX, CY, R)
    top, right, bottom_right, bottom_left, left = pts
    assert math.isclose(top[0], CX) and math.isclose(top[1], CY - R)
    assert right[0] > CX and right[1] < CY
    assert bottom_right[0] > CX and bottom_right[1] > CY
    assert bottom_left[0] < CX and bottom_left[1] > CY
    assert left[0] < CX and left[1] < CY


def test_ring_is_mirror_symmetric_and_evenly_spaced():
    pts = node_positions(CX, CY, R)
    assert math.isclose(pts[1][0] - CX, CX - pts[4][0])
    assert math.isclose(pts[2][0] - CX, CX - pts[3][0])
    sides = [math.dist(pts[i], pts[(i + 1) % 5]) for i in range(5)]
    assert all(math.isclose(s, sides[0]) for s in sides)


def test_hit_node_detects_inside_and_rejects_background():
    pts = node_positions(CX, CY, R)
    for i, (x, y) in enumerate(pts):
        assert hit_node(x + 10, y - 10, pts, 58) == i
    assert hit_node(CX, CY, pts, 58) is None
    assert hit_node(5, 5, pts, 58) is None


# --- Sequence generation ----------------------------------------------------

def test_sequence_has_requested_length_valid_indices_and_no_immediate_repeats():
    seq = generate_sequence(random.Random(1), 50)
    assert len(seq) == 50
    assert all(0 <= n < NODE_COUNT for n in seq)
    assert all(a != b for a, b in zip(seq, seq[1:]))


def test_sequence_is_deterministic_per_seed():
    assert generate_sequence(random.Random(9), 8) == generate_sequence(random.Random(9), 8)


def test_sequence_needs_at_least_two_nodes():
    with pytest.raises(ValueError):
        generate_sequence(random.Random(0), 4, node_count=1)


# --- Sequence state machine -------------------------------------------------

def test_game_starts_locked_in_playback_at_length_four():
    game = GlyphSequenceGame(seed=3)
    assert game.phase == PLAYBACK
    assert len(game.sequence) == START_LENGTH == 4
    assert game.expected is None


def test_clicks_during_playback_are_locked_and_change_nothing():
    game = GlyphSequenceGame(seed=3)
    before = list(game.sequence)
    assert game.press(game.sequence[0]) == LOCKED
    assert game.phase == PLAYBACK and game.step == 0 and game.sequence == before


def test_finish_playback_unlocks_once():
    game = GlyphSequenceGame(seed=3)
    assert game.finish_playback() is True
    assert game.phase == INPUT and game.expected == game.sequence[0]
    assert game.finish_playback() is False


def test_inert_click_in_input_does_not_advance_or_reset():
    game = GlyphSequenceGame(seed=3)
    game.finish_playback()
    game.press(game.expected)
    assert game.press(None) == INERT
    assert game.step == 1 and game.phase == INPUT


def test_full_correct_replication_grows_sequence_and_replays():
    game = GlyphSequenceGame(seed=3)
    game.finish_playback()
    outcomes = [game.press(game.expected) for _ in range(4)]
    assert outcomes == [CORRECT, CORRECT, CORRECT, ROUND_CLEAR]
    assert game.phase == PLAYBACK
    assert len(game.sequence) == 5
    assert game.rounds_cleared == 1 and game.best_span == 4


def test_error_resets_trace_to_step_one_and_replays_same_pattern():
    game = GlyphSequenceGame(seed=3)
    pattern = list(game.sequence)
    game.finish_playback()
    game.press(game.expected)
    game.press(game.expected)
    wrong = (game.expected + 1) % NODE_COUNT
    assert game.press(wrong) == ERROR
    assert game.step == 0 and game.phase == PLAYBACK
    assert game.sequence == pattern


def test_press_rejects_out_of_range_nodes():
    game = GlyphSequenceGame(seed=3)
    game.finish_playback()
    for bad in (-1, NODE_COUNT, True, "1", 1.0):
        with pytest.raises(ValueError):
            game.press(bad)


def test_same_seed_and_inputs_reproduce_the_same_session():
    a, b = GlyphSequenceGame(seed=21), GlyphSequenceGame(seed=21)
    for game in (a, b):
        game.finish_playback()
        for _ in range(4):
            game.press(game.expected)
    assert a.sequence == b.sequence


# --- Replay summary ---------------------------------------------------------

def test_clean_session_metrics():
    m = summarise_session(11, script(11, CLEAN))
    assert m["scored_clicks"] == 9 and m["correct_clicks"] == 9 and m["error_count"] == 0
    assert m["accuracy"] == 1.0
    assert m["rounds_cleared"] == 2 and m["best_span"] == 5
    assert m["median_deliberation_ms"] == 1000
    assert m["panic_clicks"] == 0


def test_accuracy_is_correct_over_scored_clicks_excluding_locked_and_inert():
    m = summarise_session(11, script(11, PANIC))
    assert m["total_clicks"] == 14
    assert m["locked_clicks"] == 3
    assert m["scored_clicks"] == 11
    assert m["accuracy"] == pytest.approx(10 / 11)


def test_rapid_clicks_after_an_error_count_as_panic():
    m = summarise_session(11, script(11, PANIC))
    assert m["error_count"] == 1
    assert m["panic_clicks"] == 3
    assert m["panic_ratio"] == 1.0


def test_calm_recovery_after_error_is_not_panic():
    m = summarise_session(11, script(11, CALM_ERROR))
    assert m["error_count"] == 1
    assert m["panic_clicks"] == 0
    assert m["panic_ratio"] == 0.0


def test_fast_confident_correct_clicks_are_not_penalised():
    fast = clear_round(1000, 4, spacing=150) + clear_round(6000, 5, spacing=150)
    profile = compile_profile(summarise_session(11, script(11, fast)))
    assert profile["system_stability"] == 1.0
    assert profile["trial_and_error"] == 0.0


def test_deliberation_runs_from_unlock_to_first_click_of_any_kind():
    steps = [("unlock", 1000), ("inert", 1800)] + [("right", 2500 + i * 300) for i in range(4)]
    m = summarise_session(11, script(11, steps))
    assert m["median_deliberation_ms"] == 800


def test_duplicate_unlock_events_do_not_restart_the_deliberation_clock():
    events = script(11, [("unlock", 1000)])
    events.append(ev(PLAYBACK_END_EVENT, 1900, {}))
    events += script(11, [("unlock", 0), ("right", 2000)])[2:]
    m = summarise_session(11, events)
    assert m["median_deliberation_ms"] == 1000


def test_replay_ignores_tampered_node_indices():
    events = script(11, [("unlock", 1000)])
    for i, bad in enumerate((7, -1, True, "1", 2.0)):
        events.append(ev(NODE_CLICK_EVENT, 1100 + i, {"selected_node_index": bad, "expected_node_index": bad}))
    events.append(ev(NODE_CLICK_EVENT, 1200, None))
    m = summarise_session(11, events)
    assert m["total_clicks"] == 0


def test_replay_does_not_trust_client_expected_or_outcome_fields():
    events = script(11, [("unlock", 1000), ("wrong", 2000)])
    forged = events[-1]["data"]
    forged["expected_node_index"] = forged["selected_node_index"]
    forged["outcome"] = "correct"
    m = summarise_session(11, events)
    assert m["error_count"] == 1 and m["correct_clicks"] == 0


# --- Profile compilation ----------------------------------------------------

def test_profile_has_exactly_the_canonical_keys_in_unit_range():
    profile = compile_profile(summarise_session(11, script(11, PANIC)))
    assert list(profile) == FEATURE_ORDER
    for value in profile.values():
        assert isinstance(value, float) and 0.0 <= value <= 1.0
    probs = StreamTransformationEngine().recommend(profile)
    assert math.isclose(sum(probs.values()), 1.0)


def test_unmeasured_features_are_zero():
    profile = compile_profile(summarise_session(11, script(11, PANIC)))
    for feature in FEATURE_ORDER:
        if feature not in MEASURED_FEATURES:
            assert profile[feature] == 0.0


def test_icar_series_is_the_accuracy_ratio():
    profile = compile_profile(summarise_session(11, script(11, PANIC)))
    assert profile["icar_letter_number_series"] == pytest.approx(10 / 11)


def test_panic_lowers_stability_and_raises_trial_and_error():
    panic = compile_profile(summarise_session(11, script(11, PANIC)))
    calm = compile_profile(summarise_session(11, script(11, CALM_ERROR)))
    assert panic["system_stability"] == pytest.approx(1 - 3 / 14)
    assert calm["system_stability"] == 1.0
    assert panic["trial_and_error"] == 1.0
    assert calm["trial_and_error"] == 0.0


def test_ddm_scales_median_deliberation():
    profile = compile_profile(summarise_session(11, script(11, CLEAN)))
    assert profile["ddm_boundary_separation"] == pytest.approx(1000 / 2500)
    assert profile["riasec_investigative"] == pytest.approx(1000 / 2500)  # perfectly steady pauses


def test_steady_pauses_score_more_investigative_than_erratic_ones():
    steady = clear_round(1000, 4, 1500) + clear_round(8000, 5, 1500) + clear_round(16000, 6, 1500)
    erratic = clear_round(1000, 4, 500) + clear_round(8000, 5, 1500) + clear_round(16000, 6, 2500)
    p_steady = compile_profile(summarise_session(11, script(11, steady)))
    p_erratic = compile_profile(summarise_session(11, script(11, erratic)))
    assert p_steady["ddm_boundary_separation"] == p_erratic["ddm_boundary_separation"]
    assert p_steady["riasec_investigative"] > p_erratic["riasec_investigative"]


def test_too_little_evidence_scores_nothing():
    steps = [("unlock", 1000), ("right", 2000), ("right", 2400)]
    profile = compile_profile(summarise_session(11, script(11, steps)))
    assert all(v == 0.0 for v in profile.values())


def test_empty_session_gives_uniform_streams():
    profile = compile_profile(summarise_session(11, script(11, [])))
    probs = StreamTransformationEngine().recommend(profile)
    assert all(math.isclose(p, 1 / len(STREAMS)) for p in probs.values())


# --- Pygame shell smoke test ------------------------------------------------

def test_app_locks_during_playback_records_clicks_and_scores_on_quit(capsys):
    os.environ.setdefault("SDL_VIDEODRIVER", "dummy")
    os.environ.setdefault("SDL_AUDIODRIVER", "dummy")
    pygame = pytest.importorskip("pygame")
    from engine.glyph_app import GlyphResearchApp

    app = GlyphResearchApp(seed=5)
    first = app.game.sequence[0]
    target = tuple(int(c) for c in app.positions[first])

    app.handle_click(target, 1, "mouse")          # still in playback -> locked
    assert app.game.step == 0
    app.update(60_000)                            # run playback to completion
    assert app.game.phase == INPUT
    app.handle_click(target, 1, "mouse")          # correct first node
    app.handle_click((5, 5), 1, "mouse")          # background
    assert app.game.step == 1

    pygame.event.post(pygame.event.Event(pygame.QUIT))
    result = app.run()

    kinds = [e["event_type"] for e in app.events]
    assert kinds == [START_EVENT, NODE_CLICK_EVENT, PLAYBACK_END_EVENT, NODE_CLICK_EVENT, INERT_CLICK_EVENT]
    for e in app.events[1:]:
        assert e["monotonic_ms"] >= 0
    clicks = [e for e in app.events if e["event_type"] in (NODE_CLICK_EVENT, INERT_CLICK_EVENT)]
    for e in clicks:
        assert "selected_node_index" in e["data"] and "expected_node_index" in e["data"]
    assert clicks[0]["data"]["expected_node_index"] is None       # locked
    assert clicks[1]["data"]["expected_node_index"] == first
    assert clicks[2]["data"]["selected_node_index"] is None

    assert list(result["profile"]) == FEATURE_ORDER
    assert math.isclose(sum(result["probabilities"].values()), 1.0)
    assert "Pre-Medical" in capsys.readouterr().out


def test_consented_glyph_session_is_streamed_and_rescores_identically(tmp_path):
    os.environ.setdefault("SDL_VIDEODRIVER", "dummy")
    os.environ.setdefault("SDL_AUDIODRIVER", "dummy")
    pygame = pytest.importorskip("pygame")
    from engine.glyph_app import GlyphResearchApp
    from engine.session_log import SessionLogConfig, load_session, recompute

    config = SessionLogConfig("LHR-P042", True, "PCF-1.0", tmp_path / "logs", tmp_path / "fallback")
    app = GlyphResearchApp(seed=5, log_config=config, calibration={"median_inter_input_ms": 380.0, "samples": 7, "input_type": "mouse", "measured": True})
    app.update(60_000)
    app.handle_click(tuple(int(c) for c in app.positions[app.game.sequence[0]]), 1, "touch")
    pygame.event.post(pygame.event.Event(pygame.QUIT))
    result = app.run()

    [path] = (tmp_path / "logs" / "LHR-P042").glob("research_sector_*.jsonl")
    record = load_session(path)
    assert record["complete"] is True
    assert record["replay_inputs"] == {"seed": 5}
    assert record["device"]["input_types"] == ["mouse", "touch"]
    assert recompute(record)["profile"] == result["profile"]
