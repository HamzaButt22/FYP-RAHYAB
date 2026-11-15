// One play of one module (a "run"): gives the module its GameHost and turns what it sends into envelope
// v3.0.0 events (SRS §12.5) for the outbox. The module never sets ids, order or time, so the upload rules
// (RFC-0002: seq +1 per run, monotonic time never going back, coarse wall clock) hold for any module.
//
// A broken call throws in development builds (strict), so a module author sees it at once. In a release
// build it is dropped and counted instead: a child's game must never crash over a telemetry mistake.

import {
  CONTRACT_VERSION,
  type ExperimentalEvent,
  type EventType,
  type GameContext,
  type GameEvent,
  type GameHost,
  type GameModule,
  type GameResult,
  type JsonObject,
  type JsonValue,
} from './contract.ts';
import { eventProblems, experimentProblems, savedProblems } from './rules.ts';

export const SCHEMA_VERSION = '3.0.0';

/** Envelope v3.0.0, as the server's `Event` schema (docs/api/openapi.yaml). */
export interface Envelope {
  event_id: string;
  schema_version: typeof SCHEMA_VERSION;
  session_id: string;
  run_id: string;
  seq: number;
  week: number;
  content_version: string;
  event_type: EventType;
  monotonic_ms: number;
  wall_clock_utc_min: string;
  input_type: 'touch';
  a11y_mode: boolean;
  practice: boolean;
  item_id?: string;
  data?: JsonObject;
}

/** Where events go: the encrypted outbox (ADR-0010) in the app, a list in tests and the game lab. */
export interface EventSink {
  add(event: Envelope): void;
}

/** Where a module's own progress is kept between runs. */
export interface SaveStore {
  load(moduleId: string): JsonValue | null;
  save(moduleId: string, state: JsonValue): void;
}

export interface RunLog {
  experiments: { at_ms: number; name: string; data?: JsonObject }[];
  /** Problems found in release builds (dropped calls), for the developer screen and bug reports. */
  dropped: string[];
}

export interface RunOptions {
  module: GameModule;
  context: GameContext;
  sessionId: string;
  sink: EventSink;
  store: SaveStore;
  strict: boolean;
  /** Milliseconds that never go back (performance.now()). */
  monotonic: () => number;
  /** The wall clock (Date.now()). */
  wallClock: () => number;
  randomBytes?: (n: number) => Uint8Array;
  onFinish?: (result: GameResult, run: Run) => void;
}

export class ContractError extends Error {
  constructor(problems: string[]) {
    super(`game contract: ${problems.join('; ')}`);
    this.name = 'ContractError';
  }
}

function defaultRandomBytes(n: number): Uint8Array {
  const bytes = new Uint8Array(n);
  const c = (globalThis as { crypto?: { getRandomValues?: (a: Uint8Array) => Uint8Array } }).crypto;
  if (c?.getRandomValues) return c.getRandomValues(bytes);
  // Event ids need to be unique, not secret, so this fallback is enough where crypto is missing.
  for (let i = 0; i < n; i++) bytes[i] = Math.floor(Math.random() * 256);
  return bytes;
}

