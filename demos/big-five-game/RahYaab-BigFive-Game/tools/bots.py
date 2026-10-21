"""Scripted 'persona' bots that play the REAL game headlessly.

They feed `InputState` objects into `GameApp.step()` exactly like the keyboard does, so every telemetry
event, DB write and analytics step is produced by the real game code. Bots are used to
  * test the whole pipeline automatically (tests/test_bots_end_to_end.py),
  * generate a demo dataset for the dashboard (python -m tools.generate_demo_data).

Personas are *behavioural tendencies* (how curious, risk-seeking, sociable ... the bot acts), NOT personality scores:
the Big Five estimates are still computed only from the telemetry the bot's behaviour produces.
"""
from __future__ import annotations

import math
import random
import re
from dataclasses import dataclass, replace
from typing import Callable, Generator, Optional

from game.app import GameApp
from game.input_state import InputState as I
from game.levels import level2_planning as L2
from game.levels import level4_pressure as L4
from game.levels.base import RUNNING
from game.ui.dialog import ChoiceDialog, MessageBox

FPS = 30
DT = 1.0 / FPS
Gen = Generator[I, None, None]


def clip(x, lo=0.0, hi=1.0):
    return max(lo, min(hi, x))


@dataclass
class Persona:
    name: str = "balanced"
    curiosity: float = 0.5      # visits optional areas
    novelty: float = 0.5        # tries unusual objects / unknown rewards
    risk: float = 0.5
    planning: float = 0.5       # inspects / plans before building
    perfection: float = 0.3     # resets the workshop to optimise
    sociability: float = 0.5    # responds to and chats with villagers
    initiative: float = 0.5     # starts conversations with villagers who wait
    prosocial: float = 0.5      # helps / shares
    cooperative: float = 0.5    # cooperates rather than competes
    anxiety: float = 0.5        # re-scans, second-guesses, hesitates, slow to react
    persistence: float = 0.6    # retries after failure
    tempo: float = 1.0          # multiplies thinking time
    seed: int = 0


PRESETS = {
    "explorer": Persona("explorer", curiosity=.97, novelty=.92, risk=.7, planning=.35, perfection=.1, sociability=.6,
                        initiative=.55, prosocial=.6, cooperative=.6, anxiety=.25, persistence=.8, tempo=.9),
    "planner": Persona("planner", curiosity=.15, novelty=.15, risk=.15, planning=.97, perfection=.8, sociability=.35,
                       initiative=.3, prosocial=.55, cooperative=.6, anxiety=.35, persistence=.95, tempo=1.3),
    "socialite": Persona("socialite", curiosity=.5, novelty=.5, risk=.5, planning=.4, perfection=.2, sociability=.97,
                         initiative=.97, prosocial=.92, cooperative=.92, anxiety=.3, persistence=.7, tempo=1.0),
    "anxious": Persona("anxious", curiosity=.25, novelty=.2, risk=.08, planning=.6, perfection=.4, sociability=.35,
                       initiative=.1, prosocial=.5, cooperative=.5, anxiety=.97, persistence=.5, tempo=1.5),
    "reckless": Persona("reckless", curiosity=.5, novelty=.55, risk=.97, planning=.05, perfection=.02, sociability=.5,
                        initiative=.4, prosocial=.1, cooperative=.08, anxiety=.08, persistence=.35, tempo=.55),
    "balanced": Persona("balanced"),
}


def random_persona(rng: random.Random, name: str) -> Persona:
    f = lambda: clip(rng.betavariate(2, 2))
    return Persona(name, curiosity=f(), novelty=f(), risk=f(), planning=f(), perfection=f() * .8, sociability=f(),
                   initiative=f(), prosocial=f(), cooperative=f(), anxiety=f(), persistence=clip(.3 + .7 * f()),
                   tempo=.6 + 1.1 * f(), seed=rng.randrange(1 << 30))


