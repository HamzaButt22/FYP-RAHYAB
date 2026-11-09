# -*- coding: utf-8 -*-
"""Game 2 - The Research Sector (rhythmic glyph sequences).

Run from career-game-prototype/:  python -m engine.glyph_app
Watch the ring flash a pattern (hub glows amber = locked), then replay it once the hub turns cyan.
Closing the window scores the session and prints FBISE stream probabilities.
Pilot sessions:  python -m engine.glyph_app --participant P001 --consent --consent-form PCF-1.0  (calibrates, then logs)
"""
import math
import platform
import secrets
import sys
import time
import uuid

import pygame

from engine.glyph_sequence import (
    ERROR,
    INERT_CLICK_EVENT,
    INPUT,
    MEASURED_FEATURES,
    NODE_CLICK_EVENT,
    NODE_COUNT,
    PLAYBACK,
    PLAYBACK_END_EVENT,
    ROUND_CLEAR,
    START_EVENT,
    START_LENGTH,
    GlyphSequenceGame,
    compile_profile,
    hit_node,
    node_positions,
    summarise_session,
)
from engine.calibration import PLACEHOLDER_CALIBRATION
from engine.calibration_app import calibrate
from engine.session_log import GAME_RESEARCH_SECTOR, SessionLogger, parse_session_args
from engine.session_report import print_profile_and_streams
from engine.stream_transformation_engine import StreamTransformationEngine
from engine.telemetry_schema import SCHEMA_VERSION, SchemaValidationError, TelemetrySession

SCREEN_W, SCREEN_H = 1024, 768
FPS = 60
CENTRE = (SCREEN_W / 2, SCREEN_H / 2)
RING_RADIUS = 220
NODE_RADIUS = 58
HUB_RADIUS = 46

LEAD_IN_MS = 800       # pause before the first flash (also covers the clear/error feedback)
FLASH_MS = 480
GAP_MS = 220
PRESS_GLOW_MS = 160
FEEDBACK_MS = 600

BG = (12, 12, 22)
RING = (40, 44, 70)
NODE_RIM = (10, 10, 18)
HUB_LOCKED = (255, 170, 40)
HUB_INPUT = (0, 215, 255)
HUB_ERROR = (255, 70, 90)
HUB_CLEAR = (90, 255, 120)
DOT_EMPTY = (60, 64, 90)
NODE_HUES = [(255, 196, 40), (0, 215, 255), (90, 255, 120), (255, 90, 160), (170, 120, 255)]


def _dim(colour, factor):
    return tuple(int(c * factor) for c in colour)


