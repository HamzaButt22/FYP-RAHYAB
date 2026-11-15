// The outbox on the phone: an encrypted SQLite database (ADR-0010). SQLCipher encrypts the whole file
// (app.json: expo-sqlite useSQLCipher). Its 256-bit key comes from Android's SecureRandom (the device-key
// module) and is kept in expo-secure-store, which the Android Keystore protects. Writes are synchronous
// and fully synced to disk, so an event is safe before `emit` returns (FR-35).

import * as SecureStore from 'expo-secure-store';
import { deleteDatabaseSync, openDatabaseSync, type SQLiteDatabase } from 'expo-sqlite';

import { randomHex } from '../../modules/device-key';
import type { Envelope } from '../game/run';
import {
  GIVE_UP_DEFERRED_MS,
  KEEP_REJECTED_MS,
  type OutboxState,
  type OutboxStore,
} from './outbox';

const FILE = 'outbox.db';
const KEY_NAME = 'outbox.key';
const SCHEMA_VERSION = 1;

type Row = { payload: string };

export class SqliteOutbox implements OutboxStore {
  private readonly db: SQLiteDatabase;

  constructor(db: SQLiteDatabase) {
    this.db = db;
  }

  add(event: Envelope, now: number): void {
    this.db.runSync(
      'INSERT OR IGNORE INTO outbox (event_id, run_id, seq, payload, state, queued_at) VALUES (?, ?, ?, ?, ?, ?)',
      event.event_id,
      event.run_id,
      event.seq,
      JSON.stringify(event),
      'queued',
      now
    );
  }

  queued(limit: number): Envelope[] {
    return this.db
      .getAllSync<Row>(
        "SELECT payload FROM outbox WHERE state = 'queued' ORDER BY queued_at, seq LIMIT ?",
        limit
      )
      .map((r) => JSON.parse(r.payload) as Envelope);
  }

  markAcked(ids: string[], now: number): void {
    this.settle(ids.map((id) => ({ id, reason: null })), 'acked', now);
  }

  markRejected(rejected: { id: string; reason: string }[], now: number): void {
    this.settle(rejected, 'rejected', now);
  }

  markDeferred(deferred: { id: string; reason: string }[], now: number): void {
    this.db.withTransactionSync(() => {
      for (const { id, reason } of deferred) {
        this.db.runSync(
          "UPDATE outbox SET deferred_since = coalesce(deferred_since, ?), reason = ? WHERE event_id = ? AND state = 'queued'",
          now,
          reason,
          id
        );
      }
    });
  }

  tidy(now: number): void {
    this.db.withTransactionSync(() => {
      this.db.runSync(
        "UPDATE outbox SET state = 'expired', settled_at = ? WHERE state = 'queued' AND deferred_since IS NOT NULL AND deferred_since < ?",
        now,
        now - GIVE_UP_DEFERRED_MS
      );
      this.db.runSync("DELETE FROM outbox WHERE state = 'acked'");
      this.db.runSync(
        "DELETE FROM outbox WHERE state IN ('rejected', 'expired') AND settled_at < ?",
        now - KEEP_REJECTED_MS
      );
    });
  }

  dropQueuedBefore(before: number): number {
    return this.db.runSync("DELETE FROM outbox WHERE state = 'queued' AND queued_at < ?", before).changes;
  }

  counts(): Record<OutboxState, number> {
    const out: Record<OutboxState, number> = { queued: 0, acked: 0, rejected: 0, expired: 0 };
    for (const r of this.db.getAllSync<{ state: OutboxState; n: number }>(
      'SELECT state, count(*) AS n FROM outbox GROUP BY state'
    )) {
      out[r.state] = r.n;
    }
    return out;
  }

  private settle(rows: { id: string; reason: string | null }[], state: OutboxState, now: number): void {
    this.db.withTransactionSync(() => {
      for (const { id, reason } of rows) {
        this.db.runSync(
          "UPDATE outbox SET state = ?, reason = ?, settled_at = ? WHERE event_id = ? AND state = 'queued'",
          state,
          reason,
          now,
          id
        );
      }
    });
  }
}

async function databaseKey(): Promise<string> {
  const saved = await SecureStore.getItemAsync(KEY_NAME);
  if (saved && /^[0-9a-f]{64}$/.test(saved)) return saved;
  const key = randomHex(32);
  await SecureStore.setItemAsync(KEY_NAME, key);
  return key;
}

function open(key: string): SQLiteDatabase {
  const db = openDatabaseSync(FILE);
  db.execSync(`PRAGMA key = "x'${key}'"`); // a raw 256-bit key; `key` is checked to be 64 hex characters
  db.execSync('PRAGMA journal_mode = WAL; PRAGMA synchronous = FULL;');
  db.getFirstSync('SELECT count(*) FROM sqlite_master'); // fails here if the key does not open the file
  return db;
}

/** Opens (or creates) the encrypted outbox. Call once at start-up. */
export async function openOutbox(): Promise<SqliteOutbox> {
  const key = await databaseKey();
  let db: SQLiteDatabase;
  try {
    db = open(key);
  } catch {
    // The key is gone (app data partly cleared) so the old file can never be read: start a new one.
    try {
      deleteDatabaseSync(FILE);
    } catch {
      // nothing to delete
    }
    db = open(key);
  }
  const version = db.getFirstSync<{ user_version: number }>('PRAGMA user_version')?.user_version ?? 0;
  if (version < 1) {
    db.execSync(`
      CREATE TABLE IF NOT EXISTS outbox (
        event_id        TEXT PRIMARY KEY,
        run_id          TEXT NOT NULL,
        seq             INTEGER NOT NULL,
        payload         TEXT NOT NULL,
        state           TEXT NOT NULL CHECK (state IN ('queued', 'acked', 'rejected', 'expired')),
        queued_at       INTEGER NOT NULL,
        deferred_since  INTEGER,
        reason          TEXT,
        settled_at      INTEGER
      );
      CREATE INDEX IF NOT EXISTS outbox_queue ON outbox (state, queued_at, seq);
      PRAGMA user_version = ${SCHEMA_VERSION};
    `);
  }
  return new SqliteOutbox(db);
}
