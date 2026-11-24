/** Game content: loads the same JSON files as the desktop game and builds the fixed card schedule. */
import stallsJson from '../data/stalls.json';
import whatJson from '../data/what_cards.json';
import howJson from '../data/how_cards.json';
import diaryJson from '../data/diary_cards.json';
import dialoguesJson from '../data/dialogues.json';
import careersJson from '../data/careers.json';
import assessmentJson from '../data/assessment.json';

export const RIASEC = ['R', 'I', 'A', 'S', 'E', 'C'] as const;
export type RiasecType = (typeof RIASEC)[number];
export const BIG5 = ['B-O', 'B-C', 'B-E', 'B-A', 'B-N'] as const;
export type Big5Domain = (typeof BIG5)[number];

export interface Stall {
  id: string; name: string; short: string; tagline: string; color: string; riasec: RiasecType;
  bg: string; tent: string; icon: string; map: [number, number]; ambient: string; description: string;
}
export interface WhatOption { key: string; text: string; done_text: string; image: string; weights: Record<string, number> }
export interface WhatCard { id: string; day: number; type_triple: string; options: WhatOption[] }
export interface HowOption { pole: 'H' | 'L'; text: string }
export interface HowCard { id: string; day: number; domain: Big5Domain; scenario: string; options: HowOption[] }
export interface DiaryItem { id: string; day: number; text: string; domain: string | null; reverse: boolean | null }
export interface Line { speaker: string; text: string; expr?: string; pose?: string }
export interface DayInfo { title: string; buddy: string; scene: string; morning: Line[]; map_tip: string; evening: Line[]; teaser: string }
export interface CareerType { name: string; term: string; colour: string; icon: string; summary: string; explain: string; careers: string[] }

export type StepKind = 'what' | 'how';
export type Step = [StepKind, string];

const stalls = (stallsJson as any).stalls as Stall[];
const what = (whatJson as any).cards as WhatCard[];
const how = (howJson as any).cards as HowCard[];
const diary = diaryJson as any as {
  _meta: { instrument_id: string | null }; prompt: string; scale: string[]; scored: boolean; items: DiaryItem[];
};
const dialogues = dialoguesJson as any as {
  story: { panel: string; caption: string }[];
  days: Record<string, DayInfo>;
  arrivals: Record<string, Record<string, string>>;
  board_prompt: string; reactions: string[]; visit_complete: string[]; after_visit_map: string[];
  all_visits_done: string; diary_closing: string; closing: Line[]; reveal_intro: Line[]; ending: string;
  howto: { title: string; text: string; image: string }[];
};
const careers = (careersJson as any).types as Record<RiasecType, CareerType>;
const assessment = assessmentJson as any as {
  riasec: { top_n: number; status: string };
  lights: { per_item: number; per_day_complete: number; total: number };
};

function buildSchedule(): Record<number, Step[][]> {
  // Day -> 3 visits -> steps. 4 What + 6 How per day; card order independent of the stalls chosen (same as desktop).
  const sched: Record<number, Step[][]> = {};
  for (let d = 1; d <= 5; d++) {
    const w = what.filter((c) => c.day === d).map((c) => c.id).sort();
    const h = how.filter((c) => c.day === d).map((c) => c.id).sort();
    sched[d] = [
      [['what', w[0]], ['how', h[0]], ['how', h[1]]],
      [['what', w[1]], ['how', h[2]], ['how', h[3]]],
      [['what', w[2]], ['how', h[4]], ['what', w[3]], ['how', h[5]]],
    ];
  }
  return sched;
}

const byId = <T extends { id: string }>(xs: T[]) => Object.fromEntries(xs.map((x) => [x.id, x])) as Record<string, T>;

export const content = {
  stalls,
  stallById: byId(stalls),
  what,
  how,
  whatById: byId(what),
  howById: byId(how),
  diary,
  dialogues,
  careers,
  assessment,
  schedule: buildSchedule(),
  diaryForDay: (day: number) => diary.items.filter((i) => i.day === day),
  buddy: (day: number) => dialogues.days[String(day)].buddy,
};
export type Content = typeof content;

/** Same checks as the desktop Content.validate(); returns a list of problems (empty = valid). */
export function validateContent(c: Content = content): string[] {
  const errs: string[] = [];
  const ids = [...c.what.map((x) => x.id), ...c.how.map((x) => x.id), ...c.diary.items.map((x) => x.id)];
  if (ids.length !== new Set(ids).size) errs.push('duplicate card ids');
  if (c.what.length !== 20) errs.push('expected 20 What cards');
  if (c.how.length !== 30) errs.push('expected 30 How cards');
  if (c.diary.items.length !== 10) errs.push('expected 10 diary statements');
  for (const card of c.what) {
    if (card.options.length !== 3) errs.push(`${card.id} needs 3 options`);
    const types = new Set<string>();
    for (const o of card.options) {
      const keys = Object.keys(o.weights).sort().join('');
      if (keys !== [...RIASEC].sort().join('')) errs.push(`${card.id} ${o.key} weights must list all six types`);
      const vals = Object.values(o.weights);
      if (Math.abs(vals.reduce((a, b) => a + b, 0) - 1) > 1e-9 || Math.min(...vals) < 0)
        errs.push(`${card.id} ${o.key} weights must be non-negative and sum to 1`);
      types.add(topType(o.weights));
      if (!o.text.trim() || !o.done_text.trim()) errs.push(`${card.id} missing text`);
    }
    if (types.size !== 3) errs.push(`${card.id} options must be three different types`);
  }
  for (const card of c.how) {
    if (!(BIG5 as readonly string[]).includes(card.domain)) errs.push(`${card.id} bad domain`);
    if (card.options.map((o) => o.pole).sort().join('') !== 'HL') errs.push(`${card.id} needs one H and one L option`);
    if (!card.scenario.trim() || card.options.some((o) => !o.text.trim())) errs.push(`${card.id} missing text`);
  }
  return errs;
}

export function topType(weights: Record<string, number>): string {
  let best = '';
  let bv = -Infinity;
  for (const [k, v] of Object.entries(weights)) if (v > bv) { best = k; bv = v; }
  return best;
}