class GlyphResearchApp:
    def __init__(self, seed=None, log_config=None, calibration=None):
        if log_config is not None and (calibration or {}).get("measured") is not True:
            raise ValueError("Logged sessions need a measured calibration baseline.")
        pygame.init()
        self.screen = pygame.display.set_mode((SCREEN_W, SCREEN_H))
        pygame.display.set_caption("RahYaab - The Research Sector")
        self.clock = pygame.time.Clock()

        self.seed = seed if seed is not None else secrets.randbits(32)
        self.game = GlyphSequenceGame(self.seed)
        self.positions = node_positions(*CENTRE, RING_RADIUS)
        self.playback_ms = 0.0
        self.press_glow = [0.0] * NODE_COUNT
        self.feedback = None   # (colour, remaining ms)

        self.session = TelemetrySession(str(uuid.uuid4()), calibration or PLACEHOLDER_CALIBRATION)
        self.logger = None
        if log_config is not None:
            self.logger = SessionLogger(
                log_config, game=GAME_RESEARCH_SECTOR, session_id=self.session.session_id,
                calibration_baseline=self.session.calibration_baseline,
                replay_inputs={"seed": self.seed},
                device={"platform": platform.system(), "screen_w": SCREEN_W, "screen_h": SCREEN_H},
            )
        self.events = []
        self._t0_ns = time.monotonic_ns()
        # The seed lets a server regenerate every pattern and re-score the click stream independently.
        self._record(START_EVENT, "mouse", {"seed": self.seed, "node_count": NODE_COUNT,
                                            "start_length": START_LENGTH}, 0.0)

    # --- Telemetry intake ---------------------------------------------------

    def _now_ms(self) -> float:
        return (time.monotonic_ns() - self._t0_ns) / 1_000_000

    def _record(self, event_type: str, input_type: str, data: dict, monotonic_ms: float) -> None:
        raw = {
            "event_id": str(uuid.uuid4()),
            "schema_version": SCHEMA_VERSION,
            "event_type": event_type,
            "monotonic_ms": monotonic_ms,
            "input_type": input_type,
            "data": data,
        }
        try:
            validated = self.session.register_event(raw)
        except SchemaValidationError as err:
            print(f"[TELEMETRY] dropped {event_type}: {err}", file=sys.stderr)
            return
        self.events.append(validated)
        if self.logger is not None:
            self.logger.append(validated)  # on disk before the next frame, so a crash keeps it

    def handle_click(self, pos: tuple, button: int, input_type: str) -> None:
        ms = self._now_ms()  # stamp before any game work so latency excludes our own processing
        node = hit_node(pos[0], pos[1], self.positions, NODE_RADIUS) if button == 1 else None
        expected = self.game.expected
        phase = self.game.phase
        outcome = self.game.press(node)
        self._record(NODE_CLICK_EVENT if node is not None else INERT_CLICK_EVENT, input_type, {
            "selected_node_index": node,
            "expected_node_index": expected,
            "phase": phase,
            "screen_x": pos[0],
            "screen_y": pos[1],
            "button": button,
        }, ms)

        if node is not None and phase == INPUT:
            self.press_glow[node] = PRESS_GLOW_MS
        if outcome == ERROR:
            self.feedback = (HUB_ERROR, FEEDBACK_MS)
            self.playback_ms = 0.0
        elif outcome == ROUND_CLEAR:
            self.feedback = (HUB_CLEAR, FEEDBACK_MS)
            self.playback_ms = 0.0

    # --- Playback timeline --------------------------------------------------

    def _playback_duration(self) -> float:
        return LEAD_IN_MS + len(self.game.sequence) * (FLASH_MS + GAP_MS)

    def lit_node(self):
        if self.game.phase != PLAYBACK:
            return None
        t = self.playback_ms - LEAD_IN_MS
        if t < 0:
            return None
        index, offset = divmod(t, FLASH_MS + GAP_MS)
        if index < len(self.game.sequence) and offset < FLASH_MS:
            return self.game.sequence[int(index)]
        return None

    def update(self, dt_ms: float) -> None:
        self.press_glow = [max(0.0, g - dt_ms) for g in self.press_glow]
        if self.feedback:
            colour, remaining = self.feedback
            self.feedback = (colour, remaining - dt_ms) if remaining > dt_ms else None
        if self.game.phase == PLAYBACK:
            self.playback_ms += dt_ms
            if self.playback_ms >= self._playback_duration() and self.game.finish_playback():
                self._record(PLAYBACK_END_EVENT, "mouse", {"sequence_length": len(self.game.sequence)}, self._now_ms())
                self.playback_ms = 0.0

    # --- Rendering ----------------------------------------------------------

    def _draw_glyph(self, centre: tuple, index: int, colour: tuple, scale: float) -> None:
        """Abstract non-verbal mark: a regular polygon with index + 3 sides."""
        sides, r = index + 3, 22 * scale
        pts = [(centre[0] + r * math.cos(-math.pi / 2 + 2 * math.pi * k / sides),
                centre[1] + r * math.sin(-math.pi / 2 + 2 * math.pi * k / sides)) for k in range(sides)]
        pygame.draw.polygon(self.screen, colour, pts, 4)

    def render(self) -> None:
        self.screen.fill(BG)
        pygame.draw.polygon(self.screen, RING, self.positions, 3)
        for p in self.positions:
            pygame.draw.line(self.screen, RING, CENTRE, p, 1)

        lit = self.lit_node()
        hover = hit_node(*pygame.mouse.get_pos(), self.positions, NODE_RADIUS) if self.game.phase == INPUT else None
        for i, centre in enumerate(self.positions):
            hue = NODE_HUES[i]
            active = i == lit or self.press_glow[i] > 0
            scale = 1.15 if active else 1.0
            radius = NODE_RADIUS * scale
            if active:
                pygame.draw.circle(self.screen, _dim(hue, 0.35), centre, radius + 14)
            pygame.draw.circle(self.screen, NODE_RIM, centre, radius + 4)
            pygame.draw.circle(self.screen, hue if active else _dim(hue, 0.28), centre, radius)
            if i == hover:
                pygame.draw.circle(self.screen, hue, centre, radius + 4, 3)
            self._draw_glyph(centre, i, NODE_RIM if active else _dim(hue, 0.7), scale)

        hub = self.feedback[0] if self.feedback else (HUB_INPUT if self.game.phase == INPUT else HUB_LOCKED)
        pygame.draw.circle(self.screen, _dim(hub, 0.25), CENTRE, HUB_RADIUS)
        pygame.draw.circle(self.screen, hub, CENTRE, HUB_RADIUS, 4)
        # Progress pips: one per step in the pattern, filled as the player replicates it.
        n = len(self.game.sequence)
        for k in range(n):
            a = -math.pi / 2 + 2 * math.pi * k / n
            pip = (CENTRE[0] + 30 * math.cos(a), CENTRE[1] + 30 * math.sin(a))
            pygame.draw.circle(self.screen, hub if k < self.game.step else DOT_EMPTY, pip, 4)
        pygame.display.flip()

    # --- Loop and psychometric handshake -----------------------------------

    def run(self) -> dict:
        running = True
        while running:
            for event in pygame.event.get():
                if event.type == pygame.QUIT:
                    running = False
                elif event.type == pygame.MOUSEBUTTONDOWN:
                    # pygame-ce flags touch-synthesised mouse events, so touch isn't double counted.
                    input_type = "touch" if getattr(event, "touch", False) else "mouse"
                    self.handle_click(event.pos, event.button, input_type)
            dt = self.clock.tick(FPS)
            if running:
                self.update(dt)
                self.render()
        result = self.finish()
        pygame.quit()
        return result

    def finish(self) -> dict:
        metrics = summarise_session(self.seed, self.events)
        profile = compile_profile(metrics)
        probabilities = StreamTransformationEngine().recommend(profile)
        print_report(self.session.session_id, len(self.events), metrics, profile, probabilities)
        log_path = None
        if self.logger is not None:
            log_path = self.logger.close(metrics, profile, probabilities)
            print(f"Session log written: {log_path}" if log_path
                  else "SESSION NOT SAVED - see [SESSION LOG] errors above.")
        return {"metrics": metrics, "profile": profile, "probabilities": probabilities, "log_path": log_path}


