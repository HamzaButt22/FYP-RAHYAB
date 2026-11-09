/**
 * Session lifecycle on the device: persistence, crash/restart restore (journal replay), exactly-once upload with
 * retries and lost responses, completion, abandonment and integrity checks.
 *
 * Gameplay inputs are taken from real desktop traces (touchMode=false keeps desktop dialog semantics) so every test
 * runs a genuine assessment, not a stub.
 */
import { decodeInput, InputState } from '../../game-engine/input';
import { ApiClient } from '../../services/apiClient';
import { AssessmentSession, ENGINE_ID, FIXED_DT } from '../../services/assessmentSession';
import { ACTIVE_KEY, MemoryStorage, sessionKey } from '../../services/storage';
import { loadTrace } from '../parity/parity-helpers';
import { FakeServer } from './fakeServer';

function inputsOf(file: string): InputState[] {
  const t = loadTrace(file);
  const out: InputState[] = [];
  for (const f of t.frames) for (let i = 0; i < f[0]; i++) out.push(decodeInput(f[1]));
  return out;
}

const L3 = 'monkey_L3_1.json'; // finishes (single level), real random input
const L2 = 'monkey_L2_1.json';

function setup(file = L3) {
  const trace = loadTrace(file);
  const storage = new MemoryStorage();
  const server = new FakeServer();
  const api = new ApiClient({ baseUrl: 'https://fake.local', fetchImpl: server.fetch, timeoutMs: 1000 });
  let clock = 1_000_000;
  const now = () => clock;
  const advance = (ms: number) => {
    clock += ms;
  };
  const opts = {
    storage,
    api,
    plan: trace.plan,
    playerName: trace.player_name,
    seed: trace.seed,
    now,
    touchMode: false,
    dt: trace.dt,
  };
  return { trace, storage, server, api, opts, now, advance, inputs: inputsOf(file) };
}

async function playAll(s: AssessmentSession, inputs: InputState[], from = 0, to = inputs.length) {
  for (let i = from; i < to; i++) s.step(inputs[i]);
}

