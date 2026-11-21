/**
 * RIASEC interest profile — a line-by-line port of the original Python implementation
 * (analytics/riasec_scoring.py: unit_engagement, score_level, compute_riasec) so that results stay
 * comparable with the earlier prototype. Parity is checked in __tests__/riasecParity.test.ts against
 * outputs produced by the Python code itself.
 *
 * Status: exploratory, rule-based, NOT validated. Only preference and engagement enter the score;
 * completion and performance are reported separately with weight 0, so skill is never read as interest.
 */
import rawConfig from './riasec_config.json';
import type { LevelUnits, Unit } from './units';

export const CODES = ['R', 'I', 'A', 'S', 'E', 'C'] as const;
export type Code = (typeof CODES)[number];
type Num = Record<Code, number>;

export interface RiasecConfig {
  model_name: string;
  model_version: string;
  is_validated: boolean;
  disclaimer: string;
  categories: Record<Code, string>;
  levels: Record<string, { weight: number; name: string; selection_cap?: number }>;
  component_weights: { preference: number; engagement: number; completion: number; performance: number };
  preference: { normalise_by_opportunity: boolean; share_cap: number; role_vote_weight: number };
  engagement: { weights: Record<'optional' | 'bonus' | 'persist' | 'dwell' | 'revisit', number>; dwell_ratio_cap: number };
  min_selections_per_level: number;
  flat_profile_range: number;
  agreement: { consistent_min_corr: number };
  top_n: number;
  tasks: Record<string, Partial<Record<Code, number>>>;
  roles: Record<string, Code>;
}

export const RIASEC_CONFIG = rawConfig as unknown as RiasecConfig;

const zeros = (): Num => ({ R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 });
const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
/**
 * Python-compatible round(x, d): rounds the exact binary value, ties to even.
 * (JS Math.round rounds ties up, which made 10/40 parity cases differ by 0.1.)
 */
export function pyRound(x: number, d: number): number {
  if (!Number.isFinite(x)) return x;
  const neg = x < 0;
  const [ip, fp = ''] = Math.abs(x).toFixed(Math.min(100, d + 25)).split('.');
  const keep = fp.slice(0, d);
  const rest = fp.slice(d);
  let digits = BigInt(ip + keep);
  const half = '5'.padEnd(rest.length, '0');
  if (rest > half || (rest === half && digits % 2n === 1n)) digits += 1n;
  const v = Number(digits) / 10 ** d;
  return neg ? -v : v;
}
const round = pyRound;

function weightsFor(cfg: RiasecConfig, tid: string): Partial<Record<Code, number>> {
  return cfg.tasks[tid] ?? {};
}

export function unitEngagement(cfg: RiasecConfig, u: Unit): number | null {
  const w = cfg.engagement.weights;
  const cap = cfg.engagement.dwell_ratio_cap;
  const comps: Partial<Record<keyof typeof w, number>> = {};
  const rounds = Object.values(u.rounds);
  if (rounds.length) {
    const opt = rounds.filter((r) => r.optional_total).map((r) => (r.optional_taken ?? 0) / (r.optional_total as number));
    if (opt.length) comps.optional = mean(opt);
    comps.persist = mean(rounds.map((r) => (r.outcome === 'abandoned' ? 0 : 1)));
    const dw = rounds.filter((r) => r.expected_ms && r.engaged_ms !== null && r.engaged_ms !== undefined)
      .map((r) => Math.min(cap, (r.engaged_ms ?? 0) / (r.expected_ms as number)) / cap);
    if (dw.length) comps.dwell = mean(dw);
    comps.bonus = u.bonus_taken || rounds.some((r) => r.bonus_taken) ? 1 : 0;
    comps.revisit = Math.min(1, (rounds.length - 1) / 2);
  } else {
    comps.optional = u.optional_flag || u.via === 'npc' ? 1 : 0;
    comps.persist = 1;
    comps.bonus = u.looked ? 1 : 0;
    comps.revisit = Math.min(1, u.revisit_n / 2);
  }
  const keys = Object.keys(comps) as (keyof typeof w)[];
  const tot = keys.reduce((s, k) => s + w[k], 0);
  return tot ? keys.reduce((s, k) => s + w[k] * (comps[k] as number), 0) / tot : null;
}

