// Browser end-to-end test of the "APK case": a release build with NO server address built in.
// The school admin enters the address, tests it, saves it; a student then starts the Adventure and the game connects.
//   EXPO_PUBLIC_RAHYAAB_ALLOW_HTTP=1 npx expo export --platform web --output-dir dist-web     (no EXPO_PUBLIC_RAHYAAB_API_URL!)
//   RAHYAAB_E2E_DIST=<this app>/dist-web python mobile/e2e-web/serve.py                     (in the RahYaab backend repo)
//   node e2e/admin-server.e2e.js
const { chromium } = require('playwright');
const fs = require('fs');

const BASE = process.env.BASE_URL || 'http://127.0.0.1:8090';
const OUT = process.env.SHOTS_DIR || __dirname + '/shots';
fs.mkdirSync(OUT, { recursive: true });
const shot = async (page, name, fullPage = false) => { await page.waitForTimeout(300); await page.screenshot({ path: `${OUT}/${name}.png`, fullPage }); console.log('shot', name); };

(async () => {
  const browser = await chromium.launch();
  const page = await (await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })).newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  const field = () => page.getByPlaceholder('http://192.168.1.7:5000');

  await page.goto(BASE);
  // a student first: the Adventure explains that no server is set
  await page.getByText('Create an account').click();
  await page.getByPlaceholder('Full name').fill('Ayesha Khan');
  await page.getByPlaceholder('Email').fill('ayesha@school.pk');
  await page.getByPlaceholder('Password').fill('secret1');
  await page.getByPlaceholder('Grade (9 to 12)').fill('10');
  await page.getByText('Register', { exact: true }).click();
  await page.getByPlaceholder('Email').fill('ayesha@school.pk');
  await page.getByPlaceholder('Password').fill('secret1');
  await page.getByText('Log in', { exact: true }).click();
  await page.getByText('Start adventure').click();
  await page.getByText(/Ask your school admin/).waitFor();
  await shot(page, '21_not_set');
  await page.getByText('Back', { exact: true }).click();
  await page.getByText('Log out').click();

  // admin sets the address
  await page.getByPlaceholder('Email').fill('admin@demo.edu');
  await page.getByPlaceholder('Password').fill('admin123');
  await page.getByText('Log in', { exact: true }).click();
  await page.getByText('🔌 RahYaab server').waitFor();
  await field().fill('http://127.0.0.1:5999');             // nothing listens there
  await page.getByText('Test connection').click();
  await page.getByText(/Can't reach the server/).waitFor({ timeout: 15000 });
  await shot(page, '22_wrong_address');
  await field().fill(BASE + '/');
  await page.getByText('Test connection').click();
  await page.getByText('✅ Connected to the RahYaab server.').waitFor();
  await page.getByText('Save', { exact: true }).click();
  await page.getByText(/Saved/).waitFor();
  await shot(page, '23_saved');
  await page.getByText('Log out').click();

  // the student's Adventure now reaches the real server
  await page.getByPlaceholder('Email').fill('ayesha@school.pk');
  await page.getByPlaceholder('Password').fill('secret1');
  await page.getByText('Log in', { exact: true }).click();
  await page.getByText('Start adventure').click();
  await page.getByLabel('I understand and agree to take part').click();
  await page.getByText('Continue', { exact: true }).click();
  await page.getByTestId('name-continue').click();
  await page.getByTestId('begin').waitFor({ timeout: 30000 });   // the server session is created here
  await shot(page, '24_game_started');
  const sessions = await (await page.request.get(`${BASE}/api/sessions?limit=5`)).json();
  const list = Array.isArray(sessions) ? sessions : sessions.sessions || [];
  console.log('SERVER sessions created by the app:', list.length);
  // the expected "Can't reach" probe of 127.0.0.1:5999 logs one network error in the browser console
  const real = errors.filter((e) => !/127\.0\.0\.1:5999|ERR_CONNECTION_REFUSED/.test(e));
  console.log('ERRORS', JSON.stringify(real));
  await browser.close();
  if (!list.length || real.length) process.exit(1);
})().catch((e) => { console.error('FAILED', e); process.exit(1); });
