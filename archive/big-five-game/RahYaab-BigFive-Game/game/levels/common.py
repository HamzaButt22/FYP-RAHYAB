"""Helpers shared by the walkable 'station' levels (2, 5, 6, 7, 8)."""
from __future__ import annotations

from typing import Optional

import pygame

from game import settings as S
from game.ui import widgets as W


def nearest_station(player, stations: dict[str, pygame.Rect], reach: float = 42.0) -> Optional[str]:
    best, best_d = None, 9e9
    for k, r in stations.items():
        cx = min(max(player.x, r.left), r.right)
        cy = min(max(player.y, r.top), r.bottom)
        d = ((player.x - cx) ** 2 + (player.y - cy) ** 2) ** 0.5
        if d < best_d:
            best, best_d = k, d
    return best if best_d <= reach else None


def draw_station(world: pygame.Surface, rect: pygame.Rect, label: str, color, size: int = 22) -> None:
    W.shadow_circle(world, (rect.centerx, rect.bottom - 4), max(10, rect.w // 6), 45)
    pygame.draw.rect(world, color, rect, border_radius=10)
    pygame.draw.rect(world, (20, 22, 30), rect, 3, border_radius=10)
    lines = W.wrap(label, size, max(30, rect.w - 8))
    y = rect.centery - (len(lines) * (size - 4)) // 2
    for ln in lines:
        W.text(world, ln, (rect.centerx, y), size, S.TEXT, anchor="midtop", bold=True)
        y += size - 4
