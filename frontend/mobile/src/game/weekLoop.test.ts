/// <reference types="node" />
// Run with `pnpm test`. The week loop (FR-13-15, FR-52), the sample plan, and week_complete (contract 1.1.0, now 2.0.0).
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

import { CONTRACT_VERSION, type GameModule } from './contract.ts';
import { eventProblems } from './rules.ts';
import { MemorySink, MemoryStore, createRun } from './run.ts';
import { SAMPLE_PLAN } from './samplePlan.ts';
import {
  advance,
  currentStep,
  fitProgress,
  minutesLeftThisWeek,
  planProblems,
  resultsUnlocked,
  scoredWeeksDone,
  startProgress,
  type Progress,
  type WeekPlan,
} from './weekLoop.ts';

const PLAN: WeekPlan = {
  id: 'p1',
  minutesPerStep: 2,
  weeks: [
    { week: 0, practice: true, steps: [{ id: 'p', module: 'm' }] },
    ...[1, 2, 3, 4].map((w) => ({
      week: w,
      practice: false,
      steps: [{ id: `w${w}a`, module: 'm' }, { id: `w${w}b`, module: 'm' }],
    })),
  ],
};

function playAll(plan: WeekPlan): { progress: Progress; weeksDone: number[] } {
  let p = startProgress(plan);
  const weeksDone: number[] = [];
  for (let guard = 0; guard < 100 && currentStep(plan, p); guard++) {
    const r = advance(plan, p);
    if (r.weekDone) weeksDone.push(r.weekDone.week);
    p = r.progress;
  }
  return { progress: p, weeksDone };
}

test('the loop walks every step in order and finishes each week once', () => {
  let p = startProgress(PLAN);
  assert.deepEqual(currentStep(PLAN, p)?.step.id, 'p');
  assert.equal(currentStep(PLAN, p)?.isLast, true);
  p = advance(PLAN, p).progress;
  assert.deepEqual(currentStep(PLAN, p)?.step.id, 'w1a');
  assert.equal(minutesLeftThisWeek(PLAN, p), 4);
  const { progress, weeksDone } = playAll(PLAN);
  assert.deepEqual(weeksDone, [0, 1, 2, 3, 4]);
  assert.equal(currentStep(PLAN, progress), null);
  assert.equal(advance(PLAN, progress).allDone, true);
});

test('results open only after four scored weeks; the practice prologue does not count', () => {
  let p = startProgress(PLAN);
  for (let i = 0; i < 1 + 2 * 3; i++) p = advance(PLAN, p).progress; // prologue + weeks 1-3
  assert.equal(scoredWeeksDone(PLAN, p), 3);
  assert.equal(resultsUnlocked(PLAN, p), false);
  p = advance(PLAN, advance(PLAN, p).progress).progress;
  assert.equal(resultsUnlocked(PLAN, p), true);
});

test('saved progress resumes at the same step, and survives a changed plan', () => {
  const saved: Progress = { planId: 'old', weekIndex: 2, stepIndex: 1, completedWeeks: [1, 0, 1] };
  const p = fitProgress(PLAN, JSON.parse(JSON.stringify(saved)) as Progress);
  assert.equal(currentStep(PLAN, p)?.step.id, 'w2b');
  assert.deepEqual(p.completedWeeks, [0, 1]);
  const clamped = fitProgress(PLAN, { planId: 'old', weekIndex: 9, stepIndex: 9, completedWeeks: [] });
  assert.equal(currentStep(PLAN, clamped), null);
  assert.deepEqual(fitProgress(PLAN, null), startProgress(PLAN));
});

test('plan mistakes are named', () => {
  assert.deepEqual(planProblems(PLAN, new Set(['m'])), []);
  const bad: WeekPlan = {
    id: 'b', minutesPerStep: 1,
    weeks: [
      { week: 2, practice: false, steps: [{ id: 'x', module: 'missing' }] },
      { week: 1, practice: false, steps: [{ id: 'x', module: 'm' }] },
      { week: 5, practice: false, steps: [] },
    ],
  };
  const problems = planProblems(bad, new Set(['m'])).join(' | ');
  for (const words of ['not in the registry', 'increasing order', 'used twice', 'weeks are 0-4', 'no steps']) {
    assert.match(problems, new RegExp(words));
  }
});

test('the sample plan follows the pairs.json target schedule exactly', () => {
  const url = new URL('../../../../design/game/frameworks/pairs.json', import.meta.url);
  const schedule = JSON.parse(readFileSync(url, 'utf8')).target_schedule as {
    week: number; slot: number; left: string; right: string;
  }[];
  const scored = SAMPLE_PLAN.weeks.filter((w) => !w.practice).flatMap((w) =>
    w.steps.map((s) => ({ week: w.week, id: s.id, left: s.params?.left, right: s.params?.right })),
  );
  assert.deepEqual(
    scored,
    schedule.map((s) => ({ week: s.week, id: `w${s.week}s${s.slot}`, left: s.left, right: s.right })),
  );
  assert.deepEqual(planProblems(SAMPLE_PLAN, new Set(['sample-pick-one'])), []);
  assert.equal(SAMPLE_PLAN.weeks[0].practice, true);
});

const module: GameModule = {
  id: 'm', version: '1.0.0', kind: 'scene', measures: ['interests'], title: 'M',
  contract: CONTRACT_VERSION, Screen: () => null,
};

function newRun(sink: MemorySink, store = new MemoryStore(), saveKey?: string) {
  return createRun({
    module,
    context: { week: 2, practice: false, a11yMode: false, reducedMotion: false },
    sessionId: 's', contentVersion: 'dev', sink, store, saveKey, strict: true,
    monotonic: () => 0, wallClock: () => Date.UTC(2026, 10, 15),
  });
}

test('week_complete is the host\'s: once, only after a completed run; modules cannot send it', () => {
  const sink = new MemorySink();
  const left = newRun(sink);
  left.start();
  left.abandon();
  left.recordWeekComplete();
  assert.equal(sink.events.some((e) => e.event_type === 'week_complete'), false);
  const done = newRun(sink);
  done.host.finish({ completed: true });
  done.recordWeekComplete();
  done.recordWeekComplete();
  const weekEvents = sink.events.filter((e) => e.event_type === 'week_complete');
  assert.equal(weekEvents.length, 1);
  assert.deepEqual(weekEvents[0].data, { week: 2 });
  assert.match(eventProblems({ type: 'week_complete' })[0], /sent by the app itself/);
});

test('each step keeps its own saved progress', () => {
  const store = new MemoryStore();
  const a = newRun(new MemorySink(), store, 'w1s1');
  a.host.save({ seen: 1 });
  assert.deepEqual(newRun(new MemorySink(), store, 'w1s1').saved, { seen: 1 });
  assert.equal(newRun(new MemorySink(), store, 'w1s2').saved, null);
});
