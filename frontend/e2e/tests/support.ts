// Shared helpers: the seed written by tools/e2e_seed.py, path names from streams.json, a TOTP code
// generator (RFC 6238, as an authenticator app does) and an axe-core check.
import { createHmac } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';

export type Student = { nickname: string; form: string; report_url: string; ranked: string[]; plan_b: string[][] };
export type Seed = {
  api: string;
  class: { id: string; name: string };
  teacher: { email: string; password: string };
  students: Student[];
  revoked_url: string;
  forms: { claimed: string[]; printed: string[] };
};

export const DASHBOARD = process.env.E2E_DASHBOARD_URL ?? 'http://localhost:5173';

export function seed(): Seed {
  return JSON.parse(readFileSync(fileURLToPath(new URL('../.state/seed.json', import.meta.url)), 'utf-8')) as Seed;
}

type Streams = { by_class: Record<string, { paths: { id: string; name: string }[] }> };

/** Every path id -> its one name, straight from design/game/frameworks/streams.json (TC-SHARE-13). */
export function pathNames(): Record<string, string> {
  const file = fileURLToPath(new URL('../../../design/game/frameworks/streams.json', import.meta.url));
  const streams = JSON.parse(readFileSync(file, 'utf-8')) as Streams;
  const names: Record<string, string> = {};
  for (const level of Object.values(streams.by_class)) for (const p of level.paths) names[p.id] = p.name;
  return names;
}

function base32(text: string): Buffer {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = '';
  for (const ch of text.replace(/[\s=]/g, '').toUpperCase()) {
    const v = alphabet.indexOf(ch);
    if (v < 0) throw new Error(`not base32: ${ch}`);
    bits += v.toString(2).padStart(5, '0');
  }
  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) bytes.push(parseInt(bits.slice(i, i + 8), 2));
  return Buffer.from(bytes);
}

/** The 6-digit code an authenticator app shows for this setup key now (HMAC-SHA1, 30 s steps). */
export function totp(setupKey: string, at = Date.now()): string {
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(Math.floor(at / 1000 / 30)));
  const mac = createHmac('sha1', base32(setupKey)).update(counter).digest();
  const offset = mac[mac.length - 1] & 0x0f;
  const value = (mac.readUInt32BE(offset) & 0x7fffffff) % 1_000_000;
  return value.toString().padStart(6, '0');
}

/** axe-core with the WCAG 2.1 A and AA rules; returns only serious and critical problems, readable in a failure. */
export async function seriousA11yProblems(page: Page): Promise<string[]> {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  return results.violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map((v) => `${v.impact} ${v.id}: ${v.help} (${v.nodes.map((n) => n.target.join(' ')).join(', ')})`);
}

/** True when the page scrolls sideways (text or a table wider than the screen). */
export async function scrollsSideways(page: Page): Promise<boolean> {
  return page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
}
