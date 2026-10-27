"""Level 8 - Integrated Career Mission (RIASEC interest exploration, the most complex level).

Mission: reopen Riverside Park for Community Day in three phases (Plan, Build, Finish).

* Shared pool: 120 coins. The player has 4 work shifts per phase (use them or lose them).
* Four requirements must be met to open: Safety, Permit, Appeal, Turnout. Each can be reached by several routes, so no
  single kind of work is required - e.g. Safety by repairing yourself, hiring a contractor, patching quickly, or a joint
  water test with Dr. Lin; Permit by filing paperwork, negotiating, or Reyes's early review.
* Six work sites with 2-3 approaches each, four teammates with different needs, information that arrives per phase
  (rain forecast, inspector notes, a possible contamination alert), role changes at any time, delegation (coins instead
  of shifts) and trade-offs between coins and time.
* The mission always completes. The final outcome describes the park, not the player, and is NOT used for scoring.

Which activity belongs to which RIASEC category is NOT stored in the telemetry - see analytics/riasec_config.json.
"""
from __future__ import annotations

import pygame

from analytics.event_schema import CAT_COOPERATION, CAT_HELP, CAT_PLANNING, KIND_EXIT, KIND_NEUTRAL, KIND_PROSOCIAL, KIND_SAFE, \
    EventType as E
from game import settings as S
from game.input_state import InputState
from game.levels.base import Level
from game.levels.common import draw_station, nearest_station
from game.ui import widgets as W

PHASES = 3
SHIFTS_PER_PHASE = 4
START_COINS = 120
METERS = ("safety", "permit", "appeal", "turnout")
BASE_THRESHOLD = {"safety": 50, "permit": 50, "appeal": 40, "turnout": 40}
RAIN_SAFETY = 60

SITES = {
    "yard": pygame.Rect(40, 90, 130, 80), "survey": pygame.Rect(200, 90, 130, 80), "design": pygame.Rect(360, 90, 130, 80),
    "community": pygame.Rect(520, 90, 130, 80), "business": pygame.Rect(680, 90, 130, 80), "records": pygame.Rect(840, 90, 130, 80),
    "hana": pygame.Rect(60, 430, 140, 80), "okafor": pygame.Rect(260, 430, 140, 80), "lin": pygame.Rect(460, 430, 140, 80),
    "reyes": pygame.Rect(660, 430, 140, 80), "board": pygame.Rect(860, 430, 170, 80),
}
SITE_LABEL = {"yard": "Repair Yard", "survey": "Survey Hut", "design": "Design Studio", "community": "Community Room",
              "business": "Business Office", "records": "Records Office", "hana": "Hana (volunteers)", "okafor": "Okafor (contractor)",
              "lin": "Dr. Lin (scientist)", "reyes": "Official Reyes", "board": "Mission Board"}
SITE_COLOR = {"yard": (150, 100, 70), "survey": (70, 130, 100), "design": (150, 90, 140), "community": (90, 120, 170),
              "business": (170, 120, 70), "records": (100, 110, 130), "hana": (150, 90, 110), "okafor": (130, 100, 70),
              "lin": (80, 120, 130), "reyes": (110, 100, 150), "board": (60, 110, 150)}
