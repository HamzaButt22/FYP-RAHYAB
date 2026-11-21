/**
 * Level 5 — The Map Room. Ability family: spatial reasoning (mental rotation).
 *
 * A torn map piece is shown. Four pieces are offered: exactly one is the same piece turned (rotated);
 * the other three are mirror images (flipped, then turned). Every pattern is chiral and has 8 distinct
 * rotations/reflections (checked in tests), so exactly one option is a pure rotation.
 * Option order is fixed per item (not per student) so every student sees the same item.
 */
export type Grid = string[]; // rows of '#' (land) and '.' (water)

export interface MapItem {
  id: string;
  version: number;
  practice: boolean;
  difficulty: number;
  pattern: Grid;
  /** quarter turns clockwise applied to the correct option */
  turns: 1 | 2 | 3;
  /** for each distractor: quarter turns applied after mirroring */
  distractorTurns: [number, number, number];
  /** index (0..3) of the correct option in the displayed list */
  correctIndex: number;
  hint: string;
}

export const rotate = (g: Grid): Grid => g[0].split('').map((_, c) => g.map((r) => r[c]).reverse().join(''));
export const mirror = (g: Grid): Grid => g.map((r) => r.split('').reverse().join(''));
export const turn = (g: Grid, k: number): Grid => { let x = g; for (let i = 0; i < ((k % 4) + 4) % 4; i++) x = rotate(x); return x; };
export const key = (g: Grid) => g.join('/');

export function allTransforms(g: Grid): string[] {
  const out: string[] = [];
  for (let k = 0; k < 4; k++) out.push(key(turn(g, k)));
  for (let k = 0; k < 4; k++) out.push(key(turn(mirror(g), k)));
  return out;
}

const item = (id: string, practice: boolean, difficulty: number, pattern: Grid, turns: 1 | 2 | 3, distractorTurns: [number, number, number], correctIndex: number, hint: string): MapItem =>
  ({ id, version: 1, practice, difficulty, pattern, turns, distractorTurns, correctIndex, hint });

export const MAP_ITEMS: MapItem[] = [
  item('mr_practice', true, 0, ['##.', '#..', '#.#'], 1, [0, 1, 2], 2, 'Follow the lonely island in the corner. Where does it go when the piece turns?'),
  item('mr1', false, 1, ['#..', '##.', '.#.'], 1, [0, 2, 3], 0, 'Turn the piece a quarter to the right in your head.'),
  item('mr2', false, 2, ['##..', '#...', '#.#.', '...#'], 2, [0, 1, 3], 3, 'The piece is upside down. A flipped piece can never be turned back to match.'),
  item('mr3', false, 3, ['.##.', '#...', '#.##', '...#'], 3, [1, 2, 3], 1, 'Track two corners at once.'),
  item('mr4', false, 4, ['#.#.', '##..', '..#.', '.#.#'], 1, [1, 2, 0], 2, 'Find a shape you can recognise and follow it.'),
  item('mr5', false, 5, ['#..#', '##..', '.#..', '..##'], 3, [0, 2, 1], 0, 'Turning keeps the order of corners going around; flipping reverses it.'),
  item('mr6', false, 6, ['.#..', '###.', '..#.', '#..#'], 2, [3, 1, 0], 3, 'Look at the T-shape and where its stem points.'),
];

/** Displayed options for an item, in fixed order. */
export function mapOptions(it: MapItem): Grid[] {
  const correct = turn(it.pattern, it.turns);
  const distractors = it.distractorTurns.map((k) => turn(mirror(it.pattern), k));
  const out = [...distractors];
  out.splice(it.correctIndex, 0, correct);
  return out;
}

export const isCorrectMap = (it: MapItem, choice: number) => choice === it.correctIndex;