export interface CategoryComponents {
  preference: number;
  preference_share: number;
  engagement: number;
  completion: number | null;
  performance: number | null;
}

export interface LevelScore {
  scores: Num;
  components: Record<Code, CategoryComponents>;
  n_selections: number;
}

export function scoreLevel(cfg: RiasecConfig, summ: LevelUnits): LevelScore {
  const capN = cfg.levels[summ.level_id]?.selection_cap ?? 3;
  const sel = zeros(), engNum = zeros(), compNum = zeros(), compDen = zeros(), perfNum = zeros(), perfDen = zeros();
  for (const [tid, u] of Object.entries(summ.units)) {
    if (u.selected_n <= 0) continue;
    const w = weightsFor(cfg, tid);
    const n = Math.min(u.selected_n, capN);
    const eng = unitEngagement(cfg, u);
    const rounds = Object.values(u.rounds);
    const done = rounds.filter((r) => r.outcome === 'completed');
    for (const [c, wc] of Object.entries(w) as [Code, number][]) {
      sel[c] += wc * n;
      engNum[c] += wc * n * (eng ?? 0);
      if (rounds.length) {
        compNum[c] += wc * done.length;
        compDen[c] += wc * rounds.length;
        const perfs = done.map((r) => r.performance).filter((p): p is number => p !== null && p !== undefined);
        if (perfs.length) { perfNum[c] += wc * mean(perfs) * perfs.length; perfDen[c] += wc * perfs.length; }
      } else { compNum[c] += wc; compDen[c] += wc; }
    }
  }
  for (const role of summ.role_votes) {
    const c = cfg.roles[role];
    if (c) sel[c] += cfg.preference.role_vote_weight;
  }
  const opp = zeros();
  for (const tid of summ.opportunities) for (const [c, wc] of Object.entries(cfg.tasks[tid] ?? {}) as [Code, number][]) opp[c] += wc;
  const raw = zeros();
  for (const c of CODES) raw[c] = sel[c] / (cfg.preference.normalise_by_opportunity && opp[c] > 0 ? opp[c] : 1);
  const tot = CODES.reduce((s, c) => s + raw[c], 0);
  const share = zeros(), pref = zeros(), eng = zeros();
  const cap = cfg.preference.share_cap;
  for (const c of CODES) { share[c] = tot ? raw[c] / tot : 0; pref[c] = Math.min(share[c], cap) / cap; }
  for (const c of CODES) {
    let den = 0;
    for (const [tid, u] of Object.entries(summ.units)) {
      if (u.selected_n <= 0) continue;
      const wc = weightsFor(cfg, tid)[c];
      if (wc) den += wc * Math.min(u.selected_n, capN);
    }
    eng[c] = den ? engNum[c] / den : 0;
  }
  const cw = cfg.component_weights;
  const scores = zeros();
  const components = {} as Record<Code, CategoryComponents>;
  for (const c of CODES) {
    const completion = compDen[c] ? compNum[c] / compDen[c] : null;
    const performance = perfDen[c] ? perfNum[c] / perfDen[c] : null;
    const parts: Record<keyof typeof cw, number | null> = { preference: pref[c], engagement: eng[c], completion, performance };
    const keys = (Object.keys(parts) as (keyof typeof cw)[]).filter((k) => parts[k] !== null && cw[k] > 0);
    const wsum = keys.reduce((s, k) => s + cw[k], 0);
    scores[c] = wsum ? round((100 * keys.reduce((s, k) => s + cw[k] * (parts[k] as number), 0)) / wsum, 1) : 0;
    components[c] = {
      preference: round(pref[c], 3), preference_share: round(share[c], 3), engagement: round(eng[c], 3),
      completion: completion === null ? null : round(completion, 3), performance: performance === null ? null : round(performance, 3),
    };
  }
  return { scores, components, n_selections: summ.n_selections };
}

