/// <reference types="node" />
// Run with `pnpm test`. Wording the server's result codes, and the result states.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

import { bandDots, doorPhrases, reasonPhrase, stateFromProblem, type Door } from './format.ts';

const en = JSON.parse(readFileSync(new URL('../i18n/locales/en.json', import.meta.url), 'utf8'));
const ur = JSON.parse(readFileSync(new URL('../i18n/locales/ur.json', import.meta.url), 'utf8'));

function has(dict: Record<string, unknown>, key: string): boolean {
  let node: unknown = dict;
  for (const part of key.split('.')) node = (node as Record<string, unknown> | undefined)?.[part];
  return typeof node === 'string';
}

test('reasons become translation keys with their lists', () => {
  assert.deepEqual(reasonPhrase({ code: 'interest_match', types: ['I', 'R'] }), {
    key: 'results.reason.interest_match',
    lists: { types: ['results.type.I', 'results.type.R'] },
  });
  assert.equal(reasonPhrase({ code: 'from_a_newer_server' } as never), null);
});

test('doors say their state, then the board check, note and route', () => {
  const door: Door = {
    to: 'medicine', label_key: 'door.medicine', state: 'extra_step', gates: ['x'], verification: 'unverified',
    sources: [], check_with_board: true, route: 'switch_group_window', note: 'needs_biology_at_matric',
  };
  assert.deepEqual(doorPhrases(door).map((p) => p.key), [
    'results.doorState.extra_step', 'results.checkWithBoard', 'results.doorNote.needs_biology_at_matric',
    'results.route.switch_group_window',
  ]);
});

test('every key the result screen can show exists in English and Urdu', () => {
  const keys = [
    'results.title', 'results.provisional', 'results.planB', 'results.why', 'results.hideWhy', 'results.basedOn',
    'results.confidenceLabel', 'results.sources', 'results.doorsTitle', 'results.retry', 'results.loading',
    'results.state.more_play', 'results.state.more_play_body', 'results.state.consent', 'results.state.not_supported',
    'results.state.offline', 'results.state.signed_out', 'results.state.error', 'results.and', 'home.seePaths',
    'door.medicine', 'door.engineering', 'results.checkWithBoard',
    ...['strong', 'good', 'worth_a_look'].map((b) => `results.band.${b}`),
    ...['high', 'medium', 'low'].map((c) => `results.confidence.${c}`),
    ...['interest_match', 'ability_support', 'keeps_doors_open', 'path_strength'].map((r) => `results.reason.${r}`),
    ...'RIASEC'.split('').map((t) => `results.type.${t}`),
    ...['open', 'extra_step', 'closed'].map((s) => `results.doorState.${s}`),
    'results.doorNote.needs_biology_at_matric', 'results.route.additional_subject', 'results.route.switch_group_window',
    ...['pre_medical', 'pre_engineering', 'ics', 'icom', 'fa_humanities', 'general_science', 'dae', 'tech_vocational',
      'a_level', 'nursing_diploma_early'].map((s) => `stream.${s}`),
  ];
  for (const key of keys) {
    assert.ok(has(en, key), `en.json is missing ${key}`);
    assert.ok(has(ur, key), `ur.json is missing ${key}`);
  }
});

test('bands carry dots, and API problems map to states', () => {
  assert.deepEqual(['strong', 'good', 'worth_a_look'].map((b) => bandDots(b as never)), [3, 2, 1]);
  assert.deepEqual(stateFromProblem(409, 'insufficient_evidence', 'low_coverage'), {
    kind: 'more_play', reason: 'low_coverage',
  });
  assert.equal(stateFromProblem(403, 'consent_required').kind, 'consent');
  assert.equal(stateFromProblem(422, 'mode_not_supported').kind, 'not_supported');
  assert.equal(stateFromProblem(500, 'internal_error').kind, 'error');
});
