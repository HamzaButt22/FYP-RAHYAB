# -*- coding: utf-8 -*-
"""Game 2 - The Research Sector: glyph sequence model, radial layout and telemetry-to-profile compiler.

Pure Python with no pygame dependency, so every rule here ports 1:1 to a Unity C# script.
"""
import math
import random
import statistics

from engine.stream_transformation_engine import FEATURE_ORDER

NODE_COUNT = 5
START_LENGTH = 4

START_EVENT = "session_start"
PLAYBACK_END_EVENT = "playback_end"
NODE_CLICK_EVENT = "node_click"
INERT_CLICK_EVENT = "inert_click"

PLAYBACK, INPUT = "playback", "input"
LOCKED, INERT, CORRECT, ERROR, ROUND_CLEAR = "locked", "inert", "correct", "error", "round_clear"

# Profile calibration constants.
RAPID_CLICK_MS = 280.0             # inter-click gap below this, chained after an error, = panic burst
DELIBERATION_CEILING_MS = 2500.0   # median unlock->first-click pause that maps to full DDM caution
MIN_SCORED_CLICKS = 8              # accuracy/panic features need at least this many input-phase node clicks
MIN_DELIBERATIONS = 2              # pause features need at least this many unlocks

# Unmeasured keys stay 0.0, which adds nothing to any stream's dot product.
MEASURED_FEATURES = (
    "system_stability",
    "trial_and_error",
    "ddm_boundary_separation",
    "icar_letter_number_series",
    "riasec_investigative",
)


def node_positions(cx: float, cy: float, radius: float, count: int = NODE_COUNT) -> list:
    """Node 0 at the top, then clockwise (screen y grows downward)."""
    return [
        (cx + radius * math.cos(-math.pi / 2 + 2 * math.pi * i / count),
         cy + radius * math.sin(-math.pi / 2 + 2 * math.pi * i / count))
        for i in range(count)
    ]


def hit_node(px: float, py: float, positions: list, node_radius: float):
    """Index of the nearest node whose disc contains the point, else None."""
    best, best_dist = None, None
    for i, (x, y) in enumerate(positions):
        dist = math.hypot(px - x, py - y)
        if dist <= node_radius and (best_dist is None or dist < best_dist):
            best, best_dist = i, dist
    return best


def generate_sequence(rng: random.Random, length: int, node_count: int = NODE_COUNT) -> list:
    """Random node indices with no immediate repeats (a double flash of one node is hard to read)."""
    if node_count < 2:
        raise ValueError("Need at least two nodes to avoid immediate repeats.")
    sequence = []
    while len(sequence) < length:
        node = rng.randrange(node_count)
        if not sequence or node != sequence[-1]:
            sequence.append(node)
    return sequence


def _valid_node(node, node_count: int) -> bool:
    return not isinstance(node, bool) and isinstance(node, int) and 0 <= node < node_count


class GlyphSequenceGame:
    """Locked playback -> player input -> clear (longer, new pattern) or error (trace reset, same pattern replays).

    Sequences come from a seeded RNG that only advances on a clear, so seed + click stream fully
    reproduces a session.
    """

    def __init__(self, seed, node_count: int = NODE_COUNT, start_length: int = START_LENGTH):
        self.node_count = node_count
        self._rng = random.Random(seed)
        self.sequence = generate_sequence(self._rng, start_length, node_count)
        self.phase = PLAYBACK
        self.step = 0
        self.rounds_cleared = 0
        self.best_span = 0

    @property
    def expected(self):
        return self.sequence[self.step] if self.phase == INPUT else None

    def finish_playback(self) -> bool:
        if self.phase != PLAYBACK:
            return False
        self.phase = INPUT
        self.step = 0
        return True

    def press(self, node) -> str:
        """`node` is a node index, or None for a background click."""
        if node is not None and not _valid_node(node, self.node_count):
            raise ValueError(f"Invalid node index: {node!r}")
        if self.phase != INPUT:
            return LOCKED
        if node is None:
            return INERT
        if node != self.sequence[self.step]:
            self.step = 0
            self.phase = PLAYBACK
            return ERROR
        self.step += 1
        if self.step < len(self.sequence):
            return CORRECT
        self.rounds_cleared += 1
        self.best_span = max(self.best_span, len(self.sequence))
        self.sequence = generate_sequence(self._rng, len(self.sequence) + 1, self.node_count)
        self.phase = PLAYBACK
        self.step = 0
        return ROUND_CLEAR


