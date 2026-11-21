import { LOCK_ITEMS, solutions, isCorrectCode } from '../core/items/vaultLocks';
import { MAP_ITEMS, mapOptions, allTransforms, key, turn, isCorrectMap } from '../core/items/mapRoom';
import { PATTERN_ITEMS, samePanel, type Panel, type Shape } from '../core/items/patternGate';
import { ORDERS_ITEMS, optimum, scoreOrders, fits } from '../core/items/workshopOrders';

describe('Vault Locks', () => {
  it.each(LOCK_ITEMS.map((i) => [i.id, i] as const))('%s has exactly one solution, equal to the key, and every clue is needed', (_id, it) => {
    const sols = solutions(it.clues);
    expect(sols).toHaveLength(1);
    expect(isCorrectCode(it, sols[0])).toBe(true);
    it.clues.forEach((_, k) => expect(solutions(it.clues.filter((__, j) => j !== k)).length).toBeGreaterThan(1));
  });
  it('has 1 practice + 6 scored items with rising provisional difficulty', () => {
    expect(LOCK_ITEMS.filter((i) => i.practice)).toHaveLength(1);
    const d = LOCK_ITEMS.filter((i) => !i.practice).map((i) => i.difficulty);
    expect(d).toEqual([1, 2, 3, 4, 5, 6]);
  });
});

describe('Map Room', () => {
  it.each(MAP_ITEMS.map((i) => [i.id, i] as const))('%s: pattern is chiral and exactly one option is a rotation', (_id, it) => {
    expect(new Set(allTransforms(it.pattern)).size).toBe(8);
    const opts = mapOptions(it);
    expect(new Set(opts.map(key)).size).toBe(4);
    const rotations = new Set([0, 1, 2, 3].map((k) => key(turn(it.pattern, k))));
    const rotIdx = opts.map((o, i) => (rotations.has(key(o)) ? i : -1)).filter((i) => i >= 0);
    expect(rotIdx).toEqual([it.correctIndex]);
    expect(isCorrectMap(it, it.correctIndex)).toBe(true);
    // the correct option is never the unturned target itself
    expect(key(opts[it.correctIndex])).not.toBe(key(it.pattern));
  });
});

describe('Pattern Gate', () => {
  // Independent re-statement of each rule: the expected 5th panel.
  const cyc = <T,>(xs: T[], i: number) => xs[i % xs.length];
  const expected: Record<string, Panel> = {
    pg_practice: { shape: 'circle', count: 5, filled: true },
    pg1: { shape: cyc<Shape>(['circle', 'square', 'triangle'], 4), count: 1, filled: true },
    pg2: { shape: 'square', count: 5, filled: true },
    pg3: { shape: cyc<Shape>(['triangle', 'diamond'], 4), count: 1, filled: true },
    pg4: { shape: 'diamond', count: 3, filled: true },
    pg5: { shape: cyc<Shape>(['circle', 'square', 'triangle'], 4), count: 5, filled: cyc([true, true, false], 4) },
    pg6: { shape: cyc<Shape>(['circle', 'square', 'triangle', 'diamond'], 4), count: 1, filled: false },
  };
  it.each(PATTERN_ITEMS.map((i) => [i.id, i] as const))('%s: keyed answer follows the rule; options are distinct', (id, it) => {
    expect(samePanel(it.options[it.correctIndex], expected[id])).toBe(true);
    const keys = it.options.map((p) => `${p.shape}${p.count}${p.filled}`);
    expect(new Set(keys).size).toBe(4);
    it.options.forEach((p, i) => { if (i !== it.correctIndex) expect(samePanel(p, expected[id])).toBe(false); });
  });
  it('correct answers are spread over option positions', () => {
    expect(new Set(PATTERN_ITEMS.map((i) => i.correctIndex)).size).toBeGreaterThanOrEqual(3);
  });
});

describe('Workshop Orders', () => {
  it.each(ORDERS_ITEMS.map((i) => [i.id, i] as const))('%s has a unique best combination', (_id, it) => {
    const { value, sets } = optimum(it);
    expect(value).toBeGreaterThan(0);
    expect(sets).toHaveLength(1);
    expect(scoreOrders(it, sets[0]).correct).toBe(true);
  });
  it('keeps the original Level 2 workshop puzzle (same stock and orders) as wo5', () => {
    const it = ORDERS_ITEMS.find((i) => i.id === 'wo5')!;
    expect(it.stock).toEqual({ wood: 10, metal: 6, cloth: 5 });
    expect(optimum(it).value).toBe(145);
  });
  it('a greedy biggest-first choice fails on at least 4 scored items (they need planning)', () => {
    let fails = 0;
    for (const it of ORDERS_ITEMS.filter((i) => !i.practice)) {
      const chosen: string[] = [];
      for (const o of [...it.orders].sort((a, b) => b.reward - a.reward)) if (fits(it, [...chosen, o.id])) chosen.push(o.id);
      if (!scoreOrders(it, chosen).correct) fails++;
    }
    expect(fails).toBeGreaterThanOrEqual(4);
  });
  it('an over-budget answer is never correct', () => {
    const it = ORDERS_ITEMS[1];
    expect(scoreOrders(it, it.orders.map((o) => o.id))).toMatchObject({ feasible: false, correct: false });
  });
});
