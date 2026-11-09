import reports from '../fixtures/reports.json';
import { ApiClient, ApiHttpError, ApiNetworkError, isRetryable } from '../../services/apiClient';
import { ApiContractError, parseReport } from '../../types/api';

type Call = { url: string; init: RequestInit };

function mockFetch(responder: (call: Call) => Promise<Response> | Response) {
  const calls: Call[] = [];
  const fn = jest.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
    const call = { url: String(url), init: init ?? {} };
    calls.push(call);
    return responder(call);
  });
  return { fn: fn as unknown as typeof fetch, calls };
}

const json = (status: number, body: unknown, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...headers } });

const client = (f: typeof fetch, extra: Partial<ConstructorParameters<typeof ApiClient>[0]> = {}) =>
  new ApiClient({ baseUrl: 'https://api.example.org/', fetchImpl: f, timeoutMs: 200, ...extra });

describe('ApiClient', () => {
  it('posts JSON with auth and idempotency headers to the right URL', async () => {
    const m = mockFetch(() => json(201, { player_id: 7, name: 'Kid', created_at: 'x', is_demo: 0 }));
    const api = client(m.fn, { getAuthHeaders: async () => ({ Authorization: 'Bearer abc' }) });
    const p = await api.createPlayer('Kid', 'local-1:player');
    expect(p.player_id).toBe(7);
    expect(m.calls[0].url).toBe('https://api.example.org/api/players');
    const h = m.calls[0].init.headers as Record<string, string>;
    expect(h.Authorization).toBe('Bearer abc');
    expect(h['Idempotency-Key']).toBe('local-1:player');
    expect(h['Content-Type']).toBe('application/json');
    expect(JSON.parse(m.calls[0].init.body as string)).toEqual({ name: 'Kid' });
  });

  it('uploads events and parses the inserted count', async () => {
    const m = mockFetch(() => json(201, { inserted: 2 }));
    const n = await client(m.fn).postEvents('S1', [{ event_type: 'X' } as never, { event_type: 'Y' } as never], 'S1:0-1');
    expect(n).toBe(2);
    expect(m.calls[0].url).toBe('https://api.example.org/api/sessions/S1/events');
  });

  it('calls fetch with the global object as `this` (browsers throw "Illegal invocation" otherwise)', async () => {
    const strictFetch = function (this: unknown) {
      if (this !== globalThis && this !== undefined) throw new TypeError("Failed to execute 'fetch' on 'Window': Illegal invocation");
      return Promise.resolve(json(200, { status: 'ok' }));
    } as unknown as typeof fetch;
    await expect(client(strictFetch).health()).resolves.toEqual({ status: 'ok' });
  });

  it('url-encodes session ids', async () => {
    const m = mockFetch(() => json(200, { session_id: 'a/b', status: 'abandoned' }));
    await client(m.fn).abandon('a/b', 10);
    expect(m.calls[0].url).toBe('https://api.example.org/api/sessions/a%2Fb/abandon');
  });

  it('times out hanging requests as a retryable network error', async () => {
    const m = mockFetch(
      (call) =>
        new Promise((_, reject) => {
          call.init.signal?.addEventListener('abort', () => reject(Object.assign(new Error('aborted'), { name: 'AbortError' })));
        }),
    );
    const err = await client(m.fn, { timeoutMs: 30 }).health().catch((e) => e);
    expect(err).toBeInstanceOf(ApiNetworkError);
    expect(isRetryable(err)).toBe(true);
  });

  it('classifies HTTP errors', async () => {
    for (const [status, retry] of [
      [500, true],
      [503, true],
      [429, true],
      [408, true],
      [400, false],
      [401, false],
      [409, false],
      [422, false],
    ] as [number, boolean][]) {
      const m = mockFetch(() => json(status, { error: `boom ${status}` }));
      const err = await client(m.fn).health().catch((e) => e);
      expect(err).toBeInstanceOf(ApiHttpError);
      expect((err as ApiHttpError).status).toBe(status);
      expect((err as ApiHttpError).serverMessage).toBe(`boom ${status}`);
      expect(isRetryable(err)).toBe(retry);
    }
  });

  it('treats a non-JSON body as a contract error, not a crash', async () => {
    const m = mockFetch(() => new Response('<html>proxy</html>', { status: 200 }));
    await expect(client(m.fn).health()).rejects.toBeInstanceOf(ApiContractError);
  });

  it('refuses plain http unless explicitly allowed (production safety)', () => {
    expect(() => new ApiClient({ baseUrl: 'http://192.168.1.5:5000', fetchImpl: fetch })).toThrow(/https/);
    expect(() => new ApiClient({ baseUrl: 'http://192.168.1.5:5000', fetchImpl: fetch, allowInsecureHttp: true })).not.toThrow();
    expect(() => new ApiClient({ baseUrl: 'ftp://x', fetchImpl: fetch, allowInsecureHttp: true })).toThrow();
  });

  it('validates the completion report against the real backend contract', async () => {
    const m = mockFetch(() => json(200, reports.full));
    const r = await client(m.fn).complete('S1', 1234);
    expect(r.has_bigfive).toBe(true);
    expect(r.result.scores.openness).toBeGreaterThanOrEqual(0);
    expect(JSON.parse(m.calls[0].init.body as string)).toEqual({ duration_ms: 1234 });
  });
});

describe('parseReport', () => {
  it('accepts every real backend report', () => {
    for (const r of Object.values(reports)) expect(() => parseReport(r)).not.toThrow();
    expect(parseReport(reports.career).has_bigfive).toBe(false);
    expect(parseReport(reports.career).riasec?.holland_code).toBe('ASI');
    expect(parseReport(reports.original).riasec).toBeNull();
  });

  it('rejects out-of-range or missing scores', () => {
    const bad = JSON.parse(JSON.stringify(reports.full));
    bad.result.scores.openness = 140;
    expect(() => parseReport(bad)).toThrow(ApiContractError);
    const bad2 = JSON.parse(JSON.stringify(reports.career));
    bad2.riasec = null;
    expect(() => parseReport(bad2)).toThrow(/neither/);
  });
});
