/**
 * Pure tile-world logic (no React): maps, collision, movement and "what can I interact with here?".
 * Kept pure so walking rules are unit-tested and identical on every device.
 *
 * Map legend
 *   walkable:  .  grass   ,  flowers   =  path   b  bridge   f  wooden floor   s  sand   g  open gate
 *   blocked:   T  tree    ^  rock      ~  water  #  fence    W  wall           G  closed gate
 */
export type Dir = 'up' | 'down' | 'left' | 'right';

export interface Pos { x: number; y: number }

export interface WorldObject {
  id: string;
  x: number;
  y: number;
  /** visual key, resolved by the renderer */
  sprite: string;
  /** short label shown on the Action button when the player is next to it */
  action?: string;
  /** label shown above the object */
  name?: string;
  /** blocks walking (most objects do) */
  solid?: boolean;
  /** shows a bouncing "!" marker */
  highlight?: boolean;
  /** greyed out with a lock */
  locked?: boolean;
  /** shown with a star/stamp */
  done?: boolean;
  /** walking ONTO this tile triggers it (exits, roads) instead of pressing Action */
  trigger?: boolean;
  tint?: string;
}

export interface TileMap {
  rows: string[];
  objects: WorldObject[];
}

const WALKABLE = new Set(['.', ',', '=', 'b', 'f', 's', 'g']);
export const DIRS: Record<Dir, Pos> = { up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } };

export const width = (m: TileMap) => m.rows[0].length;
export const height = (m: TileMap) => m.rows.length;
export const tileAt = (m: TileMap, p: Pos) => (p.y >= 0 && p.y < m.rows.length && p.x >= 0 && p.x < m.rows[p.y].length ? m.rows[p.y][p.x] : 'T');

export function objectAt(m: TileMap, p: Pos): WorldObject | undefined {
  return m.objects.find((o) => o.x === p.x && o.y === p.y);
}

export function canWalk(m: TileMap, p: Pos): boolean {
  if (!WALKABLE.has(tileAt(m, p))) return false;
  const o = objectAt(m, p);
  return !o || !o.solid;
}

export interface StepResult {
  pos: Pos;
  facing: Dir;
  moved: boolean;
  /** a trigger object the player just stepped onto */
  triggered?: WorldObject;
}

export function step(m: TileMap, pos: Pos, dir: Dir): StepResult {
  const d = DIRS[dir];
  const next = { x: pos.x + d.x, y: pos.y + d.y };
  if (!canWalk(m, next)) return { pos, facing: dir, moved: false };
  const o = objectAt(m, next);
  return { pos: next, facing: dir, moved: true, triggered: o?.trigger ? o : undefined };
}

/**
 * The object the Action button would use: the tile being faced first, then any neighbour, then the
 * player's own tile. Forgiving on purpose: students new to games should not need precise facing.
 */
export function interactable(m: TileMap, pos: Pos, facing: Dir): WorldObject | undefined {
  const usable = (o?: WorldObject) => (o && o.action && !o.trigger ? o : undefined);
  const f = DIRS[facing];
  const faced = usable(objectAt(m, { x: pos.x + f.x, y: pos.y + f.y }));
  if (faced) return faced;
  for (const d of Object.values(DIRS)) {
    const o = usable(objectAt(m, { x: pos.x + d.x, y: pos.y + d.y }));
    if (o) return o;
  }
  return usable(objectAt(m, pos));
}

/** Breadth-first distance check used by tests to prove every object can be reached. */
export function reachable(m: TileMap, from: Pos): Set<string> {
  const seen = new Set<string>([`${from.x},${from.y}`]);
  const q = [from];
  while (q.length) {
    const p = q.shift()!;
    for (const d of Object.values(DIRS)) {
      const n = { x: p.x + d.x, y: p.y + d.y };
      const k = `${n.x},${n.y}`;
      if (seen.has(k) || !canWalk(m, n)) continue;
      seen.add(k);
      q.push(n);
    }
  }
  return seen;
}

/** Can the player stand next to (or on) this object? */
export function canReach(m: TileMap, from: Pos, o: WorldObject): boolean {
  const r = reachable(m, from);
  if (o.trigger) return r.has(`${o.x},${o.y}`);
  return Object.values(DIRS).some((d) => r.has(`${o.x + d.x},${o.y + d.y}`));
}

