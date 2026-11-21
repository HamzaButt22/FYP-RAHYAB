/**
 * Mechanics of the context level (1) and the three interest levels (2, 4, 7).
 * Nothing here can be failed; leaving an activity is always allowed; no timers; skill is never scored.
 */
import { buildRoute, CARAVAN_STOPS } from '../caravan';
import { mulberry32, subSeed } from '../rng';
import { ALL_TASKS, CARAVAN_TASKS, PARK_ROLES, PARK_TASKS, WORKSHOP_TASKS } from '../tasks';
import { canFinish, jobEndEvent, jobStepEvent, same, startJob, type Job, type LevelMachine } from './machine';

// =============================== Level 1 — The Valley Gate (context, unscored) ===================
export const VALLEY_AREAS = [
  { id: 'yard', title: 'Wainwright’s Yard', text: 'Wheels, tools and timber. Later you may fix things here.' },
  { id: 'hill', title: 'Observatory Hill', text: 'Lanterns and old notebooks. Some puzzles need investigating.' },
  { id: 'wall', title: 'The Painted Wall', text: 'A huge wall waiting for colours and ideas.' },
  { id: 'camp', title: 'Fireside Camp', text: 'Travellers rest here. Some of them need a hand.' },
  { id: 'bazaar', title: 'The Bazaar', text: 'Busy stalls, deals and a crowd to win over.' },
  { id: 'ledger', title: 'Ledger House', text: 'Shelves, lists and records to keep in order.' },
] as const;

export interface GateState { visited: string[]; }
export type GateAction = { type: 'VISIT'; area: string } | { type: 'ENTER' };

export const valleyGate: LevelMachine<GateState, GateAction> = {
  id: 'valley_gate',
  init: () => ({ state: { visited: [] }, events: [{ level: 'valley_gate', type: 'LEVEL_START', data: { level_index: 1, scored: false, areas: VALLEY_AREAS.map((a) => a.id) } }] }),
  reduce(s, a) {
    if (a.type === 'VISIT') {
      if (!VALLEY_AREAS.some((x) => x.id === a.area)) return same(s);
      const first = !s.visited.includes(a.area);
      return {
        state: first ? { visited: [...s.visited, a.area] } : s,
        // context only: recorded for research descriptions, never used in scoring
        events: [{ level: 'valley_gate', type: 'EXPLORATION', data: { area_id: a.area, first_visit: first, scored: false }, opportunity: `VG_${a.area}` }],
      };
    }
    return { state: s, complete: true, events: [{ level: 'valley_gate', type: 'LEVEL_COMPLETE', data: { level_index: 1, areas_visited: s.visited.length } }] };
  },
};

// =============================== Level 2 — Crossroads Caravan (interest) ==========================
export interface CaravanState {
  stop: number; // 0..9, 10 = finished
  job: Job | null;
  jobsTried: number;
}
export type CaravanAction =
  | { type: 'CHOOSE'; position: 0 | 1 | 2 | 3 } // 3 = make camp
  | { type: 'STEP'; stepId: string }
  | { type: 'FINISH_JOB' }
  | { type: 'LEAVE_JOB' };

export const caravanRoute = (seed: number) => buildRoute(mulberry32(subSeed(seed, 'caravan')));

export const caravan: LevelMachine<CaravanState, CaravanAction> = {
  id: 'crossroads_caravan',
  init: () => ({
    state: { stop: 0, job: null, jobsTried: 0 },
    events: [{ level: 'crossroads_caravan', type: 'LEVEL_START', data: { level_index: 2, tasks: CARAVAN_TASKS.map((t) => t.id), stops: CARAVAN_STOPS, design: 'BIBD(6,10,3,5,2)' } }],
  }),
  reduce(s, a, ctx) {
    const route = caravanRoute(ctx.seed);
    if (a.type === 'CHOOSE') {
      if (s.job || s.stop >= CARAVAN_STOPS) return same(s);
      const offered = route[s.stop];
      const opp = `CC_STOP_${s.stop}`;
      if (a.position === 3) {
        const next = s.stop + 1;
        const events = [{ level: 'crossroads_caravan' as const, type: 'ROUTE_CHOICE' as const, data: { stop_index: s.stop, offered, chosen: null, position: null }, opportunity: opp }];
        if (next >= CARAVAN_STOPS) events.push({ level: 'crossroads_caravan', type: 'LEVEL_COMPLETE', data: { level_index: 2, jobs_tried: s.jobsTried } } as any);
        return { state: { ...s, stop: next }, events, complete: next >= CARAVAN_STOPS };
      }
      const chosen = offered[a.position];
      return {
        state: { ...s, job: startJob(chosen, s.stop, ctx.t), jobsTried: s.jobsTried + 1 },
        events: [
          { level: 'crossroads_caravan', type: 'ROUTE_CHOICE', data: { stop_index: s.stop, offered, chosen, position: a.position }, opportunity: opp },
          { level: 'crossroads_caravan', type: 'ACTIVITY_CHOICE', data: { task_id: chosen, selected: true, via: 'road' }, opportunity: opp },
          { level: 'crossroads_caravan', type: 'ACTIVITY_START', data: { task_id: chosen, round: s.stop } },
        ],
      };
    }
    if (!s.job) return same(s);
    const task = ALL_TASKS[s.job.taskId];
    if (a.type === 'STEP') {
      const r = jobStepEvent('crossroads_caravan', task, s.job, a.stepId);
      return r ? { state: { ...s, job: r.job }, events: r.events } : same(s);
    }
    if (a.type === 'FINISH_JOB' && !canFinish(task, s.job)) return same(s);
    // FINISH_JOB (required done) or LEAVE_JOB (any time; abandoned if required steps are missing)
    const next = s.stop + 1;
    const events = [jobEndEvent('crossroads_caravan', task, s.job, ctx.t)];
    if (next >= CARAVAN_STOPS) events.push({ level: 'crossroads_caravan', type: 'LEVEL_COMPLETE', data: { level_index: 2, jobs_tried: s.jobsTried } });
    return { state: { ...s, job: null, stop: next }, events, complete: next >= CARAVAN_STOPS };
  },
};

