"""Level 9 - The Courtyard Garden (Big Five, exploratory).

A living, real-time garden simulation played with a CURSOR on a tile grid (no walking avatar, no numbered answer
panels). Five short days; a day ends when its clock runs out or the player chooses to sleep. Nothing can be failed and
nothing is scored on how well the garden grows: the level only records what the player spends their time and
attention on.

Tiles (5 x 4 grid): 12 garden beds, seed box, shed (forecast board / almanac / care chart), gate, bench, the neighbour's
two beds, compost bin and pond.

Engine events (tagged actor="engine", never counted as behaviour):
    day 2  aphids appear on planted beds and slowly spread            (pest_outbreak / pest_spread)
    day 2  neighbour Aslam asks for a hand at the gate                (neighbour_request)
    day 3  a hail forecast is pinned in the shed                      (forecast_posted)
    day 3  Aslam proposes moving the fence border                     (border_proposal)
    day 4  open garden day: visitors arrive at the gate               (visitor_arrived / visitor_left)
    day 4  hail hits uncovered beds in the evening                    (hail)

Per-day behaviour summaries are written as TIME_USE_SAMPLE events (seconds of active time per zone, care statistics),
which is the "time-use sampling" the analytics read. See docs/LEVEL_9_10.md for the behaviour -> feature mapping.
"""
from __future__ import annotations

import pygame

from analytics.event_schema import CAT_COOPERATION, CAT_PLANNING, KIND_NEUTRAL, KIND_PROSOCIAL, KIND_SELFISH, EventType as E
from game import settings as S
from game.input_state import InputState
from game.levels.base import Level
from game.ui import widgets as W
from game.ui.panels import shade

DAYS = 5
DAY_S = 36.0
IDLE_AFTER_S = 6.0
COLS, ROWS = 5, 4
PLOT_IDS = [f"p{r}{c}" for r in range(3) for c in range(4)]
PLACES = {"seedbox": (4, 0), "shed": (4, 1), "gate": (4, 2), "bench": (4, 3),
          "aslam_a": (0, 3), "aslam_b": (1, 3), "compost": (2, 3), "pond": (3, 3)}
TILE_POS = {pid: (int(pid[2]), int(pid[1])) for pid in PLOT_IDS} | PLACES
POS_TILE = {v: k for k, v in TILE_POS.items()}
ZONE = {"seedbox": "seeds", "shed": "info", "gate": "social", "bench": "social", "aslam_a": "neighbour",
        "aslam_b": "neighbour", "compost": "chore", "pond": "rest"} | {p: "garden" for p in PLOT_IDS}
ZONES = ["garden", "seeds", "info", "social", "neighbour", "chore", "rest", "idle"]

FAMILIAR = ["marigold", "bean", "lavender"]
MYSTERY = ["moonflower", "glass_thistle", "ember_fern"]
SEED_KEYS = {1: "marigold", 2: "bean", 3: "lavender", 4: "mystery"}
SPECIES_COLOR = {"marigold": (250, 170, 40), "bean": (120, 200, 90), "lavender": (170, 130, 230), "moonflower": (230, 240, 255),
                 "glass_thistle": (110, 220, 230), "ember_fern": (240, 100, 70)}
ALMANAC = ["Marigolds, beans and lavender are old reliable plants. Packets without a label are 'mystery seeds'.",
           "Mystery seeds can grow into moonflowers, glass thistles or ember ferns. Nobody is sure which.",
           "Two different plants side by side can be grafted together. The result is unpredictable."]
PLAN_TASKS = ["Water every planted bed", "Inspect every planted bed", "Label every planted bed", "Tidy the compost bin"]
MORNING = {
    1: "Day 1. The courtyard is yours for five days. Plant what you like, look around, or just sit. Nothing is graded.",
    2: "Day 2. The air is humid. Check on your beds when you feel like it.",
    3: "Day 3. Neighbour Aslam is up early, leaning on the fence.",
    4: "Day 4. Open garden day: people from the street may drop by the gate.",
    5: "Day 5. Harvest day. Pick what is ready and decide what to do with it.",
}
SCHEDULE = [(2, 16.0, "request"), (3, 6.0, "forecast"), (3, 18.0, "border"), (4, 4.0, "openday"),
            (4, 6.0, "visitor"), (4, 14.0, "visitor"), (4, 22.0, "visitor"), (4, 31.0, "hail")]
