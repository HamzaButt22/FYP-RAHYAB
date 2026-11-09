// End-to-end check of the requirements (FR-1..FR-7) in a browser against the REAL RahYaab server.
// Server: RAHYAAB_REQUIRE_USER_AUTH=1 RAHYAAB_OUTBOX=<dir> RAHYAAB_E2E_DIST=<this app>/dist-web python mobile/e2e-web/serve.py <db>
// (with a platform admin team@rahyaab.pk / TeamPass123 created by `python -m tools.create_admin`).
// Then: OUTBOX=<dir> GAME_FIXTURE=<recorded levels 1-6 json> node e2e/requirements.e2e.js
const {chromium} = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE = process.env.BASE_URL || 'http://127.0.0.1:8090';
const OUT = process.env.SHOTS_DIR || path.join(__dirname, 'shots');
const OUTBOX = process.env.OUTBOX;
const FIXTURE = process.env.GAME_FIXTURE || path.join(__dirname, '..', 'src/features/rahyaab-game/__tests__/fixtures/parity/bigfive_balanced_15.json');
fs.mkdirSync(OUT, {recursive: true});
const log = (...a) => console.log('✔', ...a);
const shot = async (p, n, full = true) => { await p.waitForTimeout(250); await p.screenshot({path: `${OUT}/${n}.png`, fullPage: full}); };

