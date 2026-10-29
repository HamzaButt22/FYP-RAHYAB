# -*- coding: utf-8 -*-
"""Wordless calibration screen played before every logged game session.

A single pulsing target hops around a ring; tapping it moves it on, and a ring of pips fills as
valid taps accumulate. No text, no score: it measures this device's pointing speed only.
"""
import math
import time

import pygame

from engine.calibration import REQUIRED_INTERVALS, TARGET_RADIUS, CalibrationRound, target_positions

FPS = 60
BG = (12, 14, 22)
TARGET = (0, 215, 255)
TARGET_CORE = (230, 250, 255)
PIP_EMPTY = (50, 56, 80)
PIP_FULL = (90, 255, 120)


class CalibrationScreen:
    def __init__(self, screen, clock):
        self.screen = screen
        self.clock = clock
        w, h = screen.get_size()
        self.centre = (w / 2, h / 2)
        self.round = CalibrationRound(target_positions(w, h))
        self._t0_ns = time.monotonic_ns()

    def _now_ms(self) -> float:
        return (time.monotonic_ns() - self._t0_ns) / 1_000_000

    def handle_click(self, pos: tuple, monotonic_ms: float, input_type: str) -> bool:
        return self.round.press(pos[0], pos[1], monotonic_ms, input_type)

    def render(self) -> None:
        self.screen.fill(BG)
        pulse = 0.5 + 0.5 * math.sin(pygame.time.get_ticks() / 180.0)
        target = self.round.target
        if target is not None:
            pygame.draw.circle(self.screen, TARGET, target, TARGET_RADIUS * (0.8 + 0.2 * pulse), 4)
            pygame.draw.circle(self.screen, TARGET_CORE, target, TARGET_RADIUS * 0.35)
        filled = len(self.round.valid)
        for k in range(REQUIRED_INTERVALS):
            a = -math.pi / 2 + 2 * math.pi * k / REQUIRED_INTERVALS
            pip = (self.centre[0] + 26 * math.cos(a), self.centre[1] + 26 * math.sin(a))
            pygame.draw.circle(self.screen, PIP_FULL if k < filled else PIP_EMPTY, pip, 5)
        pygame.display.flip()

    def run(self):
        """Returns the measured baseline, or None if the window was closed first."""
        while not self.round.done:
            for event in pygame.event.get():
                if event.type == pygame.QUIT:
                    return None
                if event.type == pygame.MOUSEBUTTONDOWN and event.button == 1:
                    ms = self._now_ms()
                    input_type = "touch" if getattr(event, "touch", False) else "mouse"
                    self.handle_click(event.pos, ms, input_type)
            self.clock.tick(FPS)
            self.render()
        return self.round.baseline()


def calibrate(screen_w: int, screen_h: int, caption: str = "RahYaab"):
    pygame.init()
    screen = pygame.display.set_mode((screen_w, screen_h))
    pygame.display.set_caption(caption)
    return CalibrationScreen(screen, pygame.time.Clock()).run()
