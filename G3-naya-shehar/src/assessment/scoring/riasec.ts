/**
 * INTERIM interest-scoring model.
 *
 * Model: Bradley–Terry (logistic Thurstone Case V) paired comparisons with a
 * N(0, PRIOR_SD²) prior on each category utility θ_k, fitted by Newton's method
 * (MAP). Standard errors come from the inverse of the negative Hessian.
 *
 * Evidence → comparisons:
 *  • forced choice  : chosen ≻ other, weight 1.0
 *  • weekly planner : rank1≻rank2≻rank3 and every ranked ≻ every unranked,
 *                     weight 0.5 each (rank-ordered logit decomposition)
 *  • reaction       : "Loved it" ≻ neutral anchor / neutral anchor ≻ "Meh",
 *                     weight 0.3; "Okay" adds nothing.
 *
 * The intended production model is a Thurstonian IRT model with item
 * parameters calibrated on a real sample. That calibration does not exist
 * yet, so this module must not be described as validated. See docs/MEASUREMENT.md.
 */
import { AssessmentEvent, RIASEC, Riasec, StoredEvent } from '../types';
import { invert, sigmoid } from './linalg';
import { pairKey } from '../riasec/pairs';

export const MODEL_ID = 'interim-bt-map-v1';
export const PRIOR_SD = 1.0;
export const WEIGHTS = { choice: 1.0, plan: 0.5, reaction: 0.3 } as const;

/** Opponent 'anchor' is a fixed θ = 0 reference used for reactions. */
export interface Comparison { winner: Riasec | 'anchor'; loser: Riasec | 'anchor'; weight: number }

/** Only measured, scored-week events count. Practice (week 0) never counts. */
export function scorableEvents(events: StoredEvent[]): AssessmentEvent[] {
  return events.filter((e) => e.measured && e.event.week >= 1).map((e) => e.event);
}

export function toComparisons(events: AssessmentEvent[]): Comparison[] {
  const out: Comparison[] = [];
  for (const e of events) {
    if (e.type === 'choice_made') {
      const loser = e.presented[0] === e.chosen ? e.presented[1] : e.presented[0];
      out.push({ winner: e.chosen, loser, weight: WEIGHTS.choice });
    } else if (e.type === 'plan_committed') {
      const r = e.ranked;
      for (let i = 0; i < r.length; i++) for (let j = i + 1; j < r.length; j++) out.push({ winner: r[i], loser: r[j], weight: WEIGHTS.plan });
      const unranked = e.offered.filter((c) => !r.includes(c));
      for (const w of r) for (const l of unranked) out.push({ winner: w, loser: l, weight: WEIGHTS.plan });
    } else if (e.type === 'reaction') {
      if (e.value === 'loved') out.push({ winner: e.category, loser: 'anchor', weight: WEIGHTS.reaction });
      if (e.value === 'meh') out.push({ winner: 'anchor', loser: e.category, weight: WEIGHTS.reaction });
    }
    // task_result events are ignored here by design: abilities never move interests.
  }
  return out;
}

export interface CategoryScore {
  category: Riasec;
  theta: number;
  se: number;
  /** 0–100 relative strength for display: share of a soft-max over the six. */
  relative: number;
  confidence: 'low' | 'medium' | 'high';
}

export interface InterestProfile {
  model: string;
  scores: CategoryScore[];
  /** Categories ordered by θ, highest first. */
  order: Riasec[];
  comparisons: number;
  consistency: { repeatedPairs: number; agreements: number; rate: number | null };
}

const idx = (c: Riasec) => RIASEC.indexOf(c);

export function fitBradleyTerry(comps: Comparison[], iterations = 30): { theta: number[]; se: number[] } {
  const n = RIASEC.length;
  let theta = new Array(n).fill(0);
  const prec = 1 / (PRIOR_SD * PRIOR_SD);
  let H: number[][] = [];
  for (let it = 0; it < iterations; it++) {
    const g = theta.map((t) => -prec * t);
    H = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? -prec : 0)));
    for (const c of comps) {
      const wi = c.winner === 'anchor' ? -1 : idx(c.winner);
      const li = c.loser === 'anchor' ? -1 : idx(c.loser);
      const tw = wi >= 0 ? theta[wi] : 0;
      const tl = li >= 0 ? theta[li] : 0;
      const p = sigmoid(tw - tl);
      const grad = c.weight * (1 - p);
      const curv = c.weight * p * (1 - p);
      if (wi >= 0) { g[wi] += grad; H[wi][wi] -= curv; }
      if (li >= 0) { g[li] -= grad; H[li][li] -= curv; }
      if (wi >= 0 && li >= 0) { H[wi][li] += curv; H[li][wi] += curv; }
    }
    const negH = H.map((row) => row.map((x) => -x));
    const step = invert(negH).map((row) => row.reduce((s, x, j) => s + x * g[j], 0));
    theta = theta.map((t, i) => t + step[i]);
    if (Math.max(...step.map(Math.abs)) < 1e-8) break;
  }
  const cov = invert(H.map((row) => row.map((x) => -x)));
  return { theta, se: cov.map((row, i) => Math.sqrt(row[i])) };
}

/**
 * Thresholds chosen from simulation of this exact 4-week design (30 choices +
 * 4 planners): after one week SE ≈ 0.70–0.80, after four weeks ≈ 0.55–0.70.
 * They describe precision of THIS model only, not validity.
 */
export const SE_HIGH = 0.6;
export const SE_MEDIUM = 0.72;
export function confidenceFromSe(se: number): CategoryScore['confidence'] {
  if (se < SE_HIGH) return 'high';
  if (se < SE_MEDIUM) return 'medium';
  return 'low';
}

export function consistency(events: AssessmentEvent[]) {
  const byPair = new Map<string, Riasec[]>();
  for (const e of events) {
    if (e.type !== 'choice_made') continue;
    const k = pairKey(e.presented[0], e.presented[1]);
    byPair.set(k, [...(byPair.get(k) ?? []), e.chosen]);
  }
  let repeated = 0;
  let agree = 0;
  for (const picks of byPair.values()) {
    if (picks.length < 2) continue;
    repeated++;
    if (picks[0] === picks[1]) agree++;
  }
  return { repeatedPairs: repeated, agreements: agree, rate: repeated ? agree / repeated : null };
}

export function scoreInterests(stored: StoredEvent[]): InterestProfile {
  const events = scorableEvents(stored);
  const comps = toComparisons(events);
  const { theta, se } = fitBradleyTerry(comps);
  const exps = theta.map((t) => Math.exp(t));
  const total = exps.reduce((a, b) => a + b, 0);
  const scores: CategoryScore[] = RIASEC.map((c, i) => ({
    category: c,
    theta: theta[i],
    se: se[i],
    relative: Math.round((100 * exps[i]) / total),
    confidence: comps.length === 0 ? 'low' : confidenceFromSe(se[i]),
  }));
  const order = [...scores].sort((a, b) => b.theta - a.theta).map((s) => s.category);
  return { model: MODEL_ID, scores, order, comparisons: comps.length, consistency: consistency(events) };
}
