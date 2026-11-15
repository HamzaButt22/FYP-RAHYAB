// Fetching the top-3 result: upload any waiting events first (so the newest play counts), then ask the
// server to compute. The server returns the stored result when nothing changed, so asking again is cheap.

import { getJson, postJson } from '../api/client';
import { getAccessToken } from '../state/session';
import { syncNow } from '../sync/runtime';
import { stateFromProblem, type Evidence, type Recommendation, type ResultState } from './format';

export async function computeResult(): Promise<ResultState> {
  try {
    await syncNow(); // best effort: a failed upload still lets the server answer from what it has
  } catch {
    // the outbox could not be opened; the result is computed from what the server already has
  }
  const access = await getAccessToken();
  if (!access.ok) return { kind: access.reason === 'offline' ? 'offline' : 'signed_out' };
  const r = await postJson<Recommendation>('/results/compute', {}, { accessToken: access.token });
  if (r.ok) return { kind: 'ready', result: r.data };
  if (r.kind === 'offline') return { kind: 'offline' };
  return stateFromProblem(r.status, r.code, r.errors[0]?.code);
}

export async function fetchEvidence(resultId: string): Promise<Evidence | null> {
  const access = await getAccessToken();
  if (!access.ok) return null;
  const r = await getJson<Evidence>(`/results/${encodeURIComponent(resultId)}/why`, { accessToken: access.token });
  return r.ok ? r.data : null;
}
