/**
 * Crossroads Caravan route design — a port of build_route / bibd_stats from the original
 * game/levels/level10_caravan.py.
 *
 * Balanced incomplete block design: 6 job types, 10 stops, 3 roads per stop; every type is offered
 * exactly 5 times and every pair of types appears together exactly twice. Picking one road over two
 * others is therefore a preference, and every type has the same number of chances.
 */
import { shuffled } from './rng';
import { CARAVAN_TASKS } from './tasks';

export const BIBD_BLOCKS: readonly (readonly [number, number, number])[] = [
  [0, 1, 2], [0, 1, 3], [0, 2, 4], [0, 3, 5], [0, 4, 5], [1, 2, 5], [1, 3, 4], [1, 4, 5], [2, 3, 4], [2, 3, 5],
];
export const CARAVAN_STOPS = BIBD_BLOCKS.length;
export const CARAVAN_TYPE_IDS = CARAVAN_TASKS.map((t) => t.id);

/** Shuffle type↔point assignment, stop order and on-screen road position. Deterministic for a given rand(). */
export function buildRoute(rand: () => number): string[][] {
  const types = shuffled(CARAVAN_TYPE_IDS, rand);
  const blocks = shuffled(BIBD_BLOCKS.map((b) => [...b]), rand);
  return blocks.map((b) => shuffled(b.map((i) => types[i]), rand));
}

export function bibdStats(route: string[][]): { replication: Record<string, number>; pairCounts: Record<string, number> } {
  const replication: Record<string, number> = Object.fromEntries(CARAVAN_TYPE_IDS.map((t) => [t, 0]));
  const pairCounts: Record<string, number> = {};
  for (const b of route) {
    for (const t of b) replication[t] += 1;
    for (let i = 0; i < b.length; i++)
      for (let j = i + 1; j < b.length; j++) {
        const k = [b[i], b[j]].sort().join('|');
        pairCounts[k] = (pairCounts[k] ?? 0) + 1;
      }
  }
  return { replication, pairCounts };
}
