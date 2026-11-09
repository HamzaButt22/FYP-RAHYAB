"""The six encounter scenes of Level 10 (Crossroads Caravan).

Every scene is a small cursor-driven activity: arrows move a cursor over a grid of cells, E acts on the cell under the
cursor, number keys pick a variant where one is needed, Tab heads back to the road. There are no timers, no hints, no
right or wrong answers and no scores. Each scene has a few REQUIRED steps (what the job needs) and some OPTIONAL depth
steps (extra care, extra curiosity, more people) that the player may skip. Scenes are named after the job, never after a
RIASEC category; the mapping lives in analytics/riasec_config.json.

Protocol (same as the other modal panels): update(inp), draw(surf), done.
"""
from __future__ import annotations

import pygame

from analytics.event_schema import EventType as E
from game import settings as S
from game.input_state import InputState
from game.ui import widgets as W
from game.ui.panels import shade

MIN_AGE_ACT = 4            # frames before a scene reacts to input (avoids carry-over key presses)
MIN_AGE_LEAVE = 25


class Scene:
    task_id = ""
    title = ""
    tip = ""
    cols, rows = 4, 2
    req_total, opt_total = 1, 0
    palette = (70, 90, 120)

    def __init__(self, level, round_no: int):
        self.level, self.round_no, self.rng = level, round_no, level.rng
        self.done, self.age, self.flash = False, 0, ""
        self.t0 = level.session.clock.ms
        self.req_done, self.opt_taken, self.first = 0, 0, False
        self.cells: list[dict] = []
        self.cursor = 0
        self.pending: dict | None = None
        self.setup()

    # ---- to override
    def setup(self) -> None: ...
    def press(self, cell: dict) -> None: ...
    def number(self, n: int) -> None: ...
    def cell_text(self, cell: dict) -> str: return cell["label"]

    @property
    def elapsed_ms(self) -> float:
        return self.level.session.clock.ms - self.t0

    def add(self, cid: str, label: str, x: int, y: int, req: bool = False, color=None, **extra) -> dict:
        c = {"id": cid, "label": label, "x": x, "y": y, "req": req, "done": False, "color": color or self.palette, **extra}
        self.cells.append(c)
        return c

    def cell(self, cid: str) -> dict:
        return next(c for c in self.cells if c["id"] == cid)

    # ---- logging
    def step(self, action: str, required: bool, count: bool = True, **meta) -> None:
        lv = self.level
        if not self.first:
            self.first = True
        lv.log.log(E.ACTIVITY_STEP, action=action, task_id=self.task_id, round=self.round_no, required=required,
                   t_in_activity_ms=round(self.elapsed_ms), actor="player", stage="activity", **meta)
        if required and count:
            self.req_done = min(self.req_total, self.req_done + 1)
        elif count:
            self.opt_taken = min(self.opt_total, self.opt_taken + 1)

    # ---- input
    def update(self, inp: InputState) -> None:
        self.age += 1
        if self.age <= MIN_AGE_ACT:
            return
        dx = int(inp.right) - int(inp.left)
        dy = int(inp.down) - int(inp.up)
        if dx or dy:
            self.move(dx, dy)
        if inp.number is not None:
            self.number(inp.number)
        elif inp.accept and self.pending is None:
            self.press(self.cells[self.cursor])
        elif inp.tab and self.age > MIN_AGE_LEAVE:
            self.level.scene_finished(self)

    def move(self, dx: int, dy: int) -> None:
        cur = self.cells[self.cursor]
        best, bd = None, 1e9
        for i, c in enumerate(self.cells):
            ox, oy = c["x"] - cur["x"], c["y"] - cur["y"]
            if (dx and ox * dx <= 0) or (dy and oy * dy <= 0):
                continue
            d = abs(ox) * (1 if dx else 3) + abs(oy) * (1 if dy else 3) + (abs(oy) if dx else abs(ox)) * 2
            if d < bd:
                best, bd = i, d
        if best is not None:
            self.cursor = best

    # ---- draw
    def cell_rect(self, c: dict, area: pygame.Rect) -> pygame.Rect:
        w, h = area.w // self.cols, area.h // self.rows
        return pygame.Rect(area.x + c["x"] * w + 6, area.y + c["y"] * h + 6, w - 12, h - 12)

    def draw_cell(self, surf, c: dict, r: pygame.Rect, selected: bool) -> None:
        col = tuple(min(255, v + (30 if c["done"] else 0)) for v in c["color"])
        pygame.draw.rect(surf, col, r, border_radius=12)
        pygame.draw.rect(surf, S.GOLD if selected else (20, 22, 30), r, 4 if selected else 2, border_radius=12)
        lines = W.wrap(self.cell_text(c), 22, r.w - 16)
        y = r.centery - len(lines) * 12
        for ln in lines[:3]:
            W.text(surf, ln, (r.centerx, y), 22, S.TEXT, anchor="midtop", bold=True)
            y += 24
        if c["done"]:
            W.text(surf, "done", (r.right - 8, r.bottom - 6), 18, S.GOLD, anchor="bottomright")

    def draw_extra(self, surf, rect: pygame.Rect) -> None: ...

    def draw(self, surf: pygame.Surface) -> None:
        shade(surf, 175)
        box = pygame.Rect(30, 20, S.SCREEN_W - 60, S.SCREEN_H - 40)
        W.panel(surf, box, (38, 34, 30), (214, 170, 96), 18)
        W.text(surf, self.title, (box.x + 24, box.y + 14), 36, bold=True)
        W.text(surf, f"Main job: {self.req_done}/{self.req_total}", (box.right - 24, box.y + 20), 26, S.GOLD, anchor="topright", bold=True)
        area = pygame.Rect(box.x + 24, box.y + 70, box.w - 48, 360)
        for i, c in enumerate(self.cells):
            self.draw_cell(surf, c, self.cell_rect(c, area), i == self.cursor)
        self.draw_extra(surf, pygame.Rect(box.x + 24, area.bottom + 6, box.w - 48, 70))
        if self.flash:
            W.text(surf, self.flash, (box.centerx, box.bottom - 78), 26, S.TEXT, anchor="midbottom")
        W.text(surf, self.tip, (box.centerx, box.bottom - 46), 21, S.TEXT_DIM, anchor="midbottom")
        W.text(surf, "Arrows move   E acts   Tab: head back to the road", (box.centerx, box.bottom - 14), 21, S.TEXT_DIM, anchor="midbottom")


