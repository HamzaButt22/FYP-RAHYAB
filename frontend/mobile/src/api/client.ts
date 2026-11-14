// A small JSON client for the Rahyaab API (docs/api/openapi.yaml). Errors come back as RFC 9457
// problem+json with stable codes and field `errors[]` (docs/api/README.md §2); the app shows its own
// translated text for each code and never displays server text.

// Development: the computer's API through `adb reverse tcp:8000 tcp:8000` (python tools/dev.py up runs it).
// The same address works on the emulator and on a USB phone. The emulator's 10.0.2.2 alias cannot reach
// Docker's port, which listens on 127.0.0.1 only so the API is never exposed to the local network.
const DEFAULT_DEV_URL = 'http://localhost:8000/v1';
const TIMEOUT_MS = 15_000;

export function apiBaseUrl(): string {
  const configured = process.env.EXPO_PUBLIC_API_URL;
  if (configured) return configured.replace(/\/$/, '');
  if (__DEV__) return DEFAULT_DEV_URL;
  throw new Error('EXPO_PUBLIC_API_URL must be set for release builds');
}

export type FieldError = { field: string; code: string };

export type ApiResult<T> =
  | { ok: true; status: number; data: T }
  | { ok: false; kind: 'offline' }
  | {
      ok: false;
      kind: 'problem';
      status: number;
      code: string;
      errors: FieldError[];
      retryAfterSeconds: number | null;
    };

type Options = { accessToken?: string };

export async function postJson<T>(path: string, body: unknown, options: Options = {}): Promise<ApiResult<T>> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl()}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json, application/problem+json',
        ...(options.accessToken ? { Authorization: `Bearer ${options.accessToken}` } : {}),
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch {
    return { ok: false, kind: 'offline' }; // no network, server unreachable, or the timeout
  } finally {
    clearTimeout(timer);
  }

  const json: unknown = await response.json().catch(() => null);
  if (response.ok) return { ok: true, status: response.status, data: json as T };

  const problem = (json ?? {}) as { code?: unknown; errors?: unknown };
  const errors = Array.isArray(problem.errors)
    ? problem.errors
        .filter((e): e is FieldError => typeof e?.field === 'string' && typeof e?.code === 'string')
        .map(({ field, code }) => ({ field, code }))
    : [];
  const retryAfter = Number(response.headers.get('Retry-After'));
  return {
    ok: false,
    kind: 'problem',
    status: response.status,
    code: typeof problem.code === 'string' ? problem.code : 'server_error',
    errors,
    retryAfterSeconds: Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : null,
  };
}
