/// <reference types="node" />
// Run with `pnpm test`.
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { COMMON_NAMES } from './commonNames.ts';
import { ADJECTIVES, NOUNS, nicknameIdeas, takenVariants } from './nicknameIdeas.ts';
import { foldName, nicknameProblem } from './rules.ts';

const names = new Set(COMMON_NAMES.map(foldName));

test('no idea word is a common name', () => {
  for (const word of [...ADJECTIVES, ...NOUNS]) assert.equal(names.has(foldName(word)), false, word);
});

test('ideas are different and all pass the nickname rules', () => {
  for (let round = 0; round < 50; round += 1) {
    const ideas = nicknameIdeas(3);
    assert.equal(ideas.length, 3);
    assert.equal(new Set(ideas).size, 3);
    for (const idea of ideas) assert.equal(nicknameProblem(idea), null, idea);
  }
});

test('ideas come only from the word lists, never from what was typed', () => {
  const idea = nicknameIdeas(1, () => 0)[0];
  assert.equal(idea, 'Swift_Falcon');
});

test('a taken nickname gets numbered variants that differ from it', () => {
  const variants = takenVariants('Ali_10');
  assert.equal(variants.length, 3);
  for (const v of variants) {
    assert.match(v, /^Ali_\d{2}$/);
    assert.notEqual(v, 'Ali_10');
    assert.equal(nicknameProblem(v), null);
  }
});

test('variants of a long nickname stay within 20 characters', () => {
  for (const v of takenVariants('Supercalifragilistic')) assert.ok([...v].length <= 20, v);
});
