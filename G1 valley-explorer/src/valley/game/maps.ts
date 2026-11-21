/**
 * World layouts. Objects are built from game state, so locked/done/highlight always reflect progress.
 * tests/game.test.ts proves every row has the same width and every object can be reached on foot.
 */
import { VALLEY_AREAS } from '../core/levels/interestLevels';
import type { JourneyState } from '../core/progress';
import { JOURNEY } from '../core/journey';
import { ALL_TASKS, PARK_TASKS, WORKSHOP_TASKS } from '../core/tasks';
import type { Pos, TileMap, WorldObject } from './engine/tilemap';

// ------------------------------------------------------------------ the valley (hub + level 1)
export const VALLEY_ROWS = [
  'TT^^^^^^^TT',
  'T..,.=.,..T',
  'T,...=...,T',
  'T..=====..T',
  'T..=...=..T',
  'T~~=...=..T',
  'T..=...=,.T',
  'T..=====..T',
  'T..,.=...,T',
  'T..=====..T',
  'T..=...=..T',
  'T,.=...=~~T',
  'T..=...=..T',
  'T..=====..T',
  'T..,.=.,..T',
  'T.,..=..,.T',
  'TT...=...TT',
  '#####G#####',
  'T,...=..,.T',
  'T..,.=....T',
  'T....=..,.T',
  'T.,..=....T',
  'T....=.,..T',
  'T,...=....T',
  'T....=...,T',
  'TTTTTTTTTTT',
];
export const VALLEY_START: Pos = { x: 5, y: 24 };
export const VALLEY_GATE: Pos = { x: 5, y: 17 };
/** where the player stands after walking through the gate */
export const VALLEY_INSIDE: Pos = { x: 5, y: 16 };

/** Stop 2..8 locations (object tiles; the player stands next to them). */
export const STOP_SPOTS: Record<string, Pos> = {
  crossroads_caravan: { x: 2, y: 14 },
  workshop_orders: { x: 8, y: 12 },
  career_workshop: { x: 2, y: 10 },
  map_room: { x: 8, y: 8 },
  pattern_gate: { x: 2, y: 6 },
  park_mission: { x: 8, y: 4 },
  vault_locks: { x: 5, y: 1 },
};

const SIGN_SPOTS: Record<string, Pos> = {
  yard: { x: 2, y: 19 }, hill: { x: 8, y: 19 }, wall: { x: 2, y: 21 }, camp: { x: 8, y: 21 }, bazaar: { x: 2, y: 23 }, ledger: { x: 8, y: 23 },
};
export const MEHR_SPOT: Pos = { x: 6, y: 22 };
/** after the gate opens, Ustad Mehr waits just inside it */
export const MEHR_INSIDE: Pos = { x: 6, y: 15 };

export function valleyMap(j: JourneyState, visited: readonly string[]): TileMap {
  const gateOpen = j.completed.includes('valley_gate');
  const rows = VALLEY_ROWS.slice();
  if (gateOpen) rows[VALLEY_GATE.y] = rows[VALLEY_GATE.y].replace('G', 'g');
  const objects: WorldObject[] = [];
  const allDone = j.completed.length === JOURNEY.length;
  objects.push({ id: 'mehr', ...(gateOpen ? MEHR_INSIDE : MEHR_SPOT), sprite: 'mehr', action: 'Talk', name: 'Ustad Mehr', solid: true, highlight: (!gateOpen && visited.length === 0) || allDone });
  for (const a of VALLEY_AREAS) {
    const p = SIGN_SPOTS[a.id];
    objects.push({ id: `sign:${a.id}`, ...p, sprite: `sign:${a.id}`, action: 'Read sign', solid: true, done: visited.includes(a.id) });
  }
  if (!gateOpen) objects.push({ id: 'gate', ...VALLEY_GATE, sprite: 'gate', action: 'Open the gate', name: 'Valley Gate', solid: true, highlight: true });
  for (const l of JOURNEY) {
    const p = STOP_SPOTS[l.id];
    if (!p) continue;
    const done = j.completed.includes(l.id);
    const next = l.index === j.currentIndex;
    objects.push({ id: `stop:${l.id}`, ...p, sprite: `stop:${l.id}`, name: `${l.index}. ${l.title}`, solid: true, done, locked: !done && !next, highlight: next && gateOpen,
      action: done ? 'Visit' : next ? (j.levelStates[l.id] !== undefined ? 'Continue' : 'Enter') : 'Locked' });
  }
  return { rows, objects };
}

