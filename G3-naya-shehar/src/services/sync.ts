/**
 * Upload of progress and results to the teacher dashboard.
 *
 * The game never needs the network. When a class is linked and the phone is
 * online, the latest results snapshot and any new assessment events are sent
 * to the dashboard server. Uploads are incremental (events after the last
 * acknowledged seq) and idempotent on the server (device id + seq).
 */
import { GameEngine } from '@/game/engine/GameEngine';
import { StoredEvent, Week } from '@/assessment/types';
import { recap } from '@/game/story/recap';
import { INTEREST_NAMES, ABILITY_NAMES } from '@/assessment/recommendations/rules';

export const PROTOCOL = 1;
export const APP_VERSION = '1.0.0';
const MAX_EVENTS_PER_UPLOAD = 500;

export interface SyncPayload {
  protocol: number;
  appVersion: string;
  deviceId: string;
  token?: string;
  classCode: string;
  roll: number;
  nickname: string;
  avatar: unknown;
  progress: {
    weeksCompleted: Week[];
    currentWeek: Week | null;
    inSession: boolean;
    measuredWeeks: number;
    unmeasuredWeeks: Week[];
    unmeasuredSessions: string[];
    finished: boolean;
    clockAnomalies: number;
    buildingsOpen: number;
    homes: number;
  };
  student: { classLevel: number; matricGroup: string } | null;
  results: {
    model: string;
    comparisons: number;
    interests: { category: string; name: string; relative: number; theta: number; se: number; confidence: string }[];
    order: string[];
    consistency: { repeatedPairs: number; agreements: number; rate: number | null };
    abilities: { family: string; name: string; theta: number; sd: number; items: number; firstAttemptCorrect: number; band: string; confidence: string }[];
    recap: string[];
    recommendation: null | {
      rulesetVersion: string;
      confidence: string;
      unverifiedRules: boolean;
      notes: string[];
      top: { id: string; name: string; track: string; fit: number; reasons: string[]; eligibility: unknown }[];
      planB: { id: string; name: string; track: string; fit: number; reasons: string[]; eligibility: unknown } | null;
    };
  };
  events: StoredEvent[];
}

export function buildPayload(e: GameEngine): SyncPayload | null {
  const s = e.state;
  if (!s.link) return null;
  const profile = e.interestProfile();
  const abilities = e.abilityProfile();
  const rec = e.recommendation();
  const completed = ([0, 1, 2, 3, 4] as Week[]).filter((w) => s.schedule.completedAt[w] !== undefined);
  const events = e.events().filter((x) => x.seq > s.sync.ackSeq).slice(0, MAX_EVENTS_PER_UPLOAD);
  const pr = (r: NonNullable<typeof rec>['top'][number]) => ({
    id: r.pathway.id, name: r.pathway.name, track: r.pathway.track, fit: Math.round(r.fit * 1000) / 1000, reasons: r.reasons, eligibility: r.eligibility,
  });
  return {
    protocol: PROTOCOL,
    appVersion: APP_VERSION,
    deviceId: s.deviceId,
    token: s.sync.token,
    classCode: s.link.classCode,
    roll: s.link.roll,
    nickname: s.avatar?.nickname ?? '',
    avatar: s.avatar,
    progress: {
      weeksCompleted: completed,
      currentWeek: e.currentWeek(),
      inSession: !!s.session,
      measuredWeeks: e.measuredWeeks(),
      unmeasuredWeeks: s.unmeasuredWeeks,
      unmeasuredSessions: s.unmeasuredSessions,
      finished: e.isFinished(),
      clockAnomalies: s.schedule.clockAnomalies,
      buildingsOpen: Object.values(s.town.progress).filter((p) => p >= 100).length,
      homes: s.town.homes,
    },
    student: s.student,
    results: {
      model: profile.model,
      comparisons: profile.comparisons,
      interests: profile.scores.map((x) => ({ category: x.category, name: INTEREST_NAMES[x.category], relative: x.relative, theta: x.theta, se: x.se, confidence: x.confidence })),
      order: profile.order,
      consistency: profile.consistency,
      abilities: abilities.map((a) => ({ family: a.family, name: ABILITY_NAMES[a.family], theta: a.theta, sd: a.sd, items: a.items, firstAttemptCorrect: a.firstAttemptCorrect, band: a.band, confidence: a.confidence })),
      recap: recap(profile, abilities),
      recommendation: rec ? {
        rulesetVersion: rec.rulesetVersion, confidence: rec.confidence, unverifiedRules: rec.unverifiedRules, notes: rec.notes,
        top: rec.top.map(pr), planB: rec.planB ? pr(rec.planB) : null,
      } : null,
    },
    events,
  };
}

