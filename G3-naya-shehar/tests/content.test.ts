import { ALL_PAIRS, PAIR_SCHEDULE, pairKey, roundRobinRounds } from '@/assessment/riasec/pairs';
import { CHOICE_SCENARIOS } from '@/game/content/choices';
import { PLANNER_SETS } from '@/game/content/planner';
import { RIASEC, ABILITY_FAMILIES, ScoredWeek } from '@/assessment/types';
import { PUZZLE_BANK, ALL_PUZZLES, PRACTICE_PUZZLES } from '@/assessment/abilities/bank';
import { sameUnderRotation } from '@/assessment/abilities/geometry';
import { optimalLength, manhattan } from '@/assessment/abilities/bank/pln';
import { buildWeekPlan, scenarioFor } from '@/game/progression/sessionPlan';
import { buildingById } from '@/game/world/buildings';
import { isDistrictUnlocked } from '@/game/world/districts';
import { RoutePuzzle, Tile } from '@/assessment/abilities/puzzleTypes';

describe('RIASEC pair schedule', () => {
  test('15 unique pairs', () => {
    expect(ALL_PAIRS).toHaveLength(15);
    expect(new Set(ALL_PAIRS.map(([a, b]) => pairKey(a, b))).size).toBe(15);
  });

  test('round robin: every round uses each category exactly once', () => {
    for (const round of roundRobinRounds()) {
      expect(round.flat().sort()).toEqual([...RIASEC].sort());
    }
  });

  test('30 presentations: each pair exactly twice, second time sides swapped and in a later week', () => {
    expect(PAIR_SCHEDULE).toHaveLength(30);
    const byPair = new Map<string, typeof PAIR_SCHEDULE>();
    for (const p of PAIR_SCHEDULE) {
      expect(p.left).not.toBe(p.right);
      const k = pairKey(p.left, p.right);
      byPair.set(k, [...(byPair.get(k) ?? []), p]);
    }
    expect(byPair.size).toBe(15);
    for (const [, ps] of byPair) {
      expect(ps).toHaveLength(2);
      const [a, b] = ps;
      expect(a.presentation).toBe(1);
      expect(b.presentation).toBe(2);
      expect(b.left).toBe(a.right);
      expect(b.right).toBe(a.left);
      expect(b.week).toBeGreaterThan(a.week);
    }
  });

  test('each category appears on the left and right equally often overall', () => {
    for (const c of RIASEC) {
      const left = PAIR_SCHEDULE.filter((p) => p.left === c).length;
      const right = PAIR_SCHEDULE.filter((p) => p.right === c).length;
      expect(left).toBe(5);
      expect(right).toBe(5);
    }
  });

  test('every week shows every category at least twice', () => {
    for (const w of [1, 2, 3, 4] as ScoredWeek[]) {
      for (const c of RIASEC) {
        const n = PAIR_SCHEDULE.filter((p) => p.week === w && (p.left === c || p.right === c)).length;
        expect(n).toBeGreaterThanOrEqual(2);
      }
    }
  });
});

describe('forced-choice scenarios', () => {
  test('30 scenarios with unique ids, each matched to exactly one scheduled slot', () => {
    expect(CHOICE_SCENARIOS).toHaveLength(30);
    expect(new Set(CHOICE_SCENARIOS.map((s) => s.id)).size).toBe(30);
    const used = PAIR_SCHEDULE.map((p) => scenarioFor(p.week, p.left, p.right).id);
    expect(new Set(used).size).toBe(30);
  });

  test('options compare two different categories with balanced text length', () => {
    for (const s of CHOICE_SCENARIOS) {
      const [a, b] = s.options;
      expect(a.category).not.toBe(b.category);
      const ratio = Math.max(a.text.length, b.text.length) / Math.min(a.text.length, b.text.length);
      expect(ratio).toBeLessThan(1.35);
      const tr = Math.max(a.title.length, b.title.length) / Math.min(a.title.length, b.title.length);
      expect(tr).toBeLessThan(1.8);
    }
  });

  test('no questionnaire-style wording', () => {
    const banned = /(do you (like|enjoy)|how much do|rate (your|how)|(strongly )?(dis)?agree (with|that)|on a scale)/i;
    for (const s of CHOICE_SCENARIOS) {
      expect(s.setup).not.toMatch(banned);
      for (const o of s.options) expect(o.text).not.toMatch(banned);
    }
  });

  test('each scenario building is unlocked in its week', () => {
    for (const s of CHOICE_SCENARIOS) expect(isDistrictUnlocked(buildingById(s.building).district, s.week)).toBe(true);
  });

  test('girls and boys appear across categories (partners Ayesha and Bilal both do R, I, A, S, E, C work)', () => {
    const all = [...CHOICE_SCENARIOS.flatMap((s) => s.options), ...PLANNER_SETS.flatMap((p) => p.activities)];
    for (const kid of ['ayesha', 'bilal'] as const) {
      const cats = new Set(all.filter((o) => o.partner === kid).map((o) => o.category));
      expect([...cats].sort()).toEqual([...RIASEC].sort());
    }
  });
});

