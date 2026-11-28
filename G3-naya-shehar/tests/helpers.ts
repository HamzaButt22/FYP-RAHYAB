import { GameEngine } from '@/game/engine/GameEngine';
import { MemoryStore } from '@/database/store';
import { RIASEC, Riasec, Week } from '@/assessment/types';
import { checkAnswer } from '@/assessment/abilities/staircase';
import { Puzzle } from '@/assessment/abilities/puzzleTypes';
import { DEFAULT_AVATAR } from '@/game/avatar';
import { plannerForWeek } from '@/game/content/planner';
import { PRACTICE_PUZZLES } from '@/assessment/abilities/bank';

export const DAY = 24 * 60 * 60 * 1000;

export class FakeClock {
  constructor(public t = Date.UTC(2026, 10, 1, 9)) {}
  now = () => this.t;
  advance(ms: number) { this.t += ms; }
}

/** A simulated player with fixed category preferences and a puzzle skill. */
export interface Persona { pref: Record<Riasec, number>; solve: (p: Puzzle) => boolean; react?: boolean }

export function correctAnswer(p: Puzzle) {
  switch (p.kind) {
    case 'numeric': return { kind: 'number' as const, value: p.answer };
    case 'route': {
      // brute force the best order for the simulated player
      const perms = (xs: string[]): string[][] => xs.length <= 1 ? [xs] : xs.flatMap((x, i) => perms([...xs.slice(0, i), ...xs.slice(i + 1)]).map((r) => [x, ...r]));
      const best = perms(p.stops.map((s) => s.id)).find((o) => checkAnswer(p, { kind: 'route', order: o }).correct)!;
      return { kind: 'route' as const, order: best };
    }
    default: return { kind: 'index' as const, value: p.answer };
  }
}

/** Plays one whole week through the engine, exactly as the UI does. */
export function playWeek(engine: GameEngine, week: Week, persona: Persona) {
  engine.startOrResume(week);
  let guard = 0;
  while (guard++ < 200) {
    const step = engine.currentStep()!;
    switch (step.kind) {
      case 'choice': {
        const chosen = persona.pref[step.left] >= persona.pref[step.right] ? step.left : step.right;
        engine.recordChoice(step.scenarioId, [step.left, step.right], chosen);
        if (persona.react && !step.practice) engine.recordReaction(step.scenarioId, chosen, persona.pref[chosen] > 0.5 ? 'loved' : 'okay');
        break;
      }
      case 'planner': {
        const offered = plannerForWeek(week as 1 | 2 | 3 | 4).activities.map((a) => a.category);
        const ranked = [...offered].sort((a, b) => persona.pref[b] - persona.pref[a]).slice(0, 3);
        engine.commitPlan(ranked);
        break;
      }
      case 'planned': engine.completePlanned(step.rank); break;
      case 'puzzle': {
        const p = engine.nextPuzzle(step.family)!;
        const ok = persona.solve(p);
        engine.recordPuzzle(p, ok, true, ok ? 1 : 2);
        break;
      }
      case 'practice_puzzle': {
        const p = PRACTICE_PUZZLES.find((x) => x.id === step.puzzleId)!;
        engine.recordPuzzle(p, true, true, 1);
        break;
      }
      case 'build': engine.finishSeasonProject(); break;
      case 'complete': engine.completeSession(); return;
      default: break;
    }
    engine.advance();
  }
  throw new Error('week did not finish');
}

export function newGame(clock = new FakeClock()) {
  const store = new MemoryStore();
  const engine = new GameEngine(store, clock.now);
  engine.setAvatar(DEFAULT_AVATAR);
  return { store, engine, clock };
}

export const prefFromOrder = (order: Riasec[]): Record<Riasec, number> =>
  Object.fromEntries(RIASEC.map((c) => [c, 1 - order.indexOf(c) / 6])) as Record<Riasec, number>;
