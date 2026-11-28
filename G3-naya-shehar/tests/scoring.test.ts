import { fitBradleyTerry, scoreInterests, toComparisons } from '@/assessment/scoring/riasec';
import { eap, scoreAbilities } from '@/assessment/scoring/abilities';
import { validateEvent } from '@/assessment/events';
import { nextLevel, pickPuzzle, checkAnswer } from '@/assessment/abilities/staircase';
import { AssessmentEvent, StoredEvent, RIASEC, Riasec } from '@/assessment/types';
import { PUZZLE_BANK } from '@/assessment/abilities/bank';
import { RoutePuzzle } from '@/assessment/abilities/puzzleTypes';
import { PAIR_SCHEDULE } from '@/assessment/riasec/pairs';
import { rng } from '@/assessment/abilities/geometry';

const wrap = (event: AssessmentEvent, measured = true): StoredEvent => ({ seq: 0, recordedAt: '', sessionId: 's', measured, event });

describe('event validation', () => {
  test('accepts valid events and rejects malformed ones', () => {
    expect(validateEvent({ type: 'choice_made', itemId: 'FC-W1-01', week: 1, presented: ['C', 'R'], chosen: 'R' })).toEqual([]);
    expect(validateEvent({ type: 'choice_made', itemId: 'x', week: 1, presented: ['R', 'R'], chosen: 'R' }).length).toBeGreaterThan(0);
    expect(validateEvent({ type: 'choice_made', itemId: 'x', week: 1, presented: ['C', 'R'], chosen: 'A' }).length).toBeGreaterThan(0);
    expect(validateEvent({ type: 'plan_committed', itemId: 'P', week: 1, offered: [...RIASEC], ranked: ['R', 'R', 'I'] }).length).toBeGreaterThan(0);
    expect(validateEvent({ type: 'task_result', itemId: 'NUM-01', week: 1, family: 'SPA', level: 1, firstAttemptCorrect: true, solved: true, attempts: 1 }).length).toBeGreaterThan(0);
    expect(validateEvent({ type: 'reaction', itemId: 'x', week: 1, category: 'R', value: 'loved', rt: 1200 } as never)).toContain('forbidden field rt');
  });
});

describe('Bradley–Terry interim model', () => {
  test('no evidence → all θ = 0 and SE = prior SD', () => {
    const { theta, se } = fitBradleyTerry([]);
    theta.forEach((t) => expect(t).toBeCloseTo(0, 8));
    se.forEach((s) => expect(s).toBeCloseTo(1, 6));
  });

  test('planner decomposes into 12 weighted comparisons; reactions map to anchor', () => {
    const comps = toComparisons([
      { type: 'plan_committed', itemId: 'P', week: 1, offered: [...RIASEC], ranked: ['A', 'S', 'E'] },
      { type: 'reaction', itemId: 'x', week: 1, category: 'R', value: 'okay' },
      { type: 'reaction', itemId: 'x', week: 1, category: 'R', value: 'meh' },
    ]);
    expect(comps.filter((c) => c.weight === 0.5)).toHaveLength(12);
    expect(comps.filter((c) => c.winner === 'anchor')).toHaveLength(1);
  });

  test('practice and unmeasured events are excluded', () => {
    const e: AssessmentEvent = { type: 'choice_made', itemId: 'FC-W1-01', week: 1, presented: ['C', 'R'], chosen: 'R' };
    expect(scoreInterests([wrap(e, false)]).comparisons).toBe(0);
    expect(scoreInterests([wrap({ ...e, week: 0 })]).comparisons).toBe(0);
    expect(scoreInterests([wrap(e)]).comparisons).toBe(1);
  });

  test('parameter recovery: noisy simulated players, top category recovered most of the time', () => {
    const r = rng(42);
    let topHit = 0;
    const N = 200;
    for (let n = 0; n < N; n++) {
      const true_ = RIASEC.map(() => (r() - 0.5) * 3);
      const pick = (a: Riasec, b: Riasec) => (r() < 1 / (1 + Math.exp(-(true_[RIASEC.indexOf(a)] - true_[RIASEC.indexOf(b)]))) ? a : b);
      const events: StoredEvent[] = PAIR_SCHEDULE.map((p) => wrap({ type: 'choice_made', itemId: 'x', week: p.week, presented: [p.left, p.right], chosen: pick(p.left, p.right) }));
      for (const w of [1, 2, 3, 4] as const) {
        const noisy = RIASEC.map((c, i) => ({ c, u: true_[i] + (r() - 0.5) }));
        events.push(wrap({ type: 'plan_committed', itemId: `P${w}`, week: w, offered: [...RIASEC], ranked: noisy.sort((a, b) => b.u - a.u).slice(0, 3).map((x) => x.c) }));
      }
      const prof = scoreInterests(events);
      const trueTop = RIASEC[true_.indexOf(Math.max(...true_))];
      if (prof.order.slice(0, 2).includes(trueTop)) topHit++;
    }
    // Interim target: true top category in the estimated top two in ≥ 85% of simulated players.
    expect(topHit / N).toBeGreaterThanOrEqual(0.85);
  });

  test('full evidence gives at least medium confidence; one week alone gives less', () => {
    const all: StoredEvent[] = PAIR_SCHEDULE.map((p) => wrap({ type: 'choice_made', itemId: 'x', week: p.week, presented: [p.left, p.right], chosen: p.left }));
    const oneWeek = all.filter((e) => e.event.week === 1);
    const full = scoreInterests(all).scores.map((s) => s.se);
    const part = scoreInterests(oneWeek).scores.map((s) => s.se);
    expect(Math.max(...full)).toBeLessThan(0.7);
    expect(Math.min(...part)).toBeGreaterThan(Math.max(...full) - 0.05);
  });
});

