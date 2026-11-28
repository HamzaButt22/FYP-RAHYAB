// End-to-end playthrough of Naya Shehar in headless Chrome, using real taps only.
// usage: node e2e.js <baseUrl> <outDir>
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const [base, out] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const DAY = 24 * 3600 * 1000;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const MATCH = { 'Warm shawl': 'Nani Jan', 'Reading glasses': 'Nani Jan', 'School book': 'Little Ali', 'Lunch box': 'Little Ali', 'Water jug': 'Uncle Riaz', 'Bus ticket': 'Uncle Riaz',
  'Shop receipt': 'Money', 'Grant cheque': 'Money', 'Thank-you note': 'Letters', 'School invitation': 'Letters', 'Canal plan': 'Maps', 'Bus route': 'Maps' };

const N = 1, E = 2, S = 4, W = 8;
const rotMask = (m, r) => { let x = m; for (let i = 0; i < r; i++) x = ((x << 1) | (x >> 3)) & 15; return x; };
const BASE = { straight: N | S, corner: N | E };
const DIRS = { [N]: [0, -1], [E]: [1, 0], [S]: [0, 1], [W]: [-1, 0] }, OPP = { [N]: S, [S]: N, [E]: W, [W]: E };
function solvePipes(tiles) {
  const go = (cur, x, y, from, used) => {
    if (x < 0 || y < 0 || x > 2 || y > 2 || used.has(y * 3 + x)) return null;
    const i = y * 3 + x;
    for (let r = 0; r < 4; r++) {
      const m = rotMask(BASE[cur[i].kind], r);
      if (!(m & from)) continue;
      const out = m & ~from;
      const next = cur.map((t, j) => (j === i ? { ...t, rot: r } : t));
      if (x === 2 && y === 1 && out === E) return next;
      const [dx, dy] = DIRS[out];
      const u = new Set(used); u.add(i);
      const res = go(next, x + dx, y + dy, OPP[out], u);
      if (res) return res;
    }
    return null;
  };
  return go(tiles, 0, 1, W, new Set());
}

