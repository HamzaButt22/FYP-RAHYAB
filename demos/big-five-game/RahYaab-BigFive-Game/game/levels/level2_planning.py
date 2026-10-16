"""Level 2 - The Workshop (planning with limited resources).

The player fills customer orders from a fixed stock of wood / metal / cloth. Costs live on the
Blueprint Board, the stock on the Resource Shelf, and a Planning Table lets them work out a
build plan *before* touching the workbench. Nothing forces them to plan: they can start
building straight away, make mistakes (not enough materials), reset the workshop and try again.
The best possible reward is brute-forced so resource efficiency is measured against a real optimum.
"""
from __future__ import annotations

import itertools

import pygame

from analytics.event_schema import CAT_PLANNING, CAT_REWARD, KIND_NEUTRAL, KIND_RISKY, KIND_SAFE, EventType as E
from game import settings as S
from game.input_state import InputState
from game.levels.base import Level
from game.ui import widgets as W
from game.ui.dialog import MessageBox

RES = ("wood", "metal", "cloth")
START_STOCK = {"wood": 10, "metal": 6, "cloth": 5}
ORDERS = [
    {"id": "crate", "name": "Crate", "cost": {"wood": 4, "metal": 0, "cloth": 0}, "reward": 45},
    {"id": "lantern", "name": "Lantern", "cost": {"wood": 1, "metal": 2, "cloth": 1}, "reward": 25},
    {"id": "cart", "name": "Hand Cart", "cost": {"wood": 5, "metal": 3, "cloth": 0}, "reward": 65},
    {"id": "banner", "name": "Banner", "cost": {"wood": 1, "metal": 0, "cloth": 3}, "reward": 15},
    {"id": "shield", "name": "Shield", "cost": {"wood": 2, "metal": 3, "cloth": 1}, "reward": 40},
    {"id": "tent", "name": "Tent", "cost": {"wood": 3, "metal": 0, "cloth": 4}, "reward": 40},
]
QUOTA = 100
BY_ID = {o["id"]: o for o in ORDERS}


def optimal_reward(stock=START_STOCK) -> int:
    best = 0
    for r in range(len(ORDERS) + 1):
        for combo in itertools.combinations(ORDERS, r):
            if all(sum(o["cost"][k] for o in combo) <= stock[k] for k in RES):
                best = max(best, sum(o["reward"] for o in combo))
    return best


OPTIMAL = optimal_reward()
STATIONS = {
    "shelf": pygame.Rect(100, 90, 170, 90),
    "board": pygame.Rect(400, 70, 200, 70),
    "planner": pygame.Rect(740, 90, 190, 90),
    "bench": pygame.Rect(470, 390, 180, 100),
    "counter": pygame.Rect(880, 400, 170, 100),
    "reset": pygame.Rect(80, 420, 90, 100),
}
STATION_NAMES = {"shelf": "Resource Shelf", "board": "Blueprint Board", "planner": "Planning Table",
                 "bench": "Workbench", "counter": "Delivery Counter", "reset": "Reset Lever"}


def cost_text(cost: dict) -> str:
    return ", ".join(f"{cost.get(k, 0)} {k}" for k in RES if cost.get(k, 0)) or "nothing"