# ======================================================================================= 1. wheel workshop
class WheelScene(Scene):
    task_id, title = "wheel_workshop", "Wainwright's Yard - the cracked wagon wheel"
    tip = "Spokes first, then test the wheel. Bolts and the axle are up to you."
    req_total, opt_total = 4, 4
    palette = (150, 100, 70)

    def setup(self) -> None:
        for i in range(3):
            self.add(f"s{i}", "Cracked spoke", i, 0, True, (170, 90, 70))
        self.add("test", "Spin test", 3, 0, True, (120, 130, 150))
        for i in range(3):
            self.add(f"b{i}", "Loose rim bolt", i, 1, False, (110, 110, 120))
        self.add("axle", "Dry axle", 3, 1, False, (100, 90, 60))

    def press(self, c: dict) -> None:
        cid = c["id"]
        if c["done"]:
            self.flash = "Already done."
            return
        if cid.startswith("s"):
            c["done"] = True
            c["label"] = "New spoke"
            self.step("replace_spoke", True, part=cid)
            self.flash = "You fit a new spoke."
        elif cid == "test":
            if all(self.cell(f"s{i}")["done"] for i in range(3)):
                c["done"] = True
                self.step("test_spin", True)
                self.flash = "The wheel spins true."
            else:
                self.flash = "Replace the cracked spokes first."
        else:
            c["done"] = True
            self.step("tighten_bolt" if cid.startswith("b") else "grease_axle", False, part=cid)
            self.flash = "Snug." if cid.startswith("b") else "The axle turns smoothly."


