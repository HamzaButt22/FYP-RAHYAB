/**
 * Builds (1) the student-facing explainable summary and (2) the structured payload handed to RahYaab
 * through the host adapter. Raw events are never modified here; everything is derived and versioned.
 */
import type { AssessmentEvent } from '../contract/events';
import { ABILITY_SCORING_VERSION, BIGFIVE_SCORING_VERSION, EVENT_SCHEMA_VERSION, GAME_VERSION, ITEM_BANK_VERSION, RIASEC_SCORING_VERSION } from '../contract/versions';
import { scoreAbility, type AbilityResult, type FamilyResult } from './ability/scoring';
import type { AbilityFamily } from './journey';
import { CODES, computeRiasec, type Code, type RiasecResult } from './riasec/scoring';
import { levelUnits } from './riasec/units';
import { computeBigFive, type BigFiveResult, type TraitResult } from './bigfive/scoring';
import { TRAITS, type Trait } from './bigfive/items';

export const INTEREST_WORDS: Record<Code, { name: string; activities: string }> = {
  R: { name: 'Hands-on', activities: 'fixing, building and working with tools' },
  I: { name: 'Investigating', activities: 'testing ideas and finding out why things happen' },
  A: { name: 'Creating', activities: 'designing, painting and making new things' },
  S: { name: 'Helping', activities: 'helping, teaching and looking after people' },
  E: { name: 'Leading', activities: 'persuading people, leading and making deals' },
  C: { name: 'Organising', activities: 'organising, sorting and checking details' },
};

export const FAMILY_WORDS: Record<AbilityFamily, { name: string; task: string }> = {
  planning_numerical: { name: 'Planning with numbers', task: 'Workshop Orders puzzles' },
  spatial: { name: 'Turning shapes in your mind', task: 'Map Room puzzles' },
  abstract: { name: 'Finding patterns', task: 'Pattern Gate puzzles' },
  logical: { name: 'Using clues logically', task: 'Vault Lock puzzles' },
};

/**
 * Provisional display rule (design assumption, not research-derived): an area is shown as a "top interest"
 * only if its score is at least this value. The scorer itself (ported unchanged from Python) always fills
 * a 3-letter code, even with categories scoring 0; students must never see an area they rarely chose
 * presented as a top interest.
 */
export const MIN_TOP_SCORE = 25;

export interface InterestLine { code: Code; name: string; score: number; text: string }
export interface AbilityLine { family: AbilityFamily; name: string; text: string; status: FamilyResult['status'] }

export interface PersonalityLine { trait: Trait; name: string; text: string; band: TraitResult['band'] }

export interface StudentSummary {
  interests: { available: boolean; top: InterestLine[]; all: InterestLine[]; flat: boolean; note: string };
  personality: { available: boolean; lines: PersonalityLine[]; note: string };
  abilities: AbilityLine[];
  /** careful suggestions that combine interests and personality; ideas to explore, never decisions */
  advice: { fields: { code: Code; name: string; examples: string }[]; ways: string[]; agreements: string[] };
  reminders: string[];
}

export interface AssessmentOutput {
  /** what RahYaab's pathway workflow may use: interests, ability evidence and the Big Five QUESTIONNAIRE
   *  (included at the project's request, 16 Nov 2026). Behaviour-based Big Five estimates are never eligible. */
  eligible_outputs: {
    bigfive: { instrument: string; scores: Partial<Record<Trait, number>>; bands: Partial<Record<Trait, TraitResult['band']>>; scoring_version: string } | null;
    riasec: { available: boolean; scores: Record<Code, number>; holland_code: string; shown_top: Code[]; flat_profile: boolean; scoring_version: string } | null;
    ability: Partial<Record<AbilityFamily, { answered: number; correct: number; correct_without_hint: number; scoring_version: string }>>;
  };
  riasec: RiasecResult;
  ability: AbilityResult;
  /** questionnaire result + exploratory behaviour estimates and their comparison (research use) */
  bigfive: BigFiveResult;
  versions: { game: string; event_schema: string; riasec_scoring: string; ability_scoring: string; bigfive_scoring: string; item_bank: string };
  validation_status: 'prototype_not_validated';
  student_summary: StudentSummary;
  /** context only, never scored */
  context: { reflection: Record<string, unknown>; levels_completed: number };
}

