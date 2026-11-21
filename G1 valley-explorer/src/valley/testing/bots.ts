/**
 * Scripted players that drive the REAL level machines through LevelRunner + GameSession.
 * They demonstrate that the pipeline distinguishes different behaviour — NOT that scores are valid.
 */
import { mulberry32 } from '../core/rng';
import { RIASEC_CONFIG, type Code } from '../core/riasec/scoring';
import { ALL_TASKS, PARK_ROLES, WORKSHOP_TASKS, PARK_TASKS } from '../core/tasks';
import { LevelRunner, MACHINES } from '../core/levels/runner';
import { caravanRoute, canCloseDay, canPick, VALLEY_AREAS, type CaravanState, type ParkState, type WorkshopState } from '../core/levels/interestLevels';
import { stepAvailable } from '../core/levels/machine';
import { ORDERS_ITEMS, optimum } from '../core/items/workshopOrders';
import { MAP_ITEMS } from '../core/items/mapRoom';
import { PATTERN_ITEMS } from '../core/items/patternGate';
import { LOCK_ITEMS } from '../core/items/vaultLocks';
import { JOURNEY } from '../core/journey';
import type { GameSession } from '../services/session';
import type { AbilityState } from '../core/levels/abilityLevel';
import { BIG5_BY_ID, JOURNAL_PAGES, type Trait } from '../core/bigfive/items';
import { big5Event } from '../core/bigfive/journal';

/** Answer the journal page owed for a completed stop the way the persona would (skips per journalSkip). */
export async function answerJournal(session: GameSession, p: Persona, level: keyof typeof JOURNAL_PAGES, rnd: () => number) {
  for (const id of JOURNAL_PAGES[level] ?? []) {
    const item = BIG5_BY_ID[id];
    const level5 = p.traits[item.trait];
    const answer = rnd() < p.journalSkip ? null : item.key === 1 ? level5 : 6 - level5;
    await session.commit({ events: [big5Event(level, id, answer, 2500 + Math.floor(rnd() * 4000))] });
  }
}

export interface Persona {
  name: string;
  /** categories in order of preference */
  likes: Code[];
  optionalRate: number;
  campRate: number;
  leaveRate: number;
  accuracy: number;
  hintRate: number;
  seed: number;
  /** how the persona would answer the Big Five journal: 1–5 per trait (keyed direction), plus skip rate */
  traits: Record<Trait, number>;
  journalSkip: number;
}

export const PERSONAS: Record<string, Persona> = {
  maker: { name: 'maker', likes: ['R', 'I', 'C'], optionalRate: 0.8, campRate: 0, leaveRate: 0, accuracy: 0.9, hintRate: 0.1, seed: 1, traits: { O: 4, C: 5, E: 2, A: 3, N: 2 }, journalSkip: 0 },
  carer: { name: 'carer', likes: ['S', 'A', 'E'], optionalRate: 0.7, campRate: 0, leaveRate: 0.05, accuracy: 0.6, hintRate: 0.3, seed: 2, traits: { O: 3, C: 3, E: 4, A: 5, N: 3 }, journalSkip: 0 },
  organiser: { name: 'organiser', likes: ['C', 'E', 'I'], optionalRate: 0.5, campRate: 0.05, leaveRate: 0, accuracy: 0.75, hintRate: 0.2, seed: 3, traits: { O: 2, C: 5, E: 4, A: 3, N: 2 }, journalSkip: 0.05 },
  skipper: { name: 'skipper', likes: ['A', 'R', 'S'], optionalRate: 0.1, campRate: 0.8, leaveRate: 0.6, accuracy: 0.3, hintRate: 0, seed: 4, traits: { O: 3, C: 1, E: 3, A: 2, N: 4 }, journalSkip: 0.5 },
};

const cat = (taskId: string): Code => Object.keys(RIASEC_CONFIG.tasks[taskId])[0] as Code;
const rank = (p: Persona, taskId: string) => { const i = p.likes.indexOf(cat(taskId)); return i < 0 ? 99 : i; };

async function doJob(runner: LevelRunner<any, any>, getJob: () => { taskId: string; done: string[] } | null, p: Persona, rnd: () => number, advance: () => void) {
  const job = getJob();
  if (!job) return;
  const task = ALL_TASKS[job.taskId];
  const leaveEarly = rnd() < p.leaveRate;
  for (const step of task.steps) {
    advance();
    const j = getJob();
    if (!j) return;
    if (leaveEarly && j.done.length >= 1) break;
    if (step.optional && rnd() > p.optionalRate) continue;
    if (stepAvailable(task, j as any, step)) await runner.dispatch({ type: 'STEP', stepId: step.id }).done;
  }
  advance();
  await runner.dispatch({ type: leaveEarly ? 'LEAVE_JOB' : 'FINISH_JOB' }).done;
}

