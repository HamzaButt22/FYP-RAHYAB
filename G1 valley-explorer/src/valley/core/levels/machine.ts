/**
 * Level mechanics as pure state machines: reduce(state, action, ctx) -> { state, events, complete }.
 * Screens only render state and dispatch actions; machines decide what is allowed and which evidence
 * is recorded. This keeps the assessment rules testable without a phone and lets bots play the real logic.
 *
 * Every reducer must be IDEMPOTENT for repeated taps: an action that is not allowed in the current
 * state returns the same state and no events.
 */
import type { EventSpec, LevelId } from '../../contract/events';
import type { Step as TaskStep, TaskDef } from '../tasks';

export interface Ctx {
  seed: number;
  /** active game time (ms) at the moment of the action — pause-safe */
  t: number;
}

export interface Result<S> {
  state: S;
  events: EventSpec[];
  complete?: boolean;
}

export interface LevelMachine<S, A> {
  id: Exclude<LevelId, 'journey'>;
  init(ctx: Ctx): Result<S>;
  reduce(state: S, action: A, ctx: Ctx): Result<S>;
}

export const same = <S,>(state: S): Result<S> => ({ state, events: [] });

// ---- shared mini-job used by the three interest levels ------------------------------------------

export interface Job {
  taskId: string;
  round: number;
  done: string[];
  startedAt: number;
}

export const startJob = (taskId: string, round: number, t: number): Job => ({ taskId, round, done: [], startedAt: t });

export const requiredSteps = (task: TaskDef) => task.steps.filter((s) => !s.optional);
export const optionalSteps = (task: TaskDef) => task.steps.filter((s) => s.optional);
export const requiredDone = (task: TaskDef, job: Job) => requiredSteps(task).filter((s) => job.done.includes(s.id)).length;
export const canFinish = (task: TaskDef, job: Job) => requiredDone(task, job) === requiredSteps(task).length;

/** Required steps are done in order; optional steps any time after the first required step. */
export function stepAvailable(task: TaskDef, job: Job, step: TaskStep): boolean {
  if (job.done.includes(step.id)) return false;
  const req = requiredSteps(task);
  if (!step.optional) {
    const i = req.findIndex((s) => s.id === step.id);
    return req.slice(0, i).every((s) => job.done.includes(s.id));
  }
  return job.done.length > 0;
}

export function jobStepEvent(level: LevelMachine<any, any>['id'], task: TaskDef, job: Job, stepId: string): { job: Job; events: EventSpec[] } | null {
  const step = task.steps.find((s) => s.id === stepId);
  if (!step || !stepAvailable(task, job, step)) return null;
  return {
    job: { ...job, done: [...job.done, stepId] },
    events: [{ level, type: 'ACTIVITY_STEP', data: { task_id: task.id, round: job.round, step_id: stepId, optional: step.optional } }],
  };
}

export function jobEndEvent(level: LevelMachine<any, any>['id'], task: TaskDef, job: Job, t: number, extra: Record<string, unknown> = {}): EventSpec {
  const completed = canFinish(task, job);
  return {
    level, type: 'ACTIVITY_END',
    data: {
      task_id: task.id, round: job.round, outcome: completed ? 'completed' : 'abandoned',
      required_done: requiredDone(task, job), required_total: requiredSteps(task).length,
      optional_taken: optionalSteps(task).filter((s) => job.done.includes(s.id)).length, optional_total: optionalSteps(task).length,
      engaged_ms: Math.max(0, Math.round(t - job.startedAt)), expected_ms: task.expectedMs, hints: 0, performance: null, ...extra,
    },
  };
}
