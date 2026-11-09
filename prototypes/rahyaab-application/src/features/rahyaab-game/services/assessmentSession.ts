/**
 * AssessmentSession: one assessment on the device - engine + input journal + persistence + upload.
 *
 * Design (see MOBILE_ARCHITECTURE.md, "Persistence and sync"):
 *
 * * The engine is deterministic, so the *input journal* (seed + run-length encoded per-frame input) is the single
 *   source of truth. Restoring after the app was killed = replaying the journal; every timer, open dialog, RNG draw
 *   and telemetry event comes back exactly. A rolling digest of the telemetry detects any divergence.
 * * Invariant: only events covered by a persisted journal are uploaded. If the app dies, the restored session can
 *   never disagree with what the server already has.
 * * Uploads are batched; a batch's sequence range and Idempotency-Key are persisted *before* it is sent and reused
 *   until acknowledged, so lost responses, retries and restarts never duplicate events on the server.
 * * The backend stays the only scoring authority: results are requested only after every event is acknowledged and
 *   the engine reached the end of the plan.
 */
import { InputJournal, JournalFrame, replayFrames } from '../game-engine/journal';
import { InputState } from '../game-engine/input';
import { TelemetryEvent } from '../game-engine/logger';
import { GameRunner } from '../game-engine/runner';
import { GAME_VERSION, MOBILE_CLIENT_VERSION } from '../game-engine/settings';
import { LEVEL_CLASSES } from '../levels';
import { AssessmentReport, UploadEvent } from '../types/api';
import { ApiClient, ApiHttpError, isRetryable } from './apiClient';
import { ACTIVE_KEY, KeyValueStorage, sessionKey } from './storage';

export const FIXED_DT = 1 / 60;
/** Bump the revision whenever engine behaviour changes: journals from another build are never replayed. */
export const ENGINE_ID = `rahyaab-engine-${GAME_VERSION}-r1`;
const RECORD_VERSION = 1;
export const DEFAULT_BATCH = 200;
export const PERSIST_INTERVAL_MS = 2000;

export type SessionStatus = 'active' | 'finished' | 'completed' | 'abandoned';

export interface InflightBatch {
  from: number;
  to: number;
  key: string;
}

export interface SessionRecord {
  v: number;
  engine: string;
  localId: string;
  seed: number;
  plan: number[];
  playerName: string;
  startedAtMs: number;
  dt: number;
  touchMode: boolean;
  hostPlayerId: number | null;
  server: { playerId: number | null; sessionId: string | null; generation: number };
  status: SessionStatus;
  eventCount: number;
  digest: number;
  ackedSeq: number;
  inflight: InflightBatch | null;
  durationMs: number;
  report: AssessmentReport | null;
  updatedAtMs: number;
}

interface PersistedBlob extends SessionRecord {
  frames: JournalFrame[];
}

export interface StartOptions {
  storage: KeyValueStorage;
  api: ApiClient | null;
  plan: number[];
  playerName: string;
  hostPlayerId?: number | null;
  seed?: number;
  now?: () => number;
  touchMode?: boolean;
  batchSize?: number;
  dt?: number;
}

export interface LoadOptions {
  storage: KeyValueStorage;
  api: ApiClient | null;
  now?: () => number;
  touchMode?: boolean;
  batchSize?: number;
}

export type RestoreResult =
  | { kind: 'none' }
  | { kind: 'restored'; session: AssessmentSession }
  | { kind: 'incompatible'; localId: string; record: Partial<SessionRecord> }
  | { kind: 'corrupt'; localId: string; reason: string };

export type SyncStatus = 'synced' | 'offline' | 'error' | 'no-api';
export interface SyncResult {
  status: SyncStatus;
  pending: number;
  error?: string;
}

export type FinishResult =
  | { kind: 'completed'; report: AssessmentReport }
  | { kind: 'pending'; reason: string }
  | { kind: 'failed'; error: string };

export class ActiveSessionExistsError extends Error {
  constructor(readonly localId: string) {
    super('An assessment is already in progress on this device; resume or abandon it first.');
    this.name = 'ActiveSessionExistsError';
  }
}

// ------------------------------------------------------------------------------------------- helpers
function fnv1a(h: number, s: string): number {
  let x = h >>> 0;
  for (let i = 0; i < s.length; i++) {
    x ^= s.charCodeAt(i);
    x = Math.imul(x, 0x01000193) >>> 0;
  }
  return x;
}
const DIGEST_SEED = 0x811c9dc5;
const eventKey = (e: TelemetryEvent) =>
  `${e.seq}|${e.t_ms}|${e.event_type}|${e.action}|${e.level_id}|${e.decision_time_ms}|${e.risk_level}|${JSON.stringify(e.metadata)}`;

