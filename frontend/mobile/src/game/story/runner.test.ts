/// <reference types="node" />
// Run with `pnpm test`. The Ink story bridge (ADR-0009): lines, speakers, measured choices, saving the place
// in a scene, and the checks every story must pass (each measured choice has an item the server knows).
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { test } from 'node:test';

import { Compiler } from 'inkjs/full';

import { StoryRunner, exploreScene, sceneProblems, tagValue } from './runner.ts';

const storyDir = new URL('../../../../../design/game/story/', import.meta.url);
const compiledDir = new URL('../stories/', import.meta.url);
const sample = JSON.parse(readFileSync(new URL('sample.ink.json', compiledDir), 'utf8'));

test('tags are read as name:value', () => {
  assert.equal(tagValue(['speaker:Hudhud', 'item:x'], 'speaker'), 'Hudhud');
  assert.equal(tagValue(['time: 10:30'], 'time'), '10:30');
  assert.equal(tagValue(['speaker:'], 'speaker'), null);
  assert.equal(tagValue(null, 'item'), null);
});

test('a scene reads line by line, with speakers, until the next choice', () => {
  const run = new StoryRunner(sample, 'prologue');
  const first = run.next();
  assert.deepEqual(first.lines[0], { text: 'Hello! I am Hudhud. I carry letters.', speaker: 'Hudhud' });
  assert.equal(first.lines[2].speaker, null); // no tag: the narrator
  assert.equal(first.choices.length, 2);
  assert.equal(run.measure(0), null, 'a story-only choice is not a measurement');
  assert.equal(run.choose(0), null);
  const second = run.next();
  assert.match(second.lines[0].text, /^You open it\./);
  assert.deepEqual(second.choices.map((c) => c.type), ['R', 'S']);
});

test('a two-way #type choice records pair, pick, side and item', () => {
  const run = new StoryRunner(sample, 'prologue');
  run.next();
  run.choose(1);
  run.next();
  assert.deepEqual(run.choose(1), { pair: 'R-S', picked: 'S', side: 'second', itemId: 'story_prologue_saturday' });
  run.next();
  assert.deepEqual(run.choose(0), { pair: 'A-C', picked: 'A', side: 'first', itemId: 'story_prologue_fair' });
  const end = run.next();
  assert.equal(end.ended, true);
  assert.match(end.lines.at(-1)?.text ?? '', /no right or wrong answers/);
});

test('a saved place resumes at the same choice, with its item', () => {
  const run = new StoryRunner(sample, 'prologue');
  run.next();
  run.choose(0);
  run.next(); // now at the Saturday choice
  const saved = JSON.parse(JSON.stringify(run.snapshot()));
  assert.ok(JSON.stringify(saved).length < 16_384, 'fits the 16 KB save limit');
  const again = new StoryRunner(sample, 'prologue', saved);
  const step = again.next();
  assert.deepEqual(step.lines, []);
  assert.deepEqual(step.choices.map((c) => c.type), ['R', 'S']);
  assert.equal(again.choose(0)?.itemId, 'story_prologue_saturday');
});

test('every story compiles, matches its compiled file, and every measured choice has a known item', () => {
  const seed = readFileSync(new URL('../../../../../database/seed/dev_seed.sql', import.meta.url), 'utf8');
  for (const file of readdirSync(storyDir).filter((f) => f.endsWith('.ink'))) {
    const compiler = new Compiler(readFileSync(new URL(file, storyDir), 'utf8'));
    const story = compiler.Compile();
    assert.deepEqual(compiler.errors, [], `${file} has Ink errors`);
    const name = file.replace(/\.ink$/, '');
    const compiled = readFileSync(new URL(`${name}.ink.json`, compiledDir), 'utf8').trim();
    assert.equal(story.ToJson(), compiled, `${name}.ink.json is out of date: run \`pnpm ink\``);
    const knots = [...readFileSync(new URL(file, storyDir), 'utf8').matchAll(/^===\s*(\w+)\s*===/gm)].map((m) => m[1]);
    for (const knot of knots) {
      const points = exploreScene(compiled, knot);
      assert.deepEqual(sceneProblems(points), [], `${file} ${knot}`);
      for (const p of points.filter((x) => x.measured)) {
        assert.ok(seed.includes(`'${p.item}'`), `item ${p.item} is not in the dev content pack (dev_seed.sql)`);
      }
    }
  }
});

test('the checks name a #type choice that cannot be measured, and a measured choice without an item', () => {
  const bad = new Compiler(`=== s ===
Pick one.
* [A thing #type:R] ok
* [Another #type:R] ok
- Pick again. #item:fine
* [Yes #type:R] ok
* [No #type:I] ok
- And again.
* [Up #type:E] ok
* [Down #type:C] ok
- -> DONE
`).Compile().ToJson() as string;
  const problems = sceneProblems(exploreScene(bad, 's')).join(' | ');
  assert.match(problems, /needs exactly two options with different #type tags/);
  assert.match(problems, /add an #item tag/);
});
