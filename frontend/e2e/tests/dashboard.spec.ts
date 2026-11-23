// The staff dashboard (frontend/dashboard) in a real browser, against the API on :8000.
// A new teacher (made by tools/e2e_seed.py) signs in once, setting up the two-step code the way a person would,
// then the later tests use the same signed-in page. Runs in order (serial).
import { expect, test, type BrowserContext, type Page } from '@playwright/test';

import { DASHBOARD, pathNames, scrollsSideways, seed, seriousA11yProblems, totp } from './support';

test.describe.configure({ mode: 'serial' });

let context: BrowserContext;
let page: Page;

test.beforeAll(async ({ browser }) => {
  context = await browser.newContext();
  page = await context.newPage();
});

test.afterAll(async () => {
  await context.close();
});

test('TC-DASH-13 a new teacher signs in with a password and sets up the two-step code', async () => {
  const { teacher } = seed();
  await page.goto(DASHBOARD);
  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
  await page.getByLabel('Work email').fill(teacher.email);
  await page.getByLabel('Password').fill(teacher.password);
  await page.getByRole('button', { name: 'Continue' }).click();

  await expect(page.getByRole('heading', { name: 'Set up two-step sign-in' })).toBeVisible();
  await page.getByRole('button', { name: 'Show my setup key' }).click();
  const key = (await page.locator('code').first().innerText()).replace(/\s/g, '');
  expect(key).toMatch(/^[A-Z2-7]{16,}$/);
  await page.getByLabel('6-digit code').fill(totp(key));
  await page.getByRole('button', { name: 'Verify' }).click();

  await expect(page.getByRole('heading', { name: 'Your classes' })).toBeVisible();
  await expect(page.getByText(`Signed in as ${teacher.email}`)).toBeVisible();

  // The session is a cookie the page's own code can never read (NFR-69, TC-SEC-17).
  const session = (await context.cookies(seed().api)).find((c) => c.name === '__Host-rahyaab_session');
  expect(session).toMatchObject({ httpOnly: true, secure: true, sameSite: 'Strict', path: '/' });
  expect(await page.evaluate(() => document.cookie)).not.toContain('rahyaab_session');
});

test('TC-DASH-14 classes, roster and consent forms show the seeded class with path names from streams.json', async () => {
  const { class: cls, students, forms } = seed();
  const names = pathNames();
  const card = page.getByRole('link', { name: new RegExp(`Class ${cls.name}`) });
  await expect(card).toContainText(`${students.length} students`);
  await card.click();

  await expect(page.getByRole('heading', { level: 1 })).toHaveText(`Class ${cls.name}`);
  const roster = page.getByRole('table', { name: /Students in this class/ });
  for (const s of students) {
    const row = roster.getByRole('row').filter({ has: page.getByRole('link', { name: `Open ${s.nickname}` }) });
    await expect(row).toContainText(s.form);
    await expect(row).toContainText('Week 4 of 4');
    await expect(row).toContainText(names[s.ranked[0]]); // the same name as the app and the parent page
  }
  expect(await roster.innerText()).not.toMatch(/\b0\.\d+\b/); // never a numeric fit (FR-54)

  await page.getByRole('link', { name: 'Consent forms' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(`Consent forms · Class ${cls.name}`);
  const table = page.getByRole('table', { name: /consent forms printed for this class/ });
  for (const [i, serial] of forms.claimed.entries()) {
    const row = table.getByRole('row').filter({ hasText: serial });
    await expect(row).toContainText('Student joined');
    await expect(row).toContainText(students[i].nickname);
  }
  for (const serial of forms.printed) {
    await expect(table.getByRole('button', { name: `Record form ${serial}` })).toBeVisible();
  }
});

test('TC-A11Y-08 axe-core finds no serious problems on sign-in, classes, roster and consent forms', async ({ browser }) => {
  const { class: cls } = seed();
  const problems: Record<string, string[]> = {};
  for (const [name, hash, heading] of [
    ['classes', '#/classes', 'Your classes'],
    ['roster', `#/class/${cls.id}`, `Class ${cls.name}`],
    ['forms', `#/class/${cls.id}/forms`, `Consent forms · Class ${cls.name}`],
  ] as const) {
    await page.goto(`${DASHBOARD}/${hash}`);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(heading);
    await page.getByRole('table').first().waitFor().catch(() => undefined);
    problems[name] = await seriousA11yProblems(page);
  }

  const fresh = await browser.newContext(); // signed out
  const signIn = await fresh.newPage();
  await signIn.goto(DASHBOARD);
  await expect(signIn.getByRole('heading', { name: 'Sign in' })).toBeVisible();
  problems['sign-in'] = await seriousA11yProblems(signIn);
  await signIn.setViewportSize({ width: 375, height: 700 });
  expect(await scrollsSideways(signIn)).toBe(false);
  await fresh.close();

  expect(problems).toEqual({ classes: [], roster: [], forms: [], 'sign-in': [] });
});
