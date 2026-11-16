/// <reference types="node" />
// Run with `pnpm test`. The game–app contract (RFC-0005): what a module may send, and the envelope the host
// builds from it, which must pass the server's checks (docs/api/openapi.yaml `Event`, RFC-0002).
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { CONTRACT_VERSION, type GameModule } from './contract.ts';
import { eventProblems, experimentProblems, moduleProblems, registryProblems, savedProblems } from './rules.ts';
import { ContractError, MemorySink, MemoryStore, createRun, utcMinute, uuidv7, type RunOptions } from './run.ts';

const Screen = () => null;
const good: GameModule = {
  id: 'sample-pick-one',
  version: '1.0.0',
  kind: 'scene',
  measures: ['interests'],
  title: 'Sample',
  contract: CONTRACT_VERSION,
  Screen,
};

function setup(overrides: Partial<RunOptions> = {}) {
  const sink = new MemorySink();
  const store = new MemoryStore();
  let now = 1000;
  const clock = { tick: (ms: number) => (now += ms) };
  const run = createRun({
    module: good,
    context: { week: 2, practice: false, a11yMode: false, reducedMotion: false },
    sessionId: '0192f3c8-7a1e-7c3d-9b2a-5f1e2d3c4b5a',
    contentVersion: 'dev-2026.11.0',
    sink,
    store,
    strict: true,
    monotonic: () => now,
    wallClock: () => Date.UTC(2026, 10, 15, 10, 4, 37) + now,
    ...overrides,
  });
  return { run, sink, store, clock };
}

test('a well-made module passes, and each mistake is named', () => {
  assert.deepEqual(moduleProblems(good), []);
  const bad = moduleProblems({ ...good, id: 'Planning Week', version: '1', measures: [], title: ' ' });
  assert.equal(bad.length, 4);
  assert.match(moduleProblems({ ...good, measures: ['aptitude:XYZ' as never] })[0], /not one of/);
  assert.match(moduleProblems({ ...good, measures: ['none', 'values'] })[0], /goes alone/);
  assert.match(moduleProblems({ ...good, contract: '1.1.0' })[0], /app speaks/);
  assert.deepEqual(moduleProblems({ ...good, contract: '2.1.0' }), []); // minor versions stay compatible
  assert.match(registryProblems([good, good]).join(), /two modules have this id/);
});

test('events: agreed types only, no free text, small', () => {
  assert.deepEqual(eventProblems({ type: 'choice_made', itemId: 'w2_robotics_m1', data: { picked: 'R' } }), []);
  assert.match(eventProblems({ type: 'mood_swipe' as never })[0], /host\.experiment\(\)/);
  assert.match(eventProblems({ type: 'quit' })[0], /sent by the app itself/);
  assert.match(eventProblems({ type: 'reaction', itemId: 'has space' })[0], /itemId/);
  assert.match(eventProblems({ type: 'reaction', data: { note: 'x'.repeat(65) } })[0], /no free text/);
  assert.match(eventProblems({ type: 'reaction', data: { t: Number.NaN } })[0], /finite/);
  assert.match(eventProblems({ type: 'reaction', data: { d: new Date() as never } })[0], /plain objects/);
  const big = Object.fromEntries(Array.from({ length: 40 }, (_, i) => [`k${i}`, 'v'.repeat(30)]));
  assert.match(eventProblems({ type: 'reaction', data: big })[0], /over 900/);
  assert.deepEqual(experimentProblems({ name: 'changed_mind', data: { count: 2 } }), []);
  assert.match(experimentProblems({ name: 'Changed Mind' })[0], /name/);
  assert.match(savedProblems('x'.repeat(17000))[0], /over 16384/);
});

