"""Level 7 - Career Workshop Challenge (RIASEC interest exploration).

A community makerspace open day. The player has a fixed number of time blocks and six benches, each offering a
different kind of hands-on work (none is labelled with a RIASEC letter or name):

    Repair Bay      fix a water pump by choosing and test-fitting parts
    Garden Lab      investigate why plants wilt by running experiments
    Design Studio   compose a poster with palettes, motifs and variations
    Learning Corner help a learner understand a timetable
    Event Desk      negotiate a vendor price, pitch a sponsor and organise a team
    Records Office  sort and verify delivery records against a rule sheet

Rules that make the telemetry meaningful:
* starting a round costs 1 block, completing it 1 more, an optional bonus 1 more -> the player cannot do everything;
* a round can be abandoned at any time ("step away") and an activity can be revisited for a new, deeper round (max 3);
* nothing is required except trying at least three rounds before ending the day;
* hints from the mentor are free but limited; they are recorded as help-seeking, never as a score.

The mapping from activity (task_id) to RIASEC categories lives in analytics/riasec_config.json, NOT in the telemetry,
so scoring can be re-run with different assumptions.
"""
from __future__ import annotations

import pygame

from analytics.event_schema import CAT_PLANNING, KIND_EXIT, KIND_NEUTRAL, KIND_SAFE, EventType as E
from game import settings as S
from game.input_state import InputState
from game.levels.base import Level
from game.levels.common import draw_station, nearest_station
from game.ui import widgets as W
from game.ui.panels import shade

TOTAL_BLOCKS = 14
MAX_ROUNDS = 3
MIN_ROUNDS_TO_END = 3
HINTS_PER_ROUND = 2
STATIONS = {
    "pump": pygame.Rect(80, 90, 170, 90), "lab": pygame.Rect(330, 90, 170, 90), "studio": pygame.Rect(580, 90, 170, 90),
    "learn": pygame.Rect(80, 430, 170, 90), "event": pygame.Rect(330, 430, 170, 90), "records": pygame.Rect(580, 430, 170, 90),
    "board": pygame.Rect(840, 90, 150, 70), "mentor": pygame.Rect(840, 440, 150, 70), "door": pygame.Rect(1010, 240, 70, 120),
}
TASKS = {                                        # station -> task id
    "pump": "repair_pump", "lab": "plant_lab", "studio": "poster_studio", "learn": "teach_timetable",
    "event": "open_day_stall", "records": "sort_records",
}
TASK_NAME = {"repair_pump": "Repair Bay", "plant_lab": "Garden Lab", "poster_studio": "Design Studio",
             "teach_timetable": "Learning Corner", "open_day_stall": "Event Desk", "sort_records": "Records Office"}
BLURB = {
    "repair_pump": "A village water pump is leaking. Pick the right parts and test it.",
    "plant_lab": "The bean plants are wilting and nobody knows why. Run experiments to find out.",
    "poster_studio": "Create a poster for the community fair: colours, shapes, a title style, extras.",
    "teach_timetable": "Noor is struggling to read a bus timetable. Help Noor learn it.",
    "open_day_stall": "Plan the food stall: get a fair price, win a sponsor and organise a team.",
    "sort_records": "Deliveries must be filed on the correct shelf following the rule sheet.",
}
EXPECTED_MS = {"repair_pump": 120_000, "plant_lab": 100_000, "poster_studio": 110_000, "teach_timetable": 100_000,
               "open_day_stall": 130_000, "sort_records": 100_000}
# required steps / optional steps available per round (used by analytics as denominators; also written in ACTIVITY_START)
STEP_COUNTS = {"repair_pump": (5, 2), "plant_lab": (2, 4), "poster_studio": (3, 6), "teach_timetable": (3, 4),
               "open_day_stall": (2, 3), "sort_records": (3, 2)}
BONUS_STEPS = {
    "repair_pump": [("Fit the pressure gauge: which tool?", ["Hammer", "Wrench", "Tape"], 1),
                    ("Where should the gauge go?", ["On the handle", "On the outlet pipe", "Under the seal"], 1)],
    "plant_lab": [("A new plot gets plenty of water and full sun. Prediction?", ["It wilts", "It thrives", "Cannot tell"], 1),
                  ("Which extra measurement would be most useful next?", ["Soil moisture", "Leaf colour of neighbours", "Pot colour"], 0)],
    "poster_studio": [("Add a second headline for the sign: which reads best from far away?", ["Thin pale text", "Large high-contrast text", "Small dark text"], 1),
                      ("Where should the date go?", ["Hidden in the pattern", "Bottom, clearly separate", "Behind the motif"], 1)],
    "teach_timetable": [("Noor's friend joins and is also confused. What first?", ["Give a worked example", "Show the answer sheet", "Skip it"], 0),
                        ("How do you know the friend understood?", ["Ask them to explain it back", "Ask 'ok?'", "Nothing"], 0)],
    "open_day_stall": [("Set the ticket price to cover costs of 60 with 15 visitors:", ["2", "4", "10"], 1),
                       ("A volunteer is late. Best response?", ["Re-plan the shifts calmly", "Cancel the stall", "Ignore it"], 0)],
    "sort_records": [("A record fits two shelves. What do you do?", ["Guess", "Check the rule sheet for the tie-break", "Leave it"], 1),
                     ("Best way to prevent filing errors tomorrow?", ["A short checklist at the door", "Work faster", "Nothing"], 0)],
}


def _num_menu(surf, rect, entries, y0, flash=""):
    """entries: [(number_label, text, enabled)]"""
    y = y0
    for num, text, enabled in entries:
        r = pygame.Rect(rect.x, y, rect.w, 40)
        W.panel(surf, r, S.PANEL_LIGHT if enabled else (30, 34, 50), S.ACCENT if enabled else None, 10)
        W.text(surf, str(num), (r.x + 12, r.centery), 24, S.ACCENT if enabled else (90, 96, 120), anchor="midleft", bold=True)
        lines = W.wrap(text, 21, r.w - 44)
        W.text(surf, lines[0], (r.x + 38, r.centery - (8 if len(lines) > 1 else 0)), 21, S.TEXT if enabled else (110, 116, 140), anchor="midleft")
        if len(lines) > 1:
            W.text(surf, lines[1], (r.x + 38, r.centery + 9), 21, S.TEXT if enabled else (110, 116, 140), anchor="midleft")
        y += 44
    return y


