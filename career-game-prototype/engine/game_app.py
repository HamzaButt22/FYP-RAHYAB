# -*- coding: utf-8 -*-
"""Game 1 - The Power Sector (isometric energy grid routing).

Run from career-game-prototype/:  python -m engine.game_app
Rotate conduits to carry power from the generator (left) to the colony battery (right).
Closing the window scores the session and prints FBISE stream probabilities.
Pilot sessions:  python -m engine.game_app --participant P001 --consent --consent-form PCF-1.0  (calibrates, then logs)
"""
import math
import platform
import random
import sys
import time
import uuid

import pygame

from engine.power_grid import (
    E, N, S, W,
    MEASURED_FEATURES,
    ROTATION_EVENT,
    START_EVENT,
    PowerGrid,
    compile_profile,
    grid_to_screen,
    screen_to_grid,
    summarise_session,
)
from engine.calibration import PLACEHOLDER_CALIBRATION
from engine.calibration_app import calibrate
from engine.session_log import GAME_POWER_SECTOR, SessionLogger, parse_session_args
from engine.session_report import print_profile_and_streams
from engine.stream_transformation_engine import StreamTransformationEngine
from engine.telemetry_schema import SCHEMA_VERSION, SchemaValidationError, TelemetrySession

SCREEN_W, SCREEN_H = 1024, 768
FPS = 60
GRID_SIZE = 4
TILE_W, TILE_H = 160, 80
TILE_DEPTH = 14
SPIN_SPEED_DEG_PER_S = 900.0

BG = (14, 16, 24)
TILE_TOP = (30, 36, 50)
TILE_TOP_HOVER = (44, 56, 80)
TILE_EDGE = (58, 68, 90)
TILE_EDGE_HOVER = (0, 215, 255)
TILE_LEFT = (20, 24, 34)
TILE_RIGHT = (24, 29, 41)
CONDUIT_CASING = (10, 12, 18)
CONDUIT_DEAD = (88, 98, 118)
CONDUIT_LIVE = (0, 230, 200)
GENERATOR = (255, 196, 40)
BATTERY_EMPTY = (70, 40, 40)
BATTERY_FULL = (90, 255, 120)

# Grid-space angle of each side (y grows downward, so clockwise = increasing angle).
SIDE_ANGLE = {E: 0.0, S: 90.0, W: 180.0, N: 270.0}


