import * as fs from 'fs';
import * as path from 'path';
import { content, RIASEC, topType, validateContent } from '../src/logic/content';
import { scoreRiasec } from '../src/logic/riasec';
import { scoreBigFive } from '../src/logic/bigfive';
import { MemoryKV, SaveCorrupt, Saves } from '../src/logic/storage';
import { Session } from '../src/logic/session';
import { mulberry32 } from '../src/logic/rng';

const cfg = content.assessment.riasec;

async function newSession(kv = new MemoryKV()) {
  const saves = new Saves(kv);
  await saves.init();
  return { s: new Session(content, saves), saves, kv };
}

/** Play the whole game through the Session API, like a student tapping through every screen. */
function playAll(s: Session, rnd: () => number, stopAt?: (s: Session) => boolean) {
  for (let guard = 0; guard < 2000; guard++) {
    if (stopAt && stopAt(s)) return;
    const ph = s.phase;
    if (ph === 'story') s.storyDone();
    else if (ph === 'morning') s.morningDone();
    else if (ph === 'map') {
      const av = s.availableStalls();
      expect(s.chooseStall(av[Math.floor(rnd() * av.length)])).toBe(true);
    } else if (ph === 'visit') {
      if (!s.progress.arrived) s.arrive();
      const step = s.currentStep()!;
      if (step[0] === 'what') {
        const card = content.whatById[step[1]];
        const order = s.optionOrder(step[1], 3).map((i) => card.options[i]);
        expect(s.recordWhat(step[1], order.map((o) => o.key), order[Math.floor(rnd() * 3)].key)).toBe(true);
      } else if (step[0] === 'loved') expect(s.recordLoved(step[1], 1 + Math.floor(rnd() * 5))).toBe(true);
      else {
        const card = content.howById[step[1]];
        expect(s.recordHow(step[1], card.options[0].pole, card.options[Math.floor(rnd() * 2)].pole)).toBe(true);
      }
    } else if (ph === 'diary') expect(s.recordDiary(s.diaryItem()!.id, 1 + Math.floor(rnd() * 5))).toBe(true);
    else if (ph === 'summary') s.summaryDone();
    else if (ph === 'finale') s.finaleDone();
    else if (ph === 'results') s.resultsSeen();
    else return;
  }
  throw new Error('playthrough did not finish');
}

