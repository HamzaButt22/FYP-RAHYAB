import { Level } from '../../types';
import { RoutePuzzle, Stop } from '../puzzleTypes';

export const manhattan = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

export function routeLength(start: Stop, ordered: Stop[], returnToStart: boolean): number {
  let d = 0;
  let cur: Stop = start;
  for (const s of ordered) { d += manhattan(cur, s); cur = s; }
  if (returnToStart) d += manhattan(cur, start);
  return d;
}

export function respectsOrder(ordered: Stop[], before: [string, string][]): boolean {
  const pos = new Map(ordered.map((s, i) => [s.id, i] as const));
  return before.every(([a, b]) => (pos.get(a) ?? -1) < (pos.get(b) ?? -1));
}

function permutations<T>(xs: T[]): T[][] {
  if (xs.length <= 1) return [xs];
  const out: T[][] = [];
  xs.forEach((x, i) => permutations([...xs.slice(0, i), ...xs.slice(i + 1)]).forEach((p) => out.push([x, ...p])));
  return out;
}

/** Brute-force shortest valid route (≤ 6 stops → ≤ 720 permutations). */
export function optimalLength(start: Stop, stops: Stop[], before: [string, string][], returnToStart: boolean): number {
  let best = Infinity;
  for (const p of permutations(stops)) {
    if (!respectsOrder(p, before)) continue;
    best = Math.min(best, routeLength(start, p, returnToStart));
  }
  return best;
}

const PLACES = ['School', 'Health Unit', 'Bank', 'Pump', 'Library', 'Market', 'Bridge', 'Radio', 'Post Office', 'Workshop'];

interface Spec { n: number; level: Level; start: [number, number]; stops: [number, number][]; before?: [number, number][]; ret: boolean }

const SPECS: Spec[] = [
  { n: 1, level: 1, start: [0, 0], stops: [[4, 0], [4, 3], [1, 3]], ret: false },
  { n: 2, level: 1, start: [3, 3], stops: [[0, 1], [6, 1], [3, 6]], ret: false },
  { n: 3, level: 1, start: [0, 6], stops: [[2, 1], [5, 5], [1, 4]], ret: false },
  { n: 4, level: 1, start: [6, 0], stops: [[1, 1], [5, 4], [2, 5]], ret: false },
  { n: 5, level: 2, start: [3, 3], stops: [[1, 1], [5, 1], [5, 5], [1, 5]], ret: true },
  { n: 6, level: 2, start: [0, 0], stops: [[2, 4], [5, 1], [6, 6], [1, 6]], ret: true },
  { n: 7, level: 2, start: [6, 3], stops: [[2, 0], [0, 4], [4, 6], [3, 2]], ret: true },
  { n: 8, level: 2, start: [3, 0], stops: [[0, 3], [6, 2], [4, 5], [1, 6]], ret: true },
  { n: 9, level: 3, start: [0, 3], stops: [[2, 0], [5, 1], [6, 4], [3, 6], [1, 5]], ret: false },
  { n: 10, level: 3, start: [3, 3], stops: [[0, 0], [6, 0], [6, 6], [0, 6], [3, 1]], ret: false },
  { n: 11, level: 3, start: [6, 6], stops: [[1, 0], [4, 2], [0, 3], [5, 4], [2, 5]], ret: false },
  { n: 12, level: 3, start: [0, 0], stops: [[6, 1], [1, 2], [4, 4], [2, 6], [6, 5]], ret: false },
  { n: 13, level: 4, start: [3, 3], stops: [[0, 1], [5, 0], [6, 5], [1, 6], [3, 0]], before: [[3, 1], [2, 4]], ret: true },
  { n: 14, level: 4, start: [0, 6], stops: [[1, 1], [4, 0], [6, 3], [3, 5], [5, 6]], before: [[4, 0], [1, 2]], ret: true },
  { n: 15, level: 4, start: [6, 0], stops: [[0, 0], [2, 3], [5, 3], [0, 6], [4, 6]], before: [[3, 1], [0, 4]], ret: true },
  { n: 16, level: 4, start: [3, 6], stops: [[0, 2], [2, 0], [5, 1], [6, 4], [1, 4], [4, 3]], before: [[2, 0]], ret: true },
];

function build(spec: Spec): RoutePuzzle {
  const start: Stop = { id: 'start', label: 'Bus Depot', x: spec.start[0], y: spec.start[1] };
  const stops: Stop[] = spec.stops.map(([x, y], i) => ({ id: `s${i}`, label: PLACES[(i + spec.n) % PLACES.length], x, y }));
  const before: [string, string][] = (spec.before ?? []).map(([a, b]) => [`s${a}`, `s${b}`]);
  const ruleText = before.map(([a, b]) => `${stops.find((s) => s.id === a)!.label} before ${stops.find((s) => s.id === b)!.label}`);
  return {
    id: `PLN-${String(spec.n).padStart(2, '0')}`,
    family: 'PLN',
    level: spec.level,
    kind: 'route',
    story: spec.ret
      ? 'Kamran’s town bus must visit every stop and come back to the depot.'
      : 'The town bus starts at the depot and must visit every stop.',
    prompt: `Tap the stops in the order the bus should go. Make the trip as short as you can.${ruleText.length ? ` Rules: ${ruleText.join('; ')}.` : ''}`,
    grid: 7,
    start,
    stops,
    before,
    returnToStart: spec.ret,
    optimal: optimalLength(start, stops, before, spec.ret),
  };
}

export const PLN_BANK: RoutePuzzle[] = SPECS.map(build);
