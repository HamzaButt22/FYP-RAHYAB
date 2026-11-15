/// <reference types="node" />
// Run with `pnpm test`. The outbox and the sync worker against a fake server that follows RFC-0002.
import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { Envelope } from '../game/run.ts';
import { GIVE_UP_DEFERRED_MS, KEEP_REJECTED_MS, MemoryOutbox } from './outbox.ts';
import { BACKOFF_MAX_MS, MAX_EVENTS, Syncer, backoffMs, type BatchResult, type SendResult } from './sync.ts';

let n = 0;
function event(seq: number, run = 'run-a'): Envelope {
  n++;
  return {
    event_id: `e-${n}`,
    schema_version: '3.0.0',
    session_id: 's',
    run_id: run,
    seq,
    week: 1,
    story_version: 'sample-pick-one@1.0.0',
    content_version: 'dev-2026.11.0',
    event_type: seq === 0 ? 'run_start' : 'choice_made',
    monotonic_ms: seq * 10,
    wall_clock_utc_min: '2026-11-15T10:04Z',
    input_type: 'touch',
    a11y_mode: false,
    practice: false,
  };
}

function setup(answers: ((events: Envelope[]) => SendResult)[]) {
  const store = new MemoryOutbox();
  let clock = 1_000_000;
  const sent: Envelope[][] = [];
  const keys: string[] = [];
  const syncer = new Syncer({
    store,
    send: async (events, key) => {
      sent.push(events);
      keys.push(key);
      const answer = answers.shift() ?? acceptAll;
      return answer(events);
    },
    now: () => clock,
    random: () => 0.5,
    newKey: () => `key-${keys.length}`,
  });
  return { store, syncer, sent, keys, tick: (ms: number) => (clock += ms), now: () => clock };
}

const ok = (data: Partial<BatchResult>): SendResult => ({
  ok: true,
  data: { accepted: [], duplicates: [], deferred: [], rejected: [], ...data },
});
const acceptAll = (events: Envelope[]) => ok({ accepted: events.map((e) => e.event_id) });

test('events are sent oldest first and removed once the server has them', async () => {
  const { store, syncer, sent, now } = setup([]);
  const events = [event(0), event(1), event(2)];
  events.forEach((e, i) => store.add(e, now() + i));
  store.add(events[0], now()); // the same event twice is one event
  const outcome = await syncer.syncNow();
  assert.deepEqual(outcome, { kind: 'done', sent: 3, acked: 3, deferred: 0, rejected: 0 });
  assert.deepEqual(sent[0].map((e) => e.seq), [0, 1, 2]);
  assert.equal(store.rows.size, 0); // acked rows are tidied away
  assert.deepEqual(await syncer.syncNow(), { kind: 'done', sent: 0, acked: 0, deferred: 0, rejected: 0 });
});

test('duplicates count as delivered; rejected events are kept a week and never resent', async () => {
  const a = event(0);
  const b = event(1);
  const c = event(2);
  const { store, syncer, sent, tick, now } = setup([
    () => ok({ duplicates: [a.event_id], accepted: [b.event_id], rejected: [{ id: c.event_id, reason: 'schema' }] }),
  ]);
  [a, b, c].forEach((e) => store.add(e, now()));
  await syncer.syncNow();
  assert.deepEqual(store.counts(), { queued: 0, acked: 0, rejected: 1, expired: 0 });
  await syncer.syncNow();
  assert.equal(sent.length, 1); // nothing left to send
  tick(KEEP_REJECTED_MS + 1);
  await syncer.syncNow();
  assert.equal(store.rows.size, 0);
});

