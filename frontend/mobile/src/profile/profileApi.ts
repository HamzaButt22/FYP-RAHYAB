// Reading and saving the profile (GET / PATCH /v1/me/profile). The last profile the server sent is kept in
// the encrypted local database, so Home can ask for the group without going online.

import { getJson, patchJson } from '../api/client';
import { getAccessToken } from '../state/session';
import type { Details, Profile } from './profile';

type Kv = { get<T>(key: string): T | null; set(key: string, value: unknown): void };

export type LoadResult =
  | { kind: 'ready'; profile: Profile }
  | { kind: 'offline' }
  | { kind: 'signed_out' }
  | { kind: 'problem' };

export type SaveResult = LoadResult | { kind: 'invalid'; field: string; code: string };

const cacheKey = (studentId: string) => `profile:${studentId}`;

export function cachedProfile(kv: Kv, studentId: string): Profile | null {
  return kv.get<Profile>(cacheKey(studentId));
}

export async function loadProfile(kv: Kv, studentId: string): Promise<LoadResult> {
  const access = await getAccessToken();
  if (!access.ok) return { kind: access.reason === 'offline' ? 'offline' : 'signed_out' };
  const r = await getJson<Profile>('/me/profile', { accessToken: access.token });
  if (r.ok) {
    kv.set(cacheKey(studentId), r.data);
    return { kind: 'ready', profile: r.data };
  }
  return r.kind === 'offline' ? { kind: 'offline' } : { kind: 'problem' };
}

export async function saveDetails(kv: Kv, studentId: string, patch: Partial<Details>): Promise<SaveResult> {
  const access = await getAccessToken();
  if (!access.ok) return { kind: access.reason === 'offline' ? 'offline' : 'signed_out' };
  const r = await patchJson<Profile>('/me/profile', patch, { accessToken: access.token });
  if (r.ok) {
    kv.set(cacheKey(studentId), r.data);
    return { kind: 'ready', profile: r.data };
  }
  if (r.kind === 'offline') return { kind: 'offline' };
  const first = r.errors[0];
  return r.status === 422 && first ? { kind: 'invalid', field: first.field, code: first.code } : { kind: 'problem' };
}