class PowerSectorApp:
    def __init__(self, seed=None, log_config=None, calibration=None):
        if log_config is not None and (calibration or {}).get("measured") is not True:
            raise ValueError("Logged sessions need a measured calibration baseline.")
        pygame.init()
        self.screen = pygame.display.set_mode((SCREEN_W, SCREEN_H))
        pygame.display.set_caption("RahYaab - The Power Sector")
        self.clock = pygame.time.Clock()

        self.tile_w, self.tile_h = TILE_W, TILE_H
        self.offset_x = SCREEN_W / 2
        self.offset_y = (SCREEN_H - GRID_SIZE * TILE_H) / 2

        self.grid = PowerGrid.generate(GRID_SIZE, random.Random(seed))
        self.initial_grid = self.grid.copy()
        # Visual lag (degrees) per tile so a click animates the quarter turn; logic is already rotated.
        self.spin = [[0.0] * GRID_SIZE for _ in range(GRID_SIZE)]

        self.session = TelemetrySession(str(uuid.uuid4()), calibration or PLACEHOLDER_CALIBRATION)
        self.logger = None
        if log_config is not None:
            self.logger = SessionLogger(
                log_config, game=GAME_POWER_SECTOR, session_id=self.session.session_id,
                calibration_baseline=self.session.calibration_baseline,
                replay_inputs={"tiles": self.initial_grid.tiles, "source": list(self.initial_grid.source),
                               "source_side": self.initial_grid.source_side, "sink": list(self.initial_grid.sink),
                               "sink_side": self.initial_grid.sink_side},
                device={"platform": platform.system(), "screen_w": SCREEN_W, "screen_h": SCREEN_H},
            )
        self.events = []
        self._t0_ns = time.monotonic_ns()
        self._record(START_EVENT, "mouse", {"grid_size": GRID_SIZE, "tiles": [list(c) for c in self.grid.tiles]}, 0.0)

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
        gx, gy = screen_to_grid(pos[0], pos[1], self.tile_w, self.tile_h, self.offset_x, self.offset_y)
        on_grid = self.grid.in_bounds(gx, gy)
        if on_grid and button == 1:
            self.grid.rotate(gx, gy)
            self.spin[gx][gy] -= 90.0
            event_type = ROTATION_EVENT
        else:
            event_type = "inert_click"
        self._record(event_type, input_type, {
            "grid_x": gx if on_grid else None,
            "grid_y": gy if on_grid else None,
            "screen_x": pos[0],
            "screen_y": pos[1],
            "button": button,
        }, ms)

    # --- Rendering ----------------------------------------------------------

    def _project(self, gx: float, gy: float) -> tuple:
        return grid_to_screen(gx, gy, self.tile_w, self.tile_h, self.offset_x, self.offset_y)

    def _draw_tile(self, x: int, y: int, hovered: bool, live: bool) -> None:
        top, right, bottom, left = (self._project(x, y), self._project(x + 1, y),
                                    self._project(x + 1, y + 1), self._project(x, y + 1))
        drop = lambda p: (p[0], p[1] + TILE_DEPTH)
        pygame.draw.polygon(self.screen, TILE_LEFT, [left, bottom, drop(bottom), drop(left)])
        pygame.draw.polygon(self.screen, TILE_RIGHT, [bottom, right, drop(right), drop(bottom)])
        pygame.draw.polygon(self.screen, TILE_TOP_HOVER if hovered else TILE_TOP, [top, right, bottom, left])
        pygame.draw.polygon(self.screen, TILE_EDGE_HOVER if hovered else TILE_EDGE, [top, right, bottom, left], 2)

        cx, cy = x + 0.5, y + 0.5
        centre = self._project(cx, cy)
        colour = CONDUIT_LIVE if live else CONDUIT_DEAD
        mask = self.grid.tiles[x][y]
        for side, base in SIDE_ANGLE.items():
            if not mask & side:
                continue
            a = math.radians(base + self.spin[x][y])
            end = self._project(cx + 0.5 * math.cos(a), cy + 0.5 * math.sin(a))
            pygame.draw.line(self.screen, CONDUIT_CASING, centre, end, 12)
            pygame.draw.line(self.screen, colour, centre, end, 6)
        pygame.draw.circle(self.screen, CONDUIT_CASING, centre, 9)
        pygame.draw.circle(self.screen, colour, centre, 6)

    def _draw_terminals(self, solved: bool, pulse: float) -> None:
        sx, sy = self.grid.source
        gen_edge = self._project(sx, sy + 0.5)
        gen_pos = self._project(sx - 0.7, sy + 0.5)
        pygame.draw.line(self.screen, CONDUIT_LIVE, gen_pos, gen_edge, 6)
        pygame.draw.circle(self.screen, GENERATOR, gen_pos, 20 + 3 * pulse)
        pygame.draw.circle(self.screen, BG, gen_pos, 9)

        kx, ky = self.grid.sink
        bat_edge = self._project(kx + 1, ky + 0.5)
        bat_x, bat_y = self._project(kx + 1.7, ky + 0.5)
        pygame.draw.line(self.screen, CONDUIT_LIVE if solved else CONDUIT_DEAD, bat_edge, (bat_x, bat_y), 6)
        body = pygame.Rect(0, 0, 34, 54)
        body.center = (bat_x, bat_y)
        cap = pygame.Rect(0, 0, 14, 6)
        cap.midbottom = body.midtop
        fill_colour = BATTERY_FULL if solved else BATTERY_EMPTY
        if solved:
            pygame.draw.rect(self.screen, BATTERY_FULL, body.inflate(10 + 8 * pulse, 10 + 8 * pulse), 2, border_radius=8)
        pygame.draw.rect(self.screen, CONDUIT_CASING, body, border_radius=5)
        pygame.draw.rect(self.screen, fill_colour, body.inflate(-8, -8), border_radius=3)
        pygame.draw.rect(self.screen, TILE_EDGE, cap)

    def render(self) -> None:
        self.screen.fill(BG)
        hx, hy = screen_to_grid(*pygame.mouse.get_pos(), self.tile_w, self.tile_h, self.offset_x, self.offset_y)
        live = self.grid.energized()
        solved = self.grid.is_solved()
        pulse = 0.5 + 0.5 * math.sin(pygame.time.get_ticks() / 250.0)
        # Painter's order: back rows (small x+y) first so front tiles overlap their side faces.
        for x, y in sorted(((x, y) for x in range(GRID_SIZE) for y in range(GRID_SIZE)), key=lambda c: c[0] + c[1]):
            self._draw_tile(x, y, (x, y) == (hx, hy), (x, y) in live)
        self._draw_terminals(solved, pulse)
        pygame.display.flip()

    def _advance_spin(self, dt_s: float) -> None:
        step = SPIN_SPEED_DEG_PER_S * dt_s
        for column in self.spin:
            for y, lag in enumerate(column):
                column[y] = min(0.0, lag + step)

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
            self._advance_spin(self.clock.tick(FPS) / 1000.0)
            if running:
                self.render()
        result = self.finish()
        pygame.quit()
        return result

    def finish(self) -> dict:
        metrics = summarise_session(self.initial_grid, self.events)
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
    print(f"\n{rule}\nPOWER SECTOR SESSION {session_id}\n{rule}")
    print(f"Validated telemetry events : {event_count}")
    print(f"Rotations (total / optimal): {metrics['total_rotations']} / {metrics['optimal_rotations']}")
    solved = f"yes, at {metrics['solve_ms'] / 1000:.1f}s" if metrics["solved_final"] else "no"
    print(f"Battery powered at close   : {solved}")
    print(f"Median pre-tile latency    : {metrics['median_deliberation_ms']:.0f} ms")
    print(f"Post-solve tinkering clicks: {metrics['post_solve_rotations']}  (Realistic signal - no matrix key yet)")

    print_profile_and_streams(profile, probabilities, MEASURED_FEATURES)
    print(rule)


if __name__ == "__main__":
    seed, log_config = parse_session_args(sys.argv[1:], "RahYaab Game 1 - The Power Sector")
    calibration = None
    if log_config is not None:
        calibration = calibrate(SCREEN_W, SCREEN_H, "RahYaab - The Power Sector")
        if calibration is None:
            sys.exit("Calibration window closed - no session started.")
    PowerSectorApp(seed=seed, log_config=log_config, calibration=calibration).run()
