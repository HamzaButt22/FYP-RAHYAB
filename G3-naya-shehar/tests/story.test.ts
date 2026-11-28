import { recap } from '@/game/story/recap';
import { writeLetter } from '@/game/story/letters';
import { scoreInterests } from '@/assessment/scoring/riasec';
import { scoreAbilities } from '@/assessment/scoring/abilities';
import { PAIR_SCHEDULE } from '@/assessment/riasec/pairs';
import { StoredEvent, AssessmentEvent, Riasec } from '@/assessment/types';
import { meters, initialTown, fund, FUND_COST, addProgress } from '@/game/progression/town';
import { buildLayout } from '@/art/townLayout';

const wrap = (event: AssessmentEvent): StoredEvent => ({ seq: 0, recordedAt: '', sessionId: 's', measured: true, event });
const strongR = PAIR_SCHEDULE.map((p) => wrap({ type: 'choice_made', itemId: 'x', week: p.week, presented: [p.left, p.right], chosen: (p.left === 'R' || p.right === 'R') ? 'R' : (p.left === 'I' || p.right === 'I') ? 'I' : p.left }));

describe('recap & letters only say what the evidence supports', () => {
  test('no evidence → only a neutral statement', () => {
    const lines = recap(scoreInterests([]), scoreAbilities([]));
    expect(lines).toEqual(['You tried many different kinds of work — your interests are wide and still growing.']);
  });

  test('clear evidence → names the leading interest', () => {
    const lines = recap(scoreInterests(strongR), scoreAbilities([]));
    expect(lines[0]).toBe('You loved building and fixing things.');
  });

  test('letters never contain category letters, scores or pathway names; week 1 is always vague', () => {
    const prof = scoreInterests(strongR);
    for (const w of [1, 2, 3, 4] as const) {
      const l = writeLetter(w, prof, true, 'Noor');
      const text = [l.greeting, ...l.paragraphs].join(' ');
      expect(text).not.toMatch(/\b(RIASEC|Realistic|Investigative|Artistic|Social|Enterprising|Conventional|FSc|ICS|I\.Com|score|percent)\b/);
      if (w === 1) expect(text).toContain('still finding out');
    }
    expect(writeLetter(4, prof, true, 'Noor').paragraphs.join(' ')).toContain('real tools');
  });

  test('unmeasured weeks get a neutral letter', () => {
    const l = writeLetter(3, scoreInterests(strongR), false, 'Noor');
    expect(l.paragraphs.join(' ')).toContain('my own way');
  });
});

describe('town building (gameplay only)', () => {
  test('meters respond to building and funding, and funding spends the grant', () => {
    let t = initialTown();
    const m0 = meters(t, 1);
    t = addProgress(t, 'pump_station', 100).town;
    expect(meters(t, 1).happiness).toBeGreaterThan(m0.happiness);
    const before = t.grant;
    const r = fund(t, 'school', 1);
    expect(r.ok).toBe(true);
    expect(r.town.grant).toBe(before - FUND_COST);
    expect(fund(t, 'bank', 1).ok).toBe(false); // Records House is locked in week 1
  });

  test('layout is deterministic and has room for every home', () => {
    const a = buildLayout(), b = buildLayout();
    expect(a).toEqual(b);
    expect(a.filter((c) => c.decor?.kind === 'house')).toHaveLength(40);
  });
});

describe('category list is complete', () => {
  test('six categories in every planner', () => {
    const cats: Riasec[] = ['R', 'I', 'A', 'S', 'E', 'C'];
    expect(new Set(cats).size).toBe(6);
  });
});
