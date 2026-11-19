// Share with family (S-14; FR-66, RFC-0004): the student makes a link to their stored result, sends it, and
// can turn it off. The server sends codes, never text; this file turns its answers into the screen's states
// and describes each link. Pure functions, tested with `pnpm test` (TC-SHARE-11, TC-SHARE-12).

import type { ApiResult } from '../api/client';
import type { Band } from '../results/format';

/** The parts of the latest result (GET /results/latest, Recommendation) that the preview needs. */
export interface ShareResult {
  id: string;
  ranked: { stream_id: string; fit_band: Band; plan_b: string[] }[];
}

/** POST /share-links (ShareLink): the URL carries the token and comes back only this once. */
export interface NewLink {
  id: string;
  url: string;
  expires_at: string;
}

/** GET /share-links: no tokens, only what the student needs to see views and turn links off. */
export interface LinkRow {
  id: string;
  scope: 'report' | 'consent';
  expires_at: string;
  revoked: boolean;
  views: number;
}

export const PROBLEMS = ['no_result', 'consent', 'offline', 'rate_limited', 'signed_out', 'error'] as const;
export type ShareProblem = (typeof PROBLEMS)[number];

type Failed = Extract<ApiResult<unknown>, { ok: false }>;

/** One wordable problem for each failed answer. Field errors (422) mean the app sent something wrong,
 * which the student cannot fix, so they get the general message. */
export function shareProblem(r: Failed): ShareProblem {
  if (r.kind === 'offline') return 'offline';
  if (r.status === 401) return 'signed_out';
  if (r.status === 403 && r.code === 'consent_required') return 'consent';
  if (r.status === 404) return 'no_result';
  if (r.status === 429) return 'rate_limited';
  return 'error';
}

export type LinkStatus = 'active' | 'expired' | 'revoked';

export interface LinkView {
  id: string;
  status: LinkStatus;
  /** Whole days left, rounded to the nearest day (a phone clock a few minutes off the server's must not turn
   * a new link's 30 into 31), never below 1 while the link works; active links only. */
  daysLeft: number | null;
  views: number;
  canTurnOff: boolean;
}

const DAY_MS = 86_400_000;
const ORDER: Record<LinkStatus, number> = { active: 0, revoked: 1, expired: 2 };

/** Active links first (the longest-lasting on top), then turned-off, then expired ones. */
export function describeLinks(rows: LinkRow[], now: Date): LinkView[] {
  return rows
    .map((row) => {
      const expires = Date.parse(row.expires_at);
      const left = Number.isFinite(expires) ? expires - now.getTime() : 0;
      const status: LinkStatus = row.revoked ? 'revoked' : left > 0 ? 'active' : 'expired';
      return {
        view: {
          id: row.id,
          status,
          daysLeft: status === 'active' ? Math.max(1, Math.round(left / DAY_MS)) : null,
          views: row.views,
          canTurnOff: status === 'active',
        },
        expires: Number.isFinite(expires) ? expires : 0,
      };
    })
    .sort((a, b) => ORDER[a.view.status] - ORDER[b.view.status] || b.expires - a.expires)
    .map((x) => x.view);
}

/** What the family report shows, in short: the top paths with their fit, and each Plan B once. */
export function previewOf(result: ShareResult): { paths: { id: string; band: Band }[]; planB: string[] } {
  const top = new Set(result.ranked.map((c) => c.stream_id));
  const planB: string[] = [];
  for (const card of result.ranked) {
    for (const id of card.plan_b) if (!top.has(id) && !planB.includes(id)) planB.push(id);
  }
  return { paths: result.ranked.map((c) => ({ id: c.stream_id, band: c.fit_band })), planB };
}
