"""Modal dialogs.

ChoiceDialog is the main behavioural instrument: it measures decision latency
(DECISION -> DECISION_RESPONSE) and how often the player changed their highlighted
option before confirming ('second-guessing').
"""
from __future__ import annotations

from typing import Callable, Optional

import pygame

from game import settings as S
from game.input_state import InputState
from game.ui import widgets as W


class ChoiceDialog:
    def __init__(self, logger, decision_id: str, category: str, title: str, body: str, options: list[dict],
                 on_choice: Callable[[dict], None], on_check: Optional[Callable[[dict, "ChoiceDialog"], None]] = None,
                 context: Optional[dict] = None, speaker: Optional[str] = None, footer: str = ""):
        """options: [{'key','label','kind', 'risk_level'?}]. A `kind == 'check'` option does not close the
        dialog; it calls `on_check` (used for re-scanning) and the decision timer keeps running."""
        self.logger = logger
        self.decision_id = decision_id
        self.title, self.body, self.speaker, self.footer = title, body, speaker, footer
        self.options = options
        self.on_choice, self.on_check = on_choice, on_check
        self.index = 0
        self.done = False
        self.result: Optional[dict] = None
        self.flash = ""
        logger.begin_decision(decision_id, category, options, **(context or {}))

    # ------------------------------------------------------------------ logic
    def set_body(self, body: str) -> None:
        self.body = body

    def update(self, inp: InputState) -> None:
        if self.done:
            return
        if inp.up and self.index > 0:
            self.index -= 1
            self.logger.note_selection_change(self.decision_id)
        elif inp.down and self.index < len(self.options) - 1:
            self.index += 1
            self.logger.note_selection_change(self.decision_id)
        pick = None
        if inp.number is not None and 1 <= inp.number <= len(self.options):
            pick = inp.number - 1
        elif inp.accept:
            pick = self.index
        if pick is not None:
            self._choose(self.options[pick])

    def _choose(self, option: dict) -> None:
        if option.get("kind") == "check" and self.on_check is not None:
            self.on_check(option, self)
            return
        self.logger.end_decision(self.decision_id, option["key"])
        self.done, self.result = True, option
        self.on_choice(option)

    # ------------------------------------------------------------------- draw
    def draw(self, surf: pygame.Surface) -> None:
        shade = pygame.Surface((S.SCREEN_W, S.SCREEN_H), pygame.SRCALPHA)
        shade.fill((8, 10, 20, 150))
        surf.blit(shade, (0, 0))
        body_lines = W.wrap(self.body, 26, 640)
        h = 120 + len(body_lines) * 28 + len(self.options) * 52 + (30 if self.footer else 0)
        rect = pygame.Rect(0, 0, 720, min(h, 620))
        rect.center = (S.SCREEN_W // 2, S.SCREEN_H // 2 + 20)
        W.panel(surf, rect, S.PANEL, S.ACCENT, 16)
        y = rect.y + 18
        if self.speaker:
            W.text(surf, self.speaker, (rect.x + 28, y), 24, S.ACCENT_2, bold=True)
            y += 26
        W.text(surf, self.title, (rect.x + 28, y), 36, S.TEXT, bold=True)
        y += 44
        y = W.paragraph(surf, self.body, (rect.x + 28, y), 26, 664, S.TEXT, 2) + 8
        for i, opt in enumerate(self.options):
            r = pygame.Rect(rect.x + 24, y, rect.w - 48, 44)
            sel = i == self.index
            W.panel(surf, r, S.PANEL_LIGHT if sel else (36, 42, 64), S.ACCENT if sel else None, 10)
            W.text(surf, str(i + 1), (r.x + 16, r.centery), 26, S.ACCENT if sel else S.TEXT_DIM, anchor="midleft", bold=True)
            W.text(surf, opt["label"], (r.x + 48, r.centery), 25, S.TEXT, anchor="midleft")
            y += 52
        if self.footer:
            W.text(surf, self.footer, (rect.x + 28, y + 2), 21, S.WARN)
        W.text(surf, "Up/Down + Enter, or press the number", (rect.centerx, rect.bottom - 14), 20, S.TEXT_DIM, anchor="midbottom")


class MessageBox:
    """A simple 'press a key to continue' popup (no telemetry decision attached)."""

    def __init__(self, title: str, body: str, speaker: Optional[str] = None, on_close: Optional[Callable[[], None]] = None,
                 lines: Optional[list[str]] = None):
        self.title, self.body, self.speaker, self.on_close, self.lines = title, body, speaker, on_close, lines or []
        self.done = False
        self.age = 0

    def update(self, inp: InputState) -> None:
        self.age += 1
        if self.age > 8 and (inp.accept or inp.back):
            self.done = True
            if self.on_close:
                self.on_close()

    def draw(self, surf: pygame.Surface) -> None:
        shade = pygame.Surface((S.SCREEN_W, S.SCREEN_H), pygame.SRCALPHA)
        shade.fill((8, 10, 20, 140))
        surf.blit(shade, (0, 0))
        body_lines = W.wrap(self.body, 26, 600) if self.body else []
        h = 120 + len(body_lines) * 28 + len(self.lines) * 30
        rect = pygame.Rect(0, 0, 680, min(h, 560))
        rect.center = (S.SCREEN_W // 2, S.SCREEN_H // 2 + 20)
        W.panel(surf, rect, S.PANEL, S.ACCENT_2, 16)
        y = rect.y + 18
        if self.speaker:
            W.text(surf, self.speaker, (rect.x + 28, y), 24, S.ACCENT_2, bold=True)
            y += 26
        W.text(surf, self.title, (rect.x + 28, y), 36, S.TEXT, bold=True)
        y += 46
        if self.body:
            y = W.paragraph(surf, self.body, (rect.x + 28, y), 26, 624, S.TEXT, 2) + 6
        for ln in self.lines:
            W.text(surf, ln, (rect.x + 36, y), 26, S.TEXT)
            y += 30
        W.text(surf, "Press Enter or E to continue", (rect.centerx, rect.bottom - 14), 20, S.TEXT_DIM, anchor="midbottom")
