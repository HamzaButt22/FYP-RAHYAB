/**
 * Where events go after the outbox. The game depends only on the EventSink interface.
 *
 *  - RahYaab should provide its own sink (its agreed ingestion endpoint, auth, encryption) through the
 *    host adapter. That endpoint was not available for inspection, so none is hard-coded here.
 *  - PrototypeBackendSink talks to the EXISTING Flask backend from the original Python project
 *    (POST /api/players, POST /api/sessions, POST /api/sessions/<sid>/events). It needs the small,
 *    backward-compatible backend change described in docs/INTEGRATION.md (new event types + event_id de-dup).
 *  - MemoryEventSink is for tests and the offline demo.
 *
 * Contract: send() must be idempotent per event_id (the outbox may resend after a crash or timeout).
 */
import type { AssessmentEvent } from '../contract/events';

export class SinkError extends Error {
  constructor(message: string, public retryable: boolean) {
    super(message);
  }
}

export interface EventSink {
  send(events: AssessmentEvent[]): Promise<void>;
}

export class MemoryEventSink implements EventSink {
  received = new Map<string, AssessmentEvent>();
  calls = 0;
  /** number of upcoming calls that should fail with a retryable error */
  failNext = 0;
  async send(events: AssessmentEvent[]) {
    this.calls++;
    if (this.failNext > 0) { this.failNext--; throw new SinkError('simulated network failure', true); }
    for (const e of events) this.received.set(e.event_id, e);
  }
}

type FetchLike = (url: string, init: { method: string; headers: Record<string, string>; body: string }) => Promise<{ ok: boolean; status: number; json(): Promise<any> }>;

export interface PrototypeSinkOptions {
  baseUrl: string;
  fetch?: FetchLike;
  /** persists the server-side ids so a restarted app keeps posting to the same server session */
  loadMapping: () => Promise<{ playerId: number; serverSessionId: string } | null>;
  saveMapping: (m: { playerId: number; serverSessionId: string }) => Promise<void>;
}

/** Maps the v1 envelope onto the original backend's event row format. */
export function toPrototypeRow(e: AssessmentEvent) {
  return {
    level_id: null, // Valley Explorer levels are not the original levels 1-10; the module level is kept in metadata
    timestamp: e.timestamp,
    t_ms: e.t_mono_ms,
    event_type: e.event_type,
    action: typeof e.event_data.outcome === 'string' ? e.event_data.outcome : null,
    decision_time_ms: typeof e.event_data.response_time_ms === 'number' ? e.event_data.response_time_ms : null,
    metadata: { ...e.event_data, event_id: e.event_id, seq: e.seq, ve_level_id: e.level_id, opportunity_id: e.opportunity_id,
      schema_version: e.schema_version, game_id: e.game_id, game_version: e.game_version, student_id: e.student_id, client_session_id: e.session_id, context: e.context },
  };
}

export class PrototypeBackendSink implements EventSink {
  private fetchFn: FetchLike;
  constructor(private o: PrototypeSinkOptions) {
    this.fetchFn = o.fetch ?? (globalThis.fetch as unknown as FetchLike);
  }

  private async post(path: string, body: unknown) {
    let res;
    try {
      res = await this.fetchFn(`${this.o.baseUrl}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    } catch (err) {
      throw new SinkError(`network error: ${String(err)}`, true);
    }
    if (!res.ok) throw new SinkError(`HTTP ${res.status} on ${path}`, res.status >= 500 || res.status === 429);
    return res.json();
  }

  private async ensureSession(e: AssessmentEvent) {
    const m = await this.o.loadMapping();
    if (m) return m.serverSessionId;
    // the backend requires a "name": only the pseudonymous id is sent, never a real name
    const player = await this.post('/api/players', { name: `participant-${e.student_id}` });
    const session = await this.post('/api/sessions', { player_id: player.player_id, game_version: e.game_version });
    const mapping = { playerId: player.player_id as number, serverSessionId: session.session_id as string };
    await this.o.saveMapping(mapping);
    return mapping.serverSessionId;
  }

  async send(events: AssessmentEvent[]) {
    if (!events.length) return;
    const sid = await this.ensureSession(events[0]);
    await this.post(`/api/sessions/${encodeURIComponent(sid)}/events`, { events: events.map(toPrototypeRow) });
  }
}