ROLES = {
    "yard": ("Site Builder", "hands-on repairs and construction"),
    "survey": ("Field Researcher", "tests, measurements and surveys"),
    "design": ("Visual Planner", "layouts, signs and murals"),
    "community": ("Volunteer Host", "workshops, recruiting and welcoming people"),
    "business": ("Deal Maker", "sponsors, permits and negotiation"),
    "records": ("Records Keeper", "paperwork, checklists and budgets"),
}
# task_id -> definition. Effects are meter / coin deltas; "optional" marks extras that are not needed to open the park.
TASKS = {
    "fix_fountain": {"site": "yard", "name": "Repair the fountain properly", "shifts": 2, "coins": 10, "fx": {"safety": 35}, "optional": False},
    "replace_benches": {"site": "yard", "name": "Replace the old benches", "shifts": 2, "coins": 20, "fx": {"safety": 15, "appeal": 10}, "optional": True},
    "quick_patch": {"site": "yard", "name": "Quick patch of the worst hazards", "shifts": 1, "coins": 5, "fx": {"safety": 15}, "optional": False},
    "test_water_soil": {"site": "survey", "name": "Test the water and soil", "shifts": 1, "coins": 5, "fx": {"safety": 10}, "optional": False, "flag": "tested"},
    "count_visitors": {"site": "survey", "name": "Survey what visitors want", "shifts": 1, "coins": 0, "fx": {"appeal": 10}, "optional": True, "flag": "visitors"},
    "full_survey": {"site": "survey", "name": "Full survey (tests + visitors)", "shifts": 2, "coins": 10, "fx": {"safety": 10, "appeal": 10}, "optional": False, "flag": "tested+visitors"},
    "design_layout": {"site": "design", "name": "Design the park layout", "shifts": 2, "coins": 10, "fx": {"appeal": 35}, "optional": False},
    "paint_mural": {"site": "design", "name": "Paint a community mural", "shifts": 2, "coins": 15, "fx": {"appeal": 25, "turnout": 10}, "optional": True},
    "simple_signs": {"site": "design", "name": "Make simple welcome signs", "shifts": 1, "coins": 5, "fx": {"appeal": 12}, "optional": False},
    "kids_workshop": {"site": "community", "name": "Run a kids' workshop", "shifts": 2, "coins": 5, "fx": {"turnout": 30}, "optional": False},
    "recruit_volunteers": {"site": "community", "name": "Recruit neighbourhood volunteers", "shifts": 1, "coins": 0, "fx": {"turnout": 15}, "optional": False, "flag": "helper"},
    "neighbour_letters": {"site": "community", "name": "Write letters to neighbours", "shifts": 1, "coins": 3, "fx": {"turnout": 12}, "optional": True},
    "sponsorship_pitch": {"site": "business", "name": "Pitch local businesses for sponsorship", "shifts": 2, "coins": 0, "fx": {"permit": 10, "coins": 30}, "optional": False},
    "negotiate_permit": {"site": "business", "name": "Negotiate the event permit", "shifts": 2, "coins": 0, "fx": {"permit": 40}, "optional": False},
    "hire_contractor": {"site": "business", "name": "Hire a contractor to do the repairs", "shifts": 1, "coins": 25, "fx": {"safety": 30}, "optional": False, "delegated": True},
    "file_paperwork": {"site": "records", "name": "File the permit paperwork", "shifts": 1, "coins": 0, "fx": {"permit": 30}, "optional": False, "flag": "paperwork"},
    "safety_checklist": {"site": "records", "name": "Complete the safety checklist", "shifts": 1, "coins": 0, "fx": {"safety": 10}, "optional": False, "flag": "checklist"},
    "budget_ledger": {"site": "records", "name": "Tidy the budget ledger", "shifts": 1, "coins": 0, "fx": {"coins": 10}, "optional": True},
}
EFFECT_WORDS = {"safety": "safer", "permit": "permit", "appeal": "appeal", "turnout": "turnout", "coins": "coins"}

