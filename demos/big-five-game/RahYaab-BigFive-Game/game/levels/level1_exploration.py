"""Level 1 - The Whispering Valley (exploration / novelty).

A signposted road leads straight to the exit gate. Around it: six optional areas, eight unusual
objects, a rickety-bridge shortcut and a mystery chest. Nothing forces the player to explore.
Evidence recorded: optional areas entered, map cells covered, novel interactions, time spent
off the road, route strategy labels, risk / novelty choices.
"""
from __future__ import annotations

import math
import random

import pygame

from analytics.event_schema import (CAT_REWARD, CAT_RISK, KIND_NOVEL, KIND_RISKY, KIND_SAFE, EventType as E)
from game import settings as S
from game.input_state import InputState
from game.levels.base import Level
from game.ui import widgets as W

ROAD = [(40, 300), (300, 300), (420, 380), (780, 380), (900, 330), (1040, 300)]
EXIT_RECT = pygame.Rect(1030, 240, 60, 120)
CHEST_POS = (930, 410)
BRIDGE_TRIGGER = pygame.Rect(590, 345, 50, 70)
BRIDGE_DECK = pygame.Rect(640, 360, 60, 40)
RAVINE = [pygame.Rect(640, 200, 60, 160), pygame.Rect(640, 400, 60, 160)]   # gap at y>560 = the safe detour
LAKE = pygame.Rect(460, 170, 160, 80)
ROCKS = [pygame.Rect(520, 296, 44, 36), pygame.Rect(330, 190, 40, 40), pygame.Rect(880, 250, 46, 38),
         pygame.Rect(740, 480, 50, 40)]

ZONES = [
    {"id": "mushroom_grove", "name": "Mushroom Grove", "rect": pygame.Rect(120, 70, 220, 150), "color": (167, 139, 250)},
    {"id": "crystal_cave", "name": "Crystal Cave", "rect": pygame.Rect(400, 40, 200, 130), "color": (96, 165, 250)},
    {"id": "old_ruins", "name": "Old Ruins", "rect": pygame.Rect(760, 60, 240, 150), "color": (251, 191, 36)},
    {"id": "hidden_pond", "name": "Hidden Pond", "rect": pygame.Rect(140, 440, 220, 130), "color": (52, 211, 153)},
    {"id": "windmill_hill", "name": "Windmill Hill", "rect": pygame.Rect(400, 470, 200, 110), "color": (244, 114, 182)},
    {"id": "whispering_cliffs", "name": "Whispering Cliffs", "rect": pygame.Rect(780, 440, 250, 130), "color": (248, 113, 113)},
]

OBJECTS = [
    {"id": "glowing_mushroom", "name": "Glowing mushroom", "pos": (230, 150),
     "msg": "The mushroom hums softly and releases a cloud of sparkling spores.", "payout": None},
    {"id": "crystal_resonator", "name": "Crystal resonator", "pos": (510, 100),
     "msg": "You tap the crystal. A pure note echoes through the cave.", "payout": None},
    {"id": "ancient_lever", "name": "Ancient lever", "pos": (820, 120),
     "msg": "You pull the lever. A stone slab slides open: a hidden stash!", "payout": 5},
    {"id": "stone_tablet", "name": "Stone tablet", "pos": (940, 150),
     "msg": "'Those who wander find more than those who hurry.' - the tablet reads.", "payout": None},
    {"id": "frog_statue", "name": "Frog statue", "pos": (250, 520),
     "msg": "You press the frog. It spits out a shiny coin.", "payout": 2},
    {"id": "windmill_crank", "name": "Windmill crank", "pos": (500, 520),
     "msg": "You turn the crank. The old windmill creaks into motion.", "payout": None},
    {"id": "cliff_echo", "name": "Echo stone", "pos": (900, 500),
     "msg": "You shout into the canyon. The cliffs whisper your words back.", "payout": None},
    {"id": "odd_signpost", "name": "Odd signpost", "pos": (350, 352),
     "msg": "A crooked sign points away from the road: 'Beyond the trees, curious things wait.'", "payout": None},
]
COINS = [(150, 300), (260, 300), (480, 372), (560, 380), (790, 380), (900, 330)]


