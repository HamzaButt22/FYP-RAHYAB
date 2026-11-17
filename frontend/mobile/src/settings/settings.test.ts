/// <reference types="node" />
// Run with `pnpm test`. Accessibility settings (FR-97): defaults, saved values, TalkBack and Android's reduce
// motion, and text sizes that never pass 200%.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

import { DEFAULTS, READING_SPEEDS, TEXT_SCALES, effective, fitSettings, textSizing } from './settings.ts';

const en = JSON.parse(readFileSync(new URL('../i18n/locales/en.json', import.meta.url), 'utf8'));

test('defaults follow the spec: speaker buttons on, everything else off or following Android', () => {
  assert.deepEqual(DEFAULTS, {
    readAloud: true,
    autoRead: false,
    readingSpeed: 1,
    textScale: 1,
    highContrast: false,
    readingFont: false,
    reduceMotion: 'system',
  });
});

test('saved settings are kept; unknown or broken values fall back to the default', () => {
  assert.deepEqual(fitSettings(null), DEFAULTS);
  assert.deepEqual(fitSettings({ ...DEFAULTS, autoRead: true, textScale: 1.5, readingSpeed: 0.75 }), {
    ...DEFAULTS,
    autoRead: true,
    textScale: 1.5,
    readingSpeed: 0.75,
  });
  assert.deepEqual(fitSettings({ textScale: 3, readingSpeed: '1', reduceMotion: 'sometimes', highContrast: 'yes' }), DEFAULTS);
});

test('auto-read never runs with TalkBack or with read aloud off; reduce motion follows Android unless on', () => {
  const on = { ...DEFAULTS, autoRead: true };
  assert.equal(effective(on, { screenReader: false, reduceMotion: false }).autoRead, true);
  assert.equal(effective(on, { screenReader: true, reduceMotion: false }).autoRead, false);
  assert.equal(effective({ ...on, readAloud: false }, { screenReader: false, reduceMotion: false }).autoRead, false);
  assert.equal(effective(DEFAULTS, { screenReader: false, reduceMotion: true }).reduceMotion, true);
  assert.equal(effective({ ...DEFAULTS, reduceMotion: 'on' }, { screenReader: false, reduceMotion: false }).reduceMotion, true);
  assert.equal(effective({ ...DEFAULTS, readingSpeed: 1.25 }, { screenReader: false, reduceMotion: false }).speechRate, 1.25);
});

test('text never passes 200% (display text 130%), whatever the app and Android sizes', () => {
  assert.deepEqual(textSizing(1, 2), { appScale: 1, maxSystemScale: 2 });
  assert.deepEqual(textSizing(1.5, 2), { appScale: 1.5, maxSystemScale: 2 / 1.5 });
  assert.deepEqual(textSizing(2, 2), { appScale: 2, maxSystemScale: 1 });
  assert.deepEqual(textSizing(2, 1.3), { appScale: 1.3, maxSystemScale: 1 });
  for (const s of TEXT_SCALES) {
    const { appScale, maxSystemScale } = textSizing(s, 2);
    assert.ok(appScale * maxSystemScale <= 2 + 1e-9);
  }
});

test('every option the screen shows has an English label', () => {
  const has = (key: string) => {
    let node: unknown = en;
    for (const part of key.split('.')) node = (node as Record<string, unknown> | undefined)?.[part];
    return typeof node === 'string';
  };
  const keys = [
    'settings.title', 'settings.readAloud', 'settings.readAloudHint', 'settings.autoRead', 'settings.autoReadHint',
    'settings.autoReadTalkBack', 'settings.readingSpeed', 'settings.textSize', 'settings.textSizeHint',
    'settings.highContrast', 'settings.highContrastHint', 'settings.readingFont', 'settings.readingFontHint',
    'settings.reduceMotion', 'settings.reduceMotionHint', 'settings.sample',
    ...READING_SPEEDS.map((s) => `settings.speeds.${String(s).replace('.', '_')}`),
    ...TEXT_SCALES.map((s) => `settings.sizes.${String(s).replace('.', '_')}`),
  ];
  for (const key of keys) assert.ok(has(key), `en.json is missing ${key}`);
});
