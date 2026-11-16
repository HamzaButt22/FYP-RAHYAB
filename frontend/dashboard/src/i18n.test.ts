import { describe, expect, it } from 'vitest';

import { lookup } from './i18n';

describe('dashboard text', () => {
  it('fills placeholders', () => {
    expect(lookup('roster.week', { n: 2, total: 4 })).toBe('Week 2 of 4');
  });

  it('shows a missing key instead of failing silently', () => {
    expect(lookup('roster.nope')).toBe('roster.nope');
  });
});
