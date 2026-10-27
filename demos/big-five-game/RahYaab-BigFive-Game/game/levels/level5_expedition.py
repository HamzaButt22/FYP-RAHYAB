"""Level 5 - Strategic Expedition (advanced Big Five level).

The player leads a day-long expedition from Base Camp to the Summit Observatory.

* Three routes (North Ridge / Central Forest / South River), each with two legs, joined by cross-links.
* Resources: clock hours (departure 06:00), energy, ration packs and a pack-weight limit.
* Preparation at Base Camp is optional: read the board, ask the scout, commit a plan in the tent, pack supplies.
* A fair, deterministic surprise (a washout) happens on whichever route you take first; the scout can warn you.
* Optional discoveries cost time. A porter at the Junction needs help (a pure cost to you).
* The plan can be revised at any time with the Expedition Notebook (TAB).
* Nothing here can be "failed": every plan reaches the Observatory, so telemetry reflects choices, not success.

All numbers are constants in this file so the telemetry-to-feature mapping is reproducible.
"""
from __future__ import annotations

import pygame

from analytics.event_schema import (CAT_COOPERATION, CAT_HELP, CAT_PLANNING, CAT_RISK, CAT_SHARE, CAT_SOCIAL,
                                    KIND_CHECK, KIND_EXIT, KIND_IGNORE, KIND_NEUTRAL, KIND_PROSOCIAL, KIND_RISKY,
                                    KIND_SAFE, KIND_SOCIAL, EventType as E)
from game import settings as S
from game.input_state import InputState
from game.levels.base import Level
from game.levels.common import draw_station, nearest_station
from game.ui import widgets as W
from game.ui.panels import CountPanel

START_CLOCK = 6.0
DUSK_AT = 18.0
STORM_AT = 14.0                       # entering the steep trail after this hour is slippery
START_ENERGY = 100.0
TIRED_BELOW = 25.0
CAPACITY = 6
ITEMS = [
    {"key": "ration", "label": "Ration packs", "weight": 1, "max": 3, "note": "+18 energy each"},
    {"key": "rope", "label": "Climbing rope", "weight": 2, "max": 1, "note": "eases the washout"},
    {"key": "lantern", "label": "Lantern", "weight": 1, "max": 1, "note": "dusk is easier"},
    {"key": "mapkit", "label": "Trail-map kit", "weight": 1, "max": 1, "note": "shows exact route costs"},
]
ROUTES = {                            # per leg: hours, energy
    "north": {"name": "North Ridge", "hours": 1.5, "energy": 18.0, "y": 95,
              "blurb": "Short but exposed ridge. Fast, tiring."},
    "central": {"name": "Central Forest", "hours": 2.5, "energy": 12.0, "y": 300,
                "blurb": "Unmapped forest trail. Costs unknown until scouted."},
    "south": {"name": "South River", "hours": 3.5, "energy": 7.0, "y": 500,
              "blurb": "Long riverside path. Slow, gentle."},
}
ASCENT = {"steep": {"name": "Steep Trail", "hours": 1.5, "energy": 28.0},
          "switchback": {"name": "Switchbacks", "hours": 3.5, "energy": 10.0}}
SLICK_EXTRA = (1.0, 10.0)             # steep trail after STORM_AT
WASHOUT = {"hours": 2.0, "energy": 6.0}
WASHOUT_ROPE = {"hours": 0.5, "energy": 2.0}
RATION_ENERGY, RATION_HOURS = 18.0, 0.25
REST_ENERGY, REST_HOURS = 10.0, 1.0
CROSSLINK_HOURS = 0.5
DISCOVERY_HOURS = 0.5
PORTER_HELP = (1.0, 8.0)
MIRA_LEG_EXTRA = 0.5

BAND = {"north": (40, 150), "central": (230, 370), "south": (450, 550)}
SOLIDS = [
    pygame.Rect(215, 0, 665, 40), pygame.Rect(215, 150, 285, 80), pygame.Rect(560, 150, 320, 80),
    pygame.Rect(215, 370, 285, 80), pygame.Rect(560, 370, 320, 80), pygame.Rect(215, 550, 665, 54),
    pygame.Rect(975, 140, 30, 320),
]
LEG_ZONES = {(r, i): pygame.Rect(x, BAND[r][0], 60, BAND[r][1] - BAND[r][0])
             for r in ROUTES for i, x in ((1, 300), (2, 640))}
