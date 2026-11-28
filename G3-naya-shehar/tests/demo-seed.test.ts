/**
 * @jest-environment node
 *
 * Fills a running dashboard with a realistic demo class (for presentations).
 * Skipped unless DEMO_URL is set:
 *   DEMO_URL=http://localhost:8080 DEMO_USER=admin DEMO_PASS=... npm run seed:demo
 */
import { GameEngine } from '@/game/engine/GameEngine';
import { MemoryStore } from '@/database/store';
import { syncNow } from '@/services/sync';
import { NICKNAMES, DEFAULT_AVATAR, SKIN_TONES, HAIR_STYLES, OUTFIT_COLOURS } from '@/game/avatar';
import { RIASEC, Riasec, Week } from '@/assessment/types';
import { rng } from '@/assessment/abilities/geometry';
import { DAY, FakeClock, playWeek } from './helpers';
import { MatricGroup } from '@/assessment/recommendations/rules';

// eslint-disable-next-line @typescript-eslint/no-require-imports
(globalThis as { fetch: typeof fetch }).fetch = require('node-fetch');

const URL_ = process.env.DEMO_URL;
const run = URL_ ? test : test.skip;
let cookie = '';
async function web(url: string, form?: Record<string, string>) {
  const res = await fetch(URL_ + url, form
    ? { method: 'POST', redirect: 'manual', headers: { cookie, 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(form).toString() }
    : { redirect: 'manual', headers: { cookie } });
  const sc = res.headers.get('set-cookie'); if (sc) cookie = sc.split(';')[0];
  return res;
}

run('seed a demo class', async () => {
  await web('/login', { username: process.env.DEMO_USER ?? 'admin', password: process.env.DEMO_PASS ?? '' });
  const page = await (await web('/classes')).text();
  const csrf = /name="_csrf" value="([^"]+)"/.exec(page)![1];
  const r = await web('/classes', { name: 'Class 9 Blue', school: 'Govt. Model High School, Rawalpindi', _csrf: csrf });
  const code = /created=(\d{6})/.exec(r.headers.get('location')!)![1];
  const rand = rng(2026);
  const groups: MatricGroup[] = ['science_biology', 'science_computer', 'science_computer', 'humanities', 'not_yet'];
  for (let roll = 1; roll <= 28; roll++) {
    const clock = new FakeClock(Date.UTC(2026, 9, 5, 9) + roll * 3600e3);
    const engine = new GameEngine(new MemoryStore(), clock.now);
    engine.setAvatar({ ...DEFAULT_AVATAR, nickname: NICKNAMES[roll % NICKNAMES.length], skin: SKIN_TONES[roll % 6], hair: HAIR_STYLES[roll % 8], outfitColour: OUTFIT_COLOURS[roll % 8] });
    engine.setLink(code, roll);
    // Each student has real (noisy) preferences and a skill level.
    const base = RIASEC.map(() => rand() * 2 - 1);
    const lead = Math.floor(rand() * 6); base[lead] += 1.4;
    const pref = Object.fromEntries(RIASEC.map((c, i) => [c, base[i] + (rand() - 0.5) * 0.6])) as Record<Riasec, number>;
    const skill = rand();
    const noisyPref = () => Object.fromEntries(RIASEC.map((c) => [c, pref[c] + (rand() - 0.5) * 1.2])) as Record<Riasec, number>;
    const weeks = roll <= 19 ? 4 : roll <= 23 ? 3 : roll <= 26 ? 2 : 1;
    playWeek(engine, 0, { pref, solve: () => true });
    for (let w = 1; w <= weeks; w++) {
      if (w > 1) clock.advance(7 * DAY + 3600e3);
      if (roll === 21 && w === 2) engine.updateSettings({ accessibleMode: true });
      if (roll === 21 && w === 3) engine.updateSettings({ accessibleMode: false });
      playWeek(engine, w as Week, { pref: noisyPref(), solve: (p) => rand() < 0.35 + skill * 0.5 - (p.level - 2) * 0.12, react: rand() < 0.7 });
    }
    if (weeks === 4 && roll !== 18) engine.setStudent({ classLevel: 9, matricGroup: groups[roll % groups.length] });
    const res = await syncNow(engine, { apiUrl: URL_! });
    expect(res.ok).toBe(true);
  }
  console.log(`Demo class code: ${code}`);
}, 120000);
