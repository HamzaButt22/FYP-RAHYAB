"""GameApp: the state machine that turns the four levels into a complete assessment.

menu -> name -> briefing -> [intro -> play -> outcome (-> retry)] x(levels in the plan, 1-10) -> processing -> results -> analytics

The app is frame-stepped (`step(inp, dt)`) and independent of the OS window, so the exact same code runs
interactively (game/main.py) and headless (test bots, screenshots).
"""
from __future__ import annotations

import json
from pathlib import Path
from typing import Optional

import pygame

from analytics.event_schema import EventType as E
from backend.database.repository import Repository
from game import settings as S
from game.input_state import InputState
from game.levels.level1_exploration import ExplorationLevel
from game.levels.level2_planning import PlanningLevel
from game.levels.level3_social import SocialLevel
from game.levels.level4_pressure import PressureLevel
from game.levels.level5_expedition import ExpeditionLevel
from game.levels.level6_crisis import CrisisLevel
from game.levels.level7_workshop import WorkshopLevel
from game.levels.level8_mission import MissionLevel
from game.levels.level9_garden import GardenLevel
from game.levels.level10_caravan import CaravanLevel
from game.levels.base import COMPLETE, FAILED, RUNNING
from game.session import GameSession, PROJECT_ROOT
from game.ui import screens

LEVEL_CLASSES = {1: ExplorationLevel, 2: PlanningLevel, 3: SocialLevel, 4: PressureLevel,
                 5: ExpeditionLevel, 6: CrisisLevel, 7: WorkshopLevel, 8: MissionLevel,
                 9: GardenLevel, 10: CaravanLevel}
LEVELS = [LEVEL_CLASSES[i] for i in (1, 2, 3, 4)]         # the original four (kept for compatibility)
PLANS = {"full": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], "bigfive": [1, 2, 3, 4, 5, 6, 9], "career": [7, 8, 10], "original": [1, 2, 3, 4]}
MENU_ITEMS = ["New Assessment", "Big Five track (levels 1-6, 9)", "Career Interests track (levels 7, 8, 10)",
              "Original game (levels 1-4)", "Level Select", "Instructions", "Quit"]
MENU_PLAN = {"New Assessment": "full", "Big Five track (levels 1-6, 9)": "bigfive",
             "Career Interests track (levels 7, 8, 10)": "career", "Original game (levels 1-4)": "original"}
PAUSE_ITEMS = ["Resume", "Quit to menu (abandon assessment)"]
REPORT_DIR = PROJECT_ROOT / "data" / "reports"

INTRO_TEXT = {
    1: ("You arrive in an unfamiliar valley. A road leads to the Valley Gate - but the valley is big, and "
        "nobody is watching the clock. Do whatever feels natural."),
    2: ("The workshop has a limited stock of wood, metal and cloth, and a list of customer orders. "
        "Fill orders worth at least 100 coins and deliver them. Take your time or dive in - it's up to you."),
    3: ("You must deliver a letter to the ferry dock. The harbor is busy: villagers may stop you, or wait "
        "quietly in the side streets. Talk, help, trade... or just keep walking."),
    4: ("Alarms blare: the old vault is collapsing! Three locked gates and a laser corridor stand between you and "
        "the exit. The countdown is running - decide fast, and expect surprises."),
    5: ("A day-long mountain expedition. Pack supplies, plan a route, and decide what to do when conditions change. "
        "Several different plans can work. Scout Mira and Porter Tariq are around if you want to talk."),
    6: ("A river is rising over three stages. You have action points, sandbags, volunteers and vehicles, and four sites "
        "that need protection. Gather information, decide, and adapt. There is no single right plan."),
    7: ("A community makerspace open day. Six benches offer different hands-on work. You have a limited number of time "
        "blocks: choose what to try, how to approach it, and whether to come back. Nothing is required except trying a few."),
    9: ("A shared courtyard garden over five days. Move a cursor over the beds, plant, tend, talk to the neighbours or just sit. "
        "Things happen: pests, a request, a hail forecast, an open day. Nothing is graded."),
    10: ("A caravan crosses ten stops. At every fork choose one of three roads - or make camp. Each road leads to a different "
         "job you can try for as long as you like. There are no wrong roads and nothing is timed."),
    8: ("Reopen Riverside Park for Community Day. Share a budget and work shifts across three phases, work with four "
        "teammates, and adapt as news arrives. Every requirement can be met in more than one way."),
}
LEVEL_TRACK = {1: "Big Five", 2: "Big Five", 3: "Big Five", 4: "Big Five", 5: "Big Five", 6: "Big Five",
               7: "Career interests", 8: "Career interests",
               9: "Big Five", 10: "Career interests"}


