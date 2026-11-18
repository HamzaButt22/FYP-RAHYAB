// The dashboard's API client (docs/api/openapi.yaml). The session is an HttpOnly cookie set by the API, so
// this code never sees it: every call sends `credentials: 'include'`, and changes also send the CSRF token
// from GET /auth/staff/me. Errors are RFC 9457 problem+json; screens show them through `errorKey`.

export const API_URL: string = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:8000';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    readonly fieldCodes: Record<string, string> = {},
    readonly retryAfter = 0,
  ) {
    super(code);
  }
}

type Options = { method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'; body?: unknown; csrf?: string };

export async function api<T>(path: string, { method = 'GET', body, csrf }: Options = {}, fetcher: typeof fetch = fetch): Promise<T> {
  const headers: Record<string, string> = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (csrf) headers['X-CSRF-Token'] = csrf;
  let response: Response;
  try {
    response = await fetcher(`${API_URL}/v1${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      credentials: 'include',
    });
  } catch {
    throw new ApiError(0, 'network');
  }
  if (response.ok) {
    return (response.status === 204 ? undefined : await response.json()) as T;
  }
  let problem: { code?: string; errors?: { field: string; code: string }[] } = {};
  try {
    problem = await response.json();
  } catch {
    // not JSON (a proxy error page): fall back to the status
  }
  const fieldCodes = Object.fromEntries((problem.errors ?? []).map((e) => [e.field, e.code]));
  const retryAfter = Number(response.headers.get('Retry-After') ?? 0) || 0;
  throw new ApiError(response.status, problem.code ?? `http_${response.status}`, fieldCodes, retryAfter);
}

/** The message key for an error from the sign-in screens (all in messages/en.json under auth.errors). */
export function errorKey(error: unknown, field?: string): string {
  if (!(error instanceof ApiError)) return 'auth.errors.generic';
  if (field && error.fieldCodes[field]) return `auth.errors.${error.fieldCodes[field]}`;
  const known = ['sign_in_failed', 'mfa_failed', 'challenge_expired', 'rate_limited', 'reset_link_invalid', 'mfa_setup_needed', 'network'];
  if (known.includes(error.code)) return `auth.errors.${error.code}`;
  if (error.status === 422) return 'auth.errors.check_fields';
  return 'auth.errors.generic';
}

/** Minutes to wait after a 429, rounded up, at least 1. */
export function waitMinutes(error: unknown): number {
  return error instanceof ApiError ? Math.max(1, Math.ceil(error.retryAfter / 60)) : 1;
}

// ------------------------------------------------------------------------------- staff sign-in calls
export type Me = { email: string; role: string; school_id: string | null; csrf_token: string };
export type Challenge = { mfa_challenge_id: string; mfa_setup_required: boolean };
export type Setup = { setup_key: string; otpauth_uri: string };

export const staffAuth = {
  me: () => api<Me>('/auth/staff/me'),
  login: (email: string, password: string) => api<Challenge>('/auth/staff/login', { method: 'POST', body: { email, password } }),
  setup: (challenge: string) => api<Setup>('/auth/staff/mfa/setup', { method: 'POST', body: { mfa_challenge_id: challenge } }),
  verify: (challenge: string, code: string) =>
    api<void>('/auth/staff/mfa', { method: 'POST', body: { mfa_challenge_id: challenge, code } }),
  logout: (csrf: string) => api<void>('/auth/staff/logout', { method: 'POST', csrf }),
  requestReset: (email: string) => api<{ message_key: string }>('/auth/staff/password-reset', { method: 'POST', body: { email } }),
  confirmReset: (token: string, newPassword: string) =>
    api<void>('/auth/staff/password-reset:confirm', { method: 'POST', body: { token, new_password: newPassword } }),
};

// ------------------------------------------------------------------------------------ small helpers
/** The reset or invite token from a link like /reset#token=Ab3..., or null. */
export function tokenFromHash(hash: string): string | null {
  const match = /^#token=([0-9A-Za-z]{22})$/.exec(hash);
  return match ? match[1] : null;
}

/** Digits only, at most 6 (people paste "123 456"). */
export function cleanCode(value: string): string {
  return value.replace(/\D/g, '').slice(0, 6);
}

/** The setup key in groups of four, easier to type: ABCD EFGH ... */
export function groupKey(key: string): string {
  return key.replace(/(.{4})(?=.)/g, '$1 ');
}

export function looksLikeEmail(value: string): boolean {
  return /^[^@\s]{1,64}@[^@\s]{1,189}\.[^@\s]{2,63}$/.test(value.trim());
}
