// usage: node shot.js <url> <out.png> [w] [h] [waitMs] [script.json]
const puppeteer = require('puppeteer-core');
(async () => {
  const [url, out, w = '390', h = '844', wait = '2500', actions] = process.argv.slice(2);
  const browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome', args: ['--no-sandbox', '--disable-gpu'], headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: +w, height: +h, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const errs = [];
  page.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.type() + ' ' + m.text().slice(0, 300)); });
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
  await new Promise((r) => setTimeout(r, +wait));
  await page.screenshot({ path: out });
  console.log(errs.slice(0, 15).join('\n') || 'no console errors');
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
