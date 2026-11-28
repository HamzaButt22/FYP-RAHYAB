/**
 * INTERIM ability model: one-parameter (Rasch) model with NOMINAL item
 * difficulties by level, estimated by EAP on a grid with a N(0,1) prior.
 * Only FIRST-attempt outcomes are used. Difficulties are designer estimates,
 * not calibrated values — see docs/MEASUREMENT.md.
 */
import { ABILITY_FAMILIES, AbilityFamily, Level, StoredEvent } from '../types';

export const MODEL_ID = 'interim-rasch-eap-v1';
export const LEVEL_DIFFICULTY: Record<Level, number> = { 1: -1.5, 2: -0.5, 3: 0.5, 4: 1.5 };

export interface AbilityScore {
  family: AbilityFamily;
  theta: number;
  sd: number;
  items: number;
  firstAttemptCorrect: number;
  band: 'developing' | 'steady' | 'strong';
  confidence: 'low' | 'medium' | 'high';
}

export function eap(responses: { level: Level; correct: boolean }[]): { theta: number; sd: number } {
  let sw = 0, st = 0, st2 = 0;
  for (let t = -4; t <= 4.0001; t += 0.05) {
    let logL = -0.5 * t * t;
    for (const r of responses) {
      const p = 1 / (1 + Math.exp(-(t - LEVEL_DIFFICULTY[r.level])));
      logL += Math.log(r.correct ? p : 1 - p);
    }
    const w = Math.exp(logL);
    sw += w; st += w * t; st2 += w * t * t;
  }
  const theta = st / sw;
  return { theta, sd: Math.sqrt(Math.max(0, st2 / sw - theta * theta)) };
}

export function scoreAbilities(stored: StoredEvent[]): AbilityScore[] {
  const results = stored.filter((e) => e.measured && e.event.week >= 1 && e.event.type === 'task_result');
  return ABILITY_FAMILIES.map((family) => {
    const rs = results
      .map((e) => e.event)
      .filter((e): e is Extract<typeof e, { type: 'task_result' }> => e.type === 'task_result' && e.family === family)
      .map((e) => ({ level: e.level, correct: e.firstAttemptCorrect }));
    const { theta, sd } = eap(rs);
    const band: AbilityScore['band'] = theta > 0.5 ? 'strong' : theta < -0.5 ? 'developing' : 'steady';
    const confidence: AbilityScore['confidence'] = rs.length < 4 ? 'low' : sd < 0.55 ? 'high' : sd < 0.7 ? 'medium' : 'low';
    return { family, theta, sd, items: rs.length, firstAttemptCorrect: rs.filter((r) => r.correct).length, band, confidence };
  });
}
