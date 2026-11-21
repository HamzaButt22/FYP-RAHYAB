/**
 * Ability evidence — rule-based, versioned, NOT normed and NOT validated.
 *
 * Construct per family (operational definition, not a claim of validity):
 *  - planning_numerical: choosing a combination of orders under resource limits that reaches the maximum value.
 *  - spatial: identifying which piece is a rotation (not a reflection) of a target.
 *  - abstract: inferring the next element of a rule-based shape sequence.
 *  - logical: deducing a unique code from feedback clues.
 *
 * Rules:
 *  - Practice items are never scored.
 *  - Only the FIRST response to each item counts (re-submissions after feedback are ignored).
 *  - A skipped item counts as answered-not-correct; it is reported separately.
 *  - Hints are recorded; the headline count uses first-try correctness regardless of hints, and a
 *    "without hints" count is shown alongside so the student and counsellor see both.
 *  - At least MIN_ANSWERED scored items must be ATTEMPTED (answered, not skipped), otherwise the family is
 *    "insufficient evidence" — a student who skipped most puzzles gets no result rather than "0 of 6".
 *  - No norms exist, so NO band (low/average/high) and NO percentile is produced. Families are never
 *    combined into a single "ability" or IQ-like number.
 *  - Response time is stored as raw evidence but not used in scoring (slow phones, reading speed).
 */
import type { AssessmentEvent } from '../../contract/events';
import { ABILITY_SCORING_VERSION } from '../../contract/versions';
import type { AbilityFamily } from '../journey';

export const MIN_ANSWERED = 4;

export interface ItemOutcome {
  item_id: string;
  difficulty: number;
  correct: boolean;
  skipped: boolean;
  hints_used: number;
}

export interface FamilyResult {
  family: AbilityFamily;
  status: 'reported' | 'insufficient_evidence' | 'not_played';
  presented: number;
  answered: number;
  correct: number;
  correct_without_hint: number;
  skipped: number;
  /** first-try proportion correct among answered items; null when insufficient */
  proportion: number | null;
  items: ItemOutcome[];
}

export interface AbilityResult {
  scoring_version: string;
  is_validated: false;
  families: Record<AbilityFamily, FamilyResult>;
  caveats: string[];
}

export const FAMILIES: AbilityFamily[] = ['planning_numerical', 'spatial', 'abstract', 'logical'];

export function scoreAbility(events: AssessmentEvent[]): AbilityResult {
  const sorted = events.slice().sort((a, b) => a.seq - b.seq);
  const families = {} as Record<AbilityFamily, FamilyResult>;
  for (const fam of FAMILIES) {
    const presented = new Map<string, number>(); // item_id -> difficulty
    const first = new Map<string, ItemOutcome>();
    const hints = new Map<string, number>();
    for (const e of sorted) {
      const d = e.event_data as Record<string, any>;
      if (d.family !== fam || d.practice) continue;
      if (e.event_type === 'ITEM_PRESENTED') presented.set(d.item_id, Number(d.difficulty ?? 0));
      if (e.event_type === 'HINT_USED' && !first.has(d.item_id)) hints.set(d.item_id, (hints.get(d.item_id) ?? 0) + 1);
      if (e.event_type === 'ITEM_RESPONSE' && !first.has(d.item_id)) {
        first.set(d.item_id, { item_id: d.item_id, difficulty: Number(d.difficulty ?? presented.get(d.item_id) ?? 0), correct: d.correct === true, skipped: d.skipped === true, hints_used: Number(d.hints_used ?? hints.get(d.item_id) ?? 0) });
      }
    }
    const items = [...first.values()];
    const answered = items.length;
    const correct = items.filter((i) => i.correct).length;
    const attempted = items.filter((i) => !i.skipped).length;
    const status: FamilyResult['status'] = presented.size === 0 ? 'not_played' : attempted >= MIN_ANSWERED ? 'reported' : 'insufficient_evidence';
    families[fam] = {
      family: fam, status, presented: presented.size, answered, correct,
      correct_without_hint: items.filter((i) => i.correct && i.hints_used === 0).length,
      skipped: items.filter((i) => i.skipped).length,
      proportion: status === 'reported' ? correct / answered : null, items,
    };
  }
  return {
    scoring_version: ABILITY_SCORING_VERSION, is_validated: false, families,
    caveats: [
      'These puzzles are a first version. They have not yet been checked against established tests or compared with other students, so the results are counts, not grades.',
      'A few puzzles cannot show how able someone is. Tiredness, language, a slow phone or being new to puzzles all change results.',
    ],
  };
}
