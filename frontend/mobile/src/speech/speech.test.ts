/// <reference types="node" />
// Run with `pnpm test`. Read-aloud helpers (FR-96): sentence splitting and choosing an English voice.
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { chooseVoice, sentences } from './sentences.ts';

test('text is read one sentence at a time, and line breaks end a sentence', () => {
  assert.deepEqual(sentences('No right answers. No clock! Ready? Go'), ['No right answers.', 'No clock!', 'Ready?', 'Go']);
  assert.deepEqual(sentences('Week 1\n\nPick what you like…  Then tap Done.'), [
    'Week 1',
    'Pick what you like…',
    'Then tap Done.',
  ]);
  assert.deepEqual(sentences('   '), []);
  assert.deepEqual(sentences('Class 9.5 is not a class'), ['Class 9.5 is not a class']); // no split inside numbers
});

test('an English voice is chosen; a phone with only other languages gets the install hint', () => {
  const voices = [
    { identifier: 'ur', language: 'ur-PK' },
    { identifier: 'us', language: 'en-US' },
    { identifier: 'in', language: 'en_IN' },
  ];
  assert.deepEqual(chooseVoice(voices), { voice: 'in' });
  assert.deepEqual(chooseVoice([{ identifier: 'us', language: 'en-US', quality: 'Enhanced' }, ...voices]), {
    voice: 'us',
  });
  assert.equal(chooseVoice([{ identifier: 'ur', language: 'ur-PK' }]), null);
  assert.deepEqual(chooseVoice([]), { voice: undefined }); // not known yet: try the default voice
});
