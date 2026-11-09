"""Game clock.

Telemetry timing is based on this clock instead of the wall clock so that
(a) paused time is never counted as thinking time, and
(b) headless test bots can play a whole assessment in a few seconds while still
    producing realistic millisecond timings.
"""
from __future__ import annotations


class GameClock:
    def __init__(self) -> None:
        self._ms = 0.0

    def tick(self, dt_seconds: float) -> None:
        if dt_seconds > 0:
            self._ms += dt_seconds * 1000.0

    @property
    def ms(self) -> float:
        return self._ms

    def now_ms(self) -> int:
        return int(self._ms)
