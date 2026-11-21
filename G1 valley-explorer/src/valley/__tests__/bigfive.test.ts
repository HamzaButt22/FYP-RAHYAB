import type { RahYaabHostAdapter } from '../adapter';
import type { AssessmentEvent } from '../contract/events';
import { validateEvent } from '../contract/events';
import { BIG5_ITEMS, JOURNAL_PAGES, TRAITS } from '../core/bigfive/items';
import { big5Event, pendingJournalPage } from '../core/bigfive/journal';
import { behaviourEstimates, bigFiveAnswers, computeBigFive, scoreQuestionnaire } from '../core/bigfive/scoring';
import { JOURNEY } from '../core/journey';
import type { AssessmentOutput } from '../core/summary';
import { GameSession } from '../services/session';
import { MemoryEventSink } from '../services/sinks';
import { MemoryStore } from '../services/storage';
import { PERSONAS, playJourney } from '../testing/bots';

let seq = 0;
const ev = (type: AssessmentEvent['event_type'], data: Record<string, unknown>, level: AssessmentEvent['level_id'] = 'journey'): AssessmentEvent => ({
  schema_version: '1.1.0', event_id: `x${seq}`, student_id: 'P', session_id: 'S', game_id: 'valley_explorer', game_version: 'v', level_id: level,
  opportunity_id: null, event_type: type, event_data: data, timestamp: '2026-11-16T10:00:00.000+05:00', t_mono_ms: 0, seq: seq++, context: { language: 'en', mode: 'research' },
});
const answersOf = (pairs: [string, number | null][]) => new Map(pairs);

