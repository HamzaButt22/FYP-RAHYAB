/**
 * Level 6 — The Pattern Gate. Ability family: abstract (inductive) reasoning.
 *
 * Four stones show a rule-based sequence of shapes. The student picks the fifth stone.
 * Each panel has three attributes: shape, count (1–6) and fill (solid / outline). Each distractor
 * breaks exactly one attribute of the rule, so a wrong choice says which part of the rule was missed.
 * Items use only shapes and counts (no words) to reduce language load.
 */
export type Shape = 'circle' | 'square' | 'triangle' | 'diamond';

export interface Panel {
  shape: Shape;
  count: number;
  filled: boolean;
}

export interface PatternItem {
  id: string;
  version: number;
  practice: boolean;
  difficulty: number;
  sequence: [Panel, Panel, Panel, Panel];
  options: [Panel, Panel, Panel, Panel];
  correctIndex: number;
  /** plain-language rule, shown after answering and used in the hint */
  rule: string;
  hint: string;
}

const P = (shape: Shape, count: number, filled = true): Panel => ({ shape, count, filled });

export const PATTERN_ITEMS: PatternItem[] = [
  { id: 'pg_practice', version: 1, practice: true, difficulty: 0,
    sequence: [P('circle', 1), P('circle', 2), P('circle', 3), P('circle', 4)],
    options: [P('circle', 4), P('circle', 5), P('square', 5), P('circle', 5, false)], correctIndex: 1,
    rule: 'One more circle each time.', hint: 'Count the circles on each stone.' },
  { id: 'pg1', version: 1, practice: false, difficulty: 1,
    sequence: [P('circle', 1), P('square', 1), P('triangle', 1), P('circle', 1)],
    options: [P('square', 1), P('triangle', 1), P('square', 2), P('square', 1, false)], correctIndex: 0,
    rule: 'The shapes repeat: circle, square, triangle.', hint: 'Look for a group of shapes that repeats.' },
  { id: 'pg2', version: 1, practice: false, difficulty: 2,
    sequence: [P('square', 1, true), P('square', 2, false), P('square', 3, true), P('square', 4, false)],
    options: [P('square', 5, false), P('square', 4, true), P('square', 5, true), P('circle', 5, true)], correctIndex: 2,
    rule: 'One more square each time, and solid/outline take turns.', hint: 'Two things change. Look at the number and the colour.' },
  { id: 'pg3', version: 1, practice: false, difficulty: 3,
    sequence: [P('triangle', 5), P('diamond', 4), P('triangle', 3), P('diamond', 2)],
    options: [P('diamond', 1), P('triangle', 2), P('triangle', 1, false), P('triangle', 1)], correctIndex: 3,
    rule: 'Triangle and diamond take turns, and there is one fewer each time.', hint: 'The number is going down.' },
  { id: 'pg4', version: 1, practice: false, difficulty: 4,
    sequence: [P('diamond', 1, true), P('diamond', 3, false), P('diamond', 2, true), P('diamond', 4, false)],
    options: [P('diamond', 5, true), P('diamond', 3, true), P('diamond', 3, false), P('square', 3, true)], correctIndex: 1,
    rule: 'Add two, then take away one, again and again; solid/outline take turns.', hint: 'Look at how the number changes from each stone to the next.' },
  { id: 'pg5', version: 1, practice: false, difficulty: 5,
    sequence: [P('circle', 1, true), P('square', 2, true), P('triangle', 3, false), P('circle', 4, true)],
    options: [P('square', 5, false), P('triangle', 5, true), P('square', 5, true), P('square', 4, true)], correctIndex: 2,
    rule: 'Shapes repeat in threes, one more each time, and every third stone is an outline.', hint: 'Three things follow rules: the shape, the number and the outline.' },
  { id: 'pg6', version: 1, practice: false, difficulty: 6,
    sequence: [P('circle', 5, false), P('square', 4, true), P('triangle', 3, false), P('diamond', 2, true)],
    options: [P('circle', 1, true), P('diamond', 1, false), P('circle', 1, false), P('circle', 2, false)], correctIndex: 2,
    rule: 'Four shapes repeat, one fewer each time, and solid/outline take turns.', hint: 'There are four shapes in the cycle.' },
];

export const isCorrectPattern = (it: PatternItem, choice: number) => choice === it.correctIndex;
export const samePanel = (a: Panel, b: Panel) => a.shape === b.shape && a.count === b.count && a.filled === b.filled;