# NPC requests per phase. mode: help | collab | accept | counter | decline | info | defer
NPC = {
    "hana": {1: ("Could you spare a shift to set up chairs for the kids' workshop? Families will come.", [
                 {"key": "help_chairs", "label": "Help set up the chairs (1 shift)", "mode": "help", "shifts": 1, "coins": 0, "fx": {"turnout": 10}, "task": "help_hana_chairs"},
                 {"key": "ask_volunteers", "label": "Suggest the volunteers do it (free)", "mode": "defer"},
                 {"key": "decline", "label": "Say you cannot this time", "mode": "decline"}]),
             2: ("The snack table needs 10 coins to look welcoming.", [
                 {"key": "give_10", "label": "Give 10 coins", "mode": "help", "shifts": 0, "coins": 10, "fx": {"turnout": 10}, "task": "help_hana_snacks"},
                 {"key": "give_5", "label": "Offer 5 coins and some help from you", "mode": "counter", "shifts": 0, "coins": 5, "fx": {"turnout": 5}, "task": "help_hana_snacks"},
                 {"key": "decline", "label": "Say the budget is tight", "mode": "decline"}]),
             3: ("Could you thank the volunteers in person? It means a lot to them (1 shift).", [
                 {"key": "thank", "label": "Spend a shift thanking them", "mode": "help", "shifts": 1, "coins": 0, "fx": {"turnout": 8}, "task": "help_hana_thanks"},
                 {"key": "decline", "label": "Send a short message instead", "mode": "decline"}])},
    "okafor": {1: ("I can repair the fountain properly for 20 coins, paid up front.", [
                    {"key": "accept_20", "label": "Accept: 20 coins", "mode": "accept", "shifts": 0, "coins": 20, "fx": {"safety": 30}, "task": "contractor_repair"},
                    {"key": "counter_15", "label": "Counter with 15 coins", "mode": "counter", "shifts": 0, "coins": 15, "fx": {"safety": 30}, "task": "contractor_repair"},
                    {"key": "decline", "label": "Decline politely", "mode": "decline"}]),
               2: ("I have leftover timber: 10 coins and I'll build a shaded seating area.", [
                    {"key": "accept_10", "label": "Accept: 10 coins", "mode": "accept", "shifts": 0, "coins": 10, "fx": {"appeal": 12}, "task": "contractor_seating"},
                    {"key": "decline", "label": "Decline", "mode": "decline"}]),
               3: ("Everything is wrapped up on my side. Anything else?", [
                    {"key": "decline", "label": "No, thank you", "mode": "decline"}])},
    "lin": {1: ("I can run the water and soil tests if you give me 1 shift for samples and 5 coins for kits.", [
                {"key": "collab_test", "label": "Work with Dr. Lin (1 shift, 5 coins)", "mode": "collab", "shifts": 1, "coins": 5,
                 "fx": {"safety": 10, "appeal": 10}, "flag": "tested+visitors", "task": "collab_water_test"},
                {"key": "ask_method", "label": "Ask how the tests work first (free)", "mode": "info"},
                {"key": "decline", "label": "Say you'll test it yourself", "mode": "decline"}]),
            2: ("My results could help the school science club. Share them with the club (1 shift)?", [
                {"key": "share_results", "label": "Share the results with the club (1 shift)", "mode": "help", "shifts": 1, "coins": 0,
                 "fx": {"turnout": 10}, "task": "share_results"},
                {"key": "decline", "label": "Not now", "mode": "decline"}]),
            3: ("The data are ready to be signed off if you want a second look.", [
                {"key": "review_data", "label": "Review the data together (1 shift)", "mode": "collab", "shifts": 1, "coins": 0,
                 "fx": {"safety": 8}, "task": "review_data"},
                {"key": "decline", "label": "Trust the results", "mode": "decline"}])},
    "reyes": {1: ("Permit applications need complete paperwork. I can tell you exactly what is needed.", [
                 {"key": "ask_rules", "label": "Ask what the permit requires (free)", "mode": "info"},
                 {"key": "early_review", "label": "Request an early review (1 shift)", "mode": "collab", "shifts": 1, "coins": 0, "fx": {"permit": 10}, "task": "early_review"},
                 {"key": "decline", "label": "Come back later", "mode": "decline"}]),
              2: ("An inspection is planned for the final phase. I will check safety and paperwork.", [
                 {"key": "ask_inspection", "label": "Ask what the inspection looks at (free)", "mode": "info"},
                 {"key": "early_review", "label": "Request an early review (1 shift)", "mode": "collab", "shifts": 1, "coins": 0, "fx": {"permit": 10}, "task": "early_review"},
                 {"key": "decline", "label": "Leave it", "mode": "decline"}]),
              3: ("Final inspection. Make your case.", [
                 {"key": "present", "label": "Present your records and plans (1 shift)", "mode": "accept", "shifts": 1, "coins": 0, "fx": {"permit": 15}, "task": "inspection_case"},
                 {"key": "persuade", "label": "Argue that the park deserves a chance (1 shift)", "mode": "counter", "shifts": 1, "coins": 0, "fx": {"permit": 10}, "task": "inspection_case"},
                 {"key": "decline", "label": "Accept the result as it stands", "mode": "decline"}])},
}
NPC_NAME = {"hana": "Hana", "okafor": "Okafor", "lin": "Dr. Lin", "reyes": "Reyes"}
PHASE_NAME = {1: "Plan", 2: "Build", 3: "Finish"}


