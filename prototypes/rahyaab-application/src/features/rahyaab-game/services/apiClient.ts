/**
 * Centralised HTTP client for the RahYaab Flask API.
 *
 * * base URL comes from host configuration (never hard-coded); HTTPS is required unless the host explicitly allows
 *   plain HTTP (local network demos only);
 * * every request has a timeout (AbortController) and is classified as retryable or not;
 * * host authentication headers are injected per request (`getAuthHeaders`), the module never stores credentials;
 * * client writes carry an Idempotency-Key so retries can never duplicate data on the server;
 * * responses are validated against the typed contracts in types/api.ts.
 */
import {
  ApiContractError,
  AssessmentReport,
  CreateSessionRequest,
  parseInserted,
  parsePlayer,
  parseReport,
  parseSession,
  Player,
  Session,
  UploadEvent,
} from '../types/api';

export interface ApiClientConfig {
  /** e.g. https://rahyaab.example.org (no /api suffix). */
  baseUrl: string;
  timeoutMs?: number;
  /** Host app auth (e.g. a bearer token for the signed-in student). Called before every request. */
  getAuthHeaders?: () => Record<string, string> | Promise<Record<string, string>>;
  /** Allow http:// (local network demos / emulator only). Never enable in a production build. */
  allowInsecureHttp?: boolean;
  fetchImpl?: typeof fetch;
}

export class ApiNetworkError extends Error {
  constructor(
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'ApiNetworkError';
  }
}

export class ApiHttpError extends Error {
  constructor(
    readonly status: number,
    readonly serverMessage: string,
    readonly path: string,
  ) {
    super(`HTTP ${status} for ${path}: ${serverMessage}`);
    this.name = 'ApiHttpError';
  }
}

/** Network failures, timeouts, 408, 429 and 5xx are worth retrying; contract violations and 4xx are not. */
export function isRetryable(err: unknown): boolean {
  if (err instanceof ApiNetworkError) return true;
  if (err instanceof ApiHttpError) return err.status === 408 || err.status === 429 || err.status >= 500;
  return false;
}

export class ApiClient {
  private readonly base: string;
  private readonly timeoutMs: number;
  private readonly fetchImpl: typeof fetch;

  constructor(private readonly cfg: ApiClientConfig) {
    const base = (cfg.baseUrl || '').trim().replace(/\/+$/, '');
    if (!/^https?:\/\//i.test(base)) throw new Error('RahYaab apiBaseUrl must start with https://');
    if (/^http:\/\//i.test(base) && !cfg.allowInsecureHttp) {
      throw new Error('RahYaab apiBaseUrl must use https:// (set allowInsecureHttp only for local demos)');
    }
    this.base = base;
    this.timeoutMs = cfg.timeoutMs ?? 15000;
    const f = cfg.fetchImpl ?? (globalThis.fetch as typeof fetch | undefined);
    if (!f) throw new Error('fetch is not available');
    // Never call fetch as a method of this object: browsers throw "Illegal invocation" when fetch's `this` is not
    // the global object (React Native's polyfill tolerates it, which hides the bug on devices).
    this.fetchImpl = ((input: RequestInfo | URL, init?: RequestInit) => f.call(globalThis, input, init)) as typeof fetch;
  }

  get baseUrl(): string {
    return this.base;
  }

  private async request(method: 'GET' | 'POST', path: string, body?: unknown, idempotencyKey?: string): Promise<unknown> {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;
    if (this.cfg.getAuthHeaders) Object.assign(headers, await this.cfg.getAuthHeaders());

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    let res: Response;
    try {
      res = await this.fetchImpl(`${this.base}/api${path}`, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: controller.signal,
      });
    } catch (e) {
      const timedOut = controller.signal.aborted;
      throw new ApiNetworkError(timedOut ? `request timed out after ${this.timeoutMs} ms` : 'network request failed', e);
    } finally {
      clearTimeout(timer);
    }
    let text: string;
    try {
      text = await res.text();
    } catch (e) {
      throw new ApiNetworkError('connection lost while reading the response', e);
    }
    let data: unknown = null;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        if (res.ok) throw new ApiContractError(`${path} did not return JSON`);
      }
    }
    if (!res.ok) {
      const msg =
        data && typeof data === 'object' && typeof (data as Record<string, unknown>).error === 'string'
          ? ((data as Record<string, unknown>).error as string)
          : res.statusText || 'request failed';
      throw new ApiHttpError(res.status, msg, path);
    }
    return data;
  }

  async health(): Promise<{ status: string }> {
    const d = await this.request('GET', '/health');
    if (!d || typeof d !== 'object') throw new ApiContractError('/health');
    return d as { status: string };
  }

  async createPlayer(name: string, idempotencyKey?: string): Promise<Player> {
    return parsePlayer(await this.request('POST', '/players', { name }, idempotencyKey));
  }

  async createSession(req: CreateSessionRequest, idempotencyKey?: string): Promise<Session> {
    return parseSession(await this.request('POST', '/sessions', req, idempotencyKey));
  }

  async getSession(sessionId: string): Promise<Session> {
    return parseSession(await this.request('GET', `/sessions/${encodeURIComponent(sessionId)}`));
  }

  async postEvents(sessionId: string, events: UploadEvent[], idempotencyKey: string): Promise<number> {
    return parseInserted(await this.request('POST', `/sessions/${encodeURIComponent(sessionId)}/events`, { events }, idempotencyKey));
  }

  async complete(sessionId: string, durationMs: number): Promise<AssessmentReport> {
    return parseReport(await this.request('POST', `/sessions/${encodeURIComponent(sessionId)}/complete`, { duration_ms: durationMs }));
  }

  async getReport(sessionId: string): Promise<AssessmentReport> {
    return parseReport(await this.request('GET', `/sessions/${encodeURIComponent(sessionId)}/report`));
  }

  async abandon(sessionId: string, durationMs: number): Promise<{ session_id: string; status: string }> {
    const d = await this.request('POST', `/sessions/${encodeURIComponent(sessionId)}/abandon`, { duration_ms: durationMs });
    if (!d || typeof d !== 'object') throw new ApiContractError('/abandon');
    return d as { session_id: string; status: string };
  }
}
