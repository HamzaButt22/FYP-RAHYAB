/**
 * Runs the REAL SqliteStore (schema, migrations, transactions, queries) on a
 * real SQLite engine (sql.js) behind a minimal expo-sqlite-compatible shim.
 */
import initSqlJs, { Database, SqlJsStatic } from 'sql.js';
import { DAY, FakeClock, playWeek, prefFromOrder } from './helpers';

let SQL: SqlJsStatic;
const files = new Map<string, Uint8Array>();
let failNextRun = false;

class MockShimDb {
  db: Database;
  constructor(private name: string) { const f = files.get(name); this.db = f ? new SQL.Database(f) : new SQL.Database(); }
  private inTx = false;
  private persist() { if (!this.inTx) files.set(this.name, this.db.export()); }
  execSync(sql: string) { this.db.exec(sql); this.persist(); }
  getFirstSync<T>(sql: string, ...params: unknown[]): T | null {
    const st = this.db.prepare(sql); st.bind(params as never[]);
    const r = st.step() ? (st.getAsObject() as T) : null; st.free(); return r;
  }
  getAllSync<T>(sql: string, ...params: unknown[]): T[] {
    const st = this.db.prepare(sql); st.bind(params as never[]);
    const out: T[] = []; while (st.step()) out.push(st.getAsObject() as T); st.free(); return out;
  }
  runSync(sql: string, ...params: unknown[]) {
    if (failNextRun && sql.startsWith('INSERT INTO events')) { failNextRun = false; throw new Error('disk full (simulated)'); }
    this.db.run(sql, params as never[]); return { changes: this.db.getRowsModified(), lastInsertRowId: 0 };
  }
  withTransactionSync(fn: () => void) {
    this.db.exec('BEGIN'); this.inTx = true;
    try { fn(); this.db.exec('COMMIT'); } catch (e) { this.db.exec('ROLLBACK'); throw e; } finally { this.inTx = false; this.persist(); }
  }
}

jest.mock('expo-sqlite', () => ({ openDatabaseSync: (name: string) => new MockShimDb(name) }));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const load = () => require('@/database/sqliteStore') as typeof import('@/database/sqliteStore');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const loadEngine = () => require('@/game/engine/GameEngine') as typeof import('@/game/engine/GameEngine');

beforeAll(async () => { SQL = await initSqlJs(); });
beforeEach(() => files.clear());

describe('SqliteStore on real SQLite', () => {
  test('migrations run once and set user_version', () => {
    const { SqliteStore, SQLITE_SCHEMA_VERSION } = load();
    const a = new SqliteStore('t.db');
    expect(a.schemaVersion()).toBe(SQLITE_SCHEMA_VERSION);
    const b = new SqliteStore('t.db'); // re-open: no error, no duplicate migration
    expect(b.schemaVersion()).toBe(SQLITE_SCHEMA_VERSION);
  });

  test('a full playthrough persists across "app restarts" and the puzzle view works', () => {
    const { SqliteStore } = load();
    const { GameEngine } = loadEngine();
    const clock = new FakeClock();
    const persona = { pref: prefFromOrder(['A', 'S', 'E', 'I', 'C', 'R']), solve: () => true };
    let engine = new GameEngine(new SqliteStore('play.db'), clock.now);
    engine.setAvatar({ skin: '#C98E64', face: 'round', hair: 'short', hairColour: '#1E140E', outfit: 'kurta', outfitColour: '#2E8B57', accessory: 'none', nickname: 'Noor' });
    playWeek(engine, 0, persona);
    for (const w of [1, 2, 3, 4] as const) {
      if (w > 1) clock.advance(8 * DAY);
      engine = new GameEngine(new SqliteStore('play.db'), clock.now); // reopen the app each week
      playWeek(engine, w, persona);
    }
    engine = new GameEngine(new SqliteStore('play.db'), clock.now);
    expect(engine.isFinished()).toBe(true);
    expect(engine.state.avatar?.nickname).toBe('Noor');
    expect(engine.events().filter((e) => e.event.type === 'choice_made')).toHaveLength(30);
    expect(engine.interestProfile().order[0]).toBe('A');
    const db = new SQL.Database(files.get('play.db')!);
    const perf = db.exec('SELECT family, COUNT(*) FROM puzzle_performance WHERE measured = 1 GROUP BY family ORDER BY family');
    expect(perf[0].values).toEqual([['ABS', 8], ['LOG', 8], ['NUM', 8], ['PLN', 8], ['SPA', 8], ['VRB', 8]]);
  });

  test('a failed write rolls back state AND events together', () => {
    const { SqliteStore } = load();
    const store = new SqliteStore('atomic.db');
    store.commit({ town: { grant: 1 } });
    failNextRun = true;
    expect(() => store.commit({ town: { grant: 999 } }, [{ recordedAt: 'x', sessionId: 's', measured: true, event: { type: 'reaction', itemId: 'x', week: 1, category: 'R', value: 'loved' } }])).toThrow();
    expect(store.getKV<{ grant: number }>('town')!.grant).toBe(1);
    expect(store.listEvents()).toHaveLength(0);
  });

  test('reset wipes everything', () => {
    const { SqliteStore } = load();
    const s = new SqliteStore('r.db');
    s.commit({ a: 1 }, [{ recordedAt: 'x', sessionId: 's', measured: true, event: { type: 'reaction', itemId: 'x', week: 1, category: 'R', value: 'okay' } }]);
    s.reset();
    expect(s.getKV('a')).toBeNull();
    expect(s.listEvents()).toHaveLength(0);
  });
});
