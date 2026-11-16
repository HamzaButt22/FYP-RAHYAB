# -*- coding: utf-8 -*-
"""Per-device input calibration: a wordless tap-the-moving-target round played before each game.

Touch and mouse differ in raw pointing speed; without a per-device baseline that difference would
leak into latency-based features (deliberation, panic bursts) and read as a personality trait.
Raw intervals are kept so analysis can re-filter or model the device as a covariate later.

Pure Python with no pygame dependency, so every rule here ports 1:1 to a Unity C# script.
"""
import math
import statistics
from collections import Counter

TARGET_COUNT = 8           # targets on the ring
RING_STEP = 3              # coprime with TARGET_COUNT: visits every target, every hop the same length
RING_FRACTION = 0.3        # ring radius as a fraction of the shorter screen side
TARGET_RADIUS = 40.0       # hit radius in screen pixels
REQUIRED_INTERVALS = 7     # valid tap-to-tap intervals needed (8 clean taps)
MIN_GAP_MS = 80.0          # faster than any human re-aim: a double registration, not a tap
MAX_GAP_MS = 4000.0        # slower than this: the player looked away, so re-anchor instead of counting

# Used only when no calibration round was played (dev runs, tests). Flagged so analysis can exclude it.
PLACEHOLDER_CALIBRATION = {"median_inter_input_ms": 250.0, "samples": 1, "measured": False}


def target_positions(screen_w: float, screen_h: float) -> list:
    """Ring positions in visiting order (star pattern), centred on screen."""
    cx, cy = screen_w / 2, screen_h / 2
    radius = RING_FRACTION * min(screen_w, screen_h)
    order = [(k * RING_STEP) % TARGET_COUNT for k in range(TARGET_COUNT)]
    return [(cx + radius * math.cos(2 * math.pi * i / TARGET_COUNT - math.pi / 2),
             cy + radius * math.sin(2 * math.pi * i / TARGET_COUNT - math.pi / 2)) for i in order]


class CalibrationRound:
    def __init__(self, positions: list, radius: float = TARGET_RADIUS):
        self.positions = positions
        self.radius = radius
        self.hits = 0
        self.misses = 0
        self.intervals = []      # every hit-to-hit gap, excluded ones included
        self.valid = []
        self.input_types = []
        self._last_hit_ms = None

    @property
    def done(self) -> bool:
        return len(self.valid) >= REQUIRED_INTERVALS

    @property
    def target(self):
        return None if self.done else self.positions[self.hits % len(self.positions)]

    @property
    def progress(self) -> float:
        return min(1.0, len(self.valid) / REQUIRED_INTERVALS)

    def press(self, x: float, y: float, monotonic_ms: float, input_type: str) -> bool:
        target = self.target
        if target is None:
            return False
        if math.dist((x, y), target) > self.radius:
            self.misses += 1
            return False
        if self._last_hit_ms is not None:
            gap = monotonic_ms - self._last_hit_ms
            self.intervals.append(gap)
            if MIN_GAP_MS <= gap <= MAX_GAP_MS:
                self.valid.append(gap)
        self._last_hit_ms = monotonic_ms
        self.hits += 1
        self.input_types.append(input_type)
        return True

    def baseline(self) -> dict:
        if not self.done:
            raise ValueError("Calibration round is not finished.")
        return {
            "median_inter_input_ms": float(statistics.median(self.valid)),
            "samples": len(self.valid),
            "input_type": Counter(self.input_types).most_common(1)[0][0],
            "measured": True,
            "intervals_ms": list(self.intervals),
            "excluded_intervals": len(self.intervals) - len(self.valid),
            "misses": self.misses,
        }
