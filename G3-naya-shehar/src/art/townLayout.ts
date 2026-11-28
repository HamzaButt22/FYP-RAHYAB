import { BUILDINGS } from '@/game/world/buildings';
import { DISTRICTS, DistrictId } from '@/game/world/districts';
import { rng } from '@/assessment/abilities/geometry';
import { TOTAL_HOMES } from '@/game/progression/town';

export const GRID_W = 15;
export const GRID_H = 14;

export type Ground = 'grass' | 'road' | 'canal' | 'field' | 'plaza' | 'bridge';
export type Decor = { kind: 'tree'; v: number } | { kind: 'house'; index: number; v: number } | { kind: 'stall'; v: number } | { kind: 'lamp' } | null;

export interface Cell { gx: number; gy: number; ground: Ground; district: DistrictId | null; decor: Decor }

const isRoad = (x: number, y: number) => x === 5 || x === 10 || y === 5 || y === 11;

function districtAt(x: number, y: number): DistrictId | null {
  for (const d of DISTRICTS) {
    const z = d.zone;
    if (x >= z.x0 && x <= z.x1 && y >= z.y0 && y <= z.y1) return d.id;
  }
  return null;
}

/** Deterministic town layout (identical on every device). */
export function buildLayout(): Cell[] {
  const r = rng(77);
  const cells: Cell[] = [];
  let house = 0;
  const occupied = new Set(BUILDINGS.map((b) => `${b.gx},${b.gy}`));
  for (let gy = 0; gy < GRID_H; gy++) {
    for (let gx = 0; gx < GRID_W; gx++) {
      let ground: Ground = 'grass';
      if (gy === 12) ground = gx === 5 || gx === 10 ? 'bridge' : 'canal';
      else if (gy === 13) ground = 'field';
      else if (isRoad(gx, gy)) ground = 'road';
      const district = ground === 'grass' ? districtAt(gx, gy) : null;
      if (district && (gx + gy) % 2 === 0 && !occupied.has(`${gx},${gy}`)) ground = 'plaza';
      let decor: Decor = null;
      if (ground === 'grass' || ground === 'plaza') {
        if (!occupied.has(`${gx},${gy}`)) {
          const roll = r();
          if (house < TOTAL_HOMES && roll < 0.48) decor = { kind: 'house', index: house++, v: Math.floor(r() * 7) };
          else if (roll < 0.78) decor = { kind: 'tree', v: Math.floor(r() * 3) };
          else if (district === 'market_road' || district === 'rang_bazaar') decor = { kind: 'stall', v: Math.floor(r() * 4) };
        }
      } else if (ground === 'road' && (gx * 7 + gy * 3) % 9 === 0) {
        decor = { kind: 'lamp' };
      }
      cells.push({ gx, gy, ground, district, decor });
    }
  }
  return cells;
}

export const LAYOUT = buildLayout();
