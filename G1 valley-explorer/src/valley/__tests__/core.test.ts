import { makeEvent, validateEvent, isoWithOffset, EventTypes } from '../contract/events';
import { bibdStats, buildRoute, CARAVAN_STOPS, CARAVAN_TYPE_IDS } from '../core/caravan';
import { JOURNEY } from '../core/journey';
import { initialJourney, journeyReducer, isUnlocked } from '../core/progress';
import { mulberry32 } from '../core/rng';
import { defaultId } from '../services/session';

const deps = {
  studentId: 'stu-1',
  sessionId: 'ses-1',
  newId: (() => { let i = 0; return () => `id-${++i}`; })(),
  nowIso: () => '2026-11-15T17:33:00.000+05:00',
  context: { language: 'en' as const, mode: 'research' as const },
};

describe('event contract', () => {
  it('builds valid envelopes', () => {
    const e = makeEvent(deps, 0, 12.4, 'crossroads_caravan', 'ROUTE_CHOICE',
      { stop_index: 0, offered: ['a', 'b', 'c'], chosen: 'a', position: 0 }, 'CC_STOP_0');
    expect(validateEvent(e)).toEqual({ ok: true, errors: [] });
    expect(e.t_mono_ms).toBe(12);
    expect(e.schema_version).toBe('1.1.0');
  });

  it('rejects unknown types, missing data keys and identity fields', () => {
    const base = makeEvent(deps, 1, 0, 'journey', 'SESSION_START', {});
    expect(validateEvent({ ...base, event_type: 'BIG_FIVE' }).ok).toBe(false);
    const r = validateEvent(makeEvent(deps, 2, 0, 'map_room', 'ITEM_RESPONSE', { item_id: 'x' }));
    expect(r.ok).toBe(false);
    expect(r.errors.join(' ')).toMatch(/correct/);
    const pii = validateEvent(makeEvent(deps, 3, 0, 'journey', 'REFLECTION_RESPONSE', { question_id: 'q', answer: 'a', name: 'Ali' }));
    expect(pii.ok).toBe(false);
  });

  it('formats timestamps with an offset', () => {
    expect(isoWithOffset(new Date())).toMatch(/[+-]\d{2}:\d{2}$/);
  });

  it('has no Big Five event types', () => {
    expect(EventTypes.join(' ')).not.toMatch(/OCEAN|PERSONALITY|TRAIT/);
  });
});

describe('caravan BIBD (port of level10_caravan.build_route)', () => {
  it.each([1, 2, 3, 42, 999])('is balanced for seed %i', (seed) => {
    const route = buildRoute(mulberry32(seed));
    expect(route).toHaveLength(CARAVAN_STOPS);
    const { replication, pairCounts } = bibdStats(route);
    for (const t of CARAVAN_TYPE_IDS) expect(replication[t]).toBe(5);
    expect(Object.keys(pairCounts)).toHaveLength(15);
    for (const n of Object.values(pairCounts)) expect(n).toBe(2);
    for (const stop of route) expect(new Set(stop).size).toBe(3);
  });

  it('is reproducible for a session seed (needed for resume)', () => {
    expect(buildRoute(mulberry32(7))).toEqual(buildRoute(mulberry32(7)));
  });
});

describe('journey reducer', () => {
  const s0 = initialJourney('ses', 1, 'now');

  it('has exactly 8 levels in order', () => {
    expect(JOURNEY.map((l) => l.index)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(JOURNEY.filter((l) => l.kind === 'interest')).toHaveLength(3);
    expect(JOURNEY.filter((l) => l.kind === 'ability')).toHaveLength(4);
  });

  it('only unlocks the next level', () => {
    expect(isUnlocked(s0, 'valley_gate')).toBe(true);
    expect(isUnlocked(s0, 'crossroads_caravan')).toBe(false);
    expect(journeyReducer(s0, { type: 'OPEN_LEVEL', level: 'map_room' })).toBe(s0);
  });

  it('completion is idempotent (repeated taps cannot skip levels)', () => {
    let s = journeyReducer(s0, { type: 'OPEN_LEVEL', level: 'valley_gate' });
    s = journeyReducer(s, { type: 'COMPLETE_LEVEL', level: 'valley_gate' });
    const again = journeyReducer(s, { type: 'COMPLETE_LEVEL', level: 'valley_gate' });
    expect(again.currentIndex).toBe(2);
    expect(again.completed).toEqual(['valley_gate']);
    // cannot complete a level out of order
    expect(journeyReducer(s, { type: 'COMPLETE_LEVEL', level: 'vault_locks' }).completed).toEqual(['valley_gate']);
  });

  it('keeps level state only for the active level and drops it on completion', () => {
    let s = journeyReducer(s0, { type: 'OPEN_LEVEL', level: 'valley_gate' });
    s = journeyReducer(s, { type: 'SAVE_LEVEL_STATE', level: 'valley_gate', state: { visited: ['a'] } });
    expect(s.levelStates.valley_gate).toEqual({ visited: ['a'] });
    expect(journeyReducer(s, { type: 'SAVE_LEVEL_STATE', level: 'map_room', state: 1 })).toBe(s);
    s = journeyReducer(s, { type: 'COMPLETE_LEVEL', level: 'valley_gate' });
    expect(s.levelStates.valley_gate).toBeUndefined();
  });

  it('cannot finish before all levels are complete', () => {
    expect(journeyReducer(s0, { type: 'FINISH' }).finished).toBe(false);
    let s = s0;
    for (const l of JOURNEY) {
      s = journeyReducer(s, { type: 'OPEN_LEVEL', level: l.id });
      s = journeyReducer(s, { type: 'COMPLETE_LEVEL', level: l.id });
    }
    expect(journeyReducer(s, { type: 'FINISH' }).finished).toBe(true);
  });
});

describe('default id generator', () => {
  it('always returns a v4-style UUID, even when expo-crypto has no native backing', () => {
    const ids = new Set(Array.from({ length: 200 }, () => defaultId()));
    expect(ids.size).toBe(200);
    for (const id of ids) expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  });
});