async function newPage(browser) {
  const ctx = await browser.newContext({viewport: {width: 390, height: 844}, deviceScaleFactor: 2, isMobile: true, hasTouch: true});
  const page = await ctx.newPage();
  page.errors = [];
  page.on('pageerror', (e) => page.errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error' && !/401|409|402|Failed to load resource/.test(m.text())) page.errors.push(m.text()); });
  await page.goto(BASE);
  await page.getByText('Welcome back').waitFor({timeout: 30000});
  return page;
}
const t = (p, s) => p.getByText(s, {exact: true});
async function login(p, who, pw) {
  await p.getByPlaceholder('Email or username').fill(who);
  await p.getByPlaceholder('Password', {exact: true}).fill(pw);
  await t(p, 'Log in').click();
}
async function changeTemp(p, temp, mine) {
  await p.getByText(/temporary password/).first().waitFor();
  await p.getByPlaceholder('Current password').fill(temp);
  await p.getByPlaceholder('New password (8+ characters, letters and numbers)').fill(mine);
  await p.getByPlaceholder('Repeat new password').fill(mine);
  await p.getByText('Change password', {exact: true}).last().click();
}
const grab = async (p, re) => (await p.getByText(re).first().textContent()).match(re)[1];

(async () => {
  const browser = await chromium.launch();

  // ---------------------------------------------------------------- platform admin creates a school (FR-7)
  const pa = await newPage(browser);
  await shot(pa, '01_login', false);
  await login(pa, 'team@rahyaab.pk', 'TeamPass123');
  await t(pa, 'RahYaab admin 🛠️').waitFor();
  await t(pa, '🏫 Schools').click();
  await pa.getByPlaceholder('School name').fill('Riverside School');
  await pa.getByPlaceholder("School admin's name").fill('Ms Sana');
  await pa.getByPlaceholder("School admin's login (email or username)").fill('sana.admin');
  await t(pa, 'Add school').click();
  const schoolTemp = await grab(pa, /Temporary password: (\S+)/);
  await shot(pa, '02_platform_school_created');
  log('platform admin created a school + school admin');

  // ---------------------------------------------------------------- school admin adds a student (FR-1, FR-7)
  const sa = await newPage(browser);
  await login(sa, 'sana.admin', schoolTemp);
  await changeTemp(sa, schoolTemp, 'SchoolPass1');
  await t(sa, 'Riverside School 🏫').waitFor();
  await sa.getByPlaceholder('Full name').fill('Ali Raza');
  await sa.getByPlaceholder('Login (username like ali.raza, or email)').fill('ali.raza');
  await t(sa, '10').click();
  await t(sa, 'Add student').click();
  const studentTemp = await grab(sa, /Temporary password: (\S+)/);
  await shot(sa, '03_school_admin_student_added');
  await t(sa, 'Done').click();
  log('school admin changed temporary password and added a student');

  // ---------------------------------------------------------------- school student: consent -> game (FR-1.4, FR-2)
  const st = await newPage(browser);
  await login(st, 'ali.raza', studentTemp);
  await changeTemp(st, studentTemp, 'StudentPass1');
  await t(st, 'Hi Ali 👋').waitFor();
  await shot(st, '04_student_home');
  await t(st, 'Start assessment').click();
  await t(st, 'What we collect and why').waitFor();
  if (await st.getByText(/parent or guardian knows/).count()) throw new Error('school student was asked for guardian consent');
  await shot(st, '05_consent');
  await t(st, 'I understand and agree to take part.').click();
  await t(st, 'Start').click();
  await t(st, 'Play levels 1-6').waitFor();
  await shot(st, '06_part1');
  await t(st, 'Play levels 1-6').click();
  await st.getByTestId('name-continue').waitFor({timeout: 30000}); // the real game module opened for the bigfive track
  await shot(st, '07_game_opened', false);
  log('consent recorded; Adventure opened (levels 1-6)');

  // the 6 levels are played by uploading a real desktop recording with the student's own login (same endpoints)
  const token = await st.evaluate(() => localStorage.getItem('rahyaab_token'));
  const H = {Authorization: `Bearer ${token}`};
  const me = await (await st.request.get(`${BASE}/api/app/me`, {headers: H})).json();
  const list = await (await st.request.get(`${BASE}/api/app/assessments`, {headers: H})).json();
  const aid = list.assessments[0].assessment_id;
  const pid = list.assessments[0].player_id;
  if ((await st.request.post(`${BASE}/api/sessions`, {data: {player_id: pid + 1000, game_version: 'x', seed: 1}, headers: H})).status() !== 403)
    throw new Error('server accepted a session for someone else');
  const rec = JSON.parse(fs.readFileSync(FIXTURE, 'utf8'));
  const sid = (await (await st.request.post(`${BASE}/api/sessions`, {data: {player_id: pid, game_version: '0.2.0-mobile', seed: rec.seed}, headers: H})).json()).session_id;
  const evs = rec.events.map((e) => ({...e, timestamp: '2026-10-30T10:00:00.000'}));
  for (let i = 0; i < evs.length; i += 400) await st.request.post(`${BASE}/api/sessions/${sid}/events`, {data: {events: evs.slice(i, i + 400)}, headers: H});
  await st.request.post(`${BASE}/api/sessions/${sid}/complete`, {data: {duration_ms: 900000}, headers: H});
  await st.evaluate(([k, v]) => localStorage.setItem(k, v), [`rahyaab_pending_game_${me.user_id}`, JSON.stringify({aid, sid})]);
  await st.reload();
  await t(st, 'Continue: the adventure').waitFor({timeout: 30000});
  await t(st, 'Continue: the adventure').click(); // the app finds the finished game and links it (retry path)
  await st.getByText('Question 1 of 24').waitFor({timeout: 30000});
  log('finished game linked by the app (pending-link retry), questionnaire opened');

  // ---------------------------------------------------------------- questionnaire with saved progress (FR-4)
  const scale = ['Not at all', 'A little', 'Somewhat', 'Quite a bit', 'Very much'];
  const pattern = [4, 4, 1, 3, 4, 3, 1, 2, 3, 2, 1, 1, 4, 5, 4, 3, 2, 3, 2, 3, 2, 2, 3, 1];
  for (let i = 0; i < 12; i++) { await st.getByText(`Question ${i + 1} of 24`).waitFor(); await st.getByText(scale[pattern[i] - 1], {exact: true}).first().click(); }
  await st.getByText('Question 13 of 24').waitFor();
  await shot(st, '08_questionnaire', false);
  await t(st, 'Continue later').click();
  await st.reload();
  await t(st, 'Continue: questions').click();
  await st.getByText('Question 13 of 24').waitFor(); // resumed exactly where it stopped
  for (let i = 12; i < 24; i++) { await st.getByText(`Question ${i + 1} of 24`).waitFor(); await st.getByText(scale[pattern[i] - 1], {exact: true}).first().click(); }
  await t(st, 'See my results').click();
  log('questionnaire saved, resumed at question 13, submitted');

  // ---------------------------------------------------------------- results (FR-5, FR-6)
  await t(st, 'Your results 🎉').waitFor({timeout: 30000});
  await st.getByLabel(/Personality chart/).waitFor();
  await st.getByText(/Your interests: [RIASEC]{3}/).waitFor();
  await st.getByText(/^Pathway for grades 9-10$/).first().click();
  await st.getByText(/^How was this worked out\?$/).first().click();
  await st.getByText(/not a final career decision/).waitFor();
  await st.getByLabel('How useful are these results? 4 of 5').click();
  await st.getByLabel('How well do they describe you? 3 of 5').click();
  await t(st, 'Send rating').click();
  await t(st, 'Thanks for your rating!').waitFor();
  await shot(st, '09_results');
  await t(st, 'Back to home').click();
  await t(st, 'History').click();
  await st.getByText(/Completed · [RIASEC]{3}/).waitFor();
  await shot(st, '10_history', false);
  await t(st, 'Profile').click();
  await st.getByPlaceholder('Age (optional)').fill('15');
  await t(st, 'Female').click();
  await t(st, 'Save profile').click();
  await t(st, 'Saved.').waitFor();
  await shot(st, '11_profile');
  log('results with radar, interests, pathways, calculation, disclaimer, rating; history; profile edit');

  // ---------------------------------------------------------------- reset code from the school admin (FR-1.2)
  await sa.reload();
  await t(sa, 'Riverside School 🏫').waitFor();
  await sa.getByText(/finished 1×/).waitFor();
  await t(sa, 'Reset code').click();
  const code = await grab(sa, /Code: (\S+)/);
  await shot(sa, '12_school_stats_reset_code');
  await t(st, 'Log out').first().click();
  await t(st, 'Forgot password?').click();
  await t(st, 'I have a code').click();
  await st.getByPlaceholder('Email or username').fill('ali.raza');
  await st.getByPlaceholder('Reset code (like ABCD-EF23)').fill(code);
  await st.getByPlaceholder('New password').fill('NewStudent9');
  await t(st, 'Change password').click();
  await st.getByText(/Password changed/).waitFor();
  await login(st, 'ali.raza', 'NewStudent9');
  await t(st, 'Hi Ali 👋').waitFor();
  log('school reset code worked');

  // ---------------------------------------------------------------- individual student: register, subscription, email reset
  const ind = await newPage(browser);
  await t(ind, 'Create an account').click();
  await ind.getByPlaceholder('Full name').fill('Zara Ahmed');
  await ind.getByPlaceholder('Email').fill('zara@example.com');
  await ind.getByPlaceholder('Password (8+ characters, letters and numbers)').fill('ZaraPass12');
  await t(ind, '11').click();
  await ind.getByPlaceholder('Age (optional)').fill('16');
  await t(ind, 'Register').click();
  await ind.getByText('Please read and accept how RahYaab uses your data.').waitFor();
  await ind.getByText(/I have read this/).click();
  await t(ind, 'Register').click();
  await t(ind, 'Hi Zara 👋').waitFor();
  await t(ind, '● Subscription not active').waitFor();
  await shot(ind, '13_individual_inactive', false);
  await t(pa, '🎓 Students').click();
  await t(pa, 'Activate 1 year').click();
  await pa.getByText(/active until/).waitFor();
  await shot(pa, '14_platform_activate');
  await ind.reload();
  await t(ind, 'Start assessment').click();
  await t(ind, 'I understand and agree to take part.').click();
  if (!(await ind.getByText('My parent or guardian knows about RahYaab and agrees.').count())) throw new Error('no guardian consent for an individual minor');
  await t(ind, 'My parent or guardian knows about RahYaab and agrees.').click();
  await t(ind, 'Start').click();
  await t(ind, 'Play levels 1-6').waitFor();
  await t(ind, 'Log out').first().click();
  await t(ind, 'Forgot password?').click();
  await ind.getByPlaceholder('Email').fill('zara@example.com');
  await t(ind, 'Email me a code').click();
  await ind.getByText(/If an account with this email/).waitFor();
  const mail = fs.readdirSync(OUTBOX).map((f) => fs.readFileSync(path.join(OUTBOX, f), 'utf8')).find((m) => m.includes('zara@example.com'));
  const emailCode = mail.match(/[A-Z2-9]{4}-[A-Z2-9]{4}/)[0];
  await t(ind, 'I have a code').click();
  await ind.getByPlaceholder('Reset code (like ABCD-EF23)').fill(emailCode);
  await ind.getByPlaceholder('New password').fill('ZaraNew123');
  await t(ind, 'Change password').click();
  await ind.getByText(/Password changed/).waitFor();
  await login(ind, 'zara@example.com', 'ZaraNew123');
  await t(ind, 'Hi Zara 👋').waitFor();
  log('individual: register with consent, subscription activated by platform admin, guardian consent, email reset');

  // ---------------------------------------------------------------- platform admin: content, statistics, export (FR-7)
  await t(pa, '❓ Questions').click();
  await t(pa, 'R').first().click();
  await pa.getByPlaceholder('e.g. Build a robot').fill('Build a robot for a school fair');
  await t(pa, 'Add').click();
  await pa.getByText('R · Build a robot for a school fair').waitFor();
  await t(pa, '🎯 Fields').click();
  await t(pa, 'Add a field').click();
  await pa.getByPlaceholder('Field name').fill('Agriculture and Food Science');
  await pa.getByPlaceholder('Interest code: 3 letters, main first (e.g. IRC)').fill('RIS');
  await pa.getByPlaceholder('Typical personality O C E A N, 1-3 each (e.g. 32221)').fill('22221');
  await pa.getByPlaceholder('Short description').fill('Growing food and caring for land and water.');
  await pa.getByPlaceholder('Skills (one per line)').fill('Biology\nFieldwork');
  await pa.getByPlaceholder('Pathway for grades 9-10 (one step per line)').fill('Matric: Science group with Biology');
  await pa.getByPlaceholder('Pathway for grades 11-12 (one step per line)').fill('FSc Pre-Medical\nBS Agriculture');
  await t(pa, 'Save field').click();
  await pa.getByText(/^Saved\. New results use the new version/).waitFor();
  await t(pa, '📊 Overview').click();
  await pa.getByText('Assessments completed / in progress / stopped').waitFor();
  await pa.evaluate(() => { window.open = () => null; }); // keep the one-time link for this script instead of a new tab
  await t(pa, 'Create export').click();
  const url = (await pa.getByText(/If the download did not open: /).textContent()).split('open: ')[1].trim();
  await shot(pa, '15_platform_overview_export');
  const zip = await pa.request.get(url);
  if (zip.status() !== 200 || zip.headers()['content-type'] !== 'application/zip') throw new Error('export download failed: ' + zip.status());
  fs.writeFileSync(path.join(OUT, 'export.zip'), await zip.body());
  if ((await pa.request.get(url)).status() !== 404) throw new Error('export link worked twice');
  log(`questions + fields edited; statistics; export downloaded (${(await zip.body()).length} bytes)`);

  const errors = [pa, sa, st, ind].flatMap((p) => p.errors);
  console.log('ERRORS', JSON.stringify(errors));
  await browser.close();
  if (errors.length) process.exit(1);
})().catch((e) => { console.error('FAILED', e); process.exit(1); });
