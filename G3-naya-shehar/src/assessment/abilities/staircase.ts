import { AbilityFamily, Level, MAX_LEVEL, MIN_LEVEL } from '../types';
import { Puzzle, RoutePuzzle, Stop } from './puzzleTypes';
import { PUZZLE_BANK } from './bank';
import { respectsOrder, routeLength } from './bank/pln';

export const STARTING_LEVEL: Level = 2;

/** 1-up / 1-down staircase on the FIRST attempt only. */
export function nextLevel(current: Level, firstAttemptCorrect: boolean): Level {
  const n = current + (firstAttemptCorrect ? 1 : -1);
  return Math.max(MIN_LEVEL, Math.min(MAX_LEVEL, n)) as Level;
}

/**
 * Pick the next unseen puzzle at the target level. If that level is used up,
 * search the nearest levels (target±1, ±2 …), preferring the harder one after a
 * correct answer. The level actually presented is what gets recorded.
 */
export function pickPuzzle(family: AbilityFamily, target: Level, seen: ReadonlySet<string>): Puzzle | null {
  const bank = PUZZLE_BANK[family];
  const order: number[] = [target];
  for (let d = 1; d <= 3; d++) order.push(target + d, target - d);
  for (const lvl of order) {
    if (lvl < MIN_LEVEL || lvl > MAX_LEVEL) continue;
    const p = bank.find((x) => x.level === lvl && !seen.has(x.id));
    if (p) return p;
  }
  return null;
}

export type Answer =
  | { kind: 'index'; value: number }
  | { kind: 'number'; value: number }
  | { kind: 'route'; order: string[] };

export interface CheckResult { correct: boolean; detail?: { yours: number; best: number } }

export function checkAnswer(p: Puzzle, a: Answer): CheckResult {
  switch (p.kind) {
    case 'fit':
    case 'sequence':
    case 'choice':
      return { correct: a.kind === 'index' && a.value === p.answer };
    case 'numeric':
      return { correct: a.kind === 'number' && a.value === p.answer };
    case 'route': {
      if (a.kind !== 'route') return { correct: false };
      return checkRoute(p, a.order);
    }
  }
}

export function checkRoute(p: RoutePuzzle, order: string[]): CheckResult {
  const unique = new Set(order);
  if (unique.size !== p.stops.length || order.length !== p.stops.length) return { correct: false };
  const ordered = order.map((id) => p.stops.find((s) => s.id === id)).filter(Boolean) as Stop[];
  if (ordered.length !== p.stops.length) return { correct: false };
  const yours = routeLength(p.start, ordered, p.returnToStart);
  const valid = respectsOrder(ordered, p.before);
  return { correct: valid && yours === p.optimal, detail: { yours, best: p.optimal } };
}
