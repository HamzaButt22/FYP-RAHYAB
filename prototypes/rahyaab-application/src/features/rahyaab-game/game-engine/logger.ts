/**
 * TelemetryLogger (port of game/telemetry/logger.py).
 *
 * Python's `log(event_type, action=None, decision_time_ms=None, risk_level=None, level_id="current", **metadata)` is
 * mirrored by `log(type, kw)`: the reserved keys `action`, `decision_time_ms`, `risk_level` and `level_id` become
 * columns exactly as Python's keyword binding would place them; every other key becomes metadata. This keeps the
 * level ports line-for-line comparable with the Python source.
 *
 * Instead of writing to SQLite, every event is handed to a sink (the durable outbox on device, an array in tests).
 */
import { ALL_EVENT_TYPES, EventType } from './events';
import { GameClock } from './clock';
import { pyFloatFloorDiv, pyHypot, pyRound, pyRoundInt } from './pymath';

export const GRID_CELL = 100;
export const MOVE_SAMPLE_MS = 500;

export type Meta = Record<string, unknown>;
export type Kw = Meta;

export interface TelemetryEvent {
  /** Monotonic per-session sequence number (client side only; used for idempotent upload and replay). */
  seq: number;
  level_id: number | null;
  timestamp: string;
  t_ms: number;
  event_type: string;
  action: string | null;
  decision_time_ms: number | null;
  risk_level: number | null;
  metadata: Meta;
}

export type EventSink = (e: TelemetryEvent) => void;

export interface DecisionOption {
  key: string;
  label: string;
  kind?: string | null;
  risk_level?: number;
  [extra: string]: unknown;
}

interface PendingDecision {
  t0: number;
  category: string;
  options: DecisionOption[];
  changes: number;
  context: Meta;
}

/** Deep copy that turns `undefined` into `null` (Python has no undefined; None serialises to null). */
export function normalizeMeta(v: unknown): unknown {
  if (v === undefined || v === null) return null;
  if (Array.isArray(v)) return v.map(normalizeMeta);
  if (v instanceof Set) throw new TypeError('Sets must be converted (sorted) before logging');
  if (typeof v === 'object') {
    const out: Meta = {};
    for (const [k, x] of Object.entries(v as Meta)) out[k] = normalizeMeta(x);
    return out;
  }
  if (typeof v === 'number' && !Number.isFinite(v)) throw new RangeError('non-finite number in telemetry');
  return v;
}

function isoLocal(ms: number): string {
  const d = new Date(ms);
  const p = (n: number, w = 2) => String(n).padStart(w, '0');
  return (
    `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T` +
    `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}.${p(d.getMilliseconds(), 3)}`
  );
}

const sortCells = (a: [number, number], b: [number, number]) => a[0] - b[0] || a[1] - b[1];

export class TelemetryLogger {
  levelId: number | null = null;
  totalLogged = 0;
  private pending = new Map<string, PendingDecision>();
  private mvElapsed = 0;
  private mvDist = 0;
  private mvLastPos: [number, number] | null = null;
  private mvLastDir: [number, number] | null = null;
  private mvDirChanges = 0;
  private mvReversals = 0;
  private mvCells = new Map<string, [number, number]>();
  private mvPos: [number, number] = [0, 0];
  private mvFirstMs: number | null = null;
  closed = false;

  constructor(
    private readonly clock: GameClock,
    private readonly sink: EventSink,
    private readonly startedAtMs: number,
  ) {
    this.resetMoveState();
  }

  setLevel(levelId: number | null): void {
    this.flushMovement();
    this.levelId = levelId;
  }

  log(eventType: string, kw: Kw = {}): TelemetryEvent {
    if (!ALL_EVENT_TYPES.has(eventType)) throw new Error(`Unknown telemetry event type: ${eventType}`);
    const { action = null, decision_time_ms = null, risk_level = null, ...metadata } = kw;
    const hasLevel = Object.prototype.hasOwnProperty.call(kw, 'level_id');
    delete (metadata as Meta).level_id;
    const tMs = this.clock.nowMs();
    const event: TelemetryEvent = {
      seq: this.totalLogged,
      level_id: hasLevel ? ((kw.level_id as number | null | undefined) ?? null) : this.levelId,
      timestamp: isoLocal(this.startedAtMs + tMs),
      t_ms: tMs,
      event_type: eventType,
      action: action === null || action === undefined ? null : String(action),
      decision_time_ms: decision_time_ms === null || decision_time_ms === undefined ? null : pyRound(Number(decision_time_ms), 1),
      risk_level: risk_level === null || risk_level === undefined ? null : pyRound(Number(risk_level), 3),
      metadata: normalizeMeta(metadata) as Meta,
    };
    this.totalLogged += 1;
    this.sink(event);
    return event;
  }

