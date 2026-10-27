"""GameSession: everything about one assessment run that is independent of pygame rendering.

Owns the player + session DB records, the game clock, the telemetry logger, the seeded RNG
for in-game uncertainty (gate outcomes, mystery boxes) and the strategy tracker.
"""
from __future__ import annotations

import os
import random
import time
from pathlib import Path
from typing import Optional

from analytics.event_schema import EventType as E
from backend.database.repository import Repository
from backend.services.assessment_service import complete_session
from game import settings as S
from game.telemetry import GameClock, TelemetryLogger

PROJECT_ROOT = Path(__file__).resolve().parents[1]
JSONL_DIR = PROJECT_ROOT / "data" / "telemetry_backup"


class StrategyTracker:
    def __init__(self, logger: TelemetryLogger):
        self.logger = logger
        self.last: Optional[str] = None
        self.history: list[str] = []

    def adopt(self, label: str, source: str, **extra) -> bool:
        """Record that the player is using strategy `label`. Logs STRATEGY_CHANGE on the first label
        and whenever the label differs from the previous one. Returns True if it was a change."""
        if label == self.last:
            return False
        is_change = self.last is not None
        self.logger.log(E.STRATEGY_CHANGE, action=label, from_strategy=self.last, to_strategy=label,
                        is_change=is_change, source=source, **extra)
        self.last = label
        self.history.append(label)
        return is_change


class GameSession:
    def __init__(self, repo: Repository, player_name: str, seed: Optional[int] = None, is_demo: bool = False,
                 jsonl_dir: Optional[Path | str] = JSONL_DIR):
        self.repo = repo
        self.seed = int(seed if seed is not None else time.time_ns() % 2_000_000_000)
        self.rng = random.Random(self.seed)
        self.player_name = player_name
        self.player_id = repo.create_player(player_name, is_demo=is_demo)
        self.session_id = repo.create_session(self.player_id, seed=self.seed, game_version=S.GAME_VERSION)
        self.clock = GameClock()
        if os.environ.get("RAHYAAB_JSONL", "1") == "0":      # tests set this so they do not write backup files
            jsonl_dir = None
        self.logger = TelemetryLogger(repo, self.session_id, self.player_id, self.clock, jsonl_dir=jsonl_dir)
        self.strategies = StrategyTracker(self.logger)
        self.started = False
        self.finished = False
        self.output = None
        self.coins = 0
        self.trust = 0                 # 'village trust' earned by prosocial actions (game-side flavour only)

    def start(self, plan=None) -> None:
        """`plan` = the level ids this session intends to play (stored so results can show planned vs completed)."""
        if self.started:
            return
        self.started = True
        extra = {"plan": [int(x) for x in plan]} if plan else {}
        self.logger.log(E.SESSION_START, level_id=None, action="start", game_version=S.GAME_VERSION,
                        seed=self.seed, player_name=self.player_name, **extra)

    def pause(self) -> None:
        self.logger.log(E.GAME_PAUSED, action="pause")

    def resume(self) -> None:
        self.logger.log(E.GAME_RESUMED, action="resume")

    def finish(self, completed: bool):
        """End the session. If completed, automatically runs the full analytics pipeline and returns its output."""
        if self.finished:
            return self.output
        self.finished = True
        self.logger.set_level(None)
        self.logger.log(E.SESSION_END, level_id=None, action="completed" if completed else "abandoned",
                        coins=self.coins, trust=self.trust)
        self.logger.close()
        if completed:
            self.output = complete_session(self.repo, self.session_id, duration_ms=self.clock.now_ms())
        else:
            self.repo.end_session(self.session_id, "abandoned", duration_ms=self.clock.now_ms())
        return self.output