/** A UUIDv7 (RFC 9562): 48 bits of milliseconds, then random bits; sorts by time. */
export function uuidv7(ms: number, randomBytes: (n: number) => Uint8Array = defaultRandomBytes): string {
  const b = randomBytes(16);
  const t = Math.max(0, Math.floor(ms));
  for (let i = 0; i < 6; i++) b[i] = Math.floor(t / 2 ** (8 * (5 - i))) % 256;
  b[6] = (b[6] & 0x0f) | 0x70;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

/** Wall-clock time coarsened to the minute (2026-11-15T10:04Z), as the envelope requires. */
export function utcMinute(ms: number): string {
  return new Date(Math.floor(ms / 60000) * 60000).toISOString().slice(0, 16) + 'Z';
}

export interface Run {
  readonly runId: string;
  readonly host: GameHost;
  readonly saved: JsonValue | null;
  readonly log: RunLog;
  /** Sends run_start if the module hasn't already started the run by calling the host. */
  start(): void;
  /** The student left before the module finished (back button, a crash): sends quit, calls onFinish. */
  abandon(): void;
  readonly finished: boolean;
}

export function createRun(o: RunOptions): Run {
  const random = o.randomBytes ?? defaultRandomBytes;
  const runId = uuidv7(o.wallClock(), random);
  const startedAt = o.monotonic();
  const log: RunLog = { experiments: [], dropped: [] };
  let seq = 0;
  let lastMs = 0;
  let started = false;
  let finished = false;

  const elapsed = () => {
    lastMs = Math.max(lastMs, Math.round((o.monotonic() - startedAt) * 10) / 10);
    return lastMs;
  };

  const refuse = (problems: string[]): boolean => {
    if (problems.length === 0) return false;
    if (o.strict) throw new ContractError(problems);
    log.dropped.push(...problems);
    return true;
  };

  const send = (type: EventType, itemId?: string, data?: JsonObject) => {
    const event: Envelope = {
      event_id: uuidv7(o.wallClock(), random),
      schema_version: SCHEMA_VERSION,
      session_id: o.sessionId,
      run_id: runId,
      seq: seq++,
      week: o.context.week,
      content_version: `${o.module.id}@${o.module.version}`,
      event_type: type,
      monotonic_ms: elapsed(),
      wall_clock_utc_min: utcMinute(o.wallClock()),
      input_type: 'touch',
      a11y_mode: o.context.a11yMode,
      practice: o.context.practice,
    };
    if (itemId !== undefined) event.item_id = itemId;
    if (data !== undefined) event.data = data;
    o.sink.add(event);
  };

  const begin = () => {
    if (started) return;
    started = true;
    send('run_start', undefined, { module: o.module.id, contract: CONTRACT_VERSION });
  };

  // React runs a module's effects before its parent's, so a module may call the host before GameScreen
  // starts the run: the first call starts it, and run_start always comes first.
  const live = (what: string): boolean => {
    begin();
    return !refuse(finished ? [`${what} after host.finish()`] : []);
  };

  const host: GameHost = {
    emit(e: GameEvent) {
      if (!live('emit')) return;
      if (refuse(eventProblems(e))) return;
      send(e.type, e.itemId, e.data);
    },
    experiment(e: ExperimentalEvent) {
      if (!live('experiment')) return;
      if (refuse(experimentProblems(e))) return;
      log.experiments.push({ at_ms: elapsed(), name: e.name, data: e.data });
    },
    save(state: JsonValue) {
      if (!live('save')) return;
      if (refuse(savedProblems(state))) return;
      o.store.save(o.module.id, state);
    },
    finish(result: GameResult) {
      if (!live('finish')) return;
      if (!result.completed) send('quit');
      finished = true;
      o.onFinish?.(result, run);
    },
  };

  const run: Run = {
    runId,
    host,
    saved: o.store.load(o.module.id),
    log,
    start: begin,
    abandon() {
      if (!started || finished) return;
      send('quit');
      finished = true;
      o.onFinish?.({ completed: false }, run);
    },
    get finished() {
      return finished;
    },
  };
  return run;
}

/** In memory: for tests and the game lab until the encrypted outbox (ADR-0010) is built. */
export class MemorySink implements EventSink {
  readonly events: Envelope[] = [];
  add(event: Envelope): void {
    this.events.push(event);
  }
}

export class MemoryStore implements SaveStore {
  private readonly states = new Map<string, JsonValue>();
  load(moduleId: string): JsonValue | null {
    return this.states.get(moduleId) ?? null;
  }
  save(moduleId: string, state: JsonValue): void {
    this.states.set(moduleId, JSON.parse(JSON.stringify(state)) as JsonValue);
  }
}
