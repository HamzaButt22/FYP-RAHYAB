/**
 * GameSession — the boundary between game screens and everything below them.
 * Screens call `session.commit({ events, actions })`; they never touch storage or the network.
 *
 * Guarantees
 *  - Events get a strictly increasing `seq` in call order, even when commits overlap.
 *  - Each commit persists its events together with the updated journey checkpoint (one multiSet).
 *  - The active-time clock excludes time while paused/backgrounded.
 *  - A session is resumed only for the same pseudonymous student and only if not finished.
 */
import { isoWithOffset, makeEvent, validateEvent, type AssessmentEvent, type EventSpec } from '../contract/events';
import { initialJourney, journeyReducer, type JourneyAction, type JourneyState } from '../core/progress';
import { buildOutput, type AssessmentOutput } from '../core/summary';
import type { RahYaabHostAdapter } from '../adapter';
import { EventStore, type SessionMeta } from './eventStore';
import { asyncStorageStore } from './storage';
import { SyncWorker, type SyncStatus } from './sync';

export type { EventSpec };

export class ConsentRequiredError extends Error {}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function defaultId(): string {
  // Each source is accepted only if it really returns a UUID (outside a native runtime expo-crypto
  // can load but return undefined — found by the integration test).
  try {
    // expo-crypto is in Expo Go; required lazily so pure-logic tests do not need native modules
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Crypto = require('expo-crypto');
    const v = typeof Crypto.randomUUID === 'function' ? Crypto.randomUUID() : undefined;
    if (typeof v === 'string' && UUID_RE.test(v)) return v;
  } catch { /* fall through */ }
  const g = globalThis as { crypto?: { randomUUID?: () => string } };
  const w = g.crypto?.randomUUID?.();
  if (typeof w === 'string' && UUID_RE.test(w)) return w;
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export class GameSession {
  journey: JourneyState;
  meta: SessionMeta;
  readonly sync: SyncWorker;
  storageError: string | null = null;
  private queue: Promise<void> = Promise.resolve();
  private resumedAt: number | null = null;
  private listeners = new Set<() => void>();
  private now: () => number;
  private newId: () => string;

  private constructor(private adapter: RahYaabHostAdapter, readonly store: EventStore, journey: JourneyState, meta: SessionMeta, onSync?: (s: SyncStatus) => void) {
    this.journey = journey;
    this.meta = meta;
    this.now = adapter.now ?? Date.now;
    this.newId = adapter.newId ?? defaultId;
    this.sync = new SyncWorker(store, adapter.eventSink, meta.sessionId, { onStatus: onSync });
  }

  /** Open the student's unfinished session or start a new one. */
  static async open(adapter: RahYaabHostAdapter, opts: { forceNew?: boolean; onSync?: (s: SyncStatus) => void } = {}): Promise<{ session: GameSession; resumed: boolean }> {
    if (!adapter.consentGranted) throw new ConsentRequiredError('Consent/assent has not been confirmed by RahYaab.');
    if (!adapter.studentId) throw new Error('studentId is required');
    const store = new EventStore(adapter.storage ?? asyncStorageStore);
    const newId = adapter.newId ?? defaultId;
    const activeId = opts.forceNew ? null : await store.activeSessionId();
    if (activeId) {
      const [meta, journey] = await Promise.all([store.loadMeta(activeId), store.loadJourney(activeId)]);
      if (meta && journey && meta.studentId === adapter.studentId && !journey.finished) {
        const s = new GameSession(adapter, store, journey, meta, opts.onSync);
        s.resumeClock();
        await s.commit({ events: [{ level: 'journey', type: 'SESSION_RESUMED', data: { level_index: journey.currentIndex, active_level: journey.activeLevel } }] });
        void s.sync.flush();
        return { session: s, resumed: true };
      }
    }
    const sessionId = newId();
    const seed = Math.floor(Math.random() * 2 ** 31);
    const startedAt = isoWithOffset(new Date((adapter.now ?? Date.now)()));
    const s = new GameSession(adapter, store, initialJourney(sessionId, seed, startedAt), { sessionId, studentId: adapter.studentId, nextSeq: 0, activeMs: 0 }, opts.onSync);
    s.resumeClock();
    await s.commit({ events: [{ level: 'journey', type: 'SESSION_START', data: { seed, journey_levels: 8 } }] });
    return { session: s, resumed: false };
  }

  get sessionId() { return this.meta.sessionId; }
  get seed() { return this.journey.seed; }

  subscribe(fn: () => void) { this.listeners.add(fn); return () => { this.listeners.delete(fn); }; }
  private notify() { this.listeners.forEach((f) => f()); }

  // ---- pause-safe clock ------------------------------------------------------------------------
  activeMs(): number {
    return this.meta.activeMs + (this.resumedAt === null ? 0 : this.now() - this.resumedAt);
  }
  private resumeClock() { if (this.resumedAt === null) this.resumedAt = this.now(); }
  private pauseClock() {
    if (this.resumedAt !== null) { this.meta = { ...this.meta, activeMs: this.meta.activeMs + (this.now() - this.resumedAt) }; this.resumedAt = null; }
  }

  /** App went to background / screen locked. Persists the clock and flushes the outbox. */
  async pause(reason: string) {
    if (this.resumedAt === null) return;
    const level = this.journey.activeLevel ?? 'journey';
    await this.commit({ events: [{ level, type: 'GAME_PAUSED', data: { reason } }] });
    this.pauseClock();
    await this.commit({});
    void this.sync.flush();
  }

  async resume(reason: string) {
    if (this.resumedAt !== null) return;
    this.resumeClock();
    await this.commit({ events: [{ level: this.journey.activeLevel ?? 'journey', type: 'GAME_RESUMED', data: { reason } }] });
  }

  // ---- the single write path ------------------------------------------------------------------
  /**
   * Apply journey actions and persist events + checkpoint together. Returns when durable.
   * Invalid events are rejected loudly in development and dropped (with a console error) otherwise,
   * so a coding mistake cannot silently corrupt the evidence.
   */
  commit(input: { events?: EventSpec[]; actions?: JourneyAction[] }): Promise<void> {
    for (const a of input.actions ?? []) this.journey = journeyReducer(this.journey, a);
    const deps = { studentId: this.meta.studentId, sessionId: this.meta.sessionId, newId: this.newId,
      nowIso: () => isoWithOffset(new Date(this.now())), context: { language: this.adapter.language, mode: this.adapter.mode, app_version: this.adapter.appVersion } };
    const built: AssessmentEvent[] = [];
    for (const spec of input.events ?? []) {
      const e = makeEvent(deps, this.meta.nextSeq, this.activeMs(), spec.level, spec.type, spec.data, spec.opportunity ?? null);
      const v = validateEvent(e);
      if (!v.ok) {
        const msg = `Invalid event ${spec.type}: ${v.errors.join('; ')}`;
        if (process.env.NODE_ENV !== 'production') throw new Error(msg);
        console.error(msg);
        continue;
      }
      this.meta = { ...this.meta, nextSeq: this.meta.nextSeq + 1 };
      built.push(e);
    }
    const journey = this.journey;
    const meta = { ...this.meta, activeMs: this.activeMs() };
    this.notify();
    this.queue = this.queue.then(async () => {
      try {
        await this.store.commit(meta, journey, built);
        this.storageError = null;
      } catch {
        // one retry, then surface the problem to the UI (progress cannot be guaranteed)
        try { await this.store.commit(meta, journey, built); this.storageError = null; }
        catch (err2) { this.storageError = String((err2 as Error).message ?? err2); this.notify(); }
      }
      if (built.length) this.sync.schedule();
    });
    return this.queue;
  }

  /** Called after the reflection screen: computes results from the local log and hands them to RahYaab. */
  async finish(): Promise<AssessmentOutput> {
    await this.commit({ events: [{ level: 'journey', type: 'SESSION_END', data: { active_ms: this.activeMs() } }], actions: [{ type: 'FINISH' }] });
    const output = buildOutput(await this.store.loadEvents(this.sessionId));
    await this.adapter.onComplete(output);
    await this.sync.flush();
    return output;
  }

  /** Remove local copies once everything is uploaded. Returns false (and keeps data) if events are pending. */
  async purgeIfDelivered(): Promise<boolean> {
    if ((await this.store.countUnsent(this.sessionId)) > 0) return false;
    this.sync.stop();
    await this.store.purge(this.sessionId);
    return true;
  }

  async events() { await this.queue; return this.store.loadEvents(this.sessionId); }
}
