/**
 * GameRunner: the assessment state machine (port of the engine part of game/app.py GameApp).
 *
 *   briefing -> [intro -> play -> outcome (-> retry)] x levels in the plan -> processing -> finished
 *   play <-> paused, paused -> abandoned
 *
 * Menu, name entry, level select, instructions and the result screens are React screens on mobile; they create a
 * runner (with the plan) and read its state. The runner is frame-stepped (`step(input, dt)`), deterministic for a
 * given seed + input sequence, and has no knowledge of rendering, timers or the network.
 */
import { EventType as E } from './events';
import { accept, InputState } from './input';
import { COMPLETE, createLevel, FAILED, Level, LevelClass, RUNNING } from './level-base';
import { EventSink } from './logger';
import { GameSession } from './session';
import { MAX_ATTEMPTS } from './settings';
import { pyRoundInt } from './pymath';

export type RunnerState = 'briefing' | 'intro' | 'play' | 'paused' | 'outcome' | 'processing' | 'finished' | 'abandoned';

export const PLANS: Record<string, number[]> = {
  full: [1, 2, 3, 4, 5, 6, 7, 8],
  bigfive: [1, 2, 3, 4, 5, 6],
  career: [7, 8],
  original: [1, 2, 3, 4],
};

export const PAUSE_ITEMS = ['Resume', 'Quit to menu (abandon assessment)'];

export interface RunnerOptions {
  seed: number;
  playerName: string;
  plan: number[];
  sink: EventSink;
  startedAtMs: number;
  levelClasses: Record<number, LevelClass>;
  touchMode?: boolean;
}

export class GameRunner {
  readonly session: GameSession;
  readonly plan: number[];
  state: RunnerState = 'briefing';
  level: Level | null = null;
  levelIdx = 0;
  attempt = 1;
  outcomeIndex = 0;
  outcomeT0 = 0;
  pauseIndex = 0;
  prevStateBeforePause: RunnerState = 'play';
  frame = 0;
  private readonly levelClasses: Record<number, LevelClass>;

  constructor(opts: RunnerOptions) {
    if (!opts.plan.length) throw new RangeError('plan must contain at least one level');
    for (const l of opts.plan) if (!opts.levelClasses[l]) throw new RangeError(`unknown level ${l}`);
    this.levelClasses = opts.levelClasses;
    this.plan = [...opts.plan];
    this.session = new GameSession({
      seed: opts.seed,
      playerName: opts.playerName || 'Player',
      sink: opts.sink,
      startedAtMs: opts.startedAtMs,
      touchMode: opts.touchMode,
    });
    this.session.start(this.plan);
  }

  get currentLevelId(): number {
    return this.plan[Math.min(this.levelIdx, this.plan.length - 1)];
  }

  get isOver(): boolean {
    return this.state === 'finished' || this.state === 'abandoned';
  }

  private beginLevel(): void {
    this.level = createLevel(this.levelClasses[this.plan[this.levelIdx]], this.session, this.attempt);
    this.level.start();
    this.state = 'play';
  }

  step(inp: InputState, dt: number): void {
    this.frame += 1;
    if (this.state !== 'paused' && !this.isOver) this.session.clock.tick(dt);
    switch (this.state) {
      case 'briefing':
        if (accept(inp)) this.state = 'intro';
        break;
      case 'intro':
        if (accept(inp)) this.beginLevel();
        break;
      case 'play':
        this.stPlay(inp, dt);
        break;
      case 'paused':
        this.stPaused(inp);
        break;
      case 'outcome':
        this.stOutcome(inp);
        break;
      case 'processing':
        this.session.finish(true);
        this.state = 'finished';
        break;
      default:
        break;
    }
  }

  private stPlay(inp: InputState, dt: number): void {
    const level = this.level as Level;
    if (inp.pause || inp.back) {
      this.session.pause();
      this.prevStateBeforePause = 'play';
      this.pauseIndex = 0;
      this.state = 'paused';
      return;
    }
    level.update(dt, inp);
    if (level.status !== RUNNING) {
      this.outcomeIndex = 0;
      this.outcomeT0 = this.session.clock.ms;
      this.state = 'outcome';
    }
  }

  private stPaused(inp: InputState): void {
    if (inp.up || inp.down) {
      const n = PAUSE_ITEMS.length;
      this.pauseIndex = (((this.pauseIndex + (inp.down ? 1 : -1)) % n) + n) % n;
    }
    if (inp.selectIndex !== null && inp.selectIndex >= 0 && inp.selectIndex < PAUSE_ITEMS.length) {
      this.pauseIndex = inp.selectIndex;
    }
    const resume = inp.pause || inp.back || (accept(inp) && this.pauseIndex === 0);
    if (resume) {
      this.session.resume();
      this.state = this.prevStateBeforePause;
    } else if (accept(inp) && this.pauseIndex === 1) {
      this.abandon();
    }
  }

  /** Quit to menu: the desktop logs SESSION_END(abandoned); the backend marks the session abandoned. */
  abandon(): void {
    if (!this.session.finished) this.session.finish(false);
    this.level = null;
    this.state = 'abandoned';
  }

  outcomeOptions(): string[] {
    const lvl = this.level as Level;
    if (lvl.status === COMPLETE) {
      return this.levelIdx < this.plan.length - 1 ? ['Continue'] : ['Finish assessment'];
    }
    if (this.attempt >= MAX_ATTEMPTS) return ['Continue'];
    return ['Try again', 'Move on to the next level'];
  }

  private stOutcome(inp: InputState): void {
    const opts = this.outcomeOptions();
    if (inp.up && this.outcomeIndex > 0) this.outcomeIndex -= 1;
    if (inp.down && this.outcomeIndex < opts.length - 1) this.outcomeIndex += 1;
    let pick: number | null = null;
    if (inp.number !== null && inp.number >= 1 && inp.number <= opts.length) pick = inp.number - 1;
    else if (accept(inp)) pick = this.outcomeIndex;
    if (pick === null) return;
    const choice = opts[pick];
    const lvl = this.level as Level;
    const log = this.session.logger;
    if (choice === 'Try again') {
      const latency = this.session.clock.ms - this.outcomeT0;
      log.log(E.RETRY, {
        action: 'retry_level',
        voluntary: false,
        attempt: this.attempt + 1,
        latency_ms: pyRoundInt(latency),
        previous_failure: lvl.failReason,
        level_id: lvl.levelId,
      });
      this.attempt += 1;
      this.beginLevel();
      return;
    }
    if (lvl.status === FAILED) {
      const reason = choice.startsWith('Move on') ? 'player_skip' : 'max_attempts';
      log.log(E.TASK_ABANDON, { action: lvl.taskName, reason, attempts: this.attempt, level_id: lvl.levelId });
    }
    this.advanceLevel();
  }

  private advanceLevel(): void {
    this.levelIdx += 1;
    this.attempt = 1;
    this.level = null;
    this.state = this.levelIdx >= this.plan.length ? 'processing' : 'intro';
  }
}
