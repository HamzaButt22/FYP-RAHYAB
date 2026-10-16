"""TelemetryLogger: turns gameplay into persistent, structured events.

* every event is validated against the shared event vocabulary
* events are buffered and written to SQLite in batches (and always flushed at
  level boundaries / session end)
* an optional JSON-lines backup file is written alongside, so a crash never loses data
* decision latency is measured with begin_decision() / end_decision()
* movement is down-sampled to 2 Hz and summarised (distance, reversals, grid cells visited)
"""
from __future__ import annotations

import json
import math
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any, Optional

from analytics.event_schema import ALL_EVENT_TYPES, EventType
from game.telemetry.clock import GameClock

GRID_CELL = 100          # px; used for the route-diversity grid (world is 1100x604 -> 11x7 cells)
MOVE_SAMPLE_MS = 500


class TelemetryLogger:
    def __init__(self, repo, session_id: str, player_id: int, clock: GameClock,
                 started_at: Optional[datetime] = None, jsonl_dir: Optional[str | Path] = None,
                 flush_size: int = 40):
        self.repo = repo
        self.session_id = session_id
        self.player_id = player_id
        self.clock = clock
        self.started_at = started_at or datetime.now()
        self.flush_size = flush_size
        self.level_id: Optional[int] = None
        self._buffer: list[dict] = []
        self._pending: dict[str, dict] = {}
        self.total_logged = 0
        self._jsonl_path: Optional[Path] = None
        if jsonl_dir:
            Path(jsonl_dir).mkdir(parents=True, exist_ok=True)
            self._jsonl_path = Path(jsonl_dir) / f"{session_id}.jsonl"
        self._reset_move_state()

    # ------------------------------------------------------------------ core
    def set_level(self, level_id: Optional[int]) -> None:
        self.flush_movement()
        self.level_id = level_id

    def log(self, event_type: str, action: Optional[str] = None, decision_time_ms: Optional[float] = None,
            risk_level: Optional[float] = None, level_id: Any = "current", **metadata) -> dict:
        if event_type not in ALL_EVENT_TYPES:
            raise ValueError(f"Unknown telemetry event type: {event_type!r}")
        t_ms = self.clock.now_ms()
        event = {
            "session_id": self.session_id,
            "player_id": self.player_id,
            "level_id": self.level_id if level_id == "current" else level_id,
            "timestamp": (self.started_at + timedelta(milliseconds=t_ms)).isoformat(timespec="milliseconds"),
            "t_ms": t_ms,
            "event_type": event_type,
            "action": action,
            "decision_time_ms": None if decision_time_ms is None else round(float(decision_time_ms), 1),
            "risk_level": None if risk_level is None else round(float(risk_level), 3),
            "metadata": metadata,
        }
        self._buffer.append(event)
        self.total_logged += 1
        if len(self._buffer) >= self.flush_size:
            self.flush()
        return event

    def flush(self) -> int:
        if not self._buffer:
            return 0
        batch, self._buffer = self._buffer, []
        n = self.repo.insert_events(self.session_id, self.player_id, batch)
        if self._jsonl_path is not None:
            with open(self._jsonl_path, "a", encoding="utf-8") as fh:
                for e in batch:
                    fh.write(json.dumps(e, default=str) + "\n")
        return n

    def close(self) -> None:
        self.flush_movement()
        self.flush()

    # -------------------------------------------------------------- decisions
    def begin_decision(self, decision_id: str, category: str, options: list[dict], **context) -> None:
        """options: [{'key','label','kind','risk_level'(optional)}]"""
        self._pending[decision_id] = {
            "t0": self.clock.ms, "category": category, "options": options, "changes": 0, "context": context,
        }
        self.log(EventType.DECISION, action=decision_id, category=category,
                 options=[o["key"] for o in options], option_kinds=[o.get("kind") for o in options], **context)

    def note_selection_change(self, decision_id: str) -> None:
        p = self._pending.get(decision_id)
        if p:
            p["changes"] += 1

    def end_decision(self, decision_id: str, chosen_key: str, **extra) -> float:
        p = self._pending.pop(decision_id, None)
        if p is None:                      # defensive: never crash the game for telemetry
            self.log(EventType.DECISION_RESPONSE, action=chosen_key, decision_id=decision_id, orphan=True, **extra)
            return 0.0
        dt = max(0.0, self.clock.ms - p["t0"])
        opt = next((o for o in p["options"] if o["key"] == chosen_key), {})
        self.log(EventType.DECISION_RESPONSE, action=chosen_key, decision_time_ms=dt,
                 risk_level=opt.get("risk_level"), decision_id=decision_id, category=p["category"],
                 chosen_kind=opt.get("kind"), selection_changes=p["changes"],
                 n_options=len(p["options"]), **{**p["context"], **extra})
        return dt

    def cancel_decision(self, decision_id: str) -> None:
        self._pending.pop(decision_id, None)

    # --------------------------------------------------------------- movement
    def _reset_move_state(self) -> None:
        self._mv_elapsed = 0.0
        self._mv_dist = 0.0
        self._mv_last_pos: Optional[tuple[float, float]] = None
        self._mv_last_dir: Optional[tuple[int, int]] = None
        self._mv_dir_changes = 0
        self._mv_reversals = 0
        self._mv_cells: set[tuple[int, int]] = set()
        self._mv_pos = (0.0, 0.0)
        self._mv_first_ms: Optional[int] = None

    def track_movement(self, x: float, y: float, dt_s: float, direction: tuple[int, int]) -> None:
        """Call once per frame while a level is being played."""
        self._mv_cells.add((int(x // GRID_CELL), int(y // GRID_CELL)))
        if self._mv_last_pos is not None:
            step = math.hypot(x - self._mv_last_pos[0], y - self._mv_last_pos[1])
            self._mv_dist += step
            if step > 0.5 and self._mv_first_ms is None:
                self._mv_first_ms = self.clock.now_ms()
        self._mv_last_pos = (x, y)
        self._mv_pos = (x, y)
        if direction != (0, 0):
            if self._mv_last_dir is not None and direction != self._mv_last_dir:
                self._mv_dir_changes += 1
                if direction[0] * self._mv_last_dir[0] + direction[1] * self._mv_last_dir[1] < 0:
                    self._mv_reversals += 1
            self._mv_last_dir = direction
        self._mv_elapsed += dt_s * 1000.0
        if self._mv_elapsed >= MOVE_SAMPLE_MS:
            self.flush_movement()

    def flush_movement(self) -> None:
        if self._mv_elapsed > 0 and self._mv_dist > 1.0 and self.level_id is not None:
            secs = max(self._mv_elapsed / 1000.0, 1e-6)
            self.log(EventType.PLAYER_MOVE, action="move", x=round(self._mv_pos[0]), y=round(self._mv_pos[1]),
                     dist=round(self._mv_dist, 1), speed=round(self._mv_dist / secs, 1),
                     dir_changes=self._mv_dir_changes, reversals=self._mv_reversals,
                     cells=sorted([list(c) for c in self._mv_cells]), interval_ms=round(self._mv_elapsed),
                     first_move_ms=self._mv_first_ms)
        last_pos = self._mv_last_pos
        self._reset_move_state()
        self._mv_last_pos = last_pos      # keep continuity so distance is not lost between samples
        self._mv_last_dir = None
