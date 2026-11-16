"""Level 10 - Crossroads Caravan (RIASEC, exploratory).

A hand-drawn route map. A caravan crosses ten stops. At every stop the road forks into THREE roads (each leading to a
different kind of job) and a fourth option, "make camp" (skip the stop). The player picks one; the job is then played in
a short cursor-driven scene (see caravan_scenes.py) with required steps and optional depth steps.

Why forced choice: when the player is offered everything at once, "I'd do all of them" says little. Here the offered
triples follow a balanced incomplete block design (6 job types, 10 stops, 3 per stop, each type offered 5 times, each
pair of types offered together twice), so every type is offered equally often and every type meets every other type. A
choice therefore counts as a preference. The assignment of job types to design points, the order of the stops and the
position of the roads on screen are shuffled for every playthrough (replayability; also lets position bias be checked).

Nothing here rewards skill: no timers, no scores, no failure. The map shows no category names.
"""
from __future__ import annotations

import math

import pygame

from analytics.event_schema import EventType as E
from game import settings as S
from game.input_state import InputState
from game.levels.base import Level
from game.levels.caravan_scenes import SCENES
from game.ui import widgets as W
from game.ui.panels import shade

BIBD_BLOCKS = [(0, 1, 2), (0, 1, 3), (0, 2, 4), (0, 3, 5), (0, 4, 5), (1, 2, 5), (1, 3, 4), (1, 4, 5), (2, 3, 4), (2, 3, 5)]
STOPS = len(BIBD_BLOCKS)
TASK_ORDER = ["wheel_workshop", "lantern_riddle", "mural_wall", "fireside_circle", "market_square", "ledger_tower"]
PLACE = {"wheel_workshop": ("Wainwright's Yard", "A wagon wheel is cracked. Timber, tools and grease."),
         "lantern_riddle": ("Observatory Hill", "The lanterns burn dim and nobody knows why."),
         "mural_wall": ("The Painted Wall", "A blank wall and a box of colours."),
         "fireside_circle": ("Fireside Camp", "Travellers rest by a fire. Some look worn out."),
         "market_square": ("The Bazaar", "Stalls, hagglers and a crowd waiting to be persuaded."),
         "ledger_tower": ("Ledger House", "Crates are stacked in the wrong order.")}
GLYPH_COLOR = {"wheel_workshop": (170, 110, 70), "lantern_riddle": (90, 130, 190), "mural_wall": (210, 90, 120),
               "fireside_circle": (220, 130, 60), "market_square": (190, 160, 60), "ledger_tower": (110, 140, 130)}
EXPECTED_MS = 60_000


def build_route(rng) -> list[list[str]]:
    """Shuffle the design: random type<->point assignment, random stop order, random road positions."""
    types = TASK_ORDER[:]
    rng.shuffle(types)
    blocks = [list(b) for b in BIBD_BLOCKS]
    rng.shuffle(blocks)
    route = []
    for b in blocks:
        triple = [types[i] for i in b]
        rng.shuffle(triple)
        route.append(triple)
    return route


def bibd_stats(route: list[list[str]]) -> dict:
    """Balance check used by tests and documentation: replication and pair counts."""
    rep = {t: 0 for t in TASK_ORDER}
    pairs: dict[tuple, int] = {}
    for b in route:
        for t in b:
            rep[t] += 1
        for i in range(3):
            for j in range(i + 1, 3):
                k = tuple(sorted((b[i], b[j])))
                pairs[k] = pairs.get(k, 0) + 1
    return {"replication": rep, "pair_counts": pairs}