class Bot:
    def __init__(self, app: GameApp, persona: Persona):
        self.app = app
        self.p = persona
        self.rng = random.Random(persona.seed)
        self.bench_target: Optional[str] = None
        self._was_frozen = False
        self._reacting = False
        self.paused_once = False

    # ================================================================ basics
    def t(self, base: float, spread: float = 0.3) -> float:
        return max(0.35, self.rng.lognormvariate(math.log(max(0.05, base * self.p.tempo)), spread))

    def wait(self, seconds: float) -> Gen:
        for _ in range(max(1, int(seconds * FPS))):
            yield I()

    def lvl(self):
        return self.app.level

    def playing(self) -> bool:
        a = self.app
        return a.state == "play" and a.level is not None and a.level.status == RUNNING

    def modal_active(self) -> bool:
        a = self.app
        return a.state == "play" and a.level is not None and a.level.modal is not None and \
            not getattr(a.level.modal, "done", False)

    def frame(self, inp: Optional[I] = None) -> Gen:
        """Yield one frame, dealing first with popups, hesitation after setbacks and the tremor reaction."""
        if self.modal_active():
            yield from self.handle_modal()
        lvl = self.lvl()
        if lvl is not None and self.app.state == "play":
            frozen = lvl.player.frozen
            if self._was_frozen and not frozen and lvl.status == RUNNING:
                yield from self.wait(self.rng.uniform(0.1, 0.5) * (0.3 + 2.4 * self.p.anxiety))   # hesitation after a setback
            self._was_frozen = frozen
            if getattr(lvl, "awaiting_reaction", False) and not self._reacting:
                self._reacting = True
                while getattr(lvl, "lock_ms", 0) > 0:
                    yield I()
                yield from self.wait(self.rng.uniform(0.15, 0.5) * (0.2 + 2.6 * self.p.anxiety))
            if not getattr(lvl, "awaiting_reaction", False):
                self._reacting = False
        yield inp or I()

    def goto(self, x: float, y: float, tol: float = 10, limit_s: float = 45) -> Gen:
        frames = 0
        last, still = None, 0
        while self.playing() and frames < limit_s * FPS:
            lvl = self.lvl()
            px, py = lvl.player.pos
            if math.hypot(x - px, y - py) <= tol:
                return
            dx = 0 if abs(x - px) <= 3 else (1 if x > px else -1)
            dy = 0 if abs(y - py) <= 3 else (1 if y > py else -1)
            yield from self.frame(I(dx=dx, dy=dy))
            frames += 1
            if lvl.player.frozen or self.modal_active():
                still = 0
                continue
            if frames % 30 == 0:
                now = lvl.player.pos
                if last is not None and math.hypot(now[0] - last[0], now[1] - last[1]) < 3:
                    still += 1
                    if still >= 2:                      # stuck behind an obstacle: wiggle sideways
                        sx, sy = self.rng.choice([(1, 0), (-1, 0), (0, 1), (0, -1)])
                        for _ in range(12):
                            yield from self.frame(I(dx=sx, dy=sy))
                        still = 0
                else:
                    still = 0
                last = now

    def path(self, *pts, tol=10) -> Gen:
        for x, y in pts:
            yield from self.goto(x, y, tol)

    def press_interact(self, handle: bool = True) -> Gen:
        if not self.playing():
            return
        yield from self.frame(I(interact=True))
        yield I()
        if handle and self.modal_active():          # answer the popup now, while the decision context is current
            yield from self.handle_modal()

    # ================================================================ popups
    def handle_modal(self) -> Gen:
        while self.modal_active():
            m = self.lvl().modal
            if isinstance(m, ChoiceDialog):
                yield from self.answer_choice(m)
            elif isinstance(m, MessageBox):
                yield from self.wait(self.t(1.4, 0.3))
                for _ in range(40):
                    if not self.modal_active() or self.lvl().modal is not m:
                        break
                    yield I(confirm=True)
            else:                                           # PlannerPanel (handled by script) / unknown
                for _ in range(3):
                    yield I()
                yield I(confirm=True)
                yield I()

    def answer_choice(self, dlg: ChoiceDialog) -> Gen:
        plan = self.decide(dlg)
        keys = [o["key"] for o in dlg.options]
        actions: list[tuple[str, object]] = []
        for _ in range(plan.get("changes", 0)):
            actions.append(("move", None))
        for _ in range(plan.get("scans", 0)):
            actions.append(("scan", None))
        self.rng.shuffle(actions)
        total = plan["think"]
        gaps = [self.rng.random() + 0.3 for _ in actions] + [1.0]
        scale = total / sum(gaps)
        for (kind, _), g in zip(actions, gaps):
            yield from self.wait(g * scale)
            if dlg.done:
                return
            if kind == "move":
                if dlg.index >= len(dlg.options) - 1 or (dlg.index > 0 and self.rng.random() < 0.5):
                    yield I(up=True)
                else:
                    yield I(down=True)
            else:
                scan_idx = next(i for i, o in enumerate(dlg.options) if o["kind"] == "check")
                yield I(number=scan_idx + 1)
        yield from self.wait(gaps[-1] * scale)
        if dlg.done:
            return
        target = keys.index(plan["key"]) if plan["key"] in keys else len(keys) - 1
        yield I(number=target + 1)
        yield I()

    # ================================================================ decisions
    def decide(self, dlg: ChoiceDialog) -> dict:
        p, r = self.p, self.rng
        did = dlg.decision_id
        keys = {o["key"] for o in dlg.options}
        changes = int(r.random() < 0.1 + 0.6 * p.anxiety) + int(r.random() < 0.4 * p.anxiety) + int(r.random() < 0.2 * p.anxiety)
        out = {"changes": changes, "scans": 0}
        if did == "l1_bridge":
            out.update(key="cross_bridge" if r.random() < p.risk else "walk_around", think=self.t(2.0 + 2.2 * p.anxiety))
        elif did == "l1_chest":
            q = 0.1 + 0.85 * (0.5 * p.novelty + 0.5 * p.risk)
            out.update(key="open_mystery" if r.random() < q else "take_coins", think=self.t(2.4))
        elif did == "l2_bonus":
            out.update(key="gamble_bonus" if r.random() < p.risk else "take_bonus", think=self.t(2.5))
        elif did.startswith("l2_bench"):
            out.update(key=self.bench_target if self.bench_target in keys else "step_away",
                       think=self.t(1.2 + 1.5 * (1 - p.planning)), changes=0)
        elif did == "l3_merchant":
            out.update(key="sealed_jar" if r.random() < 0.08 + 0.85 * p.novelty else "plain_bread", think=self.t(2.2))
        elif did.startswith("l3_") and re.search(r"_chat\d$", did):
            turn = int(did[-1])
            chat = r.random() < (0.12 + 0.8 * p.sociability) * (0.82 ** (turn - 1))
            nid = did.split("_")[1]
            out.update(key=f"{nid}_{'chat' if chat else 'bye'}{turn}", think=self.t(1.6))
        elif did.startswith("l3_"):
            out.update(key=self._social_choice(did.split("_")[1], keys), think=self.t(2.3))
        elif did.startswith("l4_gate"):
            out.update(self._gate_choice(dlg))
        elif did == "l4_chest":
            out.update(key="sealed_relic" if r.random() < p.risk else "gold_bars", think=self.t(2.0), changes=changes)
        else:
            out.update(key=dlg.options[0]["key"], think=self.t(2.0))
        return out

    def _social_choice(self, nid: str, keys: set) -> str:
        p, r = self.p, self.rng
        pick = lambda effect: f"{nid}_{effect}"
        ignore_p = (1 - p.sociability) * (0.8 if nid != "marta" else 0.55)
        if nid == "marta":
            return pick("help") if r.random() < clip(0.1 + 0.9 * p.prosocial) * (0.6 + 0.4 * p.sociability) else pick("ignore")
        if nid == "lena":
            if r.random() < ignore_p:
                return pick("ignore")
            if r.random() < (1 - p.cooperative) * 0.9:
                return pick("compete")
            return pick("negotiate") if r.random() < 0.3 else pick("cooperate")
        if nid == "bashir":
            if r.random() < ignore_p:
                return pick("ignore")
            if r.random() < p.prosocial:
                return pick("share_half") if p.prosocial > 0.75 else pick("share_few")
            return pick("keep")
        if nid == "omar":
            return pick("share_few") if r.random() < clip(0.1 + 0.9 * p.prosocial) else pick("leave")
        if nid == "zayn":
            return pick("help") if r.random() < clip(0.1 + 0.9 * p.prosocial) else pick("leave")
        if nid == "rina":
            x = r.random()
            if x < (1 - p.cooperative) * 0.8:
                return pick("compete")
            if x < 0.85 * (0.15 + 0.85 * p.prosocial) + (1 - p.cooperative) * 0.8:
                return pick("negotiate") if r.random() < 0.3 else pick("cooperate")
            return pick("leave")
        return next(iter(keys))

    def _gate_choice(self, dlg: ChoiceDialog) -> dict:
        p, r = self.p, self.rng
        n = 0
        if r.random() < 0.15 + 0.8 * p.anxiety:
            n = 1
            while r.random() < 0.08 + 0.6 * p.anxiety and n < 5:
                n += 1
        hint = 0.55
        m = re.findall(r"about (\d+)%", dlg.body)
        if m:
            hint = int(m[-1]) / 100
        p_risky = clip(p.risk + (hint - 0.5) * 0.5) if m else p.risk
        key = "force_lock" if r.random() < p_risky else "safe_bypass"
        think = self.t(1.2 + 3.0 * p.anxiety) * (1 + 0.6 * n)
        return {"key": key, "scans": n, "think": think, "changes": int(r.random() < 0.15 + 0.7 * p.anxiety) +
                int(r.random() < 0.5 * p.anxiety) + int(r.random() < 0.25 * p.anxiety)}

    # ================================================================ levels
    def level1(self) -> Gen:
        p, r = self.p, self.rng
        lvl = self.lvl()
        zone_p = lambda: clip(0.05 + 0.9 * p.curiosity + r.uniform(-0.08, 0.08))
        obj_p = lambda: clip(0.05 + 0.92 * p.novelty + r.uniform(-0.08, 0.08))

        def maybe_interact(prob):
            if r.random() < prob:
                yield from self.wait(self.t(0.7))
                yield from self.press_interact()
                yield from self.wait(self.t(1.0))

        yield from self.path((260, 300))
        if r.random() < zone_p():                                      # Mushroom Grove
            yield from self.path((240, 215), (230, 172))
            yield from maybe_interact(obj_p())
            yield from self.path((240, 215), (260, 300))
        yield from self.path((340, 331))                               # odd signpost on the road
        yield from maybe_interact(obj_p())
        if r.random() < zone_p():                                      # Crystal Cave
            yield from self.path((395, 262), (420, 140), (510, 125))
            yield from maybe_interact(obj_p())
            yield from self.path((420, 140), (395, 262), (420, 380))
        if r.random() < zone_p():                                      # Hidden Pond
            yield from self.path((300, 310), (250, 430), (250, 495))
            yield from maybe_interact(obj_p())
            yield from self.path((250, 430), (300, 310), (420, 380))
        if r.random() < zone_p():                                      # Windmill Hill
            yield from self.path((450, 440), (500, 495))
            yield from maybe_interact(obj_p())
            yield from self.path((450, 440), (470, 380))
        yield from self.path((560, 380), (612, 380))                   # bridge trigger -> dialog
        yield from self.wait(0.3)
        if lvl.bridge_open:
            yield from self.path((720, 380), (790, 380))
        else:                                                          # safe detour through the south gap
            yield from self.path((618, 420), (618, 580), (730, 580), (760, 470), (790, 390))
        if r.random() < zone_p():                                      # Old Ruins
            yield from self.path((790, 200), (820, 148))
            yield from maybe_interact(obj_p())
            yield from self.path((930, 178))
            yield from maybe_interact(obj_p())
            yield from self.path((800, 200), (790, 380))
        if r.random() < zone_p():                                      # Whispering Cliffs
            yield from self.path((880, 340), (880, 420), (900, 475))
            yield from maybe_interact(obj_p())
            yield from self.path((880, 420), (890, 345))
        if r.random() < 0.2 + 0.75 * (0.5 * p.novelty + 0.5 * p.curiosity):   # treasure chest
            yield from self.path((900, 335), (930, 383))
            yield from self.wait(self.t(0.8))
            yield from self.press_interact()
            yield from self.wait(self.t(1.0))
        yield from self.path((1000, 310), (1065, 300))

    # ---- level 2
    def _plan_sequence(self, known: bool, policy: str):
        orders = L2.ORDERS
        if not known:
            return [o["id"] for o in sorted(orders, key=lambda o: -o["reward"])]
        if policy == "optimal":
            import itertools
            best, best_r = [], -1
            for n in range(len(orders) + 1):
                for combo in itertools.combinations(orders, n):
                    if all(sum(o["cost"][k] for o in combo) <= L2.START_STOCK[k] for k in L2.RES):
                        rew = sum(o["reward"] for o in combo)
                        if rew > best_r:
                            best, best_r = [o["id"] for o in combo], rew
            return best
        stock = dict(L2.START_STOCK)
        seq, rem = [], list(orders)
        keyf = {"greedy": lambda o: o["reward"], "value": lambda o: o["reward"] / max(1, sum(o["cost"].values())),
                "cheapest": lambda o: -sum(o["cost"].values())}[policy]
        while True:
            aff = [o for o in rem if all(o["cost"][k] <= stock[k] for k in L2.RES)]
            if not aff:
                return seq
            o = max(aff, key=keyf)
            rem.remove(o)
            seq.append(o["id"])
            for k in L2.RES:
                stock[k] -= o["cost"][k]

    def _station(self, name: str) -> Gen:
        r = L2.STATIONS[name]
        sx = {"shelf": 185, "board": 500, "planner": 835, "bench": 560, "counter": 965, "reset": 125}[name]
        sy = {"shelf": 205, "board": 165, "planner": 205, "bench": 365, "counter": 375, "reset": 395}[name]
        yield from self.path((sx, 262), (sx, sy), tol=8)

    def level2(self) -> Gen:
        p, r = self.p, self.rng
        lvl = self.lvl()
        learned = lvl.attempt > 1
        plan_p = clip(p.planning + (0.45 if learned else 0))
        do_board = r.random() < 0.1 + 0.9 * plan_p
        do_shelf = r.random() < 0.1 + 0.9 * plan_p
        do_planner = r.random() < plan_p * 0.85
        policy = "optimal" if r.random() < plan_p ** 1.4 else r.choice(["greedy", "value", "cheapest"])
        yield from self.wait(self.t(0.5 + 6.0 * plan_p, 0.35))                      # look around / think
        if do_board:
            yield from self._station("board"); yield from self.press_interact()
            yield from self.wait(self.t(1.0))
        if do_shelf:
            yield from self._station("shelf"); yield from self.press_interact()
            yield from self.wait(self.t(1.0))
        known = do_board and do_shelf
        seq = self._plan_sequence(known, policy)
        if do_planner:
            yield from self._station("planner"); yield from self.press_interact(handle=False)
            yield from self.wait(self.t(1.0))
            for oid in seq:
                if not isinstance(lvl.modal, L2.PlannerPanel):
                    break
                idx = [o["id"] for o in L2.ORDERS].index(oid) + 1
                yield I(number=idx)
                yield from self.wait(self.t(0.7))
            yield from self.wait(self.t(1.0))
            for _ in range(30):
                if not isinstance(lvl.modal, L2.PlannerPanel):
                    break
                yield I(confirm=True)
        for attempt_round in range(2):
            for oid in seq:
                if oid in lvl.built:
                    continue
                self.bench_target = oid
                yield from self._station("bench"); yield from self.press_interact()
                yield from self.wait(0.2)
            if attempt_round == 0 and known and lvl.reward_total < L2.OPTIMAL and r.random() < p.perfection and lvl.resets < 1:
                yield from self._station("reset"); yield from self.press_interact()
                yield from self.wait(0.5)
                seq = self._plan_sequence(True, "optimal")
                continue
            break
        yield from self.wait(self.t(0.8))
        yield from self._station("counter"); yield from self.press_interact()
        yield from self.wait(0.5)

    # ---- level 3
    def level3(self) -> Gen:
        p, r = self.p, self.rng
        init_p = lambda: clip(0.08 + 0.9 * (0.5 * p.sociability + 0.5 * p.initiative))
        yield from self.path((230, 300))
        if r.random() < init_p():                                      # Omar
            yield from self.path((230, 430), (230, 472))
            yield from self.wait(self.t(0.8)); yield from self.press_interact()
            yield from self.wait(0.5)
            yield from self.path((230, 430), (230, 300))
        yield from self.path((480, 300))
        if r.random() < init_p():                                      # Zayn
            yield from self.path((500, 260), (500, 150))
            yield from self.wait(self.t(0.8)); yield from self.press_interact()
            yield from self.wait(0.5)
            yield from self.path((500, 260), (500, 300))
        yield from self.path((790, 300))
        if r.random() < init_p():                                      # Rina
            yield from self.path((800, 380), (845, 495))
            yield from self.wait(self.t(0.8)); yield from self.press_interact()
            yield from self.wait(0.5)
            yield from self.path((800, 380), (790, 300))
        yield from self.path((1000, 300), (1065, 300))

    # ---- level 4
    def _beam_hit(self, lvl, t_ahead: float, y: float, x: float, margin: float) -> bool:
        for slot, w, period, phase in L4.BEAMS:
            by = 300 + 125 * math.sin(2 * math.pi * (lvl.beam_t + t_ahead * lvl.beam_mult) / period + phase)
            if slot - 12 - margin < x < slot + w + 12 + margin and abs(by - y) < 6 + 12 + margin:
                return True
        return False

    def _safe_to_go(self, lvl, margin: float) -> bool:
        x, y = lvl.player.x, lvl.player.y
        t = 0.0
        while x < 605:
            if self._beam_hit(lvl, t, y, x, margin):
                return False
            t += 0.04
            x += 215 * 0.04
        return True

    def level4(self) -> Gen:
        p, r = self.p, self.rng
        lvl = self.lvl()
        yield from self.goto(150, 300, tol=8)                           # gate 1 console
        yield from self.goto(262, 300, tol=8)
        margin = 3 + 16 * p.anxiety
        patience = 2 + 8 * (1 - p.risk)
        waited = 0.0
        while self.playing() and lvl.player.x < 600:
            dy = 0 if abs(lvl.player.y - 300) < 6 else (1 if 300 > lvl.player.y else -1)
            if self._safe_to_go(lvl, margin) or waited > patience:
                yield from self.frame(I(dx=1, dy=dy))
                waited = 0.0 if waited <= patience else waited
            else:
                waited += DT
                yield from self.frame(I(dy=dy))
        yield from self.goto(690, 300, tol=8)                           # gate 2
        yield from self.goto(790, 300, tol=8)                           # gate 3
        if r.random() < 0.15 + 0.7 * (0.5 * p.risk + 0.5 * p.novelty):  # optional chest with the clock running
            yield from self.goto(960, 378, tol=8)
            yield from self.press_interact()
            yield from self.wait(0.4)
        yield from self.goto(1065, 300, tol=8)

    # ================================================================ whole assessment
    def script(self) -> Gen:
        a, p, r = self.app, self.p, self.rng
        yield from self.wait(0.5)
        yield I(confirm=True)                                          # New Assessment
        yield from self.wait(0.3)
        for ch in f"Bot-{p.name}"[:18]:
            yield I(text=ch)
        yield I(confirm=True)
        yield from self.wait(self.t(1.0)); yield I(confirm=True)       # briefing
        for idx in range(4):
            yield from self.wait(self.t(1.0)); yield I(confirm=True)   # level intro
            level_fn = [self.level1, self.level2, self.level3, self.level4][idx]
            while True:
                if idx == 0 and not self.paused_once and r.random() < 0.5:     # occasionally pause (tests pause/resume events)
                    self.paused_once = True
                    yield from self.wait(1.0)
                    yield I(pause=True)
                    yield from self.wait(2.0)
                    yield I(pause=True)
                reruns = 0
                while a.state == "play" and reruns < 8:                # level script may end before the level does
                    yield from level_fn()
                    for _ in range(30):                                # let the level wrap up
                        if a.state != "play":
                            break
                        yield from self.frame(I())
                    reruns += 1
                if a.state != "outcome":
                    break                                              # app already advanced (stray key); carry on
                yield from self.wait(self.t(1.6))
                opts = a._outcome_options()
                if "Try again" in opts:
                    if r.random() < p.persistence:
                        yield I(number=1)
                        yield I()
                        continue
                    yield I(number=2)
                else:
                    yield I(number=1)
                yield I()
                break
        for _ in range(200):                                           # processing screen -> results
            if a.state == "results":
                break
            yield I()
        yield from self.wait(1.0)


def play_assessment(persona: Persona, repo, seed: Optional[int] = None, max_frames: int = 90000,
                    on_frame: Optional[Callable[[GameApp], None]] = None) -> GameApp:
    """Play one complete assessment headlessly and return the finished GameApp (state 'results')."""
    app = GameApp(repo, seed=seed if seed is not None else persona.seed, is_demo=True)
    bot = Bot(app, persona)
    gen = bot.script()
    for _ in range(max_frames):
        try:
            inp = next(gen)
        except StopIteration:
            break
        app.step(inp, DT)
        if on_frame:
            on_frame(app)
    return app
