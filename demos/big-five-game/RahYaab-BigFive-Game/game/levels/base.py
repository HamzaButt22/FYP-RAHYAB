"""Base class shared by the four scenario levels."""
from __future__ import annotations

import math
from typing import Optional

import pygame

from analytics.event_schema import EventType as E
from game import settings as S
from game.input_state import InputState
from game.player import Player
from game.session import GameSession
from game.ui import widgets as W
from game.ui.dialog import ChoiceDialog, MessageBox

RUNNING, COMPLETE, FAILED = "running", "complete", "failed"


class Level:
    level_id: int = 0
    name: str = ""
    scenario: str = ""
    intro: str = ""
    objective: str = ""
    controls_hint: str = "Move: WASD / Arrows     Interact: E or Space     Pause: P"
    start_pos = (60, 300)
    task_name: str = ""

    def __init__(self, session: GameSession, attempt: int = 1):
        self.session = session
        self.log = session.logger
        self.rng = session.rng
        self.attempt = attempt
        self.status = RUNNING
        self.fail_reason: Optional[str] = None
        self.outcome_lines: list[str] = []
        self.player = Player(*self.start_pos)
        self.modal = None                 # ChoiceDialog | MessageBox | custom panel with update/draw/done
        self.elapsed_ms = 0.0
        self.t0 = session.clock.ms
        self.toast = ""
        self.toast_ms = 0.0
        self.build()

    # --------------------------------------------------------- to be overridden
    def build(self) -> None: ...
    def level_start_metadata(self) -> dict: return {}
    def solids(self) -> list[pygame.Rect]: return []
    def on_update(self, dt: float, inp: InputState) -> None: ...
    def on_interact(self) -> None: ...
    def on_end(self) -> None: ...
    def draw_world(self, surf: pygame.Surface) -> None: ...
    def hud_extra(self) -> list[tuple[str, str]]: return []

    # ----------------------------------------------------------------- lifecycle
    def start(self) -> None:
        self.log.set_level(self.level_id)
        self.t0 = self.session.clock.ms
        self.log.log(E.LEVEL_START, action=self.name, attempt=self.attempt, scenario=self.scenario,
                     **self.level_start_metadata())
        self.log.log(E.TASK_START, action=self.task_name or self.name, attempt=self.attempt)

    def complete(self, **summary) -> None:
        if self.status != RUNNING:
            return
        self.status = COMPLETE
        self.on_end()
        dur = self.session.clock.ms - self.t0
        self.log.flush_movement()
        self.log.log(E.TASK_COMPLETE, action=self.task_name or self.name, attempt=self.attempt, duration_ms=round(dur))
        self.log.log(E.LEVEL_COMPLETE, action=self.name, attempt=self.attempt, duration_ms=round(dur), **summary)

    def fail(self, reason: str, **summary) -> None:
        if self.status != RUNNING:
            return
        self.status = FAILED
        self.fail_reason = reason
        self.on_end()
        dur = self.session.clock.ms - self.t0
        self.log.flush_movement()
        self.log.log(E.LEVEL_FAILED, action=self.name, attempt=self.attempt, reason=reason, duration_ms=round(dur), **summary)

    # ------------------------------------------------------------------ helpers
    def say(self, text: str, ms: float = 2600) -> None:
        self.toast, self.toast_ms = text, ms

    def open_choice(self, *args, **kwargs) -> ChoiceDialog:
        self.modal = ChoiceDialog(self.log, *args, **kwargs)
        return self.modal

    def open_message(self, *args, **kwargs) -> MessageBox:
        self.modal = MessageBox(*args, **kwargs)
        return self.modal

    def near(self, rect: pygame.Rect, rng_px: int = S.INTERACT_RANGE) -> bool:
        return rect.inflate(2 * rng_px, 2 * rng_px).collidepoint(self.player.pos)

    def dist_to(self, pos) -> float:
        return math.hypot(self.player.x - pos[0], self.player.y - pos[1])

    # ------------------------------------------------------------------- update
    def update(self, dt: float, inp: InputState) -> None:
        if self.status != RUNNING:
            return
        self.elapsed_ms += dt * 1000.0
        if self.toast_ms > 0:
            self.toast_ms -= dt * 1000.0
        if self.modal is not None:
            self.modal.update(inp)
            if getattr(self.modal, "done", False):
                self.modal = None
            self.on_update_modal(dt, inp)
            return
        self.player.update(dt, inp.dx, inp.dy, self.solids())
        self.log.track_movement(self.player.x, self.player.y, dt, self.player.direction)
        if inp.interact and not self.player.frozen:
            self.on_interact()
        self.on_update(dt, inp)

    def on_update_modal(self, dt: float, inp: InputState) -> None:
        """Hook for levels whose clocks keep running while a dialog is open (pressure level)."""

    # --------------------------------------------------------------------- draw
    def draw(self, screen: pygame.Surface) -> None:
        world = pygame.Surface((S.WORLD_W, S.WORLD_H))
        self.draw_world(world)
        self._draw_player(world)
        self.draw_overlay(world)
        screen.blit(world, (0, S.HUD_H))
        self._draw_hud(screen)
        if self.toast_ms > 0 and self.modal is None:
            r = W.text(screen, self.toast, (S.SCREEN_W // 2, S.SCREEN_H - 40), 28, S.TEXT, anchor="center")
            box = r.inflate(36, 18)
            W.panel(screen, box, S.PANEL, S.ACCENT, 12, alpha=235)
            W.text(screen, self.toast, box.center, 28, S.TEXT, anchor="center")
        if self.modal is not None:
            self.modal.draw(screen)

    def draw_overlay(self, world: pygame.Surface) -> None:
        """Extra world-space overlay drawn above the player (prompts, hazards)."""

    def _draw_player(self, world: pygame.Surface) -> None:
        p = self.player
        for i, (tx, ty) in enumerate(p.trail[-10:]):
            a = int(10 + 12 * i)
            s = pygame.Surface((10, 10), pygame.SRCALPHA)
            pygame.draw.circle(s, (180, 210, 255, a), (5, 5), 4)
            world.blit(s, (tx - 5, ty - 5))
        W.shadow_circle(world, (p.x, p.y + p.radius - 4), p.radius)
        body = (250, 250, 255) if not p.frozen else (160, 170, 200)
        pygame.draw.circle(world, (60, 110, 220), (int(p.x), int(p.y)), p.radius + 2)
        pygame.draw.circle(world, body, (int(p.x), int(p.y)), p.radius - 1)
        fx, fy = p.facing
        pygame.draw.circle(world, (40, 60, 120), (int(p.x + fx * 5), int(p.y + fy * 5 - 1)), 3)

    def _draw_hud(self, screen: pygame.Surface) -> None:
        pygame.draw.rect(screen, S.PANEL, (0, 0, S.SCREEN_W, S.HUD_H))
        pygame.draw.line(screen, S.ACCENT, (0, S.HUD_H - 1), (S.SCREEN_W, S.HUD_H - 1), 2)
        W.text(screen, f"Level {self.level_id}: {self.name}", (24, 14), 34, S.TEXT, bold=True)
        W.text(screen, self.objective, (24, 50), 24, S.TEXT_DIM)
        W.text(screen, f"Attempt {self.attempt}/{S.MAX_ATTEMPTS}", (24, 72), 20, S.TEXT_DIM)
        x = S.SCREEN_W - 24
        for label, value in reversed(self.hud_extra()):
            r = W.text(screen, value, (x, 20), 34, S.GOLD, anchor="topright", bold=True)
            lr = W.text(screen, label, (r.right, 56), 20, S.TEXT_DIM, anchor="topright")
            x = min(r.left, lr.left) - 40