# ======================================================================================= 2. lantern riddle
class LanternScene(Scene):
    task_id, title = "lantern_riddle", "Observatory Hill - why do the lanterns burn dim?"
    tip = "Test what you like, then write down what you think. 1-3 choose a conclusion."
    req_total, opt_total = 3, 4
    palette = (70, 100, 140)
    READINGS = ["Smells of ordinary lamp oil.", "Cloudy - a bead of water sits under the oil.", "Clear and clean.",
                "Thin, but clear.", "A little cloudy."]
    HYPOTHESES = ["Water got into the oil", "The wicks are too short", "The wind keeps blowing them down"]

    def setup(self) -> None:
        self.reads = self.rng.sample(self.READINGS, 3)
        self.add("jarA", "Oil jar A", 0, 0, True)
        self.add("jarB", "Oil jar B", 1, 0, True)
        self.add("jarC", "Oil jar C", 2, 0, False)
        self.add("wick", "Wick ledger", 3, 0, False, (90, 110, 90))
        self.add("weather", "Weather log", 0, 1, False, (90, 110, 90))
        self.add("retest", "Retest a dim lantern", 1, 1, False, (110, 90, 130))
        self.add("report", "Write your conclusion", 2, 1, True, (150, 120, 70))
        self.concluding = False

    def tested(self) -> int:
        return sum(1 for k in ("jarA", "jarB", "jarC") if self.cell(k)["done"])

    def press(self, c: dict) -> None:
        cid = c["id"]
        if cid.startswith("jar"):
            if not c["done"]:
                c["done"] = True
                self.step("test_sample", cid != "jarC", sample=cid)
            self.flash = f"{c['label']}: {self.reads['ABC'.index(cid[-1])]}"
        elif cid in ("wick", "weather"):
            if not c["done"]:
                c["done"] = True
                self.step("read_log", False, source=cid)
            self.flash = "Wick lengths are all within a finger of each other." if cid == "wick" else "Mostly calm nights this month."
        elif cid == "retest":
            if self.tested() == 0:
                self.flash = "Test a sample first."
            elif not c["done"]:
                c["done"] = True
                self.step("retest", False)
                self.flash = "You repeat the test to be sure."
        elif cid == "report":
            if not (self.cell("jarA")["done"] and self.cell("jarB")["done"]):
                self.flash = "Test jars A and B before concluding."
            elif not c["done"]:
                self.concluding = True
                self.pending = c
                self.flash = "Conclusion: 1 water in the oil   2 wicks too short   3 wind"

    def number(self, n: int) -> None:
        if self.pending is not None and 1 <= n <= 3:
            self.pending["done"] = True
            self.step("conclude", True, hypothesis=self.HYPOTHESES[n - 1], tests_run=self.tested())
            self.pending = None
            self.concluding = False
            self.flash = "Noted. The next village can test it further."


