/** Shared helpers for desktop-vs-mobile telemetry parity tests. */
import fs from 'fs';
import path from 'path';
import { JournalFrame, replayFrames } from '../../game-engine/journal';
import { TelemetryEvent } from '../../game-engine/logger';
import { GameRunner } from '../../game-engine/runner';
import { LEVEL_CLASSES } from '../../levels';

export interface ParityTrace {
  format: number;
  persona: string;
  plan_name: string;
  plan: number[];
  seed: number;
  player_name: string;
  dt: number;
  frames: JournalFrame[];
  n_frames: number;
  events: ExpectedEvent[];
  finished?: boolean;
  python_result: null | {
    has_bigfive: boolean;
    scores: Record<string, number> | null;
    labels: Record<string, string> | null;
    riasec: Record<string, number> | null;
    holland_code: string | null;
  };
}

export interface ExpectedEvent {
  level_id: number | null;
  t_ms: number;
  event_type: string;
  action: string | null;
  decision_time_ms: number | null;
  risk_level: number | null;
  metadata: Record<string, unknown>;
}

export const FIXTURE_DIR = path.join(__dirname, '..', 'fixtures', 'parity');

export function listTraces(): string[] {
  return fs
    .readdirSync(FIXTURE_DIR)
    .filter((f) => f.endsWith('.json'))
    .sort();
}

export function loadTrace(file: string): ParityTrace {
  return JSON.parse(fs.readFileSync(path.join(FIXTURE_DIR, file), 'utf8')) as ParityTrace;
}

export function strip(e: TelemetryEvent): ExpectedEvent {
  return {
    level_id: e.level_id,
    t_ms: e.t_ms,
    event_type: e.event_type,
    action: e.action,
    decision_time_ms: e.decision_time_ms,
    risk_level: e.risk_level,
    metadata: JSON.parse(JSON.stringify(e.metadata)),
  };
}

export function replayTrace(trace: ParityTrace): { runner: GameRunner; events: TelemetryEvent[] } {
  const events: TelemetryEvent[] = [];
  const runner = new GameRunner({
    seed: trace.seed,
    playerName: trace.player_name,
    plan: trace.plan,
    sink: (e) => events.push(e),
    startedAtMs: Date.UTC(2026, 9, 29, 6, 47, 0),
    levelClasses: LEVEL_CLASSES,
    touchMode: false,
  });
  replayFrames(runner, trace.frames, trace.dt);
  return { runner, events };
}

/** Index of the first differing event, or -1 if both streams are identical. */
export function firstDivergence(actual: ExpectedEvent[], expected: ExpectedEvent[]): number {
  const n = Math.max(actual.length, expected.length);
  for (let i = 0; i < n; i++) {
    if (JSON.stringify(canonical(actual[i])) !== JSON.stringify(canonical(expected[i]))) return i;
  }
  return -1;
}

/** Key-order independent, number-normalised representation for comparison. */
export function canonical(v: unknown): unknown {
  if (v === undefined) return '<missing>';
  if (v === null || typeof v !== 'object') return v;
  if (Array.isArray(v)) return v.map(canonical);
  const o = v as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const k of Object.keys(o).sort()) out[k] = canonical(o[k]);
  return out;
}
