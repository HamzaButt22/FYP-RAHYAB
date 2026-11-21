/**
 * Valley Explorer event contract (v1.0.0).
 *
 * The envelope follows the RahYaab technical architecture document (`technical_architecture.md` §3):
 * schema_version, event_id, student_id (pseudonymous), session_id, game_id, level_id, opportunity_id,
 * event_type, event_data, timestamp (ISO-8601), t_mono_ms, context.
 *
 * NOTE: the RahYaab app source was not available when this module was written, so this contract has
 * NOT been verified against the app's real event schema. Hosts that use a different contract should
 * translate envelopes in their EventSink (see services/sinks.ts) rather than change this file.
 *
 * Event type names reuse the vocabulary of the original Python game (analytics/event_schema.py) where the
 * meaning is the same, so earlier analyses remain comparable.
 */
import { EVENT_SCHEMA_VERSION, GAME_ID, GAME_VERSION } from './versions';

export const EventTypes = [
  // lifecycle
  'SESSION_START',
  'SESSION_RESUMED',
  'SESSION_END',
  'LEVEL_START',
  'LEVEL_COMPLETE',
  'LEVEL_EXIT',
  'GAME_PAUSED',
  'GAME_RESUMED',
  // context (never scored)
  'EXPLORATION',
  'REFLECTION_RESPONSE',
  // interest (RIASEC) evidence
  'ROUTE_CHOICE',
  'ACTIVITY_CHOICE',
  'ACTIVITY_START',
  'ACTIVITY_STEP',
  'ACTIVITY_END',
  'ROLE_SELECTED',
  'ROLE_CHANGED',
  // ability evidence
  'ITEM_PRESENTED',
  'ITEM_RESPONSE',
  'HINT_USED',
  // personality (Big Five) self-report: the student's own answer to a Mini-IPIP journal statement
  'BIG5_RESPONSE',
] as const;

export type EventType = (typeof EventTypes)[number];

export type LevelId =
  | 'valley_gate'
  | 'crossroads_caravan'
  | 'workshop_orders'
  | 'career_workshop'
  | 'map_room'
  | 'pattern_gate'
  | 'park_mission'
  | 'vault_locks'
  | 'journey'; // events that do not belong to a level (session lifecycle, reflection)

export interface EventContext {
  language: 'en' | 'ur';
  mode: 'student' | 'research' | 'demo';
  app_version?: string;
}

export interface AssessmentEvent {
  schema_version: string;
  event_id: string;
  student_id: string;
  session_id: string;
  game_id: string;
  game_version: string;
  level_id: LevelId;
  opportunity_id: string | null;
  event_type: EventType;
  event_data: Record<string, unknown>;
  /** wall-clock time, ISO-8601 with offset */
  timestamp: string;
  /** active game time in ms since session start; excludes time while the app was in the background */
  t_mono_ms: number;
  /** monotonically increasing per session; used for ordering and idempotent de-duplication */
  seq: number;
  context: EventContext;
}

/** Required keys inside event_data, per event type. Extra keys are allowed. */
export const REQUIRED_DATA_KEYS: Partial<Record<EventType, readonly string[]>> = {
  LEVEL_START: ['level_index'],
  LEVEL_COMPLETE: ['level_index'],
  EXPLORATION: ['area_id'],
  ROUTE_CHOICE: ['stop_index', 'offered', 'chosen', 'position'],
  ACTIVITY_CHOICE: ['task_id', 'selected'],
  ACTIVITY_START: ['task_id', 'round'],
  ACTIVITY_STEP: ['task_id', 'step_id', 'optional'],
  ACTIVITY_END: ['task_id', 'round', 'outcome', 'required_done', 'required_total', 'optional_taken', 'optional_total', 'engaged_ms', 'expected_ms'],
  ROLE_SELECTED: ['role'],
  ROLE_CHANGED: ['role', 'previous_role'],
  ITEM_PRESENTED: ['item_id', 'family', 'item_version', 'difficulty', 'practice'],
  ITEM_RESPONSE: ['item_id', 'family', 'item_version', 'practice', 'response', 'correct', 'attempt', 'hints_used', 'response_time_ms'],
  HINT_USED: ['item_id', 'family'],
  REFLECTION_RESPONSE: ['question_id', 'answer'],
  BIG5_RESPONSE: ['item_id', 'instrument', 'answer', 'page_level', 'response_time_ms'],
};