# ======================================================================================= 3. mural wall
class MuralScene(Scene):
    task_id, title = "mural_wall", "The Painted Wall - a blank wall and a box of colours"
    tip = "1-4 pick a colour, E paints a tile, 5 mixes your own colour, 6 adds a motif. Any picture is fine."
    cols, rows = 4, 3
    req_total, opt_total = 3, 4
    COLORS = [(214, 80, 70), (80, 150, 220), (240, 200, 70), (90, 190, 120)]

    def setup(self) -> None:
        for i in range(12):
            self.add(f"t{i}", "", i % 4, i // 4, False, (70, 66, 62), paint=None, motif=False)
        self.colour = 0
        self.custom: tuple | None = None
        self.used: set = set()
        self.ach: set = set()

    def cell_text(self, cell): return ""

    def _paint_col(self, c):
        return c["paint"]

    def draw_cell(self, surf, c, r, selected):
        pygame.draw.rect(surf, c["paint"] or (70, 66, 62), r, border_radius=10)
        if c["motif"]:
            pygame.draw.circle(surf, (250, 245, 220), r.center, min(r.w, r.h) // 4)
        pygame.draw.rect(surf, S.GOLD if selected else (20, 22, 30), r, 4 if selected else 2, border_radius=10)

    def draw_extra(self, surf, rect):
        W.text(surf, "Brush:", (rect.x, rect.y + 10), 24, S.TEXT_DIM)
        pal = self.COLORS + ([self.custom] if self.custom else [])
        for i, col in enumerate(pal):
            r = pygame.Rect(rect.x + 90 + i * 54, rect.y + 6, 44, 36)
            pygame.draw.rect(surf, col, r, border_radius=8)
            if i == self.colour:
                pygame.draw.rect(surf, S.GOLD, r, 4, border_radius=8)

    def _achieve(self, key: str, action: str, **meta) -> None:
        if key not in self.ach:
            self.ach.add(key)
            self.step(action, False, **meta)

    def press(self, c: dict) -> None:
        pal = self.COLORS + ([self.custom] if self.custom else [])
        col = pal[self.colour]
        repaint = c["paint"] is not None
        c["paint"] = col
        c["done"] = False
        self.used.add(col)
        painted = sum(1 for k in self.cells if k["paint"])
        if repaint:
            self.step("repaint_tile", False, count=False, tile=c["id"])
        else:
            self.step("paint_tile", painted <= 3, tile=c["id"], colour_index=self.colour, tiles_painted=painted)
        if painted >= 8:
            self._achieve("many", "fill_most_of_wall", tiles=painted)
        if len(self.used) >= 3:
            self._achieve("colours", "use_three_colours", colours=len(self.used))

    def number(self, n: int) -> None:
        pal_n = len(self.COLORS) + (1 if self.custom else 0)
        if 1 <= n <= pal_n:
            self.colour = n - 1
        elif n == 5:
            self.custom = (self.rng.randint(60, 230), self.rng.randint(60, 230), self.rng.randint(60, 230))
            self.colour = len(self.COLORS)
            self._achieve("mix", "mix_custom_colour")
            self.flash = "You mix a new colour."
        elif n == 6:
            c = self.cells[self.cursor]
            if c["paint"]:
                c["motif"] = True
                self._achieve("motif", "add_motif", tile=c["id"])
            else:
                self.flash = "Paint the tile first."


# ======================================================================================= 4. fireside circle
class FiresideScene(Scene):
    task_id, title = "fireside_circle", "Fireside Camp - travellers resting by the fire"
    tip = "E on a person, then 1 listen   2 share food   3 show them how. There is no best answer."
    req_total, opt_total = 3, 4
    palette = (150, 90, 90)
    PEOPLE = [("Ines", "is worn out from walking"), ("Tomas", "lost his map"), ("Maya", "misses home"),
              ("Old Jun", "cannot light the stove"), ("Rafi", "is nervous about the pass"), ("Lena", "is hungry and shy")]

    def setup(self) -> None:
        for i, (name, need) in enumerate(self.PEOPLE):
            self.add(f"p{i}", f"{name}\n{need}", i % 3, i // 3, False, (150, 90, 90), name=name)
        self.add("wood", "Gather firewood for everyone", 3, 0, False, (120, 90, 60))
        self.helped = 0

    def cell_text(self, c): return c["label"].replace("\n", " - ")

    def press(self, c: dict) -> None:
        if c["done"]:
            self.flash = "They are already comforted."
        elif c["id"] == "wood":
            c["done"] = True
            self.step("gather_firewood", False, for_all=True)
            self.flash = "The fire grows warmer."
        else:
            self.pending = c
            self.flash = f"{c['name']}: 1 listen   2 share food   3 show them how"

    def number(self, n: int) -> None:
        if self.pending is not None and 1 <= n <= 3:
            c = self.pending
            self.pending = None
            c["done"] = True
            self.helped += 1
            way = ["listen", "share_food", "show_how"][n - 1]
            self.step("help_traveller", self.helped <= 3, way=way, person=c["name"])
            self.level.log.log(E.HELP_ACTION, action=way, actor="player", npc=c["name"], task_id=self.task_id)
            self.flash = f"{c['name']} smiles."


# ======================================================================================= 5. market square
class MarketScene(Scene):
    task_id, title = "market_square", "The Bazaar - stalls, hagglers and a waiting crowd"
    tip = "E on a stall to bargain (1 low offer   2 fair offer   3 ask for more). The crowd and volunteers are optional."
    req_total, opt_total = 3, 5
    palette = (170, 120, 70)
    GOODS = ["Rope", "Spices", "Lamp oil", "Cloth", "Dried fruit", "Tools"]

    def setup(self) -> None:
        for i, g in enumerate(self.GOODS):
            self.add(f"stall{i}", f"{g} stall", i % 4, i // 4, False, (170, 120, 70), good=g)
        self.add("crowd", "Pitch the caravan to the crowd", 2, 1, False, (150, 90, 130))
        self.add("crew", "Ask for volunteers", 3, 1, False, (90, 130, 110))
        self.deals = 0

    def press(self, c: dict) -> None:
        if c["done"]:
            self.flash = "You have already settled here."
        elif c["id"] == "crowd":
            c["done"] = True
            self.step("pitch_crowd", False)
            self.flash = "People clap, some step forward."
        elif c["id"] == "crew":
            c["done"] = True
            self.step("recruit_volunteers", False)
            self.flash = "Two travellers offer to carry crates."
        else:
            self.pending = c
            self.flash = f"{c['good']}: 1 low offer   2 fair offer   3 ask for more"

    def number(self, n: int) -> None:
        if self.pending is not None and 1 <= n <= 3:
            c = self.pending
            self.pending = None
            c["done"] = True
            self.deals += 1
            stance = ["low_offer", "fair_offer", "ask_more"][n - 1]
            self.step("strike_deal", self.deals <= 3, stance=stance, good=c["good"])
            self.flash = f"Deal struck: {c['good'].lower()}."


# ======================================================================================= 6. ledger tower
class LedgerScene(Scene):
    task_id, title = "ledger_tower", "Ledger House - crates in the wrong order"
    tip = "E picks a crate up, E on another crate swaps them. Put the numbers in rising order, then stamp the ledger."
    cols, rows = 6, 2
    req_total, opt_total = 2, 3
    palette = (110, 120, 140)

    def setup(self) -> None:
        tags = [1, 2, 3, 4, 5, 6]
        while tags == sorted(tags):
            self.rng.shuffle(tags)
        for i, t in enumerate(tags):
            self.add(f"c{i}", f"Crate {t}", i, 0, False, (140, 120, 90), tag=t)
        self.add("stamp", "Stamp the ledger", 0, 1, True, (150, 90, 90))
        self.add("recount", "Recount every crate", 1, 1, False, (90, 110, 130))
        self.add("label", "Chalk labels on the shelves", 2, 1, False, (90, 130, 110))
        self.add("sweep", "Sweep the floor", 3, 1, False, (110, 110, 110))
        self.held: int | None = None
        self.sorted = False

    def _crates(self):
        return self.cells[:6]

    def press(self, c: dict) -> None:
        cid = c["id"]
        if cid.startswith("c"):
            i = int(cid[1:])
            if self.held is None:
                self.held = i
                self.flash = f"Holding crate {c['tag']}."
            elif self.held == i:
                self.held = None
            else:
                a, b = self._crates()[self.held], c
                a["tag"], b["tag"] = b["tag"], a["tag"]
                a["label"], b["label"] = f"Crate {a['tag']}", f"Crate {b['tag']}"
                self.held = None
                self.step("swap_crates", False, count=False)
                tags = [k["tag"] for k in self._crates()]
                if tags == sorted(tags) and not self.sorted:
                    self.sorted = True
                    self.step("sort_crates", True, swaps_to_sorted=True)
                    self.flash = "The crates are in order."
        elif cid == "stamp":
            if not self.sorted:
                self.flash = "Order the crates before stamping."
            elif not c["done"]:
                c["done"] = True
                self.req_total = 2
                self.step("stamp_ledger", True)
                self.flash = "Stamped."
        elif not c["done"]:
            c["done"] = True
            self.step({"recount": "recount_crates", "label": "label_shelves", "sweep": "tidy_floor"}[cid], False)
            self.flash = "Done."

    def draw_cell(self, surf, c, r, selected):
        super().draw_cell(surf, c, r, selected)
        if c["id"].startswith("c") and self.held is not None and int(c["id"][1:]) == self.held:
            pygame.draw.rect(surf, (120, 220, 255), r, 4, border_radius=12)


SCENES = {cls.task_id: cls for cls in (WheelScene, LanternScene, MuralScene, FiresideScene, MarketScene, LedgerScene)}