test('deferred events wait and are resent; after 7 days they are given up', async () => {
  const first = event(1, 'run-b');
  const { store, syncer, sent, tick, now } = setup([
    () => ok({ deferred: [{ id: first.event_id, reason: 'unknown_run' }] }),
    () => ok({ deferred: [{ id: first.event_id, reason: 'unknown_run' }] }),
  ]);
  store.add(first, now());
  const outcome = await syncer.syncNow();
  assert.equal(outcome.kind === 'done' && outcome.deferred, 1);
  assert.equal(sent.length, 1); // an all-deferred batch is not repeated in the same sync
  tick(60_000);
  await syncer.syncNow();
  assert.equal(sent.length, 2);
  tick(GIVE_UP_DEFERRED_MS + 1);
  await syncer.syncNow();
  assert.deepEqual(store.counts(), { queued: 0, acked: 0, rejected: 0, expired: 1 });
});

test('failures back off from 30 s to 30 min with jitter; 429 waits as told', async () => {
  assert.equal(backoffMs(1, 0.5), 30_000);
  assert.equal(backoffMs(2, 0.5), 60_000);
  assert.equal(backoffMs(20, 0.5), BACKOFF_MAX_MS);
  assert.equal(backoffMs(1, 0), 24_000);
  assert.equal(backoffMs(1, 1), 36_000);
  const { store, syncer, sent, tick, now } = setup([
    () => ({ ok: false, kind: 'offline' }),
    () => ({ ok: false, kind: 'problem', status: 429, code: 'rate_limited', retryAfterSeconds: 120 }),
  ]);
  store.add(event(0), now());
  const offline = await syncer.syncNow();
  assert.equal(offline.kind, 'failed');
  assert.equal((await syncer.syncNow()).kind, 'waiting'); // no hammering while offline
  tick(30_000);
  const limited = await syncer.syncNow();
  assert.equal(limited.kind === 'failed' && limited.retryAt - now(), 120_000);
  tick(120_000);
  assert.equal((await syncer.syncNow()).kind, 'done');
  assert.equal(sent.length, 3);
  assert.equal(store.counts().queued, 0);
});

test('without consent nothing is sent until consent changes; events stay on the phone', async () => {
  const { store, syncer, sent, now } = setup([
    () => ({ ok: false, kind: 'problem', status: 403, code: 'consent_required', retryAfterSeconds: null }),
  ]);
  store.add(event(0), now());
  assert.equal((await syncer.syncNow()).kind, 'consent_required');
  assert.equal((await syncer.syncNow()).kind, 'consent_required');
  assert.equal(sent.length, 1);
  assert.equal(store.counts().queued, 1);
  syncer.wake();
  assert.equal((await syncer.syncNow()).kind, 'done');
  assert.equal(store.counts().queued, 0);
});

test('a batch the server finds too large is retried in halves; full batches continue', async () => {
  const { store, syncer, sent, now } = setup([
    () => ({ ok: false, kind: 'problem', status: 413, code: 'batch_too_large', retryAfterSeconds: null }),
  ]);
  for (let i = 0; i < MAX_EVENTS + 20; i++) store.add(event(i, 'run-c'), now() + i);
  assert.equal((await syncer.syncNow()).kind, 'failed');
  const done = await syncer.syncNow();
  assert.equal(done.kind === 'done' && done.sent, MAX_EVENTS + 20);
  assert.deepEqual(sent.map((b) => b.length), [500, 250, 270]);
});

test('every batch has its own idempotency key; one sync at a time', async () => {
  const { store, syncer, keys, now } = setup([]);
  store.add(event(0), now());
  const [a, b] = await Promise.all([syncer.syncNow(), syncer.syncNow()]);
  assert.equal(a.kind, 'done');
  assert.equal(b.kind, 'busy');
  store.add(event(1), now());
  await syncer.syncNow();
  assert.equal(new Set(keys).size, keys.length);
});

test('events of a family that never consents are deleted after 14 days', () => {
  const store = new MemoryOutbox();
  store.add(event(0), 1000);
  store.add(event(1), 5000);
  assert.equal(store.dropQueuedBefore(2000), 1);
  assert.equal(store.counts().queued, 1);
});
