/**
 * Level 2 - The Workshop (planning with limited resources). Port of game/levels/level2_planning.py.
 *
 * Fill customer orders from a fixed stock; costs on the Blueprint Board, stock on the Resource Shelf, and a
 * Planning Table to work out a plan before touching the workbench. Mistakes, resets and retries are allowed.
 */
import { Modal } from '../game-engine/dialogs';
import { CAT_PLANNING, CAT_REWARD, EventType as E, KIND_NEUTRAL, KIND_RISKY, KIND_SAFE } from '../game-engine/events';
import { accept, InputState } from '../game-engine/input';
import { HudItem, Level } from '../game-engine/level-base';
import { DecisionOption, Kw } from '../game-engine/logger';
import { R, Rect } from '../game-engine/rect';
import { nearestStation } from './common';

export const RES = ['wood', 'metal', 'cloth'] as const;
export type Res = (typeof RES)[number];
export type Stock = Record<Res, number>;
export const START_STOCK: Stock = { wood: 10, metal: 6, cloth: 5 };

export interface Order {
  id: string;
  name: string;
  cost: Stock;
  reward: number;
}
export const ORDERS: Order[] = [
  { id: 'crate', name: 'Crate', cost: { wood: 4, metal: 0, cloth: 0 }, reward: 45 },
  { id: 'lantern', name: 'Lantern', cost: { wood: 1, metal: 2, cloth: 1 }, reward: 25 },
  { id: 'cart', name: 'Hand Cart', cost: { wood: 5, metal: 3, cloth: 0 }, reward: 65 },
  { id: 'banner', name: 'Banner', cost: { wood: 1, metal: 0, cloth: 3 }, reward: 15 },
  { id: 'shield', name: 'Shield', cost: { wood: 2, metal: 3, cloth: 1 }, reward: 40 },
  { id: 'tent', name: 'Tent', cost: { wood: 3, metal: 0, cloth: 4 }, reward: 40 },
];
export const QUOTA = 100;
export const BY_ID: Record<string, Order> = Object.fromEntries(ORDERS.map((o) => [o.id, o]));

export function optimalReward(stock: Stock = START_STOCK): number {
  let best = 0;
  const n = ORDERS.length;
  for (let mask = 0; mask < 1 << n; mask++) {
    const combo = ORDERS.filter((_, i) => mask & (1 << i));
    if (RES.every((k) => combo.reduce((s, o) => s + o.cost[k], 0) <= stock[k])) {
      best = Math.max(best, combo.reduce((s, o) => s + o.reward, 0));
    }
  }
  return best;
}

export const OPTIMAL = optimalReward();
export const STATIONS: Record<string, Rect> = {
  shelf: R(100, 90, 170, 90),
  board: R(400, 70, 200, 70),
  planner: R(740, 90, 190, 90),
  bench: R(470, 390, 180, 100),
  counter: R(880, 400, 170, 100),
  reset: R(80, 420, 90, 100),
};
export const STATION_NAMES: Record<string, string> = {
  shelf: 'Resource Shelf',
  board: 'Blueprint Board',
  planner: 'Planning Table',
  bench: 'Workbench',
  counter: 'Delivery Counter',
  reset: 'Reset Lever',
};

export function costText(cost: Partial<Record<Res, number>>): string {
  const parts = RES.filter((k) => cost[k]).map((k) => `${cost[k] ?? 0} ${k}`);
  return parts.join(', ') || 'nothing';
}

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
const totalCost = (o: Order) => sum(RES.map((k) => o.cost[k]));

/** Toggle orders and see whether the plan fits the stock. Port of PlannerPanel. */
export class PlannerPanel implements Modal {
  readonly kind = 'planner' as const;
  selected = new Set<string>();
  done = false;
  age = 0;

  constructor(private readonly level: PlanningLevel) {}

  totals(): { cost: Stock; reward: number; feasible: boolean } {
    const sel = ORDERS.filter((o) => this.selected.has(o.id));
    const cost = { wood: 0, metal: 0, cloth: 0 } as Stock;
    for (const k of RES) cost[k] = sum(sel.map((o) => o.cost[k]));
    const reward = sum(sel.map((o) => o.reward));
    const feasible = RES.every((k) => cost[k] <= START_STOCK[k]);
    return { cost, reward, feasible };
  }

  get ready(): boolean {
    return this.age > 8;
  }

