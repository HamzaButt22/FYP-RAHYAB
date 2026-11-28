import { AbilityFamily, Riasec } from '../types';
import { InterestProfile } from '../scoring/riasec';
import { AbilityScore } from '../scoring/abilities';
import {
  ABILITY_PHRASES, ClassLevel, INTEREST_PHRASES, MatricGroup, PATHWAYS, PathwayRule, RULESET_VERSION,
} from './rules';

export interface StudentContext { classLevel: ClassLevel; matricGroup: MatricGroup }

export type Eligibility = { status: 'eligible' } | { status: 'needs_group'; groups: MatricGroup[] } | { status: 'not_eligible' };

export interface PathwayResult {
  pathway: PathwayRule;
  fit: number;
  eligibility: Eligibility;
  reasons: string[];
}

export interface Recommendation {
  rulesetVersion: string;
  top: PathwayResult[];
  planB: PathwayResult | null;
  allRanked: PathwayResult[];
  unverifiedRules: boolean;
  /** Overall trust in this result. */
  confidence: 'low' | 'medium' | 'high';
  notes: string[];
}

export const INTEREST_WEIGHT = 0.6;
export const ABILITY_WEIGHT = 0.4;

export function eligibilityFor(p: PathwayRule, s: StudentContext): Eligibility {
  if (s.matricGroup === 'not_yet') {
    // 'not_yet' means a Matric-system student who has not picked a group; the O/A-Level route is a different system.
    const groups = p.requires.filter((g) => g !== 'olevel');
    return groups.length ? { status: 'needs_group', groups } : { status: 'not_eligible' };
  }
  return p.requires.includes(s.matricGroup) ? { status: 'eligible' } : { status: 'not_eligible' };
}

/** Standardise θ across the six categories so fit uses relative preference. */
function interestZ(profile: InterestProfile): Record<Riasec, number> {
  const t = profile.scores.map((s) => s.theta);
  const mean = t.reduce((a, b) => a + b, 0) / t.length;
  const sd = Math.sqrt(t.reduce((a, b) => a + (b - mean) ** 2, 0) / t.length) || 1;
  return Object.fromEntries(profile.scores.map((s) => [s.category, (s.theta - mean) / Math.max(sd, 0.25)])) as Record<Riasec, number>;
}

export function recommend(profile: InterestProfile, abilities: AbilityScore[], student: StudentContext): Recommendation {
  const z = interestZ(profile);
  const ab = Object.fromEntries(abilities.map((a) => [a.family, a])) as Record<AbilityFamily, AbilityScore>;
  const ranked: PathwayResult[] = PATHWAYS.map((p) => {
    const iParts = (Object.entries(p.interests) as [Riasec, number][]).map(([c, w]) => ({ c, v: w * z[c] }));
    const aParts = (Object.entries(p.abilities) as [AbilityFamily, number][]).map(([f, w]) => ({ f, v: w * ab[f].theta }));
    const fit = INTEREST_WEIGHT * iParts.reduce((s, x) => s + x.v, 0) + ABILITY_WEIGHT * aParts.reduce((s, x) => s + x.v, 0);
    const reasons: string[] = [];
    const conf = Object.fromEntries(profile.scores.map((s) => [s.category, s.confidence]));
    for (const part of [...iParts].sort((a, b) => b.v - a.v).slice(0, 2)) {
      if (part.v > 0 && conf[part.c] !== 'low') reasons.push(INTEREST_PHRASES[part.c]);
    }
    const goodAbilities = [...aParts].sort((a, b) => b.v - a.v)
      .filter((x) => x.v > 0 && ab[x.f].band !== 'developing' && ab[x.f].confidence !== 'low').slice(0, 2);
    if (goodAbilities.length) reasons.push(`Your puzzles showed strength in ${goodAbilities.map((g) => ABILITY_PHRASES[g.f]).join(' and ')}.`);
    if (!reasons.length) reasons.push('This fits the overall mix of choices you made, but the evidence is still light.');
    return { pathway: p, fit, eligibility: eligibilityFor(p, student), reasons };
  }).sort((a, b) => b.fit - a.fit);

  const open = ranked.filter((r) => r.eligibility.status !== 'not_eligible');
  const top = open.slice(0, 3);
  const topTracks = new Set(top.map((t) => t.pathway.track));
  const rest = open.slice(3);
  const planB = (topTracks.size === 1 ? rest.find((r) => !topTracks.has(r.pathway.track)) : undefined) ?? rest[0] ?? null;

  const lowCats = profile.scores.filter((s) => s.confidence === 'low').length;
  const c = profile.consistency.rate;
  const highCats = profile.scores.filter((s) => s.confidence === 'high').length;
  let confidence: Recommendation['confidence'] = 'medium';
  if (profile.comparisons < 20 || lowCats >= 3 || (c !== null && c < 0.5)) confidence = 'low';
  else if (lowCats === 0 && highCats >= 3 && (c === null || c >= 0.8) && !abilities.some((a) => a.confidence === 'low')) confidence = 'high';

  const notes: string[] = [];
  if (c !== null && c < 0.5) notes.push('Your choices changed a lot between weeks. That is normal at your age — your interests may still be forming.');
  if (!planB) notes.push('Only a few routes are open from your Matric group, so there is no separate Plan B. Talk to your teacher about other options.');
  if (student.matricGroup === 'not_yet') notes.push('You have not chosen a Matric group yet. Each pathway shows which group keeps it open.');
  return {
    rulesetVersion: RULESET_VERSION,
    top, planB, allRanked: ranked,
    unverifiedRules: PATHWAYS.some((p) => !p.verified),
    confidence, notes,
  };
}
