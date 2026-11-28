import { InterestProfile } from '@/assessment/scoring/riasec';
import { AbilityScore } from '@/assessment/scoring/abilities';
import { Riasec } from '@/assessment/types';
import { ABILITY_PHRASES } from '@/assessment/recommendations/rules';

const LOVED: Record<Riasec, string> = {
  R: 'You loved building and fixing things.',
  I: 'You loved investigating and finding out why.',
  A: 'You loved creating, designing and telling stories.',
  S: 'You loved helping and looking after people.',
  E: 'You loved leading teams and getting people on board.',
  C: 'You loved organising and keeping things in order.',
};

/**
 * Plain-language recap. A statement is only made when the evidence supports
 * it: interest statements need non-low confidence and a clear lead over the
 * next category; ability statements need a "strong" band with non-low confidence.
 */
export function recap(profile: InterestProfile, abilities: AbilityScore[]): string[] {
  const out: string[] = [];
  const s = [...profile.scores].sort((a, b) => b.theta - a.theta);
  for (let i = 0; i < 2; i++) {
    const cur = s[i], nxt = s[i + 1];
    if (cur.confidence !== 'low' && cur.theta - nxt.theta > 0.25 && cur.theta > 0) out.push(LOVED[cur.category]);
    else break;
  }
  const strong = abilities.filter((a) => a.band === 'strong' && a.confidence !== 'low').map((a) => ABILITY_PHRASES[a.family]);
  if (strong.length) out.push(`You showed real skill at ${strong.slice(0, 2).join(' and ')}.`);
  if (!out.length) out.push('You tried many different kinds of work — your interests are wide and still growing.');
  return out;
}