describe('weekly planner', () => {
  test('one set per week, one activity per category, unique ids, unlocked buildings', () => {
    expect(PLANNER_SETS.map((p) => p.week)).toEqual([1, 2, 3, 4]);
    const ids = new Set<string>();
    for (const set of PLANNER_SETS) {
      expect(set.activities.map((a) => a.category).sort()).toEqual([...RIASEC].sort());
      for (const a of set.activities) {
        expect(ids.has(a.id)).toBe(false);
        ids.add(a.id);
        expect(isDistrictUnlocked(buildingById(a.building).district, set.week)).toBe(true);
      }
    }
  });
});

describe('puzzle bank', () => {
  test('≥ 12 puzzles per family, ≥ 3 per level, all four levels, ≥ 72 total', () => {
    expect(ALL_PUZZLES.length).toBeGreaterThanOrEqual(72);
    for (const f of ABILITY_FAMILIES) {
      const bank = PUZZLE_BANK[f];
      expect(bank.length).toBeGreaterThanOrEqual(12);
      for (const lvl of [1, 2, 3, 4]) expect(bank.filter((p) => p.level === lvl).length).toBeGreaterThanOrEqual(3);
      for (const p of bank) expect(p.family).toBe(f);
    }
  });

  test('all ids are unique and well-formed', () => {
    const all = [...ALL_PUZZLES, ...PRACTICE_PUZZLES];
    expect(new Set(all.map((p) => p.id)).size).toBe(all.length);
    for (const p of ALL_PUZZLES) expect(p.id).toMatch(/^(SPA|ABS|NUM|LOG|PLN|VRB)-\d{2}$/);
    for (const p of PRACTICE_PUZZLES) expect(p.practice).toBe(true);
  });

  test('every puzzle has instructions and a valid answer key', () => {
    for (const p of [...ALL_PUZZLES, ...PRACTICE_PUZZLES]) {
      expect(p.prompt.length).toBeGreaterThan(8);
      expect(p.story.length).toBeGreaterThan(8);
      if (p.kind === 'fit' || p.kind === 'sequence' || p.kind === 'choice') {
        expect(p.answer).toBeGreaterThanOrEqual(0);
        expect(p.answer).toBeLessThan(p.options.length);
        expect(p.options.length).toBe(4);
      }
      if (p.kind === 'numeric') expect(Number.isInteger(p.answer)).toBe(true);
    }
  });

  test('SPA: exactly one option is the gap shape turned; distractors cannot be turned into it', () => {
    for (const p of PUZZLE_BANK.SPA) {
      if (p.kind !== 'fit') throw new Error('SPA must be fit');
      const matches = p.options.filter((o) => sameUnderRotation(o, p.gap));
      expect(matches).toHaveLength(1);
      expect(sameUnderRotation(p.options[p.answer], p.gap)).toBe(true);
    }
  });

  test('ABS: options are all different tiles', () => {
    const k = (t: Tile) => `${t.shape}${t.count}${t.fill}${t.rot}`;
    for (const p of PUZZLE_BANK.ABS) {
      if (p.kind !== 'sequence') throw new Error('ABS must be sequence');
      expect(new Set(p.options.map(k)).size).toBe(4);
      expect(p.tiles.filter((t) => t === null)).toHaveLength(1);
      expect(p.tiles.length).toBe(p.layout === 'grid' ? 9 : p.tiles.length);
    }
  });

  test('NUM answers re-derived independently', () => {
    const expected: Record<string, number> = {
      'NUM-01': 4 * 500, 'NUM-02': 50 - 36, 'NUM-03': 3 * 12, 'NUM-04': 8 * 5,
      'NUM-05': 9000 / 3, 'NUM-06': 6000 / 1200, 'NUM-07': Math.ceil(27 / 6), 'NUM-08': 4 * 35 * 2,
      'NUM-09': 0.25 * 20000, 'NUM-10': (40 * 3) / 5, 'NUM-11': (30 / 45) * 60, 'NUM-12': 800 * 0.85,
      'NUM-13': 2 * ((12000 - 3000) / 4 + 1000), 'NUM-14': (18 / 3 / 2) * 5 * 3, 'NUM-15': 20 * 3 - 12 - 18,
    };
    // NUM-16: solve 50a + 20(40-a) = 1400 by search
    for (let a = 0; a <= 40; a++) if (50 * a + 20 * (40 - a) === 1400) expected['NUM-16'] = a;
    for (const p of PUZZLE_BANK.NUM) {
      if (p.kind !== 'numeric') throw new Error('NUM must be numeric');
      expect(p.answer).toBeCloseTo(expected[p.id], 6);
    }
  });

  test('LOG-15 (one true sign) and LOG-13 (houses) have unique solutions', () => {
    const places = ['bank', 'library', 'post'];
    const sols = places.filter((k) => [k === 'bank', k !== 'library', k !== 'bank'].filter(Boolean).length === 1);
    expect(sols).toEqual(['library']);
    const perms = (xs: string[]): string[][] => xs.length <= 1 ? [xs] : xs.flatMap((x, i) => perms([...xs.slice(0, i), ...xs.slice(i + 1)]).map((p) => [x, ...p]));
    const valid = perms(['A', 'B', 'K', 'Z']).filter((h) => h[0] === 'B' && Math.abs(h.indexOf('A') - 0) !== 1 && Math.abs(h.indexOf('K') - h.indexOf('Z')) === 1);
    expect(new Set(valid.map((h) => h[3]))).toEqual(new Set(['A']));
  });

  test('PLN: optimal length re-verified and trivially-ordered route is not always optimal', () => {
    let nonTrivial = 0;
    for (const p of PUZZLE_BANK.PLN as RoutePuzzle[]) {
      expect(optimalLength(p.start, p.stops, p.before, p.returnToStart)).toBe(p.optimal);
      const naive = p.stops.reduce((acc, s, i) => acc + manhattan(i ? p.stops[i - 1] : p.start, s), 0) + (p.returnToStart ? manhattan(p.stops[p.stops.length - 1], p.start) : 0);
      if (naive > p.optimal) nonTrivial++;
      expect(new Set(p.stops.map((s) => s.label)).size).toBe(p.stops.length);
    }
    expect(nonTrivial).toBeGreaterThanOrEqual(12);
  });
});

