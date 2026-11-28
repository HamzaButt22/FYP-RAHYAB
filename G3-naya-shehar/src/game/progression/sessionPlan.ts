import { ABILITY_FAMILIES, AbilityFamily, Riasec, ScoredWeek, Week } from '@/assessment/types';
import { PAIR_SCHEDULE } from '@/assessment/riasec/pairs';
import { CHOICE_SCENARIOS, ChoiceScenario } from '../content/choices';

export type Step =
  | { kind: 'season' }
  | { kind: 'dialogue'; script: string }
  | { kind: 'tour' }
  | { kind: 'planner'; setId: string }
  | { kind: 'choice'; scenarioId: string; left: Riasec; right: Riasec; practice?: boolean }
  | { kind: 'planned'; rank: 0 | 1 | 2 }
  | { kind: 'puzzle'; family: AbilityFamily }
  | { kind: 'practice_puzzle'; puzzleId: string }
  | { kind: 'build' }
  | { kind: 'letter' }
  | { kind: 'complete' };

export const PUZZLES_PER_FAMILY_PER_WEEK = 2;

/** Each scheduled pair must be matched by exactly one scenario written for that week. */
export function scenarioFor(week: ScoredWeek, left: Riasec, right: Riasec): ChoiceScenario {
  const match = CHOICE_SCENARIOS.filter(
    (s) => s.week === week && s.options.some((o) => o.category === left) && s.options.some((o) => o.category === right),
  );
  if (match.length !== 1) throw new Error(`week ${week} needs exactly one scenario for ${left}/${right}, found ${match.length}`);
  return match[0];
}

export function buildWeekPlan(week: Week): Step[] {
  if (week === 0) {
    return [
      { kind: 'dialogue', script: 'prologue_intro' },
      { kind: 'tour' },
      { kind: 'choice', scenarioId: 'PRAC-FC-01', left: 'S', right: 'A', practice: true },
      { kind: 'practice_puzzle', puzzleId: 'PRAC-SPA-01' },
      { kind: 'practice_puzzle', puzzleId: 'PRAC-NUM-01' },
      { kind: 'build' },
      { kind: 'dialogue', script: 'prologue_outro' },
      { kind: 'complete' },
    ];
  }
  const choices: Step[] = PAIR_SCHEDULE.filter((p) => p.week === week).map((p) => ({
    kind: 'choice' as const, scenarioId: scenarioFor(week, p.left, p.right).id, left: p.left, right: p.right,
  }));
  const puzzles: Step[] = [];
  for (let r = 0; r < PUZZLES_PER_FAMILY_PER_WEEK; r++) for (const f of ABILITY_FAMILIES) puzzles.push({ kind: 'puzzle', family: f });
  const planned: Step[] = [0, 1, 2].map((rank) => ({ kind: 'planned' as const, rank: rank as 0 | 1 | 2 }));

  // Interleave: choice, puzzle, choice, puzzle, planned… so the week never feels like a test block.
  // Interleave so the week never feels like a test block: a puzzle follows every
  // choice and every planned activity; if there are more puzzles than slots,
  // the extra ones pair up after planned activities (never more than 2 in a row).
  type Slot = { after: Step; isPlanned: boolean };
  const slots: Slot[] = [];
  choices.forEach((c, i) => {
    slots.push({ after: c, isPlanned: false });
    if (i % 2 === 1 && planned.length) slots.push({ after: planned.shift()!, isPlanned: true });
  });
  planned.forEach((p) => slots.push({ after: p, isPlanned: true }));
  let extra = Math.max(0, puzzles.length - slots.length);
  const body: Step[] = [];
  let pi = 0;
  for (const slot of slots) {
    body.push(slot.after);
    if (pi < puzzles.length) body.push(puzzles[pi++]);
    if (slot.isPlanned && extra > 0 && pi < puzzles.length) { body.push(puzzles[pi++]); extra--; }
  }
  body.push(...puzzles.slice(pi));
  return [
    { kind: 'season' },
    { kind: 'dialogue', script: `w${week}_intro` },
    { kind: 'planner', setId: `PLAN-W${week}` },
    ...body,
    { kind: 'build' },
    { kind: 'dialogue', script: `w${week}_outro` },
    { kind: 'letter' },
    { kind: 'complete' },
  ];
}
