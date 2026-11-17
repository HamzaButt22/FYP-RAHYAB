// Copies design/game/frameworks/streams.json into the app (src/library/streams.json), so the stream library
// works offline (FR-65). Run `pnpm streams` after streams.json changes; library.test.ts fails until you do.

import { copyFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = fileURLToPath(new URL('.', import.meta.url));
const source = join(here, '..', '..', '..', 'design', 'game', 'frameworks', 'streams.json');
const target = join(here, '..', 'src', 'library', 'streams.json');
copyFileSync(source, target);
console.log(`copied ${source} -> ${target}`);
