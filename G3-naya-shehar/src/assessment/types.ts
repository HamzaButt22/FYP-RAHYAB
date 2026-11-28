/**
 * Core assessment types. Nothing in this file is ever shown to the player.
 */
export const RIASEC = ['R', 'I', 'A', 'S', 'E', 'C'] as const;
export type Riasec = (typeof RIASEC)[number];

export const ABILITY_FAMILIES = ['SPA', 'ABS', 'NUM', 'LOG', 'PLN', 'VRB'] as const;
export type AbilityFamily = (typeof ABILITY_FAMILIES)[number];

export type Level = 1 | 2 | 3 | 4;
export const MIN_LEVEL: Level = 1;
export const MAX_LEVEL: Level = 4;

export type ScoredWeek = 1 | 2 | 3 | 4;
export type Week = 0 | ScoredWeek;

export type ReactionValue = 'meh' | 'okay' | 'loved';

/**
 * Closed set of assessment event types. Adding a type requires updating
 * the validator, the scoring engine and docs/MEASUREMENT.md.
 */
export type AssessmentEvent =
  | {
      type: 'choice_made';
      itemId: string;
      week: Week;
      /** RIASEC letters exactly as presented: [left, right] */
      presented: [Riasec, Riasec];
      chosen: Riasec;
    }
  | {
      type: 'plan_committed';
      itemId: string;
      week: Week;
      offered: Riasec[];
      /** Ranked picks, most preferred first. Length 3. */
      ranked: Riasec[];
    }
  | {
      type: 'reaction';
      itemId: string;
      week: Week;
      category: Riasec;
      value: ReactionValue;
    }
  | {
      type: 'task_result';
      itemId: string;
      week: Week;
      family: AbilityFamily;
      /** Difficulty actually presented. */
      level: Level;
      firstAttemptCorrect: boolean;
      /** Whether the player eventually solved it (not used for scoring). */
      solved: boolean;
      attempts: number;
    };

export type AssessmentEventType = AssessmentEvent['type'];
export const EVENT_TYPES: AssessmentEventType[] = ['choice_made', 'plan_committed', 'reaction', 'task_result'];

/** An event as stored: envelope + payload. */
export interface StoredEvent {
  seq: number;
  /** ISO timestamp, kept for audit only — never used in scoring. */
  recordedAt: string;
  sessionId: string;
  measured: boolean;
  event: AssessmentEvent;
}