class GameApp:
    def __init__(self, repo: Optional[Repository] = None, seed: Optional[int] = None, is_demo: bool = False):
        self.repo = repo or Repository()
        self.seed_override = seed
        self.is_demo = is_demo
        self.state = "menu"
        self.running = True
        self.menu_index = 0
        self.pause_index = 0
        self.name_text = ""
        self.session: Optional[GameSession] = None
        self.level = None
        self.level_idx = 0
        self.attempt = 1
        self.outcome_index = 0
        self.outcome_t0 = 0.0
        self.output = None
        self.result_trait = 0
        self.instr_page = 0
        self.processing_frames = 0
        self.saved_report: Optional[Path] = None
        self.frame = 0
        self.prev_state_before_pause = "play"
        self.error: Optional[str] = None
        self.plan: list[int] = list(PLANS["original"])
        self.pending_plan: list[int] = list(PLANS["full"])
        self.select_index = 0

    # ----------------------------------------------------------------- lifecycle
    def new_session(self, name: str) -> None:
        self.session = GameSession(self.repo, name or "Player", seed=self.seed_override, is_demo=self.is_demo)
        self.plan = list(self.pending_plan)
        self.session.start(plan=self.plan)
        self.level_idx, self.attempt, self.output, self.saved_report = 0, 1, None, None

    def abandon(self) -> None:
        if self.session is not None and not self.session.finished:
            self.session.finish(completed=False)
        self.session = None
        self.level = None

    def quit(self) -> None:
        self.abandon()
        self.running = False

    def begin_level(self) -> None:
        cls = LEVEL_CLASSES[self.plan[self.level_idx]]
        self.level = cls(self.session, self.attempt)
        self.level.start()
        self.state = "play"

    # ----------------------------------------------------------------- frame step
    def step(self, inp: InputState, dt: float) -> None:
        self.frame += 1
        s = self.session
        if s is not None and self.state != "paused":
            s.clock.tick(dt)
        handler = getattr(self, f"_st_{self.state}")
        handler(inp, dt)

    # ------------------------------------------------------------------- states
    def _st_menu(self, inp, dt):
        if inp.up:
            self.menu_index = (self.menu_index - 1) % len(MENU_ITEMS)
        if inp.down:
            self.menu_index = (self.menu_index + 1) % len(MENU_ITEMS)
        if inp.number and 1 <= inp.number <= len(MENU_ITEMS):
            self.menu_index = inp.number - 1
            inp.confirm = True
        if inp.confirm or inp.interact:
            item = MENU_ITEMS[self.menu_index]
            if item in MENU_PLAN:
                self.pending_plan = list(PLANS[MENU_PLAN[item]])
                self.state, self.name_text = "name", ""
            elif item == "Level Select":
                self.state, self.select_index = "levelselect", 0
            elif item == "Instructions":
                self.state, self.instr_page = "instructions", 0
            else:
                self.quit()

    def _st_levelselect(self, inp, dt):
        """Play any single level on its own (its results cover only that level's model)."""
        n = len(LEVEL_CLASSES)
        if inp.up:
            self.select_index = (self.select_index - 1) % n
        if inp.down:
            self.select_index = (self.select_index + 1) % n
        if inp.number and 1 <= inp.number <= n:
            self.select_index = inp.number - 1
            inp.confirm = True
        if inp.back or inp.pause:
            self.state = "menu"
        elif inp.confirm or inp.interact:
            self.pending_plan = [self.select_index + 1]
            self.state, self.name_text = "name", ""

    def _st_instructions(self, inp, dt):
        if inp.right or inp.down or inp.confirm:
            if self.instr_page < screens.INSTRUCTION_PAGES - 1:
                self.instr_page += 1
            else:
                self.state = "menu"
        if inp.left or inp.up:
            self.instr_page = max(0, self.instr_page - 1)
        if inp.back or inp.pause:
            self.state = "menu"

    def _st_name(self, inp, dt):
        for ch in inp.text:
            if ch.isprintable() and len(self.name_text) < 18 and ch not in "\r\n\t":
                self.name_text += ch
        if inp.backspace:
            self.name_text = self.name_text[:-1]
        if inp.back:
            self.state = "menu"
        elif inp.confirm:
            self.new_session(self.name_text.strip() or "Player")
            self.state = "briefing"

    def _st_briefing(self, inp, dt):
        if inp.confirm or inp.interact:
            self.state = "intro"

    def _st_intro(self, inp, dt):
        if inp.confirm or inp.interact:
            self.begin_level()

    def _st_play(self, inp, dt):
        if inp.pause or inp.back:
            self.session.pause()
            self.prev_state_before_pause = "play"
            self.pause_index = 0
            self.state = "paused"
            return
        self.level.update(dt, inp)
        if self.level.status != RUNNING:
            self.outcome_index = 0
            self.outcome_t0 = self.session.clock.ms
            self.state = "outcome"

    def _st_paused(self, inp, dt):
        if inp.up or inp.down:
            self.pause_index = (self.pause_index + (1 if inp.down else -1)) % len(PAUSE_ITEMS)
        resume = inp.pause or inp.back or ((inp.confirm or inp.interact) and self.pause_index == 0)
        if resume:
            self.session.resume()
            self.state = self.prev_state_before_pause
        elif (inp.confirm or inp.interact) and self.pause_index == 1:
            self.abandon()
            self.state = "menu"

    def _outcome_options(self):
        lvl = self.level
        if lvl.status == COMPLETE:
            return ["Continue"] if self.level_idx < len(self.plan) - 1 else ["Finish assessment"]
        if self.attempt >= S.MAX_ATTEMPTS:
            return ["Continue"]
        return ["Try again", "Move on to the next level"]

    def _st_outcome(self, inp, dt):
        opts = self._outcome_options()
        if inp.up and self.outcome_index > 0:
            self.outcome_index -= 1
        if inp.down and self.outcome_index < len(opts) - 1:
            self.outcome_index += 1
        pick = None
        if inp.number and 1 <= inp.number <= len(opts):
            pick = inp.number - 1
        elif inp.confirm or inp.interact:
            pick = self.outcome_index
        if pick is None:
            return
        choice = opts[pick]
        lvl = self.level
        log = self.session.logger
        if choice == "Try again":
            latency = self.session.clock.ms - self.outcome_t0
            log.log(E.RETRY, action="retry_level", voluntary=False, attempt=self.attempt + 1, latency_ms=round(latency),
                    previous_failure=lvl.fail_reason, level_id=lvl.level_id)
            self.attempt += 1
            self.begin_level()
            return
        if lvl.status == FAILED:
            reason = "player_skip" if choice.startswith("Move on") else "max_attempts"
            log.log(E.TASK_ABANDON, action=lvl.task_name, reason=reason, attempts=self.attempt, level_id=lvl.level_id)
        self._advance_level()

    def _advance_level(self) -> None:
        self.level_idx += 1
        self.attempt = 1
        self.level = None
        if self.level_idx >= len(self.plan):
            self.state, self.processing_frames = "processing", 0
        else:
            self.state = "intro"

    def _st_processing(self, inp, dt):
        if self.output is None:
            self.output = self.session.finish(completed=True)    # runs cleaning -> features -> OCEAN -> DB
        self.processing_frames += 1
        if self.processing_frames > 75 or (self.processing_frames > 10 and inp.accept):
            self.result_trait = 0
            self.state = "results" if self.output.has_bigfive else "riasec"

    def _has_riasec(self) -> bool:
        r = getattr(self.output, "riasec", None)
        return bool(r is not None and r.available)

    def _st_riasec(self, inp, dt):
        if inp.tab or inp.confirm:
            self.state = "analytics"
        if inp.left or inp.back:
            if self.output.has_bigfive:
                self.state = "results"
            else:
                self._to_menu()
        if inp.save:
            self.saved_report = self.export_report()
        if inp.menu:
            self._to_menu()

    def _st_results(self, inp, dt):
        if inp.down or inp.right:
            self.result_trait = (self.result_trait + 1) % 5
        if inp.up or inp.left:
            self.result_trait = (self.result_trait - 1) % 5
        if inp.tab or inp.confirm:
            self.state = "riasec" if self._has_riasec() else "analytics"
        if inp.save:
            self.saved_report = self.export_report()
        if inp.menu or inp.back:
            self._to_menu()

    def _st_analytics(self, inp, dt):
        if inp.menu:
            self._to_menu()
        elif inp.tab or inp.confirm or inp.left or inp.back:
            self.state = "riasec" if self._has_riasec() else ("results" if self.output.has_bigfive else "menu")
            if self.state == "menu":
                self._to_menu()
        if inp.save:
            self.saved_report = self.export_report()

    def _to_menu(self) -> None:
        self.session = None
        self.level = None
        self.output = None
        self.state = "menu"

    # ------------------------------------------------------------------- reports
    def export_report(self) -> Optional[Path]:
        if self.output is None or self.session is None:
            return None
        REPORT_DIR.mkdir(parents=True, exist_ok=True)
        path = REPORT_DIR / f"{self.session.session_id}.json"
        payload = {
            "session_id": self.session.session_id, "player": self.session.player_name,
            "disclaimer": self.output.prediction.disclaimer, "is_validated": self.output.prediction.is_validated,
            "result": self.output.result_dict(), "features": self.output.feature_set.features,
            "feature_counts": self.output.feature_set.counts, "telemetry_summary": self.output.summary,
            "levels": self.output.levels,
            "level_status": self.output.level_status, "contributions": self.output.contributions,
            "riasec": self.output.riasec.to_dict() if self._has_riasec() else None,
        }
        path.write_text(json.dumps(payload, indent=2, default=str), encoding="utf-8")
        return path

    # ---------------------------------------------------------------------- draw
    def draw(self, surf: pygame.Surface) -> None:
        screens.draw(surf, self)
