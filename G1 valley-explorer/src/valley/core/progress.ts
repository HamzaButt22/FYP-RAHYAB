/**
 * Journey progress — a pure reducer. The whole JourneyState is checkpointed to storage after every
 * committed action, so a killed app resumes at the same level and the same in-level step.
 *
 * Every action is idempotent (repeat taps or a replayed action cannot double-advance the journey).
 */
import type { LevelId } from '../contract/events';
import { JOURNEY } from './journey';

export type PlayableLevelId = Exclude<LevelId, 'journey'>;

export interface JourneyState {
  version: 1;
  sessionId: string;
  seed: number;
  startedAt: string;
  /** index (1..8) of the level the student is in or will start next */
  currentIndex: number;
  /** level currently open, or null when the student is on the journey map */
  activeLevel: PlayableLevelId | null;
  completed: PlayableLevelId[];
  /** per-level serialisable state for mid-level resume; cleared when a level completes */
  levelStates: Partial<Record<PlayableLevelId, unknown>>;
  reflectionDone: boolean;
  finished: boolean;
}

export type JourneyAction =
  | { type: 'OPEN_LEVEL'; level: PlayableLevelId }
  | { type: 'SAVE_LEVEL_STATE'; level: PlayableLevelId; state: unknown }
  | { type: 'CLOSE_LEVEL' }
  | { type: 'COMPLETE_LEVEL'; level: PlayableLevelId }
  | { type: 'COMPLETE_REFLECTION' }
  | { type: 'FINISH' };

export function initialJourney(sessionId: string, seed: number, startedAt: string): JourneyState {
  return { version: 1, sessionId, seed, startedAt, currentIndex: 1, activeLevel: null, completed: [], levelStates: {}, reflectionDone: false, finished: false };
}

/** A level is unlocked if it is completed or is the next one in order. Levels are played in order. */
export function isUnlocked(s: JourneyState, level: PlayableLevelId): boolean {
  const def = JOURNEY.find((l) => l.id === level);
  if (!def) return false;
  return s.completed.includes(level) || def.index === s.currentIndex;
}

export function journeyReducer(s: JourneyState, a: JourneyAction): JourneyState {
  if (s.finished && a.type !== 'FINISH') return s;
  switch (a.type) {
    case 'OPEN_LEVEL': {
      // completed levels are not replayable in assessment mode (would double-count evidence)
      if (s.completed.includes(a.level) || !isUnlocked(s, a.level) || s.activeLevel === a.level) return s;
      return { ...s, activeLevel: a.level };
    }
    case 'SAVE_LEVEL_STATE': {
      if (s.activeLevel !== a.level) return s;
      return { ...s, levelStates: { ...s.levelStates, [a.level]: a.state } };
    }
    case 'CLOSE_LEVEL':
      return s.activeLevel ? { ...s, activeLevel: null } : s;
    case 'COMPLETE_LEVEL': {
      if (s.completed.includes(a.level)) return { ...s, activeLevel: null };
      const def = JOURNEY.find((l) => l.id === a.level);
      if (!def || def.index !== s.currentIndex) return s;
      const levelStates = { ...s.levelStates };
      delete levelStates[a.level];
      return { ...s, completed: [...s.completed, a.level], currentIndex: s.currentIndex + 1, activeLevel: null, levelStates };
    }
    case 'COMPLETE_REFLECTION':
      return s.completed.length === JOURNEY.length ? { ...s, reflectionDone: true } : s;
    case 'FINISH':
      return s.completed.length === JOURNEY.length ? { ...s, finished: true, activeLevel: null } : s;
  }
}

export const allLevelsDone = (s: JourneyState) => s.completed.length === JOURNEY.length;