// ------------------------------------------------------------------ Crossroads Caravan fork
export const FORK_ROWS = [
  'TTTTTTTTT',
  'T=TT=TT=T',
  'T=..=..=T',
  'T=..=..=T',
  'T=======T',
  'T...=...T',
  'T,..=..,T',
  'T...=...T',
  'TTTTTTTTT',
];
export const FORK_START: Pos = { x: 4, y: 7 };
export const FORK_EXITS: Pos[] = [{ x: 1, y: 1 }, { x: 4, y: 1 }, { x: 7, y: 1 }];
export const CAMP_SPOT: Pos = { x: 7, y: 6 };

export function forkMap(offered: string[]): TileMap {
  const objects: WorldObject[] = offered.map((tid, i) => ({
    id: `road:${i}`, ...FORK_EXITS[i], sprite: `task:${tid}`, name: ALL_TASKS[tid].place, trigger: true, tint: ALL_TASKS[tid].tint,
  }));
  objects.push({ id: 'camp', ...CAMP_SPOT, sprite: 'tent', action: 'Make camp', name: 'Camp', solid: true });
  return { rows: FORK_ROWS, objects };
}

// ------------------------------------------------------------------ Makers' Workshop interior
export const WORKSHOP_ROWS = [
  'WWWWWWWWW',
  'WfffffffW',
  'WfffffffW',
  'WfffffffW',
  'WfffffffW',
  'WfffffffW',
  'WfffffffW',
  'WfffffffW',
  'WfffffffW',
  'WWWWfWWWW',
];
export const WORKSHOP_START: Pos = { x: 4, y: 8 };
const BENCH_SPOTS: Pos[] = [{ x: 1, y: 2 }, { x: 7, y: 2 }, { x: 1, y: 4 }, { x: 7, y: 4 }, { x: 1, y: 6 }, { x: 7, y: 6 }];
export const DOOR_SPOT: Pos = { x: 4, y: 9 };

export function workshopMap(rounds: Record<string, number>, canPick: (id: string) => boolean, canClose: boolean): TileMap {
  const objects: WorldObject[] = WORKSHOP_TASKS.map((t, i) => ({
    id: `bench:${t.id}`, ...BENCH_SPOTS[i], sprite: `task:${t.id}`, name: t.place, solid: true, tint: t.tint,
    action: canPick(t.id) ? 'Work here' : 'Full', locked: !canPick(t.id), done: (rounds[t.id] ?? 0) > 0,
  }));
  objects.push({ id: 'door', ...DOOR_SPOT, sprite: 'door', name: 'Exit', solid: true, action: canClose ? 'Close for the day' : 'Not yet', highlight: canClose });
  return { rows: WORKSHOP_ROWS, objects };
}

// ------------------------------------------------------------------ Riverside Park
export const PARK_ROWS = [
  'TTTTTTTTTTT',
  'T,.......,T',
  'T..=====..T',
  'T..=...=..T',
  'T..=...=..T',
  'T~~=...=~~T',
  'T..=====..T',
  'T..=...=..T',
  'T..=...=..T',
  'T..=====..T',
  'T,...=...,T',
  'T....=....T',
  'TTTTTTTTTTT',
];
export const PARK_START: Pos = { x: 5, y: 11 };
const SITE_SPOTS: Pos[] = [{ x: 2, y: 3 }, { x: 8, y: 3 }, { x: 2, y: 8 }, { x: 8, y: 8 }, { x: 5, y: 4 }, { x: 5, y: 7 }];
export const MAYOR_SPOT: Pos = { x: 4, y: 10 };

export function parkMap(needMayor: boolean, working: boolean): TileMap {
  const objects: WorldObject[] = PARK_TASKS.map((t, i) => ({
    id: `site:${t.id}`, ...SITE_SPOTS[i], sprite: `task:${t.id}`, name: t.place, solid: true, tint: t.tint,
    action: needMayor || working ? 'Talk to the mayor first' : 'Work here', locked: needMayor,
  }));
  objects.push({ id: 'mayor', ...MAYOR_SPOT, sprite: 'mayor', name: 'Mayor Saima', action: 'Talk', solid: true, highlight: needMayor });
  return { rows: PARK_ROWS, objects };
}
