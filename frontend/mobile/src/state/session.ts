// The student's sign-in (ADR-0011). The refresh token lives in the Keystore-backed secure store; the
// 15-minute access token only in memory. Neither works on another phone: every refresh is signed with
// this phone's device key (modules/device-key).

import * as SecureStore from 'expo-secure-store';

import { postJson } from '@/api/client';
import { signRefresh } from '../../modules/device-key';

export type ConsentState = 'pending' | 'granted' | 'withdrawn';

export type TokenPair = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  student_id: string;
  consent_state: ConsentState;
};

export type Session = { studentId: string; consentState: ConsentState };

const KEYS = {
  refreshToken: 'session.refresh_token',
  studentId: 'session.student_id',
  consentState: 'session.consent_state',
} as const;

let access: { token: string; expiresAt: number } | null = null;

export async function saveTokens(pair: TokenPair): Promise<Session> {
  await SecureStore.setItemAsync(KEYS.refreshToken, pair.refresh_token);
  await SecureStore.setItemAsync(KEYS.studentId, pair.student_id);
  await SecureStore.setItemAsync(KEYS.consentState, pair.consent_state);
  // Refresh a minute early so a request never leaves with a token about to expire.
  access = { token: pair.access_token, expiresAt: Date.now() + (pair.expires_in - 60) * 1000 };
  return { studentId: pair.student_id, consentState: pair.consent_state };
}

export async function saveConsentState(state: ConsentState): Promise<void> {
  await SecureStore.setItemAsync(KEYS.consentState, state);
}

export async function loadSession(): Promise<Session | null> {
  try {
    const studentId = await SecureStore.getItemAsync(KEYS.studentId);
    const consent = await SecureStore.getItemAsync(KEYS.consentState);
    if (!studentId || !(await SecureStore.getItemAsync(KEYS.refreshToken))) return null;
    const consentState: ConsentState = consent === 'granted' || consent === 'withdrawn' ? consent : 'pending';
    return { studentId, consentState };
  } catch {
    // A phone restored from a backup cannot decrypt these values (the Keystore key stayed behind).
    await clearSession();
    return null;
  }
}

export async function clearSession(): Promise<void> {
  access = null;
  await Promise.all(Object.values(KEYS).map((key) => SecureStore.deleteItemAsync(key)));
}

export type AccessResult = { ok: true; token: string } | { ok: false; reason: 'offline' | 'signed_out' };

let refreshing: Promise<AccessResult> | null = null;

/** A valid access token, refreshing it (signed with the device key) when needed. */
export function getAccessToken(): Promise<AccessResult> {
  if (access && access.expiresAt > Date.now()) return Promise.resolve({ ok: true, token: access.token });
  refreshing ??= refresh().finally(() => {
    refreshing = null;
  });
  return refreshing;
}

async function refresh(): Promise<AccessResult> {
  const refreshToken = await SecureStore.getItemAsync(KEYS.refreshToken);
  if (!refreshToken) return { ok: false, reason: 'signed_out' };
  const signature = await signRefresh(refreshToken);
  const result = await postJson<TokenPair>('/auth/refresh', { refresh_token: refreshToken, signature });
  if (result.ok) {
    await saveTokens(result.data);
    return { ok: true, token: result.data.access_token };
  }
  if (result.kind === 'offline' || result.status >= 500 || result.status === 429) {
    // Keep the old refresh token: the server allows one retry with it after a lost response (ADR-0011).
    return { ok: false, reason: 'offline' };
  }
  await clearSession(); // 401: revoked, expired or signed by another key; the student joins again
  return { ok: false, reason: 'signed_out' };
}
