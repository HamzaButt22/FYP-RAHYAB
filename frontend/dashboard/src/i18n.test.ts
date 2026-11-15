import { describe, expect, it } from 'vitest';

import { lookup, MESSAGES } from './i18n';

function keys(node: unknown, prefix = ''): string[] {
  if (typeof node === 'string') return [prefix];
  return Object.entries(node as Record<string, unknown>).flatMap(([k, v]) => keys(v, prefix ? `${prefix}.${k}` : k));
}

describe('dashboard translations', () => {
  it('has the same keys in English and Urdu', () => {
    expect(keys(MESSAGES.ur).sort()).toEqual(keys(MESSAGES.en).sort());
  });

  it('fills placeholders where each language puts them', () => {
    expect(lookup('en', 'roster.week', { n: 2, total: 4 })).toBe('Week 2 of 4');
    expect(lookup('ur', 'roster.week', { n: 2, total: 4 })).toBe('4 میں سے 2 ہفتے مکمل');
  });

  it('shows a missing key instead of failing silently', () => {
    expect(lookup('ur', 'roster.nope')).toBe('roster.nope');
  });

  it('uses Urdu letters and punctuation, not Arabic look-alikes or Latin marks', () => {
    const urdu = keys(MESSAGES.ur).map((k) => lookup('ur', k));
    for (const text of urdu) {
      expect(text).not.toMatch(/[يك]/); // Arabic yeh and kaf: Urdu uses ی and ک
      if (/[؀-ۿ]/.test(text)) expect(text).not.toMatch(/[A-Za-z][.,?]|[؀-ۿ][.,?]/);
    }
  });
});