# =========================================================================================== base panel
class ActivityPanel:
    task_id = ""
    title = ""
    hint_lines: list[str] = ["Look carefully at the information on the left."]

    def __init__(self, level: "WorkshopLevel", round_no: int):
        self.level, self.round_no = level, round_no
        self.done, self.age, self.flash = False, 0, ""
        self.t0 = level.session.clock.ms
        self.stage = "main"                   # main | bonus | confirm_leave
        self._prev_stage = "main"
        self.req_done, self.opt_taken, self.hints = 0, 0, 0
        self.req_total, self.opt_total = STEP_COUNTS[self.task_id]
        self.completed, self.first_step = False, False
        self.bonus_i, self.bonus_correct, self.bonus_taken = 0, 0, False
        self.perf: float | None = None
        self.setup()

    # ---- to override
    def setup(self) -> None: ...
    def entries(self) -> list[tuple[str, bool]]: return []            # primary numbered entries (1..7)
    def primary(self, n: int) -> None: ...
    def draw_scene(self, surf, rect) -> None: ...

    # ---- generic
    @property
    def elapsed_ms(self) -> float:
        return self.level.session.clock.ms - self.t0

    def step(self, action: str, required: bool = True, correct=None, approach: str | None = None, **meta) -> None:
        lv = self.level
        if not self.first_step:
            self.first_step = True
            if approach:
                lv.log.log(E.APPROACH_CHOICE, action=approach, task_id=self.task_id, round=self.round_no, actor="player",
                           stage="approach", t_in_activity_ms=round(self.elapsed_ms))
        lv.log.log(E.ACTIVITY_STEP, action=action, task_id=self.task_id, round=self.round_no, required=required, correct=correct,
                   t_in_activity_ms=round(self.elapsed_ms), actor="player", stage="activity", **meta)
        if not required:
            self.opt_taken += 1

    def finish_required(self) -> None:
        if self.completed:
            return
        self.completed = True
        self.level.on_activity_completed(self)

    def update(self, inp: InputState) -> None:
        self.age += 1
        if inp.number is not None and self.age > 3:
            self.press(inp.number)

    def press(self, n: int) -> None:
        self.flash = ""
        if self.stage == "confirm_leave":
            if n == 1:
                self.level.on_activity_abandoned(self)
            elif n == 2:
                self.stage = self._prev_stage
            return
        if self.stage == "bonus":
            self._bonus_press(n)
            return
        if n == 8:
            self._hint()
        elif n == 9:
            self._prev_stage, self.stage = self.stage, "confirm_leave"
        elif 1 <= n <= 7:
            self.primary(n)

    def _hint(self) -> None:
        if self.hints >= HINTS_PER_ROUND:
            self.flash = "The mentor has no more hints for this round."
            return
        self.hints += 1
        self.step("ask_mentor", required=False, approach="ask_first", help=True, hint_no=self.hints)
        self.opt_taken -= 1                    # help is recorded as help-seeking, not as an optional step
        self.flash = "Mentor: " + self.hint_lines[min(self.hints - 1, len(self.hint_lines) - 1)]

    # ---- bonus
    def start_bonus(self) -> None:
        self.stage, self.bonus_taken, self.bonus_i = "bonus", True, 0

    def _bonus_press(self, n: int) -> None:
        if n == 9:
            self._prev_stage, self.stage = "bonus", "confirm_leave"
            return
        prompt, opts, correct = BONUS_STEPS[self.task_id][self.bonus_i]
        if not 1 <= n <= len(opts):
            return
        ok = (n - 1) == correct
        self.bonus_correct += int(ok)
        self.step("bonus_step", required=False, correct=ok, bonus=True, index=self.bonus_i)
        self.bonus_i += 1
        self.flash = "Good choice." if ok else "Hm - not the best option, but let's carry on."
        if self.bonus_i >= len(BONUS_STEPS[self.task_id]):
            self.level.finalize_activity(self)

    # ---- drawing
    def draw(self, surf: pygame.Surface) -> None:
        shade(surf, 170)
        box = pygame.Rect(30, 20, S.SCREEN_W - 60, S.SCREEN_H - 40)
        W.panel(surf, box, S.PANEL, S.ACCENT_2, 18)
        W.text(surf, f"{TASK_NAME[self.task_id]} - {self.title}  (round {self.round_no + 1})", (box.x + 24, box.y + 14), 36, bold=True)
        W.text(surf, f"Time blocks left: {self.level.blocks}", (box.right - 24, box.y + 18), 28, S.GOLD, anchor="topright", bold=True)
        scene = pygame.Rect(box.x + 24, box.y + 64, 560, 470)
        W.panel(surf, scene, (24, 28, 44), None, 12)
        menu = pygame.Rect(scene.right + 24, scene.y, box.right - scene.right - 48, 100)
        if self.stage == "confirm_leave":
            W.text(surf, "Step away from this activity?", (menu.x, menu.y), 26, S.WARN, bold=True)
            _num_menu(surf, menu, [(1, "Yes, leave it unfinished", True), (2, "No, keep going", True)], menu.y + 40)
        elif self.stage == "bonus":
            prompt, opts, _ = BONUS_STEPS[self.task_id][self.bonus_i]
            self.draw_scene(surf, scene)
            W.text(surf, f"Bonus challenge {self.bonus_i + 1}/{len(BONUS_STEPS[self.task_id])}", (menu.x, menu.y), 26, S.ACCENT_2, bold=True)
            yy = W.paragraph(surf, prompt, (menu.x, menu.y + 34), 24, menu.w, S.TEXT, 2) + 6
            _num_menu(surf, menu, [(i + 1, o, True) for i, o in enumerate(opts)] + [(9, "Step away", True)], yy)
        else:
            self.draw_scene(surf, scene)
            ent = [(i + 1, t, en) for i, (t, en) in enumerate(self.entries())]
            ent.append((8, f"Ask the mentor for a hint ({HINTS_PER_ROUND - self.hints} left)", self.hints < HINTS_PER_ROUND))
            ent.append((9, "Step away from this activity", True))
            _num_menu(surf, menu, ent, menu.y)
        if self.flash:
            W.paragraph(surf, self.flash, (box.x + 28, box.bottom - 80), 24, box.w - 56, S.WARN, 2)
        W.text(surf, "Press the number of an action.  Nothing here is timed.", (box.centerx, box.bottom - 14), 20, S.TEXT_DIM, anchor="midbottom")


