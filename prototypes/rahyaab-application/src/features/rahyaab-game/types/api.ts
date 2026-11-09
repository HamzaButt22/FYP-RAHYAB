/**
 * Typed contracts of the RahYaab Flask API (backend/routes/api.py), checked against real responses
 * (__tests__/fixtures/reports.json was produced by the actual backend).
 *
 * Runtime validators are deliberately small and dependency-free: they check exactly what the mobile screens read,
 * and reject anything that would otherwise crash rendering or silently show wrong numbers.
 */
export const TRAITS = ['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism'] as const;
export type Trait = (typeof TRAITS)[number];
export const RIASEC_CODES = ['R', 'I', 'A', 'S', 'E', 'C'] as const;
export type RiasecCode = (typeof RIASEC_CODES)[number];
export type TraitLabel = 'Low' | 'Moderate' | 'High';

export interface Player {
  player_id: number;
  name: string;
  created_at: string;
  is_demo: number;
}

export interface Session {
  session_id: string;
  player_id: number;
  started_at: string;
  ended_at: string | null;
  duration_ms: number | null;
  status: 'in_progress' | 'completed' | 'abandoned';
  game_version: string | null;
  seed: number | null;
  player_name?: string;
}

export interface CreateSessionRequest {
  player_id: number;
  seed: number;
  game_version: string;
  started_at?: string;
}

/** One telemetry event as accepted by POST /api/sessions/<id>/events. */
export interface UploadEvent {
  level_id: number | null;
  timestamp: string;
  t_ms: number;
  event_type: string;
  action: string | null;
  decision_time_ms: number | null;
  risk_level: number | null;
  metadata: Record<string, unknown>;
}

export interface TraitEvidence {
  trait: string;
  score: number;
  label: TraitLabel;
  headline: string;
  indicators: string[];
  caveat: string;
  coverage: number;
  confidence: string;
  insufficient_data: boolean;
}

export interface BigFiveResult {
  scores: Record<Trait, number>;
  labels: Record<Trait, TraitLabel>;
  coverage: Record<Trait, number>;
  confidence: Record<Trait, string>;
  insufficient: Record<Trait, boolean>;
  evidence: Record<Trait, TraitEvidence>;
  model_name: string;
  model_version: string;
  is_validated: boolean;
  disclaimer: string;
  contributions: Contributions | null;
}

export interface Contributions {
  planned: number[];
  played: number[];
  completed: number[];
  bigfive_levels: number[];
  riasec_levels: number[];
  note: string;
}

export interface TelemetrySummary {
  levels_planned?: number;
  total_play_time_s: number;
  session_length_s: number;
  levels_completed: number;
  decisions_made: number;
  average_decision_time_s: number | null;
  exploration_rate: number | null;
  risk_taking_rate: number | null;
  helping_rate: number | null;
  retry_rate: number | null;
  strategy_changes: number;
  errors: number;
  failures: number;
  total_events: number;
}

export interface RiasecResult {
  scores: Record<RiasecCode, number>;
  holland_code: string;
  levels_used: number[];
  level_status: Record<string, string>;
  agreement: number | null;
  agreement_label: string;
  flat_profile: boolean;
  model_name: string;
  model_version: string;
  is_validated: boolean;
  disclaimer: string;
  caveats: string[];
}

export interface LevelStatusEntry {
  level_id: number;
  title: string;
  status: 'completed' | 'failed' | 'incomplete' | 'not_played';
  attempts: number;
  model: 'bigfive' | 'riasec';
}

export interface LevelSpan {
  level_id: number;
  start_ms: number;
  end_ms: number;
  outcome: 'complete' | 'failed' | 'unfinished';
  duration_s: number;
}

/** Response of POST /complete and GET /report. */
export interface AssessmentReport {
  session_id: string;
  has_bigfive: boolean;
  result: BigFiveResult;
  summary: TelemetrySummary;
  riasec: RiasecResult | null;
  level_status: Record<string, LevelStatusEntry>;
  levels: LevelSpan[];
  contributions: Contributions | null;
  event_counts: Record<string, number>;
}