def _clamp01(value: float) -> float:
    return max(0.0, min(1.0, float(value)))


def summarise_session(seed, events: list) -> dict:
    """Replays validated telemetry through a fresh seeded model.

    Correctness is recomputed from the replay; client `expected_node_index` or outcome fields are ignored.
    """
    game = GlyphSequenceGame(seed)
    clicks = []          # (monotonic_ms, outcome) for every accepted click, locked ones included
    deliberations = []
    unlocked_at = None

    for event in events:
        kind = event.get("event_type")
        ms = event.get("monotonic_ms")
        if kind == PLAYBACK_END_EVENT:
            if game.finish_playback():
                unlocked_at = ms
            continue
        if kind == NODE_CLICK_EVENT:
            data = event.get("data")
            node = data.get("selected_node_index") if isinstance(data, dict) else None
            if not _valid_node(node, game.node_count):
                continue
        elif kind == INERT_CLICK_EVENT:
            node = None
        else:
            continue
        if unlocked_at is not None:
            deliberations.append(ms - unlocked_at)
            unlocked_at = None
        clicks.append((ms, game.press(node)))

    # Panic burst: the chain of clicks right after an error where every gap is under RAPID_CLICK_MS.
    panic_clicks = panicked_errors = 0
    i = 0
    while i < len(clicks):
        if clicks[i][1] != ERROR:
            i += 1
            continue
        j = i + 1
        while j < len(clicks) and clicks[j][0] - clicks[j - 1][0] < RAPID_CLICK_MS:
            j += 1
        burst = j - i - 1
        panic_clicks += burst
        panicked_errors += 1 if burst else 0
        i = j

    outcomes = [outcome for _, outcome in clicks]
    correct = outcomes.count(CORRECT) + outcomes.count(ROUND_CLEAR)
    errors = outcomes.count(ERROR)
    scored = correct + errors
    mean_delib = statistics.fmean(deliberations) if deliberations else 0.0
    return {
        "total_clicks": len(clicks),
        "locked_clicks": outcomes.count(LOCKED),
        "inert_clicks": outcomes.count(INERT),
        "scored_clicks": scored,
        "correct_clicks": correct,
        "error_count": errors,
        "accuracy": correct / scored if scored else 0.0,
        "panic_clicks": panic_clicks,
        "panic_ratio": panicked_errors / errors if errors else 0.0,
        "rounds_cleared": game.rounds_cleared,
        "best_span": game.best_span,
        "deliberation_count": len(deliberations),
        "median_deliberation_ms": statistics.median(deliberations) if deliberations else 0.0,
        "deliberation_cv": statistics.pstdev(deliberations) / mean_delib if mean_delib > 0 else 0.0,
    }


def compile_evidence(metrics: dict) -> dict:
    """Only the features this session produced evidence for: a missing key means 'not measured',
    which is distinct from a measured 0.0."""
    evidence = {}

    if metrics["scored_clicks"] >= MIN_SCORED_CLICKS:
        evidence["icar_letter_number_series"] = _clamp01(metrics["accuracy"])
        # Share of all clicks spent in post-error panic bursts.
        evidence["system_stability"] = _clamp01(1.0 - metrics["panic_clicks"] / metrics["total_clicks"])
        # Share of errors answered by frantic re-clicking instead of a reset pause.
        evidence["trial_and_error"] = _clamp01(metrics["panic_ratio"])

    if metrics["deliberation_count"] >= MIN_DELIBERATIONS:
        caution = _clamp01(metrics["median_deliberation_ms"] / DELIBERATION_CEILING_MS)
        evidence["ddm_boundary_separation"] = caution
        # Long *and* steady parsing pauses; erratic pauses discount the investigative signal.
        evidence["riasec_investigative"] = caution * _clamp01(1.0 - metrics["deliberation_cv"])

    return evidence


def compile_profile(metrics: dict) -> dict:
    """Maps a session summary onto the 13 canonical keys. 0.0 means 'no evidence from this game'."""
    evidence = compile_evidence(metrics)
    return {feature: evidence.get(feature, 0.0) for feature in FEATURE_ORDER}
