'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createApp } = require('../src/app');

let server, base, db;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ns-dash-'));

test.before(async () => {
  const made = createApp({ dbPath: path.join(dir, 't.db'), adminUser: 'admin', adminPassword: 'admin-pass-123', log: () => {} });
  db = made.db;
  await new Promise((r) => { server = made.app.listen(0, r); });
  base = `http://127.0.0.1:${server.address().port}`;
});
test.after(() => server.close());

/** Minimal cookie-keeping browser. */
function browser() {
  let cookie = '';
  const req = async (url, init = {}) => {
    const res = await fetch(base + url, { redirect: 'manual', ...init, headers: { ...(init.headers || {}), cookie } });
    const sc = res.headers.get('set-cookie');
    if (sc) cookie = sc.split(';')[0];
    return res;
  };
  const csrfFrom = (html) => /name="_csrf" value="([^"]+)"/.exec(html)?.[1];
  const form = (obj) => ({ method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(obj).toString() });
  return {
    req, csrfFrom, form,
    async login(u, p) { const r = await req('/login', form({ username: u, password: p })); return r.status; },
    async html(url) { const r = await req(url); return { status: r.status, text: await r.text() }; },
  };
}

const json = (url, body) => fetch(base + url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });

function payload(over = {}) {
  return {
    protocol: 1, appVersion: '1.0.0', deviceId: 'dev-aaaa-1111', classCode: '000000', roll: 7, nickname: 'Noor', avatar: null,
    progress: { weeksCompleted: [0, 1], currentWeek: 2, inSession: false, measuredWeeks: 1, unmeasuredWeeks: [], unmeasuredSessions: [], finished: false, clockAnomalies: 0, buildingsOpen: 3, homes: 15 },
    student: null,
    results: { model: 'interim-bt-map-v1', comparisons: 20, interests: [{ category: 'R', name: 'Builder', relative: 30, theta: 1, se: 0.7, confidence: 'medium' }, { category: 'I', name: 'Investigator', relative: 20, theta: 0.5, se: 0.7, confidence: 'medium' }],
      order: ['R', 'I'], consistency: { repeatedPairs: 0, agreements: 0, rate: null }, abilities: [], recap: [], recommendation: null },
    events: [
      { seq: 1, sessionId: 'S1', measured: true, recordedAt: '2026-11-01T09:00:00Z', event: { type: 'choice_made', itemId: 'FC-W1-01', week: 1, presented: ['C', 'R'], chosen: 'R' } },
      { seq: 2, sessionId: 'S1', measured: true, recordedAt: '2026-11-01T09:01:00Z', event: { type: 'task_result', itemId: 'SPA-05', week: 1, family: 'SPA', level: 2, firstAttemptCorrect: true, solved: true, attempts: 1 } },
    ],
    ...over,
  };
}

let classCode, classId, teacherClassCode;

test('admin logs in, creates a teacher and classes; wrong password rejected', async () => {
  const b = browser();
  assert.equal(await b.login('admin', 'nope'), 401);
  assert.equal(await b.login('admin', 'admin-pass-123'), 302);
  let page = await b.html('/classes');
  assert.equal(page.status, 200);
  // CSRF required
  let r = await b.req('/classes', b.form({ name: 'No token' }));
  assert.equal(r.status, 403);
  r = await b.req('/classes', b.form({ name: 'Class 9-B', school: 'Model School', _csrf: b.csrfFrom(page.text) }));
  assert.equal(r.status, 302);
  classCode = /created=(\d{6})/.exec(r.headers.get('location'))[1];
  classId = db.prepare('SELECT id FROM classes WHERE code = ?').get(classCode).id;
  page = await b.html('/admin/users');
  r = await b.req('/admin/users', b.form({ display_name: 'Ms Amna', username: 'amna', password: 'teacher-pass-1', role: 'teacher', _csrf: b.csrfFrom(page.text) }));
  assert.equal(r.status, 302);
});

test('teacher sees only their own classes', async () => {
  const t = browser();
  assert.equal(await t.login('amna', 'teacher-pass-1'), 302);
  let page = await t.html('/classes');
  assert.doesNotMatch(page.text, /Class 9-B/);
  assert.equal((await t.html(`/classes/${classId}`)).status, 404);
  assert.equal((await t.html('/admin/users')).status, 404);
  const r = await t.req('/classes', t.form({ name: 'Class 10-A', _csrf: t.csrfFrom(page.text) }));
  teacherClassCode = /created=(\d{6})/.exec(r.headers.get('location'))[1];
  page = await t.html('/classes');
  assert.match(page.text, /Class 10-A/);
});

test('class lookup', async () => {
  let r = await json('/api/v1/classes/lookup', { code: classCode });
  assert.equal(r.status, 200);
  assert.equal((await r.json()).name, 'Class 9-B · Model School');
  r = await json('/api/v1/classes/lookup', { code: '999999' === classCode ? '999998' : '999999' });
  assert.equal(r.status, 404);
});