/** Camera offset (in tiles) that keeps the player centred but never shows outside the map. */
export function cameraFor(m: TileMap, p: Pos, viewW: number, viewH: number): Pos {
  const clamp = (v: number, max: number) => Math.max(0, Math.min(v, Math.max(0, max)));
  return { x: clamp(p.x - Math.floor(viewW / 2), width(m) - viewW), y: clamp(p.y - Math.floor(viewH / 2), height(m) - viewH) };
}

/** Replace the tile at a position (e.g. open a gate). Returns a new map. */
export function withTile(m: TileMap, p: Pos, ch: string): TileMap {
  const rows = m.rows.slice();
  rows[p.y] = rows[p.y].slice(0, p.x) + ch + rows[p.y].slice(p.x + 1);
  return { ...m, rows };
}

export interface PathPlan {
  /** steps to take, in order */
  dirs: Dir[];
  /** where the player ends up */
  end: Pos;
  /** for an object target: the direction to face at the end so the Action button uses that object */
  face?: Dir;
}

const dirBetween = (a: Pos, b: Pos): Dir | undefined =>
  (Object.keys(DIRS) as Dir[]).find((d) => a.x + DIRS[d].x === b.x && a.y + DIRS[d].y === b.y);

/**
 * Shortest walking route for tap-to-walk (breadth-first, 4 directions).
 * - Trigger tiles (roads, exits) are only entered when they ARE the destination, so a route never
 *   makes a choice the student did not tap.
 * - `adjacent: true` plans a route to stand next to the target (for objects the student tapped) and
 *   says which way to face.
 * Returns null when the target cannot be reached.
 */
export function findPath(m: TileMap, from: Pos, to: Pos, opts: { adjacent?: boolean } = {}): PathPlan | null {
  const key = (p: Pos) => `${p.x},${p.y}`;
  const isGoal = (p: Pos) => (opts.adjacent ? Math.abs(p.x - to.x) + Math.abs(p.y - to.y) === 1 : p.x === to.x && p.y === to.y);
  const facing = (end: Pos) => (opts.adjacent ? dirBetween(end, to) : undefined);
  if (isGoal(from)) return { dirs: [], end: from, face: facing(from) };
  const prev = new Map<string, { p: Pos; d: Dir } | null>([[key(from), null]]);
  const q: Pos[] = [from];
  while (q.length) {
    const p = q.shift()!;
    for (const d of Object.keys(DIRS) as Dir[]) {
      const n = { x: p.x + DIRS[d].x, y: p.y + DIRS[d].y };
      if (prev.has(key(n)) || !canWalk(m, n)) continue;
      const o = objectAt(m, n);
      if (o?.trigger && !(n.x === to.x && n.y === to.y && !opts.adjacent)) continue;
      prev.set(key(n), { p, d });
      if (isGoal(n)) {
        const dirs: Dir[] = [];
        let k: string | undefined = key(n);
        while (k) {
          const e = prev.get(k);
          if (!e) break;
          dirs.unshift(e.d);
          k = key(e.p);
        }
        return { dirs, end: n, face: facing(n) };
      }
      q.push(n);
    }
  }
  return null;
}

/**
 * Camera offset in pixels (for any screen size or orientation). Keeps the player centred inside the
 * visible area, never shows outside the map, and centres a map that is smaller than the screen.
 * `insetBottom` is screen space covered by on-screen controls in portrait.
 */
export function cameraPx(m: TileMap, p: Pos, tile: number, viewW: number, viewH: number, insetBottom = 0): Pos {
  const axis = (mapLen: number, view: number, centre: number) => {
    if (mapLen <= view) return Math.round((view - mapLen) / 2);
    const want = view / 2 - centre;
    return Math.round(Math.max(view - mapLen, Math.min(0, want)));
  };
  const visH = Math.max(tile * 3, viewH - insetBottom);
  const y = height(m) * tile <= visH ? Math.round((visH - height(m) * tile) / 2) : axis(height(m) * tile, visH, p.y * tile + tile / 2);
  return { x: axis(width(m) * tile, viewW, p.x * tile + tile / 2), y };
}
