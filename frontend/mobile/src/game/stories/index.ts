// The compiled Ink stories bundled with the app (ADR-0009). Sources are in design/game/story/*.ink; run
// `pnpm ink` to recompile. A week-plan step names a story and a knot: { story: 'sample', knot: 'prologue' }.
// Until content packs can be downloaded (RFC-0001), stories ship inside the app.

import sample from './sample.ink.json';

export const STORIES: Readonly<Record<string, object>> = { sample };
