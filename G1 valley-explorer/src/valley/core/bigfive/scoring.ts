/**
 * Big Five scoring. Two separate results, never mixed:
 *
 * 1. QUESTIONNAIRE (the student's own answers to the Mini-IPIP journal statements). This is the Big Five
 *    result shown to the student and given to RahYaab.
 *    - reverse-keyed items are scored 6 − answer; the trait score is the mean of the answered items (1–5),
 *      rescaled to 0–100 as (mean − 1) / 4 × 100, rounded to one decimal.
 *    - a trait is reported only if at least MIN_ITEMS of its 4 items were answered (skips are allowed).
 *    - the latest answer to an item counts (an item is only ever asked once in normal play).
 *    - there are no norms for Pakistani adolescents, so scores are described relative to the scale
 *      midpoint only ("more" / "in between" / "less"), never as percentiles.
 *
 * 2. BEHAVIOUR ESTIMATES (exploratory, research only, never shown to students). Transparent formulas over
 *    gameplay events, so the research team can test whether play agrees with the questionnaire. Only traits
 *    with a signal that does NOT reuse the RIASEC task categories are estimated; Extraversion and
 *    Agreeableness would only re-count "Leading" and "Helping" interest choices, so they are not estimated.
 */
import type { AssessmentEvent } from '../../contract/events';
import { BIGFIVE_SCORING_VERSION } from '../../contract/versions';
import { VALLEY_AREAS } from '../levels/interestLevels';
import { BIG5_BY_ID, BIG5_ITEMS, INSTRUMENT, TRAITS, type Trait } from './items';

export const MIN_ITEMS = 3;

const r1 = (x: number) => Math.round(x * 10) / 10;

export interface TraitResult {
  trait: Trait;
  status: 'reported' | 'insufficient_evidence';
  answered: number;
  /** mean of keyed answers, 1–5; null when insufficient */
  mean: number | null;
  /** 0–100; null when insufficient */
  score: number | null;
  band: 'higher' | 'middle' | 'lower' | null;
}

export interface QuestionnaireResult {
  instrument: string;
  available: boolean;
  answered: number;
  skipped: number;
  traits: Record<Trait, TraitResult>;
}

export interface BehaviourEstimate {
  trait: Trait;
  /** 0–100, or null when there is no defensible signal or too little play */
  score: number | null;
  indicators: Record<string, number | null>;
  note: string;
}

export interface BigFiveResult {
  scoring_version: string;
  is_validated: false;
  questionnaire: QuestionnaireResult;
  behaviour: Record<Trait, BehaviourEstimate>;
  /** per trait: questionnaire score − behaviour estimate (only when both exist) */
  comparison: Partial<Record<Trait, number>>;
  caveats: string[];
}

/** latest answer per item, from BIG5_RESPONSE events (answer null = skipped) */
export function bigFiveAnswers(events: AssessmentEvent[]): Map<string, number | null> {
  const out = new Map<string, number | null>();
  for (const e of events.slice().sort((a, b) => a.seq - b.seq)) {
    if (e.event_type !== 'BIG5_RESPONSE') continue;
    const id = String(e.event_data.item_id);
    if (!BIG5_BY_ID[id]) continue;
    const a = e.event_data.answer;
    out.set(id, typeof a === 'number' && Number.isInteger(a) && a >= 1 && a <= 5 ? a : null);
  }
  return out;
}

export function scoreQuestionnaire(answers: Map<string, number | null>): QuestionnaireResult {
  const traits = {} as Record<Trait, TraitResult>;
  for (const t of TRAITS) {
    const vals = BIG5_ITEMS.filter((i) => i.trait === t)
      .map((i) => { const a = answers.get(i.id); return typeof a === 'number' ? (i.key === 1 ? a : 6 - a) : null; })
      .filter((v): v is number => v !== null);
    if (vals.length < MIN_ITEMS) { traits[t] = { trait: t, status: 'insufficient_evidence', answered: vals.length, mean: null, score: null, band: null }; continue; }
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
    const score = r1(((mean - 1) / 4) * 100);
    traits[t] = { trait: t, status: 'reported', answered: vals.length, mean: Math.round(mean * 100) / 100, score, band: mean >= 3.5 ? 'higher' : mean <= 2.5 ? 'lower' : 'middle' };
  }
  const answered = [...answers.values()].filter((a) => a !== null).length;
  return { instrument: INSTRUMENT, available: TRAITS.some((t) => traits[t].status === 'reported'), answered, skipped: answers.size - answered, traits };
}

const mean = (xs: (number | null)[]) => { const v = xs.filter((x): x is number => x !== null); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null; };

