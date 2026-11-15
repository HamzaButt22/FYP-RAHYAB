// The sync worker: sends the outbox to POST /v1/events:batch and applies the answer (RFC-0002).
//
// When: the app calls syncNow() when it comes to the foreground, after a run ends, every 15 minutes while
// open, and when the network may be back (a failed send just waits; there is no network library).
// Failures wait with exponential backoff: 30 s, doubling to 30 min, ±20% jitter. A 429 waits as long as the
// server says. Without consent (403 consent_required) nothing is sent until consent changes; the events
// stay on the phone. Pure logic with its dependencies passed in, so it is tested with `pnpm test`.

import type { Envelope } from '../game/run.ts';
import type { OutboxStore } from './outbox.ts';

export const MAX_EVENTS = 500;
export const MAX_BATCHES_PER_SYNC = 10;
export const BACKOFF_START_MS = 30_000;
export const BACKOFF_MAX_MS = 30 * 60_000;

export interface BatchResult {
  accepted: string[];
  duplicates: string[];
  deferred: { id: string; reason: string }[];
  rejected: { id: string; reason: string }[];
  unreadable?: number;
}

/** What one POST came back with (the shape of api/client.ts ApiResult, kept separate for tests). */
export type SendResult =
  | { ok: true; data: BatchResult }
  | { ok: false; kind: 'offline' }
  | { ok: false; kind: 'signed_out' }
  | { ok: false; kind: 'problem'; status: number; code: string; retryAfterSeconds: number | null };

export interface SyncDeps {
  store: OutboxStore;
  send: (events: Envelope[], idempotencyKey: string) => Promise<SendResult>;
  now: () => number;
  random: () => number;
  newKey: () => string;
}

export type SyncOutcome =
  | { kind: 'done'; sent: number; acked: number; deferred: number; rejected: number }
  | { kind: 'waiting'; untilMs: number }
  | { kind: 'busy' }
  | { kind: 'consent_required' }
  | { kind: 'signed_out' }
  | { kind: 'failed'; reason: string; retryAt: number };

export function backoffMs(failures: number, random: number): number {
  const base = Math.min(BACKOFF_START_MS * 2 ** Math.max(0, failures - 1), BACKOFF_MAX_MS);
  return Math.round(base * (0.8 + 0.4 * random));
}

export class Syncer {
  private failures = 0;
  private notBefore = 0;
  private running = false;
  private batchSize = MAX_EVENTS;
  private blockedByConsent = false;
  private readonly deps: SyncDeps;

  constructor(deps: SyncDeps) {
    this.deps = deps; // no parameter property: Node's type stripping (pnpm test) does not support them
  }

  /** Call when consent is granted (or the student signs in again): the next sync runs at once. */
  wake(): void {
    this.blockedByConsent = false;
    this.notBefore = 0;
  }

  async syncNow(): Promise<SyncOutcome> {
    const { store, now } = this.deps;
    if (this.running) return { kind: 'busy' };
    if (this.blockedByConsent) return { kind: 'consent_required' };
    if (now() < this.notBefore) return { kind: 'waiting', untilMs: this.notBefore };
    this.running = true;
    const total = { kind: 'done' as const, sent: 0, acked: 0, deferred: 0, rejected: 0 };
    try {
      store.tidy(now());
      for (let i = 0; i < MAX_BATCHES_PER_SYNC; i++) {
        const size = this.batchSize;
        const batch = store.queued(size);
        if (batch.length === 0) break;
        const result = await this.deps.send(batch, this.deps.newKey());
        if (!result.ok) return this.fail(result);
        const at = now();
        store.markAcked([...result.data.accepted, ...result.data.duplicates], at);
        store.markRejected(result.data.rejected, at);
        store.markDeferred(result.data.deferred, at);
        this.failures = 0;
        this.batchSize = MAX_EVENTS;
        total.sent += batch.length;
        total.acked += result.data.accepted.length + result.data.duplicates.length;
        total.deferred += result.data.deferred.length;
        total.rejected += result.data.rejected.length;
        // A batch that only waited (deferred) would come back the same: stop until the next sync.
        if (batch.length < size || result.data.deferred.length === batch.length) break;
      }
      store.tidy(now());
      return total;
    } finally {
      this.running = false;
    }
  }

  private fail(result: Exclude<SendResult, { ok: true }>): SyncOutcome {
    if (result.kind === 'signed_out') return { kind: 'signed_out' };
    if (result.kind === 'problem' && result.code === 'consent_required') {
      this.blockedByConsent = true;
      return { kind: 'consent_required' };
    }
    if (result.kind === 'problem' && result.status === 413) {
      this.batchSize = Math.max(1, Math.floor(this.batchSize / 2)); // try smaller batches straight away
      return { kind: 'failed', reason: 'too_large', retryAt: this.deps.now() };
    }
    this.failures++;
    const wait =
      result.kind === 'problem' && result.status === 429 && result.retryAfterSeconds
        ? result.retryAfterSeconds * 1000
        : backoffMs(this.failures, this.deps.random());
    this.notBefore = this.deps.now() + wait;
    const reason = result.kind === 'offline' ? 'offline' : `${result.status} ${result.code}`;
    return { kind: 'failed', reason, retryAt: this.notBefore };
  }
}
