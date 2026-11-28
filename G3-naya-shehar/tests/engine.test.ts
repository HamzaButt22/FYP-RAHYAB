import { GameEngine } from '@/game/engine/GameEngine';
import { MemoryStore } from '@/database/store';
import { validateEvent } from '@/assessment/events';
import { DAY, FakeClock, newGame, playWeek, prefFromOrder } from './helpers';
import { SEASON_PROJECT } from '@/game/progression/town';
import { stageOf } from '@/game/world/buildings';
import { Week } from '@/assessment/types';

const builder = { pref: prefFromOrder(['R', 'I', 'C', 'E', 'S', 'A']), solve: () => true, react: true };

function playAll(engine: GameEngine, clock: FakeClock, persona = builder) {
  playWeek(engine, 0, persona);
  for (const w of [1, 2, 3, 4] as Week[]) {
    if (w > 1) clock.advance(7 * DAY + 1000);
    playWeek(engine, w, persona);
  }
}

describe('full playthrough', () => {
  test('four weeks produce exactly the expected, valid events', () => {
    const { engine, clock } = newGame();
    playAll(engine, clock);
    const ev = engine.events();
    for (const e of ev) expect(validateEvent(e.event)).toEqual([]);
    expect(ev.filter((e) => e.event.type === 'choice_made')).toHaveLength(30);
    expect(ev.filter((e) => e.event.type === 'plan_committed')).toHaveLength(4);
    expect(ev.filter((e) => e.event.type === 'task_result')).toHaveLength(48);
    expect(ev.every((e) => e.event.week >= 1)).toBe(true); // prologue records nothing
    expect(ev.every((e) => e.measured)).toBe(true);
    expect(engine.isFinished()).toBe(true);
    expect(engine.measuredWeeks()).toBe(4);
  });

  test('interest scoring recovers the simulated player’s top categories', () => {
    const { engine, clock } = newGame();
    playAll(engine, clock);
    const prof = engine.interestProfile();
    expect(prof.order.slice(0, 2)).toEqual(['R', 'I']);
    expect(prof.order[5]).toBe('A');
    expect(prof.consistency).toEqual({ repeatedPairs: 15, agreements: 15, rate: 1 });
  });

  test('each season project is fully built by the end of its week', () => {
    const { engine, clock } = newGame();
    playAll(engine, clock);
    for (const w of [0, 1, 2, 3, 4] as Week[]) expect(stageOf(engine.state.town.progress[SEASON_PROJECT[w]])).toBe(4);
  });

  test('town rewards are identical whichever side of a choice is picked', () => {
    const a = newGame(); const b = newGame();
    for (const g of [a, b]) { playWeek(g.engine, 0, builder); g.engine.startOrResume(1); g.engine.advance(); g.engine.advance(); g.engine.commitPlan(['R', 'I', 'A']); g.engine.advance(); }
    const step = a.engine.currentStep()!;
    if (step.kind !== 'choice') throw new Error('expected choice');
    a.engine.recordChoice(step.scenarioId, [step.left, step.right], step.left);
    b.engine.recordChoice(step.scenarioId, [step.left, step.right], step.right);
    expect(a.engine.state.town).toEqual(b.engine.state.town);
  });

  test('ability results never change interest scores', () => {
    const g1 = newGame(); const g2 = newGame();
    playAll(g1.engine, g1.clock, { ...builder, solve: () => true });
    playAll(g2.engine, g2.clock, { ...builder, solve: () => false });
    const p1 = g1.engine.interestProfile(); const p2 = g2.engine.interestProfile();
    expect(p1.scores.map((s) => s.theta)).toEqual(p2.scores.map((s) => s.theta));
    const a1 = g1.engine.abilityProfile(); const a2 = g2.engine.abilityProfile();
    for (let i = 0; i < 6; i++) expect(a1[i].theta).toBeGreaterThan(a2[i].theta);
  });

  test('reactions are optional: skipping them still completes and scores', () => {
    const { engine, clock } = newGame();
    playAll(engine, clock, { ...builder, react: false });
    expect(engine.events().some((e) => e.event.type === 'reaction')).toBe(false);
    expect(engine.interestProfile().order[0]).toBe('R');
  });
});