class CaravanLevel(Level):
    level_id = 10
    name = "Crossroads Caravan"
    scenario = "crossroads_caravan"
    objective = "Lead the caravan across ten stops. At each fork pick a road - or rest. There are no wrong roads."
    controls_hint = "Left/Right: pick a road   Enter/E: go   1-4: quick pick   In a job: arrows, E, numbers, Tab to leave"
    task_name = "caravan_journey"

    # ------------------------------------------------------------------ setup
    def build(self) -> None:
        self.route = build_route(self.rng)
        self.stop = 0
        self.visits = {t: 0 for t in TASK_ORDER}
        self.sel, self.map_age, self.changes = 0, 0, 0
        self.shown_ms = 0.0
        self.scene = None
        self.selections = 0
        self.rests = 0
        self.ended = False
        self.intro_pending = True
        self.anim = 0.0

    def level_start_metadata(self) -> dict:
        return {"stops": STOPS, "tasks": list(TASK_ORDER), "route": self.route, "max_rounds": 5, "min_rounds_to_end": 3,
                "design": {"types": 6, "blocks": STOPS, "block_size": 3, "replication": 5, "pair_lambda": 2},
                "step_counts": {k: [v.req_total, v.opt_total] for k, v in SCENES.items()}, "expected_ms": EXPECTED_MS,
                "skip_option": True}

    # ------------------------------------------------------------------ logging
    def _log(self, etype, action=None, **kw):
        kw.setdefault("actor", "player")
        kw.setdefault("stage", "road")
        return self.log.log(etype, action=action, **kw)

    # ------------------------------------------------------------------ update
    def update(self, dt: float, inp: InputState) -> None:
        if self.status != "running":
            return
        self.elapsed_ms += dt * 1000.0
        self.anim += dt
        if self.toast_ms > 0:
            self.toast_ms -= dt * 1000.0
        if self.intro_pending:
            self.intro_pending = False
            self.open_message("Crossroads Caravan", "", lines=[
                f"Your caravan crosses {STOPS} stops. At each fork there are three roads and a place to camp.",
                "A road leads to a job you can try: fixing, investigating, painting, helping, bargaining, sorting...",
                "Pick the one you would rather do. Inside a job, do what you like and leave whenever you wish (Tab).",
                "Nothing is timed or scored, and no road is wrong. The same roads will not come in the same order twice."])
            return
        if self.modal is not None:
            self.modal.update(inp)
            if getattr(self.modal, "done", False):
                self.modal = None
            return
        self.map_age += 1
        self.shown_ms += dt * 1000.0
        if self.map_age <= 6:
            return
        n = len(self.route[self.stop]) + 1
        old = self.sel
        if inp.left:
            self.sel = max(0, self.sel - 1)
        if inp.right:
            self.sel = min(n - 1, self.sel + 1)
        if self.sel != old:
            self.changes += 1
        pick = None
        if inp.number is not None and 1 <= inp.number <= n:
            pick = inp.number - 1
        elif inp.accept:
            pick = self.sel
        if pick is not None:
            self.choose(pick)

    # ------------------------------------------------------------------ decisions
    def choose(self, idx: int) -> None:
        offered = self.route[self.stop]
        meta = dict(stop=self.stop + 1, offered=list(offered), selection_changes=self.changes, deliberation_ms=round(self.shown_ms),
                    options_n=len(offered))
        if idx >= len(offered):
            self.rests += 1
            self._log(E.ROUTE_CHOICE, "rest", chosen=None, position=None, **meta)
            self.say("You make camp for the night.", 1800)
            self.next_stop()
            return
        task = offered[idx]
        r = self.visits[task]
        self.visits[task] += 1
        self.selections += 1
        self._log(E.ROUTE_CHOICE, "choose", chosen=task, position=idx, **meta)
        self._log(E.ACTIVITY_CHOICE, "select", task_id=task, round=r, selected=True, voluntary=True, revisit=r > 0, via="road",
                  options=list(offered), choice_no=self.selections, stop=self.stop + 1, position=idx)
        self.scene = SCENES[task](self, r)
        self._log(E.ACTIVITY_START, "start", task_id=task, round=r, required_steps=self.scene.req_total,
                  optional_steps=self.scene.opt_total, expected_ms=EXPECTED_MS, stop=self.stop + 1)
        self.modal = self.scene

    def scene_finished(self, scene) -> None:
        completed = scene.req_done >= scene.req_total
        outcome = "completed" if completed else "abandoned"
        self._log(E.ACTIVITY_END, outcome, task_id=scene.task_id, round=scene.round_no, outcome=outcome,
                  engaged_ms=round(scene.elapsed_ms), expected_ms=EXPECTED_MS, required_done=scene.req_done,
                  required_total=scene.req_total, optional_taken=scene.opt_taken, optional_total=scene.opt_total, hints=0,
                  bonus_taken=scene.opt_taken > 0, performance=None, stage="activity", stop=self.stop + 1)
        scene.done = True
        self.scene = None
        self.next_stop()

    def next_stop(self) -> None:
        self.stop += 1
        self.sel, self.map_age, self.changes, self.shown_ms = 0, 0, 0, 0.0
        if self.stop >= STOPS and not self.ended:
            self.ended = True
            self.open_message("The caravan arrives", "You reach the far gate as the sun sets.",
                              lines=[f"Roads taken: {self.selections}   Nights camped: {self.rests}",
                                     "These are only the day's facts - not a score."])
            self.modal.on_close = lambda: self.complete(stops=STOPS, jobs_started=self.selections, camps=self.rests)

    # ------------------------------------------------------------------ draw
    def hud_extra(self):
        return [("stop", f"{min(self.stop + 1, STOPS)}/{STOPS}"), ("jobs tried", str(self.selections))]

    def draw(self, screen: pygame.Surface) -> None:
        world = pygame.Surface((S.WORLD_W, S.WORLD_H))
        self.draw_world(world)
        screen.blit(world, (0, S.HUD_H))
        self._draw_hud(screen)
        if self.toast_ms > 0 and self.modal is None:
            r = W.text(screen, self.toast, (S.SCREEN_W // 2, S.SCREEN_H - 24), 26, S.TEXT, anchor="center")
            W.panel(screen, r.inflate(36, 16), S.PANEL, S.ACCENT, 12, alpha=235)
            W.text(screen, self.toast, r.center, 26, S.TEXT, anchor="center")
        if self.modal is not None:
            self.modal.draw(screen)

    def node_pos(self, i: int) -> tuple[int, int]:
        return 60 + i * 109, int(120 + 38 * math.sin(i * 0.9))

    def draw_world(self, world: pygame.Surface) -> None:
        if getattr(self, "_bg", None) is None:
            self._bg = W.vertical_gradient((S.WORLD_W, S.WORLD_H), (226, 196, 150), (176, 140, 98))
        world.blit(self._bg, (0, 0))
        pts = [self.node_pos(i) for i in range(STOPS)]
        pygame.draw.lines(world, (120, 84, 52), False, pts, 6)
        for i, p in enumerate(pts):
            done = i < self.stop
            pygame.draw.circle(world, (92, 64, 40), p, 17)
            pygame.draw.circle(world, (240, 220, 170) if not done else (110, 160, 100), p, 13)
            if i == self.stop and self.stop < STOPS:
                pygame.draw.circle(world, S.GOLD, p, 22, 4)
        if self.stop < STOPS:
            cx, cy = self.node_pos(self.stop)
            pygame.draw.rect(world, (90, 60, 40), (cx - 16, cy - 44 + int(2 * math.sin(self.anim * 4)), 32, 20), border_radius=5)
            pygame.draw.circle(world, (50, 40, 30), (cx - 9, cy - 22), 6)
            pygame.draw.circle(world, (50, 40, 30), (cx + 9, cy - 22), 6)
            self.draw_roads(world)
        W.text(world, "THE CROSSROADS ROUTE", (S.WORLD_W // 2, 18), 26, (96, 66, 42), anchor="midtop", bold=True)

    def draw_roads(self, world: pygame.Surface) -> None:
        offered = self.route[self.stop]
        W.text(world, "Which road will the caravan take?", (S.WORLD_W // 2, 214), 30, (60, 40, 26), anchor="midtop", bold=True)
        cw, ch, gap = 236, 270, 14
        x0 = (S.WORLD_W - (4 * cw + 3 * gap)) // 2
        for i in range(4):
            r = pygame.Rect(x0 + i * (cw + gap), 262, cw, ch)
            sel = i == self.sel
            col = (250, 240, 215) if sel else (232, 214, 176)
            pygame.draw.rect(world, col, r, border_radius=14)
            pygame.draw.rect(world, S.GOLD if sel else (110, 80, 50), r, 5 if sel else 2, border_radius=14)
            W.text(world, str(i + 1), (r.x + 12, r.y + 8), 26, (110, 80, 50), bold=True)
            if i < len(offered):
                t = offered[i]
                name, blurb = PLACE[t]
                pygame.draw.circle(world, GLYPH_COLOR[t], (r.centerx, r.y + 62), 36)
                pygame.draw.circle(world, (60, 40, 26), (r.centerx, r.y + 62), 36, 3)
                self._glyph(world, t, (r.centerx, r.y + 62))
                W.text(world, name, (r.centerx, r.y + 112), 26, (50, 34, 22), anchor="midtop", bold=True)
                y = r.y + 148
                for ln in W.wrap(blurb, 21, cw - 24)[:4]:
                    W.text(world, ln, (r.centerx, y), 21, (80, 60, 44), anchor="midtop")
                    y += 24
                if self.visits[t]:
                    W.text(world, f"visited {self.visits[t]}x", (r.centerx, r.bottom - 12), 18, (120, 90, 60), anchor="midbottom")
            else:
                pygame.draw.polygon(world, (150, 110, 70), [(r.centerx - 34, r.y + 92), (r.centerx, r.y + 36), (r.centerx + 34, r.y + 92)])
                W.text(world, "Make camp", (r.centerx, r.y + 112), 26, (50, 34, 22), anchor="midtop", bold=True)
                for k, ln in enumerate(W.wrap("Rest here and skip this stop. That is a fine choice too.", 21, cw - 24)):
                    W.text(world, ln, (r.centerx, r.y + 148 + k * 24), 21, (80, 60, 44), anchor="midtop")
        W.text(world, "Left / Right to look, Enter to go (or press 1-4)", (S.WORLD_W // 2, S.WORLD_H - 14), 22, (80, 56, 36), anchor="midbottom")

    @staticmethod
    def _glyph(world, t, c) -> None:
        x, y = c
        ink = (250, 244, 225)
        if t == "wheel_workshop":
            pygame.draw.circle(world, ink, c, 20, 3)
            for a in range(0, 360, 60):
                pygame.draw.line(world, ink, c, (x + 20 * math.cos(math.radians(a)), y + 20 * math.sin(math.radians(a))), 3)
        elif t == "lantern_riddle":
            pygame.draw.rect(world, ink, (x - 10, y - 14, 20, 28), 3, border_radius=4)
            pygame.draw.circle(world, ink, (x, y), 4)
        elif t == "mural_wall":
            pygame.draw.polygon(world, ink, [(x - 18, y + 14), (x, y - 18), (x + 18, y + 14)], 3)
        elif t == "fireside_circle":
            pygame.draw.circle(world, ink, (x - 10, y), 7, 3)
            pygame.draw.circle(world, ink, (x + 10, y), 7, 3)
            pygame.draw.line(world, ink, (x - 18, y + 16), (x + 18, y + 16), 3)
        elif t == "market_square":
            pygame.draw.rect(world, ink, (x - 18, y - 4, 36, 20), 3)
            pygame.draw.polygon(world, ink, [(x - 22, y - 4), (x, y - 20), (x + 22, y - 4)], 3)
        else:
            for k in range(3):
                pygame.draw.rect(world, ink, (x - 16 + k * 12, y + 10 - k * 9, 12, 8 + k * 9), 3)
