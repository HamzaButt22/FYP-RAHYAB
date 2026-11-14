// Join form rules (design/specs/forms-and-errors.md §2). They mirror the server's checks in
// backend/api/src/rahyaab_api/join_rules.py so students get help before they tap Next; the server still
// checks everything. Pure functions only: tested with Node's test runner (rules.test.ts, `pnpm test`).

import { COMMON_NAMES } from './commonNames.ts';

export type FieldProblem =
  | 'format'
  | 'lookalike'
  | 'too_short'
  | 'too_long'
  | 'contains_phone'
  | 'full_name';

// ---------------------------------------------------------------------------------------------- codes

const CLASS_CODE = /^[A-Z]{3}-[A-Z0-9]{3}$/;
const CLAIM_CODE = /^[A-Z0-9]{4}-[A-Z0-9]{4}$/;
// Printed codes never use these look-alike characters (backend codes.py), so typing one is a misread.
const LOOKALIKES = /[IO01]/;

/** Upper-cases, keeps letters and digits, and adds the dash: "ryb4k2" -> "RYB-4K2". */
function formatCode(raw: string, head: number, tail: number): string {
  const chars = raw.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, head + tail);
  return chars.length > head ? `${chars.slice(0, head)}-${chars.slice(head)}` : chars;
}

export const formatClassCode = (raw: string) => formatCode(raw, 3, 3);
export const formatClaimCode = (raw: string) => formatCode(raw, 4, 4);

function codeProblem(code: string, pattern: RegExp): FieldProblem | null {
  if (LOOKALIKES.test(code)) return 'lookalike';
  return pattern.test(code) ? null : 'format';
}

export const classCodeProblem = (code: string) => codeProblem(code, CLASS_CODE);
export const claimCodeProblem = (code: string) => codeProblem(code, CLAIM_CODE);

// ------------------------------------------------------------------------------------------- nickname

export const NICKNAME_MIN = 2;
export const NICKNAME_MAX = 20;
const PHONE_DIGITS = 7;

// Zero-width and bidi control characters are removed, not refused (forms-and-errors.md §4).
const INVISIBLE = /[​-‏‪-‮⁦-⁩﻿]/g;

export function cleanNickname(raw: string): string {
  return raw.normalize('NFC').replace(INVISIBLE, '').split(/\s+/).filter(Boolean).join(' ');
}

// Arabic letter forms typed on some keyboards, mapped to the Urdu ones (same as the server):
// Arabic yeh and alef maksura -> Farsi yeh, Arabic kaf -> keheh, heh and teh marbuta -> heh goal.
const URDU_LETTERS: Record<string, string> = {
  'ي': 'ی',
  'ى': 'ی',
  'ك': 'ک',
  'ه': 'ہ',
  'ة': 'ہ',
};

export function foldName(word: string): string {
  return word
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\p{Mn}\p{Nd}]/gu, '')
    .normalize('NFC')
    .replace(/[يىكهة]/g, (ch) => URDU_LETTERS[ch] ?? ch);
}

let names: Set<string> | null = null;

/** Two different common names in one nickname look like a real full name; one name alone is fine. */
export function looksLikeFullName(nickname: string): boolean {
  names ??= new Set(COMMON_NAMES.map(foldName));
  const words = new Set(
    nickname
      .split(/[\s_\p{Nd}]+/u)
      .filter(Boolean)
      .map(foldName),
  );
  let found = 0;
  for (const word of words) if (names.has(word)) found += 1;
  return found >= 2;
}

/** The first problem with a cleaned nickname, in the server's order, or null when it is fine. */
export function nicknameProblem(nickname: string): FieldProblem | null {
  const digits = nickname.match(/\p{Nd}/gu)?.length ?? 0;
  if (nickname.includes('@') || digits >= PHONE_DIGITS) return 'contains_phone';
  const length = [...nickname].length; // characters, not UTF-16 units (the server counts the same way)
  if (length < NICKNAME_MIN) return 'too_short';
  if (length > NICKNAME_MAX) return 'too_long';
  if (!/^[\p{L}\p{M}\p{N}_ ]+$/u.test(nickname)) return 'format';
  if (looksLikeFullName(nickname)) return 'full_name';
  return null;
}

// ------------------------------------------------------------------------------------------------ age

export const MIN_AGE = 13;

export type YearMonth = { year: number; month: number };

/** Today's year and month in Pakistan (UTC+5, no daylight saving), as the server counts them. */
export function pakistanToday(now: Date = new Date()): YearMonth {
  const pkt = new Date(now.getTime() + 5 * 60 * 60 * 1000);
  return { year: pkt.getUTCFullYear(), month: pkt.getUTCMonth() + 1 };
}

export function ageInMonths(birthYear: number, birthMonth: number, today: YearMonth = pakistanToday()): number {
  return today.year * 12 + today.month - (birthYear * 12 + birthMonth);
}

/** Under 13 (or a birth date in the future): the neutral stop screen, and nothing is sent (FR-04). */
export function isUnderMinimumAge(
  birthYear: number,
  birthMonth: number,
  today: YearMonth = pakistanToday(),
): boolean {
  return ageInMonths(birthYear, birthMonth, today) < MIN_AGE * 12;
}

/** Years for the picker, newest first: young enough to reach the stop screen, old enough for adults. */
export function birthYears(today: YearMonth = pakistanToday()): number[] {
  const years: number[] = [];
  for (let y = today.year - 8; y >= today.year - 40; y -= 1) years.push(y);
  return years;
}
