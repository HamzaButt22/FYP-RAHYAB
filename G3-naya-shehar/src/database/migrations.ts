/** Forward-only schema migrations. Each runs inside a transaction. */
export const MIGRATIONS: { version: number; sql: string }[] = [
  {
    version: 1,
    sql: `
      CREATE TABLE IF NOT EXISTS kv (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS events (
        seq INTEGER PRIMARY KEY AUTOINCREMENT,
        recorded_at TEXT NOT NULL,
        session_id TEXT NOT NULL,
        week INTEGER NOT NULL,
        type TEXT NOT NULL,
        item_id TEXT NOT NULL,
        measured INTEGER NOT NULL,
        payload TEXT NOT NULL
      );`,
  },
  {
    version: 2,
    sql: `
      CREATE INDEX IF NOT EXISTS events_by_week ON events (week, type);
      CREATE VIEW IF NOT EXISTS puzzle_performance AS
        SELECT item_id, week, measured,
               json_extract(payload, '$.family') AS family,
               json_extract(payload, '$.level') AS level,
               json_extract(payload, '$.firstAttemptCorrect') AS first_attempt_correct,
               json_extract(payload, '$.attempts') AS attempts
        FROM events WHERE type = 'task_result';`,
  },
];

export const LATEST_VERSION = MIGRATIONS[MIGRATIONS.length - 1].version;