FORK_ZONES = {r: pygame.Rect(580, BAND[r][0], 30, BAND[r][1] - BAND[r][0]) for r in ROUTES}
CROSSLINKS = {"north_central": pygame.Rect(500, 150, 60, 80), "central_south": pygame.Rect(500, 370, 60, 80)}
DISCOVERIES = {
    "eagle_overlook": {"rect": pygame.Rect(430, 48, 80, 46), "name": "Eagle Overlook", "route": "north"},
    "ancient_shrine": {"rect": pygame.Rect(400, 236, 80, 44), "name": "Ancient Shrine", "route": "central"},
    "herb_grove": {"rect": pygame.Rect(700, 324, 80, 40), "name": "Herb Grove", "route": "central"},
    "fishing_camp": {"rect": pygame.Rect(400, 462, 80, 44), "name": "Fishing Camp", "route": "south"},
}
ASCENT_ZONES = {"steep": pygame.Rect(985, 0, 20, 140), "switchback": pygame.Rect(985, 460, 20, 144)}
# Waypoints used by test bots / documentation: the column x=957 is free between the junction stations and the wall.
JUNCTION_X = 957
OBSERVATORY = pygame.Rect(1040, 270, 50, 60)
STATIONS = {
    "supply": pygame.Rect(40, 215, 72, 50), "board": pygame.Rect(130, 215, 72, 50),
    "tent": pygame.Rect(40, 340, 72, 50), "mira": pygame.Rect(130, 340, 52, 50),
    "tariq": pygame.Rect(890, 170, 44, 50), "rest": pygame.Rect(890, 400, 46, 40), "cairn": pygame.Rect(895, 262, 36, 36),
}
STATION_LABEL = {"supply": "Supplies", "board": "Route Board", "tent": "Planning Tent", "mira": "Scout Mira",
                 "tariq": "Porter", "rest": "Rest Camp", "cairn": "Cairn"}
STATION_COLOR = {"supply": (150, 110, 70), "board": (60, 100, 80), "tent": (80, 90, 150), "mira": (120, 80, 140),
                 "tariq": (150, 90, 60), "rest": (70, 120, 120), "cairn": (110, 110, 120)}
ASCENT_CHOICES = ("steep", "switchback")


def fmt_clock(h: float) -> str:
    hh = int(h)
    mm = int(round((h - hh) * 60))
    if mm == 60:
        hh, mm = hh + 1, 0
    return f"{hh:02d}:{mm:02d}"


