/**
 * Weekly unlocking without a server.
 *
 * Rules
 *  • Prologue (week 0) is always available until completed.
 *  • Week 1 opens as soon as the prologue is complete.
 *  • Week n+1 opens WEEK_INTERVAL after week n was completed.
 *  • A session already started can always be finished and resumed.
 *
 * Clock protection (offline best effort)
 *  • We keep the highest wall-clock time ever seen (`lastSeenMs`).
 *  • If the device clock is earlier than that by more than CLOCK_SLACK, the
 *    clock was moved back. We count an anomaly and use `lastSeenMs` instead.
 *  • A clock moved FORWARD cannot be detected offline. The anomaly counter
 *    catches the common "jump forward, then jump back" pattern after the fact.
 *    See docs/ARCHITECTURE.md › Limitations.
 */
import { Week } from '@/assessment/types';

export const WEEK_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000;
/** Development builds only: lets testers see the full loop quickly. */
export const DEV_INTERVAL_MS = 2 * 60 * 1000;
export const CLOCK_SLACK_MS = 10 * 60 * 1000;

export interface ScheduleState {
  completedAt: Partial<Record<Week, number>>;
  startedAt: Partial<Record<Week, number>>;
  lastSeenMs: number;
  clockAnomalies: number;
}

export const initialSchedule = (): ScheduleState => ({ completedAt: {}, startedAt: {}, lastSeenMs: 0, clockAnomalies: 0 });

export function observeClock(s: ScheduleState, deviceNowMs: number): { state: ScheduleState; now: number; anomaly: boolean } {
  if (s.lastSeenMs && deviceNowMs < s.lastSeenMs - CLOCK_SLACK_MS) {
    return { state: { ...s, clockAnomalies: s.clockAnomalies + 1 }, now: s.lastSeenMs, anomaly: true };
  }
  const now = Math.max(deviceNowMs, s.lastSeenMs);
  return { state: { ...s, lastSeenMs: now }, now, anomaly: false };
}

export type WeekStatus = 'completed' | 'in_progress' | 'available' | 'locked';

export function availableAt(s: ScheduleState, week: Week, interval = WEEK_INTERVAL_MS): number | null {
  if (week === 0) return 0;
  const prev = s.completedAt[(week - 1) as Week];
  if (prev === undefined) return null;
  return week === 1 ? prev : prev + interval;
}

export function weekStatus(s: ScheduleState, week: Week, now: number, interval = WEEK_INTERVAL_MS): WeekStatus {
  if (s.completedAt[week] !== undefined) return 'completed';
  if (s.startedAt[week] !== undefined) return 'in_progress';
  const at = availableAt(s, week, interval);
  return at !== null && now >= at ? 'available' : 'locked';
}

/** The week the player should do next, or null when all five are complete. */
export function currentWeek(s: ScheduleState): Week | null {
  for (const w of [0, 1, 2, 3, 4] as Week[]) if (s.completedAt[w] === undefined) return w;
  return null;
}

export function startWeek(s: ScheduleState, week: Week, now: number, interval = WEEK_INTERVAL_MS): ScheduleState {
  const st = weekStatus(s, week, now, interval);
  if (st === 'in_progress') return s;
  if (st !== 'available') throw new Error(`week ${week} is ${st}`);
  return { ...s, startedAt: { ...s.startedAt, [week]: now } };
}

export function completeWeek(s: ScheduleState, week: Week, now: number): ScheduleState {
  if (s.startedAt[week] === undefined) throw new Error(`week ${week} was never started`);
  return { ...s, completedAt: { ...s.completedAt, [week]: now } };
}

/** Highest week the player has reached (for district unlocks on the map). */
export function reachedWeek(s: ScheduleState): Week {
  let w: Week = 0;
  for (const k of [0, 1, 2, 3, 4] as Week[]) if (s.startedAt[k] !== undefined) w = k;
  return w;
}
