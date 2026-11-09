"""Level 3 - Harbor Village (social interaction).

Six villagers. Three walk up and ask the player for something (and can be ignored); three wait
quietly in side alleys and only talk if the *player* starts the conversation (E). Encounters
offer helping, sharing, cooperating, negotiating, competing, chatting - or walking away.
Nothing is required: the player can reach the ferry without speaking to anyone.
"""
from __future__ import annotations

import math

import pygame

from analytics.event_schema import (CAT_COOPERATION, CAT_HELP, CAT_REWARD, CAT_SHARE, CAT_SOCIAL, KIND_EXIT, KIND_IGNORE,
                                    KIND_NOVEL, KIND_PROSOCIAL, KIND_SAFE, KIND_SELFISH, KIND_SOCIAL, EventType as E)
from game import settings as S
from game.input_state import InputState
from game.levels.base import Level
from game.ui import widgets as W

FERRY = pygame.Rect(1030, 240, 60, 120)
HOUSES = [pygame.Rect(110, 90, 160, 100), pygame.Rect(640, 80, 170, 100), pygame.Rect(880, 90, 100, 100),
          pygame.Rect(400, 470, 150, 100), pygame.Rect(640, 450, 110, 100), pygame.Rect(900, 450, 90, 110)]
MAX_FOLLOWUPS = 3
START_COINS = 12

NPCS = [
    {"id": "marta", "name": "Baker Marta", "pos": (300, 245), "mode": "npc", "cat": CAT_HELP, "color": (244, 164, 96),
     "text": "Oh, thank goodness! My bread cart is stuck in the mud and the loaves will spoil. Could you help me push it out?",
     "options": [("Of course - let me push!", KIND_PROSOCIAL, "help"),
                 ("Sorry, I'm in a hurry.", KIND_IGNORE, "ignore")],
     "chat": ["Marta smiles: 'I bake for the whole harbor, you know.'", "'The secret is rye flour and patience.'", "'Come back anytime for warm bread!'"]},
    {"id": "lena", "name": "Captain Lena", "pos": (620, 365), "mode": "npc", "cat": CAT_COOPERATION, "color": (96, 165, 250),
     "text": "Two heavy crates must reach the dock. The harbor master pays 20 coins if we carry them together, or a 14-coin bonus to whoever is faster.",
     "options": [("Let's carry them together.", KIND_PROSOCIAL, "cooperate"),
                 ("How about we split the load by strength?", KIND_PROSOCIAL, "negotiate"),
                 ("I'll race you for the bonus!", KIND_SELFISH, "compete"),
                 ("Not interested, thanks.", KIND_IGNORE, "ignore")],
     "chat": ["Lena grins: 'Twenty years at sea and still no sea legs on land.'", "'The ferry runs on the hour, don't miss it.'", "'Keep your eyes open on the road ahead.'"]},
    {"id": "bashir", "name": "Old Sailor Bashir", "pos": (860, 252), "mode": "npc", "cat": CAT_SHARE, "color": (160, 140, 200),
     "text": "Excuse me, traveller. I have not eaten since dawn. Could you spare a few coins for some soup?",
     "options": [("Give him half of your coins.", KIND_PROSOCIAL, "share_half"),
                 ("Give him a few coins.", KIND_PROSOCIAL, "share_few"),
                 ("Keep your coins.", KIND_SELFISH, "keep"),
                 ("Walk on without answering.", KIND_IGNORE, "ignore")],
     "chat": ["Bashir nods slowly: 'The sea gives and the sea takes.'", "'I once sailed past the edge of the map.'", "'Kindness comes back around, they say.'"]},
    {"id": "omar", "name": "Fisherman Omar", "pos": (230, 505), "mode": "player", "cat": CAT_SHARE, "color": (120, 200, 160),
     "text": "Omar is mending torn nets with tired hands. He hasn't noticed you. New twine would cost about 4 coins.",
     "options": [("Offer to pay for new twine (4 coins).", KIND_PROSOCIAL, "share_few"),
                 ("Just greet him and go.", KIND_EXIT, "leave")],
     "chat": ["Omar looks up: 'Tide's been poor this week.'", "'My father taught me these knots.'", "'Good luck on your journey.'"]},
    {"id": "zayn", "name": "Zayn the Boy", "pos": (500, 105), "mode": "player", "cat": CAT_HELP, "color": (250, 204, 21),
     "text": "A boy stares sadly at a roof where his kite is stuck. He doesn't ask for anything.",
     "options": [("Climb up and fetch the kite.", KIND_PROSOCIAL, "help"),
                 ("Wave hello and go.", KIND_EXIT, "leave")],
     "chat": ["Zayn: 'It's a dragon kite. I made it myself!'", "'I want to fly it over the harbor.'", "'You're nice. Most people are in a rush.'"]},
    {"id": "rina", "name": "Merchant Rina", "pos": (845, 525), "mode": "player", "cat": CAT_COOPERATION, "color": (244, 114, 182),
     "text": "Rina runs her market stall alone and the lunch rush is about to start. Customers are already queuing.",
     "options": [("Offer to run the stall together.", KIND_PROSOCIAL, "cooperate"),
                 ("Propose: you help, she shares the profit.", KIND_PROSOCIAL, "negotiate"),
                 ("Haggle hard for her best prices.", KIND_SELFISH, "compete"),
                 ("Just browse and leave.", KIND_EXIT, "leave")],
     "chat": ["Rina laughs: 'Business is a game of patience.'", "'I started with a single basket of figs.'", "'Come back when the sun sets - best deals.'"]},
]


