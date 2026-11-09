/**
 * Base class shared by all levels (port of game/levels/base.py) - logic only.
 *
 * Construction mirrors Python's `Level.__init__` + `build()`. Because TypeScript subclass field initialisers run
 * after the base constructor, levels are created through `createLevel()`, which calls `init()` (player, timers,
 * `build()`) once the subclass is fully constructed.
 */
import { ChoiceDialog, ChoiceExtras, MessageBox, Modal } from './dialogs';
import { EventType as E } from './events';
import { InputState } from './input';
import { DecisionOption, Kw, TelemetryLogger } from './logger';
import { Player } from './player';
import { PyRandom } from './pyrandom';
import { pyHypot, pyRoundInt } from './pymath';
import { Rect } from './rect';
import { GameSession } from './session';

export const RUNNING = 'running';
export const COMPLETE = 'complete';
export const FAILED = 'failed';
export type LevelStatus = typeof RUNNING | typeof COMPLETE | typeof FAILED;

export interface HudItem {
  label: string;
  value: string;
}

export abstract class Level {
  abstract readonly levelId: number;
  abstract readonly name: string;
  abstract readonly scenario: string;
  abstract readonly objective: string;
  abstract readonly taskName: string;
  abstract readonly startPos: [number, number];
  /** Touch-control hint shown on the level intro (desktop showed keyboard hints). */
  readonly controlsHint: string = 'Move with the joystick. Tap the action button next to objects and people. Pause any time.';
  /** true when the level shows a "Notebook" button (level 5's TAB key). */
  readonly hasNotebook: boolean = false;

  readonly session: GameSession;
  readonly log: TelemetryLogger;
  readonly rng: PyRandom;
  readonly attempt: number;
  status: LevelStatus = RUNNING;
  failReason: string | null = null;
  player!: Player;
  modal: Modal | null = null;
  elapsedMs = 0.0;
  t0 = 0;
  toast = '';
  toastMs = 0.0;
  /** Incremented whenever something visible but static changes (lets the renderer memoise static layers). */
  visualVersion = 0;

  constructor(session: GameSession, attempt = 1) {
    this.session = session;
    this.log = session.logger;
    this.rng = session.rng;
    this.attempt = attempt;
  }

  /** Second construction phase (Python: rest of __init__). Called by createLevel(). */
  init(): this {
    this.player = new Player(this.startPos[0], this.startPos[1]);
    this.t0 = this.session.clock.ms;
    this.build();
    return this;
  }

  // ---------------------------------------------------------------- overridable
  build(): void {}
  levelStartMetadata(): Kw {
    return {};
  }
  solids(): Rect[] {
    return [];
  }
  onUpdate(_dt: number, _inp: InputState): void {}
  onInteract(): void {}
  onEnd(): void {}
  onUpdateModal(_dt: number, _inp: InputState): void {}
  hudExtra(): HudItem[] {
    return [];
  }
  /** What the action button would do right now (null = nothing in reach). Drives the button label / highlight. */
  interactHint(): string | null {
    return null;
  }

  // ------------------------------------------------------------------ lifecycle
  start(): void {
    this.log.setLevel(this.levelId);
    this.t0 = this.session.clock.ms;
    this.log.log(E.LEVEL_START, {
      action: this.name,
      attempt: this.attempt,
      scenario: this.scenario,
      ...this.levelStartMetadata(),
    });
    this.log.log(E.TASK_START, { action: this.taskName || this.name, attempt: this.attempt });
  }

  complete(summary: Kw = {}): void {
    if (this.status !== RUNNING) return;
    this.status = COMPLETE;
    this.onEnd();
    const dur = this.session.clock.ms - this.t0;
    this.log.flushMovement();
    this.log.log(E.TASK_COMPLETE, { action: this.taskName || this.name, attempt: this.attempt, duration_ms: pyRoundInt(dur) });
    this.log.log(E.LEVEL_COMPLETE, { action: this.name, attempt: this.attempt, duration_ms: pyRoundInt(dur), ...summary });
  }

  fail(reason: string, summary: Kw = {}): void {
    if (this.status !== RUNNING) return;
    this.status = FAILED;
    this.failReason = reason;
    this.onEnd();
    const dur = this.session.clock.ms - this.t0;
    this.log.flushMovement();
    this.log.log(E.LEVEL_FAILED, { action: this.name, attempt: this.attempt, reason, duration_ms: pyRoundInt(dur), ...summary });
  }

  // ------------------------------------------------------------------- helpers
  say(text: string, ms = 2600): void {
    this.toast = text;
    this.toastMs = ms;
  }

  openChoice(
    decisionId: string,
    category: string,
    title: string,
    body: string,
    options: DecisionOption[],
    onChoice: (o: DecisionOption) => void,
    extras: ChoiceExtras = {},
  ): ChoiceDialog {
    const dlg = new ChoiceDialog(this.log, decisionId, category, title, body, options, onChoice, extras, this.session.touchMode);
    this.modal = dlg;
    return dlg;
  }

  openMessage(title: string, body: string, opts: { speaker?: string | null; lines?: string[]; onClose?: (() => void) | null } = {}): MessageBox {
    const box = new MessageBox(title, body, opts.speaker ?? null, opts.onClose ?? null, opts.lines ?? []);
    this.modal = box;
    return box;
  }

  distTo(pos: readonly [number, number]): number {
    return pyHypot(this.player.x - pos[0], this.player.y - pos[1]);
  }

  bump(): void {
    this.visualVersion += 1;
  }

  // -------------------------------------------------------------------- update
  update(dt: number, inp: InputState): void {
    if (this.status !== RUNNING) return;
    this.elapsedMs += dt * 1000.0;
    if (this.toastMs > 0) this.toastMs -= dt * 1000.0;
    if (this.modal !== null) {
      this.modal.update(inp);
      if (this.modal !== null && this.modal.done) this.modal = null;
      this.onUpdateModal(dt, inp);
      return;
    }
    this.player.update(dt, inp.dx, inp.dy, this.solids());
    this.log.trackMovement(this.player.x, this.player.y, dt, this.player.direction);
    if (inp.interact && !this.player.frozen) this.onInteract();
    this.onUpdate(dt, inp);
  }
}

export type LevelClass = new (session: GameSession, attempt: number) => Level;

export function createLevel(cls: LevelClass, session: GameSession, attempt: number): Level {
  return new cls(session, attempt).init();
}