# ============================================================================================ 1. pump
SLOT_NAMES = ["Inlet pipe", "Valve", "Seal ring", "Handle"]
PART_NAMES = [["narrow", "standard", "wide"], ["brass", "steel", "plastic"], ["thin", "medium", "thick"], ["short", "medium", "long"]]
PUMP_SOLUTIONS = [(1, 1, 2, 2), (2, 0, 1, 0), (0, 1, 0, 1)]
PUMP_MANUAL = [
    ["Inlet pipe: not the narrow one, not the wide one.", "Valve: neither brass nor plastic.", "Seal ring: the thickest.", "Handle: the longest."],
    ["Inlet pipe: the widest available.", "Valve: brass (it is the only one that fits the thread).", "Seal ring: medium.", "Handle: the shortest (tight space)."],
    ["Inlet pipe: the narrowest.", "Valve: steel.", "Seal ring: the thinnest.", "Handle: medium length."],
]


class PumpPanel(ActivityPanel):
    task_id, title = "repair_pump", "Fix the village water pump"
    hint_lines = ["The manual lists a clue for each part.", "A test run tells you which parts are right - use it."]

    def setup(self) -> None:
        self.sol = PUMP_SOLUTIONS[self.round_no % 3]
        self.choice = [None] * 4
        self.mode, self.slot = "slots", 0
        self.tests, self.manual_read, self.last_test = 0, False, None

    def entries(self):
        if self.mode == "parts":
            return [(f"{PART_NAMES[self.slot][i]}", True) for i in range(3)] + [("Back", True)]
        out = [(f"{SLOT_NAMES[i]}: {PART_NAMES[i][self.choice[i]] if self.choice[i] is not None else '-'}", True) for i in range(4)]
        out += [("Run a test", True), ("Read the repair manual (optional)", not self.manual_read)]
        return out

    def primary(self, n: int) -> None:
        if self.mode == "parts":
            if 1 <= n <= 3:
                self.choice[self.slot] = n - 1
                ok = self.sol[self.slot] == n - 1
                self.step("fit_part", required=True, correct=None, approach="hands_on_first", slot=SLOT_NAMES[self.slot], part=PART_NAMES[self.slot][n - 1])
                self.mode = "slots"
            elif n == 4:
                self.mode = "slots"
            return
        if 1 <= n <= 4:
            self.slot, self.mode = n - 1, "parts"
        elif n == 5:
            if any(c is None for c in self.choice):
                self.flash = "Fit a part in every position before testing."
                return
            self.tests += 1
            res = [self.choice[i] == self.sol[i] for i in range(4)]
            self.last_test = res
            self.step("test_run", required=True, correct=all(res), approach="hands_on_first", n_correct=sum(res), test_no=self.tests)
            self.req_done = min(self.req_total, 1 + min(self.tests, 3) + sum(res) // 2) if not all(res) else self.req_total
            if all(res):
                self.perf = max(0.0, 1.0 - (self.tests - 1) / 8.0)
                self.flash = "The pump runs without a leak!"
                self.finish_required()
            else:
                self.flash = f"Leaks remain: {4 - sum(res)} part(s) are wrong."
        elif n == 6 and not self.manual_read:
            self.manual_read = True
            self.step("read_manual", required=False, approach="read_first")
            self.flash = " ".join(PUMP_MANUAL[self.round_no % 3])

    def draw_scene(self, surf, rect):
        W.text(surf, "PUMP", (rect.centerx, rect.y + 14), 26, S.TEXT_DIM, anchor="midtop", bold=True)
        pygame.draw.rect(surf, (90, 110, 150), (rect.x + 60, rect.y + 190, 440, 30), border_radius=8)       # pipe
        pygame.draw.rect(surf, (150, 120, 80), (rect.x + 240, rect.y + 90, 80, 110), border_radius=10)      # body
        pygame.draw.rect(surf, (180, 180, 190), (rect.x + 270, rect.y + 50, 20, 50), border_radius=6)        # handle
        for i in range(4):
            r = pygame.Rect(rect.x + 30 + i * 135, rect.y + 270, 120, 70)
            col = (60, 70, 100)
            if self.last_test is not None and self.choice[i] is not None:
                col = (40, 120, 90) if self.last_test[i] else (140, 60, 60)
            W.panel(surf, r, col, S.ACCENT if (self.mode == "parts" and self.slot == i) else None, 10)
            W.text(surf, SLOT_NAMES[i], (r.centerx, r.y + 14), 20, S.TEXT, anchor="midtop")
            W.text(surf, PART_NAMES[i][self.choice[i]] if self.choice[i] is not None else "-", (r.centerx, r.y + 42), 24, S.GOLD, anchor="midtop", bold=True)
        W.text(surf, f"Test runs: {self.tests}", (rect.x + 20, rect.bottom - 40), 24, S.TEXT_DIM)


# ============================================================================================ 2. lab
LAB_SCENARIOS = [
    {"title": "Why are the bean plants wilting?",
     "rows": [("Plot 1", "full sun", "little water", "sandy", "wilting"), ("Plot 2", "full sun", "plenty of water", "sandy", "healthy"),
              ("Plot 3", "shade", "little water", "clay", "wilting")],
     "experiments": [("Water Plot 1 well", "Plot 1 recovers within a day."), ("Move Plot 3 into the sun", "Plot 3 still wilts."),
                     ("Swap Plot 2's soil for clay", "Plot 2 stays healthy."), ("Measure the soil temperature", "All plots are about the same.")],
     "causes": ["Not enough water", "Too much sun", "The soil type", "Cannot tell yet"], "correct": 0},
    {"title": "Why is the lamp circuit dim?",
     "rows": [("Circuit A", "new battery", "short wire", "thin wire", "dim"), ("Circuit B", "new battery", "short wire", "thick wire", "bright"),
              ("Circuit C", "old battery", "long wire", "thick wire", "dim")],
     "experiments": [("Replace A's wire with a thick one", "Circuit A becomes bright."), ("Put a new battery in C", "Circuit C becomes a little brighter."),
                     ("Shorten C's wire", "Circuit C stays dim."), ("Swap the bulbs of A and B", "The dimness stays with the circuit.")],
     "causes": ["The bulb", "A thin wire", "The battery age", "Cannot tell yet"], "correct": 1},
    {"title": "Why did the bread not rise?",
     "rows": [("Loaf 1", "warm room", "fresh yeast", "no salt", "flat"), ("Loaf 2", "warm room", "fresh yeast", "salt", "risen"),
              ("Loaf 3", "cold room", "fresh yeast", "salt", "flat")],
     "experiments": [("Add salt to Loaf 1's next batch", "It still comes out flat."), ("Move Loaf 3 to the warm room", "Loaf 3 rises."),
                     ("Use old yeast in Loaf 2", "Loaf 2 rises a bit less."), ("Weigh all three doughs", "The weights are equal.")],
     "causes": ["Missing salt", "A cold room", "The yeast", "Cannot tell yet"], "correct": 1},
]


class LabPanel(ActivityPanel):
    task_id, title = "plant_lab", "Investigate the problem"
    hint_lines = ["Compare the plots: which one differs from the healthy plot?", "An experiment that changes only one thing tells you most."]

    def setup(self) -> None:
        self.sc = LAB_SCENARIOS[self.round_no % 3]
        self.run: list[int] = []
        self.mode = "main"
        self.concluded = False

    def entries(self):
        if self.mode == "conclude":
            return [(c, True) for c in self.sc["causes"]]
        out = [(f"Experiment: {e[0]}", i not in self.run) for i, e in enumerate(self.sc["experiments"])]
        out.append(("Draw a conclusion", True))
        return out

    def primary(self, n: int) -> None:
        if self.mode == "conclude":
            if 1 <= n <= 4:
                ok = (n - 1) == self.sc["correct"]
                self.step("conclude", required=True, correct=ok, choice=self.sc["causes"][n - 1], n_experiments=len(self.run))
                self.perf = (1.0 if ok else 0.3) * (1.0 if len(self.run) >= 1 else 0.7)
                self.req_done = self.req_total
                self.flash = "That matches the evidence." if ok else "The evidence points elsewhere - but you have finished the investigation."
                self.finish_required()
            return
        if 1 <= n <= 4 and (n - 1) not in self.run:
            self.run.append(n - 1)
            self.step("experiment", required=(len(self.run) == 1), approach="hands_on_first" if len(self.run) == 1 else None,
                      correct=None, exp=self.sc["experiments"][n - 1][0], n_run=len(self.run))
            self.flash = "Result: " + self.sc["experiments"][n - 1][1]
        elif n == 5:
            if not self.run:
                self.flash = "Run at least one experiment first."
                return
            self.mode = "conclude"

    def draw_scene(self, surf, rect):
        W.text(surf, self.sc["title"], (rect.x + 18, rect.y + 14), 28, S.TEXT, bold=True)
        y = rect.y + 60
        hdr = ["", "light / heat", "water / input", "material", "result"]
        for j, h in enumerate(hdr):
            W.text(surf, h, (rect.x + 14 + j * 108, y), 20, S.TEXT_DIM)
        y += 28
        for row in self.sc["rows"]:
            for j, v in enumerate(row):
                W.text(surf, v, (rect.x + 14 + j * 108, y), 20, S.TEXT if j < 4 else S.GOLD)
            y += 30
        y += 14
        W.text(surf, "Experiments run so far:", (rect.x + 18, y), 22, S.TEXT_DIM)
        for k, idx in enumerate(self.run):
            W.text(surf, f"- {self.sc['experiments'][idx][0]}: {self.sc['experiments'][idx][1]}", (rect.x + 24, y + 28 + 28 * k), 20, S.TEXT)


# ============================================================================================ 3. studio
BACKGROUNDS = [("sunrise", (250, 200, 120)), ("lagoon", (80, 170, 190)), ("plum", (120, 80, 150)), ("moss", (110, 150, 100))]
MOTIFS = ["circles", "triangles", "waves", "stars"]
TITLES = ["bold block letters", "tall thin letters", "round friendly letters"]
EXTRAS = ["border", "sparkles", "stripes", "shadow"]
BRIEFS = ["Harvest Fair", "Science Night", "Evening of Music"]


class StudioPanel(ActivityPanel):
    task_id, title = "poster_studio", "Design the fair poster"
    hint_lines = ["There is no right answer - try things and look at the preview.", "Variations show other combinations you may not have tried."]

    def setup(self) -> None:
        self.bg, self.motif, self.title_style = 0, 0, 0
        self.extras: set[int] = set()
        self.changes, self.variations = 0, set()
        self.changes_kinds: set[str] = set()

    def entries(self):
        return [(f"Background: {BACKGROUNDS[self.bg][0]}", True), (f"Motif: {MOTIFS[self.motif]}", True),
                (f"Title style: {TITLES[self.title_style]}", True),
                ("Extras: " + (", ".join(EXTRAS[i] for i in sorted(self.extras)) or "none") + " (cycle)", True),
                ("Try a surprise variation", True), ("Finish the poster", True)]

    def _changed(self, kind: str, required: bool) -> None:
        self.changes += 1
        self.changes_kinds.add(kind)
        self.req_done = min(self.req_total, self.changes)
        self.step("design_change", required=required, kind=kind, n_changes=self.changes, approach="try_first" if self.changes == 1 else None)

    def primary(self, n: int) -> None:
        if n == 1:
            self.bg = (self.bg + 1) % len(BACKGROUNDS); self._changed("background", self.changes < 3)
        elif n == 2:
            self.motif = (self.motif + 1) % len(MOTIFS); self._changed("motif", self.changes < 3)
        elif n == 3:
            self.title_style = (self.title_style + 1) % len(TITLES); self._changed("title", self.changes < 3)
        elif n == 4:
            k = (max(self.extras) + 1) % len(EXTRAS) if self.extras else 0
            if k in self.extras:
                self.extras.discard(k)
            else:
                self.extras.add(k)
            self._changed("extra", False)
        elif n == 5:
            v = len(self.variations) + 1
            self.variations.add(v)
            self.bg, self.motif, self.title_style = (self.bg + v) % 4, (self.motif + 2 * v) % 4, (self.title_style + v) % 3
            self.extras = {v % 4}
            self.step("variation", required=False, n_variation=v)
        elif n == 6:
            if self.changes < 2:
                self.flash = "Make at least two changes before finishing."
                return
            self.step("finish_poster", required=True, n_changes=self.changes, distinct_kinds=len(self.changes_kinds),
                      variations=len(self.variations))
            self.req_done = self.req_total
            self.perf = None                          # artistic work has no 'correct' answer
            self.finish_required()

    def draw_scene(self, surf, rect):
        canvas = pygame.Rect(rect.x + 70, rect.y + 20, 420, 420)
        col = BACKGROUNDS[self.bg][1]
        pygame.draw.rect(surf, col, canvas, border_radius=8)
        dark = tuple(max(0, c - 70) for c in col)
        light = tuple(min(255, c + 60) for c in col)
        cx, cy = canvas.center
        m = MOTIFS[self.motif]
        for i in range(3):
            ox = (i - 1) * 110
            if m == "circles":
                pygame.draw.circle(surf, dark, (cx + ox, cy + 30), 44)
            elif m == "triangles":
                pygame.draw.polygon(surf, dark, [(cx + ox, cy - 20), (cx + ox - 44, cy + 70), (cx + ox + 44, cy + 70)])
            elif m == "waves":
                for k in range(4):
                    pygame.draw.arc(surf, dark, (cx + ox - 50, cy + 10 + k * 18, 100, 50), 0.2, 2.9, 4)
            else:
                pts = [(cx + ox + (30 if j % 2 == 0 else 14) * __import__("math").cos(j * 0.628 - 1.57),
                        cy + 30 + (30 if j % 2 == 0 else 14) * __import__("math").sin(j * 0.628 - 1.57)) for j in range(10)]
                pygame.draw.polygon(surf, dark, pts)
        if 0 in self.extras:
            pygame.draw.rect(surf, light, canvas, 8, border_radius=8)
        if 1 in self.extras:
            for k in range(14):
                pygame.draw.circle(surf, light, (canvas.x + 30 + (k * 53) % 360, canvas.y + 40 + (k * 91) % 330), 4)
        if 2 in self.extras:
            for k in range(0, 420, 40):
                pygame.draw.line(surf, light, (canvas.x + k, canvas.y), (canvas.x + k + 60, canvas.bottom), 3)
        title = BRIEFS[self.round_no % 3].upper()
        size = {0: 54, 1: 44, 2: 50}[self.title_style]
        if 3 in self.extras:
            W.text(surf, title, (canvas.centerx + 3, canvas.y + 62), size, (0, 0, 0), anchor="center", bold=self.title_style != 1)
        W.text(surf, title, (canvas.centerx, canvas.y + 60), size, (250, 250, 250), anchor="center", bold=self.title_style != 1)
        W.text(surf, f"Changes: {self.changes}   Variations tried: {len(self.variations)}", (rect.x + 20, rect.bottom - 30), 22, S.TEXT_DIM)


# ============================================================================================ 4. learner
TEACH_ACTIONS = [
    ("Explain it step by step", 25, 5, "explain"), ("Show a worked example", 20, 10, "example"),
    ("Ask Noor to try one while you watch", 15, 15, "practice"), ("Just tell Noor the answer", 5, -10, "tell"),
    ("Encourage Noor", 0, 20, "encourage"), ("Check what Noor already understands", 5, 0, "check")]
TOPICS = ["reading a bus timetable", "adding fractions", "reading a street map"]


class LearnerPanel(ActivityPanel):
    task_id, title = "teach_timetable", "Help Noor learn"
    hint_lines = ["Noor learns best when understanding and confidence both grow.", "Practice works better once Noor understands the basics."]

    def setup(self) -> None:
        self.und, self.conf, self.turns = 20, 30, 0
        self.log_lines: list[str] = ["Noor: I just don't get " + TOPICS[self.round_no % 3] + "..."]
        self.checked = False
        self.kinds: list[str] = []

    def entries(self):
        return [(t[0], self.turns < 8) for t in TEACH_ACTIONS]

    def primary(self, n: int) -> None:
        if not 1 <= n <= len(TEACH_ACTIONS) or self.turns >= 8:
            return
        label, du, dc, kind = TEACH_ACTIONS[n - 1]
        if kind == "practice" and self.und < 35:
            dc = -5
            reply = "Noor: I'm not ready to try it yet..."
        else:
            reply = {"explain": "Noor: Oh, so each row is a bus!", "example": "Noor: Ahh, I see how you read it now.",
                     "practice": "Noor tries one and gets it mostly right.", "tell": "Noor: Okay... but why is that the answer?",
                     "encourage": "Noor smiles and sits up straighter.", "check": f"Noor: I understand about {self.und}% so far."}[kind]
        self.und = min(100, self.und + du)
        self.conf = max(0, min(100, self.conf + dc))
        self.turns += 1
        self.kinds.append(kind)
        self.log_lines = (self.log_lines + [reply])[-5:]
        required = self.req_done < self.req_total
        self.step("teach_turn", required=required, kind=kind, understanding=self.und, confidence=self.conf, turn=self.turns,
                  approach={"explain": "explain_first", "example": "example_first"}.get(kind) if self.turns == 1 else None)
        if kind == "check":
            self.checked = True
        self.req_done = min(self.req_total, self.turns)
        if (self.und >= 80 and self.conf >= 50) or self.turns >= 8:
            goal = self.und >= 80 and self.conf >= 50
            self.perf = (self.und + self.conf) / 200.0
            self.flash = "Noor can read it confidently now!" if goal else "The session is over - Noor made some progress."
            self.req_done = self.req_total
            self.finish_required()

    def draw_scene(self, surf, rect):
        W.text(surf, f"Teaching: {TOPICS[self.round_no % 3]}", (rect.x + 18, rect.y + 14), 28, S.TEXT, bold=True)
        pygame.draw.circle(surf, (230, 190, 150), (rect.centerx, rect.y + 130), 44)
        pygame.draw.circle(surf, (40, 40, 60), (rect.centerx - 14, rect.y + 122), 5)
        pygame.draw.circle(surf, (40, 40, 60), (rect.centerx + 14, rect.y + 122), 5)
        mood = (rect.centerx - 14, rect.y + 144, 28, 10)
        pygame.draw.arc(surf, (40, 40, 60), mood, 3.4 if self.conf < 40 else 0.2, 6.0 if self.conf < 40 else 2.9, 3)
        W.text(surf, "Understanding", (rect.x + 30, rect.y + 210), 22, S.TEXT_DIM)
        W.bar(surf, (rect.x + 30, rect.y + 236, 500, 20), self.und / 100, S.ACCENT, radius=6)
        W.text(surf, "Confidence", (rect.x + 30, rect.y + 270), 22, S.TEXT_DIM)
        W.bar(surf, (rect.x + 30, rect.y + 296, 500, 20), self.conf / 100, S.ACCENT_2, radius=6)
        W.text(surf, f"Turn {self.turns}/8", (rect.right - 20, rect.y + 214), 22, S.TEXT_DIM, anchor="topright")
        yy = rect.y + 340
        for ln in self.log_lines[-4:]:
            yy = W.paragraph(surf, ln, (rect.x + 30, yy), 22, 500, S.TEXT, 0) + 2


# ============================================================================================ 5. stall
ARGUMENTS = [("Thousands of local families will see your name", "reach"), ("Your logo will be on every banner", "brand"),
             ("We have lots of volunteers", "irrelevant"), ("The stall is fun", "irrelevant")]
SPONSOR_WANTS = [{"reach", "brand"}, {"reach"}, {"brand"}]


class DealPanel(ActivityPanel):
    task_id, title = "open_day_stall", "Plan the food stall"
    hint_lines = ["The vendor may accept a counter-offer if it is fair.", "The sponsor cares about two things: reach and brand."]

    def setup(self) -> None:
        self.ask = 60 + 5 * (self.round_no % 3)
        self.floor = 42 + 3 * (self.round_no % 3)
        self.mode = "main"
        self.vendor_done, self.sponsor_done, self.team_done = False, False, False
        self.price: int | None = None
        self.counters = 0
        self.funding = 0
        self.picked: list[int] = []
        self.team_style: str | None = None
        self.budget = 100

    def entries(self):
        if self.mode == "vendor":
            return [(f"Accept {self.ask}", True), (f"Counter with {self.ask - 15}", True), (f"Counter with {self.ask - 25}", True), ("Back", True)]
        if self.mode == "sponsor":
            return [(a[0] + (" [chosen]" if i in self.picked else ""), True) for i, a in enumerate(ARGUMENTS)] + [("Make the pitch", len(self.picked) > 0)]
        if self.mode == "team":
            return [("Lead the team yourself and give orders", True), ("Let volunteers choose roles and check in", True), ("Share the leading with a volunteer", True), ("Back", True)]
        return [("Negotiate with the vendor" + (" - done" if self.vendor_done else ""), not self.vendor_done),
                ("Pitch the sponsor" + (" - done" if self.sponsor_done else ""), not self.sponsor_done),
                ("Organise the volunteer team (optional)" + (" - done" if self.team_done else ""), not self.team_done),
                ("Finalise the plan", self.vendor_done and self.sponsor_done)]

    def primary(self, n: int) -> None:
        if self.mode == "vendor":
            if n == 4:
                self.mode = "main"; return
            offer = {1: self.ask, 2: self.ask - 15, 3: self.ask - 25}.get(n)
            if offer is None:
                return
            self.counters += 1 if offer < self.ask else 0
            if offer >= self.floor:
                self.price, self.vendor_done = offer, True
                self.step("vendor_deal", required=True, offer=offer, accepted=True, counters=self.counters, mode="accept" if offer == self.ask else "counter")
                self.flash = f"Deal at {offer}."
                self.mode = "main"
            else:
                self.step("vendor_counter", required=False, offer=offer, accepted=False)
                self.flash = "The vendor shakes their head: too low. Try something fairer."
            return
        if self.mode == "sponsor":
            if 1 <= n <= 4:
                self.picked = [x for x in self.picked if x != n - 1] if (n - 1) in self.picked else (self.picked + [n - 1])[-2:]
            elif n == 5 and self.picked:
                kinds = {ARGUMENTS[i][1] for i in self.picked}
                want = SPONSOR_WANTS[self.round_no % 3]
                hit = len(kinds & want)
                self.funding = 40 if hit >= 2 or (hit == len(want) and hit > 0) else (20 if hit == 1 else 0)
                self.sponsor_done = True
                self.step("sponsor_pitch", required=True, args=[ARGUMENTS[i][1] for i in self.picked], funding=self.funding, persuasive=hit > 0)
                self.flash = f"The sponsor offers {self.funding}."
                self.mode = "main"
            return
        if self.mode == "team":
            if n == 4:
                self.mode = "main"; return
            if 1 <= n <= 3:
                self.team_style = {1: "directive", 2: "delegating", 3: "shared"}[n]
                self.team_done = True
                self.step("organise_team", required=False, style=self.team_style)
                self.flash = "The volunteers get to work."
                self.mode = "main"
            return
        if n == 1 and not self.vendor_done:
            self.mode = "vendor"
        elif n == 2 and not self.sponsor_done:
            self.mode = "sponsor"
        elif n == 3 and not self.team_done:
            self.mode = "team"
        elif n == 4 and self.vendor_done and self.sponsor_done:
            self.budget = 100 - (self.price or 0) + self.funding
            self.perf = max(0.0, min(1.0, (self.budget - 40) / 60.0))
            self.step("finalise_plan", required=True, budget_left=self.budget)
            self.req_done = self.req_total
            self.finish_required()

    def draw_scene(self, surf, rect):
        W.text(surf, "Open-day food stall - budget 100", (rect.x + 18, rect.y + 14), 28, S.TEXT, bold=True)
        lines = [f"Vendor asking price: {self.ask}", f"Agreed price: {self.price if self.price is not None else '-'}",
                 f"Sponsor funding: {self.funding if self.sponsor_done else '-'}",
                 f"Team style: {self.team_style or '-'}"]
        y = rect.y + 70
        for ln in lines:
            W.text(surf, ln, (rect.x + 24, y), 26, S.TEXT)
            y += 40
        if self.mode == "sponsor":
            W.paragraph(surf, "The sponsor is deciding who to fund. Choose up to two arguments (press again to remove).", (rect.x + 24, y + 20), 22, 500, S.TEXT_DIM)
        elif self.mode == "vendor":
            W.paragraph(surf, "The vendor listens. Counter-offers are allowed, but lowballing may fail.", (rect.x + 24, y + 20), 22, 500, S.TEXT_DIM)


# ============================================================================================ 6. records
SHELVES = ["A", "B", "C"]
RECORD_SETS = [
    {"rule": "Codes starting 1 -> shelf A, starting 2 -> shelf B, starting 3 -> shelf C.", "items": [("142", 0), ("317", 2), ("225", 1), ("108", 0), ("389", 2)]},
    {"rule": "Even codes -> shelf A, odd codes under 50 -> B, odd codes 50 or over -> C.", "items": [("24", 0), ("37", 1), ("61", 2), ("80", 0), ("45", 1)]},
    {"rule": "Last letter: P -> shelf A, T -> shelf B, any other -> shelf C.", "items": [("12P", 0), ("07T", 1), ("33K", 2), ("90T", 1), ("18P", 0)]},
]


class RecordsPanel(ActivityPanel):
    task_id, title = "sort_records", "File the deliveries"
    hint_lines = ["The rule sheet says exactly where each code goes.", "After a check, only re-file the records that were wrong."]

    def setup(self) -> None:
        self.rs = RECORD_SETS[self.round_no % 3]
        self.assign: list[int | None] = [None] * 5
        self.rule_read, self.checks = False, 0
        self.last_wrong: list[int] = []
        self.first_errors: int | None = None

    def entries(self):
        out = [(f"Record {r[0]}: shelf {SHELVES[self.assign[i]] if self.assign[i] is not None else '?'}", True) for i, r in enumerate(self.rs["items"])]
        out += [("Submit for checking", all(a is not None for a in self.assign)), ("Read the rule sheet (optional)", not self.rule_read)]
        return out

    def primary(self, n: int) -> None:
        if 1 <= n <= 5:
            cur = self.assign[n - 1]
            self.assign[n - 1] = 0 if cur is None else (cur + 1) % 3
            self.step("file_record", required=self.checks == 0, record=self.rs["items"][n - 1][0], shelf=SHELVES[self.assign[n - 1]],
                      approach="act_first" if not self.rule_read else None)
        elif n == 6:
            if any(a is None for a in self.assign):
                self.flash = "File every record before submitting."
                return
            self.checks += 1
            wrong = [i for i, (c, shelf) in enumerate(self.rs["items"]) if self.assign[i] != shelf]
            self.last_wrong = wrong
            if self.first_errors is None:
                self.first_errors = len(wrong)
            self.step("submit_check", required=True, correct=not wrong, n_wrong=len(wrong), check_no=self.checks)
            self.req_done = min(self.req_total, 1 + self.checks)
            if not wrong:
                self.perf = max(0.0, 1.0 - (self.first_errors or 0) / 5.0)
                self.flash = "All records filed correctly."
                self.req_done = self.req_total
                self.finish_required()
            else:
                self.flash = f"{len(wrong)} record(s) are on the wrong shelf. Fix them and submit again."
        elif n == 7 and not self.rule_read:
            self.rule_read = True
            self.step("read_rules", required=False, approach="read_first")
            self.flash = "Rule sheet: " + self.rs["rule"]

    def draw_scene(self, surf, rect):
        W.text(surf, "Delivery records", (rect.x + 18, rect.y + 14), 28, S.TEXT, bold=True)
        for i, (c, _) in enumerate(self.rs["items"]):
            r = pygame.Rect(rect.x + 24, rect.y + 64 + i * 66, 500, 54)
            bad = self.checks > 0 and i in self.last_wrong
            W.panel(surf, r, (110, 50, 60) if bad else (44, 52, 78), None, 10)
            W.text(surf, f"Code {c}", (r.x + 16, r.centery), 26, S.TEXT, anchor="midleft")
            W.text(surf, f"Shelf {SHELVES[self.assign[i]] if self.assign[i] is not None else '?'}", (r.right - 16, r.centery), 28, S.GOLD, anchor="midright", bold=True)
        W.text(surf, f"Checks submitted: {self.checks}", (rect.x + 20, rect.bottom - 34), 22, S.TEXT_DIM)


PANELS = {"repair_pump": PumpPanel, "plant_lab": LabPanel, "poster_studio": StudioPanel, "teach_timetable": LearnerPanel,
          "open_day_stall": DealPanel, "sort_records": RecordsPanel}


# ============================================================================================ the level
class WorkshopLevel(Level):
    level_id = 7
    name = "Career Workshop Challenge"
    scenario = "career_workshop"
    objective = "Open day! Try the benches that interest you. You have 14 time blocks and no wrong choices."
    controls_hint = "Move: WASD / Arrows   Interact: E   Pause: P   In activities: press the numbers"
    task_name = "open_day_workshop"
    start_pos = (900, 300)

    def build(self) -> None:
        self.blocks = TOTAL_BLOCKS
        self.rounds: dict[str, int] = {t: 0 for t in TASKS.values()}
        self.history: list[dict] = []
        self.starts = 0
        self.choice_no = 0
        self.active: ActivityPanel | None = None
        self._intro = True
        self.day_over = False
        self.peeked: set[str] = set()

    def level_start_metadata(self) -> dict:
        return {"blocks_total": TOTAL_BLOCKS, "tasks": list(TASKS.values()), "max_rounds": MAX_ROUNDS,
                "step_counts": {k: list(v) for k, v in STEP_COUNTS.items()}, "expected_ms": EXPECTED_MS,
                "min_rounds_to_end": MIN_ROUNDS_TO_END, "hints_per_round": HINTS_PER_ROUND}

    def solids(self):
        return [r for k, r in STATIONS.items() if k != "door"]

    def _log(self, etype, action=None, **kw):
        kw.setdefault("actor", "player")
        kw.setdefault("stage", "floor")
        return self.log.log(etype, action=action, **kw)

    # -------------------------------------------------------------------- update
    def on_update(self, dt: float, inp: InputState) -> None:
        if self._intro:
            self._intro = False
            self.open_message("Career Workshop open day", "", lines=[
                "Welcome to the community makerspace! Six benches offer different kinds of work.",
                f"You have {TOTAL_BLOCKS} time blocks. Starting a round costs 1, finishing it 1 more, a bonus challenge 1 more.",
                "You can look around a bench, try it, step away, come back for a new round, or ask the mentor for a hint.",
                "There are no right or wrong choices here. Spend your time on whatever you find worth doing.",
                f"You can end the day at the door after trying at least {MIN_ROUNDS_TO_END} rounds."])

    def on_interact(self) -> None:
        st = nearest_station(self.player, STATIONS)
        if st in TASKS:
            self.bench(TASKS[st])
        elif st == "board":
            self.open_message("Day Board", "", lines=self._board_lines())
            self._log(E.INFO_SEEKING, "read_day_board", source="board", redundant=False)
        elif st == "mentor":
            self.open_message("Mentor Priya", "Hints are available inside each activity (press 8). They are free, but limited.")
        elif st == "door":
            self.door()

    def _board_lines(self) -> list[str]:
        lines = [f"Time blocks left: {self.blocks} of {TOTAL_BLOCKS}"]
        for h in self.history:
            lines.append(f"{TASK_NAME[h['task']]} - round {h['round'] + 1}: {h['outcome']}")
        return lines if len(lines) > 1 else lines + ["Nothing tried yet."]

    # ---- bench
    def bench(self, task: str) -> None:
        r = self.rounds[task]
        if r >= MAX_ROUNDS:
            self.say(f"You have done all three rounds of the {TASK_NAME[task]}.", 2400)
            return
        if self.blocks < 1:
            self.say("No time blocks left.", 2000)
            return
        first_look = task not in self.peeked
        self.peeked.add(task)
        opts = [{"key": "start", "label": f"Start round {r + 1} (uses 1 time block)", "kind": KIND_NEUTRAL},
                {"key": "not_now", "label": "Not now", "kind": KIND_EXIT}]

        def chosen(o):
            if o["key"] == "start":
                self.begin_activity(task)
            else:
                self._log(E.ACTIVITY_CHOICE, "decline", task_id=task, round=r, selected=False, outcome="declined", first_look=first_look,
                          blocks_left=self.blocks)

        self.open_choice(f"l7_{task}_r{r}", CAT_PLANNING, TASK_NAME[task], BLURB[task] + (f"\nYou have tried {r} round(s) here already." if r else ""),
                         opts, chosen, context={"task_id": task, "round": r, "blocks_left": self.blocks})

    def begin_activity(self, task: str) -> None:
        r = self.rounds[task]
        self.rounds[task] += 1
        self.blocks -= 1
        self.starts += 1
        self.choice_no += 1
        self._log(E.ACTIVITY_CHOICE, "select", task_id=task, round=r, selected=True, voluntary=True, revisit=r > 0,
                  choice_no=self.choice_no, blocks_left=self.blocks, options=list(TASKS.values()))
        panel = PANELS[task](self, r)
        self.active = panel
        self._log(E.ACTIVITY_START, "start", task_id=task, round=r, required_steps=panel.req_total, optional_steps=panel.opt_total,
                  expected_ms=EXPECTED_MS[task], blocks_left=self.blocks)
        self.modal = panel

    # ---- panel callbacks
    def on_activity_completed(self, panel: ActivityPanel) -> None:
        if self.blocks >= 1:
            self.blocks -= 1
        self.modal = None
        if self.blocks >= 1:
            opts = [{"key": "bonus_yes", "label": "Yes - take the bonus challenge (uses 1 time block)", "kind": KIND_NEUTRAL},
                    {"key": "bonus_no", "label": "No thanks, I'm done here", "kind": KIND_EXIT}]

            def chosen(o):
                taken = o["key"] == "bonus_yes"
                self._log(E.ACTIVITY_STEP, "bonus_offer", task_id=panel.task_id, round=panel.round_no, required=False,
                          taken=taken, outcome="taken" if taken else "declined", stage="activity")
                if taken:
                    self.blocks -= 1
                    panel.start_bonus()
                    self.modal = panel
                else:
                    self.finalize_activity(panel)

            self.open_choice(f"l7_bonus_{panel.task_id}_{panel.round_no}", CAT_PLANNING, "Bonus challenge?",
                             "You finished the main task. There is an optional extra challenge.", opts, chosen,
                             context={"task_id": panel.task_id, "round": panel.round_no})
        else:
            self.finalize_activity(panel)

    def finalize_activity(self, panel: ActivityPanel) -> None:
        self._end_log(panel, "completed")
        self.history.append({"task": panel.task_id, "round": panel.round_no, "outcome": "completed"})
        self.active = None
        self.modal = None
        self.open_message(f"{TASK_NAME[panel.task_id]} - round {panel.round_no + 1} finished", panel.flash or "Nicely done.")
        self.modal.on_close = self._after_activity

    def on_activity_abandoned(self, panel: ActivityPanel) -> None:
        self._end_log(panel, "abandoned")
        self.history.append({"task": panel.task_id, "round": panel.round_no, "outcome": "stepped away"})
        self.active = None
        self.modal = None
        self.say("You stepped away. You can come back any time.", 2400)
        self._after_activity()

    def _end_log(self, panel: ActivityPanel, outcome: str) -> None:
        self._log(E.ACTIVITY_END, outcome, task_id=panel.task_id, round=panel.round_no, outcome=outcome,
                  engaged_ms=round(panel.elapsed_ms), expected_ms=EXPECTED_MS[panel.task_id],
                  required_done=panel.req_done if outcome != "completed" else panel.req_total, required_total=panel.req_total,
                  optional_taken=panel.opt_taken, optional_total=panel.opt_total, hints=panel.hints,
                  bonus_taken=panel.bonus_taken, bonus_correct=panel.bonus_correct, performance=panel.perf, blocks_left=self.blocks,
                  stage="activity")

    def _after_activity(self) -> None:
        if self.blocks <= 0 and not self.day_over:
            self.day_over = True
            self.open_message("The open day is over", "The makerspace is closing. Thank you for taking part!")
            self.modal.on_close = lambda: self.complete(blocks_left=self.blocks, rounds_started=self.starts,
                                                         tasks_tried=sum(1 for v in self.rounds.values() if v))

    def door(self) -> None:
        if self.starts < MIN_ROUNDS_TO_END:
            self.say(f"Try at least {MIN_ROUNDS_TO_END} rounds before ending the day (you have tried {self.starts}).", 3200)
            return
        opts = [{"key": "end_day", "label": f"End the open day now ({self.blocks} blocks unused)", "kind": KIND_SAFE},
                {"key": "stay", "label": "Stay and keep exploring", "kind": KIND_EXIT}]

        def chosen(o):
            if o["key"] == "end_day":
                self._log(E.PLAYER_INTERACTION, "end_day", object_id="door", novel=False, blocks_left=self.blocks, rounds=self.starts)
                self.complete(blocks_left=self.blocks, rounds_started=self.starts,
                              tasks_tried=sum(1 for v in self.rounds.values() if v))

        self.open_choice("l7_door", CAT_PLANNING, "Exit", "Ready to finish the open day?", opts, chosen)

    # ---- draw
    def hud_extra(self):
        return [("time blocks", str(self.blocks)), ("rounds tried", str(self.starts))]

    def draw_world(self, world: pygame.Surface) -> None:
        world.fill((88, 84, 96))
        for x in range(0, S.WORLD_W, 60):
            pygame.draw.line(world, (80, 76, 88), (x, 0), (x, S.WORLD_H))
        for y in range(0, S.WORLD_H, 60):
            pygame.draw.line(world, (80, 76, 88), (0, y), (S.WORLD_W, y))
        W.text(world, "COMMUNITY MAKERSPACE - OPEN DAY", (S.WORLD_W // 2 - 80, 30), 32, S.TEXT_DIM, anchor="center", bold=True)
        colors = {"pump": (150, 100, 70), "lab": (70, 130, 100), "studio": (150, 90, 140), "learn": (90, 120, 170),
                  "event": (170, 120, 70), "records": (100, 110, 130), "board": (70, 90, 110), "mentor": (110, 130, 90), "door": (60, 140, 110)}
        labels = {"pump": "Repair Bay", "lab": "Garden Lab", "studio": "Design Studio", "learn": "Learning Corner",
                  "event": "Event Desk", "records": "Records Office", "board": "Day Board", "mentor": "Mentor Priya", "door": "EXIT"}
        for k, r in STATIONS.items():
            draw_station(world, r, labels[k], colors[k], 24)
            if k in TASKS.values() or k in TASKS:
                t = TASKS.get(k)
                if t:
                    W.text(world, f"rounds {self.rounds[t]}/{MAX_ROUNDS}", (r.centerx, r.bottom + 4), 20, S.TEXT_DIM, anchor="midtop")

    def draw_overlay(self, world: pygame.Surface) -> None:
        st = nearest_station(self.player, STATIONS)
        if st and self.modal is None:
            r = STATIONS[st]
            W.key_hint(world, "E", (r.centerx - 8, r.y - 30), 24)
