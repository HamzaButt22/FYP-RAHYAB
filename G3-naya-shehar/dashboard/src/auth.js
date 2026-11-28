'use strict';
const crypto = require('node:crypto');

const SESSION_HOURS = 12;

function hashPassword(pw) {
  const salt = crypto.randomBytes(16);
  const key = crypto.scryptSync(pw, salt, 64, { N: 16384, r: 8, p: 1 });
  return `scrypt$${salt.toString('base64')}$${key.toString('base64')}`;
}

function verifyPassword(pw, stored) {
  const [alg, s, k] = String(stored).split('$');
  if (alg !== 'scrypt' || !s || !k) return false;
  const key = crypto.scryptSync(pw, Buffer.from(s, 'base64'), 64, { N: 16384, r: 8, p: 1 });
  const want = Buffer.from(k, 'base64');
  return want.length === key.length && crypto.timingSafeEqual(key, want);
}

const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');
const token = (n = 32) => crypto.randomBytes(n).toString('base64url');

function parseCookies(header) {
  const out = {};
  for (const part of String(header || '').split(';')) {
    const i = part.indexOf('=');
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

function createSession(db, userId) {
  const id = token();
  const csrf = token(24);
  db.prepare('INSERT INTO sessions (id, user_id, csrf, expires_at) VALUES (?, ?, ?, ?)').run(sha256(id), userId, csrf, Date.now() + SESSION_HOURS * 3600e3);
  return id;
}

/** Express middleware: attaches req.user and req.csrf when a valid session cookie is present. */
function sessionMiddleware(db) {
  return (req, _res, next) => {
    const sid = parseCookies(req.headers.cookie).ns_sid;
    if (sid) {
      const row = db.prepare(`SELECT s.csrf, s.expires_at, u.id, u.username, u.display_name, u.role
                              FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.id = ?`).get(sha256(sid));
      if (row && row.expires_at > Date.now()) {
        req.user = { id: row.id, username: row.username, name: row.display_name, role: row.role };
        req.csrf = row.csrf;
        req.sid = sid;
      }
    }
    next();
  };
}

function destroySession(db, sid) {
  if (sid) db.prepare('DELETE FROM sessions WHERE id = ?').run(sha256(sid));
}

/** Very small in-memory limiter for the login form. */
function loginLimiter(max = 8, windowMs = 60_000) {
  const hits = new Map();
  return (req, res, next) => {
    const key = req.ip;
    const now = Date.now();
    const h = (hits.get(key) || []).filter((t) => now - t < windowMs);
    if (h.length >= max) return res.status(429).send('Too many login attempts. Please wait a minute.');
    h.push(now); hits.set(key, h);
    next();
  };
}

module.exports = { hashPassword, verifyPassword, sha256, token, createSession, sessionMiddleware, destroySession, loginLimiter, SESSION_HOURS };
