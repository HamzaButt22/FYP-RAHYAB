/**
 * GameSession: everything about one assessment run that is independent of rendering (port of game/session.py).
 *
 * Owns the game clock, the telemetry logger, the seeded RNG for in-game uncertainty and the strategy tracker.
 * Unlike the desktop, it does not talk to a database: events go to a sink (the durable outbox) and scoring is done
 * by the Flask backend once the outbox has been uploaded (`/api/sessions/<id>/complete`).
 */
import { EventType as E } from './events';
import { GameClock } from './clock';
import { EventSink, Kw, TelemetryLogger } from './logger';
import { PyRandom } from './pyrandom';
import { GAME_VERSION } from './settings';

export class StrategyTracker {
  last: string | null = null;
  history: string[] = [];

  constructor(private readonly logger: TelemetryLogger) {}

  /** Logs STRATEGY_CHANGE on the first label and whenever the label differs from the previous one. */
  adopt(label: string, source: string, extra: Kw = {}): boolean {
    if (label === this.last) return false;
    const isChange = this.last !== null;
    this.logger.log(E.STRATEGY_CHANGE, {
      action: label,
      from_strategy: this.last,
      to_strategy: label,
      is_change: isChange,
      source,
      ...extra,
    });
    this.last = label;
    this.history.push(label);
    return isChange;
  }
}

export interface SessionOptions {
  seed: number;
  playerName: string;
  sink: EventSink;
  startedAtMs: number;
  /** true on phones: dialogs open with nothing highlighted (see dialogs.ts). */
  touchMode?: boolean;
}

export class GameSession {
  readonly seed: number;
  readonly rng: PyRandom;
  readonly playerName: string;
  readonly clock = new GameClock();
  readonly logger: TelemetryLogger;
  readonly strategies: StrategyTracker;
  readonly touchMode: boolean;
  readonly startedAtMs: number;
  started = false;
  finished = false;
  completed: boolean | null = null;
  coins = 0;
  trust = 0;

  constructor(opts: SessionOptions) {
    if (!Number.isSafeInteger(opts.seed) || opts.seed < 0) throw new RangeError('seed must be a non-negative integer');
    this.seed = opts.seed;
    this.rng = new PyRandom(this.seed);
    this.playerName = opts.playerName;
    this.touchMode = !!opts.touchMode;
    this.startedAtMs = opts.startedAtMs;
    this.logger = new TelemetryLogger(this.clock, opts.sink, opts.startedAtMs);
    this.strategies = new StrategyTracker(this.logger);
  }

  start(plan?: number[]): void {
    if (this.started) return;
    this.started = true;
    const extra = plan && plan.length ? { plan: plan.map((x) => Math.trunc(x)) } : {};
    this.logger.log(E.SESSION_START, {
      level_id: null,
      action: 'start',
      game_version: GAME_VERSION,
      seed: this.seed,
      player_name: this.playerName,
      ...extra,
    });
  }

  pause(): void {
    this.logger.log(E.GAME_PAUSED, { action: 'pause' });
  }

  resume(): void {
    this.logger.log(E.GAME_RESUMED, { action: 'resume' });
  }

  /** End the session (SESSION_END). Scoring happens server side after upload; nothing is computed here. */
  finish(completed: boolean): void {
    if (this.finished) return;
    this.finished = true;
    this.completed = completed;
    this.logger.setLevel(null);
    this.logger.log(E.SESSION_END, {
      level_id: null,
      action: completed ? 'completed' : 'abandoned',
      coins: this.coins,
      trust: this.trust,
    });
    this.logger.close();
  }
}
