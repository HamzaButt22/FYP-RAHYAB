// Where the week loop keeps its place on the phone (FR-15): week progress and each step's saved module
// state, per student, in the encrypted local database (sync/sqliteOutbox.ts, the kv table). Shared phones
// keep each student's place apart. The active plan is the sample plan until the game's content exists.

import type { JsonValue } from './contract';
import type { SaveStore } from './run';
import { SAMPLE_PLAN } from './samplePlan';
import { fitProgress, type Progress, type WeekPlan } from './weekLoop';

type Kv = {
  get<T>(key: string): T | null;
  set(key: string, value: unknown): void;
};

export const ACTIVE_PLAN: WeekPlan = SAMPLE_PLAN;

export function loadProgress(kv: Kv, studentId: string, plan: WeekPlan = ACTIVE_PLAN): Progress {
  return fitProgress(plan, kv.get<Progress>(`progress:${studentId}`));
}

export function saveProgress(kv: Kv, studentId: string, progress: Progress): void {
  kv.set(`progress:${studentId}`, progress);
}

/** A module's saved state for one student and one step. */
export function moduleStore(kv: Kv, studentId: string): SaveStore {
  return {
    load: (key: string) => kv.get<JsonValue>(`module:${studentId}:${key}`),
    save: (key: string, state: JsonValue) => kv.set(`module:${studentId}:${key}`, state),
  };
}
