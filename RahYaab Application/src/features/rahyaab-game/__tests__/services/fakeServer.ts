/**
 * In-memory fake of the RahYaab Flask API (same semantics as backend/routes/api.py, incl. Idempotency-Key handling),
 * with failure injection: drop the request, lose the response after the server already applied it, or return 5xx.
 * Used to test the client sync logic end to end through the real ApiClient.
 */
import reports from '../fixtures/reports.json';

type Failure = 'network-before' | 'network-after' | 'http500' | 'http429';

interface StoredIdem {
  scope: string;
  bodyHash: string;
  status: number;
  body: unknown;
}

export class FakeServer {
  players: { player_id: number; name: string }[] = [];
  sessions = new Map<string, { session_id: string; player_id: number; status: string; seed: number | null; game_version: string; duration_ms: number | null }>();
  events = new Map<string, Record<string, unknown>[]>();
  idem = new Map<string, StoredIdem>();
  log: string[] = [];
  completeCalls = 0;
  private failures: { re: RegExp; mode: Failure; remaining: number }[] = [];
  private nextSid = 1;
  online = true;

  failNext(re: RegExp, mode: Failure, times = 1): void {
    this.failures.push({ re, mode, remaining: times });
  }

  private takeFailure(path: string): Failure | null {
    const f = this.failures.find((x) => x.remaining > 0 && x.re.test(path));
    if (!f) return null;
    f.remaining -= 1;
    return f.mode;
  }