describe('ability scoring', () => {
  test('EAP: more correct at harder levels → higher θ; no data → prior', () => {
    expect(eap([]).theta).toBeCloseTo(0, 3);
    const strong = eap([{ level: 3, correct: true }, { level: 4, correct: true }, { level: 4, correct: false }]);
    const weak = eap([{ level: 2, correct: false }, { level: 1, correct: false }, { level: 1, correct: true }]);
    expect(strong.theta).toBeGreaterThan(weak.theta);
  });

  test('only first-attempt outcome matters (eventual solve ignored)', () => {
    const a = scoreAbilities([wrap({ type: 'task_result', itemId: 'NUM-05', week: 1, family: 'NUM', level: 2, firstAttemptCorrect: false, solved: true, attempts: 3 })]);
    const b = scoreAbilities([wrap({ type: 'task_result', itemId: 'NUM-05', week: 1, family: 'NUM', level: 2, firstAttemptCorrect: false, solved: false, attempts: 1 })]);
    expect(a).toEqual(b);
  });
});

describe('staircase rules', () => {
  test('one up, one down, bounded', () => {
    expect(nextLevel(2, true)).toBe(3);
    expect(nextLevel(2, false)).toBe(1);
    expect(nextLevel(4, true)).toBe(4);
    expect(nextLevel(1, false)).toBe(1);
  });

  test('falls back to the nearest level when a level is used up', () => {
    const seen = new Set(PUZZLE_BANK.SPA.filter((p) => p.level === 4).map((p) => p.id));
    expect(pickPuzzle('SPA', 4, seen)!.level).toBe(3);
    expect(pickPuzzle('SPA', 4, new Set(PUZZLE_BANK.SPA.map((p) => p.id)))).toBeNull();
  });

  test('checkAnswer validates correct and incorrect answers for every puzzle', () => {
    for (const fam of Object.values(PUZZLE_BANK)) for (const p of fam) {
      if (p.kind === 'numeric') {
        expect(checkAnswer(p, { kind: 'number', value: p.answer }).correct).toBe(true);
        expect(checkAnswer(p, { kind: 'number', value: p.answer + 1 }).correct).toBe(false);
      } else if (p.kind === 'route') {
        const rp = p as RoutePuzzle;
        expect(checkAnswer(rp, { kind: 'route', order: rp.stops.slice(0, -1).map((s) => s.id) }).correct).toBe(false);
      } else {
        expect(checkAnswer(p, { kind: 'index', value: p.answer }).correct).toBe(true);
        expect(checkAnswer(p, { kind: 'index', value: (p.answer + 1) % 4 }).correct).toBe(false);
      }
    }
  });
});
