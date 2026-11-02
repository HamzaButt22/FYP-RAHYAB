/**
 * Desktop -> mobile parity: replay every input trace recorded from the REAL Python game
 * (tools/record_parity_traces.py) through the TypeScript engine and require the *identical* telemetry stream:
 * same events, same order, same game-clock milliseconds, same columns and metadata.
 *
 * Because the Flask backend scores sessions from telemetry alone, identical telemetry means identical
 * Big Five / RIASEC results for the same behaviour on desktop and on mobile.
 */
import { canonical, firstDivergence, listTraces, loadTrace, replayTrace, strip } from './parity-helpers';

const traces = listTraces();

describe('telemetry parity with the desktop game', () => {
  it('has fixtures for every level', () => {
    const levels = new Set<number>();
    for (const f of traces) loadTrace(f).plan.forEach((l) => levels.add(l));
    expect([...levels].sort()).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it.each(traces)('%s', (file) => {
    const trace = loadTrace(file);
    const { runner, events } = replayTrace(trace);
    const actual = events.map(strip);
    const i = firstDivergence(actual, trace.events);
    if (i !== -1) {
      const ctx = {
        index: i,
        of: trace.events.length,
        actual: canonical(actual[i]),
        expected: canonical(trace.events[i]),
        previous: canonical(trace.events[i - 1]),
      };
      throw new Error(`telemetry diverges from the desktop game:\n${JSON.stringify(ctx, null, 1)}`);
    }
    expect(actual.length).toBe(trace.events.length);
    if (trace.finished !== false) expect(runner.state === 'finished' || runner.state === 'abandoned').toBe(true);
  });
});

describe('the parity harness is not vacuous', () => {
  it('compares thousands of real events', () => {
    const total = traces.reduce((s, f) => s + loadTrace(f).events.length, 0);
    expect(total).toBeGreaterThan(15000);
  });

  it('detects a different random seed (bridge / chest / gate outcomes)', () => {
    const trace = loadTrace('original_reckless_21.json');
    const { events } = replayTrace({ ...trace, seed: trace.seed + 1 });
    expect(firstDivergence(events.map(strip), trace.events)).toBeGreaterThanOrEqual(0);
  });

  it('detects a single dropped input frame', () => {
    const trace = loadTrace('full_planner_6.json');
    const frames = trace.frames.map((f) => [...f]) as typeof trace.frames;
    const i = frames.findIndex((f, k) => k > 50 && f[0] > 3);
    frames[i] = [frames[i][0] - 1, frames[i][1]];
    const { events } = replayTrace({ ...trace, frames });
    expect(firstDivergence(events.map(strip), trace.events)).toBeGreaterThanOrEqual(0);
  });
});