describe('Mini-IPIP items and journal pages', () => {
  it('has 20 items, 4 per trait, with the published keying (O has 1 positive and 3 reverse items)', () => {
    expect(BIG5_ITEMS).toHaveLength(20);
    for (const t of TRAITS) expect(BIG5_ITEMS.filter((i) => i.trait === t)).toHaveLength(4);
    expect(BIG5_ITEMS.filter((i) => i.trait === 'O').map((i) => i.key).sort()).toEqual([-1, -1, -1, 1]);
    for (const t of ['E', 'A', 'C', 'N'] as const) expect(BIG5_ITEMS.filter((i) => i.trait === t).map((i) => i.key).sort()).toEqual([-1, -1, 1, 1]);
  });

  it('journal pages ask every item exactly once, 2–3 per stop, and spread each trait over at least 3 stops', () => {
    const all = Object.values(JOURNAL_PAGES).flat();
    expect(all.sort()).toEqual(BIG5_ITEMS.map((i) => i.id).sort());
    expect(Object.keys(JOURNAL_PAGES).sort()).toEqual(JOURNEY.map((l) => l.id).sort());
    for (const items of Object.values(JOURNAL_PAGES)) expect(items!.length).toBeGreaterThanOrEqual(2);
    for (const items of Object.values(JOURNAL_PAGES)) expect(items!.length).toBeLessThanOrEqual(3);
    for (const t of TRAITS) {
      const stops = Object.entries(JOURNAL_PAGES).filter(([, ids]) => ids!.some((id) => BIG5_ITEMS.find((i) => i.id === id)!.trait === t));
      expect(stops.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('the pending page is the earliest finished stop with unanswered items; skipped items count as done', () => {
    expect(pendingJournalPage([], new Set())).toBeNull();
    expect(pendingJournalPage(['valley_gate'], new Set())).toEqual({ level: 'valley_gate', items: ['mi05', 'mi02'], first: true });
    expect(pendingJournalPage(['valley_gate', 'crossroads_caravan'], new Set(['mi05']))).toEqual({ level: 'valley_gate', items: ['mi02'], first: false });
    expect(pendingJournalPage(['valley_gate'], new Set(['mi05', 'mi02']))).toBeNull();
  });

  it('journal events pass contract validation, including skips', () => {
    for (const a of [3, null]) {
      const spec = big5Event('valley_gate', 'mi05', a, 1234.6);
      const e = ev(spec.type, spec.data, spec.level);
      expect(validateEvent(e)).toEqual({ ok: true, errors: [] });
      expect(e.event_data).toMatchObject({ instrument: 'mini-ipip-20', answer: a, skipped: a === null, response_time_ms: 1235 });
    }
  });
});

describe('questionnaire scoring', () => {
  it('reverse-keys items (6 − answer) and rescales the mean to 0–100', () => {
    // Extraversion: mi01 +, mi11 +, mi06 −, mi16 −. Answers 5,5,1,1 = maximum extraversion.
    const max = scoreQuestionnaire(answersOf([['mi01', 5], ['mi11', 5], ['mi06', 1], ['mi16', 1]]));
    expect(max.traits.E).toMatchObject({ status: 'reported', mean: 5, score: 100, band: 'higher' });
    const min = scoreQuestionnaire(answersOf([['mi01', 1], ['mi11', 1], ['mi06', 5], ['mi16', 5]]));
    expect(min.traits.E).toMatchObject({ mean: 1, score: 0, band: 'lower' });
    const mid = scoreQuestionnaire(answersOf([['mi01', 4], ['mi11', 3], ['mi06', 3], ['mi16', 2]])); // 4,3,3,4 -> 3.5
    expect(mid.traits.E).toMatchObject({ mean: 3.5, score: 62.5, band: 'higher' });
  });

  it('needs at least 3 of 4 answers per trait; skips are counted but not scored', () => {
    const r = scoreQuestionnaire(answersOf([['mi01', 5], ['mi11', 5], ['mi06', null], ['mi16', null]]));
    expect(r.traits.E).toMatchObject({ status: 'insufficient_evidence', answered: 2, score: null });
    expect(r.available).toBe(false);
    expect(r.skipped).toBe(2);
    const r3 = scoreQuestionnaire(answersOf([['mi01', 5], ['mi11', 5], ['mi06', 1], ['mi16', null]]));
    expect(r3.traits.E).toMatchObject({ status: 'reported', answered: 3, score: 100 });
  });

  it('uses the latest answer to an item and ignores unknown items and out-of-range answers', () => {
    const events = [
      ev('BIG5_RESPONSE', { item_id: 'mi01', instrument: 'mini-ipip-20', answer: 1, page_level: 'valley_gate', response_time_ms: 1 }),
      ev('BIG5_RESPONSE', { item_id: 'mi01', instrument: 'mini-ipip-20', answer: 4, page_level: 'valley_gate', response_time_ms: 1 }),
      ev('BIG5_RESPONSE', { item_id: 'zz99', instrument: 'mini-ipip-20', answer: 4, page_level: 'valley_gate', response_time_ms: 1 }),
      ev('BIG5_RESPONSE', { item_id: 'mi11', instrument: 'mini-ipip-20', answer: 9, page_level: 'valley_gate', response_time_ms: 1 }),
    ];
    const a = bigFiveAnswers(events);
    expect(a.get('mi01')).toBe(4);
    expect(a.has('zz99')).toBe(false);
    expect(a.get('mi11')).toBeNull();
  });
});

describe('behaviour estimates (exploratory)', () => {
  it('never estimates Extraversion or Agreeableness (they would re-count RIASEC choices) and returns null without enough play', () => {
    const b = behaviourEstimates([]);
    expect(b.E.score).toBeNull();
    expect(b.A.score).toBeNull();
    expect(b.O.score).toBeNull();
    expect(b.C.score).toBeNull();
    expect(b.N.score).toBeNull();
  });
});

function harness() {
  let clock = 1_700_000_000_000; let id = 0;
  const outputs: AssessmentOutput[] = [];
  const adapter: RahYaabHostAdapter = {
    studentId: 'P-B5', consentGranted: true, language: 'en', mode: 'research', eventSink: new MemoryEventSink(), storage: new MemoryStore(),
    onComplete: (o) => { outputs.push(o); }, onExit: () => {}, newId: () => `b${++id}`, now: () => clock,
  };
  return { adapter, outputs, advance: (ms: number) => { clock += ms; } };
}

async function run(persona = PERSONAS.maker) {
  const h = harness();
  const { session } = await GameSession.open(h.adapter);
  await playJourney(session, persona, h.advance);
  await session.commit({ events: [], actions: [{ type: 'COMPLETE_REFLECTION' }] });
  const out = await session.finish();
  session.sync.stop();
  return out;
}

describe('full journey: interests + personality together', () => {
  it('scores the questionnaire, reports it to RahYaab and shows plain-language personality lines and advice', async () => {
    const out = await run(PERSONAS.maker); // traits O4 C5 E2 A3 N2, never skips
    const q = out.bigfive.questionnaire;
    expect(q.answered).toBe(20);
    expect(q.traits.C).toMatchObject({ score: 100, band: 'higher' });
    expect(q.traits.E).toMatchObject({ score: 25, band: 'lower' });
    expect(q.traits.N).toMatchObject({ score: 25, band: 'lower' });
    expect(out.eligible_outputs.bigfive).toMatchObject({ instrument: 'mini-ipip-20', scores: { O: 75, C: 100, E: 25, A: 50, N: 25 } });
    // behaviour estimates exist for research but are never eligible for pathways
    expect(JSON.stringify(out.eligible_outputs)).not.toContain('behaviour');
    expect(out.bigfive.behaviour.C.score).not.toBeNull();
    expect(out.bigfive.comparison.C).toBeDefined();
    // student summary: low Neuroticism is shown as "Staying calm", described kindly
    const calm = out.student_summary.personality.lines.find((l) => l.trait === 'N')!;
    expect(calm).toMatchObject({ name: 'Staying calm', band: 'higher' });
    const ways = out.student_summary.advice.ways.join(' ');
    expect(ways).toMatch(/clear steps/); // high C
    expect(ways).toMatch(/focus, alone or in a small team/); // low E
    expect(out.student_summary.advice.fields.length).toBeGreaterThan(0);
    expect(out.versions.bigfive_scoring).toBe('bigfive-0.1-mini-ipip');
  });

  it('different students get different personality profiles; a student who skips most statements gets no personality result', async () => {
    const carer = await run(PERSONAS.carer);
    expect(carer.bigfive.questionnaire.traits.A.band).toBe('higher');
    expect(carer.student_summary.advice.agreements.some((t) => /helping activities/.test(t))).toBe(true);
    const skipper = await run(PERSONAS.skipper);
    const reported = TRAITS.filter((t) => skipper.bigfive.questionnaire.traits[t].status === 'reported');
    expect(reported.length).toBeLessThan(5);
    expect(skipper.student_summary.personality.lines).toHaveLength(reported.length);
  });

  it('student text never uses labels or numbers for personality', async () => {
    const out = await run(PERSONAS.organiser);
    const text = JSON.stringify(out.student_summary.personality) + JSON.stringify(out.student_summary.advice);
    expect(text).not.toMatch(/neurotic|introvert|extravert|disagreeable|lazy|\d+ ?%|score/i);
  });

  it('computeBigFive is a pure function of the stored events', async () => {
    const out = await run(PERSONAS.maker);
    expect(computeBigFive([])).toMatchObject({ questionnaire: { available: false, answered: 0 } });
    expect(out.bigfive.is_validated).toBe(false);
  });
});
