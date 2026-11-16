/// <reference types="node" />
// Run with `pnpm test`. The profile rules for S-05, and that every label the screen can show exists.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

import { BOARDS, SITUATIONS, changedFields, groupKind, groupLabelKey, needsGroup } from './profile.ts';

const en = JSON.parse(readFileSync(new URL('../i18n/locales/en.json', import.meta.url), 'utf8'));
const streams = JSON.parse(
  readFileSync(new URL('../../../../design/game/frameworks/streams.json', import.meta.url), 'utf8'),
);

function has(key: string): boolean {
  let node: unknown = en;
  for (const part of key.split('.')) node = (node as Record<string, unknown> | undefined)?.[part];
  return typeof node === 'string';
}

test('each class chooses from the right kind of group', () => {
  assert.equal(groupKind(8), 'none');
  assert.equal(groupKind(9), 'matric');
  assert.equal(groupKind(10), 'matric');
  assert.equal(groupKind(11), 'intermediate');
  assert.equal(groupKind(12), 'intermediate');
});

test('only changed fields are sent, and clearing a field sends null', () => {
  const before = { board: 'FBISE', current_group: null, situation: null };
  assert.deepEqual(changedFields(before, before), {});
  assert.deepEqual(changedFields(before, { ...before, current_group: 'matric_science_bio' }), {
    current_group: 'matric_science_bio',
  });
  assert.deepEqual(changedFields({ ...before, situation: 'dae' }, before), { situation: null });
});

test('home asks for the group only when the class has groups and none is set', () => {
  assert.equal(needsGroup(null), false);
  assert.equal(needsGroup({ grade: 8, current_group: null, groups: [] }), false);
  assert.equal(needsGroup({ grade: 9, current_group: null, groups: ['matric_science_bio'] }), true);
  assert.equal(needsGroup({ grade: 9, current_group: 'matric_science_cs', groups: ['matric_science_cs'] }), false);
});

test('every group, board and situation the screen can show has an English label', () => {
  for (const p of streams.by_class['8'].paths) assert.ok(has(groupLabelKey(9, p.id)), `missing ${p.id}`);
  for (const p of streams.by_class['9-10'].paths) assert.ok(has(groupLabelKey(11, p.id)), `missing ${p.id}`);
  for (const b of BOARDS) assert.ok(has(`profile.boards.${b}`), `missing board ${b}`);
  for (const s of SITUATIONS) assert.ok(has(`profile.situations.${s}`), `missing situation ${s}`);
  // The situations are the same list as streams.json (FR-104).
  assert.deepEqual([...SITUATIONS], streams.situations.items.map((i: { id: string }) => i.id));
});
