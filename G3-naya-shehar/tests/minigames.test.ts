/**
 * Pipe mini-game logic. The pure functions are re-implemented here from the
 * component module, which is imported with native UI modules mocked.
 */
jest.mock('react-native-svg', () => ({}));
jest.mock('@/services/audio', () => ({ audio: { play: jest.fn() } }));
jest.mock('@/services/feedback', () => ({ feedback: { tap: jest.fn() } }));
jest.mock('@/state/GameProvider', () => ({ useTheme: () => ({}) }));
jest.mock('../src/screens/minigames/Shell', () => ({ MiniShell: () => null }));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { buildPipes, pipesSolved } = require('../src/screens/minigames/FixPipes') as typeof import('../src/screens/minigames/FixPipes');

type T = { kind: 'straight' | 'corner'; rot: number };
/** Exact solver: follow the water, trying each rotation of each tile it reaches (backtracking). */
function solve(tiles: T[]): T[] | null {
  const go = (cur: T[], used: Set<number>, x: number, y: number, depth: number): T[] | null => {
    if (depth > 9) return null;
    const i = y * 3 + x;
    for (let r = 0; r < 4; r++) {
      const next = cur.map((t, j) => (j === i ? { ...t, rot: r } : t));
      const res = pipesSolved(next);
      if (res.ok) return next;
      if (!res.wet.has(i)) continue;
      // find the frontier cell water flows into next
      const wetNow = [...res.wet];
      const frontier = [0, 1, 2, 3, 4, 5, 6, 7, 8].find((k) => !used.has(k) && k !== i && !res.wet.has(k) && wetNow.length === used.size + 1 && isNeighbour(i, k));
      void frontier;
      const used2 = new Set(used); used2.add(i);
      for (let k = 0; k < 9; k++) {
        if (used2.has(k) || !isNeighbour(i, k)) continue;
        const r2 = go(next, used2, k % 3, Math.floor(k / 3), depth + 1);
        if (r2) return r2;
      }
    }
    return null;
  };
  const isNeighbour = (a: number, b: number) => Math.abs((a % 3) - (b % 3)) + Math.abs(Math.floor(a / 3) - Math.floor(b / 3)) === 1;
  return go(tiles, new Set(), 0, 1, 0);
}

describe('pipe puzzle', () => {
  test('every seed starts unsolved and can be solved by rotating tiles', () => {
    for (let seed = 0; seed < 30; seed++) {
      const tiles = buildPipes(seed);
      expect(pipesSolved(tiles).ok).toBe(false);
      const cur = solve(tiles);
      expect(cur).not.toBeNull();
      expect(pipesSolved(cur!).ok).toBe(true);
    }
  });
});