export function buildOutput(events: AssessmentEvent[]): AssessmentOutput {
  const riasec = computeRiasec({
    crossroads_caravan: levelUnits(events, 'crossroads_caravan') ?? undefined,
    career_workshop: levelUnits(events, 'career_workshop') ?? undefined,
    park_mission: levelUnits(events, 'park_mission') ?? undefined,
  });
  const ability = scoreAbility(events);
  const bigfive = computeBigFive(events);
  const q = bigfive.questionnaire;
  const reported = TRAITS.filter((t) => q.traits[t].status === 'reported');
  const reflection: Record<string, unknown> = {};
  for (const e of events) if (e.event_type === 'REFLECTION_RESPONSE') reflection[String(e.event_data.question_id)] = e.event_data.answer;
  const levelsCompleted = new Set(events.filter((e) => e.event_type === 'LEVEL_COMPLETE').map((e) => e.level_id)).size;

  const abilityEligible: AssessmentOutput['eligible_outputs']['ability'] = {};
  for (const f of Object.values(ability.families)) {
    if (f.status === 'reported') abilityEligible[f.family] = { answered: f.answered, correct: f.correct, correct_without_hint: f.correct_without_hint, scoring_version: ABILITY_SCORING_VERSION };
  }
  return {
    eligible_outputs: {
      riasec: riasec.available ? { available: true, scores: riasec.scores, holland_code: riasec.flat_profile ? '' : riasec.holland_code,
        /** the subset of the code that passed the display rule — what the student was actually shown */
        shown_top: riasec.flat_profile ? [] : CODES.filter((c) => riasec.scores[c] >= MIN_TOP_SCORE).sort((a, b) => riasec.scores[b] - riasec.scores[a]).slice(0, 3),
        flat_profile: riasec.flat_profile, scoring_version: RIASEC_SCORING_VERSION } : null,
      ability: abilityEligible,
      bigfive: q.available ? { instrument: q.instrument, scoring_version: BIGFIVE_SCORING_VERSION,
        scores: Object.fromEntries(reported.map((t) => [t, q.traits[t].score!])), bands: Object.fromEntries(reported.map((t) => [t, q.traits[t].band])) } : null,
    },
    riasec, ability, bigfive,
    versions: { game: GAME_VERSION, event_schema: EVENT_SCHEMA_VERSION, riasec_scoring: RIASEC_SCORING_VERSION, ability_scoring: ABILITY_SCORING_VERSION, bigfive_scoring: BIGFIVE_SCORING_VERSION, item_bank: ITEM_BANK_VERSION },
    validation_status: 'prototype_not_validated',
    student_summary: studentSummary(riasec, ability, bigfive),
    context: { reflection, levels_completed: levelsCompleted },
  };
}

function interestLine(r: RiasecResult, c: Code): InterestLine {
  const shares = r.levels_used.map((l) => r.components[l]?.[c]?.preference_share ?? 0);
  const engs = r.levels_used.map((l) => r.components[l]?.[c]?.engagement ?? 0);
  const share = shares.length ? shares.reduce((a, b) => a + b, 0) / shares.length : 0;
  const eng = engs.length ? engs.reduce((a, b) => a + b, 0) / engs.length : 0;
  const w = INTEREST_WORDS[c];
  const often = share >= 0.25 ? 'often chose' : share >= 0.12 ? 'sometimes chose' : 'rarely chose';
  const stayed = eng >= 0.6 ? ' and usually did the extra steps too' : eng >= 0.35 ? ' and sometimes did extra steps' : '';
  return { code: c, name: w.name, score: r.scores[c], text: `You ${often} activities about ${w.activities}${stayed}.` };
}

function abilityLine(f: FamilyResult): AbilityLine {
  const w = FAMILY_WORDS[f.family];
  if (f.status === 'not_played') return { family: f.family, name: w.name, status: f.status, text: `You did not reach the ${w.task}.` };
  if (f.status === 'insufficient_evidence') return { family: f.family, name: w.name, status: f.status, text: `Not enough ${w.task} were tried to say anything yet. That is fine — you can try them another time.` };
  const hintNote = f.correct > f.correct_without_hint ? ` (${f.correct_without_hint} without a hint)` : '';
  const skipNote = f.skipped ? ` You skipped ${f.skipped}.` : '';
  if (f.correct === 0) return { family: f.family, name: w.name, status: f.status, text: `You tried ${f.answered - f.skipped} ${w.task}. None came out on the first try today — these take practice.${skipNote}` };
  return { family: f.family, name: w.name, status: f.status, text: `You solved ${f.correct} of ${f.answered} ${w.task} on the first try${hintNote}.${skipNote}` };
}

/** Student-facing words. Both ends of every trait are described as strengths or neutral, never as faults. */
export const TRAIT_WORDS: Record<Trait, { name: string; higher: string; middle: string; lower: string }> = {
  O: { name: 'Curiosity and imagination', higher: 'You enjoy imagining things and thinking about new ideas.', middle: 'You enjoy some new ideas and also like familiar ways of doing things.', lower: 'You like practical, familiar ways of doing things and ideas with a clear use.' },
  C: { name: 'Organising and finishing tasks', higher: 'You like order and getting your tasks done.', middle: 'You are organised when it matters and relaxed at other times.', lower: 'You like to stay flexible. A planner or checklist can help with big tasks.' },
  E: { name: 'Being with people', higher: 'You get energy from talking with lots of people.', middle: 'You enjoy people and also like some quiet time.', lower: 'You like quieter time and small groups, and you think before you speak.' },
  A: { name: 'Caring about others', higher: 'You notice how others feel and care about them.', middle: 'You care about others and can also be direct when needed.', lower: 'You tend to be direct and focus on getting the task right.' },
  // shown the other way round (calmness), so that "higher" is the comfortable end for the student
  N: { name: 'Staying calm', higher: 'You usually stay calm and relaxed.', middle: 'You are calm most of the time, and sometimes things upset you.', lower: 'Your feelings can change quickly or you can get upset easily. That is common at your age; talking to someone you trust helps.' },
};

