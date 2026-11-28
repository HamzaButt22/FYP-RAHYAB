'use strict';
const path = require('node:path');
const crypto = require('node:crypto');
const express = require('express');
const { openDb } = require('./db');
const auth = require('./auth');
const { apiRouter } = require('./api');
const V = require('./views');
const R = require('./report');

/**
 * Builds the dashboard + API app.
 * @param {{ dbPath: string, adminUser?: string, adminPassword?: string, secureCookies?: boolean, log?: (m: string) => void }} opts
 */
function createApp(opts) {
  const db = openDb(opts.dbPath);
  const log = opts.log ?? console.log;

  // First start: create the admin account.
  if (!db.prepare('SELECT COUNT(*) AS n FROM users').get().n) {
    const user = opts.adminUser || 'admin';
    const pw = opts.adminPassword || crypto.randomBytes(9).toString('base64url');
    db.prepare('INSERT INTO users (username, display_name, role, pass_hash) VALUES (?, ?, ?, ?)').run(user, 'Administrator', 'admin', auth.hashPassword(pw));
    log(`[naya-shehar] Created admin account "${user}"${opts.adminPassword ? '' : ` with password: ${pw}  (change it under Teachers)`}`);
  }

  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.use((_req, res, next) => {
    res.set({
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Referrer-Policy': 'same-origin',
      'Content-Security-Policy': "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; frame-ancestors 'none'; form-action 'self'",
    });
    next();
  });

  // Phones: JSON API (no cookies, no CSRF).
  app.use('/api/v1', apiRouter(db));

  app.use('/static', express.static(path.join(__dirname, '..', 'public'), { maxAge: '7d' }));
  app.use(express.urlencoded({ extended: false, limit: '50kb' }));
  app.use(auth.sessionMiddleware(db));

  const cookie = (res, value, maxAgeSec) => res.setHeader('Set-Cookie',
    `ns_sid=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSec}${opts.secureCookies ? '; Secure' : ''}`);
  const requireUser = (req, res, next) => (req.user ? next() : res.redirect(`/login?next=${encodeURIComponent(req.originalUrl)}`));
  const requireAdmin = (req, res, next) => (req.user?.role === 'admin' ? next() : res.status(404).send(V.notFound(req.user, req.csrf)));
  const csrf = (req, res, next) => {
    const t = req.body?._csrf;
    if (!req.csrf || typeof t !== 'string' || t.length !== req.csrf.length || !crypto.timingSafeEqual(Buffer.from(t), Buffer.from(req.csrf))) {
      return res.status(403).send('Form expired. Go back, reload the page and try again.');
    }
    next();
  };
  const page = (req, html) => html;

  /** Classes the current user may see. */
  const visibleClass = (user, id) => db.prepare(`SELECT c.*, u.display_name AS teacher FROM classes c JOIN users u ON u.id = c.teacher_id WHERE c.id = ? ${user.role === 'admin' ? '' : 'AND c.teacher_id = ?'}`)
    .get(...(user.role === 'admin' ? [id] : [id, user.id]));
  const devicesOf = (classId) => db.prepare('SELECT * FROM devices WHERE class_id = ?').all(classId).map(R.device);

  // ── auth ──
  app.get('/login', (req, res) => (req.user ? res.redirect('/classes') : res.send(V.login({ next: req.query.next }))));
  app.post('/login', auth.loginLimiter(), (req, res) => {
    const u = db.prepare('SELECT * FROM users WHERE username = ?').get(String(req.body.username || ''));
    if (!u || !auth.verifyPassword(String(req.body.password || ''), u.pass_hash)) {
      return res.status(401).send(V.login({ error: 'Wrong username or password.', next: req.body.next }));
    }
    db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(Date.now());
    cookie(res, auth.createSession(db, u.id), auth.SESSION_HOURS * 3600);
    const next = String(req.body.next || '');
    res.redirect(next.startsWith('/') && !next.startsWith('//') ? next : '/classes');
  });
  app.post('/logout', requireUser, csrf, (req, res) => { auth.destroySession(db, req.sid); cookie(res, '', 0); res.redirect('/login'); });

  app.get('/', (req, res) => res.redirect(req.user ? '/classes' : '/login'));

  // ── classes ──
  app.get('/classes', requireUser, (req, res) => {
    const where = req.user.role === 'admin' ? '' : 'WHERE c.teacher_id = ?';
    const rows = db.prepare(`SELECT c.*, u.display_name AS teacher FROM classes c JOIN users u ON u.id = c.teacher_id ${where} ORDER BY c.created_at DESC, c.id DESC`)
      .all(...(req.user.role === 'admin' ? [] : [req.user.id]))
      .map((c) => {
        const ds = devicesOf(c.id).filter((d) => !d.archived);
        return { ...c, students: ds.length, finished: ds.filter((d) => d.progress.finished).length, ready: ds.filter((d) => d.status.key === 'ready').length };
      });
    const teachers = req.user.role === 'admin' ? db.prepare('SELECT id, display_name FROM users ORDER BY display_name').all() : [];
    res.send(page(req, V.classes({ user: req.user, csrf: req.csrf, rows, teachers, created: /^\d{6}$/.test(String(req.query.created)) ? req.query.created : null })));
  });

  app.post('/classes', requireUser, csrf, (req, res) => {
    const name = String(req.body.name || '').trim().slice(0, 60);
    const school = String(req.body.school || '').trim().slice(0, 80);
    if (!name) return res.redirect('/classes');
    let teacherId = req.user.id;
    if (req.user.role === 'admin' && req.body.teacher_id) {
      const t = db.prepare('SELECT id FROM users WHERE id = ?').get(Number(req.body.teacher_id));
      if (t) teacherId = t.id;
    }
    let code;
    for (let i = 0; i < 50; i++) {
      const c = String(crypto.randomInt(100000, 1000000));
      if (!db.prepare('SELECT 1 FROM classes WHERE code = ?').get(c)) { code = c; break; }
    }
    db.prepare('INSERT INTO classes (code, name, school, teacher_id) VALUES (?, ?, ?, ?)').run(code, name, school, teacherId);
    res.redirect(`/classes?created=${code}`);
  });

  app.get('/classes/:id', requireUser, (req, res) => {
    const cls = visibleClass(req.user, Number(req.params.id));
    if (!cls) return res.status(404).send(V.notFound(req.user, req.csrf));
    const filter = ['ready', 'playing', 'attention'].includes(req.query.show) ? req.query.show : '';
    res.send(V.classView({ user: req.user, csrf: req.csrf, cls, devices: devicesOf(cls.id), filter }));
  });

  app.get('/classes/:id/export.csv', requireUser, (req, res) => {
    const cls = visibleClass(req.user, Number(req.params.id));
    if (!cls) return res.status(404).send(V.notFound(req.user, req.csrf));
    const rows = devicesOf(cls.id).filter((d) => !d.archived).sort((a, b) => a.roll - b.roll).map(R.csvRow);
    res.set('Content-Type', 'text/csv; charset=utf-8');
    res.set('Content-Disposition', `attachment; filename="naya-shehar-${cls.code}.csv"`);
    res.send('﻿' + R.toCsv([R.CSV_HEAD, ...rows]));
  });

  // ── students ──
  const visibleDevice = (user, deviceId) => {
    const row = db.prepare('SELECT * FROM devices WHERE device_id = ?').get(String(deviceId));
    if (!row) return null;
    const cls = visibleClass(user, row.class_id);
    return cls ? { row, cls } : null;
  };
  app.get('/students/:deviceId', requireUser, (req, res) => {
    const v = visibleDevice(req.user, req.params.deviceId);
    if (!v) return res.status(404).send(V.notFound(req.user, req.csrf));
    const events = db.prepare('SELECT * FROM events WHERE device_id = ? ORDER BY seq').all(v.row.device_id).map((e) => ({ ...e, measured: !!e.measured, payload: JSON.parse(e.payload) }));
    res.send(V.student({ user: req.user, csrf: req.csrf, cls: v.cls, d: R.device(v.row), ev: R.evidence(events) }));
  });
  app.post('/students/:deviceId/archive', requireUser, csrf, (req, res) => {
    const v = visibleDevice(req.user, req.params.deviceId);
    if (!v) return res.status(404).send(V.notFound(req.user, req.csrf));
    db.prepare('UPDATE devices SET archived = 1 - archived WHERE device_id = ?').run(v.row.device_id);
    res.redirect(`/classes/${v.cls.id}`);
  });

  // ── admin: teacher accounts ──
  const userRows = () => db.prepare('SELECT u.*, (SELECT COUNT(*) FROM classes c WHERE c.teacher_id = u.id) AS classes FROM users u ORDER BY u.role, u.display_name').all();
  app.get('/admin/users', requireUser, requireAdmin, (req, res) => res.send(V.users({ user: req.user, csrf: req.csrf, rows: userRows(), msg: req.query.msg ? String(req.query.msg).slice(0, 80) : null })));
  app.post('/admin/users', requireUser, requireAdmin, csrf, (req, res) => {
    const username = String(req.body.username || '').trim();
    const name = String(req.body.display_name || '').trim().slice(0, 60);
    const pw = String(req.body.password || '');
    const role = req.body.role === 'admin' ? 'admin' : 'teacher';
    if (!/^[A-Za-z0-9._-]{2,40}$/.test(username) || !name || pw.length < 8) return res.redirect('/admin/users?msg=' + encodeURIComponent('Check the name, username and an 8+ character password.'));
    if (db.prepare('SELECT 1 FROM users WHERE username = ?').get(username)) return res.redirect('/admin/users?msg=' + encodeURIComponent('That username is taken.'));
    db.prepare('INSERT INTO users (username, display_name, role, pass_hash) VALUES (?, ?, ?, ?)').run(username, name, role, auth.hashPassword(pw));
    res.redirect('/admin/users?msg=' + encodeURIComponent(`Added ${name}.`));
  });
  app.post('/admin/users/:id/password', requireUser, requireAdmin, csrf, (req, res) => {
    const pw = String(req.body.password || '');
    if (pw.length < 8) return res.redirect('/admin/users?msg=' + encodeURIComponent('Passwords need at least 8 characters.'));
    db.prepare('UPDATE users SET pass_hash = ? WHERE id = ?').run(auth.hashPassword(pw), Number(req.params.id));
    db.prepare('DELETE FROM sessions WHERE user_id = ?').run(Number(req.params.id));
    res.redirect('/admin/users?msg=' + encodeURIComponent('Password updated.'));
  });

  app.use((req, res) => res.status(404).send(V.notFound(req.user, req.csrf)));
  app.use((err, _req, res, _next) => { console.error(err); res.status(500).send('Something went wrong.'); });

  return { app, db };
}

module.exports = { createApp };
