// The family report page (P-01, P-01b) in a real browser: GET /p/<token> on the API (routers/parent.py).
// The API tests (backend/api/tests/test_share_links_api.py) check the HTML and headers; these check what a parent
// actually sees and what the browser actually sends, with the page's own script running.
import { expect, test, type Request } from '@playwright/test';

import { pathNames, scrollsSideways, seed, seriousA11yProblems } from './support';

const GONE = 'This link is no longer active';
const UNKNOWN = `${'Z'.repeat(22)}`; // a well-formed token that was never issued

test('TC-SHARE-10 the report shows the stored result with every path named as in streams.json', async ({ page }) => {
  const child = seed().students[0];
  const names = pathNames();
  const answer = await page.goto(child.report_url);
  expect(answer?.status()).toBe(200);

  await expect(page).toHaveTitle('Family report · Rahyaab'); // the tab and link preview never name the child
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(`${child.nickname}'s paths that fit best right now`);
  const cards = page.locator('ol.paths > li');
  await expect(cards).toHaveCount(child.ranked.length);
  for (const [i, id] of child.ranked.entries()) {
    const card = cards.nth(i); // in the stored order
    await expect(card.getByRole('heading', { level: 2 })).toContainText(names[id]);
    await expect(card.locator('.band')).toHaveText(/^(Strong fit|Good fit|Worth a look)$/);
    if (child.plan_b[i].length) {
      await expect(card).toContainText(`Plan B: ${child.plan_b[i].map((p) => names[p]).join(', ')}`);
    }
  }
  await expect(page.getByRole('heading', { name: 'Talk about it together' })).toBeVisible();
  await expect(page.locator('main')).toContainText('a starting point, not a verdict');
  expect(await page.locator('main').innerText()).not.toMatch(/\b0\.\d+\b|\d+\s*%/); // no numeric fit (FR-54)
});

test('TC-SHARE-10 the report is complete without JavaScript', async ({ browser }) => {
  const child = seed().students[1];
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(child.report_url);
  await expect(page.locator('ol.paths > li')).toHaveCount(child.ranked.length);
  await expect(page.locator('main')).toContainText(pathNames()[child.ranked[0]]);
  await expect(page.locator('#save')).toBeHidden(); // saving needs the script; nothing half-works
  await context.close();
});

test('TC-SHARE-02 a turned-off link and an unknown link show the same 410 page', async ({ page }) => {
  const { revoked_url, api, students } = seed();
  const revoked = await page.goto(revoked_url);
  expect(revoked?.status()).toBe(410);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(GONE);
  const revokedText = await page.locator('body').innerText();

  const unknown = await page.goto(`${api}/p/${UNKNOWN}`);
  expect(unknown?.status()).toBe(410);
  expect(await page.locator('body').innerText()).toBe(revokedText); // nothing tells the two apart
  expect(revokedText).not.toContain(students[0].nickname);
  await expect(page.locator('#save')).toHaveCount(0); // nothing to save on this page
});