test('the host builds envelope v3 events: ids, order and time are its job', () => {
  const { run, sink, clock } = setup();
  run.start();
  clock.tick(1500.26);
  run.host.emit({ type: 'scene_start', itemId: 's1' });
  clock.tick(10);
  run.host.emit({ type: 'choice_made', itemId: 's1', data: { pair: 'R-S', picked: 'R' } });
  run.host.finish({ completed: true });
  const [first, scene, choice] = sink.events;
  assert.deepEqual(
    sink.events.map((e) => [e.seq, e.event_type]),
    [
      [0, 'run_start'],
      [1, 'scene_start'],
      [2, 'choice_made'],
    ]
  );
  assert.deepEqual(first.data, { module: 'sample-pick-one', contract: CONTRACT_VERSION });
  assert.equal(scene.monotonic_ms, 1500.3); // one decimal, from the run's start
  assert.ok(choice.monotonic_ms > scene.monotonic_ms);
  for (const e of sink.events) {
    assert.equal(e.schema_version, '3.0.0');
    assert.equal(e.run_id, run.runId);
    assert.equal(e.week, 2);
    assert.equal(e.story_version, 'sample-pick-one@1.0.0');
    assert.equal(e.content_version, 'dev-2026.11.0');
    assert.match(e.event_id, /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    assert.match(e.wall_clock_utc_min, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}Z$/);
    assert.ok(new TextEncoder().encode(JSON.stringify(e)).length <= 1024);
  }
  assert.equal(new Set(sink.events.map((e) => e.event_id)).size, 3);
});

test('time never goes back, even if the clock does', () => {
  let now = 5000;
  const { run, sink } = setup({ monotonic: () => now });
  run.start();
  now = 4000; // a clock that jumped back
  run.host.emit({ type: 'reaction', data: { value: 1 } });
  assert.ok(sink.events[1].monotonic_ms >= sink.events[0].monotonic_ms);
});

test('leaving early sends quit once; nothing is accepted after the end', () => {
  const ended: boolean[] = [];
  const left = setup({ onFinish: (r) => ended.push(r.completed) });
  left.run.start();
  left.run.abandon();
  left.run.abandon();
  assert.deepEqual(ended, [false]); // whoever started the run hears about it once
  assert.deepEqual(
    left.sink.events.map((e) => e.event_type),
    ['run_start', 'quit']
  );
  const done = setup();
  done.run.start();
  done.run.host.finish({ completed: false });
  assert.equal(done.sink.events.at(-1)?.event_type, 'quit');
  assert.throws(() => done.run.host.emit({ type: 'reaction' }), /after host\.finish\(\)/);
  const early = setup(); // a module's effect can run before GameScreen's: the first call starts the run
  early.run.host.emit({ type: 'reaction' });
  early.run.start();
  assert.deepEqual(
    early.sink.events.map((e) => e.event_type),
    ['run_start', 'reaction']
  );
});

test('development builds throw; release builds drop and count instead of crashing', () => {
  const dev = setup();
  dev.run.start();
  assert.throws(() => dev.run.host.emit({ type: 'mood_swipe' as never }), ContractError);
  const release = setup({ strict: false });
  release.run.start();
  release.run.host.emit({ type: 'mood_swipe' as never });
  release.run.host.emit({ type: 'reaction', data: { value: 2 } });
  assert.equal(release.sink.events.length, 2); // run_start and the good event only
  assert.equal(release.run.log.dropped.length, 1);
});

test('experiments stay on the phone and saved progress comes back next run', () => {
  const { run, sink, store } = setup();
  run.start();
  run.host.experiment({ name: 'changed_mind', data: { count: 1 } });
  run.host.save({ seen: true });
  assert.equal(sink.events.length, 1); // experiments never reach the outbox
  assert.deepEqual(run.log.experiments.map((x) => x.name), ['changed_mind']);
  const again = createRun({
    module: good,
    context: { week: 0, practice: true, a11yMode: true, reducedMotion: true },
    sessionId: 's',
    contentVersion: 'dev-2026.11.0',
    sink,
    store,
    strict: true,
    monotonic: () => 0,
    wallClock: () => 0,
  });
  assert.deepEqual(again.saved, { seen: true });
  again.start();
  const e = sink.events.at(-1);
  assert.equal(e?.practice, true);
  assert.equal(e?.a11y_mode, true);
});

test('uuidv7 sorts by time; the wall clock is cut to the minute', () => {
  const zero = () => new Uint8Array(16);
  assert.ok(uuidv7(1000, zero) < uuidv7(2000, zero));
  assert.equal(uuidv7(0x0192f3c87a1e, zero).slice(0, 13), '0192f3c8-7a1e');
  assert.equal(utcMinute(Date.UTC(2026, 10, 15, 10, 4, 59, 999)), '2026-11-15T10:04Z');
});