  fetch: typeof fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input));
    const path = url.pathname;
    const method = (init?.method ?? 'GET').toUpperCase();
    this.log.push(`${method} ${path}`);
    if (!this.online) throw new TypeError('Network request failed');
    const failure = this.takeFailure(`${method} ${path}`);
    if (failure === 'network-before') throw new TypeError('Network request failed');
    if (failure === 'http500') return this.res(500, { error: 'boom' });
    if (failure === 'http429') return this.res(429, { error: 'slow down' });
    const headers = (init?.headers ?? {}) as Record<string, string>;
    const body = init?.body ? JSON.parse(String(init.body)) : null;
    const out = this.handle(method, path, body, headers['Idempotency-Key']);
    if (failure === 'network-after') throw new TypeError('Network request failed');
    return this.res(out.status, out.body, out.replayed);
  }) as typeof fetch;

  private res(status: number, body: unknown, replayed = false): Response {
    const h: Record<string, string> = { 'Content-Type': 'application/json' };
    if (replayed) h['Idempotent-Replayed'] = 'true';
    return new Response(JSON.stringify(body), { status, headers: h });
  }

  private idempotent(key: string | undefined, scope: string, body: unknown, work: () => { status: number; body: unknown }) {
    if (!key) return { ...work(), replayed: false };
    const hash = JSON.stringify(body);
    const prev = this.idem.get(key);
    if (prev) {
      if (prev.scope !== scope || prev.bodyHash !== hash) return { status: 422, body: { error: 'Idempotency-Key reused' }, replayed: false };
      return { status: prev.status, body: prev.body, replayed: true };
    }
    const r = work();
    if (r.status < 400) this.idem.set(key, { scope, bodyHash: hash, status: r.status, body: r.body });
    return { ...r, replayed: false };
  }

  private handle(method: string, path: string, body: Record<string, unknown> | null, key?: string): { status: number; body: unknown; replayed?: boolean } {
    let m: RegExpMatchArray | null;
    if (method === 'GET' && path === '/api/health') return { status: 200, body: { status: 'ok' } };
    if (method === 'POST' && path === '/api/players') {
      return this.idempotent(key, 'POST /players', body, () => {
        const p = { player_id: this.players.length + 1, name: String(body?.name), created_at: 'now', is_demo: 0 };
        this.players.push(p);
        return { status: 201, body: p };
      });
    }
    if (method === 'POST' && path === '/api/sessions') {
      return this.idempotent(key, 'POST /sessions', body, () => {
        const pid = Number(body?.player_id);
        if (!this.players.find((p) => p.player_id === pid)) return { status: 400, body: { error: "valid 'player_id' is required" } };
        const s = {
          session_id: `S${this.nextSid++}`,
          player_id: pid,
          status: 'in_progress',
          seed: (body?.seed as number) ?? null,
          game_version: String(body?.game_version ?? 'api'),
          duration_ms: null,
          started_at: String(body?.started_at ?? 'now'),
          ended_at: null,
        };
        this.sessions.set(s.session_id, s);
        this.events.set(s.session_id, []);
        return { status: 201, body: s };
      });
    }
    if ((m = path.match(/^\/api\/sessions\/([^/]+)\/events$/)) && method === 'POST') {
      const sid = decodeURIComponent(m[1]);
      return this.idempotent(key, `POST /sessions/${sid}/events`, body, () => {
        const s = this.sessions.get(sid);
        if (!s) return { status: 404, body: { error: 'unknown session' } };
        if (s.status !== 'in_progress') return { status: 409, body: { error: 'closed' } };
        const evs = body?.events as Record<string, unknown>[];
        if (!Array.isArray(evs) || !evs.length) return { status: 400, body: { error: 'events' } };
        if (evs.length > 1000) return { status: 413, body: { error: 'too many' } };
        for (const e of evs) if (!e.event_type || e.t_ms === undefined || !e.timestamp) return { status: 422, body: { error: 'invalid event' } };
        (this.events.get(sid) as Record<string, unknown>[]).push(...evs);
        return { status: 201, body: { inserted: evs.length } };
      });
    }
    if ((m = path.match(/^\/api\/sessions\/([^/]+)\/complete$/)) && method === 'POST') {
      this.completeCalls += 1;
      const sid = decodeURIComponent(m[1]);
      const s = this.sessions.get(sid);
      if (!s) return { status: 404, body: { error: 'unknown session' } };
      const evs = this.events.get(sid) ?? [];
      if (s.status === 'abandoned' || evs.some((e) => e.event_type === 'SESSION_END' && e.action === 'abandoned')) {
        return { status: 409, body: { error: 'abandoned' } };
      }
      if (!evs.length) return { status: 422, body: { error: 'no telemetry' } };
      s.status = 'completed';
      s.duration_ms = (body?.duration_ms as number) ?? null;
      return { status: 200, body: { ...reports.full, session_id: sid } };
    }
    if ((m = path.match(/^\/api\/sessions\/([^/]+)\/abandon$/)) && method === 'POST') {
      const sid = decodeURIComponent(m[1]);
      const s = this.sessions.get(sid);
      if (!s) return { status: 404, body: { error: 'unknown session' } };
      if (s.status === 'completed') return { status: 409, body: { error: 'completed' } };
      s.status = 'abandoned';
      return { status: 200, body: { session_id: sid, status: 'abandoned' } };
    }
    if ((m = path.match(/^\/api\/sessions\/([^/]+)\/report$/)) && method === 'GET') {
      const s = this.sessions.get(decodeURIComponent(m[1]));
      if (!s) return { status: 404, body: { error: 'unknown' } };
      if (s.status !== 'completed') return { status: 409, body: { error: 'not completed' } };
      return { status: 200, body: { ...reports.full, session_id: s.session_id } };
    }
    if ((m = path.match(/^\/api\/sessions\/([^/]+)$/)) && method === 'GET') {
      const s = this.sessions.get(decodeURIComponent(m[1]));
      return s ? { status: 200, body: s } : { status: 404, body: { error: 'unknown' } };
    }
    return { status: 404, body: { error: 'not found' } };
  }

  /** Simulate a wiped server database (e.g. demo server reset). */
  wipe(): void {
    this.players = [];
    this.sessions.clear();
    this.events.clear();
    this.idem.clear();
  }
}
