/// <reference types="node" />
// Run with `pnpm test` (Node's built-in test runner; Node 24 runs TypeScript directly).
// The nickname cases are the server's (backend/api/tests/test_join_rules.py), so both sides agree.
import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  ageInMonths,
  birthYears,
  claimCodeProblem,
  classCodeProblem,
  cleanNickname,
  formatClaimCode,
  formatClassCode,
  isUnderMinimumAge,
  looksLikeFullName,
  nicknameProblem,
  pakistanToday,
} from './rules.ts';

test('class codes are formatted as they are typed', () => {
  assert.equal(formatClassCode('ryb4k2'), 'RYB-4K2');
  assert.equal(formatClassCode('r y b - 4 k'), 'RYB-4K');
  assert.equal(formatClassCode('ryb'), 'RYB');
  assert.equal(formatClassCode('RYB-4K2X'), 'RYB-4K2'); // extra characters are dropped
  assert.equal(formatClaimCode('ab23cd45'), 'AB23-CD45');
});

test('class code problems', () => {
  assert.equal(classCodeProblem('RYB-4K2'), null);
  assert.equal(classCodeProblem('RYB-4K'), 'format');
  assert.equal(classCodeProblem('RY4-4K2'), 'format'); // the first three are letters
  assert.equal(classCodeProblem('RYB-4K0'), 'lookalike'); // codes never use 0, O, 1 or I
  assert.equal(classCodeProblem('ROB-4K2'), 'lookalike');
  assert.equal(claimCodeProblem('AB23-CD45'), null);
  assert.equal(claimCodeProblem('AB23-CD4'), 'format');
});

test('nicknames are cleaned like the server cleans them', () => {
  assert.equal(cleanNickname('ali‮'), 'ali');
  assert.equal(cleanNickname('​ali'), 'ali');
  assert.equal(cleanNickname('  a   b '), 'a b');
  assert.equal(cleanNickname('Ayesha⁦_10⁩'), 'Ayesha_10');
});

const NICKNAMES: [string, string | null][] = [
  ['ali03001234567', 'contains_phone'],
  ['a@b.com', 'contains_phone'],
  ['a', 'too_short'],
  ['\u{1F600}', 'too_short'], // one emoji
  ['a'.repeat(21), 'too_long'],
  ['<script>', 'format'],
  ['ab\u{1F600}', 'format'],
  ['Ayesha_10', null],
  ['عائشہ', null], // Urdu script
  ['اَلِف', null], // Urdu with vowel marks
  ['a123456', null],
  ['a1234567', 'contains_phone'],
  ['۰۳۰۰۱۲۳۴۵۶۷', 'contains_phone'], // Urdu digits
  ['Ayesha Khan', 'full_name'],
  ['Ayesha', null],
];

for (const [nickname, problem] of NICKNAMES) {
  test(`nickname ${JSON.stringify(nickname)} -> ${problem}`, () => {
    assert.equal(nicknameProblem(nickname), problem);
  });
}

test('full names in every script the server knows', () => {
  const ayeshaKhanUrdu = 'عائشہ خان';
  const ayeshaKhanArabicHeh = 'عائشه خان';
  const fatimaMalikWithMark = 'فاطِمہ ملک';
  for (const full of [
    'Ayesha Khan',
    'ayesha_khan',
    'Ali10Butt',
    'Muhammad Ali',
    ayeshaKhanUrdu,
    ayeshaKhanArabicHeh,
    fatimaMalikWithMark,
  ]) {
    assert.equal(looksLikeFullName(full), true, full);
  }
  for (const ok of ['Ali Ali', 'Ayesha_10', 'Khan', 'Cool Ali', 'Star Gazer']) {
    assert.equal(looksLikeFullName(ok), false, ok);
  }
});

test('age is counted in whole months in Pakistan time', () => {
  const today = { year: 2026, month: 11 };
  assert.equal(ageInMonths(2013, 12, today), 155);
  assert.equal(isUnderMinimumAge(2013, 12, today), true); // 12 years 11 months
  assert.equal(isUnderMinimumAge(2013, 11, today), false); // exactly 13
  assert.equal(isUnderMinimumAge(2099, 1, today), true); // a future date gets the same stop
  // 19:30 UTC on 31 Oct is already 1 Nov in Pakistan.
  assert.deepEqual(pakistanToday(new Date(Date.UTC(2026, 9, 31, 19, 30))), { year: 2026, month: 11 });
});

test('the year picker reaches the stop screen and adult ages', () => {
  const years = birthYears({ year: 2026, month: 11 });
  assert.equal(years[0], 2018);
  assert.equal(years.at(-1), 1986);
});
