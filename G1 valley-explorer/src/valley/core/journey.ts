import type { LevelId } from '../contract/events';

export type LevelKind = 'context' | 'interest' | 'ability';
export type AbilityFamily = 'planning_numerical' | 'spatial' | 'abstract' | 'logical';

export interface LevelDef {
  index: number; // 1..8
  id: Exclude<LevelId, 'journey'>;
  title: string;
  tagline: string;
  kind: LevelKind;
  family?: AbilityFamily;
  /** rough minutes, shown to the student */
  minutes: number;
  /** origin in the original Pygame game, for traceability */
  origin: string;
}

/**
 * The revised 8-level journey (approved 15 Nov 2026: "8-level revised journey").
 * Interest and ability levels alternate so that the student never does three similar tasks in a row.
 */
export const JOURNEY: readonly LevelDef[] = [
  { index: 1, id: 'valley_gate', title: 'The Valley Gate', tagline: 'Meet Ustad Mehr and look around the valley.', kind: 'context', minutes: 2, origin: 'Level 1 Whispering Valley (reworked into an unscored welcome)' },
  { index: 2, id: 'crossroads_caravan', title: 'Crossroads Caravan', tagline: 'Pick a road at every fork. No road is wrong.', kind: 'interest', minutes: 7, origin: 'Level 10 Crossroads Caravan (kept, touch controls)' },
  { index: 3, id: 'workshop_orders', title: 'Workshop Orders', tagline: 'Use the materials wisely to earn the most coins.', kind: 'ability', family: 'planning_numerical', minutes: 5, origin: 'Level 2 Workshop (redesigned as correctness-scored puzzles)' },
  { index: 4, id: 'career_workshop', title: 'The Makers’ Workshop', tagline: 'Spend your day at the benches you like.', kind: 'interest', minutes: 6, origin: 'Level 7 Career Workshop Challenge (kept, simplified)' },
  { index: 5, id: 'map_room', title: 'The Map Room', tagline: 'Find the map piece that has only been turned.', kind: 'ability', family: 'spatial', minutes: 4, origin: 'New (replaces Level 4 timed vault)' },
  { index: 6, id: 'pattern_gate', title: 'The Pattern Gate', tagline: 'Work out what comes next.', kind: 'ability', family: 'abstract', minutes: 4, origin: 'New' },
  { index: 7, id: 'park_mission', title: 'Riverside Park Day', tagline: 'Help reopen the park — your way.', kind: 'interest', minutes: 6, origin: 'Level 8 Integrated Career Mission (simplified)' },
  { index: 8, id: 'vault_locks', title: 'The Vault Locks', tagline: 'Use the clues to open each lock. No timer.', kind: 'ability', family: 'logical', minutes: 5, origin: 'Level 4 Crumbling Vault (untimed logic locks; pressure mechanics removed)' },
];

export const levelByIndex = (i: number): LevelDef | undefined => JOURNEY.find((l) => l.index === i);
export const levelById = (id: LevelId): LevelDef | undefined => JOURNEY.find((l) => l.id === id);
