import { describe, expect, it } from 'vitest';

import { API_URL, ApiError, api, cleanCode, errorKey, groupKey, looksLikeEmail, tokenFromHash, waitMinutes } from './api';
import { lookup } from './i18n';

function fakeFetch(status: number, body: unknown, headers: Record<string, string> = {}) {
  const calls: { url: string; init: RequestInit }[] = [];
  const fetcher = (async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    return new Response(status === 204 ? null : JSON.stringify(body), { status, headers });
  }) as unknown as typeof fetch;
  return { fetcher, calls };
}

describe('api client', () => {
  it('sends the cookie, JSON and the CSRF token', async () => {
    const { fetcher, calls } = fakeFetch(200, { ok: true });
    await api('/auth/staff/logout', { method: 'POST', body: { a: 1 }, csrf: 'tok' }, fetcher);
    expect(calls[0].url).toBe(`${API_URL}/v1/auth/staff/logout`);
    expect(calls[0].init.credentials).toBe('include');
    expect(calls[0].init.headers).toEqual({ 'Content-Type': 'application/json', 'X-CSRF-Token': 'tok' });
    expect(calls[0].init.body).toBe('{"a":1}');
  });

  it('returns nothing for 204', async () => {
    const { fetcher } = fakeFetch(204, null);
    await expect(api('/x', { method: 'POST' }, fetcher)).resolves.toBeUndefined();
  });

  it('turns problem+json into an ApiError with field codes and the wait time', async () => {
    const { fetcher } = fakeFetch(
      422,
      { code: 'validation_error', errors: [{ field: 'new_password', code: 'common' }] },
      { 'Retry-After': '120' },
    );
    const error = await api('/x', {}, fetcher).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).fieldCodes).toEqual({ new_password: 'common' });
    expect(errorKey(error, 'new_password')).toBe('auth.errors.common');
    expect(waitMinutes(new ApiError(429, 'rate_limited', {}, 61))).toBe(2);
  });

  it('reports a network failure as its own error', async () => {
    const fetcher = (async () => {
      throw new TypeError('Failed to fetch');
    }) as unknown as typeof fetch;
    const error = await api('/x', {}, fetcher).catch((e: unknown) => e);
    expect(errorKey(error)).toBe('auth.errors.network');
  });
});

describe('sign-in helpers', () => {
  it('reads the token from a reset link and nothing else', () => {
    const sample = 'Ab3'.repeat(7) + 'x'; // 22 characters, like a real link token (built, so it can't look like a secret)
    expect(tokenFromHash(`#token=${sample}`)).toBe(sample);
    expect(tokenFromHash('#token=short')).toBeNull();
    expect(tokenFromHash(`#token=${sample}&x=1`)).toBeNull();
    expect(tokenFromHash('')).toBeNull();
  });

  it('cleans pasted codes and groups setup keys', () => {
    expect(cleanCode(' 123 456 ')).toBe('123456');
    expect(cleanCode('1234567')).toBe('123456');
    expect(groupKey('ABCDEFGHIJ')).toBe('ABCD EFGH IJ');
  });

  it('checks email shape only', () => {
    expect(looksLikeEmail('sana@ggfhs.edu.pk')).toBe(true);
    expect(looksLikeEmail('sana@')).toBe(false);
  });

  it('has an English message for every error the screens can show', () => {
    const codes = ['sign_in_failed', 'mfa_failed', 'challenge_expired', 'rate_limited', 'reset_link_invalid', 'mfa_setup_needed',
      'network', 'generic', 'check_fields', 'too_short', 'too_long', 'common', 'contains_email', 'mismatch', 'email', 'code'];
    for (const code of codes) expect(lookup(`auth.errors.${code}`, { minutes: 2 })).not.toBe(`auth.errors.${code}`);
    expect(errorKey(new ApiError(401, 'sign_in_failed'))).toBe('auth.errors.sign_in_failed');
    expect(errorKey(new ApiError(500, 'internal_error'))).toBe('auth.errors.generic');
    expect(errorKey(new Error('x'))).toBe('auth.errors.generic');
  });
});