/** Well-known example fields for each Holland (RIASEC) area. Examples to explore, not recommendations. */
export const FIELD_EXAMPLES: Record<Code, string> = {
  R: 'engineering, electrical or mechanical trades, agriculture, construction',
  I: 'science, medicine, computer science, research',
  A: 'design, architecture, media, writing',
  S: 'teaching, nursing, psychology, social work',
  E: 'business, law, marketing, management',
  C: 'accounting, banking, office administration, IT support',
};

const WAY_TIPS: Partial<Record<Trait, { higher?: string; lower?: string }>> = {
  E: { higher: 'Paths with teamwork and talking to people may suit you.', lower: 'Paths where you can focus, alone or in a small team, may suit you.' },
  C: { higher: 'Study paths with clear steps and structure could suit you.', lower: 'Paths with variety may keep you interested; a planner helps with deadlines.' },
  O: { higher: 'Creative or research subjects may keep you interested.', lower: 'Practical courses where you can see how things are used may suit you.' },
  A: { higher: 'Roles where you support or help others may feel meaningful to you.' },
};

/** where an interest and a trait point the same way (two kinds of evidence agreeing) */
const AGREE: Partial<Record<Code, Trait>> = { A: 'O', I: 'O', S: 'A', E: 'E', C: 'C' };

/** questionnaire band for display, with Neuroticism flipped into "Staying calm" */
const shownBand = (t: Trait, b: TraitResult['band']): TraitResult['band'] => (t !== 'N' || b === null || b === 'middle' ? b : b === 'higher' ? 'lower' : 'higher');

export function studentSummary(r: RiasecResult, a: AbilityResult, b5?: BigFiveResult): StudentSummary {
  const all = CODES.map((c) => interestLine(r, c)).sort((x, y) => y.score - x.score);
  const note = !r.available
    ? 'There were not enough choices to describe your interests yet. That is fine — you can explore again later.'
    : r.flat_profile
      ? 'You liked many different kinds of activities about equally. That is useful to know: it keeps lots of paths open. Exploring a few of them more closely will help.'
      : 'These are the kinds of activities you chose most often in the game. They show what you enjoyed today, not what you can or cannot do.';
  const top = r.available && !r.flat_profile ? all.filter((l) => l.score >= MIN_TOP_SCORE).slice(0, 3) : [];

  const q = b5?.questionnaire;
  const lines: PersonalityLine[] = q ? TRAITS.filter((t) => q.traits[t].status === 'reported').map((t) => {
    const band = shownBand(t, q.traits[t].band);
    return { trait: t, name: TRAIT_WORDS[t].name, band, text: TRAIT_WORDS[t][band ?? 'middle'] };
  }) : [];
  const personality = {
    available: lines.length > 0, lines,
    note: lines.length ? 'This comes from your own journal answers about how you usually are. Every way of being has its own strengths.'
      : 'Not enough journal sentences were answered to describe this. That is fine.',
  };

  const fields = top.map((l) => ({ code: l.code, name: l.name, examples: FIELD_EXAMPLES[l.code] }));
  const ways: string[] = [];
  const agreements: string[] = [];
  if (q) {
    for (const t of ['E', 'C', 'O', 'A'] as Trait[]) {
      const band = q.traits[t].band;
      const tip = band === 'higher' ? WAY_TIPS[t]?.higher : band === 'lower' ? WAY_TIPS[t]?.lower : undefined;
      if (tip) ways.push(tip);
    }
    for (const l of top) {
      const t = AGREE[l.code];
      if (t && q.traits[t].band === 'higher') agreements.push(`Two kinds of evidence point the same way: you often chose ${l.name.toLowerCase()} activities, and your journal shows ${TRAIT_WORDS[t].name.toLowerCase()}. That makes ${FIELD_EXAMPLES[l.code].split(', ').slice(0, 2).join(' or ')} worth a closer look.`);
    }
  }
  return {
    interests: { available: r.available, top, all, flat: r.flat_profile, note },
    personality,
    abilities: Object.values(a.families).map(abilityLine),
    advice: { fields, ways: ways.slice(0, 3), agreements },
    reminders: [
      'This is a game, not an exam. Your results are a starting point for a conversation, not a decision.',
      'Interests, skills and personality grow and change. You can try again later.',
      'Talk about your results with your family, a teacher or a counsellor before choosing a path.',
    ],
  };
}
