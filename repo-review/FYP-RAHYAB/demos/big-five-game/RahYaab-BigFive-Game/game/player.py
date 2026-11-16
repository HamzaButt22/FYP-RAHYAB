"""The player avatar: movement with axis-separated collision."""
from __future__ import annotations

import math

import pygame

from game.settings import PLAYER_RADIUS, PLAYER_SPEED, WORLD_H, WORLD_W


def sign(v: float) -> int:
    return (v > 0) - (v < 0)


class Player:
    def __init__(self, x: float, y: float):
        self.x = float(x)
        self.y = float(y)
        self.radius = PLAYER_RADIUS
        self.frozen_ms = 0.0
        self.facing = (1, 0)
        self.direction = (0, 0)
        self.trail: list[tuple[float, float]] = []

    @property
    def pos(self) -> tuple[float, float]:
        return (self.x, self.y)

    @property
    def rect(self) -> pygame.Rect:
        r = self.radius
        return pygame.Rect(int(self.x - r), int(self.y - r), 2 * r, 2 * r)

    def teleport(self, x: float, y: float) -> None:
        self.x, self.y = float(x), float(y)

    def freeze(self, ms: float) -> None:
        self.frozen_ms = max(self.frozen_ms, ms)

    @property
    def frozen(self) -> bool:
        return self.frozen_ms > 0

    def update(self, dt: float, dx: int, dy: int, solids: list[pygame.Rect]) -> None:
        if self.frozen_ms > 0:
            self.frozen_ms = max(0.0, self.frozen_ms - dt * 1000.0)
            self.direction = (0, 0)
            return
        self.direction = (sign(dx), sign(dy))
        if dx or dy:
            self.facing = self.direction
            norm = math.hypot(dx, dy)
            vx, vy = dx / norm * PLAYER_SPEED, dy / norm * PLAYER_SPEED
            self._move_axis(vx * dt, 0.0, solids)
            self._move_axis(0.0, vy * dt, solids)
            if len(self.trail) == 0 or math.hypot(self.x - self.trail[-1][0], self.y - self.trail[-1][1]) > 14:
                self.trail.append((self.x, self.y))
                if len(self.trail) > 26:
                    self.trail.pop(0)

    def _move_axis(self, mx: float, my: float, solids: list[pygame.Rect]) -> None:
        r = self.radius
        nx = min(max(self.x + mx, r), WORLD_W - r)
        ny = min(max(self.y + my, r), WORLD_H - r)
        probe = pygame.Rect(int(nx - r), int(ny - r), 2 * r, 2 * r)
        if any(probe.colliderect(s) for s in solids):
            return
        self.x, self.y = nx, ny
