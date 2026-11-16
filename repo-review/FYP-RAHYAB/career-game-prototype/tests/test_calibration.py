import math
import statistics

import pytest

from engine.calibration import (
    MAX_GAP_MS,
    MIN_GAP_MS,
    PLACEHOLDER_CALIBRATION,
    REQUIRED_INTERVALS,
    TARGET_COUNT,
    CalibrationRound,
    target_positions,
)
from engine.telemetry_schema import TelemetrySession

W, H = 1024, 768


def tap_through(round_, gaps, input_type="touch", start_ms=1000.0):
    """Hits the current target once per gap; the first tap anchors the clock."""
    ms = start_ms
    round_.press(*round_.target, ms, input_type)
    for gap in gaps:
        if round_.done:
            break
        ms += gap
        round_.press(*round_.target, ms, input_type)
    return ms


def test_targets_hop_equal_distances_and_stay_on_screen():
    positions = target_positions(W, H)
    assert len(positions) == TARGET_COUNT
    hops = {round(math.dist(a, b), 6) for a, b in zip(positions, positions[1:])}
    assert len(hops) == 1, "every hop is the same length so devices are compared on the same motor task"
    assert all(0 < x < W and 0 < y < H for x, y in positions)


def test_misses_do_not_advance_but_are_counted():
    round_ = CalibrationRound(target_positions(W, H))
    first = round_.target
    assert round_.press(5, 5, 1000.0, "mouse") is False
    assert round_.target == first and round_.misses == 1


def test_baseline_is_median_of_valid_inter_tap_intervals():
    round_ = CalibrationRound(target_positions(W, H))
    gaps = [400, 420, 380, 450, 410, 395, 405]
    tap_through(round_, gaps)
    assert round_.done
    baseline = round_.baseline()
    assert baseline["median_inter_input_ms"] == statistics.median(gaps)
    assert baseline["samples"] == REQUIRED_INTERVALS
    assert baseline["input_type"] == "touch"
    assert baseline["measured"] is True
    assert baseline["intervals_ms"] == gaps


def test_distracted_pause_re_anchors_instead_of_counting():
    round_ = CalibrationRound(target_positions(W, H))
    gaps = [400, MAX_GAP_MS + 1] + [400] * REQUIRED_INTERVALS
    tap_through(round_, gaps)
    baseline = round_.baseline()
    assert baseline["median_inter_input_ms"] == 400
    # Raw intervals are kept (excluded one included) so a later analysis can re-filter them.
    assert baseline["intervals_ms"] == gaps[:REQUIRED_INTERVALS + 1]
    assert baseline["excluded_intervals"] == 1


def test_impossibly_fast_double_registration_is_excluded():
    round_ = CalibrationRound(target_positions(W, H))
    tap_through(round_, [MIN_GAP_MS - 1] + [500] * REQUIRED_INTERVALS)
    assert round_.baseline()["median_inter_input_ms"] == 500


def test_round_keeps_going_until_enough_valid_intervals():
    round_ = CalibrationRound(target_positions(W, H))
    tap_through(round_, [400] * (REQUIRED_INTERVALS - 1))
    assert not round_.done
    with pytest.raises(ValueError):
        round_.baseline()


def test_majority_input_type_wins():
    round_ = CalibrationRound(target_positions(W, H))
    ms = tap_through(round_, [400] * (REQUIRED_INTERVALS - 2), "touch")
    round_.press(*round_.target, ms + 400, "mouse")
    round_.press(*round_.target, ms + 800, "touch")
    assert round_.baseline()["input_type"] == "touch"


def test_baseline_is_accepted_by_the_telemetry_session():
    round_ = CalibrationRound(target_positions(W, H))
    tap_through(round_, [350] * REQUIRED_INTERVALS)
    session = TelemetrySession("s", round_.baseline())
    assert session.calibration_baseline["measured"] is True


def test_placeholder_is_flagged_unmeasured():
    assert PLACEHOLDER_CALIBRATION["measured"] is False
    TelemetrySession("s", PLACEHOLDER_CALIBRATION)
