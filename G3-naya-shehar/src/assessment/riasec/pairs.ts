import { RIASEC, Riasec, ScoredWeek } from '../types';

export type Pair = [Riasec, Riasec];

/** All 15 unordered RIASEC pairs, canonical order (lower index first). */
export const ALL_PAIRS: Pair[] = (() => {
  const out: Pair[] = [];
  for (let i = 0; i < RIASEC.length; i++)
    for (let j = i + 1; j < RIASEC.length; j++) out.push([RIASEC[i], RIASEC[j]]);
  return out;
})();

export const pairKey = (a: Riasec, b: Riasec) => [a, b].sort((x, y) => RIASEC.indexOf(x) - RIASEC.indexOf(y)).join('');

/**
 * Round-robin (1-factorisation of K6): 5 rounds × 3 disjoint pairs, so each
 * round touches every category exactly once. This keeps every week balanced.
 */
export function roundRobinRounds(): Pair[][] {
  const v = RIASEC;
  const rounds: Pair[][] = [];
  for (let r = 0; r < 5; r++) {
    const round: Pair[] = [[v[5], v[r]]];
    for (let k = 1; k <= 2; k++) round.push([v[(r + k) % 5], v[(r - k + 5) % 5]]);
    rounds.push(round);
  }
  return rounds;
}

export interface ScheduledPair {
  week: ScoredWeek;
  /** Order within the week. */
  slot: number;
  left: Riasec;
  right: Riasec;
  /** 1 = first presentation, 2 = repeat (sides swapped). */
  presentation: 1 | 2;
}

/** Number of forced choices per scored week. Sums to 30. */
export const CHOICES_PER_WEEK: Record<ScoredWeek, number> = { 1: 8, 2: 7, 3: 8, 4: 7 };

/**
 * The 30-presentation schedule: every pair once (weeks 1–2), then every pair
 * again with sides swapped (weeks 3–4). Each repeat is two weeks after the
 * first showing, which reduces simple memory effects.
 */
export function buildPairSchedule(): ScheduledPair[] {
  const rounds = roundRobinRounds();
  const first: Pair[] = rounds.flat();
  const second: Pair[] = first.map(([a, b]) => [b, a]);
  const seq: { p: Pair; presentation: 1 | 2 }[] = [
    ...first.map((p) => ({ p, presentation: 1 as const })),
    ...second.map((p) => ({ p, presentation: 2 as const })),
  ];
  const out: ScheduledPair[] = [];
  let i = 0;
  for (const w of [1, 2, 3, 4] as ScoredWeek[]) {
    for (let s = 0; s < CHOICES_PER_WEEK[w]; s++, i++) {
      const { p, presentation } = seq[i];
      out.push({ week: w, slot: s, left: p[0], right: p[1], presentation });
    }
  }
  return out;
}

export const PAIR_SCHEDULE = buildPairSchedule();