class PlannerPanel:
    """Toggle orders with number keys and see whether the plan fits the stock. Enter closes."""

    def __init__(self, level: "PlanningLevel"):
        self.level = level
        self.selected: set[str] = set()
        self.done = False
        self.age = 0

    def totals(self):
        cost = {k: sum(BY_ID[i]["cost"][k] for i in self.selected) for k in RES}
        reward = sum(BY_ID[i]["reward"] for i in self.selected)
        feasible = all(cost[k] <= START_STOCK[k] for k in RES)
        return cost, reward, feasible

    def update(self, inp: InputState) -> None:
        self.age += 1
        if inp.number is not None and 1 <= inp.number <= len(ORDERS):
            oid = ORDERS[inp.number - 1]["id"]
            if oid in self.selected:
                self.selected.remove(oid)
            else:
                self.selected.add(oid)
            self.level.log.log(E.PLAYER_INTERACTION, action="planner_toggle", object_id="planner",
                               order_id=oid, selected=oid in self.selected, novel=False)
        elif self.age > 8 and (inp.accept or inp.back):
            cost, reward, feasible = self.totals()
            self.level.log.log(E.PLAYER_INTERACTION, action="use_planner", object_id="planner", novel=False,
                               plan=sorted(self.selected), planned_reward=reward, feasible=feasible)
            self.done = True

    def draw(self, surf: pygame.Surface) -> None:
        shade = pygame.Surface((S.SCREEN_W, S.SCREEN_H), pygame.SRCALPHA)
        shade.fill((8, 10, 20, 150))
        surf.blit(shade, (0, 0))
        rect = pygame.Rect(0, 0, 760, 520)
        rect.center = (S.SCREEN_W // 2, S.SCREEN_H // 2 + 20)
        W.panel(surf, rect, S.PANEL, S.ACCENT, 16)
        W.text(surf, "Planning Table", (rect.x + 28, rect.y + 18), 38, bold=True)
        W.text(surf, "Press 1-6 to add / remove orders from your plan. Enter to finish.", (rect.x + 28, rect.y + 58), 22, S.TEXT_DIM)
        y = rect.y + 92
        for i, o in enumerate(ORDERS):
            sel = o["id"] in self.selected
            r = pygame.Rect(rect.x + 24, y, rect.w - 48, 42)
            W.panel(surf, r, S.PANEL_LIGHT if sel else (36, 42, 64), S.ACCENT_2 if sel else None, 10)
            W.text(surf, f"{i + 1}", (r.x + 14, r.centery), 26, S.ACCENT if sel else S.TEXT_DIM, anchor="midleft", bold=True)
            W.text(surf, f"{o['name']}", (r.x + 44, r.centery), 25, anchor="midleft")
            W.text(surf, cost_text(o["cost"]), (r.x + 250, r.centery), 22, S.TEXT_DIM, anchor="midleft")
            W.text(surf, f"{o['reward']} coins", (r.right - 16, r.centery), 25, S.GOLD, anchor="midright")
            y += 48
        cost, reward, feasible = self.totals()
        y += 6
        for k in RES:
            over = cost[k] > START_STOCK[k]
            W.text(surf, f"{k}: {cost[k]} / {START_STOCK[k]}", (rect.x + 30 + RES.index(k) * 200, y), 26,
                   S.DANGER if over else S.TEXT)
        W.text(surf, f"Plan reward: {reward}   (quota {QUOTA})", (rect.x + 30, y + 36), 28, S.GOLD if feasible else S.DANGER, bold=True)
        W.text(surf, "Plan fits the stock" if feasible else "Plan needs more material than you have!", (rect.x + 30, y + 68), 24,
               S.ACCENT_2 if feasible else S.DANGER)


class PlanningLevel(Level):
    level_id = 2
    name = "The Workshop"
    scenario = "planning"
    objective = "Fill customer orders with the limited materials. Deliver at least 100 coins' worth."
    task_name = "fill_workshop_orders"
    start_pos = (550, 300)

    def build(self) -> None:
        self.stock = dict(START_STOCK)
        self.built: list[str] = []
        self.reward_total = 0
        self.builds_count = 0
        self.resets = 0
        self.session.strategies.last = self.session.strategies.last   # keep strategy continuity across attempts

    def level_start_metadata(self) -> dict:
        return {"optimal_reward": OPTIMAL, "quota": QUOTA, "stock": START_STOCK, "orders_total": len(ORDERS)}

    def solids(self):
        return list(STATIONS.values())

    # ----------------------------------------------------------------- stations
    def nearest_station(self):
        best, best_d = None, 9e9
        for k, r in STATIONS.items():
            cx = min(max(self.player.x, r.left), r.right)
            cy = min(max(self.player.y, r.top), r.bottom)
            d = ((self.player.x - cx) ** 2 + (self.player.y - cy) ** 2) ** 0.5
            if d < best_d:
                best, best_d = k, d
        return best if best_d <= 42 else None

    def on_interact(self) -> None:
        st = self.nearest_station()
        if st == "shelf":
            self.log.log(E.PLAYER_INTERACTION, action="inspect_resources", object_id="shelf", novel=False, stock=dict(self.stock))
            self.open_message("Resource Shelf", "", lines=[f"Wood:   {self.stock['wood']}", f"Metal:  {self.stock['metal']}",
                                                            f"Cloth:  {self.stock['cloth']}",
                                                            "These materials cannot be restocked."])
        elif st == "board":
            self.log.log(E.PLAYER_INTERACTION, action="inspect_blueprint", object_id="board", novel=False)
            lines = [f"{o['name']}: {cost_text(o['cost'])}  ->  {o['reward']} coins" +
                     ("  [built]" if o["id"] in self.built else "") for o in ORDERS]
            lines.append(f"Quota to deliver: {QUOTA} coins")
            self.open_message("Blueprint Board", "", lines=lines)
        elif st == "planner":
            self.log.log(E.PLAYER_INTERACTION, action="open_planner", object_id="planner", novel=False)
            self.modal = PlannerPanel(self)
        elif st == "bench":
            self._bench_dialog()
        elif st == "counter":
            self._deliver()
        elif st == "reset":
            self._reset()

    # --------------------------------------------------------------- build logic
    def _affordable(self):
        return [o for o in ORDERS if o["id"] not in self.built and all(o["cost"][k] <= self.stock[k] for k in RES)]

    def _label(self, order, affordable) -> str:
        if len(affordable) <= 1:
            return "other"
        ratio = lambda o: o["reward"] / max(1, sum(o["cost"].values()))
        if ratio(order) >= max(ratio(o) for o in affordable) - 1e-9:
            return "best_value"
        if order["reward"] >= max(o["reward"] for o in affordable):
            return "highest_reward_first"
        if sum(order["cost"].values()) <= min(sum(o["cost"].values()) for o in affordable):
            return "cheapest_first"
        return "other"

    def _bench_dialog(self) -> None:
        todo = [o for o in ORDERS if o["id"] not in self.built]
        if not todo:
            self.say("Every order is already built. Deliver them at the counter.")
            return
        opts = [{"key": o["id"], "label": f"Build {o['name']}  ({o['reward']} coins)", "kind": KIND_NEUTRAL} for o in todo]
        opts.append({"key": "step_away", "label": "Step away from the workbench", "kind": "exit"})

        def chosen(opt):
            if opt["key"] == "step_away":
                return
            order = BY_ID[opt["key"]]
            short = {k: order["cost"][k] - self.stock[k] for k in RES if order["cost"][k] > self.stock[k]}
            if short:
                self.log.log(E.ERROR, action="insufficient_resources", order_id=order["id"], shortfall=short,
                             stock=dict(self.stock))
                self.say("Not enough materials: missing " + cost_text(short) + ".", 3200)
                return
            label = self._label(order, self._affordable())
            for k in RES:
                self.stock[k] -= order["cost"][k]
            self.built.append(order["id"])
            self.reward_total += order["reward"]
            self.builds_count += 1
            self.log.log(E.RESOURCE_USED, action="build_order", order_id=order["id"], cost=dict(order["cost"]),
                         stock_after=dict(self.stock), reward=order["reward"], reward_total=self.reward_total,
                         build_index=self.builds_count, strategy_label=label)
            if label != "other":
                self.session.strategies.adopt(label, "workshop_build", level_id=2, order_id=order["id"])
            self.say(f"Built {order['name']}!  Left: {self.stock['wood']} wood, {self.stock['metal']} metal, {self.stock['cloth']} cloth.", 3400)

        self.open_choice("l2_bench_%d" % (self.builds_count + 1 + self.resets * 10), CAT_PLANNING, "Workbench",
                         "What would you like to build next?", opts, chosen, context={"order_no": self.builds_count + 1})

    def _reset(self) -> None:
        if not self.built:
            self.say("The workshop is already fresh.")
            return
        self.resets += 1
        self.log.log(E.RETRY, action="reset_workshop", voluntary=True, attempt=self.attempt, resets=self.resets,
                     discarded_reward=self.reward_total)
        self.stock = dict(START_STOCK)
        self.built, self.reward_total = [], 0
        self.say("You pulled the lever: stock and orders are reset.")

    def _deliver(self) -> None:
        if not self.built:
            self.log.log(E.ERROR, action="empty_delivery")
            self.say("You have nothing to deliver yet.")
            return
        self.log.log(E.PLAYER_INTERACTION, action="deliver", object_id="counter", novel=False, reward_total=self.reward_total)
        if self.reward_total < QUOTA:
            self.fail("quota_missed", reward_total=self.reward_total, quota=QUOTA)
            return
        opts = [
            {"key": "take_bonus", "label": "Take the 20-coin bonus (guaranteed)", "kind": KIND_SAFE, "risk_level": 0.0},
            {"key": "gamble_bonus", "label": "Gamble: 50% chance of 50 coins, otherwise nothing", "kind": KIND_RISKY, "risk_level": 0.5},
        ]

        def chosen(o):
            if o["key"] == "take_bonus":
                gain = 20
            else:
                gain = 50 if self.rng.random() < 0.5 else 0
            self.log.log(E.REWARD_SELECTED, action=o["key"], chosen_kind=o["kind"], reward_value=gain, risk_level=o["risk_level"])
            if o["key"] == "gamble_bonus":
                self.log.log(E.RISK_ACTION, action="gamble_bonus", risk_level=0.5, success=gain > 0, p_success=0.5)
            self.session.coins += gain
            self.complete(reward_total=self.reward_total, quota=QUOTA, optimal_reward=OPTIMAL, resets=self.resets,
                          builds=self.builds_count)

        self.open_choice("l2_bonus", CAT_REWARD, "Order accepted!",
                         f"The customer pays {self.reward_total} coins and the foreman offers a bonus.", opts, chosen)

    # --------------------------------------------------------------------- draw
    def hud_extra(self):
        return [("quota", str(QUOTA)), ("reward", str(self.reward_total))]

    def draw_world(self, world: pygame.Surface) -> None:
        world.fill((120, 88, 62))
        for y in range(0, S.WORLD_H, 38):
            pygame.draw.line(world, (104, 74, 52), (0, y), (S.WORLD_W, y), 2)
        for x in range(0, S.WORLD_W, 150):
            for y in range(0, S.WORLD_H, 76):
                pygame.draw.line(world, (104, 74, 52), (x + (y // 76 % 2) * 75, y), (x + (y // 76 % 2) * 75, y + 38), 2)
        colors = {"shelf": (96, 70, 50), "board": (60, 90, 70), "planner": (70, 80, 130), "bench": (148, 110, 60),
                  "counter": (130, 70, 70), "reset": (90, 90, 100)}
        for k, r in STATIONS.items():
            W.shadow_circle(world, (r.centerx, r.bottom - 4), r.w // 6, 45)
            pygame.draw.rect(world, colors[k], r, border_radius=10)
            pygame.draw.rect(world, (30, 24, 20), r, 3, border_radius=10)
            W.text(world, STATION_NAMES[k], (r.centerx, r.centery), 24, S.TEXT, anchor="center", bold=True)
        # shelf crates, bench tools, reset lever
        s = STATIONS["shelf"]
        for i in range(3):
            pygame.draw.rect(world, (170, 130, 80), (s.x + 10 + i * 54, s.y + 8, 44, 18), border_radius=3)
        pygame.draw.rect(world, (200, 70, 70), (STATIONS["reset"].centerx - 5, STATIONS["reset"].y + 8, 10, 30), border_radius=4)
        pygame.draw.circle(world, S.DANGER, (STATIONS["reset"].centerx, STATIONS["reset"].y + 8), 9)
        for i, oid in enumerate(self.built):
            pygame.draw.rect(world, S.ACCENT_2, (STATIONS["bench"].x + 10 + i * 28, STATIONS["bench"].y - 22, 22, 18), border_radius=4)

    def draw_overlay(self, world: pygame.Surface) -> None:
        st = self.nearest_station()
        if st and self.modal is None:
            r = STATIONS[st]
            W.key_hint(world, "E", (r.centerx - 8, r.y - 30), 24)