class ExplorationLevel(Level):
    level_id = 1
    name = "The Whispering Valley"
    scenario = "exploration"
    objective = "Reach the Valley Gate. The road is marked - the rest of the valley is up to you."
    task_name = "reach_valley_gate"
    start_pos = (60, 300)

    def build(self) -> None:
        self.current_zone = None
        self.zone_enter_ms = 0.0
        self.zone_visits: dict[str, int] = {}
        self.visited_optional: set[str] = set()
        self.interacted: dict[str, int] = {}
        self.coin_taken: set[int] = set()
        self.coins = 0
        self.bridge_resolved = False
        self.bridge_open = True
        self.chest_used = False
        self.walkable_bridge_block = BRIDGE_DECK.copy()
        self._decor = self._make_decor()
        self.session.strategies.adopt("direct_route", "level1_start", level_id=1)
        self.session.coins = 0

    def level_start_metadata(self) -> dict:
        return {"optional_areas_total": len(ZONES), "grid_cells_total": 77, "novel_objects_total": len(OBJECTS)}

    # ------------------------------------------------------------------ geometry
    def solids(self):
        s = list(RAVINE) + [LAKE] + list(ROCKS)
        if not self.bridge_open:
            s.append(self.walkable_bridge_block)
        return s

    def _make_decor(self):
        r = random.Random(11)
        trees = []
        blockers = [z["rect"].inflate(10, 10) for z in ZONES] + [pygame.Rect(0, 270, 1100, 140)]
        for _ in range(70):
            x, y = r.randint(10, 1090), r.randint(10, 590)
            if any(b.collidepoint(x, y) for b in blockers):
                continue
            trees.append((x, y, r.randint(14, 24), r.choice([(34, 120, 74), (40, 138, 84), (28, 104, 66)])))
        return trees

    # -------------------------------------------------------------------- logic
    def zone_at(self, pos):
        for z in ZONES:
            if z["rect"].collidepoint(pos):
                return z
        return None

    def on_update(self, dt: float, inp: InputState) -> None:
        now = self.session.clock.ms
        z = self.zone_at(self.player.pos)
        zid = z["id"] if z else None
        if zid != self.current_zone:
            if self.current_zone is not None:
                self.log.log(E.EXPLORATION, action="leave_area", zone_id=self.current_zone,
                             dwell_ms=round(now - self.zone_enter_ms), optional=True)
            if z is not None:
                self.zone_visits[zid] = self.zone_visits.get(zid, 0) + 1
                first = zid not in self.visited_optional
                self.visited_optional.add(zid)
                self.zone_enter_ms = now
                self.log.log(E.EXPLORATION, action="enter_optional_area", zone_id=zid, zone_name=z["name"],
                             visit_number=self.zone_visits[zid], first_visit=first, optional=True)
                if first:
                    self.say(f"You discovered: {z['name']}!")
                    self.session.strategies.adopt("explore_optional", "entered_optional_area", level_id=1, zone_id=zid)
            self.current_zone = zid

        for i, c in enumerate(COINS):
            if i not in self.coin_taken and self.dist_to(c) < 22:
                self.coin_taken.add(i)
                self._add_coins(1, "road_coin", novel=False)

        if not self.bridge_resolved and BRIDGE_TRIGGER.collidepoint(self.player.pos):
            self.bridge_resolved = True
            self._bridge_dialog()

        if EXIT_RECT.collidepoint(self.player.pos):
            self.complete(coins=self.coins, optional_areas_visited=len(self.visited_optional),
                          novel_objects=sum(1 for v in self.interacted.values() if v))

    def on_end(self) -> None:
        if self.current_zone is not None:
            self.log.log(E.EXPLORATION, action="leave_area", zone_id=self.current_zone,
                         dwell_ms=round(self.session.clock.ms - self.zone_enter_ms), optional=True)
            self.current_zone = None
        self.session.coins += self.coins

    def _add_coins(self, n: int, item: str, novel: bool) -> None:
        self.coins = max(0, self.coins + n)
        if n > 0:
            self.log.log(E.ITEM_COLLECTED, action="collect", item=item, value=n, novel=novel)

    # ---------------------------------------------------------------- interaction
    def _nearest(self):
        best, best_d = None, 52
        cands = [("object", o, o["pos"]) for o in OBJECTS]
        if not self.chest_used:
            cands.append(("chest", None, CHEST_POS))
        for kind, o, pos in cands:
            d = self.dist_to(pos)
            if d < best_d:
                best, best_d = (kind, o), d
        return best

    def on_interact(self) -> None:
        hit = self._nearest()
        if not hit:
            return
        kind, o = hit
        if kind == "chest":
            self._chest_dialog()
            return
        times = self.interacted.get(o["id"], 0)
        self.interacted[o["id"]] = times + 1
        novel = times == 0
        self.log.log(E.PLAYER_INTERACTION, action="inspect", object_id=o["id"], object_name=o["name"], novel=novel,
                     times=times + 1, zone_id=self.current_zone)
        self.say(o["msg"], 3600)
        if novel and o["payout"]:
            self._add_coins(o["payout"], o["id"], novel=True)

    def _bridge_dialog(self) -> None:
        opts = [
            {"key": "cross_bridge", "label": "Cross the rickety bridge (shortcut, planks look rotten)", "kind": KIND_RISKY, "risk_level": 0.6},
            {"key": "walk_around", "label": "Walk around the ravine (longer but safe)", "kind": KIND_SAFE, "risk_level": 0.05},
        ]

        def chosen(o):
            if o["key"] == "cross_bridge":
                held = self.rng.random() < 0.55
                self.log.log(E.RISK_ACTION, action="cross_rickety_bridge", risk_level=0.6, success=held, p_success=0.55)
                self.session.strategies.adopt("risk_shortcut", "bridge", level_id=1)
                if held:
                    self.say("The bridge holds! Shortcut bonus: +3 coins.")
                    self._add_coins(3, "shortcut_bonus", novel=False)
                else:
                    self.log.log(E.FAILURE, action="bridge_fall", freeze_ms=2500, coins_lost=min(5, self.coins))
                    self.player.freeze(2500)
                    self._add_coins(-5, "bridge_fall", novel=False)
                    self.bridge_open = False
                    self.say("The planks snap! You tumble down and lose 5 coins. Take the long way.", 3600)
            else:
                self.log.log(E.PLAYER_INTERACTION, action="avoid_bridge", object_id="bridge", novel=False)
                self.bridge_open = False
                self.say("You decide to walk around the ravine.")

        self.open_choice("l1_bridge", CAT_RISK, "The Rickety Bridge",
                         "A rope bridge crosses the ravine. The planks creak in the wind. "
                         "The long way around is slower but safe.", opts, chosen, context={"level": 1})

    def _chest_dialog(self) -> None:
        opts = [
            {"key": "take_coins", "label": "Take the 10 coins (guaranteed)", "kind": KIND_SAFE, "risk_level": 0.0},
            {"key": "open_mystery", "label": "Open the mystery box (could be much more... or less)", "kind": KIND_NOVEL, "risk_level": 0.5},
        ]

        def chosen(o):
            self.chest_used = True
            if o["key"] == "take_coins":
                gain = 10
            else:
                gain = self.rng.choice([0, 5, 15, 30])
            self.log.log(E.REWARD_SELECTED, action=o["key"], chosen_kind=o["kind"], reward_value=gain, risk_level=o.get("risk_level"))
            self._add_coins(gain, "chest_reward", novel=o["key"] == "open_mystery")
            self.say(f"You received {gain} coins." if gain else "The mystery box was empty!")

        self.open_choice("l1_chest", CAT_REWARD, "Treasure Chest",
                         "A chest sits near the valley gate. A note says: 'Choose your reward.'", opts, chosen)

    # --------------------------------------------------------------------- draw
    def hud_extra(self):
        return [("coins", str(self.coins)), ("areas found", f"{len(self.visited_optional)}/{len(ZONES)}")]

    def draw_world(self, world: pygame.Surface) -> None:
        world.blit(W.vertical_gradient((S.WORLD_W, S.WORLD_H), (88, 160, 96), (62, 128, 80)), (0, 0))
        pygame.draw.lines(world, (176, 140, 92), False, ROAD, 46)
        pygame.draw.lines(world, (196, 162, 112), False, ROAD, 36)
        for p in ROAD:
            pygame.draw.circle(world, (176, 140, 92), p, 23)
        for z in ZONES:
            r = z["rect"]
            tint = pygame.Surface(r.size, pygame.SRCALPHA)
            pygame.draw.rect(tint, (*z["color"], 46), tint.get_rect(), border_radius=18)
            world.blit(tint, r)
            pygame.draw.rect(world, (*[min(255, c + 30) for c in z["color"]],), r, 2, border_radius=18)
            label = z["name"] if z["id"] in self.visited_optional else "?"
            W.text(world, label, (r.centerx, r.y + 12), 22, (240, 245, 255), anchor="midtop")
        for x, y, rad, col in self._decor:
            pygame.draw.circle(world, (20, 70, 44), (x + 3, y + 5), rad)
            pygame.draw.circle(world, col, (x, y), rad)
        pygame.draw.rect(world, (58, 110, 190), LAKE, border_radius=26)
        pygame.draw.rect(world, (110, 160, 230), LAKE.inflate(-18, -18), 2, border_radius=22)
        for rv in RAVINE:
            pygame.draw.rect(world, (30, 26, 34), rv)
            pygame.draw.rect(world, (80, 66, 70), rv, 3)
        if self.bridge_open:
            pygame.draw.rect(world, (156, 110, 66), BRIDGE_DECK)
            for i in range(5):
                pygame.draw.line(world, (112, 76, 44), (BRIDGE_DECK.x + 6 + i * 12, BRIDGE_DECK.y),
                                 (BRIDGE_DECK.x + 6 + i * 12, BRIDGE_DECK.bottom), 3)
        else:
            pygame.draw.rect(world, (30, 26, 34), BRIDGE_DECK)
        for r in ROCKS:
            pygame.draw.ellipse(world, (110, 112, 124), r)
            pygame.draw.ellipse(world, (150, 152, 164), r.inflate(-14, -14))
        for i, c in enumerate(COINS):
            if i not in self.coin_taken:
                pygame.draw.circle(world, S.GOLD, c, 9)
                pygame.draw.circle(world, (255, 236, 150), c, 5)
        for o in OBJECTS:
            pulse = 3 + int(2 * math.sin(self.elapsed_ms / 250 + o["pos"][0]))
            pygame.draw.circle(world, (200, 170, 255), o["pos"], 12 + pulse, 2)
            pygame.draw.circle(world, (235, 225, 255), o["pos"], 8)
        if not self.chest_used:
            r = pygame.Rect(0, 0, 38, 28)
            r.center = CHEST_POS
            pygame.draw.rect(world, (140, 90, 40), r, border_radius=4)
            pygame.draw.rect(world, S.GOLD, r, 3, border_radius=4)
            pygame.draw.rect(world, S.GOLD, (r.centerx - 4, r.y + 8, 8, 10))
        pygame.draw.rect(world, (70, 70, 96), EXIT_RECT, border_radius=8)
        pygame.draw.rect(world, S.ACCENT, EXIT_RECT, 3, border_radius=8)
        W.text(world, "VALLEY", EXIT_RECT.center, 20, S.TEXT, anchor="midbottom")
        W.text(world, "GATE", EXIT_RECT.center, 20, S.TEXT, anchor="midtop")
        # start sign
        W.text(world, "Follow the road ->", (60, 262), 24, (255, 250, 230))

    def draw_overlay(self, world: pygame.Surface) -> None:
        hit = self._nearest()
        if hit and self.modal is None:
            kind, o = hit
            pos = CHEST_POS if kind == "chest" else o["pos"]
            W.key_hint(world, "E", (pos[0] - 8, pos[1] - 44), 24)
