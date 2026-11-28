'use strict';
const { DatabaseSync } = require('node:sqlite');

/** Forward-only migrations, tracked with PRAGMA user_version. */
const MIGRATIONS = [
  `CREATE TABLE users (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     username TEXT NOT NULL UNIQUE COLLATE NOCASE,
     display_name TEXT NOT NULL,
     role TEXT NOT NULL CHECK (role IN ('admin','teacher')),
     pass_hash TEXT NOT NULL,
     created_at TEXT NOT NULL DEFAULT (datetime('now'))
   );
   CREATE TABLE sessions (
     id TEXT PRIMARY KEY,
     user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
     csrf TEXT NOT NULL,
     expires_at INTEGER NOT NULL
   );
   CREATE TABLE classes (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     code TEXT NOT NULL UNIQUE,
     name TEXT NOT NULL,
     school TEXT NOT NULL DEFAULT '',
     teacher_id INTEGER NOT NULL REFERENCES users(id),
     created_at TEXT NOT NULL DEFAULT (datetime('now'))
   );
   CREATE TABLE devices (
     device_id TEXT PRIMARY KEY,
     token_hash TEXT NOT NULL,
     class_id INTEGER NOT NULL REFERENCES classes(id),
     roll INTEGER NOT NULL,
     nickname TEXT NOT NULL DEFAULT '',
     avatar TEXT,
     app_version TEXT,
     progress TEXT NOT NULL DEFAULT '{}',
     results TEXT NOT NULL DEFAULT '{}',
     student TEXT,
     ack_seq INTEGER NOT NULL DEFAULT 0,
     archived INTEGER NOT NULL DEFAULT 0,
     first_seen TEXT NOT NULL DEFAULT (datetime('now')),
     last_sync TEXT NOT NULL DEFAULT (datetime('now'))
   );
   CREATE INDEX devices_by_class ON devices (class_id, roll);
   CREATE TABLE events (
     device_id TEXT NOT NULL REFERENCES devices(device_id) ON DELETE CASCADE,
     seq INTEGER NOT NULL,
     session_id TEXT NOT NULL,
     week INTEGER NOT NULL,
     type TEXT NOT NULL,
     item_id TEXT NOT NULL,
     measured INTEGER NOT NULL,
     payload TEXT NOT NULL,
     recorded_at TEXT NOT NULL,
     PRIMARY KEY (device_id, seq)
   );`,
];

function openDb(path) {
  const db = new DatabaseSync(path);
  db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 3000;');
  let v = db.prepare('PRAGMA user_version').get().user_version;
  for (let i = v; i < MIGRATIONS.length; i++) {
    db.exec('BEGIN');
    try {
      db.exec(MIGRATIONS[i]);
      db.exec(`PRAGMA user_version = ${i + 1}`);
      db.exec('COMMIT');
    } catch (e) { db.exec('ROLLBACK'); throw e; }
  }
  return db;
}

/** Run fn inside a transaction. */
function tx(db, fn) {
  db.exec('BEGIN IMMEDIATE');
  try { const r = fn(); db.exec('COMMIT'); return r; } catch (e) { db.exec('ROLLBACK'); throw e; }
}

module.exports = { openDb, tx, SCHEMA_VERSION: MIGRATIONS.length };