/** Plays the whole journey. `advance` moves a fake clock forward (ms) between actions. */
export async function playJourney(session: GameSession, p: Persona, advance: (ms: number) => void, opts: { stopAfterLevel?: number; journal?: boolean } = {}) {
  const rnd = mulberry32(p.seed * 7919);
  const tick = () => advance(800 + Math.floor(rnd() * 2500));
  for (const def of JOURNEY) {
    if (session.journey.completed.includes(def.id)) continue;
    const runner = new LevelRunner<any, any>(session, MACHINES[def.id]);
    await runner.open();
    switch (def.id) {
      case 'valley_gate':
        for (const a of VALLEY_AREAS.slice(0, 1 + Math.floor(rnd() * 6))) { tick(); await runner.dispatch({ type: 'VISIT', area: a.id }).done; }
        await runner.dispatch({ type: 'ENTER' }).done;
        break;
      case 'crossroads_caravan': {
        const route = caravanRoute(session.seed);
        while ((runner.state as CaravanState).stop < route.length && !runner.completed) {
          const s = runner.state as CaravanState;
          if (s.job) { await doJob(runner, () => (runner.state as CaravanState).job, p, rnd, tick); continue; }
          tick();
          if (rnd() < p.campRate) { await runner.dispatch({ type: 'CHOOSE', position: 3 }).done; continue; }
          const offered = route[s.stop];
          const best = offered.map((t, i) => [rank(p, t), i] as const).sort((a, b) => a[0] - b[0])[0][1];
          await runner.dispatch({ type: 'CHOOSE', position: best as 0 | 1 | 2 }).done;
        }
        break;
      }
      case 'career_workshop': {
        const order = [...WORKSHOP_TASKS].sort((a, b) => rank(p, a.id) - rank(p, b.id));
        for (let guard = 0; guard < 20 && !runner.completed; guard++) {
          const s = runner.state as WorkshopState;
          if (s.bonusOffer) { tick(); await runner.dispatch({ type: 'BONUS', take: rnd() < p.optionalRate }).done; continue; }
          if (s.job) { await doJob(runner, () => (runner.state as WorkshopState).job, p, rnd, tick); continue; }
          const pick = order.find((t) => canPick(s, t.id));
          if (pick && (Object.values(s.rounds).reduce((a, b) => a + b, 0) < 3 || rnd() < 0.7)) { tick(); await runner.dispatch({ type: 'PICK', taskId: pick.id }).done; continue; }
          if (canCloseDay(s)) await runner.dispatch({ type: 'CLOSE_DAY' }).done;
        }
        break;
      }
      case 'park_mission': {
        const role = PARK_ROLES.find((r) => RIASEC_CONFIG.roles[r.id] === p.likes[0])!;
        await runner.dispatch({ type: 'ROLE', role: role.id }).done;
        const order = [...PARK_TASKS].sort((a, b) => rank(p, a.id) - rank(p, b.id));
        for (let guard = 0; guard < 40 && !runner.completed; guard++) {
          const s = runner.state as ParkState;
          if (s.phaseBreak) { await runner.dispatch({ type: 'CONTINUE' }).done; continue; }
          if (s.job) { await doJob(runner, () => (runner.state as ParkState).job, p, rnd, tick); continue; }
          const top = order[Math.floor(rnd() * 2)];
          tick();
          await runner.dispatch({ type: 'PICK', taskId: top.id }).done;
        }
        break;
      }
      default: {
        // ability levels
        const keyFor = (i: number): { right: unknown; wrong: unknown } => {
          if (def.id === 'workshop_orders') { const it = ORDERS_ITEMS[i]; return { right: optimum(it).sets[0], wrong: [it.orders[0].id] }; }
          if (def.id === 'map_room') { const c = MAP_ITEMS[i].correctIndex; return { right: c, wrong: (c + 1) % 4 }; }
          if (def.id === 'pattern_gate') { const c = PATTERN_ITEMS[i].correctIndex; return { right: c, wrong: (c + 1) % 4 }; }
          const ans = LOCK_ITEMS[i].answer; return { right: ans, wrong: [ans[1], ans[2], ans[0]] };
        };
        while (!runner.completed) {
          const s = runner.state as AbilityState;
          if (s.phase === 'feedback') {
            if (s.lastCorrect === false && s.attempt < 3 && runner.dispatch({ type: 'RETRY' }).changed) continue;
            tick();
            await runner.dispatch({ type: 'NEXT' }).done;
            continue;
          }
          const k = keyFor(s.index);
          if (rnd() < p.hintRate) await runner.dispatch({ type: 'HINT' }).done;
          tick();
          if (p.campRate > 0.5 && rnd() < 0.15) { await runner.dispatch({ type: 'SKIP' }).done; continue; }
          const practiceRetry = s.attempt > 1;
          await runner.dispatch({ type: 'SUBMIT', response: practiceRetry || rnd() < p.accuracy ? k.right : k.wrong }).done;
        }
      }
    }
    if (opts.journal !== false && session.journey.completed.includes(def.id)) await answerJournal(session, p, def.id, rnd);
    if (opts.stopAfterLevel === def.index) return;
  }
}