  update(inp: InputState): void {
    this.age += 1;
    if (inp.number !== null && inp.number >= 1 && inp.number <= ORDERS.length) {
      const oid = ORDERS[inp.number - 1].id;
      if (this.selected.has(oid)) this.selected.delete(oid);
      else this.selected.add(oid);
      this.level.log.log(E.PLAYER_INTERACTION, {
        action: 'planner_toggle',
        object_id: 'planner',
        order_id: oid,
        selected: this.selected.has(oid),
        novel: false,
      });
    } else if (this.age > 8 && (accept(inp) || inp.back)) {
      const { reward, feasible } = this.totals();
      this.level.log.log(E.PLAYER_INTERACTION, {
        action: 'use_planner',
        object_id: 'planner',
        novel: false,
        plan: Array.from(this.selected).sort(),
        planned_reward: reward,
        feasible,
      });
      this.done = true;
    }
  }
}

export class PlanningLevel extends Level {
  readonly levelId = 2;
  readonly name = 'The Workshop';
  readonly scenario = 'planning';
  readonly objective = "Fill customer orders with the limited materials. Deliver at least 100 coins' worth.";
  readonly taskName = 'fill_workshop_orders';
  readonly startPos: [number, number] = [550, 300];

  stock!: Stock;
  built!: string[];
  rewardTotal!: number;
  buildsCount!: number;
  resets!: number;

  build(): void {
    this.stock = { ...START_STOCK };
    this.built = [];
    this.rewardTotal = 0;
    this.buildsCount = 0;
    this.resets = 0;
  }

  levelStartMetadata(): Kw {
    return { optimal_reward: OPTIMAL, quota: QUOTA, stock: { ...START_STOCK }, orders_total: ORDERS.length };
  }

  solids(): Rect[] {
    return Object.values(STATIONS);
  }

  nearestStation(): string | null {
    return nearestStation(this.player, STATIONS, 42);
  }

  interactHint(): string | null {
    const st = this.nearestStation();
    return st ? STATION_NAMES[st] : null;
  }

  onInteract(): void {
    const st = this.nearestStation();
    if (st === 'shelf') {
      this.log.log(E.PLAYER_INTERACTION, { action: 'inspect_resources', object_id: 'shelf', novel: false, stock: { ...this.stock } });
      this.openMessage('Resource Shelf', '', {
        lines: [
          `Wood:   ${this.stock.wood}`,
          `Metal:  ${this.stock.metal}`,
          `Cloth:  ${this.stock.cloth}`,
          'These materials cannot be restocked.',
        ],
      });
    } else if (st === 'board') {
      this.log.log(E.PLAYER_INTERACTION, { action: 'inspect_blueprint', object_id: 'board', novel: false });
      const lines = ORDERS.map(
        (o) => `${o.name}: ${costText(o.cost)}  ->  ${o.reward} coins` + (this.built.includes(o.id) ? '  [built]' : ''),
      );
      lines.push(`Quota to deliver: ${QUOTA} coins`);
      this.openMessage('Blueprint Board', '', { lines });
    } else if (st === 'planner') {
      this.log.log(E.PLAYER_INTERACTION, { action: 'open_planner', object_id: 'planner', novel: false });
      this.modal = new PlannerPanel(this);
    } else if (st === 'bench') {
      this.benchDialog();
    } else if (st === 'counter') {
      this.deliver();
    } else if (st === 'reset') {
      this.reset();
    }
  }

  affordable(): Order[] {
    return ORDERS.filter((o) => !this.built.includes(o.id) && RES.every((k) => o.cost[k] <= this.stock[k]));
  }

  label(order: Order, affordable: Order[]): string {
    if (affordable.length <= 1) return 'other';
    const ratio = (o: Order) => o.reward / Math.max(1, totalCost(o));
    if (ratio(order) >= Math.max(...affordable.map(ratio)) - 1e-9) return 'best_value';
    if (order.reward >= Math.max(...affordable.map((o) => o.reward))) return 'highest_reward_first';
    if (totalCost(order) <= Math.min(...affordable.map(totalCost))) return 'cheapest_first';
    return 'other';
  }

