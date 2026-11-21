/**
 * Level 3 — Workshop Orders. Ability family: planning & numerical reasoning.
 *
 * Redesigned from the original Level 2 "Workshop" (which scored planning *behaviour* as Conscientiousness).
 * Here the task has a defined best answer: choose orders that fit the stock and earn the most coins.
 * The original Level 2 puzzle is kept as item wo5 (same stock and orders).
 *
 * Correct = the chosen set fits the stock AND reaches the optimum value (computed by brute force).
 */
export type Material = 'wood' | 'metal' | 'cloth';

export interface Order {
  id: string;
  label: string;
  cost: Partial<Record<Material, number>>;
  reward: number;
}

export interface OrdersItem {
  id: string;
  version: number;
  practice: boolean;
  /** provisional difficulty rank (1 = easiest); to be re-ordered from pilot p-values */
  difficulty: number;
  stock: Partial<Record<Material, number>>;
  orders: Order[];
  hint: string;
}

const o = (id: string, label: string, cost: Order['cost'], reward: number): Order => ({ id, label, cost, reward });

export const ORDERS_ITEMS: OrdersItem[] = [
  { id: 'wo_practice', version: 1, practice: true, difficulty: 0, stock: { wood: 6 }, hint: 'Two of the orders together use exactly 6 wood.',
    orders: [o('stool', 'Stool', { wood: 2 }, 10), o('shelf', 'Shelf', { wood: 4 }, 18), o('box', 'Box', { wood: 3 }, 12)] },
  { id: 'wo1', version: 1, practice: false, difficulty: 1, stock: { wood: 8 }, hint: 'Try the pair of orders that uses all 8 wood.',
    orders: [o('crate', 'Crate', { wood: 5 }, 30), o('stool', 'Stool', { wood: 3 }, 16), o('shelf', 'Shelf', { wood: 4 }, 22), o('frame', 'Frame', { wood: 2 }, 10)] },
  { id: 'wo2', version: 1, practice: false, difficulty: 2, stock: { wood: 9, metal: 4 }, hint: 'The biggest order is not always the best — check what is left after it.',
    orders: [o('cart', 'Hand cart', { wood: 6, metal: 3 }, 50), o('lantern', 'Lantern', { wood: 1, metal: 2 }, 20), o('chair', 'Chair', { wood: 4 }, 26), o('gate', 'Gate', { wood: 4, metal: 2 }, 34)] },
  { id: 'wo3', version: 1, practice: false, difficulty: 3, stock: { wood: 10, metal: 6 }, hint: 'Three orders can share the metal without running out.',
    orders: [o('cart', 'Hand cart', { wood: 5, metal: 3 }, 45), o('shield', 'Shield', { wood: 2, metal: 3 }, 28), o('crate', 'Crate', { wood: 4 }, 22), o('lamp', 'Lamp', { wood: 1, metal: 2 }, 14), o('bench', 'Bench', { wood: 5, metal: 1 }, 30)] },
  { id: 'wo4', version: 1, practice: false, difficulty: 4, stock: { wood: 12, metal: 7, cloth: 6 }, hint: 'The best plan uses every piece of wood and metal.',
    orders: [o('wagon', 'Wagon', { wood: 7, metal: 4, cloth: 1 }, 70), o('tent', 'Tent', { wood: 3, cloth: 4 }, 38), o('shield', 'Shield', { wood: 2, metal: 3, cloth: 1 }, 36), o('crate', 'Crate', { wood: 4 }, 26), o('kite', 'Kite', { wood: 1, cloth: 2 }, 14), o('lamp', 'Lamp', { wood: 1, metal: 2, cloth: 1 }, 20)] },
  { id: 'wo5', version: 1, practice: false, difficulty: 5, stock: { wood: 10, metal: 6, cloth: 5 }, hint: 'Three orders fit. Check the cloth before choosing the tent.',
    orders: [o('cart', 'Hand cart', { wood: 5, metal: 3 }, 65), o('crate', 'Crate', { wood: 4 }, 45), o('lantern', 'Lantern', { wood: 1, metal: 2, cloth: 1 }, 25), o('banner', 'Banner', { wood: 1, cloth: 3 }, 15), o('shield', 'Shield', { wood: 2, metal: 3, cloth: 1 }, 40), o('tent', 'Tent', { wood: 3, cloth: 4 }, 40)] },
  { id: 'wo6', version: 1, practice: false, difficulty: 6, stock: { wood: 11, metal: 6, cloth: 6 }, hint: 'The boat looks best, but three other orders earn more together.',
    orders: [o('boat', 'Boat', { wood: 6, metal: 2, cloth: 3 }, 62), o('tent', 'Tent', { wood: 3, cloth: 4 }, 36), o('cart', 'Hand cart', { wood: 5, metal: 3 }, 44), o('shield', 'Shield', { wood: 2, metal: 3, cloth: 1 }, 30), o('crate', 'Crate', { wood: 4 }, 24), o('flag', 'Flag', { wood: 1, cloth: 2 }, 12)] },
];

export const MATERIALS: Material[] = ['wood', 'metal', 'cloth'];

export function usage(item: OrdersItem, chosen: readonly string[]): Record<Material, number> {
  const u: Record<Material, number> = { wood: 0, metal: 0, cloth: 0 };
  for (const id of chosen) {
    const ord = item.orders.find((x) => x.id === id);
    if (!ord) continue;
    for (const m of MATERIALS) u[m] += ord.cost[m] ?? 0;
  }
  return u;
}

export function fits(item: OrdersItem, chosen: readonly string[]): boolean {
  const u = usage(item, chosen);
  return MATERIALS.every((m) => u[m] <= (item.stock[m] ?? 0));
}

export const totalReward = (item: OrdersItem, chosen: readonly string[]) =>
  chosen.reduce((s, id) => s + (item.orders.find((x) => x.id === id)?.reward ?? 0), 0);

/** Brute-force optimum (≤ 2^6 subsets). */
export function optimum(item: OrdersItem): { value: number; sets: string[][] } {
  const n = item.orders.length;
  let value = 0;
  let sets: string[][] = [];
  for (let mask = 0; mask < 1 << n; mask++) {
    const ids = item.orders.filter((_, i) => (mask >> i) & 1).map((x) => x.id);
    if (!fits(item, ids)) continue;
    const r = totalReward(item, ids);
    if (r > value) { value = r; sets = [ids]; } else if (r === value) sets.push(ids);
  }
  return { value, sets };
}

export function scoreOrders(item: OrdersItem, chosen: readonly string[]): { correct: boolean; ratio: number; feasible: boolean; reward: number } {
  const feasible = fits(item, chosen);
  const reward = feasible ? totalReward(item, chosen) : 0;
  const best = optimum(item).value;
  return { correct: feasible && reward === best, ratio: best ? reward / best : 0, feasible, reward };
}
