/**
 * Touch input -> engine InputState, one fixed engine step at a time.
 *
 * * Movement is *held* (joystick / d-pad) and quantised to the desktop's 8 WASD directions, so the movement telemetry
 *   (direction changes, reversals) means exactly what it means on the desktop.
 * * Taps are *edge* inputs: each tap is applied to exactly one engine step (FIFO), never lost and never repeated.
 * * Every tap carries the UI target it was aimed at (e.g. "dialog #12"). If that target is gone by the time the tap is
 *   applied - typically a double tap whose first tap already closed the dialog - the tap is dropped instead of
 *   landing on whatever screen came next (duplicate-submission protection).
 */
import { emptyInput, InputState } from '../game-engine/input';

const DEAD_ZONE = 0.3;
const MAX_QUEUE = 8;

/** Analog stick (-1..1, screen coordinates: y grows downward) -> 8-way digital direction. */
export function quantizeStick(x: number, y: number): [number, number] {
  const mag = Math.hypot(x, y);
  if (mag < DEAD_ZONE) return [0, 0];
  const sector = Math.round(Math.atan2(y, x) / (Math.PI / 4));
  const dirs: [number, number][] = [
    [1, 0],
    [1, 1],
    [0, 1],
    [-1, 1],
    [-1, 0],
    [-1, -1],
    [0, -1],
    [1, -1],
  ];
  return dirs[((sector % 8) + 8) % 8];
}

export type Press = Partial<Pick<InputState, 'interact' | 'confirm' | 'back' | 'pause' | 'number' | 'tab' | 'selectIndex' | 'up' | 'down'>>;

export class InputController {
  private dx = 0;
  private dy = 0;
  private queue: { press: Press; target: string }[] = [];

  setMove(dx: number, dy: number): void {
    this.dx = Math.sign(dx);
    this.dy = Math.sign(dy);
  }

  setStick(x: number, y: number): void {
    const [dx, dy] = quantizeStick(x, y);
    this.setMove(dx, dy);
  }

  press(press: Press, target: string): void {
    if (this.queue.length >= MAX_QUEUE) return;
    this.queue.push({ press, target });
  }

  pending(): number {
    return this.queue.length;
  }

  /** Input for the next engine step. Stale presses (aimed at another UI target) are discarded. */
  next(currentTarget: string): InputState {
    const inp = emptyInput();
    inp.dx = this.dx;
    inp.dy = this.dy;
    while (this.queue.length) {
      const item = this.queue.shift() as { press: Press; target: string };
      if (item.target !== currentTarget) continue;
      Object.assign(inp, item.press);
      break;
    }
    return inp;
  }

  reset(): void {
    this.dx = 0;
    this.dy = 0;
    this.queue = [];
  }
}