  private benchDialog(): void {
    const todo = ORDERS.filter((o) => !this.built.includes(o.id));
    if (!todo.length) {
      this.say('Every order is already built. Deliver them at the counter.');
      return;
    }
    const opts: DecisionOption[] = todo.map((o) => ({ key: o.id, label: `Build ${o.name}  (${o.reward} coins)`, kind: KIND_NEUTRAL }));
    opts.push({ key: 'step_away', label: 'Step away from the workbench', kind: 'exit' });

    const chosen = (opt: DecisionOption) => {
      if (opt.key === 'step_away') return;
      const order = BY_ID[opt.key];
      const short: Partial<Record<Res, number>> = {};
      for (const k of RES) if (order.cost[k] > this.stock[k]) short[k] = order.cost[k] - this.stock[k];
      if (Object.keys(short).length) {
        this.log.log(E.ERROR, { action: 'insufficient_resources', order_id: order.id, shortfall: short, stock: { ...this.stock } });
        this.say('Not enough materials: missing ' + costText(short) + '.', 3200);
        return;
      }
      const label = this.label(order, this.affordable());
      for (const k of RES) this.stock[k] -= order.cost[k];
      this.built.push(order.id);
      this.rewardTotal += order.reward;
      this.buildsCount += 1;
      this.log.log(E.RESOURCE_USED, {
        action: 'build_order',
        order_id: order.id,
        cost: { ...order.cost },
        stock_after: { ...this.stock },
        reward: order.reward,
        reward_total: this.rewardTotal,
        build_index: this.buildsCount,
        strategy_label: label,
      });
      if (label !== 'other') this.session.strategies.adopt(label, 'workshop_build', { level_id: 2, order_id: order.id });
      this.say(`Built ${order.name}!  Left: ${this.stock.wood} wood, ${this.stock.metal} metal, ${this.stock.cloth} cloth.`, 3400);
      this.bump();
    };

    this.openChoice(
      `l2_bench_${this.buildsCount + 1 + this.resets * 10}`,
      CAT_PLANNING,
      'Workbench',
      'What would you like to build next?',
      opts,
      chosen,
      { context: { order_no: this.buildsCount + 1 } },
    );
  }

  private reset(): void {
    if (!this.built.length) {
      this.say('The workshop is already fresh.');
      return;
    }
    this.resets += 1;
    this.log.log(E.RETRY, {
      action: 'reset_workshop',
      voluntary: true,
      attempt: this.attempt,
      resets: this.resets,
      discarded_reward: this.rewardTotal,
    });
    this.stock = { ...START_STOCK };
    this.built = [];
    this.rewardTotal = 0;
    this.say('You pulled the lever: stock and orders are reset.');
    this.bump();
  }

  private deliver(): void {
    if (!this.built.length) {
      this.log.log(E.ERROR, { action: 'empty_delivery' });
      this.say('You have nothing to deliver yet.');
      return;
    }
    this.log.log(E.PLAYER_INTERACTION, { action: 'deliver', object_id: 'counter', novel: false, reward_total: this.rewardTotal });
    if (this.rewardTotal < QUOTA) {
      this.fail('quota_missed', { reward_total: this.rewardTotal, quota: QUOTA });
      return;
    }
    const opts: DecisionOption[] = [
      { key: 'take_bonus', label: 'Take the 20-coin bonus (guaranteed)', kind: KIND_SAFE, risk_level: 0.0 },
      { key: 'gamble_bonus', label: 'Gamble: 50% chance of 50 coins, otherwise nothing', kind: KIND_RISKY, risk_level: 0.5 },
    ];
    const chosen = (o: DecisionOption) => {
      const gain = o.key === 'take_bonus' ? 20 : this.rng.random() < 0.5 ? 50 : 0;
      this.log.log(E.REWARD_SELECTED, { action: o.key, chosen_kind: o.kind, reward_value: gain, risk_level: o.risk_level });
      if (o.key === 'gamble_bonus') {
        this.log.log(E.RISK_ACTION, { action: 'gamble_bonus', risk_level: 0.5, success: gain > 0, p_success: 0.5 });
      }
      this.session.coins += gain;
      this.complete({ reward_total: this.rewardTotal, quota: QUOTA, optimal_reward: OPTIMAL, resets: this.resets, builds: this.buildsCount });
    };
    this.openChoice('l2_bonus', CAT_REWARD, 'Order accepted!', `The customer pays ${this.rewardTotal} coins and the foreman offers a bonus.`, opts, chosen);
  }

  hudExtra(): HudItem[] {
    return [
      { label: 'quota', value: String(QUOTA) },
      { label: 'reward', value: String(this.rewardTotal) },
    ];
  }
}