describe('week plans', () => {
  test('prologue has no scored steps', () => {
    const plan = buildWeekPlan(0);
    expect(plan.some((s) => s.kind === 'planner' || s.kind === 'puzzle')).toBe(false);
    expect(plan.filter((s) => s.kind === 'choice').every((s) => s.kind === 'choice' && s.practice)).toBe(true);
  });

  test('scored weeks: planner, all scheduled choices, 2 puzzles per family, 3 planned activities, letter', () => {
    for (const w of [1, 2, 3, 4] as ScoredWeek[]) {
      const plan = buildWeekPlan(w);
      expect(plan.filter((s) => s.kind === 'planner')).toHaveLength(1);
      expect(plan.filter((s) => s.kind === 'choice')).toHaveLength(PAIR_SCHEDULE.filter((p) => p.week === w).length);
      for (const f of ABILITY_FAMILIES) expect(plan.filter((s) => s.kind === 'puzzle' && s.family === f)).toHaveLength(2);
      expect(plan.filter((s) => s.kind === 'planned')).toHaveLength(3);
      expect(plan[plan.length - 1].kind).toBe('complete');
      expect(plan.findIndex((s) => s.kind === 'planner')).toBeLessThan(plan.findIndex((s) => s.kind === 'planned'));
      // no more than two puzzles in a row
      let run = 0, maxRun = 0;
      for (const s of plan) { run = s.kind === 'puzzle' ? run + 1 : 0; maxRun = Math.max(maxRun, run); }
      expect(maxRun).toBeLessThanOrEqual(2);
    }
  });
});
