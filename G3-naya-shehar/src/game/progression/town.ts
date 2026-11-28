/**
 * Town-building state. Gameplay only: nothing here is ever read by the
 * assessment engine, and the assessment engine never writes here.
 */
import { Week } from '@/assessment/types';
import { BUILDINGS, BuildingId, MAX_PROGRESS, stageOf } from '../world/buildings';
import { DISTRICTS, isDistrictUnlocked } from '../world/districts';

export interface TownState {
  progress: Record<BuildingId, number>;
  grant: number;
  /** Total rebuilt family homes (decor houses on the map). */
  homes: number;
}

export const TOTAL_HOMES = 40;
export const REWARD = { choice: { progress: 12, grant: 100 }, planned: { progress: 15, grant: 100 }, puzzle: { grant: 80 } } as const;
export const FUND_COST = 200;
export const FUND_PROGRESS = 25;

/** Each season ends with one big project finished in front of the player. */
export const SEASON_PROJECT: Record<Week, BuildingId> = { 0: 'community_center', 1: 'pump_station', 2: 'school', 3: 'bridge', 4: 'town_hall' };

export function initialTown(): TownState {
  const progress = Object.fromEntries(BUILDINGS.map((b) => [b.id, 0])) as Record<BuildingId, number>;
  progress.community_center = 20;
  return { progress, grant: 300, homes: 12 };
}

const clamp = (n: number) => Math.max(0, Math.min(MAX_PROGRESS, n));

export function addProgress(t: TownState, id: BuildingId, pts: number): { town: TownState; stagedUp: boolean } {
  const before = stageOf(t.progress[id]);
  const progress = { ...t.progress, [id]: clamp(t.progress[id] + pts) };
  const next = { ...t, progress };
  return { town: { ...next, homes: homesFor(next) }, stagedUp: stageOf(progress[id]) > before };
}

export function addGrant(t: TownState, amount: number): TownState {
  return { ...t, grant: t.grant + amount };
}

export function canFund(t: TownState, id: BuildingId, week: Week): boolean {
  const b = BUILDINGS.find((x) => x.id === id)!;
  return t.grant >= FUND_COST && t.progress[id] < MAX_PROGRESS && isDistrictUnlocked(b.district, week);
}

export function fund(t: TownState, id: BuildingId, week: Week) {
  if (!canFund(t, id, week)) return { town: t, stagedUp: false, ok: false };
  const r = addProgress({ ...t, grant: t.grant - FUND_COST }, id, FUND_PROGRESS);
  return { ...r, ok: true };
}

export function completeProject(t: TownState, id: BuildingId): TownState {
  return addProgress(t, id, MAX_PROGRESS).town;
}

function totalProgress(t: TownState) {
  return Object.values(t.progress).reduce((a, b) => a + b, 0);
}

export function homesFor(t: TownState) {
  return Math.min(TOTAL_HOMES, 12 + Math.floor(totalProgress(t) / 60));
}

export interface Meters { homes: number; happiness: number; balance: number }

export function meters(t: TownState, week: Week): Meters {
  const avg = totalProgress(t) / BUILDINGS.length;
  const open = DISTRICTS.filter((d) => isDistrictUnlocked(d.id, week));
  const dAvg = open.map((d) => {
    const bs = BUILDINGS.filter((b) => b.district === d.id);
    return bs.reduce((s, b) => s + t.progress[b.id], 0) / bs.length;
  });
  const max = Math.max(...dAvg, 1);
  const min = Math.min(...dAvg);
  return {
    homes: t.homes,
    happiness: Math.round(Math.min(100, 20 + avg * 0.8)),
    balance: Math.round(100 * (min / max)),
  };
}