INVITE_VISITORS = [(4, 10.0), (4, 18.0)]
VISITOR_WAIT_S = 14.0
WATER_REPEAT_S = 7.0


def tile_rect(tid: str) -> pygame.Rect:
    c, r = TILE_POS[tid]
    return pygame.Rect(30 + c * 206, 8 + r * 142, 196, 130)


class PlanPanel:
    """Care chart: toggle today's intentions with 1-4, Enter to pin the chart up."""

    def __init__(self, level: "GardenLevel"):
        self.level, self.done, self.age = level, False, 0
        self.sel = set(level.plan_today)

    def update(self, inp: InputState) -> None:
        self.age += 1
        if inp.number is not None and 1 <= inp.number <= len(PLAN_TASKS):
            self.sel ^= {inp.number - 1}
        elif self.age > 8 and (inp.accept or inp.back):
            self.done = True
            self.level.set_plan(sorted(self.sel))

    def draw(self, surf: pygame.Surface) -> None:
        shade(surf)
        rect = pygame.Rect(0, 0, 700, 360)
        rect.center = (S.SCREEN_W // 2, S.SCREEN_H // 2 + 20)
        W.panel(surf, rect, S.PANEL, S.ACCENT_2, 16)
        W.text(surf, "Care chart - today (optional)", (rect.x + 28, rect.y + 18), 36, bold=True)
        W.text(surf, "Tick anything you intend to do today. Nothing is required.", (rect.x + 28, rect.y + 62), 22, S.TEXT_DIM)
        for i, t in enumerate(PLAN_TASKS):
            r = pygame.Rect(rect.x + 24, rect.y + 100 + i * 52, rect.w - 48, 44)
            on = i in self.sel
            W.panel(surf, r, S.PANEL_LIGHT if on else (36, 42, 64), S.ACCENT_2 if on else None, 10)
            W.text(surf, f"{i + 1}  [{'x' if on else ' '}]  {t}", (r.x + 16, r.centery), 26, anchor="midleft")
        W.text(surf, "Numbers toggle. Enter to pin the chart.", (rect.centerx, rect.bottom - 14), 20, S.TEXT_DIM, anchor="midbottom")


class GardenLevel(Level):
    level_id = 9
    name = "The Courtyard Garden"
    scenario = "courtyard_garden"
    objective = "Five days in a shared courtyard garden. Spend them however you like - nothing here is graded."
    controls_hint = "Arrows/WASD: move cursor   E: main action   1-7: tools   Tab: sleep   P: pause"
    task_name = "courtyard_season"

    # ------------------------------------------------------------------ setup
    def build(self) -> None:
        self.day, self.day_t = 1, 0.0
        self.cursor = TILE_POS["p00"]
        self.plots: dict[str, dict] = {}
        for pid in PLOT_IDS:
            self.plots[pid] = {"species": None, "growth": 0.0, "last_water": -99.0, "pest": False, "labelled": False,
                               "covered": False, "bruised": False, "hybrid": False, "watered": False, "inspected": False}
        self.held: str | None = None
        self.mystery_order = list(self.rng.sample(MYSTERY, 3))
        self.mystery_n = 0
        self.fired: set = set()
        self.clock_s = 0.0                      # level clock in seconds of play (paused while a modal is open)
        self.since_input = 0.0
        self.zone_s = {z: 0.0 for z in ZONES}
        self.age_day = 0
        self.plan_today: list[int] = []
        self.plan_done_flags = {0: False, 1: False, 2: False, 3: False}
        self.compost_today = False
        self.forecast_posted = False
        self.forecast_seen = None               # what the player last read on the board
        self.almanac_read = 0
        self.invited = False
        self.request = "none"                   # none | open | answered
        self.request_helped = 0
        self.border_state = "none"              # none | proposed | deferred | resolved
        self.border_defers = 0
        self.border_timer = 0.0
        self.visitors: list[dict] = []
        self.visitor_n = 0
        self.harvested = 0
        self.shared = 0
        self.tea_served = 0
        self.spread_t = 0.0
        self.pest_armed = True
        self.grafts = 0
        self.checks = 0
        self.stats = {"plantings": 0, "mystery": 0, "waters": 0, "repeat_waters": 0}
        self.ended = False
        self.intro_pending = True

    def level_start_metadata(self) -> dict:
        return {"days": DAYS, "day_seconds": DAY_S, "plots_total": len(PLOT_IDS), "species_total": len(FAMILIAR) + len(MYSTERY),
                "almanac_pages": len(ALMANAC), "plan_tasks": len(PLAN_TASKS), "scheduled_visitors": 3,
                "invited_extra_visitors": len(INVITE_VISITORS), "neighbours_total": 1, "requests_total": 1,
                "border_proposals_total": 1, "storms_total": 1, "pest_outbreaks_total": 1}

    # ------------------------------------------------------------------ logging
    def _log(self, etype, action=None, **kw):
        kw.setdefault("actor", "player")
        kw.setdefault("day", self.day)
        return self.log.log(etype, action=action, **kw)

    def _engine(self, action, **kw):
        return self.log.log(E.ENV_EVENT, action=action, actor="engine", day=self.day, **kw)

    # ------------------------------------------------------------------ helpers
    def planted(self) -> list[str]:
        return [p for p, d in self.plots.items() if d["species"]]

    def tile(self) -> str:
        return POS_TILE[self.cursor]

    def visitor_waiting(self) -> dict | None:
        for v in self.visitors:
            if v["state"] == "waiting":
                return v
        return None

    def set_plan(self, items: list[int]) -> None:
        mode = "revise" if self.plan_today else "create"
        changed = items != self.plan_today
        self.plan_today = items
        self._log(E.PLAN_ACTION, mode, mode=mode, changed=changed, items=[PLAN_TASKS[i] for i in items], n_items=len(items))

    def _plan_status(self) -> dict[int, bool]:
        pl = self.planted()
        st = {0: bool(pl) and all(self.plots[p]["watered"] for p in pl), 1: bool(pl) and all(self.plots[p]["inspected"] for p in pl),
              2: bool(pl) and all(self.plots[p]["labelled"] for p in pl), 3: self.compost_today}
        return st

    # ------------------------------------------------------------------ main update
    def update(self, dt: float, inp: InputState) -> None:
        if self.status != "running":
            return
        self.elapsed_ms += dt * 1000.0
        if self.toast_ms > 0:
            self.toast_ms -= dt * 1000.0
        if self.intro_pending:
            self.intro_pending = False
            self.open_message("The Courtyard Garden", "", lines=[
                "A shared courtyard, five days, twelve beds and a few neighbours.",
                "Move the cursor with the arrow keys. E does the obvious thing on a tile; the number keys",
                "pick specific tools (a hint bar shows them). Tab ends the day early.",
                "There is no score and no wrong way to spend the days.", MORNING[1]])
            return
        if self.modal is not None:
            self.modal.update(inp)
            if getattr(self.modal, "done", False):
                self.modal = None
            return
        self.clock_s += dt
        self._handle_input(inp)
        if self.modal is not None or self.status != "running":
            return
        # time use (active time per zone; idle if no key for a while)
        self.since_input = 0.0 if inp.any_press else self.since_input + dt
        self.zone_s["idle" if self.since_input > IDLE_AFTER_S else ZONE[self.tile()]] += dt
        self.day_t += dt
        self._tick_world(dt)
        if self.modal is None and self.day_t >= DAY_S:
            self.end_day(early=False)

    def _handle_input(self, inp: InputState) -> None:
        c, r = self.cursor
        if inp.left:
            c = max(0, c - 1)
        if inp.right:
            c = min(COLS - 1, c + 1)
        if inp.up:
            r = max(0, r - 1)
        if inp.down:
            r = min(ROWS - 1, r + 1)
        self.cursor = (c, r)
        self.age_day += 1
        if inp.tab and self.age_day > 30:
            self.end_day(early=True)
            return
        key = "main" if inp.accept else inp.number
        if key is not None:
            self.act(self.tile(), key)

    # ------------------------------------------------------------------ actions
    def act(self, tid: str, key) -> None:
        if tid in self.plots:
            self.act_plot(tid, key)
        elif tid == "seedbox":
            n = 4 if key == "main" else key
            if n in SEED_KEYS:
                self.held = SEED_KEYS[n]
                self._log(E.PLAYER_INTERACTION, "pick_seed", object_id="seedbox", seed=self.held,
                          novel=self.held == "mystery")
                self.say(f"Holding: {'unlabelled mystery packet' if self.held == 'mystery' else self.held}", 1600)
            else:
                self.say("1 marigold   2 bean   3 lavender   4 mystery packet", 2200)
        elif tid == "shed":
            {1: self.read_forecast, 2: self.read_almanac, 3: self.open_chart, "main": self.open_chart}.get(key, lambda: None)()
        elif tid == "gate":
            self.act_gate(key)
        elif tid == "bench":
            self.act_bench(key)
        elif tid in ("aslam_a", "aslam_b"):
            if key in ("main", 1):
                self.help_bed(tid)
        elif tid == "compost":
            if key in ("main", 1):
                self.compost_today = True
                self._log(E.PLAYER_INTERACTION, "tidy_compost", object_id="compost")
                self.say("You turn the compost.", 1400)
        elif tid == "pond":
            if key in ("main", 1):
                self._log(E.PLAYER_INTERACTION, "rest_at_pond", object_id="pond")
                self.say("You watch the water for a while.", 1600)

    def act_plot(self, pid: str, key) -> None:
        p = self.plots[pid]
        k = key
        if key == "main":
            k = 1 if not p["species"] else 2
        if k == 1:
            self.plant(pid)
        elif not p["species"] and k in (2, 3, 4, 5, 6, 7):
            self.say("Nothing is planted here yet (1 = plant).", 1600)
        elif k == 2:
            redundant = (self.clock_s - p["last_water"]) < WATER_REPEAT_S
            p["last_water"], p["watered"] = self.clock_s, True
            self.stats["waters"] += 1
            self.stats["repeat_waters"] += int(redundant)
            self._log(E.PLAYER_INTERACTION, "water", object_id=pid, redundant=redundant, pest=p["pest"])
        elif k == 3:
            ill = p["pest"]
            p["inspected"], p["pest"] = True, False
            self._log(E.PLAYER_INTERACTION, "treat" if ill else "inspect", object_id=pid, had_pests=ill)
            if ill:
                self.say("The aphids are gone.", 1600)
        elif k == 4:
            if not p["covered"]:
                p["covered"] = True
                self._log(E.PLAYER_INTERACTION, "cover", object_id=pid, forecast_known=self.forecast_seen is not None
                          and bool(self.forecast_seen))
        elif k == 5:
            if not p["labelled"]:
                p["labelled"] = True
                self._log(E.PLAYER_INTERACTION, "label", object_id=pid)
        elif k == 6:
            self.graft(pid)
        elif k == 7:
            self.harvest(pid)

    def plant(self, pid: str) -> None:
        p = self.plots[pid]
        if p["species"]:
            self.say("Something already grows here. (2 water, 3 inspect...)", 1800)
            return
        if not self.held:
            self.say("Pick seeds at the seed box first.", 1800)
            return
        if self.held == "mystery":
            sp = self.mystery_order[self.mystery_n % 3]
            self.mystery_n += 1
            self.stats["mystery"] += 1
        else:
            sp = self.held
        p.update(species=sp, growth=0.0, last_water=-99.0, pest=False, watered=False, inspected=False)
        self.stats["plantings"] += 1
        self._log(E.PLAYER_INTERACTION, "plant", object_id=pid, species=sp, novel=self.held == "mystery", seed_type=self.held)
        self.say(f"Planted {sp.replace('_', ' ')}.", 1400)

    def graft(self, pid: str) -> None:
        self.grafts += 1
        c, r = TILE_POS[pid]
        me = self.plots[pid]
        for dc, dr in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            q = POS_TILE.get((c + dc, r + dr))
            if q in self.plots and self.plots[q]["species"] and self.plots[q]["species"] != me["species"]:
                me["hybrid"] = self.plots[q]["hybrid"] = True
                self._log(E.EXPLORATION, "graft", object_id=pid, partner=q, valid=True, novel=True)
                self.say("You graft the two plants together. Who knows what comes of it.", 2400)
                return
        self._log(E.EXPLORATION, "graft", object_id=pid, valid=False, novel=True)
        self.say("Grafting needs a different plant in the next bed.", 2000)

    def harvest(self, pid: str) -> None:
        p = self.plots[pid]
        if p["growth"] >= 2.0 and not p.get("picked"):
            p["picked"] = True
            self.harvested += 1
            self._log(E.ITEM_COLLECTED, "harvest", object_id=pid, species=p["species"], hybrid=p["hybrid"])
            self.say("Into the basket.", 1200)
        else:
            self.say("Not ready to pick yet.", 1400)

    # ---- shed
    def read_forecast(self) -> None:
        state = "hail" if self.forecast_posted else "clear"
        redundant = self.forecast_seen == state
        self.forecast_seen = state
        self.checks += 1
        self._log(E.INFO_SEEKING, "check_forecast", source="forecast", redundant=redundant, state=state)
        self.say("Pinned note: HAIL expected on the evening of day 4." if state == "hail" else "Pinned note: clear skies for now.", 3000)

    def read_almanac(self) -> None:
        redundant = self.almanac_read >= len(ALMANAC)
        page = min(self.almanac_read, len(ALMANAC) - 1)
        if not redundant:
            self.almanac_read += 1
        self._log(E.INFO_SEEKING, "read_almanac", source=f"almanac_{page}", redundant=redundant, curiosity=True)
        self.open_message("Almanac", ALMANAC[page])

    def open_chart(self) -> None:
        self.modal = PlanPanel(self)

    # ---- gate
    def act_gate(self, key) -> None:
        v = self.visitor_waiting()
        if key == "main":
            key = 1 if v else (3 if self.request == "open" else 0)
        if key == 1:
            if v is None:
                self.say("Nobody is at the gate. (2 invite neighbours)", 2000)
                return
            v["state"] = "greeted"
            v["bench_t"] = 0.0
            self._log(E.NPC_INTERACTION, "initiated_by_player", npc=v["id"], encounter_id=v["id"], object_id="gate")
            self.say("You greet them and show them to the bench.", 2200)
        elif key == 2:
            if self.invited:
                self.say("You already invited the neighbours.", 1600)
            elif self.day > 3:
                self.say("It is too late to invite anyone for open day.", 1800)
            else:
                self.invited = True
                self._log(E.NPC_INTERACTION, "initiated_by_player", npc="street_neighbours", encounter_id="street_neighbours",
                          object_id="gate", purpose="invite_open_day")
                self.say("You call the neighbours over for open garden day.", 2400)
        elif key == 3:
            if self.request == "open":
                self.answer_request()
            else:
                self.say("Nobody needs anything right now.", 1600)
        elif key == 4:
            self.share_harvest()

    def answer_request(self) -> None:
        opts = [{"key": "seedlings", "label": "Give Aslam two seedlings", "kind": KIND_PROSOCIAL},
                {"key": "water_bed", "label": "Help him water his bed (go to his two beds)", "kind": KIND_PROSOCIAL},
                {"key": "not_now", "label": "Sorry, not now", "kind": KIND_SELFISH}]

        def chosen(o):
            self.request = "answered"
            k = o["key"]
            if k == "seedlings":
                self._log(E.SHARE_ACTION, "share_seedlings", npc="aslam", amount=2)
                self.say("Aslam beams. 'That will do nicely.'", 2200)
            elif k == "water_bed":
                self._log(E.HELP_ACTION, "agree_to_help", npc="aslam")
                self.say("Water the two beds at the bottom left.", 2600)
            else:
                self._log(E.PLAYER_INTERACTION, "decline_request", npc="aslam")
                self.say("Aslam shrugs. 'Another time.'", 2200)

        self.open_choice("l9_aslam_request", CAT_COOPERATION, "Aslam at the gate",
                         "Aslam's tomato bed is thirsty and he is short of seedlings. Could you spare a hand?", opts, chosen,
                         context={"npc": "aslam"}, speaker="Aslam")

    def help_bed(self, tid: str) -> None:
        unrequested = self.request != "open" and self.request != "answered"
        self.request_helped += 1
        self._log(E.HELP_ACTION, "water_neighbour_bed", npc="aslam", object_id=tid, unrequested=unrequested)
        self.say("Aslam's bed is watered.", 1600)

    def share_harvest(self) -> None:
        n = self.harvested - self.shared
        if n <= 0:
            self.say("Your basket is empty.", 1600)
            return
        self.shared += n
        self._log(E.SHARE_ACTION, "share_harvest", amount=n, harvested=self.harvested)
        self.say(f"You hand {n} flower(s) to the neighbours.", 2200)

    # ---- bench
    def act_bench(self, key) -> None:
        if key in ("main", 1):
            hosts = [v for v in self.visitors if v["state"] == "greeted"]
            if hosts:
                hosts[0]["state"] = "hosted"
                self.tea_served += 1
                self._log(E.PLAYER_INTERACTION, "host_tea", object_id="bench", visitor=hosts[0]["id"])
                self.say("You pour tea and chat.", 2200)
            else:
                self._log(E.PLAYER_INTERACTION, "sit_on_bench", object_id="bench")
                self.say("You sit for a moment.", 1400)

    # ------------------------------------------------------------------ world
    def _tick_world(self, dt: float) -> None:
        for sched in SCHEDULE:
            d, t, kind = sched
            key = (d, t, kind)
            if d == self.day and self.day_t >= t and key not in self.fired:
                self.fired.add(key)
                self._fire(kind)
                if self.modal is not None:
                    return
        if self.invited and self.day == 4:
            for d, t in INVITE_VISITORS:
                key = (d, t, "invited_visitor")
                if self.day_t >= t and key not in self.fired:
                    self.fired.add(key)
                    self._fire("visitor")
        if self.pest_armed and self.day in (2, 3) and self.day_t >= (8.0 if self.day == 2 else 0.0) and self.planted():
            self.pest_armed = False
            self._fire("pest")
        self.spread_t += dt
        if self.spread_t >= 10.0:
            self.spread_t = 0.0
            self._spread()
        for v in self.visitors:
            if v["state"] == "waiting" and self.clock_s - v["t0"] > VISITOR_WAIT_S:
                v["state"] = "left"
                self._engine("visitor_left", visitor=v["id"])
        if self.border_state == "deferred":
            self.border_timer -= dt
            if self.border_timer <= 0:
                self._fire("border")

    def _fire(self, kind: str) -> None:
        if kind == "pest":
            pl = self.planted()
            hit = self.rng.sample(pl, min(2, len(pl)))
            for pid in hit:
                self.plots[pid]["pest"] = True
            self._engine("pest_outbreak", plots=hit)
            self.say("Aphids on some of your beds!", 2600)
        elif kind == "request":
            self.request = "open"
            self._engine("neighbour_request", npc="aslam")
            self.say("Aslam is waving at the gate.", 2600)
        elif kind == "forecast":
            self.forecast_posted = True
            self._engine("forecast_posted", state="hail", day_of_storm=4)
        elif kind == "border":
            if self.border_state in ("none", "deferred"):
                self.border_state = "proposed"
                self.border_proposal()
        elif kind == "openday":
            self._engine("open_garden_day", invited=self.invited)
        elif kind == "visitor":
            self.visitor_n += 1
            vid = f"visitor_{self.visitor_n}"
            self.visitors.append({"id": vid, "state": "waiting", "t0": self.clock_s})
            self._engine("visitor_arrived", visitor=vid)
            self.say("Someone is at the gate.", 2200)
        elif kind == "hail":
            pl = self.planted()
            cov = [p for p in pl if self.plots[p]["covered"]]
            for p in pl:
                if not self.plots[p]["covered"]:
                    self.plots[p]["bruised"] = True
            self._engine("hail", n_planted=len(pl), n_covered=len(cov), forecast_read=self.forecast_seen == "hail")
            self.say("Hail rattles across the courtyard.", 3000)

    def _spread(self) -> None:
        sick = [p for p, d in self.plots.items() if d["pest"]]
        if not sick or len(sick) >= 4:
            return
        pid = self.rng.choice(sick)
        c, r = TILE_POS[pid]
        for dc, dr in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            q = POS_TILE.get((c + dc, r + dr))
            if q in self.plots and self.plots[q]["species"] and not self.plots[q]["pest"]:
                self.plots[q]["pest"] = True
                self._engine("pest_spread", plot=q)
                return

    def border_proposal(self) -> None:
        self._engine("border_proposal", npc="aslam", defers_used=self.border_defers)
        opts = [{"key": "accept", "label": "Agree - move the fence one bed over", "kind": KIND_PROSOCIAL},
                {"key": "compromise", "label": "Suggest sharing the sunny row between you", "kind": KIND_NEUTRAL},
                {"key": "refuse", "label": "Politely keep the border where it is", "kind": KIND_SELFISH}]
        if self.border_defers < 1:
            opts.append({"key": "defer", "label": "Ask to talk about it later", "kind": KIND_NEUTRAL})

        def chosen(o):
            k = o["key"]
            if k == "defer":
                self.border_defers += 1
                self.border_state, self.border_timer = "deferred", 10.0
                self._log(E.NEGOTIATION, "defer", mode="defer", npc="aslam")
                return
            self.border_state = "resolved"
            mode = {"accept": "accommodate", "compromise": "compromise", "refuse": "refuse"}[k]
            ev = {"accept": E.COOPERATION_ACTION, "compromise": E.COOPERATION_ACTION, "refuse": E.COMPETITION_ACTION}[k]
            self._log(E.NEGOTIATION, mode, mode=mode, npc="aslam")
            self._log(ev, mode, npc="aslam")

        self.open_choice("l9_border", CAT_COOPERATION, "Aslam and the fence",
                         "Aslam says his tomatoes need your sunny row. He suggests moving the border fence by one bed.",
                         opts, chosen, context={"npc": "aslam"}, speaker="Aslam")

    # ------------------------------------------------------------------ days
    def _day_summary(self, early: bool) -> None:
        pl = self.planted()
        active = sum(v for k, v in self.zone_s.items() if k != "idle")
        st = self._plan_status()
        done = [i for i in self.plan_today if st[i]]
        self._log(E.TIME_USE_SAMPLE, "day_summary", early=early, planted=len(pl),
                  watered=sum(1 for p in pl if self.plots[p]["watered"]),
                  inspected=sum(1 for p in pl if self.plots[p]["inspected"]),
                  labelled=sum(1 for p in pl if self.plots[p]["labelled"]),
                  planned=len(self.plan_today), planned_done=len(done),
                  zone_s={k: round(v, 1) for k, v in self.zone_s.items()}, active_s=round(active, 1),
                  day_s=round(self.day_t, 1))

    def end_day(self, early: bool) -> None:
        if self.ended:
            return
        self._day_summary(early)
        if early:
            self._log(E.PLAYER_INTERACTION, "sleep_early", object_id="bed", seconds_left=round(DAY_S - self.day_t, 1))
        for p in self.plots.values():
            if p["species"]:
                p["growth"] += 1.0 if p["watered"] else 0.5
                if p["pest"]:
                    p["growth"] -= 0.25
            p["watered"] = p["inspected"] = False
        if self.day == 2 and self.request == "open":
            self.request = "expired"
            self._engine("request_expired", npc="aslam")
        self.compost_today = False
        self.plan_today = []
        self.zone_s = {z: 0.0 for z in ZONES}
        if self.day >= DAYS:
            self.finish_season()
            return
        self.day += 1
        self.day_t, self.age_day, self.since_input = 0.0, 0, 0.0
        self.open_message(f"Day {self.day}", MORNING[self.day])

    def finish_season(self) -> None:
        self.ended = True
        lines = [f"Beds planted: {len(self.planted())}", f"Flowers picked: {self.harvested}", f"Shared with neighbours: {self.shared}",
                 "These are just the day's facts - not a score."]
        self.open_message("Harvest evening", "The courtyard settles as the light fades.", lines=lines)
        self.modal.on_close = lambda: self.complete(days=DAYS, planted=len(self.planted()), harvested=self.harvested,
                                                     shared=self.shared)

    # ------------------------------------------------------------------ draw
    def hud_extra(self):
        return [("day", f"{self.day}/{DAYS}"), ("sun", f"{max(0, int(DAY_S - self.day_t))}s")]

    def draw(self, screen: pygame.Surface) -> None:
        world = pygame.Surface((S.WORLD_W, S.WORLD_H))
        self.draw_world(world)
        screen.blit(world, (0, S.HUD_H))
        self._draw_hud(screen)
        self._draw_context(screen)
        if self.toast_ms > 0 and self.modal is None:
            r = W.text(screen, self.toast, (S.SCREEN_W // 2, S.SCREEN_H - 40), 26, S.TEXT, anchor="center")
            box = r.inflate(36, 18)
            W.panel(screen, box, S.PANEL, S.ACCENT, 12, alpha=235)
            W.text(screen, self.toast, box.center, 26, S.TEXT, anchor="center")
        if self.modal is not None:
            self.modal.draw(screen)

    def _hint(self) -> str:
        t = self.tile()
        if t in self.plots:
            return "E: plant/water   1 plant  2 water  3 inspect  4 cover  5 label  6 graft  7 pick"
        return {"seedbox": "1 marigold  2 bean  3 lavender  4 mystery packet", "shed": "1 forecast board  2 almanac  3 care chart",
                "gate": "1 greet  2 invite neighbours  3 help Aslam  4 share basket", "bench": "E: sit / serve tea",
                "aslam_a": "E: water his bed", "aslam_b": "E: water his bed", "compost": "E: turn compost", "pond": "E: rest"}[t]

    def _draw_context(self, screen: pygame.Surface) -> None:
        held = "none" if not self.held else ("mystery packet" if self.held == "mystery" else self.held)
        W.text(screen, f"Seeds in hand: {held}     Basket: {self.harvested - self.shared}", (S.SCREEN_W - 24, 76), 20, S.TEXT_DIM, anchor="topright")
        W.text(screen, self._hint(), (S.SCREEN_W // 2, S.SCREEN_H - 12), 22, S.TEXT_DIM, anchor="midbottom")

    def draw_world(self, world: pygame.Surface) -> None:
        f = min(1.0, self.day_t / DAY_S)
        dusk = max(0.0, (f - 0.7) / 0.3)
        world.fill((int(70 - 30 * dusk), int(96 - 40 * dusk), int(66 - 10 * dusk)))
        labels = {"seedbox": "Seed box", "shed": "Shed", "gate": "Gate", "bench": "Bench", "aslam_a": "Aslam's bed",
                  "aslam_b": "Aslam's bed", "compost": "Compost", "pond": "Pond"}
        colors = {"seedbox": (150, 110, 70), "shed": (110, 90, 80), "gate": (130, 120, 100), "bench": (140, 110, 80),
                  "aslam_a": (120, 90, 60), "aslam_b": (120, 90, 60), "compost": (80, 70, 50), "pond": (60, 110, 150)}
        for tid in TILE_POS:
            r = tile_rect(tid)
            if tid in self.plots:
                self._draw_plot(world, tid, r)
            else:
                pygame.draw.rect(world, colors[tid], r, border_radius=12)
                W.text(world, labels[tid], r.center, 26, S.TEXT, anchor="center", bold=True)
                if tid == "gate" and (self.visitor_waiting() or self.request == "open"):
                    W.text(world, "!", (r.right - 20, r.y + 6), 44, S.GOLD, anchor="topright", bold=True)
                if tid == "gate":
                    n = sum(1 for v in self.visitors if v["state"] == "waiting")
                    for i in range(n):
                        pygame.draw.circle(world, (240, 220, 190), (r.x + 30 + i * 28, r.bottom - 24), 11)
                if tid == "shed" and self.forecast_posted and self.forecast_seen != "hail":
                    W.text(world, "new note", (r.centerx, r.bottom - 22), 20, S.WARN, anchor="center")
        cr = tile_rect(self.tile())
        pygame.draw.rect(world, S.GOLD, cr.inflate(8, 8), 4, border_radius=14)
        if dusk > 0:
            ov = pygame.Surface((S.WORLD_W, S.WORLD_H), pygame.SRCALPHA)
            ov.fill((20, 20, 60, int(90 * dusk)))
            world.blit(ov, (0, 0))

    def _draw_plot(self, world: pygame.Surface, pid: str, r: pygame.Rect) -> None:
        p = self.plots[pid]
        pygame.draw.rect(world, (96, 70, 48), r, border_radius=12)
        pygame.draw.rect(world, (70, 50, 34), r, 3, border_radius=12)
        if not p["species"]:
            W.text(world, "empty", r.center, 20, (150, 120, 90), anchor="center")
            return
        col = SPECIES_COLOR[p["species"]]
        g = max(0.2, min(3.0, p["growth"] + (0.3 if p["watered"] else 0))) / 3.0
        pygame.draw.line(world, (60, 140, 70), (r.centerx, r.bottom - 14), (r.centerx, r.bottom - 14 - int(80 * g)), 5)
        tip = (r.centerx, r.bottom - 14 - int(80 * g))
        if g >= 0.6:
            for dx, dy in ((-12, 0), (12, 0), (0, -12), (0, 12)):
                pygame.draw.circle(world, col, (tip[0] + dx, tip[1] + dy), 9)
            pygame.draw.circle(world, (250, 240, 200), tip, 7)
        else:
            pygame.draw.circle(world, (90, 190, 90), tip, 8)
        if p["pest"]:
            for i in range(4):
                pygame.draw.circle(world, (180, 220, 70), (r.x + 20 + i * 12, r.y + 22), 4)
        if p["bruised"]:
            pygame.draw.line(world, (200, 210, 230), (r.x + 12, r.y + 12), (r.x + 40, r.y + 40), 3)
        if p["covered"]:
            pygame.draw.arc(world, (200, 220, 255), r.inflate(-20, -10), 0, 3.14159, 4)
        if p["labelled"]:
            W.text(world, p["species"].replace("_", " "), (r.centerx, r.y + 6), 18, S.TEXT, anchor="midtop")
        if (self.clock_s - p["last_water"]) < WATER_REPEAT_S:
            pygame.draw.circle(world, (120, 180, 255), (r.right - 18, r.y + 18), 7)
        if p["hybrid"]:
            W.text(world, "hybrid", (r.right - 8, r.bottom - 8), 18, S.GOLD, anchor="bottomright")