// =============================== Level 4 — The Makers' Workshop (interest) ========================
export const WORKSHOP_BLOCKS = 10;
export const WORKSHOP_MAX_ROUNDS = 3;
export const WORKSHOP_MIN_ROUNDS = 3;

export interface WorkshopState {
  blocks: number;
  rounds: Record<string, number>;
  picks: number;
  job: Job | null;
  bonusOffer: boolean;
}
export type WorkshopAction =
  | { type: 'PICK'; taskId: string }
  | { type: 'STEP'; stepId: string }
  | { type: 'FINISH_JOB' }
  | { type: 'BONUS'; take: boolean }
  | { type: 'LEAVE_JOB' }
  | { type: 'CLOSE_DAY' };

export const totalRounds = (s: WorkshopState) => Object.values(s.rounds).reduce((a, b) => a + b, 0);
export const canPick = (s: WorkshopState, taskId: string) => !s.job && !s.bonusOffer && s.blocks >= 2 && (s.rounds[taskId] ?? 0) < WORKSHOP_MAX_ROUNDS;
export const canCloseDay = (s: WorkshopState) => !s.job && !s.bonusOffer && (totalRounds(s) >= WORKSHOP_MIN_ROUNDS || s.blocks < 2 || WORKSHOP_TASKS.every((t) => !canPick(s, t.id)));

export const careerWorkshop: LevelMachine<WorkshopState, WorkshopAction> = {
  id: 'career_workshop',
  init: () => ({
    state: { blocks: WORKSHOP_BLOCKS, rounds: {}, picks: 0, job: null, bonusOffer: false },
    events: [{ level: 'career_workshop', type: 'LEVEL_START', data: { level_index: 4, tasks: WORKSHOP_TASKS.map((t) => t.id), blocks: WORKSHOP_BLOCKS } }],
  }),
  reduce(s, a, ctx) {
    switch (a.type) {
      case 'PICK': {
        if (!WORKSHOP_TASKS.some((t) => t.id === a.taskId) || !canPick(s, a.taskId)) return same(s);
        const round = s.rounds[a.taskId] ?? 0;
        return {
          state: { ...s, blocks: s.blocks - 1, rounds: { ...s.rounds, [a.taskId]: round + 1 }, picks: s.picks + 1, job: startJob(a.taskId, round, ctx.t) },
          events: [
            { level: 'career_workshop', type: 'ACTIVITY_CHOICE', data: { task_id: a.taskId, selected: true, revisit: round > 0, blocks_left: s.blocks }, opportunity: `CW_PICK_${s.picks}` },
            { level: 'career_workshop', type: 'ACTIVITY_START', data: { task_id: a.taskId, round } },
          ],
        };
      }
      case 'STEP': {
        if (!s.job) return same(s);
        const r = jobStepEvent('career_workshop', ALL_TASKS[s.job.taskId], s.job, a.stepId);
        return r ? { state: { ...s, job: r.job }, events: r.events } : same(s);
      }
      case 'FINISH_JOB': {
        if (!s.job || !canFinish(ALL_TASKS[s.job.taskId], s.job)) return same(s);
        // completing costs one block; then a bonus round is offered if a block is left
        const blocks = s.blocks - 1;
        if (blocks >= 1) return { state: { ...s, blocks, bonusOffer: true }, events: [] };
        return { state: { ...s, blocks, job: null }, events: [jobEndEvent('career_workshop', ALL_TASKS[s.job.taskId], s.job, ctx.t, { bonus_taken: false })] };
      }
      case 'BONUS': {
        if (!s.job || !s.bonusOffer) return same(s);
        const task = ALL_TASKS[s.job.taskId];
        return {
          state: { ...s, blocks: s.blocks - (a.take ? 1 : 0), bonusOffer: false, job: null },
          events: [
            { level: 'career_workshop', type: 'ACTIVITY_STEP', data: { task_id: task.id, round: s.job.round, step_id: 'bonus_offer', optional: true, taken: a.take } },
            jobEndEvent('career_workshop', task, s.job, ctx.t, { bonus_taken: a.take }),
          ],
        };
      }
      case 'LEAVE_JOB': {
        if (!s.job || s.bonusOffer) return same(s);
        return { state: { ...s, job: null }, events: [jobEndEvent('career_workshop', ALL_TASKS[s.job.taskId], s.job, ctx.t, { bonus_taken: false })] };
      }
      case 'CLOSE_DAY': {
        if (!canCloseDay(s)) return same(s);
        return { state: s, complete: true, events: [{ level: 'career_workshop', type: 'LEVEL_COMPLETE', data: { level_index: 4, rounds: totalRounds(s), blocks_left: s.blocks } }] };
      }
    }
  },
};

