import { Level } from '../../types';
import { Cell, FitPuzzle } from '../puzzleTypes';
import { isChiral, mirror, rotateTimes, sameUnderRotation, shuffleWithAnswer } from '../geometry';

const S: Record<string, Cell[]> = {
  T4: [[0, 0], [1, 0], [2, 0], [1, 1]],
  L4: [[0, 0], [0, 1], [0, 2], [1, 2]],
  J4: [[1, 0], [1, 1], [1, 2], [0, 2]],
  S4: [[1, 0], [2, 0], [0, 1], [1, 1]],
  Z4: [[0, 0], [1, 0], [1, 1], [2, 1]],
  I4: [[0, 0], [1, 0], [2, 0], [3, 0]],
  O4: [[0, 0], [1, 0], [0, 1], [1, 1]],
  F5: [[1, 0], [2, 0], [0, 1], [1, 1], [1, 2]],
  N5: [[1, 0], [1, 1], [0, 2], [1, 2], [0, 3]],
  P5: [[0, 0], [1, 0], [0, 1], [1, 1], [0, 2]],
  Y5: [[1, 0], [0, 1], [1, 1], [1, 2], [1, 3]],
  L5: [[0, 0], [0, 1], [0, 2], [0, 3], [1, 3]],
  Z5: [[0, 0], [1, 0], [1, 1], [1, 2], [2, 2]],
  H1: [[0, 0], [1, 0], [1, 1], [2, 1], [2, 2], [3, 2]],
  H2: [[0, 0], [1, 0], [2, 0], [0, 1], [2, 1], [2, 2]],
  H3: [[1, 0], [0, 1], [1, 1], [2, 1], [2, 2], [2, 3]],
  H4: [[0, 0], [0, 1], [1, 1], [2, 1], [3, 1], [3, 2]],
};

interface Spec { n: number; level: Level; shape: string; rot: number; useMirror: boolean; pool: string[]; mirrorPool: boolean }

const SPECS: Spec[] = [
  { n: 1, level: 1, shape: 'T4', rot: 1, useMirror: false, pool: ['I4', 'O4', 'S4'], mirrorPool: false },
  { n: 2, level: 1, shape: 'L4', rot: 2, useMirror: false, pool: ['T4', 'O4', 'I4'], mirrorPool: false },
  { n: 3, level: 1, shape: 'S4', rot: 1, useMirror: false, pool: ['T4', 'L4', 'O4'], mirrorPool: false },
  { n: 4, level: 1, shape: 'Z4', rot: 3, useMirror: false, pool: ['T4', 'L4', 'I4'], mirrorPool: false },
  { n: 5, level: 2, shape: 'L4', rot: 1, useMirror: true, pool: ['T4', 'S4'], mirrorPool: false },
  { n: 6, level: 2, shape: 'J4', rot: 3, useMirror: true, pool: ['Z4', 'T4'], mirrorPool: false },
  { n: 7, level: 2, shape: 'S4', rot: 1, useMirror: true, pool: ['L4', 'T4'], mirrorPool: false },
  { n: 8, level: 2, shape: 'Z4', rot: 3, useMirror: true, pool: ['J4', 'T4'], mirrorPool: false },
  { n: 9, level: 3, shape: 'F5', rot: 1, useMirror: true, pool: ['P5', 'Y5'], mirrorPool: false },
  { n: 10, level: 3, shape: 'N5', rot: 2, useMirror: true, pool: ['L5', 'Z5'], mirrorPool: false },
  { n: 11, level: 3, shape: 'P5', rot: 3, useMirror: true, pool: ['F5', 'N5'], mirrorPool: false },
  { n: 12, level: 3, shape: 'Y5', rot: 1, useMirror: true, pool: ['L5', 'N5'], mirrorPool: false },
  { n: 13, level: 4, shape: 'H1', rot: 1, useMirror: true, pool: ['H2', 'H3'], mirrorPool: true },
  { n: 14, level: 4, shape: 'H2', rot: 2, useMirror: true, pool: ['H3', 'H4'], mirrorPool: true },
  { n: 15, level: 4, shape: 'H3', rot: 3, useMirror: true, pool: ['H1', 'H4'], mirrorPool: true },
  { n: 16, level: 4, shape: 'H4', rot: 1, useMirror: true, pool: ['H1', 'H2'], mirrorPool: true },
];

const STORIES = [
  'Ustad Rafiq is patching a hole in the workshop wall.',
  'A tile has fallen out of the school floor.',
  'The bridge railing has a missing panel.',
  'Zoya needs one more piece for her mosaic.',
];

function build(spec: Spec): FitPuzzle {
  const shape = S[spec.shape];
  const correct = rotateTimes(shape, spec.rot);
  const wrong: Cell[][] = [];
  if (spec.useMirror) {
    if (!isChiral(shape)) throw new Error(`${spec.shape} is not chiral; mirror distractor would be correct`);
    wrong.push(rotateTimes(mirror(shape), spec.rot + 1));
  }
  spec.pool.forEach((p, i) => {
    const base = spec.mirrorPool && i === 0 ? mirror(S[p]) : S[p];
    wrong.push(rotateTimes(base, spec.rot + i + 2));
  });
  for (const w of wrong) if (sameUnderRotation(w, shape)) throw new Error(`SPA ${spec.n}: distractor equals answer`);
  const { options, answer } = shuffleWithAnswer(correct, wrong.slice(0, 3), 1000 + spec.n);
  return {
    id: `SPA-${String(spec.n).padStart(2, '0')}`,
    family: 'SPA',
    level: spec.level,
    kind: 'fit',
    story: STORIES[(spec.n - 1) % STORIES.length],
    prompt: 'Which piece fills the gap? Pieces can turn, but they cannot flip over.',
    gap: rotateTimes(shape, 0),
    options,
    answer,
  };
}

export const SPA_BANK: FitPuzzle[] = SPECS.map(build);

export const SPA_PRACTICE: FitPuzzle = {
  ...build({ n: 0, level: 1, shape: 'T4', rot: 2, useMirror: false, pool: ['O4', 'I4', 'L4'], mirrorPool: false }),
  id: 'PRAC-SPA-01',
  practice: true,
  story: 'Practice: Bilal is fixing a gap in the Youth Office floor.',
};
