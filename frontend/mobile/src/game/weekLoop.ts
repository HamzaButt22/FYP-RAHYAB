// The week loop (FR-13-17, FR-52): which step of which week comes next, what is left, and when results open.
//
// A week plan is data: weeks in order, each a list of steps, each step a game module from the registry plus
// the parameters it should show (contract 1.1.0, GameContext.params). The plan comes from the game's
// content; the app only walks through it. Progress is saved after every finished step (FR-15), so closing
// the app resumes at the same step, and the module gets its own saved state back.
// Pure functions, tested with `pnpm test`.

import type { JsonObject } from './contract.ts';

export interface Step {
  /** Unique in the plan, e.g. "w2s3"; also the key for the module's saved progress. */
  id: string;
  module: string;
  params?: JsonObject;
}

export interface Week {
  week: number; // 0 = prologue, then 1-4 (the envelope allows 0-4)
  /** Practice weeks are played but never scored (FR-14: the prologue). */
  practice: boolean;
  steps: Step[];
}

export interface WeekPlan {
  id: string;
  /** Rough minutes per step, for the "time left" estimate on Home (FR-13). */
  minutesPerStep: number;
  weeks: Week[];
}

export interface Progress {
  planId: string;
  /** Index into plan.weeks. */
  weekIndex: number;
  /** Index into that week's steps: the next step to play. */
  stepIndex: number;
  /** Week numbers finished, scored or not. */
  completedWeeks: number[];
}

/** Scored weeks needed before results open (FR-52). */
export const WEEKS_FOR_RESULTS = 4;

export function startProgress(plan: WeekPlan): Progress {
  return { planId: plan.id, weekIndex: 0, stepIndex: 0, completedWeeks: [] };
}

/** Progress saved for another version of the plan stays valid: finished weeks count, the position is clamped. */
export function fitProgress(plan: WeekPlan, saved: Progress | null): Progress {
  if (!saved) return startProgress(plan);
  const weekIndex = Math.min(Math.max(0, saved.weekIndex), plan.weeks.length);
  const steps = plan.weeks[weekIndex]?.steps.length ?? 0;
  return {
    planId: plan.id,
    weekIndex,
    stepIndex: Math.min(Math.max(0, saved.stepIndex), steps),
    completedWeeks: [...new Set(saved.completedWeeks)].sort((a, b) => a - b),
  };
}

export function currentStep(plan: WeekPlan, p: Progress): { week: Week; step: Step; isLast: boolean } | null {
  const week = plan.weeks[p.weekIndex];
  if (!week) return null; // every week played
  const step = week.steps[p.stepIndex];
  if (!step) return null;
  return { week, step, isLast: p.stepIndex === week.steps.length - 1 };
}

/** After a step finished: the next position, and whether a week (or the whole plan) was completed. */
export function advance(plan: WeekPlan, p: Progress): { progress: Progress; weekDone: Week | null; allDone: boolean } {
  const week = plan.weeks[p.weekIndex];
  if (!week) return { progress: p, weekDone: null, allDone: true };
  if (p.stepIndex + 1 < week.steps.length) {
    return { progress: { ...p, stepIndex: p.stepIndex + 1 }, weekDone: null, allDone: false };
  }
  const completedWeeks = [...new Set([...p.completedWeeks, week.week])].sort((a, b) => a - b);
  const next: Progress = { ...p, weekIndex: p.weekIndex + 1, stepIndex: 0, completedWeeks };
  return { progress: next, weekDone: week, allDone: next.weekIndex >= plan.weeks.length };
}

export function scoredWeeksDone(plan: WeekPlan, p: Progress): number {
  const scored = new Set(plan.weeks.filter((w) => !w.practice).map((w) => w.week));
  return p.completedWeeks.filter((w) => scored.has(w)).length;
}

export function resultsUnlocked(plan: WeekPlan, p: Progress): boolean {
  return scoredWeeksDone(plan, p) >= WEEKS_FOR_RESULTS;
}

export function minutesLeftThisWeek(plan: WeekPlan, p: Progress): number {
  const week = plan.weeks[p.weekIndex];
  return week ? (week.steps.length - p.stepIndex) * plan.minutesPerStep : 0;
}

/** Plan mistakes: unknown modules, duplicate step ids, weeks outside 0-4 or out of order. Empty when fine. */
export function planProblems(plan: WeekPlan, knownModules: ReadonlySet<string>): string[] {
  const out: string[] = [];
  const ids = new Set<string>();
  let lastWeek = -1;
  for (const w of plan.weeks) {
    if (!Number.isInteger(w.week) || w.week < 0 || w.week > 4) out.push(`week ${w.week}: weeks are 0-4`);
    if (w.week <= lastWeek) out.push(`week ${w.week}: weeks must be in increasing order`);
    lastWeek = w.week;
    if (w.steps.length === 0) out.push(`week ${w.week}: no steps`);
    for (const s of w.steps) {
      if (ids.has(s.id)) out.push(`step ${s.id}: used twice`);
      ids.add(s.id);
      if (!knownModules.has(s.module)) out.push(`step ${s.id}: module '${s.module}' is not in the registry`);
    }
  }
  return out;
}