// =============================== Level 7 — Riverside Park Day (interest) ===========================
export const PARK_PHASES = ['Plan', 'Build', 'Finish'] as const;
export const PARK_SHIFTS = 3;

export interface ParkState {
  phase: number; // 0..2
  shift: number; // 0..PARK_SHIFTS-1
  role: string | null;
  job: Job | null;
  /** true between phases: the student may change role before continuing */
  phaseBreak: boolean;
  picks: Record<string, number>;
}
export type ParkAction =
  | { type: 'ROLE'; role: string }
  | { type: 'PICK'; taskId: string }
  | { type: 'STEP'; stepId: string }
  | { type: 'FINISH_JOB' }
  | { type: 'LEAVE_JOB' }
  | { type: 'CONTINUE' };

export const parkMission: LevelMachine<ParkState, ParkAction> = {
  id: 'park_mission',
  init: () => ({
    state: { phase: 0, shift: 0, role: null, job: null, phaseBreak: false, picks: {} },
    events: [{ level: 'park_mission', type: 'LEVEL_START', data: { level_index: 7, tasks: PARK_TASKS.map((t) => t.id), phases: PARK_PHASES.length, shifts_per_phase: PARK_SHIFTS } }],
  }),
  reduce(s, a, ctx) {
    switch (a.type) {
      case 'ROLE': {
        if (!PARK_ROLES.some((r) => r.id === a.role) || s.job) return same(s);
        if (s.role === null) return { state: { ...s, role: a.role }, events: [{ level: 'park_mission', type: 'ROLE_SELECTED', data: { role: a.role, phase: s.phase }, opportunity: 'PK_ROLE_0' }] };
        if (!s.phaseBreak || s.role === a.role) return same(s);
        return { state: { ...s, role: a.role }, events: [{ level: 'park_mission', type: 'ROLE_CHANGED', data: { role: a.role, previous_role: s.role, phase: s.phase }, opportunity: `PK_ROLE_${s.phase}` }] };
      }
      case 'CONTINUE':
        return s.phaseBreak ? { state: { ...s, phaseBreak: false }, events: [] } : same(s);
      case 'PICK': {
        if (s.role === null || s.job || s.phaseBreak || !PARK_TASKS.some((t) => t.id === a.taskId)) return same(s);
        const n = s.picks[a.taskId] ?? 0;
        const opp = `PK_P${s.phase}_S${s.shift}`;
        return {
          state: { ...s, job: startJob(a.taskId, s.phase * PARK_SHIFTS + s.shift, ctx.t), picks: { ...s.picks, [a.taskId]: n + 1 } },
          events: [
            { level: 'park_mission', type: 'ACTIVITY_CHOICE', data: { task_id: a.taskId, selected: true, revisit: n > 0, phase: s.phase, shift: s.shift, role: s.role }, opportunity: opp },
            { level: 'park_mission', type: 'ACTIVITY_START', data: { task_id: a.taskId, round: s.phase * PARK_SHIFTS + s.shift } },
          ],
        };
      }
      case 'STEP': {
        if (!s.job) return same(s);
        const r = jobStepEvent('park_mission', ALL_TASKS[s.job.taskId], s.job, a.stepId);
        return r ? { state: { ...s, job: r.job }, events: r.events } : same(s);
      }
      case 'FINISH_JOB':
      case 'LEAVE_JOB': {
        if (!s.job) return same(s);
        const task = ALL_TASKS[s.job.taskId];
        if (a.type === 'FINISH_JOB' && !canFinish(task, s.job)) return same(s);
        const events = [jobEndEvent('park_mission', task, s.job, ctx.t)];
        let { phase, shift } = s;
        let phaseBreak = false;
        shift += 1;
        if (shift >= PARK_SHIFTS) { shift = 0; phase += 1; phaseBreak = phase < PARK_PHASES.length; }
        const complete = phase >= PARK_PHASES.length;
        if (complete) events.push({ level: 'park_mission', type: 'LEVEL_COMPLETE', data: { level_index: 7 } });
        return { state: { ...s, job: null, phase, shift, phaseBreak }, events, complete };
      }
    }
  },
};
