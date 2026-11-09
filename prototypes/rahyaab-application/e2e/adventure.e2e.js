// Browser end-to-end test of the whole RahYaab app against the REAL RahYaab server (Flask + Python scoring).
//
// 1. Web build of this app with the server URL:
//      EXPO_PUBLIC_RAHYAAB_API_URL=http://127.0.0.1:8090 EXPO_PUBLIC_RAHYAAB_ALLOW_HTTP=1 npx expo export --platform web --output-dir dist-web
//    (needs react-dom, react-native-web and @expo/metro-runtime: `npx expo install react-dom react-native-web @expo/metro-runtime`)
// 2. In the RahYaab backend repo:  RAHYAAB_E2E_DIST=<this app>/dist-web python mobile/e2e-web/serve.py
// 3. node e2e/adventure.e2e.js            (needs `playwright` with Chromium; SHOTS_DIR=... to choose the screenshot folder)
const { chromium } = require('playwright');
const fs = require('fs');

const BASE = process.env.BASE_URL || 'http://127.0.0.1:8090';
const OUT = process.env.SHOTS_DIR || __dirname + '/shots';
const PORTRAIT = { width: 390, height: 844 };
const LANDSCAPE = { width: 844, height: 390 };
fs.mkdirSync(OUT, { recursive: true });

async function shot(page, name, fullPage = false) {
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage });
  console.log('shot', name);
}

async function hold(page, label, ms) {
  const box = await page.getByLabel(label, { exact: true }).boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(ms);
  await page.mouse.up();
}

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: PORTRAIT, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

  // register + log in
  await page.goto(BASE);
  await page.getByText('Create an account').waitFor({ timeout: 30000 });
  await shot(page, '01_login');
  await page.getByText('Create an account').click();
  await page.getByPlaceholder('Full name').fill('Ayesha Khan');
  await page.getByPlaceholder('Email').fill(`ayesha${Date.now()}@school.pk`);
  const email = await page.getByPlaceholder('Email').inputValue();
  await page.getByPlaceholder('Password').fill('secret1');
  await page.getByPlaceholder('Grade (9 to 12)').fill('10');
  await page.getByText('Register', { exact: true }).click();
  await page.getByPlaceholder('Email').fill(email);
  await page.getByPlaceholder('Password').fill('secret1');
  await page.getByText('Log in', { exact: true }).click();
  await page.getByText('Hi Ayesha 👋').waitFor();
  await shot(page, '02_home', true);

  // Home -> Start adventure opens the full track (consent first)
  await page.getByText('Start adventure').click();
  await page.getByText(/my game choices are saved/).waitFor();
  await shot(page, '03_consent');
  await page.reload(); // back to the app (the game keeps nothing until it starts)
  await page.getByText('Hi Ayesha 👋').waitFor();

  // Games tab -> adventure -> level select -> Harbor Village
  await page.getByText('Games', { exact: true }).click();
  await shot(page, '04_games');
  await page.getByText('Play the adventure').click();
  await page.getByText('New Assessment').waitFor();
  await shot(page, '05_game_menu');
  await page.getByLabel('Use arrow buttons instead of joystick').click();
  await page.getByText('Level Select', { exact: true }).click();
  await page.getByText('3.  Harbor Village', { exact: true }).click();
  await page.getByLabel('I understand and agree to take part').click();
  await page.getByText('Continue', { exact: true }).click();
  await page.getByTestId('name-continue').click();
  await page.getByTestId('begin').click();
  await page.getByTestId('start-level').click();
  await page.setViewportSize(LANDSCAPE);
  await page.getByLabel('Move right', { exact: true }).waitFor();
  await shot(page, '06_play_landscape');

  const answers = [/hurry/, /together/, /goodbye/i, /few coins/, /goodbye/i, /plain loaf/];
  let i = 0;
  for (let t = 0; t < 400 && i < answers.length; t++) {
    const radios = page.getByRole('radio');
    if ((await radios.count()) > 0) {
      await radios.filter({ hasText: answers[i] }).first().click();
      await page.waitForTimeout(120);
      if (i === 0) await shot(page, '07_dialog');
      await page.getByTestId('choice-confirm').click();
      await page.waitForTimeout(250);
      i += 1;
      continue;
    }
    if (await page.getByTestId('outcome-0').count()) break;
    await hold(page, 'Move right', 300);
  }
  await page.getByTestId('outcome-0').waitFor({ timeout: 30000 });
  await page.getByTestId('outcome-0').click();
  await page.setViewportSize(PORTRAIT);
  await page.getByText('BIG FIVE INDICATORS').waitFor({ timeout: 60000 });
  await shot(page, '08_game_results');
  await page.getByTestId('results-done').click();

  // back in the app: its own Adventure report with career matches
  await page.getByText('Adventure report 🗺️').waitFor();
  await shot(page, '09_adventure_report', true);
  await page.getByText('Back to home').click();
  await page.getByText('History', { exact: true }).click();
  await page.getByText(/Adventure · 1 level/).waitFor();
  await shot(page, '10_history');
  await page.getByText('Home', { exact: true }).click();
  await page.getByText('📊 Latest adventure report').waitFor();

  // the server really scored it
  const sessions = await (await page.request.get(`${BASE}/api/sessions?limit=5`)).json();
  const list = Array.isArray(sessions) ? sessions : sessions.sessions || [];
  const done = list.filter((s) => s.status === 'completed' && s.game_version === '0.2.0-mobile');
  console.log('SERVER completed mobile sessions:', done.length, done[0] ? `${done[0].session_id} events=${done[0].n_events}` : '');
  console.log('ERRORS', JSON.stringify(errors.slice(0, 20)));
  await browser.close();
  if (!done.length || errors.length) process.exit(1);
})().catch((e) => {
  console.error('FAILED', e);
  process.exit(1);
});