(async () => {
  const browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome', args: ['--no-sandbox', '--disable-gpu'], headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 360, height: 640, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const errors = [];
  page.on('pageerror', (e) => errors.push('PAGEERROR ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console.error ' + m.text().slice(0, 400)); });
  let offset = 0;
  await page.evaluateOnNewDocument(() => {
    const real = Date.now.bind(Date);
    const get = () => Number(localStorage.getItem('__e2e_offset') || 0);
    Date.now = () => real() + get();
  });
  const shots = new Set();
  const shot = async (name, force) => { if (shots.has(name) && !force) return; shots.add(name); await sleep(350); await page.screenshot({ path: `${out}/${String(shots.size).padStart(2, '0')}_${name}.png` }); };
  const vis = async (h) => h.evaluate((e) => e.getClientRects().length > 0);
  const first = async (sel) => { for (const h of await page.$$(sel)) if (await vis(h)) return h; return null; };
  const has = (sel) => first(sel).then((x) => !!x);
  const tid = (id) => `[data-testid="${id}"]`;
  const clickSel = async (sel) => { const el = await first(sel); if (!el) return false; try { await el.click(); } catch { await el.evaluate((e) => { e.scrollIntoView({ block: 'center' }); e.click(); }); } await sleep(120); return true; };
  const labels = () => page.$$eval('[aria-label]', (els) => els.filter((e) => e.offsetParent !== null || e.getClientRects().length).map((e) => ({ l: e.getAttribute('aria-label'), d: e.getAttribute('aria-disabled') === 'true' || e.hasAttribute('disabled'), s: e.getAttribute('aria-selected') === 'true' || e.getAttribute('aria-checked') === 'true' })));
  const clickLabel = async (pred) => {
    const handles = await page.$$('[aria-label]');
    for (const h of handles) {
      const l = await h.evaluate((e) => e.getAttribute('aria-label'));
      const dis = await h.evaluate((e) => e.getAttribute('aria-disabled') === 'true' || e.getClientRects().length === 0);
      if (l && !dis && pred(l)) {
        try { await h.click(); } catch { await h.evaluate((e) => { e.scrollIntoView({ block: 'center' }); e.click(); }); }
        await sleep(140); return l;
      }
    }
    return null;
  };

  await page.goto(base + '/', { waitUntil: 'networkidle0' });
  await sleep(600); await shot('splash');
  await sleep(2200); await shot('welcome');
  await clickSel(tid('welcome-start')); await sleep(500); await shot('intro');
  for (let i = 0; i < 3; i++) { await clickSel(tid('intro-next')); await sleep(400); }
  await shot('avatar');
  await clickLabel((l) => l === 'Hair'); await sleep(200);
  await clickLabel((l) => l === 'Dupatta'); await clickLabel((l) => l === 'Clothes'); await sleep(200);
  await clickLabel((l) => l === 'Hoodie'); await clickLabel((l) => l === 'Nickname'); await sleep(200);
  await clickLabel((l) => l === 'Shaheen'); await shot('avatar_custom');
  await clickSel(tid('avatar-save')); await sleep(800);

  const seen = {};
  let weeksDone = 0;
  let guard = 0;
  let lastWeekFinished = -1;
  while (guard++ < 2500) {
    await sleep(160);
    const url = page.url();
    if (guard % 60 === 0) { const L = await labels(); console.log('DBG', guard, url, JSON.stringify(L.slice(0, 14).map((x) => x.l))); }
    if (url.includes('/town') || url.includes('/menu')) {
      if (url.includes('/town')) await shot(`town_after_week_${lastWeekFinished}`);
      if (await has(tid('next-action')) || await has(tid('menu-continue'))) {
        await (await has(tid('next-action')) ? clickSel(tid('next-action')) : clickSel(tid('menu-continue')));
        await sleep(700);
        continue;
      }
    }
    if (url.includes('/locked')) {
      await shot('locked');
      // Simulate a week passing AND the app being closed and reopened.
      offset += 8 * DAY;
      await page.evaluate((o) => localStorage.setItem('__e2e_offset', String(o)), offset);
      await page.goto(base + '/', { waitUntil: 'networkidle0' });
      await sleep(2600);
      continue;
    }
    if (url.includes('/reveal')) { await sleep(2600); await shot('final_reveal'); await clickSel(tid('reveal-next')); await sleep(600); continue; }
    if (url.includes('/summary')) { await shot('summary'); await clickSel(tid('summary-next')); await sleep(600); continue; }
    if (url.includes('/about-you')) { await clickLabel((l) => l === 'Science: With Computer'); await shot('about_you'); await clickSel(tid('about-save')); await sleep(800); continue; }
    if (url.includes('/results')) { await shot('results_top'); await page.evaluate(() => window.scrollTo(0, 900)); await page.evaluate(() => document.querySelectorAll('div').forEach((d) => { if (d.scrollHeight > d.clientHeight + 50) d.scrollTop = 1300; })); await shot('results_paths'); break; }
    if (!url.includes('/play')) { await sleep(300); continue; }

    // ───── inside a session ─────
    if (await clickSel(tid('season-begin'))) { continue; }
    if (await has(tid('dialogue-next'))) { await shot('dialogue'); await clickSel(tid('dialogue-next')); continue; }
    if (await has(tid('tour-done'))) { await clickSel(tid('tour-done')); continue; }
    if (await clickLabel((l) => l.startsWith('Youth Office & Community Centre.'))) { await shot('tour'); continue; }
    if (await has(tid('planner-commit'))) {
      await shot('planner');
      const ls = await labels();
      const cards = ls.filter((x) => / With (Ustad Rafiq|Dr Hina|Kamran|Zoya|Bilal|Ayesha|Baji Saima)\./.test(x.l) && !x.s);
      const pick = cards.sort(() => Math.random() - 0.5).slice(0, 3);
      for (const c of pick) await clickLabel((l) => l === c.l);
      await clickLabel((l) => l.startsWith('Move ') && l.endsWith(' down'));
      await shot('planner_filled');
      await clickSel(tid('planner-commit')); continue;
    }
    if (await has(tid('option-left'))) {
      await shot('choice');
      await clickSel(tid(Math.random() < 0.5 ? 'option-left' : 'option-right'));
      await clickSel(tid('choice-confirm')); await sleep(300); continue;
    }
    if (await clickSel(tid('planned-start'))) { await shot('planned_intro'); continue; }
    if (await has(tid('mini-done'))) { seen.mini = (seen.mini || 0) + 1; if (seen.mini <= 4) await shot('minigame_done_' + seen.mini); await clickSel(tid('mini-done')); continue; }
    // mini-games
    let ls = await labels();
    if (ls.some((x) => x.l.startsWith('Pipe 1,'))) {
      await shot('mini_pipes');
      const tiles = [];
      for (let i = 1; i <= 9; i++) {
        const l = ls.find((x) => x.l.startsWith(`Pipe ${i},`)).l;
        tiles.push({ kind: l.includes('straight') ? 'straight' : 'corner', rot: Number(/turned (\d+)/.exec(l)[1]) / 90 });
      }
      const sol = solvePipes(tiles);
      if (!sol) throw new Error('pipe solver failed');
      for (let i = 0; i < 9; i++) for (let k = 0; k < (sol[i].rot - tiles[i].rot + 4) % 4; k++) await clickLabel((l) => l.startsWith(`Pipe ${i + 1},`));
      continue;
    }
    if (ls.some((x) => x.l.startsWith('Look at '))) { await shot('mini_clues'); while (await clickLabel((l) => l.startsWith('Look at ')) && !(await has(tid('mini-done')))); continue; }
    if (ls.some((x) => x.l.startsWith('Invite '))) { await shot('mini_rally'); while (await clickLabel((l) => l.startsWith('Invite ')) && !(await has(tid('mini-done')))); continue; }
    if (ls.some((x) => x.l.startsWith('Paint the '))) {
      await shot('mini_paint');
      const cols = ['Pink paint', 'Green paint', 'Yellow paint', 'Blue paint', 'Orange paint', 'Purple paint'];
      for (let i = 0; i < 6; i++) { await clickLabel((l) => l === cols[i]); await clickLabel((l) => l.startsWith('Paint the ') && !l.endsWith(', painted')); }
      continue;
    }
    if (ls.some((x) => x.l.startsWith('Pick up '))) {
      await shot('mini_match_' + (ls.some((x) => x.l.startsWith('Pick up Warm')) ? 'help' : 'sort'));
      for (const [item, target] of Object.entries(MATCH)) {
        if (await clickLabel((l) => l === `Pick up ${item}`)) await clickLabel((l) => l === target || l.startsWith(`${target},`));
      }
      continue;
    }
    if (ls.some((x) => x.l === 'Loved it') && ls.some((x) => x.l === 'Skip')) {
      await shot('reaction');
      const r = Math.random();
      await clickLabel((l) => l === (r < 0.25 ? 'Skip' : r < 0.5 ? 'Meh' : r < 0.7 ? 'Okay' : 'Loved it'));
      await sleep(400); continue;
    }
    if (await has(tid('reward-next'))) { await shot('reward'); await clickSel(tid('reward-next')); continue; }
    // puzzles
    if (await has(tid('puzzle-continue'))) { await shot('puzzle_feedback'); await clickSel(tid('puzzle-continue')); continue; }
    if (ls.some((x) => x.l === 'Check answer')) {
      await shot('puzzle_num');
      await clickLabel((l) => l === '4'); await clickLabel((l) => l === '0'); await clickLabel((l) => l === 'Check answer'); continue;
    }
    if (ls.some((x) => x.l.startsWith('Add ') && x.l.endsWith(' as the next stop'))) {
      await shot('puzzle_route');
      while (await clickLabel((l) => l.startsWith('Add ') && l.endsWith(' as the next stop')));
      await clickLabel((l) => l === 'Send the bus'); continue;
    }
    if (ls.some((x) => x.l.startsWith('Option A:'))) {
      const kind = ls.some((x) => x.l.includes('Piece with rows')) ? 'spa' : ls.some((x) => / (circle|square|triangle|diamond|arrow)s?( pointing \w+)?$/.test(x.l)) ? 'abs' : 'text';
      await shot('puzzle_' + kind);
      const opts = ls.filter((x) => /^Option [ABCD]:/.test(x.l) && !x.d && !x.l.includes('tried'));
      if (opts.length) await clickLabel((l) => l === opts[Math.floor(Math.random() * opts.length)].l);
      continue;
    }
    if (await has(tid('build-go'))) { await shot('build_before'); await clickSel(tid('build-go')); await sleep(3800); await shot('build_after'); continue; }
    if (await clickSel(tid('build-next'))) continue;
    if (await has(tid('letter-open'))) { await shot('letter_envelope'); await clickSel(tid('letter-open')); await sleep(900); await shot(`letter_w${weeksDone}`); continue; }
    if (await clickSel(tid('letter-done'))) continue;
    if (await has(tid('week-finish'))) { await shot(`week_complete_${weeksDone}`); lastWeekFinished = weeksDone; weeksDone++; await clickSel(tid('week-finish')); await sleep(900); continue; }
  }
  // Pause menu works from the town
  await page.goto(base + '/town', { waitUntil: 'networkidle0' }); await sleep(1500);
  await shot('town_final', true);
  await clickSel(tid('pause')); await sleep(500); await shot('pause');
  await page.goto(base + '/accessibility', { waitUntil: 'networkidle0' }); await sleep(800); await shot('accessibility');
  await page.goto(base + '/progress', { waitUntil: 'networkidle0' }); await sleep(800); await shot('progress');
  await page.goto(base + '/building/pump_station', { waitUntil: 'networkidle0' }); await sleep(800); await shot('building');
  await page.goto(base + '/district/rang_bazaar', { waitUntil: 'networkidle0' }); await sleep(800); await shot('district');
  const save = await page.evaluate(() => localStorage.getItem('naya-shehar-save-v1'));
  const parsed = JSON.parse(save);
  const ev = parsed.events;
  const count = (t) => ev.filter((e) => e.event.type === t).length;
  console.log(JSON.stringify({ guard, weeksDone, url: page.url(), events: { choice_made: count('choice_made'), plan_committed: count('plan_committed'), task_result: count('task_result'), reaction: count('reaction') }, shots: shots.size }, null, 0));
  console.log(errors.length ? 'ERRORS:\n' + [...new Set(errors)].slice(0, 20).join('\n') : 'NO RUNTIME ERRORS');
  await browser.close();
})().catch((e) => { console.error('E2E FAILED', e); process.exit(1); });
