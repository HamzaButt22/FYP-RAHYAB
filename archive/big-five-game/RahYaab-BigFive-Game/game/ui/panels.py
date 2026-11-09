"""Reusable modal panels for levels 5-8 (same protocol as ChoiceDialog / MessageBox: update(inp), draw(surf), done)."""
from __future__ import annotations

from typing import Callable, Optional

import pygame

from game import settings as S
from game.input_state import InputState
from game.ui import widgets as W


def shade(surf: pygame.Surface, alpha: int = 150) -> None:
    s = pygame.Surface((S.SCREEN_W, S.SCREEN_H), pygame.SRCALPHA)
    s.fill((8, 10, 20, alpha))
    surf.blit(s, (0, 0))


class CountPanel:
    """Pick how many of each item to take (pack / loadout). Number keys cycle an item's count 0..max.
    Enter / E closes. `on_event(kind, key, counts)` is called for every change so the level can log it."""

    def __init__(self, title: str, hint: str, items: list[dict], capacity: int, on_event: Callable, on_close: Callable,
                 counts: Optional[dict] = None, capacity_label: str = "weight"):
        self.title, self.hint, self.items, self.capacity = title, hint, items, capacity
        self.counts = {i["key"]: 0 for i in items}
        self.counts.update(counts or {})
        self.on_event, self.on_close, self.capacity_label = on_event, on_close, capacity_label
        self.done, self.age, self.flash = False, 0, ""

    def used(self) -> int:
        return sum(i["weight"] * self.counts[i["key"]] for i in self.items)

    def update(self, inp: InputState) -> None:
        self.age += 1
        if inp.number is not None and 1 <= inp.number <= len(self.items):
            it = self.items[inp.number - 1]
            k = it["key"]
            if self.counts[k] >= it.get("max", 1):
                self.counts[k] = 0
                self.flash = ""
                self.on_event("remove", k, dict(self.counts))
            elif self.used() + it["weight"] > self.capacity:
                self.flash = f"Too heavy - the pack holds {self.capacity} {self.capacity_label}."
                self.on_event("rejected", k, dict(self.counts))
            else:
                self.counts[k] += 1
                self.flash = ""
                self.on_event("add", k, dict(self.counts))
        elif self.age > 8 and (inp.accept or inp.back):
            self.done = True
            self.on_close(dict(self.counts))

    def draw(self, surf: pygame.Surface) -> None:
        shade(surf)
        rect = pygame.Rect(0, 0, 760, 130 + 52 * len(self.items) + 90)
        rect.center = (S.SCREEN_W // 2, S.SCREEN_H // 2 + 20)
        W.panel(surf, rect, S.PANEL, S.ACCENT, 16)
        W.text(surf, self.title, (rect.x + 28, rect.y + 18), 38, bold=True)
        W.text(surf, self.hint, (rect.x + 28, rect.y + 60), 22, S.TEXT_DIM)
        y = rect.y + 94
        for i, it in enumerate(self.items):
            n = self.counts[it["key"]]
            r = pygame.Rect(rect.x + 24, y, rect.w - 48, 44)
            W.panel(surf, r, S.PANEL_LIGHT if n else (36, 42, 64), S.ACCENT_2 if n else None, 10)
            W.text(surf, str(i + 1), (r.x + 14, r.centery), 26, S.ACCENT if n else S.TEXT_DIM, anchor="midleft", bold=True)
            W.text(surf, it["label"], (r.x + 44, r.centery), 25, anchor="midleft")
            W.text(surf, it.get("note", ""), (r.x + 290, r.centery), 21, S.TEXT_DIM, anchor="midleft")
            W.text(surf, f"x{n}  (weight {it['weight']})", (r.right - 16, r.centery), 24, S.GOLD, anchor="midright")
            y += 52
        W.text(surf, f"Pack: {self.used()} / {self.capacity} {self.capacity_label}", (rect.x + 30, y + 8), 28,
               S.DANGER if self.used() >= self.capacity else S.TEXT, bold=True)
        if self.flash:
            W.text(surf, self.flash, (rect.x + 30, y + 42), 22, S.WARN)
        W.text(surf, "Press a number to add / cycle an item.  Enter to finish.", (rect.centerx, rect.bottom - 14), 20,
               S.TEXT_DIM, anchor="midbottom")


class InfoPanel:
    """Read-only (or lightly interactive) status panel. Close with Enter / E / Esc."""

    def __init__(self, title: str, lines: list[str], on_close: Optional[Callable] = None, footer: str = "Press Enter to close"):
        self.title, self.lines, self.on_close, self.footer = title, lines, on_close, footer
        self.done, self.age = False, 0

    def update(self, inp: InputState) -> None:
        self.age += 1
        if self.age > 8 and (inp.accept or inp.back):
            self.done = True
            if self.on_close:
                self.on_close()

    def draw(self, surf: pygame.Surface) -> None:
        shade(surf)
        rect = pygame.Rect(0, 0, 760, min(560, 120 + 30 * len(self.lines)))
        rect.center = (S.SCREEN_W // 2, S.SCREEN_H // 2 + 20)
        W.panel(surf, rect, S.PANEL, S.ACCENT_2, 16)
        W.text(surf, self.title, (rect.x + 28, rect.y + 18), 38, bold=True)
        y = rect.y + 70
        for ln in self.lines:
            y = W.paragraph(surf, ln, (rect.x + 34, y), 25, 690, S.TEXT, 0) + 4
        W.text(surf, self.footer, (rect.centerx, rect.bottom - 14), 20, S.TEXT_DIM, anchor="midbottom")
