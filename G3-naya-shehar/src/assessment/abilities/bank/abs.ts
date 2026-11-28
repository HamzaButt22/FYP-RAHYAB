import { Level } from '../../types';
import { SequencePuzzle, Tile, TileFill, TileShape } from '../puzzleTypes';
import { shuffleWithAnswer } from '../geometry';

const t = (shape: TileShape, count: number, fill: TileFill = 'solid', rot = 0): Tile =>
  ({ shape, count: count as Tile['count'], fill, rot: (((rot % 360) + 360) % 360) as Tile['rot'] });

const SHAPES: TileShape[] = ['circle', 'square', 'triangle', 'diamond'];
const FILLS: TileFill[] = ['solid', 'half', 'empty'];

/** Three wrong answers, each differing from the answer in exactly one feature. */
function distractors(ans: Tile): Tile[] {
  const out: Tile[] = [];
  const otherShape = ans.shape === 'arrow' ? 'triangle' : SHAPES[(SHAPES.indexOf(ans.shape) + 1) % SHAPES.length];
  out.push({ ...ans, shape: otherShape, rot: 0 });
  out.push({ ...ans, count: ((ans.count % 4) + 1) as Tile['count'] });
  if (ans.shape === 'arrow') out.push({ ...ans, rot: ((ans.rot + 180) % 360) as Tile['rot'] });
  else out.push({ ...ans, fill: FILLS[(FILLS.indexOf(ans.fill) + 1) % FILLS.length] });
  return out;
}

interface Spec { n: number; level: Level; layout: 'row' | 'grid'; seq: Tile[]; story: string }

const row = (n: number, level: Level, seq: Tile[], story: string): Spec => ({ n, level, layout: 'row', seq, story });
const grid = (n: number, level: Level, f: (r: number, c: number) => Tile, story: string): Spec => {
  const seq: Tile[] = [];
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) seq.push(f(r, c));
  return { n, level, layout: 'grid', seq, story };
};

const ROW_STORY = 'Zoya is laying a pattern of tiles along the new school path.';
const GRID_STORY = 'The mural wall has a square pattern with one tile missing.';

const SPECS: Spec[] = [
  // Level 1 — one feature changes
  row(1, 1, [0, 90, 180, 270, 0].map((r) => t('arrow', 1, 'solid', r)), ROW_STORY),
  row(2, 1, [1, 2, 3, 4].map((c) => t('circle', c)), ROW_STORY),
  row(3, 1, (['solid', 'empty', 'solid', 'empty', 'solid'] as TileFill[]).map((f) => t('square', 1, f)), ROW_STORY),
  row(4, 1, (['circle', 'square', 'triangle', 'circle', 'square', 'triangle'] as TileShape[]).map((s) => t(s, 1)), ROW_STORY),
  // Level 2 — two features change
  row(5, 2, [t('circle', 1), t('square', 2), t('circle', 3), t('square', 4)], ROW_STORY),
  row(6, 2, [0, 1, 2, 3, 4].map((i) => t('arrow', 1, i % 2 ? 'empty' : 'solid', i * 90)), ROW_STORY),
  row(7, 2, [0, 1, 2, 3].map((i) => t('diamond', 4 - i, FILLS[i % 3])), ROW_STORY),
  row(8, 2, [0, 1, 2, 3, 4, 5].map((i) => t((['triangle', 'diamond', 'circle'] as TileShape[])[i % 3], (i % 2) + 1)), ROW_STORY),
  // Level 3 — three features or two interleaved rows
  row(9, 3, [0, 1, 2, 3, 4].map((i) => t('arrow', (i % 3) + 1, i % 2 ? 'empty' : 'solid', i * 90)), ROW_STORY),
  row(10, 3, [t('circle', 1), t('square', 3), t('circle', 2), t('square', 2), t('circle', 3), t('square', 1)], ROW_STORY),
  row(11, 3, [0, 1, 2, 3, 4, 5].map((i) => t('arrow', 1, FILLS[i % 3], -90 * i)), ROW_STORY),
  row(12, 3, [0, 1, 2, 3].map((i) => t(i % 2 ? 'diamond' : 'square', i + 1, i % 2 ? 'empty' : 'solid')), ROW_STORY),
  // Level 4 — 3×3 grids with two or three rules
  grid(13, 4, (r, c) => t((['circle', 'square', 'triangle'] as TileShape[])[r], c + 1), GRID_STORY),
  grid(14, 4, (r, c) => t((['diamond', 'circle', 'square'] as TileShape[])[c], c + 1, FILLS[r]), GRID_STORY),
  grid(15, 4, (r, c) => t((['circle', 'square', 'triangle'] as TileShape[])[(r + c) % 3], c + 1, FILLS[(r + 2 * c) % 3]), GRID_STORY),
  grid(16, 4, (r, c) => t('arrow', r + 1, c % 2 ? 'empty' : 'solid', 90 * (r + c)), GRID_STORY),
];

function build(spec: Spec): SequencePuzzle {
  const answerTile = spec.seq[spec.seq.length - 1];
  const tiles: (Tile | null)[] = [...spec.seq.slice(0, -1), null];
  const { options, answer } = shuffleWithAnswer(answerTile, distractors(answerTile), 2000 + spec.n);
  return {
    id: `ABS-${String(spec.n).padStart(2, '0')}`,
    family: 'ABS',
    level: spec.level,
    kind: 'sequence',
    layout: spec.layout,
    story: spec.story,
    prompt: spec.layout === 'row' ? 'Which tile comes next?' : 'Which tile completes the pattern?',
    tiles,
    options,
    answer,
  };
}

export const ABS_BANK: SequencePuzzle[] = SPECS.map(build);
