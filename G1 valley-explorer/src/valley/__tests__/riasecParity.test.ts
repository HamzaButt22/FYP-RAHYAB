/**
 * The TypeScript RIASEC scorer must reproduce the original Python scorer (analytics/riasec_scoring.py).
 * Fixtures were produced by running the Python code itself: tools/make_riasec_parity_fixture.py.
 */
import cases from './fixtures/riasec_parity.json';
import { computeRiasec, CODES } from '../core/riasec/scoring';
import type { LevelUnits } from '../core/riasec/units';

type Case = { input: Record<string, LevelUnits>; expected: { scores: Record<string, number>; holland_code: string; levels_used: string[]; level_scores: Record<string, Record<string, number>>; agreement: number | null; flat_profile: boolean } };

describe('RIASEC parity with the original Python implementation', () => {
  it('has fixtures', () => expect((cases as unknown as Case[]).length).toBeGreaterThanOrEqual(40));

  (cases as unknown as Case[]).forEach((c, i) => {
    it(`case ${i}`, () => {
      const r = computeRiasec(c.input);
      expect(r.levels_used).toEqual(c.expected.levels_used);
      for (const code of CODES) expect(r.scores[code]).toBeCloseTo(c.expected.scores[code], 6);
      for (const [lid, sc] of Object.entries(c.expected.level_scores)) for (const code of CODES) expect(r.level_scores[lid][code]).toBeCloseTo(sc[code], 6);
      expect(r.flat_profile).toBe(c.expected.flat_profile);
      if (c.expected.agreement === null) expect(r.agreement).toBeNull();
      else expect(r.agreement).toBeCloseTo(c.expected.agreement, 6);
      expect(r.holland_code).toBe(c.expected.holland_code);
    });
  });
});