  close(): void {
    this.flushMovement();
    this.closed = true;
  }

  // ------------------------------------------------------------ decisions
  beginDecision(decisionId: string, category: string, options: DecisionOption[], context: Meta = {}): void {
    this.pending.set(decisionId, { t0: this.clock.ms, category, options, changes: 0, context });
    this.log(EventType.DECISION, {
      action: decisionId,
      category,
      options: options.map((o) => o.key),
      option_kinds: options.map((o) => (o.kind === undefined ? null : o.kind)),
      ...context,
    });
  }

  noteSelectionChange(decisionId: string): void {
    const p = this.pending.get(decisionId);
    if (p) p.changes += 1;
  }

  endDecision(decisionId: string, chosenKey: string, extra: Meta = {}): number {
    const p = this.pending.get(decisionId);
    this.pending.delete(decisionId);
    if (p === undefined) {
      this.log(EventType.DECISION_RESPONSE, { action: chosenKey, decision_id: decisionId, orphan: true, ...extra });
      return 0.0;
    }
    const dt = Math.max(0.0, this.clock.ms - p.t0);
    const opt = p.options.find((o) => o.key === chosenKey) ?? ({} as Partial<DecisionOption>);
    this.log(EventType.DECISION_RESPONSE, {
      action: chosenKey,
      decision_time_ms: dt,
      risk_level: opt.risk_level ?? null,
      decision_id: decisionId,
      category: p.category,
      chosen_kind: opt.kind ?? null,
      selection_changes: p.changes,
      n_options: p.options.length,
      ...p.context,
      ...extra,
    });
    return dt;
  }

  cancelDecision(decisionId: string): void {
    this.pending.delete(decisionId);
  }

  // ------------------------------------------------------------- movement
  private resetMoveState(): void {
    this.mvElapsed = 0.0;
    this.mvDist = 0.0;
    this.mvLastPos = null;
    this.mvLastDir = null;
    this.mvDirChanges = 0;
    this.mvReversals = 0;
    this.mvCells = new Map();
    this.mvPos = [0.0, 0.0];
    this.mvFirstMs = null;
  }

  /** Call once per frame while a level is being played. */
  trackMovement(x: number, y: number, dtS: number, direction: [number, number]): void {
    const cx = Math.trunc(pyFloatFloorDiv(x, GRID_CELL));
    const cy = Math.trunc(pyFloatFloorDiv(y, GRID_CELL));
    this.mvCells.set(`${cx},${cy}`, [cx, cy]);
    if (this.mvLastPos !== null) {
      const step = pyHypot(x - this.mvLastPos[0], y - this.mvLastPos[1]);
      this.mvDist += step;
      if (step > 0.5 && this.mvFirstMs === null) this.mvFirstMs = this.clock.nowMs();
    }
    this.mvLastPos = [x, y];
    this.mvPos = [x, y];
    if (direction[0] !== 0 || direction[1] !== 0) {
      const last = this.mvLastDir;
      if (last !== null && (direction[0] !== last[0] || direction[1] !== last[1])) {
        this.mvDirChanges += 1;
        if (direction[0] * last[0] + direction[1] * last[1] < 0) this.mvReversals += 1;
      }
      this.mvLastDir = direction;
    }
    this.mvElapsed += dtS * 1000.0;
    if (this.mvElapsed >= MOVE_SAMPLE_MS) this.flushMovement();
  }

  flushMovement(): void {
    if (this.mvElapsed > 0 && this.mvDist > 1.0 && this.levelId !== null) {
      const secs = Math.max(this.mvElapsed / 1000.0, 1e-6);
      this.log(EventType.PLAYER_MOVE, {
        action: 'move',
        x: pyRoundInt(this.mvPos[0]),
        y: pyRoundInt(this.mvPos[1]),
        dist: pyRound(this.mvDist, 1),
        speed: pyRound(this.mvDist / secs, 1),
        dir_changes: this.mvDirChanges,
        reversals: this.mvReversals,
        cells: Array.from(this.mvCells.values()).sort(sortCells),
        interval_ms: pyRoundInt(this.mvElapsed),
        first_move_ms: this.mvFirstMs,
      });
    }
    const lastPos = this.mvLastPos;
    this.resetMoveState();
    this.mvLastPos = lastPos;
    this.mvLastDir = null;
  }
}
