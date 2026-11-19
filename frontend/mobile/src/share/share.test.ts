/// <reference types="node" />
// Run with `pnpm test`. Share with family (S-14; FR-66, RFC-0004): what the screen says for each API
// answer, how each link in the list is described, and what the preview shows.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

import {
  PROBLEMS,
  describeLinks,
  previewOf,
  shareProblem,
  type LinkRow,
  type ShareResult,
} from './share.ts';

const en = JSON.parse(readFileSync(new URL('../i18n/locales/en.json', import.meta.url), 'utf8'));

function has(dict: Record<string, unknown>, key: string): boolean {
  let node: unknown = dict;
  for (const part of key.split('.')) {
    if (typeof node !== 'object' || node === null || !(part in node)) return false;
    node = (node as Record<string, unknown>)[part];
  }
  return typeof node === 'string';
}

const problem = (status: number, code: string, errors: { field: string; code: string }[] = []) =>
  ({ ok: false, kind: 'problem', status, code, errors, retryAfterSeconds: null }) as const;

test('TC-SHARE-11 each API answer becomes one problem the screen can word', () => {
  assert.equal(shareProblem({ ok: false, kind: 'offline' }), 'offline');
  assert.equal(shareProblem(problem(401, 'unauthorized')), 'signed_out');
  assert.equal(shareProblem(problem(403, 'consent_required')), 'consent');
  assert.equal(shareProblem(problem(403, 'forbidden')), 'error');
  assert.equal(shareProblem(problem(404, 'not_found')), 'no_result');
  assert.equal(shareProblem(problem(429, 'rate_limited')), 'rate_limited');
  // 422 field errors (errors[]) are a bug in the app, not something the student can fix
  assert.equal(shareProblem(problem(422, 'validation_error', [{ field: 'scope', code: 'not_allowed' }])), 'error');
  assert.equal(shareProblem(problem(500, 'server_error')), 'error');
});

test('TC-SHARE-11 every problem has its own words in en.json', () => {
  for (const p of PROBLEMS) assert.ok(has(en, `family.problem.${p}`), `en.json is missing family.problem.${p}`);
  const keys = [
    'family.title', 'family.help', 'family.lead', 'family.loading', 'family.previewTitle', 'family.previewPaths',
    'family.previewPath', 'family.previewPlanB', 'family.turnOffLabel',
    'family.previewMore', 'family.expires', 'family.make', 'family.makeHint', 'family.making', 'family.newTitle',
    'family.newBody', 'family.copy', 'family.copyHint', 'family.copied', 'family.send', 'family.sendHint',
    'family.shareMessage', 'family.linksTitle', 'family.noLinks', 'family.turnOff', 'family.turnOffHint',
    'family.confirmTitle', 'family.confirmBody', 'family.confirmKeep', 'family.retry', 'family.consentAction',
    'family.playAction', 'family.link.active', 'family.link.expired', 'family.link.revoked', 'family.link.views',
    'family.link.label',
  ];
  for (const key of keys) assert.ok(has(en, key), `en.json is missing ${key}`);
  // the old placeholder is gone
  assert.equal(has(en, 'family.body'), false);
});

const NOW = new Date('2026-11-19T10:00:00Z');
const row = (id: string, expires: string, revoked = false, views = 0): LinkRow => ({
  id,
  scope: 'report',
  expires_at: expires,
  revoked,
  views,
});

test('TC-SHARE-12 links show their state, days left and views; active ones first', () => {
  const out = describeLinks(
    [
      row('old', '2026-11-01T00:00:00Z', false, 4),
      row('off', '2026-12-10T00:00:00Z', true, 1),
      row('soon', '2026-11-20T09:00:00Z', false, 0),
      row('new', '2026-12-19T10:00:00Z', false, 2),
    ],
    NOW
  );
  assert.deepEqual(
    out.map((l) => [l.id, l.status, l.daysLeft, l.views]),
    [
      ['new', 'active', 30, 2],
      ['soon', 'active', 1, 0],
      ['off', 'revoked', null, 1],
      ['old', 'expired', null, 4],
    ]
  );
  assert.deepEqual(out.map((l) => l.canTurnOff), [true, true, false, false]);
});

test('TC-SHARE-12 a new link says 30 days even when the phone clock is a few minutes behind the server', () => {
  // seen on the emulator: expires_at is server time + 30 days; a slow phone clock made it "31"
  const days = (ms: number) =>
    describeLinks([row('x', new Date(NOW.getTime() + ms).toISOString())], NOW)[0].daysLeft;
  const DAY = 86_400_000;
  assert.equal(days(30 * DAY + 3 * 60_000), 30); // phone 3 minutes slow
  assert.equal(days(30 * DAY - 3 * 60_000), 30); // phone 3 minutes fast
  assert.equal(days(DAY + 60_000), 1);
  assert.equal(days(60_000), 1); // the last minute still says 1, never 0
});

test('TC-SHARE-12 a link that expires this second is expired, and bad dates never crash', () => {
  const [l] = describeLinks([row('x', NOW.toISOString())], NOW);
  assert.equal(l.status, 'expired');
  const [bad] = describeLinks([row('y', 'not a date')], NOW);
  assert.equal(bad.status, 'expired');
  assert.equal(bad.daysLeft, null);
});

const result: ShareResult = {
  id: 'r1',
  ranked: [
    { stream_id: 'ics', fit_band: 'strong', plan_b: ['dae'] },
    { stream_id: 'pre_engineering', fit_band: 'good', plan_b: ['ics', 'dae'] },
    { stream_id: 'icom', fit_band: 'worth_a_look', plan_b: ['fa_humanities'] },
  ],
};

test('TC-SHARE-11 the preview lists the top paths and each Plan B once, not repeating a top path', () => {
  assert.deepEqual(previewOf(result), {
    paths: [
      { id: 'ics', band: 'strong' },
      { id: 'pre_engineering', band: 'good' },
      { id: 'icom', band: 'worth_a_look' },
    ],
    planB: ['dae', 'fa_humanities'],
  });
});
