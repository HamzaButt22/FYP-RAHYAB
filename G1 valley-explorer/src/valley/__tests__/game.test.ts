import { canReach, cameraFor, cameraPx, findPath, interactable, step, type TileMap } from '../game/engine/tilemap';
import { FORK_ROWS, FORK_START, forkMap, PARK_ROWS, PARK_START, parkMap, VALLEY_INSIDE, VALLEY_ROWS, VALLEY_START, valleyMap, WORKSHOP_ROWS, WORKSHOP_START, workshopMap } from '../game/maps';
import { initialJourney, journeyReducer } from '../core/progress';
import { JOURNEY } from '../core/journey';

const sameWidth = (rows: string[]) => rows.every((r) => r.length === rows[0].length);

describe('tile engine', () => {
  const m: TileMap = { rows: ['TTTTT', 'T...T', 'T.~.T', 'TTTTT'], objects: [{ id: 'box', x: 3, y: 1, sprite: 'x', action: 'Open', solid: true }] };
  it('blocks trees, water and solid objects', () => {
    expect(step(m, { x: 1, y: 1 }, 'up').moved).toBe(false);
    expect(step(m, { x: 1, y: 2 }, 'right').moved).toBe(false); // water
    expect(step(m, { x: 2, y: 1 }, 'right').moved).toBe(false); // solid box
    expect(step(m, { x: 1, y: 1 }, 'right')).toMatchObject({ moved: true, pos: { x: 2, y: 1 }, facing: 'right' });
  });
  it('finds the object to interact with, forgiving about facing direction', () => {
    expect(interactable(m, { x: 2, y: 1 }, 'down')?.id).toBe('box');
    expect(interactable(m, { x: 1, y: 2 }, 'up')).toBeUndefined();
  });
  it('clamps the camera to the map', () => {
    expect(cameraFor(m, { x: 0, y: 0 }, 3, 2)).toEqual({ x: 0, y: 0 });
    expect(cameraFor(m, { x: 4, y: 3 }, 3, 2)).toEqual({ x: 2, y: 2 });
  });
});

describe('world layouts', () => {
  it('rows are rectangular', () => {
    for (const rows of [VALLEY_ROWS, FORK_ROWS, WORKSHOP_ROWS, PARK_ROWS]) expect(sameWidth(rows)).toBe(true);
  });

  it('before level 1, the valley beyond the gate cannot be reached; after it, every stop can', () => {
    let j = initialJourney('s', 1, 'now');
    const closed = valleyMap(j, []);
    const stop = closed.objects.find((o) => o.id === 'stop:vault_locks')!;
    expect(canReach(closed, VALLEY_START, stop)).toBe(false);
    for (const o of closed.objects.filter((o) => !o.id.startsWith('stop:'))) expect(canReach(closed, VALLEY_START, o)).toBe(true);
    j = journeyReducer(journeyReducer(j, { type: 'OPEN_LEVEL', level: 'valley_gate' }), { type: 'COMPLETE_LEVEL', level: 'valley_gate' });
    const open = valleyMap(j, []);
    for (const o of open.objects) expect([o.id, canReach(open, VALLEY_INSIDE, o)]).toEqual([o.id, true]);
    expect(open.objects.find((o) => o.id === 'stop:crossroads_caravan')).toMatchObject({ highlight: true, locked: false, action: 'Enter' });
    expect(open.objects.find((o) => o.id === 'stop:vault_locks')).toMatchObject({ locked: true });
  });

  it('has a place for every stop 2..8', () => {
    const j = initialJourney('s', 1, 'now');
    const ids = valleyMap(j, []).objects.filter((o) => o.id.startsWith('stop:')).map((o) => o.id.slice(5));
    expect(ids.sort()).toEqual(JOURNEY.filter((l) => l.index > 1).map((l) => l.id).sort());
  });

  it('fork: each road exit and the camp are reachable; exits trigger on walking', () => {
    const m = forkMap(['wheel_workshop', 'mural_wall', 'ledger_tower']);
    for (const o of m.objects) expect(canReach(m, FORK_START, o)).toBe(true);
    expect(m.objects.filter((o) => o.trigger)).toHaveLength(3);
  });

  it('workshop and park objects are reachable', () => {
    const w = workshopMap({}, () => true, false);
    for (const o of w.objects) expect(canReach(w, WORKSHOP_START, o)).toBe(true);
    const p = parkMap(true, false);
    for (const o of p.objects) expect(canReach(p, PARK_START, o)).toBe(true);
  });
});


describe('tap-to-walk pathfinding', () => {
  const m: TileMap = { rows: ['.....', '.###.', '.....'], objects: [{ id: 'npc', x: 2, y: 2, sprite: 'mehr', action: 'Talk', solid: true }, { id: 'road', x: 4, y: 0, sprite: 'x', trigger: true }] };

  it('finds the shortest route around walls', () => {
    const open: TileMap = { rows: ['.....', '.###.', '.....'], objects: [] };
    const p = findPath(open, { x: 0, y: 0 }, { x: 4, y: 2 })!;
    expect(p.dirs).toHaveLength(6);
    expect(p.end).toEqual({ x: 4, y: 2 });
    // with a person standing on the bottom row and a road choice on the top row, there is no route
    expect(findPath(m, { x: 0, y: 0 }, { x: 4, y: 2 })).toBeNull();
  });

  it('plans to stand next to a tapped object and face it', () => {
    const p = findPath(m, { x: 0, y: 2 }, { x: 2, y: 2 }, { adjacent: true })!;
    expect(p.end).toEqual({ x: 1, y: 2 });
    expect(p.face).toBe('right');
    expect(findPath(m, { x: 1, y: 2 }, { x: 2, y: 2 }, { adjacent: true })!.dirs).toEqual([]);
  });

  it('never walks across a trigger (a road choice) unless it is the destination', () => {
    const m2: TileMap = { rows: ['...'], objects: [{ id: 'road', x: 1, y: 0, sprite: 'x', trigger: true }] };
    expect(findPath(m2, { x: 0, y: 0 }, { x: 2, y: 0 })).toBeNull();
    expect(findPath(m2, { x: 0, y: 0 }, { x: 1, y: 0 })!.dirs).toEqual(['right']);
  });

  it('returns null for unreachable targets', () => {
    const m3: TileMap = { rows: ['.#.'], objects: [] };
    expect(findPath(m3, { x: 0, y: 0 }, { x: 2, y: 0 })).toBeNull();
  });

  it('camera centres small maps and clamps large ones', () => {
    const small: TileMap = { rows: ['...', '...'], objects: [] };
    expect(cameraPx(small, { x: 0, y: 0 }, 10, 100, 100)).toEqual({ x: 35, y: 40 });
    const wide: TileMap = { rows: ['.'.repeat(30)], objects: [] };
    expect(cameraPx(wide, { x: 0, y: 0 }, 10, 100, 10).x).toBe(0);
    expect(cameraPx(wide, { x: 29, y: 0 }, 10, 100, 10).x).toBe(-200);
    expect(cameraPx(wide, { x: 15, y: 0 }, 10, 100, 10).x).toBe(-105);
  });
});
