// The outbox: every event is kept on the phone until the server has it (ADR-0010, RFC-0002).
//
// An event is written here before the game moves on (FR-35), so a crash, a dead battery or a week without
// internet loses nothing. The sync worker (sync.ts) sends queued events in the order they were made and
// applies the server's answer:
//   accepted / duplicates → acked (then removed: the server has them);
//   deferred (an earlier event of the run must arrive first) → stays queued and is sent again; given up
//     after 7 days (expired);
//   rejected (the event itself is wrong) → kept 7 days for debugging, never sent again.
// The store is an interface: in memory for tests and the game lab, encrypted SQLite (SQLCipher, key in
// the Android Keystore) in the app. Its methods are synchronous so an event is stored before `emit` returns.

import type { Envelope } from '../game/run.ts';

export type OutboxState = 'queued' | 'acked' | 'rejected' | 'expired';

export interface OutboxRow {
  event: Envelope;
  state: OutboxState;
  /** When it was written (ms); the sending order. */
  queuedAt: number;
  /** When the server first said "wait" (deferred), or null. */
  deferredSince: number | null;
  /** The server's reason for rejected or deferred rows. */
  reason: string | null;
  /** When it reached its final state (acked, rejected, expired), for clean-up. */
  settledAt: number | null;
}

export const KEEP_REJECTED_MS = 7 * 24 * 3600 * 1000;
export const GIVE_UP_DEFERRED_MS = 7 * 24 * 3600 * 1000;
/** Without the family's consent nothing is ever sent; the phone deletes events after 14 days (FR-05). */
export const KEEP_UNCONSENTED_MS = 14 * 24 * 3600 * 1000;

export interface OutboxStore {
  add(event: Envelope, now: number): void;
  /** Queued events, oldest first, at most `limit`. */
  queued(limit: number): Envelope[];
  markAcked(ids: string[], now: number): void;
  markRejected(rejected: { id: string; reason: string }[], now: number): void;
  markDeferred(deferred: { id: string; reason: string }[], now: number): void;
  /** Deferred too long → expired; removes acked rows and old rejected/expired rows. */
  tidy(now: number): void;
  /** Deletes queued events written before `before` (consent never came, FR-05). Returns how many. */
  dropQueuedBefore(before: number): number;
  counts(): Record<OutboxState, number>;
}

/** In memory: for tests and the game lab. The app uses the encrypted SQLite store. */
export class MemoryOutbox implements OutboxStore {
  readonly rows = new Map<string, OutboxRow>();

  add(event: Envelope, now: number): void {
    if (this.rows.has(event.event_id)) return; // the same event twice is one event
    this.rows.set(event.event_id, {
      event,
      state: 'queued',
      queuedAt: now,
      deferredSince: null,
      reason: null,
      settledAt: null,
    });
  }

  queued(limit: number): Envelope[] {
    return [...this.rows.values()]
      .filter((r) => r.state === 'queued')
      .sort((a, b) => a.queuedAt - b.queuedAt || a.event.seq - b.event.seq)
      .slice(0, limit)
      .map((r) => r.event);
  }

  markAcked(ids: string[], now: number): void {
    for (const id of ids) this.settle(id, 'acked', null, now);
  }

  markRejected(rejected: { id: string; reason: string }[], now: number): void {
    for (const { id, reason } of rejected) this.settle(id, 'rejected', reason, now);
  }

  markDeferred(deferred: { id: string; reason: string }[], now: number): void {
    for (const { id, reason } of deferred) {
      const row = this.rows.get(id);
      if (!row || row.state !== 'queued') continue;
      row.deferredSince ??= now;
      row.reason = reason;
    }
  }

  tidy(now: number): void {
    for (const [id, row] of this.rows) {
      if (row.state === 'queued' && row.deferredSince !== null && now - row.deferredSince > GIVE_UP_DEFERRED_MS) {
        this.settle(id, 'expired', row.reason, now);
      } else if (row.state === 'acked') {
        this.rows.delete(id);
      } else if ((row.state === 'rejected' || row.state === 'expired') && now - (row.settledAt ?? now) > KEEP_REJECTED_MS) {
        this.rows.delete(id);
      }
    }
  }

  dropQueuedBefore(before: number): number {
    let dropped = 0;
    for (const [id, row] of this.rows) {
      if (row.state === 'queued' && row.queuedAt < before) {
        this.rows.delete(id);
        dropped++;
      }
    }
    return dropped;
  }

  counts(): Record<OutboxState, number> {
    const out: Record<OutboxState, number> = { queued: 0, acked: 0, rejected: 0, expired: 0 };
    for (const row of this.rows.values()) out[row.state]++;
    return out;
  }

  private settle(id: string, state: OutboxState, reason: string | null, now: number): void {
    const row = this.rows.get(id);
    if (!row || row.state !== 'queued') return;
    row.state = state;
    row.reason = reason;
    row.settledAt = now;
  }
}
