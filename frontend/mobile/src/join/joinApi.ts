// Joining a class (POST /v1/auth/student/join) and claiming a consent slip (POST /v1/consents:claim),
// with every server answer turned into something the screens can explain (forms-and-errors.md §2, §4).

import Constants from 'expo-constants';

import { postJson, type ApiResult } from '@/api/client';
import { getAccessToken, saveConsentState, saveTokens, type Session, type TokenPair } from '@/state/session';
import { deviceInfo, getOrCreateKey } from '../../modules/device-key';

export type JoinField = 'class_code' | 'nickname' | 'grade' | 'birth_year' | 'birth_month';
const JOIN_FIELDS: readonly string[] = ['class_code', 'nickname', 'grade', 'birth_year', 'birth_month'];

export type JoinForm = {
  classCode: string;
  nickname: string;
  grade: number;
  birthYear: number;
  birthMonth: number;
  lang: 'en' | 'ur';
};

/** Answers shared by joining and claiming. */
type CommonOutcome =
  | { kind: 'code_not_accepted' } // deliberately vague: unknown, expired or paused (NFR-74)
  | { kind: 'school_inactive' }
  | { kind: 'too_many'; minutes: number }
  | { kind: 'offline' }
  | { kind: 'failed' }; // the server's fault or an app bug: try again later

export type JoinOutcome =
  | { kind: 'joined'; session: Session }
  | { kind: 'fields'; errors: { field: JoinField; code: string }[] }
  | { kind: 'age_stop' }
  | CommonOutcome;

export type ClaimOutcome =
  | { kind: 'granted' }
  | { kind: 'format' }
  | { kind: 'signed_out' }
  | CommonOutcome;

function common(result: Exclude<ApiResult<unknown>, { ok: true }>): CommonOutcome {
  if (result.kind === 'offline') return { kind: 'offline' };
  if (result.status === 404 && result.code === 'code_not_accepted') return { kind: 'code_not_accepted' };
  if (result.status === 403 && result.code === 'school_access_inactive') return { kind: 'school_inactive' };
  if (result.status === 429) {
    return { kind: 'too_many', minutes: Math.max(1, Math.ceil((result.retryAfterSeconds ?? 60) / 60)) };
  }
  return { kind: 'failed' };
}

export async function joinClass(form: JoinForm): Promise<JoinOutcome> {
  let key: { publicKey: string };
  let device: { ramClass: 'low' | 'mid' | 'high'; osMajor: number };
  try {
    key = await getOrCreateKey(); // the same key on every retry, so the server's per-device limit counts them
    device = deviceInfo();
  } catch {
    return { kind: 'failed' };
  }
  const result = await postJson<TokenPair>('/auth/student/join', {
    class_code: form.classCode,
    grade: form.grade,
    birth_year: form.birthYear,
    birth_month: form.birthMonth,
    nickname: form.nickname,
    lang: form.lang,
    device: {
      device_tier: device.ramClass,
      os_major: device.osMajor,
      app_version: Constants.expoConfig?.version ?? '0.0.0',
      public_key: key.publicKey,
    },
  });
  if (result.ok) return { kind: 'joined', session: await saveTokens(result.data) };
  if (result.kind === 'problem' && result.status === 422) {
    if (result.code === 'age_out_of_range') return { kind: 'age_stop' };
    const errors = result.errors.filter((e): e is { field: JoinField; code: string } =>
      JOIN_FIELDS.includes(e.field),
    );
    // Errors in fields the student cannot see (device.*) are an app bug, not something to fix by hand.
    return errors.length === result.errors.length && errors.length > 0 ? { kind: 'fields', errors } : { kind: 'failed' };
  }
  return common(result);
}

export async function claimSlip(claimCode: string): Promise<ClaimOutcome> {
  const access = await getAccessToken();
  if (!access.ok) return { kind: access.reason === 'offline' ? 'offline' : 'signed_out' };
  const result = await postJson<{ consent_state: 'granted' }>(
    '/consents:claim',
    { claim_code: claimCode },
    { accessToken: access.token },
  );
  if (result.ok) {
    await saveConsentState('granted');
    return { kind: 'granted' };
  }
  if (result.kind === 'problem' && result.status === 422) return { kind: 'format' };
  if (result.kind === 'problem' && result.status === 401) return { kind: 'signed_out' };
  return common(result);
}
