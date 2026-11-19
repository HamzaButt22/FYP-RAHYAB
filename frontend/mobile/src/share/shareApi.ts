// The calls behind S-14 (docs/api/openapi.yaml: GET /results/latest, GET/POST /share-links,
// DELETE /share-links/{linkId}). Each returns data or one ShareProblem the screen can word.

import { deleteJson, getJson, postJson, type ApiResult } from '../api/client';
import { getAccessToken } from '../state/session';
import { shareProblem, type LinkRow, type NewLink, type ShareProblem, type ShareResult } from './share';

export type Outcome<T> = { ok: true; data: T } | { ok: false; problem: ShareProblem };

async function call<T>(send: (token: string) => Promise<ApiResult<T>>): Promise<Outcome<T>> {
  const access = await getAccessToken();
  if (!access.ok) return { ok: false, problem: access.reason };
  const r = await send(access.token);
  return r.ok ? { ok: true, data: r.data } : { ok: false, problem: shareProblem(r) };
}

/** The newest stored result (404: none yet, so there is nothing to share). */
export function loadLatestResult(): Promise<Outcome<ShareResult>> {
  return call((accessToken) => getJson<ShareResult>('/results/latest', { accessToken }));
}

export function listLinks(): Promise<Outcome<LinkRow[]>> {
  return call((accessToken) => getJson<LinkRow[]>('/share-links', { accessToken }));
}

/** A report link to this result; the URL with its token comes back only now. */
export function createLink(resultId: string): Promise<Outcome<NewLink>> {
  return call((accessToken) =>
    postJson<NewLink>('/share-links', { scope: 'report', recommendation_id: resultId }, { accessToken })
  );
}

export function turnOffLink(linkId: string): Promise<Outcome<null>> {
  return call((accessToken) => deleteJson(`/share-links/${encodeURIComponent(linkId)}`, { accessToken }));
}