test('TC-SHARE-05 strict headers, and the browser reports no blocked script or style', async ({ page }) => {
  const { students, api } = seed();
  await page.addInitScript(() => {
    const found: string[] = [];
    (window as unknown as { cspViolations: string[] }).cspViolations = found;
    document.addEventListener('securitypolicyviolation', (e) => found.push(`${e.violatedDirective} ${e.blockedURI}`));
  });
  for (const url of [students[0].report_url, `${api}/p/${UNKNOWN}`]) {
    const answer = await page.goto(url);
    const h = answer!.headers();
    expect(h['content-security-policy']).toContain("default-src 'none'");
    expect(h['content-security-policy']).toContain("frame-ancestors 'none'");
    expect(h['content-security-policy']).not.toContain('unsafe-inline');
    expect(h['x-frame-options']).toBe('DENY');
    expect(h['referrer-policy']).toBe('no-referrer');
    expect(h['x-content-type-options']).toBe('nosniff');
    expect(h['cache-control']).toBe('no-store');
    expect(h['x-robots-tag']).toContain('noindex');
    expect(h['access-control-allow-origin']).toBeUndefined(); // no CORS on parent pages (NFR-77)
    await page.waitForLoadState('load');
    expect(await page.evaluate(() => (window as unknown as { cspViolations: string[] }).cspViolations)).toEqual([]);
    expect(await page.locator('script:not([src])').count()).toBe(0);
    expect(await page.locator('[style]').count()).toBe(0);
    // The page's own CSS loaded under the CSP (a blocked stylesheet would leave the default serif font).
    expect(await page.evaluate(() => getComputedStyle(document.body).fontFamily)).not.toMatch(/^"?Times/);
  }
});

test('TC-SHARE-08 two children on one parent phone: saved only by choice, and no request carries the other child', async ({
  browser,
}) => {
  const [a, b] = seed().students;
  const tokenOf = (url: string) => url.split('/p/')[1];
  const context = await browser.newContext(); // one phone, one browser
  const sent: Request[] = [];
  context.on('request', (r) => sent.push(r));
  const page = await context.newPage();
  const children = page.locator('#children-list > li');

  // Default: nothing saved, the offer to save is there, the switcher is hidden.
  await page.goto(a.report_url);
  await expect(page.getByRole('button', { name: 'Save to this phone' })).toBeVisible();
  await expect(page.locator('#children')).toBeHidden();
  expect(await page.evaluate(() => localStorage.getItem('rahyaab.children'))).toBeNull();

  await page.getByRole('button', { name: 'Save to this phone' }).click();
  await expect(page.getByRole('button', { name: 'Save to this phone' })).toBeHidden();
  await expect(page.getByRole('heading', { name: 'My children' })).toBeVisible();
  await expect(children).toHaveText([`${a.nickname} (this report)Remove`]);

  await page.goto(b.report_url);
  await expect(page.getByRole('link', { name: a.nickname })).toBeVisible(); // A is listed before B is saved
  await page.getByRole('button', { name: 'Save to this phone' }).click();
  await expect(children).toHaveText([`${a.nickname}Remove`, `${b.nickname} (this report)Remove`]);

  // Switch from B to A with the list: A's page opens, and the list follows.
  await page.getByRole('link', { name: a.nickname }).click();
  await expect(page).toHaveURL(a.report_url);
  await expect(page.getByRole('heading', { level: 1 })).toContainText(a.nickname);
  await expect(children).toHaveText([`${a.nickname} (this report)Remove`, `${b.nickname}Remove`]);

  // Remove deletes the entry from this phone.
  await page.getByRole('button', { name: `Remove ${b.nickname} from this phone` }).click();
  await expect(children).toHaveText([`${a.nickname} (this report)Remove`]);
  expect(await page.evaluate(() => localStorage.getItem('rahyaab.children'))).not.toContain(tokenOf(b.report_url));

  // What left the phone: each request names at most its own child, never the other one (no Referer either).
  expect(sent.length).toBeGreaterThan(4);
  for (const request of sent) {
    const own = request.url().includes(tokenOf(a.report_url)) ? a : request.url().includes(tokenOf(b.report_url)) ? b : null;
    const others = [a, b].filter((c) => c !== own);
    const wire = [request.url(), JSON.stringify(await request.allHeaders()), request.postData() ?? ''].join('\n');
    for (const other of others) {
      expect(wire, `${request.method()} ${request.url()}`).not.toContain(tokenOf(other.report_url));
      expect(wire, `${request.method()} ${request.url()}`).not.toContain(other.nickname);
    }
    expect(request.method()).toBe('GET'); // the list is never sent anywhere
  }
  await context.close();
});

test('TC-A11Y-07 axe-core finds no serious problems at 320 px, and nothing scrolls sideways', async ({ browser }) => {
  const { students, api } = seed();
  const context = await browser.newContext({ viewport: { width: 320, height: 640 } });
  const page = await context.newPage();
  await page.goto(students[0].report_url);
  await page.getByRole('button', { name: 'Save to this phone' }).click(); // check with "My children" showing too
  await expect(page.locator('#children')).toBeVisible();
  expect(await seriousA11yProblems(page)).toEqual([]);
  expect(await scrollsSideways(page)).toBe(false);

  await page.goto(`${api}/p/${UNKNOWN}`);
  expect(await seriousA11yProblems(page)).toEqual([]);
  expect(await scrollsSideways(page)).toBe(false);
  await context.close();
});