// --------------------------------------------------------------------------------------------- validation
export class ApiContractError extends Error {
  constructor(message: string) {
    super(`Unexpected server response: ${message}`);
    this.name = 'ApiContractError';
  }
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const need = (cond: boolean, what: string) => {
  if (!cond) throw new ApiContractError(what);
};

export function parsePlayer(v: unknown): Player {
  need(isObj(v), 'player must be an object');
  const o = v as Record<string, unknown>;
  need(Number.isInteger(o.player_id), 'player.player_id must be an integer');
  need(typeof o.name === 'string', 'player.name must be a string');
  return o as unknown as Player;
}

export function parseSession(v: unknown): Session {
  need(isObj(v), 'session must be an object');
  const o = v as Record<string, unknown>;
  need(typeof o.session_id === 'string' && o.session_id.length > 0, 'session.session_id must be a string');
  need(Number.isInteger(o.player_id), 'session.player_id must be an integer');
  need(['in_progress', 'completed', 'abandoned'].includes(o.status as string), 'session.status is invalid');
  return o as unknown as Session;
}

export function parseInserted(v: unknown): number {
  need(isObj(v) && Number.isInteger((v as Record<string, unknown>).inserted), 'events response must contain "inserted"');
  return (v as { inserted: number }).inserted;
}

function checkBigFive(r: unknown): void {
  need(isObj(r), 'result must be an object');
  const o = r as Record<string, unknown>;
  for (const key of ['scores', 'labels', 'evidence', 'coverage'] as const) need(isObj(o[key]), `result.${key} must be an object`);
  for (const t of TRAITS) {
    const s = (o.scores as Record<string, unknown>)[t];
    need(isNum(s) && s >= 0 && s <= 100, `result.scores.${t} must be a number in 0..100`);
    need(['Low', 'Moderate', 'High'].includes((o.labels as Record<string, string>)[t]), `result.labels.${t} is invalid`);
    const ev = (o.evidence as Record<string, unknown>)[t];
    need(isObj(ev), `result.evidence.${t} must be an object`);
    const e = ev as Record<string, unknown>;
    need(typeof e.headline === 'string' && Array.isArray(e.indicators) && typeof e.caveat === 'string', `result.evidence.${t} is incomplete`);
    need(isNum(e.coverage), `result.evidence.${t}.coverage must be a number`);
  }
  need(typeof o.is_validated === 'boolean', 'result.is_validated must be a boolean');
  need(typeof o.disclaimer === 'string', 'result.disclaimer must be a string');
}

function checkRiasec(r: unknown): void {
  need(isObj(r), 'riasec must be an object or null');
  const o = r as Record<string, unknown>;
  need(isObj(o.scores), 'riasec.scores must be an object');
  for (const c of RIASEC_CODES) {
    const s = (o.scores as Record<string, unknown>)[c];
    need(isNum(s) && s >= 0 && s <= 100, `riasec.scores.${c} must be a number in 0..100`);
  }
  need(typeof o.holland_code === 'string', 'riasec.holland_code must be a string');
  need(Array.isArray(o.levels_used), 'riasec.levels_used must be a list');
  need(typeof o.flat_profile === 'boolean', 'riasec.flat_profile must be a boolean');
}

export function parseReport(v: unknown): AssessmentReport {
  need(isObj(v), 'report must be an object');
  const o = v as Record<string, unknown>;
  need(typeof o.session_id === 'string', 'report.session_id must be a string');
  need(typeof o.has_bigfive === 'boolean', 'report.has_bigfive must be a boolean');
  if (o.has_bigfive) checkBigFive(o.result);
  else need(isObj(o.result), 'report.result must be an object');
  if (o.riasec !== null && o.riasec !== undefined) checkRiasec(o.riasec);
  need(o.has_bigfive === true || (o.riasec !== null && o.riasec !== undefined), 'report has neither Big Five nor RIASEC results');
  need(isObj(o.summary) && isNum((o.summary as Record<string, unknown>).total_events), 'report.summary is invalid');
  need(Array.isArray(o.levels), 'report.levels must be a list');
  need(isObj(o.level_status), 'report.level_status must be an object');
  need(isObj(o.event_counts), 'report.event_counts must be an object');
  return { ...(o as unknown as AssessmentReport), riasec: (o.riasec ?? null) as RiasecResult | null };
}
