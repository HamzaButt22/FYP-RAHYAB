/**
 * Big Five RESEARCH scoring (experimental, not validated). Port of desktop src/assessment/bigfive.py.
 * Independent of the RIASEC module: never imports riasec.ts. Its output is never shown to students,
 * teachers or parents and never used for career ideas. It exists only for researchers, under consent.
 */
import { BIG5, Big5Domain, HowCard } from './content';

export function scoreBigFive(
  data: { how?: { id: string; chosen: string }[]; diary?: { id: string; response: number; scale_points: number }[] } | null,
  howCards: HowCard[],
  diaryCfg: { scored: boolean; items: { id: string; domain: string | null; reverse: boolean | null }[] },
) {
  const d = data ?? {};
  const byId = Object.fromEntries(howCards.map((c) => [c.id, c]));
  const high = Object.fromEntries(BIG5.map((x) => [x, 0])) as Record<Big5Domain, number>;
  const answered = Object.fromEntries(BIG5.map((x) => [x, 0])) as Record<Big5Domain, number>;
  for (const r of d.how ?? []) {
    const card = byId[r?.id];
    if (!card || (r.chosen !== 'H' && r.chosen !== 'L')) continue;
    answered[card.domain] += 1;
    if (r.chosen === 'H') high[card.domain] += 1;
  }
  let diary: Record<Big5Domain, number | null> | null = null;
  const valid = diaryCfg.items.every((i) => (BIG5 as readonly string[]).includes(i.domain ?? '') && i.reverse !== null);
  if (diaryCfg.scored && valid) {
    const items = Object.fromEntries(diaryCfg.items.map((i) => [i.id, i]));
    const sums = Object.fromEntries(BIG5.map((x) => [x, [] as number[]])) as Record<Big5Domain, number[]>;
    for (const r of d.diary ?? []) {
      const it = items[r.id];
      if (!it) continue;
      let v = Number(r.response);
      if (it.reverse) v = Number(r.scale_points) + 1 - v;
      sums[it.domain as Big5Domain].push(v);
    }
    diary = Object.fromEntries(
      BIG5.map((x) => [x, sums[x].length ? sums[x].reduce((a, b) => a + b, 0) / sums[x].length : null]),
    ) as Record<Big5Domain, number | null>;
  }
  return { how_high_choices: high, how_answered: answered, diary_means: diary, status: 'experimental research data - not a diagnosis' };
}
