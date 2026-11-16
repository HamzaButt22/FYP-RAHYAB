"""Level 6 - Flood Response Simulation (advanced Big Five level: adaptive crisis).

The player is the duty coordinator of a river town. Three stages (water rising, dam release, recession) with a fixed
number of action points (AP) per stage, shared resources that carry forward, four NPC desks with competing requests,
a neighbouring town that asks for help, forecasts that can be sought out, and consequences that carry into later stages.

Fairness rules (also documented in docs/LEVELS.md):
* completely deterministic - no random outcomes;
* no countdown: the only limit is the action points of each stage;
* every surprise (dam release, supply delay, road closure) can be discovered in advance with the radio;
* the level always completes; the final review describes the outcome but is NOT used for personality scoring.
"""
from __future__ import annotations

import pygame

from analytics.event_schema import (CAT_COOPERATION, CAT_HELP, CAT_PLANNING, CAT_RISK, CAT_SOCIAL, KIND_CHECK,
                                    KIND_EXIT, KIND_IGNORE, KIND_NEUTRAL, KIND_PROSOCIAL, KIND_RISKY, KIND_SAFE,
                                    KIND_SELFISH, KIND_SOCIAL, EventType as E)
from game import settings as S
from game.input_state import InputState
from game.levels.base import Level
from game.levels.common import draw_station, nearest_station
from game.ui import widgets as W

STAGES = 3
AP_PER_STAGE = 10
START = {"sandbags": 8, "volunteers": 6, "vehicles": 2, "medkits": 3}
RESUPPLY = {1: 0, 2: 2, 3: 4}               # stage 2 supply truck is delayed (announced by the forecast)
SITES = {
    "clinic": {"name": "Riverside Clinic", "people": 12, "label": "Clinic"},
    "school": {"name": "Hillview School", "people": 40, "label": "School"},
    "market": {"name": "Old Market", "people": 20, "label": "Market"},
    "farms": {"name": "Low Farms", "people": 6, "label": "Farms"},
}
RISK = {1: {"clinic": 3, "school": 3, "market": 3, "farms": 2},
        2: {"clinic": 5, "school": 5, "market": 5, "farms": 4},
        3: {"clinic": 3, "school": 4, "market": 4, "farms": 3}}
REPORTED_CLINIC_STAGE1 = 2                    # the first gauge reading is wrong; the radio gauge check corrects it
PACKAGES = {
    "sand2": {"label": "Sandbag crew: 2 sandbags (+2 protection)", "pts": 2, "sand": 2},
    "sand4": {"label": "Sandbag wall: 4 sandbags (+4 protection)", "pts": 4, "sand": 4},
    "crew2": {"label": "Volunteer team: 2 volunteers (+2 protection)", "pts": 2, "vol": 2},
    "improv": {"label": "Improvised barrier: 1 volunteer + boards (+3, once per stage)", "pts": 3, "vol": 1, "once": True},
}
EVAC = {"clinic": {"vehicle": 1, "medkit": 1}, "school": {"vehicle": 1}, "market": {"vol": 2}, "farms": {"vehicle": 1, "vol": 2}}
EVAC_LABEL = {"clinic": "Evacuate patients (1 vehicle + 1 medkit)", "school": "Evacuate the school (1 vehicle)",
              "market": "Close the market early (2 volunteers)", "farms": "Move families and livestock (1 vehicle + 2 volunteers)"}

STATIONS = {
    "map": pygame.Rect(60, 90, 160, 80), "radio": pygame.Rect(300, 90, 120, 80), "yard": pygame.Rect(500, 90, 140, 80),
    "depot": pygame.Rect(720, 90, 150, 80), "board": pygame.Rect(940, 90, 130, 80),
    "clinic": pygame.Rect(60, 430, 120, 80), "school": pygame.Rect(260, 430, 120, 80), "farms": pygame.Rect(460, 430, 120, 80),
    "council": pygame.Rect(660, 430, 120, 80), "hotline": pygame.Rect(860, 430, 140, 80),
}
LABEL = {"map": "Situation Map", "radio": "Radio", "yard": "Supply Yard", "depot": "Depot", "board": "Stage Board",
         "clinic": "Clinic Desk", "school": "School Desk", "farms": "Farm Desk", "council": "Councillor", "hotline": "Neighbour Town"}
COLOR = {"map": (60, 100, 90), "radio": (90, 80, 140), "yard": (140, 110, 60), "depot": (150, 80, 70), "board": (70, 110, 150),
         "clinic": (160, 70, 90), "school": (80, 120, 160), "farms": (110, 130, 70), "council": (120, 90, 120), "hotline": (70, 130, 130)}
NPC_OF = {"clinic": "rania", "school": "dawood", "farms": "sana", "council": "imran", "hotline": "aziz"}
PRIORITIES = {"people": "People first (evacuate before protecting buildings)", "property": "Protect buildings and livelihoods",
              "balanced": "Balance both", "flexible": "No fixed priority - I will decide as things develop"}


