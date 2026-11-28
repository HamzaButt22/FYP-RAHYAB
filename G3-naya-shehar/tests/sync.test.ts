/**
 * @jest-environment node
 *
 * End-to-end: the real game engine + real sync client uploading to the real
 * dashboard server (started as a child process with its own temp database).
 */
import { spawn, ChildProcess } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { GameEngine } from '@/game/engine/GameEngine';
import { MemoryStore } from '@/database/store';
import { syncNow, lookupClass, buildPayload } from '@/services/sync';
import { DEFAULT_AVATAR } from '@/game/avatar';
import { Week } from '@/assessment/types';
import { DAY, FakeClock, playWeek, prefFromOrder } from './helpers';

// jest-expo replaces global fetch with a mock; use a real HTTP client for these network tests.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const realFetch = require('node-fetch') as typeof fetch;
(globalThis as { fetch: typeof fetch }).fetch = realFetch;

const PORT = 18000 + Math.floor(Math.random() * 1000);
const BASE = `http://127.0.0.1:${PORT}`;
let proc: ChildProcess;
let cookie = '';

async function waitUp() {
  for (let i = 0; i < 100; i++) {
    try { if ((await fetch(`${BASE}/api/v1/health`)).ok) return; } catch { /* starting */ }
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error('server did not start');
}
async function web(url: string, form?: Record<string, string>) {
  const res = await fetch(BASE + url, form
    ? { method: 'POST', redirect: 'manual', headers: { cookie, 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(form).toString() }
    : { redirect: 'manual', headers: { cookie } });
  const sc = res.headers.get('set-cookie'); if (sc) cookie = sc.split(';')[0];
  return res;
}
async function createClass(name: string) {
  const page = await (await web('/classes')).text();
  const csrf = /name="_csrf" value="([^"]+)"/.exec(page)![1];
  const r = await web('/classes', { name, _csrf: csrf });
  return /created=(\d{6})/.exec(r.headers.get('location')!)![1];
}

beforeAll(async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ns-sync-'));
  proc = spawn(process.execPath, [path.join(__dirname, '..', 'dashboard', 'src', 'server.js')], {
    env: { ...process.env, PORT: String(PORT), DATA_DIR: dir, ADMIN_USER: 'admin', ADMIN_PASSWORD: 'admin-pass-123' }, stdio: 'ignore',
  });
  await waitUp();
  await web('/login', { username: 'admin', password: 'admin-pass-123' });
}, 20000);
afterAll(() => { proc?.kill(); });

const deps = (online = true) => ({ apiUrl: BASE, isOnline: async () => online });

function newPlayer(clock = new FakeClock()) {
  const engine = new GameEngine(new MemoryStore(), clock.now);
  engine.setAvatar({ ...DEFAULT_AVATAR, nickname: 'Noor' });
  return { engine, clock };
}

describe('sync client ↔ dashboard server', () => {
  test('not linked / not configured / offline are handled without touching the server', async () => {
    const { engine } = newPlayer();
    expect((await syncNow(engine, deps())).ok).toBe(false);
    engine.setLink('123456', 4);
    expect(await syncNow(engine, { apiUrl: '' })).toMatchObject({ ok: false, reason: 'not_configured' });
    expect(await syncNow(engine, deps(false))).toMatchObject({ ok: false, reason: 'offline' });
  });

  test('unknown class code is reported to the player', async () => {
    const { engine } = newPlayer();
    expect(await lookupClass('000001', deps())).toEqual({ found: false });
    engine.setLink('000001', 4);
    const r = await syncNow(engine, deps());
    expect(r).toMatchObject({ ok: false, reason: 'class_not_found' });
    expect(engine.state.sync.lastError).toBe('Class code not found.');
  });

  test('a full game uploads week by week; dashboard shows the finished report', async () => {
    const code = await createClass('Sync Test Class');
    expect(await lookupClass(code, deps())).toEqual({ found: true, name: 'Sync Test Class' });
    const { engine, clock } = newPlayer();
    engine.setLink(code, 12);
    const persona = { pref: prefFromOrder(['I', 'R', 'C', 'E', 'S', 'A']), solve: (p: { level: number }) => p.level <= 3, react: true };
    playWeek(engine, 0, persona);
    let r = await syncNow(engine, deps());
    expect(r.ok).toBe(true);
    expect(engine.state.sync.token).toBeTruthy();
    expect(engine.state.link?.className).toBe('Sync Test Class');
    for (const w of [1, 2, 3, 4] as Week[]) {
      if (w > 1) clock.advance(8 * DAY);
      playWeek(engine, w, persona);
      // Week 3 is played offline: its events must arrive with week 4's upload.
      r = await syncNow(engine, deps(w !== 3));
      expect(r.ok).toBe(w !== 3);
    }
    engine.setStudent({ classLevel: 10, matricGroup: 'science_computer' });
    r = await syncNow(engine, deps());
    expect(r.ok).toBe(true);
    // Nothing left to send.
    expect(buildPayload(engine)!.events).toHaveLength(0);
    expect(engine.state.sync.ackSeq).toBe(Math.max(...engine.events().map((e) => e.seq)));

    const classes = await (await web('/classes')).text();
    const classId = new RegExp(`/classes/(\\d+)"><b>Sync Test Class`).exec(classes)![1];
    const csv = await (await web(`/classes/${classId}/export.csv`)).text();
    const row = csv.split('\r\n')[1].split(',');
    expect(row[0]).toBe('12');
    expect(row[2]).toBe('Results ready');
    expect(row[3]).toBe('4');
    expect(row[5]).toBe('Investigator');
    const report = await (await web(`/students/${engine.state.deviceId}`)).text();
    expect(report).toContain('Results ready');
    expect(report).toContain('Roll no. 12');
    expect(report).toMatch(/FSc Pre-Engineering|ICS/);
    // All 30 choices, 4 plans and 48 puzzles arrived exactly once.
    expect(report).toMatch(/(\d+) records received/);
    const received = Number(/(\d+) records received/.exec(report)![1]);
    expect(received).toBe(engine.events().length);
  });

  test('a second phone cannot overwrite another phone’s results', async () => {
    const code = await createClass('Token Class');
    const a = newPlayer(); a.engine.setLink(code, 1);
    expect((await syncNow(a.engine, deps())).ok).toBe(true);
    const thief = newPlayer(); thief.engine.setLink(code, 1);
    const p = buildPayload(thief.engine)!;
    const res = await fetch(`${BASE}/api/v1/sync`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...p, deviceId: a.engine.state.deviceId }) });
    expect(res.status).toBe(401);
  });

  test('switching to accessible mode mid-week is reflected on the server', async () => {
    const code = await createClass('Access Class');
    const { engine } = newPlayer();
    engine.setLink(code, 5);
    playWeek(engine, 0, { pref: prefFromOrder(['A', 'S', 'E', 'I', 'C', 'R']), solve: () => true });
    engine.startOrResume(1); engine.advance(); engine.advance();
    engine.commitPlan(['A', 'S', 'E']);
    await syncNow(engine, deps());
    engine.updateSettings({ accessibleMode: true });
    await syncNow(engine, deps());
    const report = await (await web(`/students/${engine.state.deviceId}`)).text();
    expect(report).toMatch(/1 records received \(0 measured\)/);
  });
});