export interface RiasecResult {
  available: boolean;
  scores: Num;
  holland_code: string;
  levels_used: string[];
  level_status: Record<string, 'not_played' | 'insufficient' | 'completed' | 'incomplete'>;
  level_scores: Record<string, Num>;
  components: Record<string, Record<Code, CategoryComponents>>;
  agreement: number | null;
  agreement_label: string;
  flat_profile: boolean;
  model_version: string;
  is_validated: boolean;
  disclaimer: string;
  caveats: string[];
}

function pearson(a: number[], b: number[]): number {
  const ma = mean(a), mb = mean(b);
  let num = 0, da = 0, db = 0;
  for (let i = 0; i < a.length; i++) { num += (a[i] - ma) * (b[i] - mb); da += (a[i] - ma) ** 2; db += (b[i] - mb) ** 2; }
  return num / Math.sqrt(da * db);
}
const sd = (a: number[]) => { const m = mean(a); return Math.sqrt(mean(a.map((x) => (x - m) ** 2))); };

/** Levels are combined in journey order (crossroads_caravan, career_workshop, park_mission). */
export function computeRiasec(summaries: Record<string, LevelUnits | undefined>, cfg: RiasecConfig = RIASEC_CONFIG): RiasecResult {
  const levelIds = Object.keys(cfg.levels);
  const minSel = cfg.min_selections_per_level;
  const levelScores: Record<string, Num> = {};
  const comps: RiasecResult['components'] = {};
  const status: RiasecResult['level_status'] = {};
  const used: string[] = [];
  const caveats = [cfg.disclaimer];
  for (const lid of levelIds) {
    const summ = summaries[lid];
    if (!summ) { status[lid] = 'not_played'; continue; }
    const sc = scoreLevel(cfg, summ);
    comps[lid] = sc.components;
    levelScores[lid] = sc.scores;
    if (summ.n_selections >= minSel) { used.push(lid); status[lid] = summ.completed ? 'completed' : 'incomplete'; }
    else { status[lid] = 'insufficient'; caveats.push(`${cfg.levels[lid].name} had fewer than ${minSel} free choices, so it was not used.`); }
  }
  const combined = zeros();
  if (used.length) {
    const tw = used.reduce((s, l) => s + cfg.levels[l].weight, 0);
    for (const c of CODES) combined[c] = round(used.reduce((s, l) => s + cfg.levels[l].weight * levelScores[l][c], 0) / tw, 1);
  }
  const order = [...CODES].sort((x, y) => combined[y] - combined[x] || CODES.indexOf(x) - CODES.indexOf(y));
  const code = used.length ? order.slice(0, cfg.top_n).join('') : '';
  let agreement: number | null = null;
  let label = 'not applicable (fewer than two levels used)';
  if (used.length >= 2) {
    const vec = (l: string) => CODES.map((c) => levelScores[l][c]);
    const cors: number[] = [];
    for (let i = 0; i < used.length; i++) for (let j = i + 1; j < used.length; j++) {
      const a = vec(used[i]), b = vec(used[j]);
      if (sd(a) > 0 && sd(b) > 0) cors.push(pearson(a, b));
    }
    if (cors.length) { agreement = round(mean(cors), 3); label = agreement >= cfg.agreement.consistent_min_corr ? 'consistent across levels' : 'differs between levels'; }
    else label = 'one level showed no differentiation';
  }
  if (used.length === 1) caveats.push('Only one interest level contributed, so there were no repeated observations.');
  if (!used.length) caveats.push('No interest level had enough free choices to build a profile.');
  const vals = CODES.map((c) => combined[c]);
  const flat = used.length > 0 && Math.max(...vals) - Math.min(...vals) < cfg.flat_profile_range;
  if (flat) caveats.push('The profile is flat: no area stands out, so the three-letter code is not informative.');
  return { available: used.length > 0, scores: combined, holland_code: code, levels_used: used, level_status: status, level_scores: levelScores,
    components: comps, agreement, agreement_label: label, flat_profile: flat, model_version: cfg.model_version, is_validated: cfg.is_validated,
    disclaimer: cfg.disclaimer, caveats };
}