export type SyncOutcome =
  | { ok: true; ackSeq: number; more: boolean; className?: string }
  | { ok: false; reason: 'not_linked' | 'not_configured' | 'offline' | 'class_not_found' | 'rejected' | 'server_error'; message: string };

export interface SyncDeps { apiUrl: string; fetchImpl?: typeof fetch; timeoutMs?: number; isOnline?: () => Promise<boolean> }

async function post(url: string, body: unknown, deps: SyncDeps) {
  const f = deps.fetchImpl ?? fetch;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), deps.timeoutMs ?? 12000);
  try {
    return await f(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: ctrl.signal });
  } finally { clearTimeout(t); }
}

/** Sends everything not yet confirmed, in batches. Records success or the error on the engine. */
export async function syncNow(e: GameEngine, deps: SyncDeps): Promise<SyncOutcome> {
  if (!e.state.link) return { ok: false, reason: 'not_linked', message: 'No class linked.' };
  if (!deps.apiUrl) return { ok: false, reason: 'not_configured', message: 'The dashboard address is not set in this build.' };
  if (deps.isOnline && !(await deps.isOnline())) return { ok: false, reason: 'offline', message: 'No internet. Results will be sent later.' };
  const base = deps.apiUrl.replace(/\/+$/, '');
  for (let round = 0; round < 20; round++) {
    const payload = buildPayload(e)!;
    let res: Response;
    try { res = await post(`${base}/api/v1/sync`, payload, deps); }
    catch { e.recordSyncError('Could not reach the dashboard.'); return { ok: false, reason: 'offline', message: 'Could not reach the dashboard. Results will be sent later.' }; }
    const body = (await res.json().catch(() => ({}))) as { ackSeq?: number; token?: string; className?: string; error?: string };
    if (res.status === 404) { e.recordSyncError('Class code not found.'); return { ok: false, reason: 'class_not_found', message: 'That class code was not found. Check it with your teacher.' }; }
    if (!res.ok) {
      const reason = res.status >= 500 ? 'server_error' : 'rejected';
      e.recordSyncError(body.error ?? `Upload failed (${res.status}).`);
      return { ok: false, reason, message: body.error ?? `Upload failed (${res.status}).` };
    }
    const ack = body.ackSeq ?? 0;
    e.recordSyncSuccess(ack, body.token, body.className);
    const pending = e.events().some((x) => x.seq > e.state.sync.ackSeq);
    if (!pending || payload.events.length === 0) return { ok: true, ackSeq: ack, more: false, className: body.className };
  }
  return { ok: true, ackSeq: e.state.sync.ackSeq, more: true };
}

/** Optional check while joining: does this class code exist? null = could not check (offline). */
export async function lookupClass(code: string, deps: SyncDeps): Promise<{ found: boolean; name?: string } | null> {
  if (!deps.apiUrl) return null;
  try {
    const res = await post(`${deps.apiUrl.replace(/\/+$/, '')}/api/v1/classes/lookup`, { code }, { ...deps, timeoutMs: 8000 });
    if (res.status === 404) return { found: false };
    if (!res.ok) return null;
    const b = (await res.json()) as { name?: string };
    return { found: true, name: b.name };
  } catch { return null; }
}
