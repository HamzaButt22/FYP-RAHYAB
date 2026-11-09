/** Level registry: level id -> class (same ids as the desktop game and the backend's `levels` table). */
import { LevelClass } from '../game-engine/level-base';
import { ExplorationLevel } from './level1-exploration';
import { PlanningLevel } from './level2-planning';
import { SocialLevel } from './level3-social';
import { PressureLevel } from './level4-pressure';
import { ExpeditionLevel } from './level5-expedition';
import { CrisisLevel } from './level6-crisis';
import { WorkshopLevel } from './level7-workshop';
import { MissionLevel } from './level8-mission';

export const LEVEL_CLASSES: Record<number, LevelClass> = {
  1: ExplorationLevel,
  2: PlanningLevel,
  3: SocialLevel,
  4: PressureLevel,
  5: ExpeditionLevel,
  6: CrisisLevel,
  7: WorkshopLevel,
  8: MissionLevel,
};

export const LEVEL_TITLES: Record<number, string> = {
  1: 'The Whispering Valley',
  2: 'The Workshop',
  3: 'Harbor Village',
  4: 'The Crumbling Vault',
  5: 'Strategic Expedition',
  6: 'Flood Response Simulation',
  7: 'Career Workshop Challenge',
  8: 'Integrated Career Mission',
};

export const LEVEL_TRACK: Record<number, 'Big Five' | 'Career interests'> = {
  1: 'Big Five',
  2: 'Big Five',
  3: 'Big Five',
  4: 'Big Five',
  5: 'Big Five',
  6: 'Big Five',
  7: 'Career interests',
  8: 'Career interests',
};

/**
 * Static facts of a level (name, objective, touch hint) without starting it: constructing a level object without
 * `init()` runs no build() and logs no telemetry.
 */
const INFO = new Map<number, { name: string; objective: string; controlsHint: string; hasNotebook: boolean }>();
export function levelInfo(lid: number): { name: string; objective: string; controlsHint: string; hasNotebook: boolean } {
  let info = INFO.get(lid);
  if (!info) {
    const cls = LEVEL_CLASSES[lid] as unknown as new (s: unknown, a: number) => {
      name: string;
      objective: string;
      controlsHint: string;
      hasNotebook: boolean;
    };
    const inst = new cls({ logger: null, rng: null }, 1);
    info = { name: inst.name, objective: inst.objective, controlsHint: inst.controlsHint, hasNotebook: inst.hasNotebook };
    INFO.set(lid, info);
  }
  return info;
}

export {
  ExplorationLevel,
  PlanningLevel,
  SocialLevel,
  PressureLevel,
  ExpeditionLevel,
  CrisisLevel,
  WorkshopLevel,
  MissionLevel,
};