/** Exploratory gameplay indicators, each 0–1. See the header comment for what is deliberately left out. */
export function behaviourEstimates(events: AssessmentEvent[]): Record<Trait, BehaviourEstimate> {
  const ev = events.slice().sort((a, b) => a.seq - b.seq);
  const d = (e: AssessmentEvent) => e.event_data as Record<string, any>;

  // Openness: curiosity before it was needed (signs read) and variety of activities tried
  const areas = new Set(ev.filter((e) => e.event_type === 'EXPLORATION').map((e) => String(d(e).area_id)));
  const exploration = ev.some((e) => e.level_id === 'valley_gate' && e.event_type === 'LEVEL_COMPLETE') ? areas.size / VALLEY_AREAS.length : null;
  const starts = ev.filter((e) => e.event_type === 'ACTIVITY_START');
  const variety = starts.length >= 5 ? new Set(starts.map((e) => String(d(e).task_id))).size / starts.length : null;

  // Conscientiousness: finishing what was started, doing optional depth steps, not skipping scored puzzles
  const ends = ev.filter((e) => e.event_type === 'ACTIVITY_END');
  const completion = ends.length >= 3 ? ends.filter((e) => d(e).outcome === 'completed').length / ends.length : null;
  const optTotal = ends.reduce((a, e) => a + Number(d(e).optional_total ?? 0), 0);
  const thoroughness = ends.length >= 3 && optTotal > 0 ? ends.reduce((a, e) => a + Number(d(e).optional_taken ?? 0), 0) / optTotal : null;
  const scored = ev.filter((e) => e.event_type === 'ITEM_RESPONSE' && !d(e).practice);
  const firstScored = new Map<string, AssessmentEvent>();
  for (const e of scored) if (!firstScored.has(String(d(e).item_id))) firstScored.set(String(d(e).item_id), e);
  const puzzleCommit = firstScored.size >= 6 ? [...firstScored.values()].filter((e) => d(e).skipped !== true).length / firstScored.size : null;

  // Neuroticism (reverse of persistence after a setback): after a wrong practice answer, did the student try again?
  const practiceWrong = new Map<string, boolean>(); // item -> retried
  for (const e of ev) {
    if (e.event_type !== 'ITEM_RESPONSE' || !d(e).practice) continue;
    const id = String(d(e).item_id);
    if (practiceWrong.has(id)) practiceWrong.set(id, true);
    else if (d(e).correct === false && d(e).skipped !== true) practiceWrong.set(id, false);
  }
  const retry = practiceWrong.size >= 2 ? [...practiceWrong.values()].filter(Boolean).length / practiceWrong.size : null;

  const pct = (x: number | null) => (x === null ? null : r1(x * 100));
  const notEstimated = (t: Trait, why: string): BehaviourEstimate => ({ trait: t, score: null, indicators: {}, note: why });
  return {
    O: { trait: 'O', score: pct(mean([exploration, variety])), indicators: { signs_read_share: exploration, activity_variety: variety }, note: 'Exploring signs before they were needed, and trying many different activities.' },
    C: { trait: 'C', score: pct(mean([completion, thoroughness, puzzleCommit])), indicators: { activities_finished_share: completion, optional_steps_share: thoroughness, scored_puzzles_not_skipped: puzzleCommit }, note: 'Finishing started activities, doing optional steps, not skipping puzzles.' },
    N: { trait: 'N', score: retry === null ? null : r1((1 - retry) * 100), indicators: { retried_after_wrong_practice: retry }, note: 'Very weak signal: giving up after a wrong practice answer. Few observations per student.' },
    E: notEstimated('E', 'Not estimated: the only game signals (choosing leading roles) are already counted as the Leading interest.'),
    A: notEstimated('A', 'Not estimated: the only game signals (choosing helping activities) are already counted as the Helping interest.'),
  };
}

export function computeBigFive(events: AssessmentEvent[]): BigFiveResult {
  const questionnaire = scoreQuestionnaire(bigFiveAnswers(events));
  const behaviour = behaviourEstimates(events);
  const comparison: BigFiveResult['comparison'] = {};
  for (const t of TRAITS) {
    const q = questionnaire.traits[t].score; const b = behaviour[t].score;
    if (q !== null && b !== null) comparison[t] = r1(q - b);
  }
  return {
    scoring_version: BIGFIVE_SCORING_VERSION, is_validated: false, questionnaire, behaviour, comparison,
    caveats: [
      'Questionnaire: Mini-IPIP (public domain). Short scales (4 items) are less precise than full questionnaires.',
      'No norms for Pakistani adolescents; scores are relative to the scale midpoint, not to other students.',
      'English wording, lightly adapted; an Urdu version needs translation and back-translation.',
      'Behaviour estimates are exploratory research data and are never shown to students.',
    ],
  };
}
