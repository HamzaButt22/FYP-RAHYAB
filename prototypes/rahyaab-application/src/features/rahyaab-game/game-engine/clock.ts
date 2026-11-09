/**
 * Pause-safe game clock (port of game/telemetry/clock.py).
 * Telemetry timing uses this clock, never the wall clock, so paused / backgrounded time is not "thinking time".
 */
export class GameClock {
  private _ms = 0.0;

  tick(dtSeconds: number): void {
    if (dtSeconds > 0) this._ms += dtSeconds * 1000.0;
  }

  get ms(): number {
    return this._ms;
  }

  nowMs(): number {
    return Math.trunc(this._ms);
  }
}