test('sync: validation, unknown class, first upload issues a token', async () => {
  assert.equal((await json('/api/v1/sync', { protocol: 1 })).status, 400);
  assert.equal((await json('/api/v1/sync', payload({ classCode: '12345' }))).status, 400);
  assert.equal((await json('/api/v1/sync', payload({ events: [{ seq: 1, sessionId: 'S', measured: true, recordedAt: 'x', event: { type: 'hack', itemId: 'x', week: 1 } }] }))).status, 400);
  const unknown = classCode === '111111' ? '222222' : '111111';
  assert.equal((await json('/api/v1/sync', payload({ classCode: unknown }))).status, 404);
  const r = await json('/api/v1/sync', payload({ classCode }));
  assert.equal(r.status, 200);
  const b = await r.json();
  assert.equal(b.ackSeq, 2);
  assert.ok(b.token && b.token.length > 20);
  payload.token = b.token;
});

test('sync: token required afterwards; re-sending is idempotent; unmeasured sessions applied', async () => {
  assert.equal((await json('/api/v1/sync', payload({ classCode }))).status, 401);
  assert.equal((await json('/api/v1/sync', payload({ classCode, token: 'wrong' }))).status, 401);
  let r = await json('/api/v1/sync', payload({ classCode, token: payload.token }));
  assert.equal(r.status, 200);
  assert.equal(db.prepare('SELECT COUNT(*) n FROM events WHERE device_id = ?').get('dev-aaaa-1111').n, 2);
  r = await json('/api/v1/sync', payload({ classCode, token: payload.token, events: [], progress: { ...payload().progress, unmeasuredSessions: ['S1'] } }));
  assert.equal((await r.json()).ackSeq, 2);
  assert.equal(db.prepare('SELECT SUM(measured) m FROM events WHERE device_id = ?').get('dev-aaaa-1111').m, 0);
});

test('dashboard shows the student to the right teacher only, with escaping', async () => {
  await json('/api/v1/sync', payload({ classCode: teacherClassCode, deviceId: 'dev-bbbb-2222', roll: 3, nickname: '<b>x</b>' }));
  const a = browser(); await a.login('admin', 'admin-pass-123');
  let page = await a.html(`/classes/${classId}`);
  assert.match(page.text, /Noor/);
  assert.match(page.text, /Students joined/);
  page = await a.html('/students/dev-aaaa-1111');
  assert.equal(page.status, 200);
  assert.match(page.text, /Roll no\. 7/);
  const t = browser(); await t.login('amna', 'teacher-pass-1');
  assert.equal((await t.html('/students/dev-aaaa-1111')).status, 404);
  page = await t.html('/students/dev-bbbb-2222');
  assert.equal(page.status, 200);
  assert.doesNotMatch(page.text, /<b>x<\/b>/);
  assert.match(page.text, /&lt;b&gt;x&lt;\/b&gt;/);
});

test('CSV export has a header and guards against formula injection', async () => {
  await json('/api/v1/sync', payload({ classCode, deviceId: 'dev-cccc-3333', roll: 9, nickname: '=HYPERLINK(1)' }));
  const a = browser(); await a.login('admin', 'admin-pass-123');
  const r = await a.req(`/classes/${classId}/export.csv`);
  assert.equal(r.status, 200);
  const buf = Buffer.from(await r.arrayBuffer());
  assert.deepEqual([...buf.subarray(0, 3)], [0xef, 0xbb, 0xbf]); // UTF-8 BOM so Excel opens it correctly
  const text = buf.subarray(3).toString('utf8');
  assert.match(text, /^roll,nickname,status/);
  assert.match(text, /'=HYPERLINK/);
  assert.equal(text.trim().split('\r\n').length, 3);
});

test('archive hides and restores a student', async () => {
  const a = browser(); await a.login('admin', 'admin-pass-123');
  const page = await a.html('/students/dev-cccc-3333');
  await a.req('/students/dev-cccc-3333/archive', a.form({ _csrf: a.csrfFrom(page.text) }));
  assert.doesNotMatch((await a.html(`/classes/${classId}`)).text, /HYPERLINK/);
  await a.req('/students/dev-cccc-3333/archive', a.form({ _csrf: a.csrfFrom(page.text) }));
  assert.match((await a.html(`/classes/${classId}`)).text, /HYPERLINK/);
});

test('logged-out users are redirected; logout ends the session', async () => {
  const anon = browser();
  const r = await anon.req('/classes');
  assert.equal(r.status, 302);
  assert.match(r.headers.get('location'), /^\/login/);
  const a = browser(); await a.login('admin', 'admin-pass-123');
  const page = await a.html('/classes');
  await a.req('/logout', a.form({ _csrf: a.csrfFrom(page.text) }));
  assert.equal((await a.req('/classes')).status, 302);
});
