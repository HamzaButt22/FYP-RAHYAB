'use strict';
const express = require('express');
const { sha256, token } = require('./auth');
const { tx } = require('./db');

const EVENT_TYPES = new Set(['choice_made', 'plan_committed', 'reaction', 'task_result']);
const MAX_EVENTS = 500;

class Bad extends Error { constructor(m) { super(m); this.status = 400; } }

const isStr = (v, max) => typeof v === 'string' && v.length <= max;
const isInt = (v, lo, hi) => Number.isInteger(v) && v >= lo && v <= hi;

/** Validates the upload; throws Bad with a short reason. Returns the cleaned payload. */
function validate(p) {
  if (!p || typeof p !== 'object') throw new Bad('body must be JSON');
  if (p.protocol !== 1) throw new Bad('unsupported protocol');
  if (!isStr(p.deviceId, 64) || !/^[A-Za-z0-9-]{8,64}$/.test(p.deviceId)) throw new Bad('bad deviceId');
  if (!/^\d{6}$/.test(String(p.classCode))) throw new Bad('bad classCode');
  if (!isInt(p.roll, 1, 9999)) throw new Bad('bad roll');
  if (p.nickname !== undefined && !isStr(p.nickname, 24)) throw new Bad('bad nickname');
  if (p.token !== undefined && p.token !== null && !isStr(p.token, 100)) throw new Bad('bad token');
  if (!p.progress || typeof p.progress !== 'object') throw new Bad('missing progress');
  if (!p.results || typeof p.results !== 'object') throw new Bad('missing results');
  if (!Array.isArray(p.events) || p.events.length > MAX_EVENTS) throw new Bad('bad events');
  for (const e of p.events) {
    if (!e || !isInt(e.seq, 1, Number.MAX_SAFE_INTEGER)) throw new Bad('bad event seq');
    if (!isStr(e.sessionId, 80) || typeof e.measured !== 'boolean' || !isStr(e.recordedAt, 40)) throw new Bad('bad event envelope');
    const ev = e.event;
    if (!ev || !EVENT_TYPES.has(ev.type) || !isStr(ev.itemId, 40) || !isInt(ev.week, 0, 4)) throw new Bad('bad event');
  }
  const progress = JSON.stringify(p.progress);
  const results = JSON.stringify(p.results);
  if (progress.length > 20_000 || results.length > 60_000) throw new Bad('payload too large');
  return p;
}

function apiRouter(db) {
  const r = express.Router();
  r.use(express.json({ limit: '1mb' }));

  r.get('/health', (_req, res) => res.json({ ok: true }));

  /** Used by the app's join screen to confirm a class code. */
  r.post('/classes/lookup', (req, res) => {
    const code = String(req.body?.code ?? '');
    if (!/^\d{6}$/.test(code)) return res.status(400).json({ error: 'bad code' });
    const c = db.prepare('SELECT name, school FROM classes WHERE code = ?').get(code);
    if (!c) return res.status(404).json({ error: 'not found' });
    res.json({ name: c.school ? `${c.name} · ${c.school}` : c.name });
  });

  /** Upload from a phone: latest progress/results snapshot + new events. Idempotent per (device, seq). */
  r.post('/sync', (req, res) => {
    let p;
    try { p = validate(req.body); } catch (e) { return res.status(e.status || 400).json({ error: e.message }); }
    const cls = db.prepare('SELECT id, name, school FROM classes WHERE code = ?').get(String(p.classCode));
    if (!cls) return res.status(404).json({ error: 'Class code not found.' });
    const existing = db.prepare('SELECT token_hash, ack_seq FROM devices WHERE device_id = ?').get(p.deviceId);
    let issued;
    if (existing) {
      if (!p.token || sha256(p.token) !== existing.token_hash) return res.status(401).json({ error: 'This phone is not recognised. Ask your teacher for help.' });
    } else {
      issued = token();
    }
    const unmeasured = new Set(Array.isArray(p.progress.unmeasuredSessions) ? p.progress.unmeasuredSessions.map(String) : []);
    const ack = tx(db, () => {
      if (existing) {
        db.prepare(`UPDATE devices SET class_id = ?, roll = ?, nickname = ?, avatar = ?, app_version = ?, progress = ?, results = ?, student = ?, last_sync = datetime('now') WHERE device_id = ?`)
          .run(cls.id, p.roll, p.nickname || '', JSON.stringify(p.avatar ?? null), String(p.appVersion || ''), JSON.stringify(p.progress), JSON.stringify(p.results), p.student ? JSON.stringify(p.student) : null, p.deviceId);
      } else {
        db.prepare(`INSERT INTO devices (device_id, token_hash, class_id, roll, nickname, avatar, app_version, progress, results, student) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
          .run(p.deviceId, sha256(issued), cls.id, p.roll, p.nickname || '', JSON.stringify(p.avatar ?? null), String(p.appVersion || ''), JSON.stringify(p.progress), JSON.stringify(p.results), p.student ? JSON.stringify(p.student) : null);
      }
      const ins = db.prepare(`INSERT OR IGNORE INTO events (device_id, seq, session_id, week, type, item_id, measured, payload, recorded_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
      for (const e of p.events) ins.run(p.deviceId, e.seq, e.sessionId, e.event.week, e.event.type, e.event.itemId, e.measured ? 1 : 0, JSON.stringify(e.event), e.recordedAt);
      // Sessions later switched to accessible mode are excluded retroactively.
      if (unmeasured.size) {
        const upd = db.prepare('UPDATE events SET measured = 0 WHERE device_id = ? AND session_id = ?');
        for (const sid of unmeasured) upd.run(p.deviceId, sid);
      }
      const maxSeq = p.events.reduce((m, e) => Math.max(m, e.seq), existing ? existing.ack_seq : 0);
      db.prepare('UPDATE devices SET ack_seq = ? WHERE device_id = ?').run(maxSeq, p.deviceId);
      return maxSeq;
    });
    res.json({ ok: true, ackSeq: ack, token: issued, className: cls.school ? `${cls.name} · ${cls.school}` : cls.name });
  });

  r.use((err, _req, res, _next) => {
    if (err.type === 'entity.too.large') return res.status(413).json({ error: 'payload too large' });
    if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'body must be JSON' });
    console.error(err);
    res.status(500).json({ error: 'server error' });
  });
  return r;
}

module.exports = { apiRouter, validate };