export interface ValidationResult {
  ok: boolean;
  errors: string[];
}

const ISO_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/;

/** Runtime validation of an envelope. Used before an event enters the outbox and again in tests. */
export function validateEvent(e: unknown): ValidationResult {
  const errors: string[] = [];
  if (!e || typeof e !== 'object') return { ok: false, errors: ['event is not an object'] };
  const ev = e as Partial<AssessmentEvent>;
  const str = (k: keyof AssessmentEvent) => {
    if (typeof ev[k] !== 'string' || (ev[k] as string).length === 0) errors.push(`${String(k)} must be a non-empty string`);
  };
  (['schema_version', 'event_id', 'student_id', 'session_id', 'game_id', 'game_version', 'level_id', 'event_type', 'timestamp'] as const).forEach(str);
  if (ev.event_type && !(EventTypes as readonly string[]).includes(ev.event_type)) errors.push(`unknown event_type ${ev.event_type}`);
  if (ev.timestamp && !ISO_RE.test(ev.timestamp)) errors.push('timestamp must be ISO-8601 with offset');
  if (typeof ev.t_mono_ms !== 'number' || ev.t_mono_ms < 0 || !Number.isFinite(ev.t_mono_ms)) errors.push('t_mono_ms must be a finite number >= 0');
  if (typeof ev.seq !== 'number' || !Number.isInteger(ev.seq) || ev.seq < 0) errors.push('seq must be an integer >= 0');
  if (ev.opportunity_id !== null && ev.opportunity_id !== undefined && typeof ev.opportunity_id !== 'string') errors.push('opportunity_id must be string or null');
  if (!ev.event_data || typeof ev.event_data !== 'object' || Array.isArray(ev.event_data)) errors.push('event_data must be an object');
  else if (ev.event_type) {
    for (const k of REQUIRED_DATA_KEYS[ev.event_type as EventType] ?? []) {
      if (!(k in ev.event_data)) errors.push(`event_data.${k} is required for ${ev.event_type}`);
    }
  }
  if (!ev.context || typeof ev.context !== 'object') errors.push('context is required');
  else if (ev.context.language !== 'en' && ev.context.language !== 'ur') errors.push('context.language must be en or ur');
  // privacy guard: the envelope must never carry obvious identity fields
  const serialized = JSON.stringify(ev.event_data ?? {}).toLowerCase();
  for (const banned of ['"name"', '"phone"', '"email"', '"cnic"', '"address"']) {
    if (serialized.includes(banned)) errors.push(`event_data must not contain ${banned}`);
  }
  return { ok: errors.length === 0, errors };
}

export interface EventFactoryDeps {
  studentId: string;
  sessionId: string;
  newId: () => string;
  nowIso: () => string;
  context: EventContext;
}

/** Creates envelopes. Pure apart from the injected id/clock functions, so it is deterministic in tests. */
export function makeEvent(
  deps: EventFactoryDeps,
  seq: number,
  tMonoMs: number,
  levelId: LevelId,
  eventType: EventType,
  eventData: Record<string, unknown>,
  opportunityId: string | null = null,
): AssessmentEvent {
  return {
    schema_version: EVENT_SCHEMA_VERSION,
    event_id: deps.newId(),
    student_id: deps.studentId,
    session_id: deps.sessionId,
    game_id: GAME_ID,
    game_version: GAME_VERSION,
    level_id: levelId,
    opportunity_id: opportunityId,
    event_type: eventType,
    event_data: eventData,
    timestamp: deps.nowIso(),
    t_mono_ms: Math.max(0, Math.round(tMonoMs)),
    seq,
    context: deps.context,
  };
}

/** ISO-8601 with local offset, e.g. 2026-11-15T17:33:00.000+05:00 */
export function isoWithOffset(d: Date = new Date()): string {
  const pad = (n: number, w = 2) => String(Math.abs(n)).padStart(w, '0');
  const off = -d.getTimezoneOffset();
  const sign = off >= 0 ? '+' : '-';
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(d.getMilliseconds(), 3)}` +
    `${sign}${pad(Math.floor(Math.abs(off) / 60))}:${pad(Math.abs(off) % 60)}`
  );
}

/** What game logic produces; GameSession turns it into a full envelope. */
export interface EventSpec {
  level: LevelId;
  type: EventType;
  data: Record<string, unknown>;
  opportunity?: string | null;
}