class CrisisLevel(Level):
    level_id = 6
    name = "Flood Response Simulation"
    scenario = "crisis"
    objective = "Coordinate the town's flood response over three stages with limited action points."
    controls_hint = "Move: WASD / Arrows   Interact: E   Pause: P   Nothing is timed in real time"
    task_name = "coordinate_flood_response"
    start_pos = (550, 300)

    # --------------------------------------------------------------- state
    def build(self) -> None:
        self.stage = 1
        self.ap = AP_PER_STAGE
        self.res = dict(START)
        self.assigned = {s: {"sand": 0, "vol": 0, "pts": 0, "improv": False} for s in SITES}
        self.vehicles_used = 0
        self.vehicles_cap = START["vehicles"]
        self.lent_vehicle = False
        self.lent_volunteers = 0
        self.bonus_vol = 0
        self.evac_vol_used = 0
        self.improv_used = False
        self.evacuated: set[str] = set()
        self.partial: dict[str, float] = {}
        self.damaged: set[str] = set()
        self.held_log: dict[int, dict[str, bool]] = {}
        self.known_clinic_fixed = False
        self.known: set[str] = set()                 # info topics revealed
        self.topics_used: dict[str, int] = {}
        self.met: set[str] = set()                   # NPCs approached
        self.requests: dict[str, bool] = {"clinic": True, "school": True, "farms": True, "council": True, "hotline": True}
        self.aid_requested = False
        self.aid_incoming = 0
        self.council_support = 0
        self.council_commit: int | None = None
        self.priority: str | None = None
        self.plan_stages: set[int] = set()
        self.last_map_sig = None
        self.last_action_ms = self.session.clock.ms
        self.after_report = True                     # first action of the level counts as the baseline "stage 1 start"
        self.after_report_setback = False
        self.after_report_ms = self.session.clock.ms
        self.new_info_pending = 0
        self.corrections = 0
        self.stage_flooded = False
        self.aziz_asked = False
        self.stage_started = False
        self.final_review: list[str] = []
        self._intro_pending = True

    def level_start_metadata(self) -> dict:
        return {"stages": STAGES, "ap_per_stage": AP_PER_STAGE, "sites": list(SITES), "npcs_total": 5,
                "info_sources_total": 6, "start_resources": START, "decision_stages": [1, 2, 3]}

    def solids(self):
        return list(STATIONS.values())

    # --------------------------------------------------------------- helpers
    def _log(self, etype, action=None, **kw):
        kw.setdefault("stage", f"stage{self.stage}")
        kw.setdefault("actor", "player")
        return self.log.log(etype, action=action, **kw)

    def _note_action(self, kind: str) -> None:
        now = self.session.clock.ms
        if self.after_report:
            self.after_report = False
            self._log(E.PLAYER_INTERACTION, "first_action_in_stage", object_id=kind, novel=False,
                      latency_ms=round(now - self.after_report_ms), setback=self.after_report_setback, stage_no=self.stage)
        else:
            self._log(E.PLAYER_INTERACTION, "action_gap", object_id=kind, novel=False, gap_ms=round(now - self.last_action_ms))
        self.last_action_ms = now

    def spend_ap(self, n: int, reason: str) -> bool:
        if self.ap < n:
            self._log(E.PLAYER_INTERACTION, "invalid_attempt", object_id=reason, novel=False, reason="not_enough_ap")
            self.say("Not enough action points left in this stage.", 2200)
            return False
        self.ap -= n
        self._log(E.RESOURCE_USED, "spend_ap", resource="ap", amount=n, ap_left=self.ap, reason=reason)
        return True

    def risk(self, site: str) -> int:
        return RISK[self.stage][site] + (1 if site in self.damaged else 0)

    def believed_risk(self, site: str) -> int | str:
        if self.stage == 1 and site == "clinic" and not self.known_clinic_fixed:
            return REPORTED_CLINIC_STAGE1
        return self.risk(site)

    def vol_free(self) -> int:
        lent = self.lent_volunteers if self.stage == 3 else 0
        return self.res["volunteers"] - lent - sum(a["vol"] for a in self.assigned.values()) - self.evac_vol_used

    def veh_free(self) -> int:
        return self.vehicles_cap - self.vehicles_used - (1 if self.lent_vehicle and self.stage == 3 else 0)

    def pts(self, site: str) -> int:
        return self.assigned[site]["pts"]

    # ------------------------------------------------------------------ update
    def on_update(self, dt: float, inp: InputState) -> None:
        if self._intro_pending:
            self._intro_pending = False
            self.open_message(
                "Flood warning", "", lines=[
                    "The river is rising and the town will be flooded in waves over three stages.",
                    "Each stage you have 10 action points (AP). Radio checks, orders, calls and talks cost AP.",
                    "Four places need protection: Clinic, School, Market, Farms. Protection points must reach the",
                    "risk level shown on the map. Sandbags are used up; volunteers and vehicles return each stage.",
                    "You may ask for information, change orders, talk to people and ask the neighbour town for help.",
                    "Use the Stage Board to end a stage when you are ready. There is no real-time clock."])
            self.modal.on_close = self._after_report_closed

    # ------------------------------------------------------------ interactions
    def on_interact(self) -> None:
        st = nearest_station(self.player, STATIONS)
        if st is None:
            return
        self._note_action(st)
        if st == "map":
            self.open_map()
        elif st == "radio":
            self.open_radio()
        elif st == "yard":
            self.open_yard()
        elif st == "depot":
            self.open_depot()
        elif st == "board":
            self.open_board()
        else:
            self.open_npc(st)

    # ---- map
    def open_map(self) -> None:
        sig = (self.stage, self.ap, tuple(sorted((k, v["pts"]) for k, v in self.assigned.items())), tuple(sorted(self.known)),
               self.known_clinic_fixed, tuple(sorted(self.damaged)), tuple(sorted(self.evacuated)))
        redundant = sig == self.last_map_sig
        self.last_map_sig = sig
        first = "map" not in self.known
        self.known.add("map")
        self._log(E.INFO_SEEKING, "recheck_map" if redundant else "review_map", source="map", redundant=redundant, first_time=first)
        lines = [f"STAGE {self.stage} of {STAGES}      AP left: {self.ap}"]
        for k, s in SITES.items():
            tags = []
            if k in self.evacuated:
                tags.append("evacuated")
            if k in self.damaged:
                tags.append("damaged (+1 risk)")
            if self.stage == 1 and k == "clinic" and not self.known_clinic_fixed:
                tags.append("gauge reading may be out of date")
            lines.append(f"{s['label']:<8} reported risk {self.believed_risk(k)}   assigned {self.pts(k)}   people {s['people']}  "
                         + ", ".join(tags))
        lines.append(f"Sandbags {self.res['sandbags']}  Volunteers free {self.vol_free()}  Vehicles free {self.veh_free()}  Medkits {self.res['medkits']}")
        self.open_message("Situation Map", "", lines=lines)

    # ---- radio
    def open_radio(self) -> None:
        opts = [
            {"key": "forecast", "label": "River forecast (1 AP)", "kind": KIND_CHECK},
            {"key": "roads", "label": "Road report (1 AP)", "kind": KIND_CHECK},
            {"key": "gauge", "label": "Re-read the clinic gauge (1 AP)", "kind": KIND_CHECK},
            {"key": "leave", "label": "Switch the radio off", "kind": KIND_EXIT},
        ]

        def chosen(o):
            k = o["key"]
            if k == "leave":
                return
            if not self.spend_ap(1, f"radio_{k}"):
                return
            n = self.topics_used.get(k, 0)
            redundant = n >= 1
            self.topics_used[k] = n + 1
            self.known.add("radio_" + k)
            text, new = self._radio_text(k)
            self._log(E.INFO_SEEKING, "recheck_" + k if redundant else "ask_" + k, source=f"radio_{k}", redundant=redundant,
                      first_time=not redundant, revealed_new=new)
            if new:
                self.new_info_pending += 1
            self.open_message("Radio", text, speaker="Control room")
            self.modal.on_close = self.open_radio if self.ap > 0 else None

        self.open_choice(f"l6_radio_s{self.stage}_{sum(self.topics_used.values())}", CAT_SOCIAL, "Radio", f"What do you want to find out? ({self.ap} AP left)",
                         opts, chosen, context={"stage_no": self.stage})

    def _radio_text(self, k: str) -> tuple[str, bool]:
        if k == "forecast":
            if self.stage == 1:
                self.known.add("dam")
                return ("The dam will release water before stage 2: every site's risk rises by 2, and the supply truck will be "
                        "delayed (only 2 sandbags arrive). Evacuating or stockpiling now is possible."), True
            if self.stage == 2:
                self.known.add("recession")
                return "After this stage the river starts to fall: risks drop by 2 in stage 3 compared with now.", True
            return "The river is falling. This is the last stage.", False
        if k == "roads":
            if self.stage <= 2:
                self.known.add("road")
                return ("A landslide will close one of the two routes at the start of stage 3: only one vehicle will be able "
                        "to get through. Vehicle-based evacuations are easier before then."), True
            return "One route is closed. Only one vehicle can pass this stage.", False
        if self.stage == 1 and not self.known_clinic_fixed:
            self.known_clinic_fixed = True
            return "The clinic gauge was misread: the water there is already higher. Its true risk is 3, not 2.", True
        return "No new reading from the clinic gauge.", False

    # ---- supply yard
    def open_yard(self) -> None:
        opts = [
            {"key": "fill", "label": "Fill sandbags yourself (+3 sandbags, 1 AP)", "kind": KIND_NEUTRAL},
            {"key": "call", "label": "Call for community volunteers (+2 volunteers this stage, 1 AP)", "kind": KIND_SOCIAL},
            {"key": "leave", "label": "Leave the yard", "kind": KIND_EXIT},
        ]

        def chosen(o):
            k = o["key"]
            if k == "leave":
                return
            if not self.spend_ap(1, f"yard_{k}"):
                return
            if k == "fill":
                self.res["sandbags"] += 3
                self._log(E.RESOURCE_USED, "fill_sandbags", resource="sandbags", amount=3, mode="solo", ap_cost=1)
                self.say("You fill 3 sandbags yourself.", 2000)
            else:
                self.res["volunteers"] += 2
                self.bonus_vol += 2
                self._log(E.COOPERATION_ACTION, "call_volunteers", mode="collaborate", resource="volunteers", amount=2, ap_cost=1)
                self.say("Two more volunteers join for this stage.", 2000)
            if self.ap > 0:
                self.open_yard()

        self.open_choice(f"l6_yard_s{self.stage}_{self.ap}", CAT_PLANNING, "Supply Yard", f"Do the work yourself or bring in others? ({self.ap} AP left)",
                         opts, chosen, context={"stage_no": self.stage})

    # ---- depot (dispatch / recall / evacuate / repair)
    def open_depot(self) -> None:
        opts = [{"key": s, "label": f"{d['label']}: risk {self.believed_risk(s)}, assigned {self.pts(s)}" +
                 ("  [evacuated]" if s in self.evacuated else "") + ("  [damaged]" if s in self.damaged else ""),
                 "kind": KIND_NEUTRAL} for s, d in SITES.items()]
        opts.append({"key": "done", "label": "Done at the depot", "kind": KIND_EXIT})

        def chosen(o):
            if o["key"] == "done":
                return
            self._site_orders(o["key"])

        self.open_choice(f"l6_depot_s{self.stage}_{self.ap}_{sum(self.pts(s) for s in SITES)}", CAT_PLANNING, "Depot",
                         f"Which site do you want to give orders for? ({self.ap} AP left; each order costs 1 AP)", opts, chosen,
                         context={"stage_no": self.stage})

    def _site_orders(self, site: str) -> None:
        a = self.assigned[site]
        opts = [{"key": k, "label": p["label"], "kind": KIND_NEUTRAL} for k, p in PACKAGES.items()]
        opts.append({"key": "evac", "label": EVAC_LABEL[site], "kind": KIND_SAFE})
        if site in self.damaged:
            opts.append({"key": "repair", "label": "Repair crew: 1 volunteer, removes the damage", "kind": KIND_NEUTRAL})
        if a["pts"] > 0 or a["vol"] > 0:
            opts.append({"key": "recall", "label": f"Recall everything assigned here ({a['pts']} protection) - change your mind", "kind": KIND_NEUTRAL})
        opts.append({"key": "back", "label": "Back", "kind": KIND_EXIT})

        def chosen(o):
            k = o["key"]
            if k == "back":
                self.open_depot()
                return
            why = self._why_not(site, k)
            if why:
                self._invalid(k, why)
                self.open_depot()
                return
            if not self.spend_ap(1, f"order_{k}"):
                return
            if k == "recall":
                self.res["sandbags"] += a["sand"]
                reverts = a["pts"]
                self._log(E.RESOURCE_ALLOCATED, "recall", site=site, resource="mixed", amount=reverts, ap_cost=1,
                          reverts_prior=True, after_new_info=self.new_info_pending > 0, buffer=0)
                if self.new_info_pending > 0:
                    self.corrections += 1
                a.update({"sand": 0, "vol": 0, "pts": 0, "improv": False})
                self.say(f"Resources recalled from {SITES[site]['label']}.", 2000)
            elif k == "evac":
                self._apply_evac(site, via="depot")
            elif k == "repair":
                a["vol"] += 1
                self.damaged.discard(site)
                self.corrections += 1
                self._log(E.RESOURCE_ALLOCATED, "repair", site=site, resource="volunteers", amount=1, ap_cost=1, corrective=True)
            else:
                self._dispatch(site, k)
            if self.ap > 0:
                self.open_depot()

        self.open_choice(f"l6_orders_{site}_s{self.stage}_{self.ap}", CAT_PLANNING, SITES[site]["name"],
                         f"Believed risk {self.believed_risk(site)}; protection assigned {a['pts']}. ({self.ap} AP left)",
                         opts, chosen, context={"stage_no": self.stage, "site": site})

    def _why_not(self, site: str, key: str):
        """Return a reason string when the order is impossible (no AP is spent in that case)."""
        if key in ("back", "recall"):
            return None
        if key == "evac":
            need = EVAC[site]
            if site in self.evacuated:
                return "already"
            if need.get("vehicle", 0) > self.veh_free():
                return "no_vehicle"
            if need.get("medkit", 0) > self.res["medkits"]:
                return "no_medkit"
            if need.get("vol", 0) > self.vol_free():
                return "no_vol"
            return None
        if key == "repair":
            return None if self.vol_free() >= 1 else "no_vol"
        p = PACKAGES[key]
        if p.get("sand", 0) > self.res["sandbags"]:
            return "no_sand"
        if p.get("vol", 0) > self.vol_free():
            return "no_vol"
        if p.get("once") and self.improv_used:
            return "once"
        return None

    def _invalid(self, what: str, why: str) -> None:
        self._log(E.PLAYER_INTERACTION, "invalid_attempt", object_id=what, novel=False, reason=why)
        self.say({"no_sand": "Not enough sandbags.", "no_vol": "Not enough free volunteers.", "no_vehicle": "No vehicle is free.",
                  "no_medkit": "No medkits left.", "once": "The improvised barrier was already built this stage.",
                  "already": "That site is already evacuated."}.get(why, "That is not possible right now."), 2400)

    def _dispatch(self, site: str, key: str) -> None:
        p = PACKAGES[key]
        a = self.assigned[site]
        self.res["sandbags"] -= p.get("sand", 0)
        a["sand"] += p.get("sand", 0)
        a["vol"] += p.get("vol", 0)
        a["pts"] += p["pts"]
        if p.get("once"):
            self.improv_used = True
        known = self.believed_risk(site)
        buffer = max(0, a["pts"] - int(known))
        self._log(E.RESOURCE_ALLOCATED, "dispatch", site=site, package=key, resource="sand" if p.get("sand") else "volunteers",
                  amount=p.get("sand", p.get("vol", 0)), pts_added=p["pts"], pts_after=a["pts"], known_risk=known,
                  buffer=buffer, novel=key == "improv", ap_cost=1, outcome="assigned")
        self.say(f"{SITES[site]['label']}: protection now {a['pts']} (believed risk {known}).", 2400)

    def _apply_evac(self, site: str, via: str) -> None:
        need = EVAC[site]
        self.vehicles_used += need.get("vehicle", 0)
        self.res["medkits"] -= need.get("medkit", 0)
        self.evac_vol_used += need.get("vol", 0)
        self.evacuated.add(site)
        self._log(E.RESOURCE_ALLOCATED, "evacuate", site=site, resource="vehicle", amount=need.get("vehicle", 0), ap_cost=1,
                  early_warning=("dam" in self.known and self.stage == 1), outcome="evacuated", via=via)
        self.say(f"{SITES[site]['label']} evacuated: people are safe.", 2600)

    def _npc_evac(self, site: str, npc: str, label: str) -> None:
        why = self._why_not(site, "evac")
        if why:
            self._invalid("evac", why)
            return
        if self.spend_ap(1, f"{npc}_evac"):
            self._apply_evac(site, via="npc_request")
            self._log(E.HELP_ACTION, label, npc=npc, outcome="helped", ap_cost=1)

    # ---- stage board
    def open_board(self) -> None:
        idle = self.res["sandbags"] + max(0, self.vol_free())
        opts = [
            {"key": "priority", "label": "Set / change this stage's priority", "kind": KIND_NEUTRAL},
            {"key": "end", "label": f"End stage {self.stage} now ({self.ap} AP unused)", "kind": KIND_RISKY},
            {"key": "keep", "label": "Keep working", "kind": KIND_EXIT},
        ]

        def chosen(o):
            if o["key"] == "priority":
                self._priority_dialog()
            elif o["key"] == "end":
                self.end_stage()

        self.open_choice(f"l6_board_s{self.stage}_{self.ap}", CAT_PLANNING, "Stage Board",
                         f"Stage {self.stage}/{STAGES}.  Unassigned: {self.res['sandbags']} sandbags, {max(0, self.vol_free())} volunteers.",
                         opts, chosen, context={"stage_no": self.stage})

    def _stage_start_prompt(self) -> None:
        """Offered at the start of every stage; skipping it is allowed (the board offers it later too)."""
        self._priority_dialog(optional=True)

    def _priority_dialog(self, optional: bool = False) -> None:
        opts = [{"key": k, "label": v, "kind": KIND_NEUTRAL} for k, v in PRIORITIES.items()]
        if optional:
            opts.append({"key": "skip", "label": "Skip - start working", "kind": KIND_EXIT})

        def chosen(o):
            k = o["key"]
            if k == "skip":
                self._log(E.PLAN_ACTION, "skip", task_id="stage_priority", outcome="skipped", stage_no=self.stage)
                return
            mode = "create" if self.priority is None else "revise"
            trig = "new_info" if (mode == "revise" and self.new_info_pending > 0) else ("initial" if mode == "create" else "none")
            self._log(E.PLAN_ACTION, mode, task_id="stage_priority", priority=k, previous=self.priority, trigger=trig,
                      changed=(k != self.priority), stage_no=self.stage, outcome="committed")
            if mode == "revise" and k != self.priority and self.new_info_pending > 0:
                self.corrections += 1
            self.priority = k
            self.plan_stages.add(self.stage)
            self.new_info_pending = 0

        self.open_choice(f"l6_priority_s{self.stage}_{len(self.plan_stages)}", CAT_PLANNING, f"Stage {self.stage}: your priority",
                         "What matters most to you right now? This is only a note to yourself - it does not change the rules.",
                         opts, chosen, context={"stage_no": self.stage})

    # ---- NPC desks
    def open_npc(self, desk: str) -> None:
        npc = NPC_OF[desk]
        self.requests[desk] = False
        first = npc not in self.met
        if first:
            self.met.add(npc)
            self.log.log(E.NPC_INTERACTION, action="initiated_by_player", encounter_id=npc, npc=npc, actor="player",
                         stage=f"stage{self.stage}")
        getattr(self, f"_npc_{npc}")()

    def _talk_turn(self, npc: str) -> None:
        self.log.log(E.NPC_INTERACTION, action="dialogue_turn", encounter_id=npc, npc=npc, actor="player", stage=f"stage{self.stage}")

    def _npc_rania(self) -> None:
        if "clinic" in self.evacuated:
            self.open_message("Nurse Rania", "The patients are safe, thank you.", speaker="Rania"); return
        opts = [
            {"key": "rania_evac", "label": "Send a vehicle and medkit now: evacuate patients (1 AP)", "kind": KIND_PROSOCIAL},
            {"key": "rania_ask", "label": "Ask what she needs and how bad it is (free)", "kind": KIND_CHECK},
            {"key": "rania_later", "label": "Promise help later this stage", "kind": KIND_NEUTRAL},
            {"key": "rania_hold", "label": "Tell her the clinic must stay open and hold", "kind": KIND_SELFISH},
        ]

        def chosen(o):
            k = o["key"]
            self._talk_turn("rania")
            if k == "rania_evac":
                self._npc_evac("clinic", "rania", "help_clinic")
            elif k == "rania_ask":
                self._log(E.INFO_SEEKING, "ask_rania", source="npc_rania", redundant=False, first_time=True)
                self.known.add("npc_rania")
                self.open_message("Nurse Rania", "Twelve patients, four can't walk. The water is already at the back door - the "
                                  "official gauge reading looks too low to me.", speaker="Rania")
                self.modal.on_close = self._npc_rania
            elif k == "rania_hold":
                self._log(E.PLAYER_INTERACTION, "decline_request", object_id="rania", novel=False, outcome="declined")
            else:
                self._log(E.PLAYER_INTERACTION, "defer_request", object_id="rania", novel=False, outcome="deferred")

        self.open_choice(f"l6_rania_s{self.stage}_{self.ap}", CAT_HELP, "Nurse Rania",
                         "We have twelve patients and the water is rising. Can you get us out?", opts, chosen, speaker="Rania",
                         context={"npc": "rania", "stage_no": self.stage})

    def _npc_dawood(self) -> None:
        if "school" in self.evacuated:
            self.open_message("Principal Dawood", "The children are safe at the hill shelter.", speaker="Dawood"); return
        opts = [
            {"key": "dawood_bags", "label": "Send 3 sandbags to the school (1 AP, uses your sandbags)", "kind": KIND_PROSOCIAL},
            {"key": "dawood_evac", "label": "Evacuate the school with a vehicle (1 AP)", "kind": KIND_PROSOCIAL},
            {"key": "dawood_parents", "label": "Ask parents to collect the children (free, only part will be collected)", "kind": KIND_NEUTRAL},
            {"key": "dawood_no", "label": "Say you cannot help the school right now", "kind": KIND_SELFISH},
        ]

        def chosen(o):
            k = o["key"]
            self._talk_turn("dawood")
            if k == "dawood_bags":
                if self.res["sandbags"] < 3:
                    self._invalid("dawood_bags", "no_sand")
                elif self.spend_ap(1, "dawood_bags"):
                    self.res["sandbags"] -= 3
                    self.assigned["school"]["sand"] += 3
                    self.assigned["school"]["pts"] += 3
                    self._log(E.HELP_ACTION, "help_school", npc="dawood", outcome="helped", ap_cost=1)
                    self._log(E.RESOURCE_ALLOCATED, "dispatch", site="school", package="sand3_request", resource="sand", amount=3,
                              pts_added=3, pts_after=self.assigned["school"]["pts"], known_risk=self.believed_risk("school"),
                              buffer=max(0, self.assigned["school"]["pts"] - int(self.believed_risk("school"))), ap_cost=1, via="npc_request")
            elif k == "dawood_evac":
                self._npc_evac("school", "dawood", "help_school")
            elif k == "dawood_parents":
                self.partial["school"] = 0.6
                self._log(E.HELP_ACTION, "help_school_light", npc="dawood", outcome="partial", ap_cost=0)
            else:
                self._log(E.PLAYER_INTERACTION, "decline_request", object_id="dawood", novel=False, outcome="declined")

        self.open_choice(f"l6_dawood_s{self.stage}_{self.ap}", CAT_HELP, "Principal Dawood",
                         "Forty children are at school and the path to the hill is getting wet. What can you do for us?",
                         opts, chosen, speaker="Dawood", context={"npc": "dawood", "stage_no": self.stage})

    def _npc_sana(self) -> None:
        if "farms" in self.evacuated:
            self.open_message("Farmer Sana", "Everyone and the animals are on high ground. Thank you.", speaker="Sana"); return
        opts = [
            {"key": "sana_move", "label": "Send a vehicle and 2 volunteers to move families and livestock (1 AP)", "kind": KIND_PROSOCIAL},
            {"key": "sana_advice", "label": "Tell them to lead the animals to high ground themselves (free)", "kind": KIND_NEUTRAL},
            {"key": "sana_no", "label": "Explain the farms are the lowest priority", "kind": KIND_SELFISH},
        ]

        def chosen(o):
            k = o["key"]
            self._talk_turn("sana")
            if k == "sana_move":
                self._npc_evac("farms", "sana", "help_farms")
            elif k == "sana_advice":
                self.partial["farms"] = 0.5
                self._log(E.HELP_ACTION, "help_farms_light", npc="sana", outcome="partial", ap_cost=0)
            else:
                self._log(E.PLAYER_INTERACTION, "decline_request", object_id="sana", novel=False, outcome="declined")

        self.open_choice(f"l6_sana_s{self.stage}_{self.ap}", CAT_HELP, "Farmer Sana",
                         "The low fields flood first. We have six families and a lot of animals down here.",
                         opts, chosen, speaker="Sana", context={"npc": "sana", "stage_no": self.stage})

    def _npc_imran(self) -> None:
        opts = [
            {"key": "imran_comply", "label": "Agree: the market comes first this stage", "kind": KIND_PROSOCIAL},
            {"key": "imran_compromise", "label": "Propose a compromise: the market gets at least 2 protection points", "kind": KIND_PROSOCIAL},
            {"key": "imran_refuse", "label": "Politely explain that people's safety must come first", "kind": KIND_NEUTRAL},
            {"key": "imran_assert", "label": "Tell him you make the decisions and end the discussion", "kind": KIND_SELFISH},
            {"key": "imran_input", "label": "Suggest bringing the clinic and school into the discussion (1 AP)", "kind": KIND_CHECK},
        ]

        def chosen(o):
            k = o["key"]
            self._talk_turn("imran")
            mode = {"imran_comply": "comply", "imran_compromise": "compromise", "imran_refuse": "refuse_polite",
                    "imran_assert": "assert", "imran_input": "seek_input"}[k]
            if k == "imran_input" and not self.spend_ap(1, "imran_input"):
                return
            self._log(E.NEGOTIATION, mode, npc="imran", stage_no=self.stage, outcome=mode)
            if k == "imran_comply":
                self.council_commit = int(self.risk("market"))
                self.council_support += 2
            elif k == "imran_compromise":
                self.council_commit = 2
                self.council_support += 1
            elif k == "imran_input":
                self._log(E.INFO_SEEKING, "seek_input", source="npc_imran", redundant=False, first_time=True)
                self.new_info_pending += 1
            if mode in ("comply", "compromise"):
                self._log(E.COOPERATION_ACTION, "council_agreement", npc="imran", mode=mode)
            elif mode == "assert":
                self._log(E.COMPETITION_ACTION, "override_council", npc="imran", mode=mode)
            if k in ("imran_comply", "imran_compromise"):
                self.say("Imran promises extra sandbags next stage in return.", 2800)
            self.requests["council"] = False

        self.open_choice(f"l6_imran_s{self.stage}_{self.ap}", CAT_COOPERATION, "Councillor Imran",
                         "The Old Market is the town's livelihood. I expect it to be protected before anything else.",
                         opts, chosen, speaker="Imran", context={"npc": "imran", "stage_no": self.stage})

    def _npc_aziz(self) -> None:
        opts = []
        if self.stage == 1 and not self.aid_requested:
            opts.append({"key": "aziz_aid", "label": "Ask the neighbour town for sandbags (1 AP, they arrive next stage)", "kind": KIND_SOCIAL})
        if self.stage >= 2 and not self.aziz_asked:
            self.aziz_asked = True
            self._log(E.ENV_EVENT, action="neighbour_request", actor="engine", stage=f"stage{self.stage}")
        if self.aziz_asked:
            opts += [
                {"key": "aziz_vehicle", "label": "Lend them one vehicle for stage 3 (they need it for their own evacuation)", "kind": KIND_PROSOCIAL},
                {"key": "aziz_crew", "label": "Lend them two volunteers for stage 3 instead", "kind": KIND_PROSOCIAL},
                {"key": "aziz_no", "label": "Explain you need everything you have", "kind": KIND_SELFISH},
            ]
        opts.append({"key": "aziz_bye", "label": "End the call", "kind": KIND_EXIT})
        body = ("Mayor Aziz of the neighbouring town. " +
                ("They ask for a vehicle for stage 3: their own road is cut off." if self.aziz_asked else "They are watching the same river."))

        def chosen(o):
            k = o["key"]
            if k == "aziz_bye":
                return
            self._talk_turn("aziz")
            if k == "aziz_aid":
                if self.spend_ap(1, "aziz_aid"):
                    self.aid_requested = True
                    self.aid_incoming = 4
                    self._log(E.COOPERATION_ACTION, "request_aid", npc="aziz", mode="ask_help", resource="sandbags", amount=4, ap_cost=1)
                    self.say("Aziz promises 4 sandbags next stage.", 2400)
            elif k == "aziz_vehicle":
                self.lent_vehicle = True
                self.requests["hotline"] = False
                self._log(E.HELP_ACTION, "lend_vehicle", npc="aziz", outcome="helped", cost="vehicle")
            elif k == "aziz_crew":
                self.lent_volunteers = 2
                self.requests["hotline"] = False
                self._log(E.HELP_ACTION, "lend_crew", npc="aziz", outcome="helped", cost="2 volunteers")
            elif k == "aziz_no":
                self.requests["hotline"] = False
                self._log(E.PLAYER_INTERACTION, "decline_request", object_id="aziz", novel=False, outcome="declined")

        self.open_choice(f"l6_aziz_s{self.stage}_{self.ap}", CAT_HELP if self.aziz_asked else CAT_SOCIAL, "Neighbour Town", body, opts,
                         chosen, speaker="Aziz", context={"npc": "aziz", "stage_no": self.stage})

    # ---------------------------------------------------------- stage end
    def end_stage(self) -> None:
        stage = self.stage
        self._log(E.PLAYER_INTERACTION, "end_stage", object_id="board", novel=False, ap_left=self.ap, stage_no=stage,
                  idle_sandbags=self.res["sandbags"], idle_volunteers=max(0, self.vol_free()))
        held: dict[str, bool] = {}
        lines = [f"Stage {stage} report"]
        flooded = []
        for k, s in SITES.items():
            need = self.risk(k)
            ok = self.pts(k) >= need
            held[k] = ok
            shortfall = need - self.pts(k)
            avoidable = (not ok) and (self.res["sandbags"] + max(0, self.vol_free()) >= shortfall)
            status = "HELD" if ok else "FLOODED"
            extra = ""
            if k in self.evacuated:
                extra = " - people evacuated"
            elif not ok:
                extra = " - people in danger"
            lines.append(f"{s['label']}: {status} ({self.pts(k)}/{need}){extra}" + (" - resources were still unassigned" if avoidable else ""))
            if not ok:
                flooded.append(k)
                self.damaged.add(k)
            self._log(E.PLAYER_INTERACTION, "site_result", object_id=k, novel=False, held=ok, pts=self.pts(k), need=need,
                      evacuated=k in self.evacuated, avoidable=avoidable, stage_no=stage, outcome="held" if ok else "flooded")
        self.held_log[stage] = held
        if self.council_commit is not None:
            met = self.pts("market") >= min(self.council_commit, self.risk("market"))
            lines.append("Councillor Imran: " + ("market commitment kept" if met else "market commitment NOT met"))
            self._log(E.PLAYER_INTERACTION, "commitment_check", object_id="imran", novel=False, kept=met, outcome="kept" if met else "broken")
            self.council_commit = None
        self.stage_flooded = bool(flooded)
        self.log.log(E.ENV_EVENT, action="stage_end", actor="engine", stage=f"stage{stage}", flooded=flooded, ap_left=self.ap)
        if stage >= STAGES:
            self._final_review(held, lines)
            return
        # carry-forward: sandbags are consumed, volunteers and vehicles return
        for a in self.assigned.values():
            a.update({"sand": 0, "vol": 0, "pts": 0, "improv": False})
        self.vehicles_used = 0
        self.evac_vol_used = 0
        self.improv_used = False
        self.stage += 1
        self.ap = AP_PER_STAGE
        self.res["sandbags"] += RESUPPLY[self.stage] + self.aid_incoming + (self.council_support if self.stage == 2 else 0)
        if self.aid_incoming:
            lines.append(f"The neighbour town's {self.aid_incoming} sandbags arrive.")
        if self.council_support and self.stage == 2:
            lines.append(f"The council releases {self.council_support} extra sandbags.")
        self.aid_incoming = 0
        self.council_support = 0
        self.res["volunteers"] -= self.bonus_vol
        self.bonus_vol = 0
        if self.stage == 2:
            lines.append("DAM RELEASE: every site's risk rose by 2" + (" (you expected this)." if "dam" in self.known else " (unexpected!)."))
            lines.append(f"The supply truck is delayed: only {RESUPPLY[2]} sandbags arrive.")
            self.log.log(E.ENV_EVENT, action="dam_release", actor="engine", stage="stage2", warned="dam" in self.known)
        if self.stage == 3:
            self.vehicles_cap = 1
            lines.append("LANDSLIDE: only one vehicle can reach the town now" + (" (you expected this)." if "road" in self.known else " (unexpected!)."))
            lines.append("The river begins to fall: risks are lower, but damaged sites are weaker.")
            self.log.log(E.ENV_EVENT, action="road_closure", actor="engine", stage="stage3", warned="road" in self.known)
        self.new_info_pending += 1
        for k in self.requests:
            if k != "hotline":
                self.requests[k] = True
        self.after_report = True
        self.after_report_setback = self.stage_flooded
        self.open_message(f"Stage {stage} complete", "", lines=lines)
        self.modal.on_close = self._after_report_closed

    def _after_report_closed(self) -> None:
        self.after_report_ms = self.session.clock.ms
        self.last_action_ms = self.after_report_ms
        self._stage_start_prompt()

    def _final_review(self, held: dict, lines: list[str]) -> None:
        total_people = sum(s["people"] for s in SITES.values())
        safe = 0.0
        for k, s in SITES.items():
            if k in self.evacuated or all(self.held_log[st].get(k, False) for st in self.held_log):
                safe += s["people"]
            else:
                safe += s["people"] * self.partial.get(k, 0.0)
        holds = sum(1 for st in self.held_log.values() for v in st.values() if v)
        pct = round(100 * safe / total_people)
        tier = "a strong response" if pct >= 85 else ("a steady response" if pct >= 60 else "a difficult response")
        lines += ["", f"Overall: {pct}% of people safe, {holds} of {STAGES * len(SITES)} site-stages held - {tier}.",
                  "This review describes the town's outcome only. It is not a judgement of you."]
        self.final_review = lines
        self.open_message("Final review", "", lines=lines)
        self.modal.on_close = lambda: self.complete(people_safe_pct=pct, sites_held=holds, info_sources=len(self.known),
                                                    npcs_met=len(self.met), ap_unused=self.ap, outcome_tier=tier)

    # ---------------------------------------------------------------- draw
    def hud_extra(self):
        return [("stage", f"{self.stage}/{STAGES}"), ("AP", str(self.ap)), ("sandbags", str(self.res["sandbags"])),
                ("volunteers", str(max(0, self.vol_free()))), ("vehicles", str(max(0, self.veh_free())))]

    def draw_world(self, world: pygame.Surface) -> None:
        world.blit(W.vertical_gradient((S.WORLD_W, S.WORLD_H), (40, 54, 80), (24, 32, 50)), (0, 0))
        for x in range(0, S.WORLD_W, 55):
            pygame.draw.line(world, (46, 62, 90), (x, 0), (x, S.WORLD_H))
        for y in range(0, S.WORLD_H, 55):
            pygame.draw.line(world, (46, 62, 90), (0, y), (S.WORLD_W, y))
        W.text(world, "OPERATIONS ROOM", (S.WORLD_W // 2, 30), 34, S.TEXT_DIM, anchor="center", bold=True)
        W.text(world, "People you can talk to", (S.WORLD_W // 2, 396), 24, S.TEXT_DIM, anchor="center")
        for k, r in STATIONS.items():
            draw_station(world, r, LABEL[k], COLOR[k], 22)
            if k in self.requests and self.requests[k] and (k != "hotline" or self.stage >= 1):
                pygame.draw.circle(world, S.WARN, (r.right - 8, r.y + 8), 11)
                W.text(world, "!", (r.right - 8, r.y + 8), 22, S.BG, anchor="center", bold=True)
        # water level indicator
        lvl = max(self.risk(s) for s in SITES)
        W.bar(world, (300, 540, 500, 18), lvl / 6.0, S.ACCENT, radius=6)
        W.text(world, f"River risk this stage: up to {lvl}", (550, 566), 22, S.TEXT_DIM, anchor="center")

    def draw_overlay(self, world: pygame.Surface) -> None:
        st = nearest_station(self.player, STATIONS)
        if st and self.modal is None:
            r = STATIONS[st]
            W.key_hint(world, "E", (r.centerx - 8, r.y - 30), 24)
