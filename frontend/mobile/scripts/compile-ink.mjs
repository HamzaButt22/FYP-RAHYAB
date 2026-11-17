// Compiles every story in design/game/story/*.ink to src/game/stories/<name>.ink.json with inkjs's own
// compiler (no inklecate needed). Run `pnpm ink` after editing a story; runner.test.ts fails if a compiled
// file is out of date.

import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Compiler } from 'inkjs/full';

const here = fileURLToPath(new URL('.', import.meta.url));
const SOURCE = join(here, '..', '..', '..', 'design', 'game', 'story');
const TARGET = join(here, '..', 'src', 'game', 'stories');

let failed = false;
for (const file of readdirSync(SOURCE).filter((f) => f.endsWith('.ink'))) {
  const compiler = new Compiler(readFileSync(join(SOURCE, file), 'utf8'));
  const story = compiler.Compile();
  for (const w of compiler.warnings) console.warn(`${file}: ${w}`);
  if (!story || compiler.errors.length > 0) {
    for (const e of compiler.errors) console.error(`${file}: ${e}`);
    failed = true;
    continue;
  }
  const out = join(TARGET, `${basename(file, '.ink')}.ink.json`);
  writeFileSync(out, `${story.ToJson()}\n`);
  console.log(`compiled ${file} -> ${out}`);
}
process.exit(failed ? 1 : 0);
