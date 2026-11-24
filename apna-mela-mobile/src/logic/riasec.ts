/**
 * RIASEC interest scoring (career interests). Port of the desktop src/assessment/riasec.py.
 * Independent of the Big Five module by design: never imports bigfive.ts and never reads Big Five data.
 * The ranking rule is the PROVISIONAL rule in assessment.json (picks, then Loved-it mean, then stall visits).
 */
import { RIASEC, RiasecType, Stall, WhatCard } from './content';

export interface RiasecData {
  what: { id: string; chosen_key: string }[];
  loved: { type: string; hearts: number }[];
  stall_choices: { stall: string }[];
}

export interface RiasecReport {
  picks: Record<RiasecType, number>;
  loved: Record<RiasecType, number[]>;
  loved_mean: Record<RiasecType, number | null>;
  stall_visits: Record<RiasecType, number>;
  order: RiasecType[];
  medallions: RiasecType[][];
  code: string[];
  bars: Record<RiasecType, number>;
  answered: number;
  complete: boolean;
  rule_status: string;
}

const zero = <T,>(f: () => T) => Object.fromEntries(RIASEC.map((t) => [t, f()])) as Record<RiasecType, T>;

export function scoreRiasec(
  data: Partial<RiasecData> | null | undefined,
  whatCards: WhatCard[],
  stalls: Stall[],
  config: { top_n?: number; status?: string },
): RiasecReport {
  const d = data ?? {};
  const byId = Object.fromEntries(whatCards.map((c) => [c.id, c]));
  const stallType = Object.fromEntries(stalls.map((s) => [s.id, s.riasec]));
  const picks = zero(() => 0);
  const loved = zero<number[]>(() => []);
  const visits = zero(() => 0);
  let answered = 0;
  for (const r of d.what ?? []) {
    const card = byId[r?.id];
    if (!card) continue;
    const opt = card.options.find((o) => o.key === r.chosen_key);
    if (!opt) continue;
    answered += 1;
    for (const t of RIASEC) picks[t] += Number(opt.weights[t] ?? 0);
  }
  for (const r of d.loved ?? []) {
    const t = r?.type as RiasecType;
    const h = r?.hearts;
    if ((RIASEC as readonly string[]).includes(t) && Number.isInteger(h) && h >= 1 && h <= 5) loved[t].push(h);
  }
  for (const r of d.stall_choices ?? []) {
    const t = stallType[r?.stall];
    if (t) visits[t] += 1;
  }
  const lovedMean = zero<number | null>(() => null);
  for (const t of RIASEC) lovedMean[t] = loved[t].length ? loved[t].reduce((a, b) => a + b, 0) / loved[t].length : null;

  const key = (t: RiasecType): [number, number, number] => [-picks[t], -(lovedMean[t] ?? 0), -visits[t]];
  const cmp = (a: RiasecType, b: RiasecType) => {
    const ka = key(a), kb = key(b);
    for (let i = 0; i < 3; i++) if (ka[i] !== kb[i]) return ka[i] - kb[i];
    return RIASEC.indexOf(a) - RIASEC.indexOf(b);
  };
  const same = (a: RiasecType, b: RiasecType) => key(a).every((v, i) => v === key(b)[i]);
  const order = [...RIASEC].sort(cmp);
  const groups: RiasecType[][] = [];
  for (const t of order) {
    if (groups.length && same(groups[groups.length - 1][0], t)) groups[groups.length - 1].push(t);
    else groups.push([t]);
  }
  const topN = Number(config.top_n ?? 3);
  const medallions: RiasecType[][] = [];
  if (answered > 0) {
    for (const g of groups) {
      const slots = topN - medallions.length;
      if (slots <= 0) break;
      if (g.length <= slots) g.forEach((t) => medallions.push([t]));
      else { medallions.push(g); break; }
    }
  }
  const maxp = Math.max(...RIASEC.map((t) => picks[t])) || 1;
  const bars = zero(() => 0);
  for (const t of RIASEC) bars[t] = picks[t] / maxp;
  return {
    picks, loved, loved_mean: lovedMean, stall_visits: visits, order, medallions,
    code: medallions.map((m) => m.join('/')), bars, answered, complete: answered >= whatCards.length,
    rule_status: config.status ?? '',
  };
}
