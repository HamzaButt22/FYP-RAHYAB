import { Cell } from './puzzleTypes';

/** Shift cells so the minimum x and y are 0, then sort. */
export function normalize(cells: Cell[]): Cell[] {
  const minX = Math.min(...cells.map((c) => c[0]));
  const minY = Math.min(...cells.map((c) => c[1]));
  return cells.map(([x, y]) => [x - minX, y - minY] as Cell).sort((a, b) => a[1] - b[1] || a[0] - b[0]);
}

export const rotate90 = (cells: Cell[]): Cell[] => normalize(cells.map(([x, y]) => [-y, x] as Cell));
export const mirror = (cells: Cell[]): Cell[] => normalize(cells.map(([x, y]) => [-x, y] as Cell));

export function rotateTimes(cells: Cell[], k: number): Cell[] {
  let out = normalize(cells);
  for (let i = 0; i < ((k % 4) + 4) % 4; i++) out = rotate90(out);
  return out;
}

const key = (cells: Cell[]) => normalize(cells).map((c) => c.join(',')).join(';');

/** True if `b` can be obtained from `a` by rotation only (no flipping). */
export function sameUnderRotation(a: Cell[], b: Cell[]): boolean {
  const kb = key(b);
  for (let k = 0; k < 4; k++) if (key(rotateTimes(a, k)) === kb) return true;
  return false;
}

export const isChiral = (cells: Cell[]) => !sameUnderRotation(cells, mirror(cells));

/** Deterministic PRNG (mulberry32) so content is identical on every device. */
export function rng(seed: number) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffleWithAnswer<T>(correct: T, wrong: T[], seed: number): { options: T[]; answer: number } {
  const r = rng(seed);
  const all = [correct, ...wrong];
  const order = all.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return { options: order.map((i) => all[i]), answer: order.indexOf(0) };
}
