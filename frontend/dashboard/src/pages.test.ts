import { describe, expect, it } from 'vitest';

import { bandsFor, daysSince, lastGroup, parseRoute, percent, routeHash } from './api';
import { lookup } from './i18n';

const ID = '0b5e8a52-3f0e-4c4b-9d1a-2f6d7e8a9b01';
const CLASS = '7c1d2e3f-4a5b-4c6d-8e7f-901a2b3c4d5e';

describe('dashboard addresses', () => {
  it('reads and writes the page from the address', () => {
    expect(parseRoute(`#/class/${ID}`)).toEqual({ page: 'class', id: ID });
    expect(parseRoute(`#/student/${ID}?class=${CLASS}`)).toEqual({ page: 'student', id: ID, classId: CLASS });
    expect(parseRoute(`#/student/${ID}`)).toEqual({ page: 'student', id: ID, classId: null });
    expect(parseRoute(`#/class/${CLASS}/forms`)).toEqual({ page: 'forms', id: CLASS });
    expect(routeHash({ page: 'forms', id: CLASS })).toBe(`#/class/${CLASS}/forms`);
    for (const route of [parseRoute(`#/class/${ID}`), parseRoute(`#/student/${ID}?class=${CLASS}`)]) {
      expect(parseRoute(routeHash(route))).toEqual(route);
    }
  });

  it('falls back to the class list for anything else', () => {
    for (const hash of ['', '#/', '#/class/not-an-id', `#/class/${ID}/x`, '#/admin', `#/student/${ID}?class=x`]) {
      expect(parseRoute(hash)).toEqual({ page: 'classes' });
    }
  });
});

describe('dashboard numbers', () => {
  it('counts whole days and percentages safely', () => {
    const now = new Date('2026-11-18T12:00:00Z');
    expect(daysSince('2026-11-18T08:00:00Z', now)).toBe(0);
    expect(daysSince('2026-11-10T12:00:00Z', now)).toBe(8);
    expect(daysSince('2026-11-19T12:00:00Z', now)).toBe(0); // a clock a little ahead never shows -1
    expect(percent(19, 34)).toBe(56);
    expect(percent(0, 0)).toBe(0);
  });
});

describe('dashboard text', () => {
  it('has a label and a next step for every flag the API can send', () => {
    const types = ['not_started', 'stalled', 'mixed_signals', 'low_confidence', 'quality', 'route_question', 'help_requested', 'age_mismatch'];
    for (const type of types) {
      expect(lookup(`flags.${type}.label`)).not.toBe(`flags.${type}.label`);
      expect(lookup(`flags.${type}.action`)).not.toBe(`flags.${type}.action`);
    }
  });

  it('has words for every confidence, fit band, interest type and consent method', () => {
    const keys = [
      ...['high', 'medium', 'low'].map((c) => `confidence.${c}`),
      ...['strong', 'good', 'worth_a_look'].map((f) => `fit.${f}`),
      ...'RIASEC'.split('').map((code) => `interest.${code}`),
      ...['school_form', 'otp', 'in_app', 'self'].map((m) => `student.consent.${m}`),
    ];
    for (const key of keys) expect(lookup(key)).not.toBe(key);
  });
});

describe('consent forms', () => {
  it('offers only the bands each form allows', () => {
    expect(bandsFor('parent')).toEqual(['13-15', '16-17']);
    expect(bandsFor('self')).toEqual(['18-19', '20-24', '25+']);
  });

  it('asks for the last group of the password', () => {
    expect(lastGroup('K7QP-M2XD-9RTV-H4NB-W8CA')).toBe('W8CA');
  });

  it('has words for every form kind and status', () => {
    const keys = [
      ...['parent', 'self'].map((k) => `forms.kind.${k}`),
      ...['printed', 'recorded', 'claimed', 'expired'].map((s) => `forms.status.${s}`),
    ];
    for (const key of keys) expect(lookup(key)).not.toBe(key);
  });
});