def print_report(session_id: str, event_count: int, metrics: dict, profile: dict, probabilities: dict) -> None:
    rule = "=" * 60
    print(f"\n{rule}\nRESEARCH SECTOR SESSION {session_id}\n{rule}")
    print(f"Validated telemetry events : {event_count}")
    print(f"Node clicks (correct/scored): {metrics['correct_clicks']} / {metrics['scored_clicks']}"
          f"  (+{metrics['locked_clicks']} locked, {metrics['inert_clicks']} background)")
    print(f"Rounds cleared / best span : {metrics['rounds_cleared']} / {metrics['best_span']}")
    print(f"Errors / panic bursts      : {metrics['error_count']} / {metrics['panic_clicks']} rapid clicks")
    print(f"Median parse pause         : {metrics['median_deliberation_ms']:.0f} ms")
    print_profile_and_streams(profile, probabilities, MEASURED_FEATURES)
    print(rule)


if __name__ == "__main__":
    seed, log_config = parse_session_args(sys.argv[1:], "RahYaab Game 2 - The Research Sector")
    calibration = None
    if log_config is not None:
        calibration = calibrate(SCREEN_W, SCREEN_H, "RahYaab - The Research Sector")
        if calibration is None:
            sys.exit("Calibration window closed - no session started.")
    GlyphResearchApp(seed=seed, log_config=log_config, calibration=calibration).run()