describe('AssessmentSession', () => {
  it('runs a whole assessment, uploads every event exactly once and returns the backend report', async () => {
    const { opts, server, inputs } = setup();
    const s = await AssessmentSession.start(opts);
    await playAll(s, inputs);
    expect(s.runner.state).toBe('finished');
    const res = await s.finish();
    expect(res.kind).toBe('completed');
    const sid = s.record.server.sessionId as string;
    const uploaded = server.events.get(sid) as Record<string, unknown>[];
    expect(uploaded.length).toBe(s.events.length);
    expect(uploaded.map((e) => `${e.t_ms}|${e.event_type}|${e.action}`)).toEqual(s.events.map((e) => `${e.t_ms}|${e.event_type}|${e.action}`));
    expect(uploaded[0]).not.toHaveProperty('seq');
    expect(server.sessions.get(sid)?.game_version).toBe('0.2.0-mobile');
    expect(server.sessions.get(sid)?.seed).toBe(opts.seed);
    expect(s.record.status).toBe('completed');
    expect(s.record.report?.session_id).toBe(sid);
  });

  it('produces the same telemetry as the desktop trace (session layer adds nothing)', async () => {
    const { opts, inputs, trace } = setup();
    const s = await AssessmentSession.start(opts);
    await playAll(s, inputs);
    expect(s.events.map((e) => `${e.t_ms}|${e.event_type}|${e.action}`)).toEqual(trace.events.map((e) => `${e.t_ms}|${e.event_type}|${e.action}`));
  });

  it('restores an interrupted session exactly (app killed at several points)', async () => {
    const { opts, inputs, storage } = setup(L2);
    const reference = await AssessmentSession.start({ ...opts, storage: new MemoryStorage() });
    await playAll(reference, inputs);

    let s = await AssessmentSession.start(opts);
    const cuts = [1, 97, 400, 1200, inputs.length - 3];
    let pos = 0;
    for (const cut of cuts) {
      await playAll(s, inputs, pos, cut);
      pos = cut;
      await s.persist();
      // process dies: drop the object, start again from storage
      const restored = await AssessmentSession.loadActive({ storage, api: null, now: opts.now, touchMode: false });
      expect(restored.kind).toBe('restored');
      s = (restored as { kind: 'restored'; session: AssessmentSession }).session;
      expect(s.runner.frame).toBe(cut);
    }
    await playAll(s, inputs, pos);
    expect(s.events.map((e) => JSON.stringify(e.metadata) + e.t_ms)).toEqual(reference.events.map((e) => JSON.stringify(e.metadata) + e.t_ms));
    expect(s.runner.state).toBe(reference.runner.state);
  });

  it('never uploads telemetry that a restart could not reproduce', async () => {
    const { opts, inputs, server, storage } = setup(L2);
    const s = await AssessmentSession.start(opts);
    await playAll(s, inputs, 0, 300);
    await s.persist();
    const persistedCount = s.events.length;
    await playAll(s, inputs, 300, 900); // newer frames exist only in memory
    storage.failWrites = 1000; // ... and the device cannot write right now
    const res = await s.sync();
    expect(res.status).toBe('error');
    const sid = s.record.server.sessionId;
    expect(sid === null ? 0 : (server.events.get(sid) ?? []).length).toBeLessThanOrEqual(persistedCount);
    storage.failWrites = 0;
    await s.sync(); // sync persists a snapshot before each batch, so whatever it uploads is durable
    const uploaded = (server.events.get(s.record.server.sessionId as string) ?? []) as Record<string, unknown>[];
    // crash now: the restored session must reproduce every uploaded event, in order
    const r = await AssessmentSession.loadActive({ storage, api: null, now: opts.now, touchMode: false });
    expect(r.kind).toBe('restored');
    const restored = (r as { kind: 'restored'; session: AssessmentSession }).session;
    expect(restored.events.length).toBeGreaterThanOrEqual(uploaded.length);
    expect(restored.events.slice(0, uploaded.length).map((e) => `${e.t_ms}|${e.event_type}|${e.action}`)).toEqual(
      uploaded.map((e) => `${e.t_ms}|${e.event_type}|${e.action}`),
    );
    expect(restored.record.ackedSeq).toBeLessThanOrEqual(restored.events.length);
  });

  it('survives dropped requests, lost responses and server errors without duplicates', async () => {
    const { opts, inputs, server } = setup(L2);
    server.failNext(/POST \/api\/players/, 'network-after'); // player created, response lost
    server.failNext(/POST \/api\/sessions$/, 'network-after'); // session created, response lost
    server.failNext(/\/events$/, 'network-after', 2); // batch stored, response lost (twice)
    server.failNext(/\/events$/, 'http500');
    server.failNext(/\/events$/, 'network-before');
    server.failNext(/\/events$/, 'http429');
    const s = await AssessmentSession.start({ ...opts, batchSize: 40 });
    for (let i = 0; i < inputs.length; i++) {
      s.step(inputs[i]);
      if (i % 150 === 0) {
        await s.persist();
        await s.sync();
      }
    }
    await s.persist();
    for (let k = 0; k < 10 && s.pendingUploads() > 0; k++) await s.sync();
    expect(server.players.length).toBe(1);
    expect(server.sessions.size).toBe(1);
    const sid = s.record.server.sessionId as string;
    const got = (server.events.get(sid) as Record<string, unknown>[]).map((e) => `${e.t_ms}|${e.event_type}|${e.action}`);
    expect(got).toEqual(s.events.map((e) => `${e.t_ms}|${e.event_type}|${e.action}`));
  });

  it('resends an in-flight batch with the same key after a restart', async () => {
    const { opts, inputs, server, storage } = setup(L2);
    const s = await AssessmentSession.start({ ...opts, batchSize: 50 });
    await playAll(s, inputs, 0, 800);
    await s.persist();
    server.failNext(/\/events$/, 'network-after'); // server applied the batch, the phone never heard back
    await s.sync();
    expect(s.record.inflight).not.toBeNull();
    const r = await AssessmentSession.loadActive({ storage, api: new ApiClient({ baseUrl: 'https://fake.local', fetchImpl: server.fetch }), now: opts.now, touchMode: false });
    const s2 = (r as { kind: 'restored'; session: AssessmentSession }).session;
    await s2.sync();
    const sid = s2.record.server.sessionId as string;
    expect((server.events.get(sid) as unknown[]).length).toBe(s2.events.length);
    expect(s2.pendingUploads()).toBe(0);
  });

  it('works fully offline and uploads everything once the server is reachable', async () => {
    const { opts, inputs, server } = setup();
    server.online = false;
    const s = await AssessmentSession.start(opts);
    await playAll(s, inputs);
    const offline = await s.finish();
    expect(offline.kind).toBe('pending');
    expect(s.record.status).toBe('finished');
    server.online = true;
    const done = await s.finish();
    expect(done.kind).toBe('completed');
    expect(server.completeCalls).toBe(1);
  });

  it('re-creates the server session and re-uploads if the server lost it (404)', async () => {
    const { opts, inputs, server } = setup(L2);
    const s = await AssessmentSession.start(opts);
    await playAll(s, inputs, 0, 600);
    await s.persist();
    await s.sync();
    const first = s.record.server.sessionId;
    server.wipe();
    await playAll(s, inputs, 600);
    await s.persist();
    await s.sync();
    await s.sync();
    const sid = s.record.server.sessionId as string;
    expect(sid).not.toBe(first);
    expect((server.events.get(sid) as unknown[]).length).toBe(s.events.length);
  });

  it('completes only once even if finish() is called concurrently', async () => {
    const { opts, inputs, server } = setup();
    const s = await AssessmentSession.start(opts);
    await playAll(s, inputs);
    const [a, b, c] = await Promise.all([s.finish(), s.finish(), s.finish()]);
    expect([a.kind, b.kind, c.kind]).toEqual(['completed', 'completed', 'completed']);
    expect(server.completeCalls).toBe(1);
  });

  it('refuses to complete before every planned level is finished', async () => {
    const { opts, inputs } = setup();
    const s = await AssessmentSession.start(opts);
    await playAll(s, inputs, 0, 50);
    await expect(s.finish()).rejects.toThrow(/not finished/);
  });

  it('abandons: SESSION_END(abandoned) is uploaded, the server is told, local data is removed', async () => {
    const { opts, inputs, server, storage } = setup(L2);
    const s = await AssessmentSession.start(opts);
    await playAll(s, inputs, 0, 500);
    await s.abandon();
    const sid = s.record.server.sessionId as string;
    const evs = server.events.get(sid) as Record<string, unknown>[];
    expect(evs[evs.length - 1]).toMatchObject({ event_type: 'SESSION_END', action: 'abandoned' });
    expect(server.sessions.get(sid)?.status).toBe('abandoned');
    expect(await storage.getItem(ACTIVE_KEY)).toBeNull();
    expect(await storage.getItem(sessionKey(s.record.localId))).toBeNull();
  });

  it('only allows one active session per device', async () => {
    const { opts } = setup();
    await AssessmentSession.start(opts);
    await expect(AssessmentSession.start(opts)).rejects.toThrow(/already/);
  });

  it('flags a saved session from another engine build instead of replaying it wrongly', async () => {
    const { opts, inputs, storage } = setup();
    const s = await AssessmentSession.start(opts);
    await playAll(s, inputs, 0, 100);
    await s.persist();
    const raw = JSON.parse((await storage.getItem(sessionKey(s.record.localId))) as string);
    raw.engine = 'some-older-build';
    await storage.setItem(sessionKey(s.record.localId), JSON.stringify(raw));
    const r = await AssessmentSession.loadActive({ storage, api: null, now: opts.now, touchMode: false });
    expect(r.kind).toBe('incompatible');
    expect(ENGINE_ID).toContain('0.2.0');
  });

  it('detects a tampered or corrupted journal (replay does not reproduce the saved digest)', async () => {
    const { opts, inputs, storage } = setup(L2);
    const s = await AssessmentSession.start(opts);
    await playAll(s, inputs, 0, 700);
    await s.persist();
    const raw = JSON.parse((await storage.getItem(sessionKey(s.record.localId))) as string);
    raw.frames = raw.frames.slice(0, Math.floor(raw.frames.length / 2));
    await storage.setItem(sessionKey(s.record.localId), JSON.stringify(raw));
    const r = await AssessmentSession.loadActive({ storage, api: null, now: opts.now, touchMode: false });
    expect(r.kind).toBe('corrupt');
  });

  it('keeps playing when a storage write fails, and reports it', async () => {
    const { opts, inputs, storage } = setup();
    const s = await AssessmentSession.start(opts);
    storage.failWrites = 1;
    await playAll(s, inputs, 0, 200);
    await expect(s.persist()).rejects.toThrow(/storage/);
    expect(s.lastPersistError).toBeTruthy();
    await playAll(s, inputs, 200, 400);
    await s.persist();
    expect(s.lastPersistError).toBeNull();
  });

  it('uses a fixed engine time step', () => {
    expect(FIXED_DT).toBeCloseTo(1 / 60);
  });
});
