/** Helpers shared by the walkable 'station' levels 2, 5, 6, 7, 8 (port of game/levels/common.py). */
import { Player } from '../game-engine/player';
import { Rect } from '../game-engine/rect';

export function nearestStation(player: Player, stations: Record<string, Rect>, reach = 42.0): string | null {
  let best: string | null = null;
  let bestD = 9e9;
  for (const [k, r] of Object.entries(stations)) {
    const cx = Math.min(Math.max(player.x, r.left), r.right);
    const cy = Math.min(Math.max(player.y, r.top), r.bottom);
    const dx = player.x - cx;
    const dy = player.y - cy;
    const d = Math.sqrt(dx * dx + dy * dy); // Python: (dx ** 2 + dy ** 2) ** 0.5
    if (d < bestD) {
      best = k;
      bestD = d;
    }
  }
  return bestD <= reach ? best : null;
}

/** Python `" ".join(...)`-style word wrap is a UI concern; levels only need plain strings. */
export const sortedStrings = (it: Iterable<string>) => Array.from(it).sort();
