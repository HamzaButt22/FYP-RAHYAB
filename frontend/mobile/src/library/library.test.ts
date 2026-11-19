/// <reference types="node" />
// Run with `pnpm test`. The stream library (FR-60, FR-65): the offline copy, levels, who a path suits,
// similar paths, where a path leads, and doors that still need checking.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

import {
  LEVELS,
  doorsFor,
  findPath,
  levelForGrade,
  missingFacts,
  nextSteps,
  pathName,
  pathsAt,
  similarPaths,
  topTypes,
  type StreamsData,
} from './library.ts';

const source = readFileSync(new URL('../../../../design/game/frameworks/streams.json', import.meta.url), 'utf8');
const bundled = readFileSync(new URL('./streams.json', import.meta.url), 'utf8');
const data = JSON.parse(bundled) as StreamsData;
const en = JSON.parse(readFileSync(new URL('../i18n/locales/en.json', import.meta.url), 'utf8'));

function has(key: string): boolean {
  let node: unknown = en;
  for (const part of key.split('.')) node = (node as Record<string, unknown> | undefined)?.[part];
  return typeof node === 'string';
}

test('the app carries an up-to-date copy of streams.json (run `pnpm streams` after changing it)', () => {
  assert.equal(bundled, source);
});

test('TC-SHARE-13 the app names every path exactly as the parent page does (streams.json name)', () => {
  // backend/api/src/rahyaab_api/routers/parent.py path_names(): {id: name} over every level's paths
  const names: Record<string, string> = {};
  for (const level of Object.values(JSON.parse(source).by_class) as { paths: { id: string; name: string }[] }[]) {
    for (const p of level.paths) names[p.id] = p.name;
  }
  assert.ok(Object.keys(names).length > 20);
  for (const [id, name] of Object.entries(names)) assert.equal(pathName(data, id), name, id);
  assert.equal(pathName(data, 'nursing_diploma_early'), names.nursing_diploma_early);
  assert.equal(pathName(data, 'from_a_newer_server'), null);
});

test('each class opens on the choice it makes next', () => {
  assert.equal(levelForGrade(8), '8');
  assert.equal(levelForGrade(9), '9-10');
  assert.equal(levelForGrade(10), '9-10');
  assert.equal(levelForGrade(11), '11-12');
  assert.equal(levelForGrade(null), '9-10');
  assert.equal(pathsAt(data, '8').length, 4);
  assert.ok(LEVELS.every((l) => pathsAt(data, l).length > 0));
});

test('a path suits its strongest interest types, and similar paths are other paths at the same level', () => {
  const premed = findPath(data, 'pre_medical');
  assert.equal(premed?.level, '9-10');
  assert.deepEqual(topTypes(premed!.path), ['I', 'S', 'R']);
  const similar = similarPaths(data, 'pre_medical');
  assert.equal(similar.length, 2);
  for (const p of similar) {
    assert.notEqual(p.id, 'pre_medical');
    assert.equal(findPath(data, p.id)?.level, '9-10');
  }
  assert.deepEqual(similarPaths(data, 'nope'), []);
});

test('where a path leads: named paths, or fixed steps with an English label', () => {
  const bio = findPath(data, 'matric_science_bio')!.path;
  assert.deepEqual(nextSteps(data, bio).map((s) => (s.kind === 'path' ? s.name : s.key))[0], 'FSc Pre-Medical');
  for (const level of LEVELS) {
    for (const p of pathsAt(data, level)) {
      for (const step of nextSteps(data, p)) {
        if (step.kind === 'step') assert.ok(has(step.key), `en.json is missing ${step.key} (from ${p.id})`);
      }
    }
  }
});

test('doors carry their state, and a door resting only on unverified rules says to check', () => {
  const doors = doorsFor(data, 'pre_engineering');
  assert.deepEqual(
    doors.map((d) => [d.to, d.state, d.checkWithSchool]),
    [['engineering', 'open', false], ['medicine', 'closed', false]],
  );
  assert.equal(doorsFor(data, 'a_level')[0].checkWithSchool, true); // IBCC equivalence is unverified
  assert.deepEqual(doorsFor(data, 'general_science'), []);
});

test('TC-SHARE-13 every door is a path with a name, so the phone and the parent page name it the same', () => {
  for (const d of Object.keys(data.doors.by_path).flatMap((id) => doorsFor(data, id))) {
    assert.equal(d.name, pathName(data, d.to), d.to);
    assert.ok(d.name, `door ${d.to} is not a path in streams.json`);
  }
  assert.equal(doorsFor(data, 'pre_engineering')[0].name, findPath(data, 'engineering')!.path.name);
});

test('every label the library screens show exists in en.json', () => {
  const keys = [
    'library.title', 'library.help', 'library.suits', 'library.tests', 'library.checkBadge', 'library.whoTitle',
    'library.needsTitle', 'library.testsTitle', 'library.leadsTitle', 'library.examplesTitle', 'library.durationTitle',
    'library.notesTitle', 'library.similarTitle', 'library.verify', 'library.missing', 'library.source',
    'library.subjectsTitle', 'library.costTitle', 'library.costPerYear', 'library.costTotal', 'library.costNote',
    ...['subjects', 'duration', 'cost'].map((f) => `library.facts.${f}`),
    'library.notFound', 'results.checkWithBoard',
    ...LEVELS.map((l) => `library.levels.${l}`),
    ...LEVELS.map((l) => `library.levelHints.${l}`),
    ...['open', 'extra_step', 'closed'].map((s) => `results.doorState.${s}`),
  ];
  for (const key of keys) assert.ok(has(key), `en.json is missing ${key}`);
});

test('the page names only the FR-60 facts that are still missing from the data', () => {
  const vocational = findPath(data, 'tech_vocational')!.path; // has a duration, no subjects or cost yet
  assert.deepEqual(missingFacts(vocational), ['subjects', 'cost']);
  assert.deepEqual(
    missingFacts({
      ...vocational,
      subjects_by_board: { FBISE: { subjects: ['Physics'], source_url: 'https://x', last_verified: '2026-11-17' } },
      cost_estimate: { min_pkr: 1, max_pkr: 2, per: 'year', source_url: 'https://x', last_verified: '2026-11-17' },
    }),
    [],
  );
});
