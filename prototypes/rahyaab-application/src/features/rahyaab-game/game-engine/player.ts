/** The player avatar: movement with axis-separated collision (port of game/player.py). */
import { Rect } from './rect';
import { PLAYER_RADIUS, PLAYER_SPEED, WORLD_H, WORLD_W } from './settings';
import { pyHypot } from './pymath';

const sign = (v: number) => (v > 0 ? 1 : 0) - (v < 0 ? 1 : 0);

export class Player {
  x: number;
  y: number;
  readonly radius = PLAYER_RADIUS;
  frozenMs = 0.0;
  facing: [number, number] = [1, 0];
  direction: [number, number] = [0, 0];
  trail: [number, number][] = [];

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  get pos(): [number, number] {
    return [this.x, this.y];
  }

  get rect(): Rect {
    const r = this.radius;
    return new Rect(Math.trunc(this.x - r), Math.trunc(this.y - r), 2 * r, 2 * r);
  }

  teleport(x: number, y: number): void {
    this.x = x;
    this.y = y;
  }

  freeze(ms: number): void {
    this.frozenMs = Math.max(this.frozenMs, ms);
  }

  get frozen(): boolean {
    return this.frozenMs > 0;
  }

  update(dt: number, dx: number, dy: number, solids: Rect[]): void {
    if (this.frozenMs > 0) {
      this.frozenMs = Math.max(0.0, this.frozenMs - dt * 1000.0);
      this.direction = [0, 0];
      return;
    }
    this.direction = [sign(dx), sign(dy)];
    if (dx || dy) {
      this.facing = this.direction;
      const norm = pyHypot(dx, dy);
      const vx = (dx / norm) * PLAYER_SPEED;
      const vy = (dy / norm) * PLAYER_SPEED;
      this.moveAxis(vx * dt, 0.0, solids);
      this.moveAxis(0.0, vy * dt, solids);
      const last = this.trail[this.trail.length - 1];
      if (this.trail.length === 0 || pyHypot(this.x - last[0], this.y - last[1]) > 14) {
        this.trail.push([this.x, this.y]);
        if (this.trail.length > 26) this.trail.shift();
      }
    }
  }

  private moveAxis(mx: number, my: number, solids: Rect[]): void {
    const r = this.radius;
    const nx = Math.min(Math.max(this.x + mx, r), WORLD_W - r);
    const ny = Math.min(Math.max(this.y + my, r), WORLD_H - r);
    const probe = new Rect(Math.trunc(nx - r), Math.trunc(ny - r), 2 * r, 2 * r);
    for (const s of solids) if (probe.colliderect(s)) return;
    this.x = nx;
    this.y = ny;
  }
}
