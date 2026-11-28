import * as SQLite from 'expo-sqlite';
import { AssessmentEvent, StoredEvent } from '@/assessment/types';
import { Store } from './store';
import { LATEST_VERSION, MIGRATIONS } from './migrations';

interface EventRow { seq: number; recorded_at: string; session_id: string; measured: number; payload: string }

/** SQLite-backed store (Android / iOS). Uses the synchronous API so saves finish before the next frame. */
export class SqliteStore implements Store {
  private db: SQLite.SQLiteDatabase;
  constructor(name = 'naya-shehar.db') {
    this.db = SQLite.openDatabaseSync(name);
    this.db.execSync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
    this.migrate();
  }

  private migrate() {
    const row = this.db.getFirstSync<{ user_version: number }>('PRAGMA user_version');
    let current = row?.user_version ?? 0;
    for (const m of MIGRATIONS) {
      if (m.version <= current) continue;
      this.db.withTransactionSync(() => {
        this.db.execSync(m.sql);
        this.db.execSync(`PRAGMA user_version = ${m.version}`);
      });
      current = m.version;
    }
  }

  schemaVersion() {
    return this.db.getFirstSync<{ user_version: number }>('PRAGMA user_version')?.user_version ?? 0;
  }

  getKV<T>(key: string): T | null {
    const r = this.db.getFirstSync<{ value: string }>('SELECT value FROM kv WHERE key = ?', key);
    return r ? (JSON.parse(r.value) as T) : null;
  }

  commit(kv: Record<string, unknown>, events: Omit<StoredEvent, 'seq'>[] = []) {
    const now = new Date().toISOString();
    const entries = Object.entries(kv).map(([k, v]) => [k, JSON.stringify(v)] as const);
    this.db.withTransactionSync(() => {
      for (const [k, v] of entries) {
        this.db.runSync('INSERT INTO kv (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at', k, v, now);
      }
      for (const e of events) {
        this.db.runSync(
          'INSERT INTO events (recorded_at, session_id, week, type, item_id, measured, payload) VALUES (?, ?, ?, ?, ?, ?, ?)',
          e.recordedAt, e.sessionId, e.event.week, e.event.type, e.event.itemId, e.measured ? 1 : 0, JSON.stringify(e.event),
        );
      }
    });
  }

  listEvents(): StoredEvent[] {
    return this.db.getAllSync<EventRow>('SELECT seq, recorded_at, session_id, measured, payload FROM events ORDER BY seq').map((r) => ({
      seq: r.seq, recordedAt: r.recorded_at, sessionId: r.session_id, measured: r.measured === 1,
      event: JSON.parse(r.payload) as AssessmentEvent,
    }));
  }

  reset() {
    this.db.withTransactionSync(() => {
      this.db.execSync('DELETE FROM kv; DELETE FROM events;');
    });
  }
}

export const SQLITE_SCHEMA_VERSION = LATEST_VERSION;