export function toUploadEvent(e: TelemetryEvent): UploadEvent {
  return {
    level_id: e.level_id,
    timestamp: e.timestamp,
    t_ms: e.t_ms,
    event_type: e.event_type,
    action: e.action,
    decision_time_ms: e.decision_time_ms,
    risk_level: e.risk_level,
    metadata: e.metadata,
  };
}

function newLocalId(now: number): string {
  const rnd = Math.floor(Math.random() * 0x7fffffff).toString(36);
  return `L${now.toString(36)}-${rnd}`;
}

export function randomSeed(): number {
  // Desktop: time_ns % 2_000_000_000. Any non-negative int works; keep the same range.
  return Math.floor(Math.random() * 2_000_000_000);
}

function isoLocalSeconds(ms: number): string {
  const d = new Date(ms);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

// ------------------------------------------------------------------------------------------- session
export class AssessmentSession {
  readonly events: TelemetryEvent[] = [];
  readonly runner: GameRunner;
  readonly journal: InputJournal;
  record: SessionRecord;
  lastPersistError: string | null = null;
  lastSync: SyncResult | null = null;
  private digest = DIGEST_SEED;
  private persistedEventCount = 0;
  private lastPersistAt = 0;
  private lastPersistedState = '';
  private persisting: Promise<void> | null = null;
  private persistAgain = false;
  private syncing: Promise<SyncResult> | null = null;
  private finishing: Promise<FinishResult> | null = null;
  private replaying = false;
  private readonly storage: KeyValueStorage;
  private readonly api: ApiClient | null;
  private readonly now: () => number;
  private readonly batchSize: number;

  private constructor(record: SessionRecord, deps: { storage: KeyValueStorage; api: ApiClient | null; now: () => number; batchSize: number }, frames: JournalFrame[] = []) {
    this.record = record;
    this.storage = deps.storage;
    this.api = deps.api;
    this.now = deps.now;
    this.batchSize = deps.batchSize;
    this.journal = InputJournal.from(frames);
    this.runner = new GameRunner({
      seed: record.seed,
      playerName: record.playerName,
      plan: record.plan,
      startedAtMs: record.startedAtMs,
      levelClasses: LEVEL_CLASSES,
      touchMode: record.touchMode,
      sink: (e) => this.onEvent(e),
    });
    if (frames.length) {
      this.replaying = true;
      try {
        replayFrames(this.runner, frames, record.dt);
      } finally {
        this.replaying = false;
      }
    }
  }

  // ------------------------------------------------------------------------------------ lifecycle
  static async start(opts: StartOptions): Promise<AssessmentSession> {
    const now = opts.now ?? Date.now;
    const existing = await opts.storage.getItem(ACTIVE_KEY);
    if (existing && (await opts.storage.getItem(sessionKey(existing)))) throw new ActiveSessionExistsError(existing);
    const t = now();
    const record: SessionRecord = {
      v: RECORD_VERSION,
      engine: ENGINE_ID,
      localId: newLocalId(t),
      seed: opts.seed ?? randomSeed(),
      plan: [...opts.plan],
      playerName: (opts.playerName || 'Player').slice(0, 18),
      startedAtMs: t,
      dt: opts.dt ?? FIXED_DT,
      touchMode: opts.touchMode ?? true,
      hostPlayerId: opts.hostPlayerId ?? null,
      server: { playerId: opts.hostPlayerId ?? null, sessionId: null, generation: 0 },
      status: 'active',
      eventCount: 0,
      digest: DIGEST_SEED,
      ackedSeq: 0,
      inflight: null,
      durationMs: 0,
      report: null,
      updatedAtMs: t,
    };
    const s = new AssessmentSession(record, { storage: opts.storage, api: opts.api, now, batchSize: opts.batchSize ?? DEFAULT_BATCH });
    await s.persist();
    await opts.storage.setItem(ACTIVE_KEY, record.localId);
    return s;
  }

  static async loadActive(opts: LoadOptions): Promise<RestoreResult> {
    const id = await opts.storage.getItem(ACTIVE_KEY);
    if (!id) return { kind: 'none' };
    const raw = await opts.storage.getItem(sessionKey(id));
    if (!raw) {
      await opts.storage.removeItem(ACTIVE_KEY);
      return { kind: 'none' };
    }
    let blob: PersistedBlob;
    try {
      blob = JSON.parse(raw) as PersistedBlob;
    } catch {
      return { kind: 'corrupt', localId: id, reason: 'saved data is not valid JSON' };
    }
    if (blob.v !== RECORD_VERSION || blob.engine !== ENGINE_ID) {
      const { frames: _f, ...rec } = blob;
      return { kind: 'incompatible', localId: id, record: rec };
    }
    const { frames, ...record } = blob;
    const deps = { storage: opts.storage, api: opts.api, now: opts.now ?? Date.now, batchSize: opts.batchSize ?? DEFAULT_BATCH };
    let s: AssessmentSession;
    try {
      s = new AssessmentSession(record, deps, frames);
    } catch (e) {
      return { kind: 'corrupt', localId: id, reason: `replay failed: ${(e as Error).message}` };
    }
    if (s.events.length !== record.eventCount || s.digest !== record.digest) {
      return { kind: 'corrupt', localId: id, reason: 'replayed telemetry does not match the saved digest' };
    }
    s.persistedEventCount = record.eventCount;
    s.lastPersistedState = s.runner.state;
    if (s.record.inflight && s.record.inflight.to >= s.events.length) s.record.inflight = null;
    return { kind: 'restored', session: s };
  }

  /** Delete a saved session from this device (e.g. after the player chose not to resume an incompatible one). */
  static async discard(storage: KeyValueStorage, localId: string): Promise<void> {
    await storage.removeItem(sessionKey(localId));
    if ((await storage.getItem(ACTIVE_KEY)) === localId) await storage.removeItem(ACTIVE_KEY);
  }

  // --------------------------------------------------------------------------------------- engine
  private onEvent(e: TelemetryEvent): void {
    this.events.push(e);
    this.digest = fnv1a(this.digest, eventKey(e));
  }

  /** Advance the engine by one fixed step and journal the input. */
  step(inp: InputState): void {
    if (this.record.status !== 'active') return;
    this.runner.step(inp, this.record.dt);
    this.journal.record(inp);
    if (this.runner.state === 'finished') {
      this.record.status = 'finished';
      this.record.durationMs = this.runner.session.clock.nowMs();
    }
  }

  get durationMs(): number {
    return this.runner.session.clock.nowMs();
  }

  pendingUploads(): number {
    return this.events.length - this.record.ackedSeq;
  }

  // ------------------------------------------------------------------------------------ persistence
  private snapshot(): { json: string; eventCount: number } {
    this.record.eventCount = this.events.length;
    this.record.digest = this.digest;
    this.record.updatedAtMs = this.now();
    if (this.record.status === 'active' || this.record.status === 'finished') this.record.durationMs = this.durationMs;
    const blob: PersistedBlob = { ...this.record, frames: this.journal.frames };
    return { json: JSON.stringify(blob), eventCount: this.events.length };
  }

  /** Write a consistent snapshot (journal + record). Single-flight; a request during a write schedules one more. */
  persist(): Promise<void> {
    if (this.persisting) {
      this.persistAgain = true;
      return this.persisting;
    }
    const run = async (): Promise<void> => {
      do {
        this.persistAgain = false;
        const snap = this.snapshot();
        try {
          await this.storage.setItem(sessionKey(this.record.localId), snap.json);
        } catch (e) {
          this.lastPersistError = `storage write failed: ${(e as Error).message}`;
          throw new Error(this.lastPersistError);
        }
        this.persistedEventCount = Math.max(this.persistedEventCount, snap.eventCount);
        this.lastPersistAt = this.now();
        this.lastPersistedState = this.runner.state;
        this.lastPersistError = null;
      } while (this.persistAgain);
    };
    this.persisting = run().finally(() => {
      this.persisting = null;
    });
    return this.persisting;
  }

  /** Called every frame by the game loop: persist every couple of seconds and on every engine state change. */
  persistIfDue(): void {
    if (this.replaying || this.persisting) return;
    const due = this.now() - this.lastPersistAt >= PERSIST_INTERVAL_MS || this.runner.state !== this.lastPersistedState;
    if (due) this.persist().catch(() => undefined);
  }

  private async removeLocal(): Promise<void> {
    await AssessmentSession.discard(this.storage, this.record.localId);
  }

  // ------------------------------------------------------------------------------------------- sync
  /** Upload everything that is persisted and not yet acknowledged. Single-flight. Never throws. */
  sync(): Promise<SyncResult> {
    if (!this.syncing) {
      this.syncing = this.doSync().finally(() => {
        this.syncing = null;
      });
    }
    return this.syncing;
  }

  private async ensureServerSession(api: ApiClient): Promise<string> {
    const srv = this.record.server;
    if (srv.playerId === null) {
      const p = await api.createPlayer(this.record.playerName, `${this.record.localId}:player:g${srv.generation}`);
      srv.playerId = p.player_id;
      await this.persist().catch(() => undefined);
    }
    if (srv.sessionId === null) {
      const s = await api.createSession(
        {
          player_id: srv.playerId as number,
          seed: this.record.seed,
          game_version: MOBILE_CLIENT_VERSION,
          started_at: isoLocalSeconds(this.record.startedAtMs),
        },
        `${this.record.localId}:session:g${srv.generation}`,
      );
      srv.sessionId = s.session_id;
      await this.persist().catch(() => undefined);
    }
    return srv.sessionId as string;
  }

  /** The server no longer knows our session (404): start a new server session and upload everything again. */
  private async serverLost(): Promise<void> {
    const srv = this.record.server;
    srv.generation += 1;
    srv.sessionId = null;
    if (this.record.hostPlayerId === null) srv.playerId = null;
    this.record.ackedSeq = 0;
    this.record.inflight = null;
    await this.persist().catch(() => undefined);
  }

  private async doSync(): Promise<SyncResult> {
    const api = this.api;
    if (!api) return (this.lastSync = { status: 'no-api', pending: this.pendingUploads() });
    let recoveries = 0;
    try {
      for (;;) {
        let sid: string;
        try {
          sid = await this.ensureServerSession(api);
        } catch (e) {
          // a wiped server also forgets our player: create both again (once per sync call)
          if (e instanceof ApiHttpError && e.status === 400 && this.record.hostPlayerId === null && recoveries < 1) {
            recoveries += 1;
            await this.serverLost();
            continue;
          }
          throw e;
        }
        let batch = this.record.inflight;
        if (!batch) {
          const limit = Math.min(this.persistedEventCount, this.events.length);
          if (this.record.ackedSeq >= limit) break;
          const from = this.record.ackedSeq;
          const to = Math.min(limit, from + this.batchSize) - 1;
          batch = { from, to, key: `${this.record.localId}:g${this.record.server.generation}:${from}-${to}` };
          this.record.inflight = batch;
          await this.persist(); // the batch identity must survive a crash before we send it
        }
        const payload = this.events.slice(batch.from, batch.to + 1).map(toUploadEvent);
        try {
          await api.postEvents(sid, payload, batch.key);
        } catch (e) {
          if (e instanceof ApiHttpError && e.status === 404 && recoveries < 1) {
            recoveries += 1;
            await this.serverLost();
            continue;
          }
          throw e;
        }
        this.record.ackedSeq = batch.to + 1;
        this.record.inflight = null;
        await this.persist().catch(() => undefined);
      }
      return (this.lastSync = { status: 'synced', pending: this.pendingUploads() });
    } catch (e) {
      const status: SyncStatus = isRetryable(e) ? 'offline' : 'error';
      return (this.lastSync = { status, pending: this.pendingUploads(), error: (e as Error).message });
    }
  }

  // ------------------------------------------------------------------------------------ completion
  /** Upload everything and ask the backend for the results. Single-flight; returns the cached report afterwards. */
  finish(): Promise<FinishResult> {
    if (this.record.status === 'completed' && this.record.report) {
      return Promise.resolve({ kind: 'completed', report: this.record.report });
    }
    if (this.runner.state !== 'finished') {
      return Promise.reject(new Error('The assessment is not finished yet; results are only computed for complete sessions.'));
    }
    if (!this.finishing) {
      this.finishing = this.doFinish().finally(() => {
        this.finishing = null;
      });
    }
    return this.finishing;
  }

  private async doFinish(): Promise<FinishResult> {
    this.record.status = 'finished';
    this.record.durationMs = this.durationMs;
    await this.persist().catch(() => undefined);
    if (this.lastPersistError) return { kind: 'pending', reason: this.lastPersistError };
    const sync = await this.sync();
    if (sync.status !== 'synced' || this.pendingUploads() > 0) {
      return sync.status === 'error' ? { kind: 'failed', error: sync.error ?? 'upload failed' } : { kind: 'pending', reason: sync.error ?? 'offline' };
    }
    const api = this.api as ApiClient;
    let report: AssessmentReport;
    try {
      report = await api.complete(this.record.server.sessionId as string, this.record.durationMs);
    } catch (e) {
      if (isRetryable(e)) return { kind: 'pending', reason: (e as Error).message };
      return { kind: 'failed', error: (e as Error).message };
    }
    this.record.status = 'completed';
    this.record.report = report;
    await this.persist().catch(() => undefined);
    return { kind: 'completed', report };
  }

  /** The player quits: SESSION_END(abandoned) is logged, uploaded and the server marks the session abandoned. */
  async abandon(): Promise<{ closedOnServer: boolean }> {
    if (!this.runner.isOver) this.runner.abandon();
    this.record.status = 'abandoned';
    await this.persist().catch(() => undefined);
    if (!this.api) return { closedOnServer: false };
    const sync = await this.sync();
    let closed = false;
    if (sync.status === 'synced' && this.record.server.sessionId) {
      try {
        await this.api.abandon(this.record.server.sessionId, this.durationMs);
        closed = true;
      } catch (e) {
        closed = e instanceof ApiHttpError && (e.status === 404 || e.status === 409);
      }
    }
    if (closed) await this.removeLocal();
    return { closedOnServer: closed };
  }

  /** Remove this session's local data (after the results were handed to the host app). */
  async close(): Promise<void> {
    await this.removeLocal();
  }
}