describe('content', () => {
  test('validates with the same rules as the desktop game', () => {
    expect(validateContent()).toEqual([]);
  });
  test('What cards cover all 20 type triples once; each type twice per day, ten in total', () => {
    expect(new Set(content.what.map((c) => c.type_triple)).size).toBe(20);
    for (let d = 1; d <= 5; d++) {
      const counts: Record<string, number> = {};
      content.what.filter((c) => c.day === d).forEach((c) => c.options.forEach((o) => {
        const t = topType(o.weights);
        counts[t] = (counts[t] ?? 0) + 1;
      }));
      RIASEC.forEach((t) => expect(counts[t]).toBe(2));
    }
  });
  test('schedule: 3 visits a day, 4 What + 6 How', () => {
    for (let d = 1; d <= 5; d++) {
      const steps = content.schedule[d].flat();
      expect(steps.filter((x) => x[0] === 'what')).toHaveLength(4);
      expect(steps.filter((x) => x[0] === 'how')).toHaveLength(6);
    }
  });
  test('every image and sound referenced by content or code exists in the mobile bundle', () => {
    const reg = fs.readFileSync(path.join(__dirname, '../src/assets/registry.ts'), 'utf8');
    const has = (p: string) => reg.includes(`"${p.replace(/\.png$/, '')}"`);
    const refs = [
      ...content.stalls.flatMap((s) => [s.bg, s.tent, s.icon]),
      ...content.what.flatMap((c) => c.options.map((o) => o.image)),
      ...content.dialogues.story.map((b) => b.panel),
      ...Object.values(content.dialogues.days).map((d) => d.scene),
      ...content.dialogues.howto.map((h) => h.image),
      ...Object.values(content.careers).map((c) => c.icon),
    ];
    refs.forEach((r) => expect([r, has(r)]).toEqual([r, true]));
    // every source-code reference like img('ui/heart_full') must exist too
    const src = fs.readdirSync(path.join(__dirname, '../src'), { recursive: true }) as string[];
    for (const f of src.filter((x) => /\.tsx?$/.test(x))) {
      const code = fs.readFileSync(path.join(__dirname, '../src', f), 'utf8');
      for (const m of code.matchAll(/img\('([a-z_]+\/[A-Za-z0-9_]+)'\)/g)) expect([m[1], has(m[1])]).toEqual([m[1], true]);
      for (const m of code.matchAll(/sfx\('([a-z0-9_]+)'/g)) expect([m[1], reg.includes(`"${m[1]}"`)]).toEqual([m[1], true]);
    }
  });
  test('all content is English only (no Urdu script)', () => {
    const all = JSON.stringify([content.what, content.how, content.diary, content.dialogues, content.careers, content.stalls]);
    expect(/[؀-ۿ]/.test(all)).toBe(false);
  });
});

describe('RIASEC scoring', () => {
  test('counts picks from weights', () => {
    const data = { what: [] as any[], loved: [], stall_choices: [] };
    for (const c of content.what) {
      const o = c.options.find((x) => x.weights.A === 1) ?? c.options[0];
      data.what.push({ id: c.id, chosen_key: o.key });
    }
    const rep = scoreRiasec(data, content.what, content.stalls, cfg);
    expect(rep.picks.A).toBe(10);
    expect(Object.values(rep.picks).reduce((a, b) => a + b, 0)).toBe(20);
    expect(rep.code[0]).toBe('A');
    expect(rep.complete).toBe(true);
  });
  test('bounds hold for random players', () => {
    const rnd = mulberry32(4);
    for (let k = 0; k < 50; k++) {
      const data = { what: [] as any[], loved: [] as any[], stall_choices: [] as any[] };
      for (const c of content.what) {
        const o = c.options[Math.floor(rnd() * 3)];
        data.what.push({ id: c.id, chosen_key: o.key });
        data.loved.push({ type: topType(o.weights), hearts: 1 + Math.floor(rnd() * 5) });
      }
      for (let d = 1; d <= 5; d++) for (let v = 0; v < 3; v++) data.stall_choices.push({ stall: content.stalls[(d + v * 2) % 6].id });
      const rep = scoreRiasec(data, content.what, content.stalls, cfg);
      for (const t of RIASEC) {
        expect(rep.picks[t]).toBeGreaterThanOrEqual(0);
        expect(rep.picks[t]).toBeLessThanOrEqual(10);
        expect(rep.bars[t]).toBeLessThanOrEqual(1);
      }
      expect(Math.max(...Object.values(rep.bars))).toBe(1);
      expect(rep.medallions.length).toBeGreaterThanOrEqual(1);
      expect(rep.medallions.flat().length).toBeGreaterThanOrEqual(3);
    }
  });
  test('ties are broken by Loved-it mean, then stall visits', () => {
    const byType: Record<string, [string, string][]> = {};
    content.what.forEach((c) => c.options.forEach((o) => (byType[topType(o.weights)] ??= []).push([c.id, o.key])));
    const data = { what: [] as any[], loved: [] as any[], stall_choices: [] as any[] };
    const used = new Set<string>();
    for (const t of ['S', 'C']) {
      let n = 0;
      for (const [cid, key] of byType[t]) {
        if (used.has(cid)) continue;
        used.add(cid);
        data.what.push({ id: cid, chosen_key: key });
        data.loved.push({ type: t, hearts: t === 'C' ? 5 : 3 });
        if (++n === 2) break;
      }
    }
    expect(scoreRiasec(data, content.what, content.stalls, cfg).order.slice(0, 2)).toEqual(['C', 'S']);
  });
  test('missing and bad responses are safe', () => {
    expect(scoreRiasec(null, content.what, content.stalls, cfg).medallions).toEqual([]);
    const rep = scoreRiasec({ what: [{ id: 'W99', chosen_key: 'x' }, { id: 'W01', chosen_key: 'nope' }], loved: [{ type: 'Q', hearts: 9 }], stall_choices: [{ stall: 'nowhere' }] },
      content.what, content.stalls, cfg);
    expect(rep.answered).toBe(0);
  });
  test('ignores Big Five data completely', () => {
    const data = { what: content.what.map((c) => ({ id: c.id, chosen_key: c.options[1].key })), loved: [], stall_choices: [] };
    const a = scoreRiasec(data, content.what, content.stalls, cfg);
    const b = scoreRiasec({ ...data, how: Array(30).fill({ id: 'H01', chosen: 'H' }) } as any, content.what, content.stalls, cfg);
    expect(b).toEqual(a);
  });
  test('RIASEC and Big Five modules never import each other; results screens never touch Big Five', () => {
    const read = (p: string) => fs.readFileSync(path.join(__dirname, '../src', p), 'utf8');
    expect(read('logic/riasec.ts')).not.toMatch(/from '\.\/bigfive'/);
    expect(read('logic/bigfive.ts')).not.toMatch(/from '\.\/riasec'/);
    expect(read('screens/Results.tsx')).not.toMatch(/bigfive|scoreBigFive/i);
  });
});

describe('Big Five research scoring', () => {
  test('counts high-pole choices per domain', () => {
    const data = { how: content.how.map((c) => ({ id: c.id, chosen: c.domain === 'B-E' ? 'H' : 'L' })), diary: [] };
    const rep = scoreBigFive(data, content.how, content.diary);
    expect(rep.how_high_choices['B-E']).toBe(6);
    expect(Object.values(rep.how_answered).every((v) => v === 6)).toBe(true);
  });
  test('diary is not scored until an approved instrument is supplied', () => {
    expect(scoreBigFive({ how: [], diary: [{ id: 'D01', response: 4, scale_points: 5 }] }, content.how, content.diary).diary_means).toBeNull();
  });
});

describe('session', () => {
  test('full five-day game: 100 lights, 20 jobs, 15 stalls, results', async () => {
    const { s } = await newSession();
    s.newGame(2, '  Sitara the Great  ', true);
    expect(s.profile!.nickname).toBe('Sitara the G');
    playAll(s, mulberry32(7));
    expect(s.phase).toBe('done');
    expect(s.profile!.lights).toBe(100);
    expect(s.riasec!.what).toHaveLength(20);
    expect(s.riasec!.loved).toHaveLength(20);
    expect(s.riasec!.stall_choices).toHaveLength(15);
    expect(s.bigfive!.how).toHaveLength(30);
    expect(s.bigfive!.diary).toHaveLength(10);
    for (let d = 1; d <= 5; d++) expect(new Set(s.riasec!.stall_choices.filter((c) => c.day === d).map((c) => c.stall)).size).toBe(3);
  });
  test('no timing or behaviour signals are recorded', async () => {
    const { s, saves } = await newSession();
    s.newGame(0, '', true);
    playAll(s, mulberry32(3));
    await saves.flush();
    const blob = JSON.stringify([s.riasec, s.bigfive]);
    expect(blob).not.toMatch(/time|latency|duration|hesitat|ms"/i);
  });
  test('declining consent stores no research data; withdrawing deletes it', async () => {
    const a = await newSession();
    a.s.newGame(0, '', false);
    playAll(a.s, mulberry32(5));
    await a.saves.flush();
    expect([...a.kv.data.keys()].some((k) => k.endsWith('bigfive'))).toBe(false);
    expect(a.s.profile!.lights).toBe(100);
    const b = await newSession();
    b.s.newGame(0, '', true);
    playAll(b.s, mulberry32(5), (s) => s.day === 2);
    await b.saves.flush();
    expect([...b.kv.data.keys()].some((k) => k.endsWith('bigfive'))).toBe(true);
    b.s.setConsent(false);
    await b.saves.flush();
    expect([...b.kv.data.keys()].some((k) => k.endsWith('bigfive'))).toBe(false);
    expect(b.s.bigfive!.how).toHaveLength(0);
  });
  test('a stall already visited today is refused, and wrong cards are ignored', async () => {
    const { s } = await newSession();
    s.newGame(0, '', true);
    s.storyDone(); s.morningDone();
    expect(s.chooseStall('karigar')).toBe(true);
    expect(s.recordWhat('W02', [], 'x')).toBe(false);
    playAll(s, mulberry32(1), (x) => x.phase === 'map');
    expect(s.chooseStall('karigar')).toBe(false);
  });
  test('resume mid-visit and repair an interruption between writes', async () => {
    const kv = new MemoryKV();
    const a = await newSession(kv);
    a.s.newGame(1, 'Ali', true);
    playAll(a.s, mulberry32(11), (s) => s.phase === 'visit' && s.currentStep()?.[0] === 'loved');
    await a.saves.flush();
    const b = await newSession(kv);
    expect(b.s.load()).toBe(true);
    expect(b.s.currentStep()![0]).toBe('loved');
    // simulate: the response record was written but the pointer was not
    const step = b.s.currentStep()!;
    const prof = JSON.parse(kv.data.get('apna_mela.v1.profile')!);
    prof.progress.sub = 'what';
    kv.data.set('apna_mela.v1.profile', JSON.stringify(prof));
    const c = await newSession(kv);
    c.s.load();
    expect(c.s.currentStep()).toEqual(['loved', step[1]]);
  });
  test('option order is deterministic per player and card', async () => {
    const { s } = await newSession();
    s.newGame(0, '', false);
    expect(s.optionOrder('W05', 3)).toEqual(s.optionOrder('W05', 3));
    expect([...s.optionOrder('W05', 3)].sort()).toEqual([0, 1, 2]);
  });
  test('corrupt save raises SaveCorrupt; bad values are sanitised', async () => {
    const kv = new MemoryKV();
    kv.data.set('apna_mela.v1.profile', '{not json');
    const a = await newSession(kv);
    expect(() => a.s.load()).toThrow(SaveCorrupt);
    const kv2 = new MemoryKV();
    const b = await newSession(kv2);
    b.s.newGame(0, '', true);
    await b.saves.flush();
    const prof = JSON.parse(kv2.data.get('apna_mela.v1.profile')!);
    prof.progress = { day: 99, phase: 'bogus', visit: -4, stall: 'nowhere' };
    kv2.data.set('apna_mela.v1.profile', JSON.stringify(prof));
    const c = await newSession(kv2);
    c.s.load();
    expect(c.s.day).toBe(5);
    expect(c.s.phase).toBe('map');
    expect(c.s.progress.visit).toBe(0);
  });
});