class ExpeditionLevel(Level):
    level_id = 5
    name = "Strategic Expedition"
    scenario = "expedition"
    objective = "Lead the expedition to the Summit Observatory. Plan, pack, adapt - there is more than one good way."
    controls_hint = "Move: WASD / Arrows   Interact: E   Notebook: TAB   Pause: P"
    task_name = "lead_expedition"
    start_pos = (100, 300)

    # ----------------------------------------------------------------- state
    def build(self) -> None:
        self.clock_h = START_CLOCK
        self.energy = START_ENERGY
        self.rations = 0
        self.pack = {i["key"]: 0 for i in ITEMS}
        self.with_mira = False
        self.departed = False
        self.charged_legs: set[tuple[str, int]] = set()
        self.route_taken: str | None = None
        self.route_log: list[str] = []
        self.in_zone: str | None = None
        self.washout_done = False
        self.washout_pending: str | None = None        # route whose leg 2 is washed out and not yet handled
        self.dusk_done = False
        self.discovered: set[str] = set()
        self.knows_costs = False
        self.knows_storm = False
        self.knows_washout = False
        self.plan: dict | None = None
        self.prep_done: set[str] = set()
        self.info_since_plan = False
        self.last_nb_sig = None
        self.notebook_opens = 0
        self.helped_porter = False
        self.crossings = 0
        self.stage = "prep"
        self.ascent_taken: str | None = None
        self.talked: set[str] = set()

    def level_start_metadata(self) -> dict:
        return {"capacity": CAPACITY, "start_clock": START_CLOCK, "start_energy": START_ENERGY, "routes": list(ROUTES),
                "discoveries_total": len(DISCOVERIES), "prep_actions_total": 5, "npcs_total": 2,
                "social_opportunities_total": 3}

    def solids(self):
        return SOLIDS + [r for k, r in STATIONS.items() if k in ("supply", "board", "tent", "tariq", "rest", "cairn")]

    # ------------------------------------------------------------ resources
    def _log(self, etype, action=None, **kw):
        kw.setdefault("stage", self.stage)
        kw.setdefault("actor", "player")
        return self.log.log(etype, action=action, **kw)

    def spend(self, hours: float, energy: float, reason: str) -> None:
        tired = self.energy < TIRED_BELOW
        if tired and hours > 0:
            hours += 0.5
        self.clock_h += hours
        self.energy -= energy
        if self.clock_h >= DUSK_AT and not self.dusk_done:
            self.dusk_done = True
            self.log.log(E.ENV_EVENT, action="dusk", actor="engine", stage=self.stage, clock=round(self.clock_h, 2),
                         lantern=bool(self.pack["lantern"]))
            self.say("Dusk falls. " + ("Your lantern helps." if self.pack["lantern"] else "Without a lantern, everything is harder."), 3200)
        if self.dusk_done and energy > 0:
            self.energy -= 1.0 if self.pack["lantern"] else 4.0
        if self.energy <= 0:
            self.clock_h += 2.0
            self.energy = 25.0
            self.log.log(E.ENV_EVENT, action="exhausted_rest", actor="engine", stage=self.stage, clock=round(self.clock_h, 2))
            self.say("Exhausted! The party rests for two hours.", 3000)
        self.log.log(E.RESOURCE_USED, action="spend", actor="engine", reason=reason, hours=round(hours, 2),
                     energy=round(energy, 1), clock=round(self.clock_h, 2), energy_left=round(self.energy, 1),
                     rations=self.rations, stage=self.stage)

    @property
    def capacity(self) -> int:
        return CAPACITY + (2 if self.with_mira else 0)

    # -------------------------------------------------------------- update
    def on_update(self, dt: float, inp: InputState) -> None:
        if inp.tab and self.modal is None:
            self.open_notebook()
            return
        p = self.player
        if not self.departed and p.x > 235:
            self.departed = True
            self.stage = "route"
            self._log(E.PLAYER_INTERACTION, "depart", object_id="base_camp", novel=False, prep_actions=sorted(self.prep_done),
                      planned=self.plan is not None, packed=dict(self.pack), clock=round(self.clock_h, 2))
        self._check_zones()
        if OBSERVATORY.collidepoint(p.pos) and self.departed:
            self.complete(clock=round(self.clock_h, 2), energy_left=round(self.energy, 1), route=self.route_taken,
                          ascent=self.ascent_taken, discoveries=len(self.discovered), helped_porter=self.helped_porter,
                          with_mira=self.with_mira, crossings=self.crossings)

    def _zone_at(self):
        pos = self.player.pos
        for (r, i), z in LEG_ZONES.items():
            if z.collidepoint(pos):
                return f"leg:{r}:{i}"
        for r, z in FORK_ZONES.items():
            if z.collidepoint(pos):
                return f"fork:{r}"
        for k, z in CROSSLINKS.items():
            if z.collidepoint(pos):
                return f"cross:{k}"
        for k, d in DISCOVERIES.items():
            if d["rect"].collidepoint(pos):
                return f"disc:{k}"
        for k, z in ASCENT_ZONES.items():
            if z.collidepoint(pos):
                return f"ascent:{k}"
        return None

    def _check_zones(self) -> None:
        z = self._zone_at()
        if z == self.in_zone:
            return
        self.in_zone = z
        if z is None:
            return
        kind, *rest = z.split(":")
        if kind == "leg":
            self._enter_leg(rest[0], int(rest[1]))
        elif kind == "fork":
            self._enter_fork(rest[0])
        elif kind == "cross":
            self._cross(rest[0])
        elif kind == "disc":
            self._discover(rest[0])
        elif kind == "ascent":
            self._enter_ascent(rest[0])

    def _enter_leg(self, route: str, leg: int) -> None:
        if (route, leg) in self.charged_legs:
            return
        self.charged_legs.add((route, leg))
        if self.route_taken is None:
            self.route_taken = route
            self.stage = "route"
        self.route_log.append(f"{route}{leg}")
        r = ROUTES[route]
        hours, energy = r["hours"] + (MIRA_LEG_EXTRA if self.with_mira else 0), r["energy"]
        extra_note = ""
        if leg == 2 and self.washout_pending == route:
            w = WASHOUT_ROPE if self.pack["rope"] else WASHOUT
            f = 0.5 if self.with_mira else 1.0
            hours, energy = hours + w["hours"] * f, energy + w["energy"] * f
            extra_note = " (washout)"
            self.washout_pending = None
        self._log(E.EXPLORATION, "enter_leg", zone_id=f"{route}_leg{leg}", route=route, leg=leg, optional=False,
                  clock=round(self.clock_h, 2), energy=round(self.energy, 1))
        self.spend(hours, energy, f"leg {route}{leg}{extra_note}")
        self.say(f"{r['name']}, leg {leg}: {fmt_clock(self.clock_h)}, energy {max(0, round(self.energy))}.", 2200)

    def _enter_fork(self, route: str) -> None:
        if self.washout_done:
            return
        self.washout_done = True
        self.washout_pending = route
        w = WASHOUT_ROPE if self.pack["rope"] else WASHOUT
        self.log.log(E.ENV_EVENT, action="washout", actor="engine", stage="event", route=route, warned=self.knows_washout,
                     extra_hours=w["hours"], extra_energy=w["energy"], rope=bool(self.pack["rope"]),
                     mira=self.with_mira, clock=round(self.clock_h, 2))
        self.info_since_plan = True
        self.stage = "event"
        fx = f"+{w['hours'] * (0.5 if self.with_mira else 1):g}h and +{w['energy'] * (0.5 if self.with_mira else 1):g} energy"
        opts = [
            {"key": "push_through", "label": f"Push through the washed-out leg ({fx})", "kind": KIND_RISKY, "risk_level": 0.6},
            {"key": "detour", "label": f"Take the cross-link to the next trail (+{CROSSLINK_HOURS:g}h; walk back to the gap in the rock wall)",
             "kind": KIND_NEUTRAL, "risk_level": 0.2},
            {"key": "camp_wait", "label": f"Camp and wait for the water to drop (+2h, +12 energy; the leg is then clear)", "kind": KIND_SAFE, "risk_level": 0.0},
        ]
        body = "A stream has swept across the trail ahead. " + ("You were warned about this. " if self.knows_washout else "Nobody mentioned this. ") \
               + "Decide how to deal with it."

        def chosen(o):
            self._log(E.PLAYER_INTERACTION, "washout_response", object_id="washout", novel=False, choice=o["key"],
                      warned=self.knows_washout, prepared=bool(self.pack["rope"]), outcome="chosen")
            if o["key"] == "camp_wait":
                self.washout_pending = None
                self.spend(2.0, -12.0, "wait out washout")
            elif o["key"] == "detour":
                self.say("Head back to the gap in the rock wall (middle of the map) and cross over.", 3500)
            else:
                self.say("You press on through the water.", 2200)
            self.stage = "route"
            self._maybe_replan_prompt()

        self.open_choice("l5_washout", CAT_RISK, "Unexpected: washout!", body, opts, chosen,
                         context={"route": route, "warned": self.knows_washout})

    def _maybe_replan_prompt(self) -> None:
        """New information has arrived; the notebook is the place to revise. We only remind the player."""
        if self.plan:
            self.say("New information! Press TAB to review or revise your plan.", 3200)

    def _cross(self, key: str) -> None:
        self.crossings += 1
        self.spend(CROSSLINK_HOURS, 2.0, "cross-link")
        if self.washout_pending is not None:
            self.washout_pending = None                  # avoided by switching trail
        a, b = key.split("_")
        self._log(E.EXPLORATION, "cross_link", zone_id=key, optional=True, clock=round(self.clock_h, 2))
        self.say(f"Crossing between {ROUTES[a]['name']} and {ROUTES[b]['name']}.", 2000)

    def _discover(self, key: str) -> None:
        if key in self.discovered:
            return
        self.discovered.add(key)
        d = DISCOVERIES[key]
        self._log(E.EXPLORATION, "enter_optional_area", zone_id=key, zone_name=d["name"], optional=True,
                  clock=round(self.clock_h, 2))
        self.spend(DISCOVERY_HOURS, 0.0, f"discovery {key}")
        msg = {
            "eagle_overlook": "From the overlook you spot storm clouds: the steep trail will be slippery after 14:00.",
            "ancient_shrine": "Carvings in the shrine map every route's exact cost.",
            "herb_grove": "The herbs are refreshing: +10 energy.",
            "fishing_camp": "The fishers give you two ration packs.",
        }[key]
        if key == "eagle_overlook":
            self.knows_storm = True
        elif key == "ancient_shrine":
            self.knows_costs = True
        elif key == "herb_grove":
            self.energy = min(100.0, self.energy + 10)
        elif key == "fishing_camp":
            self.rations += 2
        self.info_since_plan = True
        self._log(E.ITEM_COLLECTED, "discovery_reward", object_id=key, outcome=msg[:40])
        self.open_message(d["name"], msg)

    def _enter_ascent(self, which: str) -> None:
        if self.ascent_taken is not None:
            return
        self.ascent_taken = which
        self.stage = "final"
        a = ASCENT[which]
        hours, energy = a["hours"], a["energy"]
        slick = which == "steep" and self.clock_h >= STORM_AT
        if slick:
            hours, energy = hours + SLICK_EXTRA[0], energy + SLICK_EXTRA[1]
            self.log.log(E.ENV_EVENT, action="storm_slick", actor="engine", stage="final", warned=self.knows_storm,
                         clock=round(self.clock_h, 2))
            self.say("The storm has made the steep trail slippery!", 2800)
        self._log(E.PLAYER_INTERACTION, "choose_ascent", object_id=which, novel=False, slick=slick, warned=self.knows_storm,
                  clock=round(self.clock_h, 2), energy=round(self.energy, 1), planned=(self.plan or {}).get("ascent"))
        if which == "steep":
            self._log(E.RISK_ACTION, "steep_trail", risk_level=0.6, success=True, p_success=1.0)
        self.spend(hours, energy, f"ascent {which}")

    # ------------------------------------------------------------ interaction
    def on_interact(self) -> None:
        st = nearest_station(self.player, STATIONS)
        if st == "supply":
            self.open_pack()
        elif st == "board":
            self.read_board()
        elif st == "tent":
            self.open_tent()
        elif st == "mira":
            self.talk_mira()
        elif st == "tariq":
            self.talk_tariq()
        elif st == "rest":
            self.rest_camp()
        elif st == "cairn":
            self.open_message("Old Cairn", "Travellers have left small stones here for generations. You add one. Nothing else happens.")
            self._log(E.PLAYER_INTERACTION, "cairn", object_id="cairn", novel=True)

    def _prep(self, name: str) -> None:
        if self.stage == "prep":
            self.prep_done.add(name)

    # ---- board
    def read_board(self) -> None:
        first = "board" not in self.talked
        self.talked.add("board")
        self._prep("board")
        self.info_since_plan = True
        self._log(E.INFO_SEEKING, "read_board", source="board", first_time=first)
        lines = []
        for k, r in ROUTES.items():
            known = self.knows_costs or self.pack["mapkit"] or k != "central" or (k, 1) in self.charged_legs
            cost = f"{r['hours'] * 2:g}h, {r['energy'] * 2:g} energy" if known else "cost unknown"
            lines.append(f"{r['name']}: {r['blurb']}  [{cost}]")
        lines.append(f"Final ascent - Steep Trail: {ASCENT['steep']['hours']:g}h, {ASCENT['steep']['energy']:g} energy.  "
                     f"Switchbacks: {ASCENT['switchback']['hours']:g}h, {ASCENT['switchback']['energy']:g} energy.")
        lines.append("Cross-links join the trails halfway. Rations restore energy, rest takes time. Dusk is at 18:00.")
        self.open_message("Route Board", "", lines=[ln for x in lines for ln in W.wrap(x, 24, 600)])

    # ---- pack
    def open_pack(self) -> None:
        self._prep("pack")
        self._log(E.PLAYER_INTERACTION, "open_pack", object_id="supply", novel=False)

        def ev(kind, key, counts):
            self._log(E.PLAYER_INTERACTION, "pack_" + kind, object_id=key, novel=False, counts=counts,
                      weight=sum(i["weight"] * counts[i["key"]] for i in ITEMS))

        def closed(counts):
            self.rations = max(0, self.rations + counts["ration"] - self.pack["ration"])
            self.pack = dict(counts)
            w = sum(i["weight"] * counts[i["key"]] for i in ITEMS)
            self._log(E.PLAYER_INTERACTION, "pack_confirm", object_id="supply", novel=False, counts=dict(counts), weight=w,
                      capacity=self.capacity, outcome="packed")

        panel = CountPanel("Pack supplies", f"Choose what to carry. Capacity {self.capacity}.", ITEMS, self.capacity, ev, closed,
                           counts=self.pack)
        self.modal = panel

    # ---- tent (plan)
    def open_tent(self) -> None:
        self._prep("tent")
        self._log(E.PLAYER_INTERACTION, "open_planner", object_id="tent", novel=False)
        self._plan_dialog("tent")

    def _plan_dialog(self, source: str) -> None:
        mode = "revise" if self.plan else "create"
        known = self.knows_costs or self.pack["mapkit"]
        ropts = [{"key": k, "label": f"{r['name']} - {r['blurb']}", "kind": KIND_RISKY if k == "central" else KIND_NEUTRAL}
                 for k, r in ROUTES.items()]

        def route_chosen(o):
            route = o["key"]
            aopts = [{"key": k, "label": f"{a['name']} ({a['hours']:g}h, {a['energy']:g} energy)",
                      "kind": KIND_RISKY if k == "steep" else KIND_SAFE} for k, a in ASCENT.items()]

            def asc_chosen(a):
                ropts2 = [{"key": str(n), "label": f"{n} planned rest / ration stop(s)", "kind": KIND_NEUTRAL} for n in (0, 1, 2)]

                def rest_chosen(rr):
                    new = {"route": route, "ascent": a["key"], "rests": int(rr["key"])}
                    trig = "new_info" if (mode == "revise" and self.info_since_plan) else ("initial" if mode == "create" else "none")
                    self._log(E.PLAN_ACTION, mode, task_id="expedition_plan", source=source, previous=self.plan, new=new,
                              trigger=trig, changed=(self.plan != new), clock=round(self.clock_h, 2),
                              prepared_items=dict(self.pack), outcome="committed")
                    self.plan = new
                    self.info_since_plan = False
                    self.say(f"Plan {'revised' if mode == 'revise' else 'committed'}: {ROUTES[route]['name']}, {ASCENT[a['key']]['name']}.", 2600)

                self.open_choice("l5_plan_rest", CAT_PLANNING, "Plan: rest stops", "How many planned stops to eat or rest?",
                                 ropts2, rest_chosen)

            self.open_choice("l5_plan_ascent", CAT_PLANNING, "Plan: final ascent", "Which way will you climb at the end?",
                             aopts, asc_chosen)

        body = ("Which route will you lead the party along?" + ("" if known else " (Central Forest costs are unknown.)"))
        if self.plan:
            body = f"Current plan: {ROUTES[self.plan['route']]['name']} then {ASCENT[self.plan['ascent']]['name']}. " + body
        self.open_choice("l5_plan_route", CAT_PLANNING, "Expedition plan" if mode == "create" else "Revise plan", body, ropts,
                         route_chosen, context={"mode": mode})

    # ---- notebook
    def open_notebook(self) -> None:
        sig = (round(self.clock_h, 2), round(self.energy, 1), self.rations, tuple(sorted(self.discovered)),
               self.knows_storm, self.knows_costs, self.knows_washout, self.washout_pending,
               tuple(sorted((self.plan or {}).items())))
        redundant = sig == self.last_nb_sig
        self.last_nb_sig = sig
        self.notebook_opens += 1
        self._log(E.INFO_SEEKING, "recheck_notebook" if redundant else "open_notebook", source="notebook", redundant=redundant,
                  n_opens=self.notebook_opens)
        plan = (f"{ROUTES[self.plan['route']]['name']} -> {ASCENT[self.plan['ascent']]['name']}, {self.plan['rests']} stop(s)"
                if self.plan else "no plan committed")
        body = (f"Time {fmt_clock(self.clock_h)} (dusk 18:00)   Energy {max(0, round(self.energy))}/100   Rations {self.rations}\n"
                f"Plan: {plan}\n"
                f"Known: storm {'yes' if self.knows_storm else 'no'}, exact costs {'yes' if (self.knows_costs or self.pack['mapkit']) else 'no'}")
        opts = [
            {"key": "revise", "label": "Revise the plan", "kind": KIND_NEUTRAL},
            {"key": "eat", "label": f"Eat a ration (+{RATION_ENERGY:g} energy, {RATION_HOURS * 60:g} min)", "kind": KIND_SAFE},
            {"key": "rest", "label": f"Rest an hour (+{REST_ENERGY:g} energy)", "kind": KIND_SAFE},
            {"key": "close", "label": "Close the notebook", "kind": KIND_EXIT},
        ]

        def chosen(o):
            k = o["key"]
            if k == "revise":
                self._plan_dialog("notebook")
            elif k == "eat":
                if self.rations <= 0:
                    self._log(E.PLAYER_INTERACTION, "invalid_attempt", object_id="eat", novel=False, reason="no_rations")
                    self.say("You have no rations left.", 2000)
                else:
                    self.rations -= 1
                    self.energy = min(100.0, self.energy + RATION_ENERGY)
                    self.clock_h += RATION_HOURS
                    self._log(E.RESOURCE_USED, "eat_ration", energy=RATION_ENERGY, energy_before=round(self.energy - RATION_ENERGY, 1),
                              rations_left=self.rations, clock=round(self.clock_h, 2))
            elif k == "rest":
                self.energy = min(100.0, self.energy + REST_ENERGY)
                self.clock_h += REST_HOURS
                self._log(E.RESOURCE_USED, "rest", energy=REST_ENERGY, energy_before=round(self.energy - REST_ENERGY, 1),
                          clock=round(self.clock_h, 2))

        self.open_choice("l5_notebook", CAT_PLANNING, "Expedition Notebook", body, opts, chosen)

    def rest_camp(self) -> None:
        self._log(E.PLAYER_INTERACTION, "visit_rest_camp", object_id="rest", novel=False)
        opts = [{"key": "rest_camp", "label": "Rest properly (+25 energy, 1.5h)", "kind": KIND_SAFE},
                {"key": "move_on", "label": "Keep moving", "kind": KIND_RISKY}]

        def chosen(o):
            if o["key"] == "rest_camp":
                self.energy = min(100.0, self.energy + 25)
                self.clock_h += 1.5
                self._log(E.RESOURCE_USED, "rest", energy=25, hours=1.5, clock=round(self.clock_h, 2), at="rest_camp")

        self.open_choice("l5_restcamp", CAT_RISK, "Rest Camp", "A sheltered camp. Time passes while you rest.", opts, chosen)

    # ---- NPCs
    def talk_mira(self) -> None:
        first = "mira" not in self.talked
        self.talked.add("mira")
        eid = "mira"
        if first:
            self._prep("scout")
            self.log.log(E.NPC_INTERACTION, action="initiated_by_player", encounter_id=eid, npc="mira", actor="player", stage=self.stage)
        self._mira_turn(1)

    def _mira_turn(self, turn: int) -> None:
        opts = []
        if not self.knows_washout:
            opts.append({"key": "mira_ask", "label": "Ask about trail conditions", "kind": KIND_CHECK})
        if not self.with_mira:
            opts.append({"key": "mira_join", "label": "Ask her to come along (+2 pack space, but she slows each leg)", "kind": KIND_PROSOCIAL})
        opts.append({"key": "mira_bye", "label": "Say goodbye", "kind": KIND_EXIT})

        def chosen(o):
            k = o["key"]
            if k != "mira_bye":
                self.log.log(E.NPC_INTERACTION, action="dialogue_turn", encounter_id="mira", npc="mira", actor="player", stage=self.stage)
            if k == "mira_ask":
                self.knows_washout = True
                self.info_since_plan = True
                self._log(E.INFO_SEEKING, "ask_scout_conditions", source="mira", first_time=True)
                self.open_message("Scout Mira", "A stream sometimes washes out the second half of a trail. Rope helps, and you can "
                                  "cross between trails at the gaps in the rock wall.", speaker="Mira")
                self.modal.on_close = lambda: self._mira_turn(turn + 1)
            elif k == "mira_join":
                self.with_mira = True
                self._log(E.COOPERATION_ACTION, "invite_scout", npc="mira", mode="accept_help", capacity=self.capacity)
                self.say("Mira joins the expedition.", 2400)
                self._mira_turn(turn + 1)

        self.open_choice(f"l5_mira_t{turn}", CAT_SOCIAL, "Scout Mira", "Mira knows these mountains well." if turn == 1 else "Anything else?",
                         opts, chosen, speaker="Mira", context={"npc": "mira", "turn": turn})

    def talk_tariq(self) -> None:
        if "tariq" in self.talked:
            self.say("Tariq is already on his way.", 1800)
            return
        self.talked.add("tariq")
        self.log.log(E.NPC_INTERACTION, action="initiated_by_player", encounter_id="tariq", npc="tariq", actor="player", stage=self.stage)
        opts = [
            {"key": "tariq_help", "label": f"Help carry his cart over the stream (-{PORTER_HELP[0]:g}h, -{PORTER_HELP[1]:g} energy)", "kind": KIND_PROSOCIAL},
            {"key": "tariq_share", "label": "Give him one of your ration packs", "kind": KIND_PROSOCIAL},
            {"key": "tariq_pass", "label": "Wish him luck and keep going", "kind": KIND_IGNORE},
        ]

        def chosen(o):
            k = o["key"]
            if k == "tariq_help":
                self.helped_porter = True
                self.spend(PORTER_HELP[0], PORTER_HELP[1], "help porter")
                self._log(E.HELP_ACTION, "help_porter", npc="tariq", cost_hours=PORTER_HELP[0], cost_energy=PORTER_HELP[1], outcome="helped")
            elif k == "tariq_share":
                if self.rations > 0:
                    self.rations -= 1
                    self._log(E.SHARE_ACTION, "share_ration", npc="tariq", outcome="shared")
                else:
                    self._log(E.PLAYER_INTERACTION, "invalid_attempt", object_id="share", novel=False, reason="no_rations")
                    self.say("You have no rations to give.", 2000)

        self.open_choice("l5_tariq", CAT_HELP, "Porter Tariq", "Tariq's cart is stuck at the stream. He looks tired and worried "
                         "about getting it across before dark. Whatever you do, he is grateful - there is no reward.",
                         opts, chosen, speaker="Tariq", context={"npc": "tariq"})

    # ------------------------------------------------------------------- draw
    def hud_extra(self):
        return [("clock", fmt_clock(self.clock_h)), ("energy", str(max(0, round(self.energy)))), ("rations", str(self.rations))]

    def draw_world(self, world: pygame.Surface) -> None:
        world.fill((46, 70, 58))
        for r in SOLIDS:
            pygame.draw.rect(world, (84, 80, 88), r)
            pygame.draw.rect(world, (60, 58, 66), r, 3)
        for k, (lo, hi) in BAND.items():
            band = pygame.Rect(215, lo, 665, hi - lo)
            pygame.draw.rect(world, {"north": (110, 120, 128), "central": (60, 100, 62), "south": (70, 110, 130)}[k], band)
            W.text(world, ROUTES[k]["name"], (band.x + 8, band.y + 4), 22, S.TEXT, bold=True)
        pygame.draw.rect(world, (84, 96, 70), (0, 0, 215, S.WORLD_H))
        pygame.draw.rect(world, (80, 100, 80), (880, 0, 95, S.WORLD_H))
        pygame.draw.rect(world, (74, 64, 80), (1005, 0, 95, S.WORLD_H))
        W.text(world, "BASE CAMP", (12, 8), 24, S.TEXT, bold=True)
        W.text(world, "JUNCTION", (890, 8), 22, S.TEXT, bold=True)
        for (r, i), z in LEG_ZONES.items():
            pygame.draw.rect(world, (255, 255, 255), z, 1)
        for r, z in FORK_ZONES.items():
            pygame.draw.rect(world, (200, 160, 80), z, 1)
        for k, z in CROSSLINKS.items():
            pygame.draw.rect(world, (220, 200, 120), z, 2)
            W.text(world, "link", z.center, 20, S.TEXT, anchor="center")
        for k, d in DISCOVERIES.items():
            pygame.draw.rect(world, (150, 120, 190) if k not in self.discovered else (90, 80, 110), d["rect"], border_radius=8)
            W.text(world, d["name"], d["rect"].center, 18, S.TEXT, anchor="center")
        pygame.draw.rect(world, (170, 90, 80), ASCENT_ZONES["steep"], 2)
        pygame.draw.rect(world, (90, 150, 170), ASCENT_ZONES["switchback"], 2)
        W.text(world, "STEEP", (976, 110), 18, S.TEXT)
        W.text(world, "SWITCHBACKS", (968, 580), 16, S.TEXT)
        pygame.draw.rect(world, (220, 200, 90), OBSERVATORY, border_radius=8)
        W.text(world, "Observatory", (OBSERVATORY.centerx - 6, OBSERVATORY.bottom + 2), 18, S.TEXT, anchor="midtop", bold=True)
        for k, rct in STATIONS.items():
            draw_station(world, rct, STATION_LABEL[k], STATION_COLOR[k], 20)

    def draw_overlay(self, world: pygame.Surface) -> None:
        st = nearest_station(self.player, STATIONS)
        if st and self.modal is None:
            r = STATIONS[st]
            W.key_hint(world, "E", (r.centerx - 8, r.y - 30), 24)
        W.text(world, "TAB: notebook", (12, S.WORLD_H - 10), 22, S.TEXT, anchor="bottomleft", bold=True)