describe('staircase', () => {
  test('always-correct climbs to level 4; always-wrong falls to level 1; presented level is recorded', () => {
    const up = newGame(); const down = newGame();
    playAll(up.engine, up.clock, { ...builder, solve: () => true });
    playAll(down.engine, down.clock, { ...builder, solve: () => false });
    const levels = (g: typeof up, fam: string) => g.engine.events().filter((e) => e.event.type === 'task_result' && e.event.family === fam).map((e) => (e.event as { level: number }).level);
    for (const fam of ['SPA', 'ABS', 'NUM', 'LOG', 'PLN', 'VRB']) {
      const u = levels(up, fam); const d = levels(down, fam);
      expect(u).toHaveLength(8);
      expect(u.slice(0, 3)).toEqual([2, 3, 4]);
      expect(d.slice(0, 2)).toEqual([2, 1]);
      expect(Math.max(...d.slice(1))).toBeLessThanOrEqual(2);
      // no puzzle is ever repeated
      const ids = up.engine.events().filter((e) => e.event.type === 'task_result' && e.event.family === fam).map((e) => e.event.itemId);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });
});

describe('weekly progression', () => {
  test('week 1 opens after the prologue; week 2 stays locked for 7 days', () => {
    const { engine, clock } = newGame();
    expect(engine.weekStatus(0)).toBe('available');
    expect(engine.weekStatus(1)).toBe('locked');
    playWeek(engine, 0, builder);
    expect(engine.weekStatus(1)).toBe('available');
    playWeek(engine, 1, builder);
    expect(engine.weekStatus(1)).toBe('completed');
    expect(engine.weekStatus(2)).toBe('locked');
    expect(() => engine.startOrResume(2)).toThrow(/locked/);
    clock.advance(6 * DAY);
    expect(engine.weekStatus(2)).toBe('locked');
    clock.advance(DAY + 1);
    expect(engine.weekStatus(2)).toBe('available');
    expect(engine.weekStatus(3)).toBe('locked');
  });

  test('cannot skip ahead to a later week', () => {
    const { engine } = newGame();
    expect(() => engine.startOrResume(3)).toThrow();
  });

  test('moving the clock back is detected and does not unlock anything', () => {
    const { engine, clock } = newGame();
    playWeek(engine, 0, builder);
    playWeek(engine, 1, builder);
    clock.advance(3 * DAY);
    engine.now();
    clock.advance(-30 * DAY);
    expect(engine.weekStatus(2)).toBe('locked');
    expect(engine.state.schedule.clockAnomalies).toBe(1);
  });

  test('progress and mid-week position survive an app restart', () => {
    const clock = new FakeClock();
    const store = new MemoryStore();
    const e1 = new GameEngine(store, clock.now);
    playWeek(e1, 0, builder);
    e1.startOrResume(1);
    e1.advance(); e1.advance();
    e1.commitPlan(['R', 'I', 'C']);
    e1.advance();
    const pos = e1.state.session!.stepIndex;
    const town = e1.state.town;
    // "kill" the app and reopen from the same store
    const e2 = new GameEngine(store, clock.now);
    expect(e2.state.session?.stepIndex).toBe(pos);
    expect(e2.state.session?.ranked).toEqual(['R', 'I', 'C']);
    expect(e2.state.town).toEqual(town);
    expect(e2.weekStatus(0)).toBe('completed');
    expect(e2.events()).toHaveLength(1);
    // finish the week after restart
    playWeek(e2, 1, builder);
    expect(e2.weekStatus(1)).toBe('completed');
  });

  test('a failed write leaves the previous save intact (atomic commit)', () => {
    const store = new MemoryStore();
    const engine = new GameEngine(store, new FakeClock().now);
    playWeek(engine, 0, builder);
    engine.startOrResume(1);
    const before = store.listEvents().length;
    expect(() => engine.recordChoice('FC-W1-01', ['C', 'R'], 'A' as never)).toThrow();
    expect(store.listEvents().length).toBe(before);
  });
});

describe('idempotent steps (resume after a crash)', () => {
  test('repeating an action within the same step never records twice', () => {
    const { engine } = newGame();
    playWeek(engine, 0, builder);
    engine.startOrResume(1);
    engine.advance(); engine.advance();
    engine.commitPlan(['R', 'I', 'C']);
    engine.commitPlan(['A', 'S', 'E']);
    expect(engine.state.session!.ranked).toEqual(['R', 'I', 'C']);
    engine.advance();
    const st = engine.currentStep()!;
    if (st.kind !== 'choice') throw new Error('expected choice');
    engine.recordChoice(st.scenarioId, [st.left, st.right], st.left);
    engine.recordChoice(st.scenarioId, [st.left, st.right], st.right);
    engine.recordReaction(st.scenarioId, st.left, 'loved');
    engine.recordReaction(st.scenarioId, st.left, 'meh');
    const ev = engine.events();
    expect(ev.filter((e) => e.event.type === 'choice_made')).toHaveLength(1);
    expect(ev.filter((e) => e.event.type === 'reaction')).toHaveLength(1);
    expect(ev.filter((e) => e.event.type === 'plan_committed')).toHaveLength(1);
    engine.advance();
    const pz = engine.currentStep()!;
    if (pz.kind !== 'puzzle') throw new Error('expected puzzle');
    const p = engine.nextPuzzle(pz.family)!;
    engine.recordPuzzle(p, true, true, 1);
    engine.recordPuzzle(p, false, true, 2);
    expect(engine.events().filter((e) => e.event.type === 'task_result')).toHaveLength(1);
  });
});

describe('accessible task mode', () => {
  test('sessions are recorded as not measured and excluded from scores', () => {
    const { engine, clock } = newGame();
    playWeek(engine, 0, builder);
    engine.updateSettings({ accessibleMode: true });
    playWeek(engine, 1, builder);
    const ev = engine.events();
    expect(ev.length).toBeGreaterThan(0);
    expect(ev.every((e) => !e.measured)).toBe(true);
    expect(engine.interestProfile().comparisons).toBe(0);
    expect(engine.state.unmeasuredWeeks).toEqual([1]);
    expect(engine.measuredWeeks()).toBe(0);
    engine.updateSettings({ accessibleMode: false });
    clock.advance(8 * DAY);
    playWeek(engine, 2, builder);
    expect(engine.measuredWeeks()).toBe(1);
    expect(engine.interestProfile().comparisons).toBeGreaterThan(0);
  });
});

describe('accessible mode switched on mid-week', () => {
  test('the whole session, including earlier events, becomes not measured', () => {
    const { engine } = newGame();
    playWeek(engine, 0, builder);
    engine.startOrResume(1);
    engine.advance(); engine.advance();
    engine.commitPlan(['R', 'I', 'C']);
    engine.advance();
    const st = engine.currentStep()!;
    if (st.kind !== 'choice') throw new Error('expected choice');
    engine.recordChoice(st.scenarioId, [st.left, st.right], st.left);
    expect(engine.interestProfile().comparisons).toBeGreaterThan(0);
    engine.updateSettings({ accessibleMode: true });
    expect(engine.interestProfile().comparisons).toBe(0);
    engine.updateSettings({ accessibleMode: false });
    expect(engine.state.session!.measured).toBe(false);
    expect(engine.interestProfile().comparisons).toBe(0);
  });
});

describe('recommendations', () => {
  test('requires student context, respects eligibility, gives 3 + Plan B with reasons', () => {
    const { engine, clock } = newGame();
    playAll(engine, clock);
    expect(engine.recommendation()).toBeNull();
    engine.setStudent({ classLevel: 9, matricGroup: 'humanities' });
    const r = engine.recommendation()!;
    expect(r.top).toHaveLength(3);
    for (const t of r.top) {
      expect(t.eligibility.status).toBe('eligible');
      expect(t.pathway.requires).toContain('humanities');
      expect(t.reasons.length).toBeGreaterThan(0);
    }
    expect(r.planB).not.toBeNull();
    expect(r.top.map((t) => t.pathway.id)).not.toContain(r.planB!.pathway.id);
    expect(r.unverifiedRules).toBe(true);
  });

  test('a science student who likes building and investigating sees engineering-type routes first', () => {
    const { engine, clock } = newGame();
    playAll(engine, clock);
    engine.setStudent({ classLevel: 10, matricGroup: 'science_computer' });
    const ids = engine.recommendation()!.top.map((t) => t.pathway.id);
    expect(ids).toContain('fsc_pre_engineering');
    expect(ids).not.toContain('fsc_pre_medical'); // needs biology group
  });
});