class SocialLevel(Level):
    level_id = 3
    name = "Harbor Village"
    scenario = "social"
    objective = "Take your letter to the Ferry Dock. Villagers may talk to you - or you can talk to them."
    task_name = "deliver_letter_to_ferry"
    start_pos = (60, 300)

    def build(self) -> None:
        self.coins = START_COINS
        self.trust = 0
        self.met: set[str] = set()
        self.merchant_done = False
        self.engaged: set[str] = set()

    def level_start_metadata(self) -> dict:
        idle = sum(1 for n in NPCS if n["mode"] == "player")
        return {"npc_encounters_total": len(NPCS), "idle_encounters_total": idle, "start_coins": START_COINS}

    def solids(self):
        return list(HOUSES)

    # ------------------------------------------------------------------- logic
    def _npc_by_id(self, nid):
        return next(n for n in NPCS if n["id"] == nid)

    def on_update(self, dt: float, inp: InputState) -> None:
        for n in NPCS:
            if n["mode"] == "npc" and n["id"] not in self.met and self.dist_to(n["pos"]) < 125:
                self._start_encounter(n, "initiated_by_npc")
                return
        if FERRY.collidepoint(self.player.pos) and self.modal is None:
            self._merchant_or_finish()

    def on_interact(self) -> None:
        for n in NPCS:
            if n["mode"] == "player" and n["id"] not in self.met and self.dist_to(n["pos"]) < 70:
                self._start_encounter(n, "initiated_by_player")
                return

    def _start_encounter(self, n: dict, how: str) -> None:
        self.met.add(n["id"])
        self.log.log(E.NPC_INTERACTION, action=how, encounter_id=n["id"], npc=n["name"], npc_mode=n["mode"],
                     distance=round(self.dist_to(n["pos"])))
        opts = []
        for i, (label, kind, effect) in enumerate(n["options"]):
            opts.append({"key": f"{n['id']}_{effect}", "label": label, "kind": kind, "effect": effect,
                         "risk_level": 0.0})

        def chosen(o):
            self._apply_effect(n, o)

        self.open_choice(f"l3_{n['id']}", n["cat"], n["name"], n["text"], opts, chosen,
                         context={"encounter_id": n["id"], "npc_mode": n["mode"], "initiated": how}, speaker="Villager")

    def _apply_effect(self, n: dict, o: dict) -> None:
        eff, nid = o["effect"], n["id"]
        cont = True
        if eff == "ignore":
            self.log.log(E.NPC_INTERACTION, action="ignored", encounter_id=nid, npc=n["name"])
            self.say(f"You walk past {n['name']}.")
            cont = False
        elif eff == "leave":
            self.log.log(E.NPC_INTERACTION, action="left_conversation", encounter_id=nid, npc=n["name"])
            self.engaged.add(nid)
            cont = False
        else:
            self.engaged.add(nid)
            if eff == "help":
                self.log.log(E.HELP_ACTION, action="help", encounter_id=nid, npc=n["name"], cost_ms=3000)
                self.player.freeze(3000)
                self.trust += 10
                self.say(f"You help {n['name']}. (+10 trust)", 3200)
            elif eff in ("share_half", "share_few"):
                amount = max(1, self.coins // 2) if eff == "share_half" else min(4, self.coins)
                amount = min(amount, self.coins)
                self.coins -= amount
                self.trust += 8
                self.log.log(E.SHARE_ACTION, action=eff, encounter_id=nid, npc=n["name"], amount=amount)
                self.say(f"You share {amount} coins. (+8 trust)", 3200)
            elif eff == "keep":
                self.log.log(E.PLAYER_INTERACTION, action="keep_coins", object_id=nid, novel=False)
                self.say("You keep your coins.")
            elif eff in ("cooperate", "negotiate"):
                gain = 10 if eff == "cooperate" else 8
                self.coins += gain
                self.trust += 6
                self.log.log(E.COOPERATION_ACTION, action=eff, encounter_id=nid, npc=n["name"], coins_gained=gain)
                self.player.freeze(1500)
                self.say(f"You {'team up' if eff == 'cooperate' else 'strike a fair deal'}: +{gain} coins, +6 trust.", 3200)
            elif eff == "compete":
                gain = 12
                self.coins += gain
                self.trust -= 3
                self.log.log(E.COMPETITION_ACTION, action="compete", encounter_id=nid, npc=n["name"], coins_gained=gain)
                self.say(f"You win the race: +{gain} coins.", 3200)
        if cont:
            self._followup(n, 1)

    def _followup(self, n: dict, turn: int) -> None:
        if turn > MAX_FOLLOWUPS:
            return
        opts = [{"key": f"{n['id']}_chat{turn}", "label": "Keep chatting", "kind": KIND_SOCIAL, "effect": "chat"},
                {"key": f"{n['id']}_bye{turn}", "label": "Say goodbye", "kind": KIND_EXIT, "effect": "bye"}]

        def chosen(o):
            if o["effect"] == "chat":
                self.log.log(E.NPC_INTERACTION, action="dialogue_turn", encounter_id=n["id"], npc=n["name"], turn=turn)
                self.say(n["chat"][turn - 1], 3600)
                self._followup(n, turn + 1)
            else:
                self.log.log(E.NPC_INTERACTION, action="said_goodbye", encounter_id=n["id"], npc=n["name"], turns=turn - 1)

        body = (n["chat"][turn - 2] if turn > 1 else f"{n['name']} looks at you, still smiling.")
        self.open_choice(f"l3_{n['id']}_chat{turn}", CAT_SOCIAL, n["name"], body, opts, chosen,
                         context={"encounter_id": n["id"], "turn": turn}, speaker="Conversation")

    def _merchant_or_finish(self) -> None:
        if self.merchant_done:
            return
        self.merchant_done = True
        opts = [{"key": "plain_bread", "label": "Take the plain loaf of bread (a sure thing)", "kind": KIND_SAFE, "risk_level": 0.0},
                {"key": "sealed_jar", "label": "Take the odd sealed jar (no idea what's inside)", "kind": KIND_NOVEL, "risk_level": 0.4}]

        def chosen(o):
            gain = 5 if o["key"] == "plain_bread" else self.rng.choice([0, 3, 9, 15])
            self.log.log(E.REWARD_SELECTED, action=o["key"], chosen_kind=o["kind"], reward_value=gain, risk_level=o["risk_level"])
            self.coins += gain
            self.session.coins += self.coins
            self.session.trust += self.trust
            self.complete(coins=self.coins, trust=self.trust, villagers_engaged=len(self.engaged), villagers_met=len(self.met))

        self.open_choice("l3_merchant", CAT_REWARD, "Traveling Merchant",
                         "A merchant at the dock offers you a parting gift for your trip.", opts, chosen)

    # --------------------------------------------------------------------- draw
    def hud_extra(self):
        return [("trust", str(self.trust)), ("coins", str(self.coins))]

    def draw_world(self, world: pygame.Surface) -> None:
        world.blit(W.vertical_gradient((S.WORLD_W, S.WORLD_H), (226, 198, 150), (196, 168, 124)), (0, 0))
        pygame.draw.rect(world, (60, 120, 190), (0, 0, 1100, 0))
        pygame.draw.rect(world, (176, 150, 112), (0, 270, 1100, 70))
        for x in range(0, 1100, 44):
            pygame.draw.rect(world, (160, 136, 100), (x, 268, 24, 4))
        pygame.draw.rect(world, (60, 130, 200), (1000, 0, 100, 604))
        for i in range(8):
            pygame.draw.arc(world, (180, 220, 250), (1010 + (i % 2) * 30, 30 + i * 70, 50, 20), 0, math.pi, 2)
        for h in HOUSES:
            W.shadow_circle(world, (h.centerx, h.bottom - 2), h.w // 6, 45)
            pygame.draw.rect(world, (206, 180, 150), h, border_radius=6)
            pygame.draw.polygon(world, (170, 80, 70), [(h.x - 8, h.y + 18), (h.centerx, h.y - 26), (h.right + 8, h.y + 18)])
            pygame.draw.rect(world, (120, 84, 60), (h.centerx - 10, h.bottom - 34, 20, 34), border_radius=3)
        pygame.draw.rect(world, (130, 100, 70), FERRY, border_radius=6)
        pygame.draw.rect(world, S.ACCENT, FERRY, 3, border_radius=6)
        W.text(world, "FERRY", FERRY.center, 20, S.TEXT, anchor="midbottom")
        W.text(world, "DOCK", FERRY.center, 20, S.TEXT, anchor="midtop")
        for n in NPCS:
            x, y = n["pos"]
            W.shadow_circle(world, (x, y + 8), 14)
            pygame.draw.circle(world, (50, 50, 70), (x, y), 16)
            pygame.draw.circle(world, n["color"], (x, y), 14)
            pygame.draw.circle(world, (255, 224, 190), (x, y - 16), 8)
            W.text(world, n["name"], (x, y + 26), 20, (60, 40, 30), anchor="midtop")
            if n["id"] not in self.met:
                bubble = "!" if n["mode"] == "npc" else "..."
                W.text(world, bubble, (x + 18, y - 30), 30, S.DANGER if n["mode"] == "npc" else (90, 90, 120), anchor="center", bold=True)

    def draw_overlay(self, world: pygame.Surface) -> None:
        if self.modal is not None:
            return
        for n in NPCS:
            if n["mode"] == "player" and n["id"] not in self.met and self.dist_to(n["pos"]) < 70:
                W.key_hint(world, "E  talk", (n["pos"][0] - 30, n["pos"][1] - 58), 24)
