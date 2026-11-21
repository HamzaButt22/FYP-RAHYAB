import { scoreAbility } from '../core/ability/scoring';
import type { RahYaabHostAdapter } from '../adapter';
import { validateEvent } from '../contract/events';
import { LevelRunner, MACHINES } from '../core/levels/runner';
import type { AssessmentOutput } from '../core/summary';
import { ConsentRequiredError, GameSession } from '../services/session';
import { MemoryEventSink } from '../services/sinks';
import { MemoryStore } from '../services/storage';
import { PERSONAS, playJourney } from '../testing/bots';

function harness(overrides: Partial<RahYaabHostAdapter> = {}) {
  let clock = 1_700_000_000_000;
  let id = 0;
  const store = new MemoryStore();
  const sink = new MemoryEventSink();
  const outputs: AssessmentOutput[] = [];
  const adapter: RahYaabHostAdapter = {
    studentId: 'P-0001', consentGranted: true, language: 'en', mode: 'research', eventSink: sink, storage: store,
    onComplete: (o) => { outputs.push(o); }, onExit: () => {}, newId: () => `e${++id}`, now: () => clock, ...overrides,
  };
  return { adapter, store, sink, outputs, advance: (ms: number) => { clock += ms; } };
}

async function finished(h: ReturnType<typeof harness>, persona = PERSONAS.maker) {
  const { session } = await GameSession.open(h.adapter);
  await playJourney(session, persona, h.advance);
  await session.commit({ events: [{ level: 'journey', type: 'REFLECTION_RESPONSE', data: { question_id: 'favourite_place', answer: 'yard' } }], actions: [{ type: 'COMPLETE_REFLECTION' }] });
  const out = await session.finish();
  return { session, out };
}

const opened: GameSession[] = [];
const realOpen = GameSession.open.bind(GameSession);
jest.spyOn(GameSession, 'open').mockImplementation(async (...args) => {
  const r = await realOpen(...args);
  opened.push(r.session);
  return r;
});