class MissionLevel(Level):
    level_id = 8
    name = "Integrated Career Mission"
    scenario = "career_mission"
    objective = "Reopen Riverside Park for Community Day. Share a budget and time; there are many ways to get there."
    controls_hint = "Move: WASD / Arrows   Interact: E   Pause: P   Choose with Up/Down + Enter or numbers"
    task_name = "reopen_park"
    start_pos = (550, 300)

    def build(self) -> None:
        self.phase = 1
        self.shifts = SHIFTS_PER_PHASE
        self.coins = START_COINS
        self.m = {k: 0 for k in METERS}
        self.flags: set[str] = set()
        self.done: set[str] = set()
        self.role: str | None = None
        self.role_bonus_used = False
        self.phase_events: list[str] = []
        self.safety_need = BASE_THRESHOLD["safety"]
        self.npc_done: set[tuple[str, int]] = set()
        self.contrib = {s: {"shifts": 0, "coins": 0, "tasks": 0} for s in SITES}
        self.helper_pending = False
        self.met: set[str] = set()
        self.visits: dict[str, int] = {}
        self.looked: set[tuple[str, int]] = set()
        self._intro = True
        self.final_lines: list[str] = []
        self.last_board_sig = None
        self.pending_end = False

    def level_start_metadata(self) -> dict:
        return {"phases": PHASES, "shifts_per_phase": SHIFTS_PER_PHASE, "start_coins": START_COINS, "sites": [s for s in SITES if s in ROLES],
                "tasks": {k: {"site": v["site"], "shifts": v["shifts"], "coins": v["coins"], "optional": v["optional"]} for k, v in TASKS.items()},
                "npcs": list(NPC_NAME), "thresholds": BASE_THRESHOLD,
                "npc_tasks": sorted({o["task"] for per in NPC.values() for _t, opts in per.values() for o in opts if "task" in o})}

    def solids(self):
        return list(SITES.values())

    def _log(self, etype, action=None, **kw):
        kw.setdefault("actor", "player")
        kw.setdefault("stage", f"phase{self.phase}")
        return self.log.log(etype, action=action, **kw)

    # ------------------------------------------------------------------ flow
    def on_update(self, dt: float, inp: InputState) -> None:
        if self._intro:
            self._intro = False
            self.open_message("Reopen Riverside Park", "", lines=[
                "The riverside park has been closed for a year. Community Day is in three phases: Plan, Build, Finish.",
                f"You share {START_COINS} coins and have {SHIFTS_PER_PHASE} work shifts per phase (unused shifts are lost).",
                "To open, four things must be good enough: Safety, Permit, Appeal and Turnout. The Mission Board shows the targets.",
                "Every requirement can be met in more than one way. Choose the work you want to do, ask teammates for help,",
                "change your role or your plan whenever new information arrives. There is no single right way."])
            self.modal.on_close = self._pick_role
            return
        if self.pending_end and self.modal is None:
            self.pending_end = False
            self.end_phase(auto=True)

    def _pick_role(self) -> None:
        opts = [{"key": k, "label": f"{n} - {d}", "kind": KIND_NEUTRAL} for k, (n, d) in ROLES.items()]

        def chosen(o):
            self.role = o["key"]
            self._log(E.ROLE_SELECTED, o["key"], role=o["key"], phase_no=self.phase, first=True, outcome="selected")
            self.say(f"Role: {ROLES[o['key']][0]} (small efficiency bonus for your first job at your site each phase).", 3400)

        self.open_choice("l8_role", CAT_PLANNING, "Your project role", "Which responsibility do you want to lead? You can change it later at the Mission Board.",
                         opts, chosen)

    # ------------------------------------------------------------ interaction
    def on_interact(self) -> None:
        st = nearest_station(self.player, SITES)
        if st is None:
            return
        self.visits[st] = self.visits.get(st, 0) + 1
        if st in ROLES:
            self.open_site(st)
        elif st == "board":
            self.open_board()
        else:
            self.open_npc(st)

    # ---- sites
    def _effect_text(self, t: dict, tid: str) -> str:
        bits = []
        for k, v in self._effects_preview(tid).items():
            bits.append(f"+{v} {EFFECT_WORDS[k]}")
        return ", ".join(bits)

    def _effects_preview(self, tid: str) -> dict:
        t = TASKS[tid]
        fx = dict(t["fx"])
        if tid == "design_layout" and "visitors" in self.flags:
            fx["appeal"] += 10
        if tid == "negotiate_permit" and "paperwork" not in self.flags:
            fx["permit"] = 20
        if tid == "sponsorship_pitch" and "paperwork" in self.flags:
            fx["coins"] += 10
        return fx

    def open_site(self, site: str) -> None:
        avail = [tid for tid, t in TASKS.items() if t["site"] == site and tid not in self.done]
        key = (site, self.phase)
        first_look = key not in self.looked
        opts = []
        for tid in avail:
            t = TASKS[tid]
            opts.append({"key": tid, "label": f"{t['name']} - {t['shifts']} shift(s), {t['coins']} coins ({self._effect_text(t, tid)})",
                         "kind": KIND_NEUTRAL})
        opts.append({"key": "look", "label": "Look around (free)", "kind": KIND_SAFE})
        opts.append({"key": "leave", "label": "Not now", "kind": KIND_EXIT})
        body = f"{SITE_LABEL[site]}.  Shifts left: {self.shifts}   Coins: {self.coins}" + ("" if avail else "\nEverything here is done.")

        def chosen(o):
            k = o["key"]
            if k == "leave":
                self._log(E.ACTIVITY_CHOICE, "decline", task_id=site, site=site, selected=False, outcome="declined", phase_no=self.phase)
            elif k == "look":
                self.looked.add(key)
                self._log(E.INFO_SEEKING, "look_around", source=f"site_{site}", redundant=not first_look, first_time=first_look)
                self.open_message(SITE_LABEL[site], self._site_text(site))
                self.modal.on_close = lambda: self.open_site(site)
            else:
                self._confirm_task(k)

        self.open_choice(f"l8_{site}_p{self.phase}_{self.visits.get(site, 0)}", CAT_PLANNING, SITE_LABEL[site], body, opts, chosen,
                         context={"site": site, "phase_no": self.phase, "shifts_left": self.shifts, "coins_left": self.coins})

    def _site_text(self, site: str) -> str:
        return {
            "yard": "Rusty fountain, wobbly benches and a cracked path. Fixing hazards is the biggest safety gain.",
            "survey": "Instruments for testing water and soil, and a clipboard for asking visitors what they want.",
            "design": "Sketches, paint and cardboard models. A good layout makes the park welcoming.",
            "community": "A room for workshops and a notice board for recruiting helpers.",
            "business": "Phones and a table for meeting shop owners and city officials. Paperwork makes meetings go further.",
            "records": "Filing cabinets, the permit forms and the budget ledger.",
        }[site]

    def _confirm_task(self, tid: str) -> None:
        t = TASKS[tid]
        short = []
        if t["shifts"] > self.shifts:
            short.append("shifts")
        if t["coins"] > self.coins:
            short.append("coins")
        if short:
            self._log(E.PLAYER_INTERACTION, "invalid_attempt", object_id=tid, novel=False, reason="not_enough_" + "_".join(short))
            self.say("Not enough " + " and ".join(short) + " for that.", 2600)
            return
        opts = [{"key": "commit", "label": f"Commit: {t['shifts']} shift(s) and {t['coins']} coins", "kind": KIND_NEUTRAL},
                {"key": "change", "label": "Change my mind", "kind": KIND_EXIT}]

        def chosen(o):
            if o["key"] == "commit":
                self.run_task(tid)
            else:
                self._log(E.ACTIVITY_CHOICE, "decline", task_id=tid, site=t["site"], selected=False, outcome="changed_mind", phase_no=self.phase)
                self._log(E.ACTIVITY_END, "declined", task_id=tid, site=t["site"], outcome="declined", shifts=0, coins=0, phase_no=self.phase)

        self.open_choice(f"l8_confirm_{tid}_{self.phase}", CAT_PLANNING, t["name"], f"Effect: {self._effect_text(t, tid)}.", opts, chosen,
                         context={"task_id": tid, "phase_no": self.phase})

    def run_task(self, tid: str) -> None:
        t = TASKS[tid]
        site = t["site"]
        revisit = self.visits.get(site, 0) > 1 or any(TASKS[d]["site"] == site for d in self.done)
        fx = self._effects_preview(tid)
        role_bonus = 0
        if self.role == site and not self.role_bonus_used:
            main = max((k for k in fx if k in METERS), key=lambda k: fx[k], default=None)
            if main:
                fx[main] += 5
                role_bonus = 5
            self.role_bonus_used = True
        self.done.add(tid)
        self.shifts -= t["shifts"]
        self.coins -= t["coins"]
        self.contrib[site]["shifts"] += t["shifts"]
        self.contrib[site]["coins"] += t["coins"]
        self.contrib[site]["tasks"] += 1
        gained = self._apply(fx, t.get("flag"))
        nominal = sum(t["fx"].values()) or 1
        self._log(E.ACTIVITY_CHOICE, "select", task_id=tid, site=site, selected=True, voluntary=True, optional=t["optional"], revisit=revisit,
                  phase_no=self.phase, options=[x for x, d in TASKS.items() if d["site"] == site and x not in self.done or x == tid],
                  shifts_left=self.shifts + t["shifts"], role=self.role, via="site")
        self._log(E.ACTIVITY_START, "start", task_id=tid, site=site, shifts=t["shifts"], coins=t["coins"], phase_no=self.phase)
        if t["shifts"]:
            self._log(E.RESOURCE_ALLOCATED, "commit_shifts", resource="shifts", amount=t["shifts"], site=site, task_id=tid, phase_no=self.phase,
                      delegated=bool(t.get("delegated")))
        if t["coins"]:
            self._log(E.RESOURCE_ALLOCATED, "commit_coins", resource="coins", amount=t["coins"], site=site, task_id=tid, phase_no=self.phase,
                      delegated=bool(t.get("delegated")))
        self._log(E.ACTIVITY_END, "completed", task_id=tid, site=site, outcome="completed", shifts=t["shifts"], coins=t["coins"],
                  optional=t["optional"], performance=round(min(1.5, gained / nominal), 3), phase_no=self.phase, role_bonus=role_bonus)
        self._log(E.PLAN_ACTION, "step", task_id="mission_plan", phase_no=self.phase, chosen=tid, outcome="progress")
        self.say(f"Done: {t['name']}.  Shifts left {self.shifts}.", 3000)
        self._after_spend()

    def _apply(self, fx: dict, flag) -> float:
        gained = 0.0
        for k, v in fx.items():
            if k == "coins":
                self.coins += v
                gained += v
            else:
                before = self.m[k]
                self.m[k] = min(100, self.m[k] + v)
                gained += self.m[k] - before
        if flag:
            for f in flag.split("+"):
                self.flags.add(f)
            if "helper" in self.flags:
                self.helper_pending = True
        return gained

    def _after_spend(self) -> None:
        if self.shifts <= 0:
            self.pending_end = True

    # ---- NPCs
    def open_npc(self, npc: str) -> None:
        first = npc not in self.met
        if first:
            self.met.add(npc)
            self.log.log(E.NPC_INTERACTION, action="initiated_by_player", encounter_id=npc, npc=npc, actor="player", stage=f"phase{self.phase}")
        text, options = NPC[npc][self.phase]
        key = (npc, self.phase)
        opts = []
        for o in options:
            if key in self.npc_done and o["mode"] not in ("decline", "info"):
                continue
            opts.append({"key": o["key"], "label": o["label"], "kind": KIND_PROSOCIAL if o["mode"] in ("help", "collab") else KIND_NEUTRAL})
        if not any(o["key"] == "decline" for o in opts):
            opts.append({"key": "decline", "label": "Say goodbye", "kind": KIND_EXIT})
        lookup = {o["key"]: o for o in options}
        if key in self.npc_done:
            text = "Thanks again - we've already sorted this out for now."

        def chosen(o):
            spec = lookup.get(o["key"], {"mode": "decline"})
            mode = spec["mode"]
            self.log.log(E.NPC_INTERACTION, action="dialogue_turn", encounter_id=npc, npc=npc, actor="player", stage=f"phase{self.phase}")
            if mode == "decline":
                self._log(E.NEGOTIATION, "decline", npc=npc, mode="decline", outcome="declined", phase_no=self.phase)
                return
            if mode == "info":
                self._log(E.INFO_SEEKING, o["key"], source=f"npc_{npc}", redundant=False, first_time=True)
                self.open_message(NPC_NAME[npc], self._npc_info(npc, o["key"]), speaker=NPC_NAME[npc])
                return
            if mode == "defer":
                self._log(E.PLAYER_INTERACTION, "defer_request", object_id=npc, novel=False, outcome="deferred")
                return
            if spec["shifts"] > self.shifts or spec["coins"] > self.coins:
                self._log(E.PLAYER_INTERACTION, "invalid_attempt", object_id=npc, novel=False, reason="not_enough_resources")
                self.say("You do not have enough shifts or coins for that.", 2600)
                return
            self.npc_done.add(key)
            self.shifts -= spec["shifts"]
            self.coins -= spec["coins"]
            site = npc
            self.contrib[site]["shifts"] += spec["shifts"]
            self.contrib[site]["coins"] += spec["coins"]
            self.contrib[site]["tasks"] += 1
            gained = self._apply(spec["fx"], spec.get("flag"))
            ev = {"help": E.HELP_ACTION, "collab": E.COOPERATION_ACTION, "accept": E.NEGOTIATION, "counter": E.NEGOTIATION}[mode]
            self._log(ev, o["key"], npc=npc, mode=mode, outcome="agreed", phase_no=self.phase, shifts=spec["shifts"], coins=spec["coins"])
            self._log(E.ACTIVITY_CHOICE, "select", task_id=spec["task"], site=npc, selected=True, voluntary=True, optional=False, revisit=False,
                      phase_no=self.phase, via="npc", mode=mode, role=self.role)
            self._log(E.ACTIVITY_START, "start", task_id=spec["task"], site=npc, shifts=spec["shifts"], coins=spec["coins"], phase_no=self.phase)
            if spec["shifts"]:
                self._log(E.RESOURCE_ALLOCATED, "commit_shifts", resource="shifts", amount=spec["shifts"], site=npc, task_id=spec["task"], phase_no=self.phase, delegated=False)
            if spec["coins"]:
                self._log(E.RESOURCE_ALLOCATED, "commit_coins", resource="coins", amount=spec["coins"], site=npc, task_id=spec["task"], phase_no=self.phase,
                          delegated=npc == "okafor")
            self._log(E.ACTIVITY_END, "completed", task_id=spec["task"], site=npc, outcome="completed", shifts=spec["shifts"], coins=spec["coins"],
                      optional=False, performance=round(min(1.5, gained / (sum(spec["fx"].values()) or 1)), 3), phase_no=self.phase)
            self.say(f"{NPC_NAME[npc]}: agreed. Shifts left {self.shifts}.", 2800)
            self._after_spend()

        self.open_choice(f"l8_npc_{npc}_p{self.phase}_{self.visits.get(npc, 0)}", CAT_COOPERATION, NPC_NAME[npc], text, opts, chosen,
                         speaker=NPC_NAME[npc], context={"npc": npc, "phase_no": self.phase})

    def _npc_info(self, npc: str, key: str) -> str:
        if key == "ask_method":
            return "I sample water at three spots and test the soil for lead. If it is clean we save repair money later."
        if key == "ask_rules":
            return "You need complete paperwork on file. With it, a negotiated permit is worth much more, and sponsors take you more seriously."
        return "I'll check the fountain, the paths and your paperwork. Without a soil test, a contamination alert in the last phase could cost you safety."

    # ---- mission board
    def open_board(self) -> None:
        sig = (self.phase, self.shifts, self.coins, tuple(self.m.values()), tuple(sorted(self.flags)))
        redundant = sig == self.last_board_sig
        self.last_board_sig = sig
        self._log(E.INFO_SEEKING, "recheck_board" if redundant else "read_board", source="board", redundant=redundant, first_time=False)
        opts = [{"key": "status", "label": "Read the mission status", "kind": KIND_SAFE},
                {"key": "role", "label": "Change my role", "kind": KIND_NEUTRAL},
                {"key": "end", "label": f"End phase {self.phase} now ({self.shifts} shifts unused)" if self.phase < PHASES else
                 f"Open the park now ({self.shifts} shifts unused)", "kind": KIND_NEUTRAL},
                {"key": "back", "label": "Back to work", "kind": KIND_EXIT}]

        def chosen(o):
            k = o["key"]
            if k == "status":
                self.open_message("Mission status", "", lines=self._status_lines())
            elif k == "role":
                self._change_role()
            elif k == "end":
                self.end_phase(auto=False)

        self.open_choice(f"l8_board_p{self.phase}_{self.visits.get('board', 0)}", CAT_PLANNING, "Mission Board",
                         f"Phase {self.phase}/{PHASES}: {PHASE_NAME[self.phase]}.  Shifts {self.shifts}  Coins {self.coins}", opts, chosen)

    def _status_lines(self) -> list[str]:
        need = dict(BASE_THRESHOLD)
        need["safety"] = self.safety_need
        lines = [f"Phase {self.phase}/{PHASES} - {PHASE_NAME[self.phase]}.   Shifts left {self.shifts}.   Coins {self.coins}."]
        for k in METERS:
            lines.append(f"{k.capitalize():<9} {self.m[k]:>3} / needs {need[k]}")
        lines += self.phase_events
        return lines

    def _change_role(self) -> None:
        opts = [{"key": k, "label": f"{n}" + (" (current)" if k == self.role else ""), "kind": KIND_NEUTRAL} for k, (n, d) in ROLES.items()]

        def chosen(o):
            if o["key"] != self.role:
                self._log(E.ROLE_CHANGED, o["key"], previous=self.role, role=o["key"], phase_no=self.phase, outcome="changed",
                          new_info=bool(self.phase_events))
                self.role = o["key"]
                self.role_bonus_used = False
                self.say(f"New role: {ROLES[o['key']][0]}.", 2600)

        self.open_choice(f"l8_role_p{self.phase}_{self.visits.get('board', 0)}", CAT_PLANNING, "Change role", "Which responsibility do you want to lead now?", opts, chosen)

    # ---- phases
    def end_phase(self, auto: bool) -> None:
        self._log(E.PLAN_ACTION, "end_phase", task_id="mission_plan", phase_no=self.phase, shifts_unused=self.shifts, coins=self.coins,
                  auto=auto, meters=dict(self.m), outcome="phase_end")
        self.log.log(E.ENV_EVENT, action="phase_end", actor="engine", stage=f"phase{self.phase}", shifts_unused=self.shifts)
        if self.phase >= PHASES:
            self._finish()
            return
        self.phase += 1
        self.shifts = SHIFTS_PER_PHASE + (1 if self.helper_pending else 0)
        extra = "Your recruited helper gives you an extra shift." if self.helper_pending else ""
        self.helper_pending = False
        self.role_bonus_used = False
        self.phase_events = []
        lines = [f"Phase {self.phase}: {PHASE_NAME[self.phase]}.  You have {self.shifts} shifts.  {extra}".strip()]
        if self.phase == 2:
            self.safety_need = RAIN_SAFETY
            msg = f"Weather forecast: rain is expected on Community Day. Paths get slippery - Safety must now reach {RAIN_SAFETY}. Shade helps visitors (Appeal)."
            self.phase_events.append(msg)
            lines.append(msg)
            self.log.log(E.ENV_EVENT, action="rain_forecast", actor="engine", stage="phase2", new_safety_need=RAIN_SAFETY)
        if self.phase == 3:
            if "tested" in self.flags:
                msg = "Inspector's note: your soil test shows the ground is clean. The inspection is on track."
                self.log.log(E.ENV_EVENT, action="contamination_cleared", actor="engine", stage="phase3", tested=True)
            else:
                self.m["safety"] = max(0, self.m["safety"] - 20)
                msg = "Contamination alert: untested soil near the playground must be covered. Safety -20 (a soil test would have cleared it)."
                self.log.log(E.ENV_EVENT, action="contamination_alert", actor="engine", stage="phase3", tested=False)
            self.phase_events.append(msg)
            lines.append(msg)
            lines.append("Official Reyes will hold the final inspection this phase.")
        self.open_message(f"Phase {self.phase} begins", "", lines=[ln for x in lines for ln in W.wrap(x, 24, 640)])
        self.modal.on_close = lambda: self._log(E.PLAN_ACTION, "phase_start", task_id="mission_plan", phase_no=self.phase, outcome="started")

    def _finish(self) -> None:
        need = dict(BASE_THRESHOLD)
        need["safety"] = self.safety_need
        met = {k: self.m[k] >= need[k] for k in METERS}
        n_met = sum(met.values())
        tier = "Community Day is a success!" if n_met == 4 else ("The park opens with one area closed." if n_met == 3 else
                                                                "The park opens only partly; the team will finish the rest next month.")
        lines = [tier, ""] + [f"{k.capitalize():<9} {self.m[k]:>3} / {need[k]}  {'met' if met[k] else 'not yet'}" for k in METERS]
        lines += ["", f"Coins left: {self.coins}", "This describes the park, not you. There was no single right way to do this."]
        for site, c in self.contrib.items():
            if c["tasks"]:
                self._log(E.CONTRIBUTION, "site_contribution", site=site, shifts=c["shifts"], coins=c["coins"], tasks=c["tasks"], stage="final",
                          outcome="summary")
        self._log(E.CONTRIBUTION, "mission_summary", site="all", requirements_met=n_met, meters=dict(self.m), coins_left=self.coins,
                  role_final=self.role, stage="final", outcome=tier)
        self.final_lines = lines
        self.open_message("Community Day", "", lines=lines)
        self.modal.on_close = lambda: self.complete(requirements_met=n_met, coins_left=self.coins, role=self.role,
                                                   tasks_done=len(self.done))

    # -------------------------------------------------------------------- draw
    def hud_extra(self):
        return [("phase", f"{self.phase}/{PHASES}"), ("shifts", str(self.shifts)), ("coins", str(self.coins))]

    def draw_world(self, world: pygame.Surface) -> None:
        world.blit(W.vertical_gradient((S.WORLD_W, S.WORLD_H), (70, 96, 78), (44, 62, 52)), (0, 0))
        W.text(world, "RIVERSIDE PARK - PROJECT HQ", (S.WORLD_W // 2, 30), 32, S.TEXT_DIM, anchor="center", bold=True)
        W.text(world, "Teammates", (S.WORLD_W // 2 - 100, 396), 22, S.TEXT_DIM, anchor="center")
        for k, r in SITES.items():
            draw_station(world, r, SITE_LABEL[k], SITE_COLOR[k], 22)
            if k in ROLES and self.role == k:
                pygame.draw.circle(world, S.GOLD, (r.right - 10, r.y + 10), 9)
        need = dict(BASE_THRESHOLD)
        need["safety"] = self.safety_need
        for i, k in enumerate(METERS):
            x = 120 + i * 220
            W.text(world, k.capitalize(), (x, 262), 22, S.TEXT, bold=True)
            W.bar(world, (x, 288, 190, 16), self.m[k] / 100, S.ACCENT_2 if self.m[k] >= need[k] else S.ACCENT, radius=5)
            tx = x + int(190 * need[k] / 100)
            pygame.draw.line(world, S.WARN, (tx, 282), (tx, 310), 3)

    def draw_overlay(self, world: pygame.Surface) -> None:
        st = nearest_station(self.player, SITES)
        if st and self.modal is None:
            r = SITES[st]
            W.key_hint(world, "E", (r.centerx - 8, r.y - 30), 24)
