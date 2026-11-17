// The top-3 result as the API sends it (docs/api/openapi.yaml Recommendation, PathCard, Door, Reason),
// and how each part is worded. The server sends codes, never text: this file turns them into translation
// keys with parameters, so all wording stays in en.json. Pure functions, tested with `pnpm test`.

export type InterestType = 'R' | 'I' | 'A' | 'S' | 'E' | 'C';
export type Band = 'strong' | 'good' | 'worth_a_look';
export type Confidence = 'high' | 'medium' | 'low';

export interface Reason {
  code: 'interest_match' | 'ability_support' | 'keeps_doors_open' | 'path_strength';
  types?: InterestType[];
  doors?: string[];
}

export interface Door {
  to: string;
  label_key: string;
  state: 'open' | 'extra_step' | 'closed';
  gates: string[];
  verification: 'primary' | 'reported' | 'unverified';
  sources: string[];
  check_with_board: boolean;
  route?: string;
  note?: string;
}

export interface PathCard {
  stream_id: string;
  fit_band: Band;
  reasons: Reason[];
  doors: Door[];
  plan_b: string[];
}

export interface Recommendation {
  id: string;
  mode: string;
  provisional: boolean;
  confidence: Confidence;
  ranked: PathCard[];
  created_at: string;
}

export interface RuleSource {
  id: string;
  source: string;
  verification: 'primary' | 'reported' | 'unverified';
  last_verified?: string | null;
}

export interface EvidencePath {
  stream_id: string;
  contributions: { feature: string; weight: number; contribution: number }[];
  path_types?: InterestType[];
  rules?: RuleSource[];
}

export interface Evidence {
  result_id: string;
  confidence: Confidence;
  evidence: {
    choices: number;
    coverage: number;
    weeks_played: number;
    top_interest_types: InterestType[];
    /** Every type, strongest first; chosen/offered are missing on results stored before 17 Nov 2026. */
    interest_profile?: { type: InterestType; chosen?: number; offered?: number }[];
  };
  paths?: EvidencePath[];
}

/** "Why this?" for one card (FR-56), as phrases: what the choices showed, what the path suits, what decided
 * it, and the rules with their sources. The server sends codes and numbers; all wording is in en.json. */
export interface WhyPhrases {
  choices: Phrase[];
  path: Phrase | null;
  decided: Phrase;
  rules: { phrase: Phrase; date: string | null }[];
}

export function whyPhrases(e: Evidence, streamId: string): WhyPhrases {
  const profile: { type: InterestType; chosen?: number; offered?: number }[] =
    e.evidence.interest_profile ?? e.evidence.top_interest_types.map((type) => ({ type }));
  const top = profile.slice(0, 3);
  const counted = top.length > 0 && top.every((p) => p.chosen !== undefined && !!p.offered);
  const choices: Phrase[] = counted
    ? top.map((p) => ({
        key: 'results.whyChose',
        params: { chosen: String(p.chosen ?? 0), offered: String(p.offered ?? 0) },
        lists: { types: [`results.type.${p.type}`] },
      }))
    : [{ key: 'results.whyStrongest', lists: { types: top.map((p) => `results.type.${p.type}`) } }];
  const path = e.paths?.find((p) => p.stream_id === streamId);
  const usesAbility = !!path?.contributions.some((c) => c.feature === 'ability');
  return {
    choices,
    path: path?.path_types?.length
      ? { key: 'results.whyPathSuits', lists: { types: path.path_types.map((t) => `results.type.${t}`) } }
      : null,
    decided: { key: usesAbility ? 'results.whyDecidedBoth' : 'results.whyDecidedInterests' },
    rules: (path?.rules ?? []).map((r) => ({
      phrase: { key: `results.whyRule.${r.verification}`, params: { source: shortSource(r.source) } },
      date: r.last_verified ?? null,
    })),
  };
}

/** A translation key and its parameters; list parameters are joined by the caller in the right language. */
export interface Phrase {
  key: string;
  params?: Record<string, string>;
  lists?: Record<string, string[]>;
}

const KNOWN_REASONS = new Set(['interest_match', 'ability_support', 'keeps_doors_open', 'path_strength']);

export function reasonPhrase(reason: Reason): Phrase | null {
  if (!KNOWN_REASONS.has(reason.code)) return null; // a code from a newer server: skip it, never show raw text
  const lists: Record<string, string[]> = {};
  if (reason.types?.length) lists.types = reason.types.map((t) => `results.type.${t}`);
  if (reason.doors?.length) lists.doors = reason.doors.map((d) => `door.${d}`);
  return { key: `results.reason.${reason.code}`, lists };
}

/** What to say about a door: its state, then any note, route or "check with your board". */
export function doorPhrases(door: Door): Phrase[] {
  const out: Phrase[] = [{ key: `results.doorState.${door.state}` }];
  if (door.check_with_board) out.push({ key: 'results.checkWithBoard' });
  if (door.note) out.push({ key: `results.doorNote.${door.note}` });
  if (door.route) out.push({ key: `results.route.${door.route}` });
  return out;
}

/** Band words with a dot count, so the band never depends on colour alone (FR-53). */
export function bandDots(band: Band): number {
  return band === 'strong' ? 3 : band === 'good' ? 2 : 1;
}

/** The API's 409 reasons for "one more week" (FR-51); anything else is a plain error. */
export type ResultState =
  | { kind: 'ready'; result: Recommendation }
  | { kind: 'more_play'; reason: string }
  | { kind: 'consent' }
  | { kind: 'not_supported' }
  | { kind: 'offline' }
  | { kind: 'signed_out' }
  | { kind: 'error' };

export function stateFromProblem(status: number, code: string, firstErrorCode?: string): ResultState {
  if (status === 409 && code === 'insufficient_evidence') return { kind: 'more_play', reason: firstErrorCode ?? '' };
  if (status === 403 && code === 'consent_required') return { kind: 'consent' };
  if (status === 422 && code === 'mode_not_supported') return { kind: 'not_supported' };
  if (status === 401) return { kind: 'signed_out' };
  return { kind: 'error' };
}

/** The readable part of a rule's source: the first clause, without web addresses (the full citation stays in
 * streams.json). "PM&DC statement, The Nation, 24 Oct 2026; regulations: https://..." -> "PM&DC statement,
 * The Nation, 24 Oct 2026". */
export function shortSource(source: string): string {
  const first = source.split(';')[0].replace(/https?:\/\/\S+/g, '').replace(/\s+/g, ' ').trim();
  return first.replace(/[\s,:(]+$/, '');
}