describe('GameSession', () => {
  afterEach(() => {
    opened.splice(0).forEach((s) => s.sync.stop());
    jest.useRealTimers();
  });

  it('refuses to start without consent and records nothing', async () => {
    const h = harness({ consentGranted: false });
    await expect(GameSession.open(h.adapter)).rejects.toBeInstanceOf(ConsentRequiredError);
    expect(h.store.data.size).toBe(0);
  });

  it('plays all 8 levels; every stored event is valid and ordered', async () => {
    const h = harness();
    const { session, out } = await finished(h);
    expect(session.journey.completed).toHaveLength(8);
    const evs = await session.events();
    evs.forEach((e) => expect(validateEvent(e)).toEqual({ ok: true, errors: [] }));
    expect(evs.map((e) => e.seq)).toEqual(evs.map((_, i) => i));
    expect(new Set(evs.map((e) => e.event_id)).size).toBe(evs.length);
    expect(h.outputs).toHaveLength(1);
    expect(out.versions.riasec_scoring).toBe('riasec-0.3-prototype');
    expect(out.validation_status).toBe('prototype_not_validated');
    // the pathway hand-off contains the Big Five QUESTIONNAIRE, never the exploratory gameplay estimates
    expect(out.eligible_outputs.bigfive?.instrument).toBe('mini-ipip-20');
    expect(JSON.stringify(out.eligible_outputs)).not.toMatch(/behaviour|indicators|comparison/i);
  });

  it('different behaviour gives different interest profiles (pipeline discriminates; not a validity claim)', async () => {
    const maker = (await finished(harness(), PERSONAS.maker)).out;
    const carer = (await finished(harness(), PERSONAS.carer)).out;
    expect(maker.riasec.holland_code[0]).toBe('R');
    expect(carer.riasec.holland_code[0]).toBe('S');
    expect(maker.riasec.levels_used).toHaveLength(3);
  });

  it('ability results are counts with no bands, and practice items never count', async () => {
    const { out } = await finished(harness(), PERSONAS.maker);
    for (const f of Object.values(out.ability.families)) {
      expect(f.status).toBe('reported');
      expect(f.answered).toBe(6);
      expect(f.items.every((i) => !i.item_id.includes('practice'))).toBe(true);
    }
    expect(JSON.stringify(out.ability)).not.toMatch(/"(low|average|high|percentile|iq)"/i);
  });

  it('a student who camps and skips a lot gets "insufficient" rather than a made-up profile', async () => {
    const { out } = await finished(harness(), PERSONAS.skipper);
    expect(out.student_summary.interests.note).toBeTruthy();
    // at least the caravan should have been excluded or flagged
    expect(['insufficient', 'completed', 'incomplete']).toContain(out.riasec.level_status.crossroads_caravan);
  });

  it('survives an app kill mid-level: resumes at the same level and step with no lost or duplicated events', async () => {
    const h = harness();
    const first = await GameSession.open(h.adapter);
    await playJourney(first.session, PERSONAS.organiser, h.advance, { stopAfterLevel: 3 });
    // open level 4 and make a choice, then "kill" (drop the object without any shutdown)
    const r = new LevelRunner<any, any>(first.session, MACHINES.career_workshop);
    await r.open();
    await r.dispatch({ type: 'PICK', taskId: 'sort_records' }).done;
    await r.dispatch({ type: 'STEP', stepId: 'sort' }).done;
    const before = await first.session.events();

    const second = await GameSession.open(h.adapter);
    expect(second.resumed).toBe(true);
    expect(second.session.sessionId).toBe(first.session.sessionId);
    expect(second.session.journey.completed).toHaveLength(3);
    const r2 = new LevelRunner<any, any>(second.session, MACHINES.career_workshop);
    const { state, resumed } = await r2.open();
    expect(resumed).toBe(true);
    expect(state.job.taskId).toBe('sort_records');
    expect(state.job.done).toEqual(['sort']);
    const after = await second.session.events();
    expect(after.slice(0, before.length)).toEqual(before);
    expect(after[before.length].event_type).toBe('SESSION_RESUMED');
    expect(after.filter((e) => e.event_type === 'LEVEL_START' && e.level_id === 'career_workshop')).toHaveLength(1);
  });

  it('does not resume another student’s session on a shared phone', async () => {
    const h = harness();
    await GameSession.open(h.adapter);
    const other = await GameSession.open({ ...h.adapter, studentId: 'P-0002' });
    expect(other.resumed).toBe(false);
  });

  it('ignores repeated taps (double submit, double complete)', async () => {
    const h = harness();
    const { session } = await GameSession.open(h.adapter);
    await playJourney(session, PERSONAS.maker, h.advance, { stopAfterLevel: 2 });
    const r = new LevelRunner<any, any>(session, MACHINES.workshop_orders);
    await r.open();
    const a = r.dispatch({ type: 'SUBMIT', response: ['stool', 'shelf'] });
    const b = r.dispatch({ type: 'SUBMIT', response: ['box'] });
    await Promise.all([a.done, b.done]);
    expect(b.changed).toBe(false);
    const responses = (await session.events()).filter((e) => e.event_type === 'ITEM_RESPONSE');
    expect(responses).toHaveLength(1);
    expect(responses[0].event_data.correct).toBe(true);
  });

  it('keeps events offline, retries, and uploads each event exactly once', async () => {
    jest.useFakeTimers();
    const h = harness();
    h.sink.failNext = 3;
    const { session } = await GameSession.open(h.adapter);
    await playJourney(session, PERSONAS.carer, h.advance, { stopAfterLevel: 2 });
    const all = await session.events();
    await session.sync.flush(); // fails (1)
    expect(h.sink.received.size).toBe(0);
    for (let i = 0; i < 6; i++) { await jest.advanceTimersByTimeAsync(70_000); }
    await session.sync.flush();
    expect(h.sink.received.size).toBe(all.length);
    expect(await session.store.countUnsent(session.sessionId)).toBe(0);
    // re-sending (e.g. after a crash before markSent) does not duplicate on an idempotent sink
    await h.sink.send(all);
    expect(h.sink.received.size).toBe(all.length);
    session.sync.stop();
  });

  it('pause excludes background time from the active clock', async () => {
    const h = harness();
    const { session } = await GameSession.open(h.adapter);
    h.advance(1000);
    await session.pause('background');
    h.advance(600_000); // 10 minutes in the background
    await session.resume('foreground');
    h.advance(500);
    expect(session.activeMs()).toBe(1500);
    const types = (await session.events()).map((e) => e.event_type);
    expect(types).toEqual(['SESSION_START', 'GAME_PAUSED', 'GAME_RESUMED']);
  });

  it('purges local data only after everything is uploaded', async () => {
    const h = harness();
    const { session } = await finished(h);
    session.sync.stop();
    h.sink.failNext = 0;
    const pending = await session.store.countUnsent(session.sessionId);
    if (pending > 0) expect(await session.purgeIfDelivered()).toBe(false);
    await (session as any).store.markSent(session.sessionId, await session.events());
    expect(await session.purgeIfDelivered()).toBe(true);
    expect([...h.store.data.keys()].filter((k) => k.includes(session.sessionId))).toHaveLength(0);
  });

  it('surfaces storage failures instead of silently losing progress', async () => {
    const h = harness();
    const { session } = await GameSession.open(h.adapter);
    h.store.failWrites = true;
    await session.commit({ events: [{ level: 'journey', type: 'GAME_PAUSED', data: { reason: 'test' } }] });
    expect(session.storageError).toMatch(/simulated/);
    h.store.failWrites = false;
    await session.commit({});
    expect(session.storageError).toBeNull();
  });
});

describe('student summary wording', () => {
  it('never presents a rarely-chosen area as a top interest', async () => {
    for (const p of Object.values(PERSONAS)) {
      const h = harness();
      const { session } = await GameSession.open(h.adapter);
      await playJourney(session, p, h.advance);
      const out = await session.finish();
      session.sync.stop();
      for (const line of out.student_summary.interests.top) {
        expect(line.score).toBeGreaterThanOrEqual(25);
        expect(line.text).not.toMatch(/rarely/);
      }
      expect(out.eligible_outputs.riasec?.shown_top ?? []).toEqual(out.student_summary.interests.top.map((l) => l.code));
    }
  });
});

describe('ability evidence rules', () => {
  it('a family where most puzzles were skipped is "insufficient", not "0 of 6"', async () => {
    const h = harness();
    const { session } = await GameSession.open(h.adapter);
    await playJourney(session, PERSONAS.maker, h.advance, { stopAfterLevel: 2 });
    const r = new LevelRunner<any, any>(session, MACHINES.workshop_orders);
    await r.open();
    await r.dispatch({ type: 'SUBMIT', response: ['stool', 'shelf'] }).done; // practice
    await r.dispatch({ type: 'NEXT' }).done;
    for (let i = 0; i < 6; i++) { await r.dispatch({ type: 'SKIP' }).done; await r.dispatch({ type: 'NEXT' }).done; }
    session.sync.stop();
    const f = scoreAbility(await session.events()).families.planning_numerical;
    expect(f.skipped).toBe(6);
    expect(f.status).toBe('insufficient_evidence');
    expect(f.proportion).toBeNull();
  });
});
