import { AbilityFamily, Level } from '../types';

export type Cell = [number, number];

export type TileShape = 'circle' | 'square' | 'triangle' | 'diamond' | 'arrow';
export type TileFill = 'solid' | 'empty' | 'half';
export interface Tile {
  shape: TileShape;
  count: 1 | 2 | 3 | 4;
  fill: TileFill;
  /** Degrees, multiples of 90. */
  rot: 0 | 90 | 180 | 270;
}

export interface Stop { id: string; label: string; x: number; y: number }

interface Base {
  id: string;
  family: AbilityFamily;
  level: Level;
  /** Short story line that sets the scene. */
  story: string;
  /** What the player has to do. */
  prompt: string;
  practice?: boolean;
}

/** SPA: which piece fits the gap? Pieces may turn but not flip. */
export interface FitPuzzle extends Base { kind: 'fit'; gap: Cell[]; options: Cell[][]; answer: number }
/** ABS: what comes next in the row, or completes the grid? */
export interface SequencePuzzle extends Base { kind: 'sequence'; layout: 'row' | 'grid'; tiles: (Tile | null)[]; options: Tile[]; answer: number }
/** NUM: type a number on the keypad. */
export interface NumericPuzzle extends Base { kind: 'numeric'; answer: number; unit?: string }
/** LOG / VRB: pick one answer. */
export interface ChoicePuzzle extends Base { kind: 'choice'; options: string[]; answer: number; visual?: 'circuit-series' | 'circuit-parallel' | 'houses' | 'signs' }
/** PLN: tap stops to plan the shortest bus route (Manhattan blocks). */
export interface RoutePuzzle extends Base {
  kind: 'route';
  grid: number;
  start: Stop;
  stops: Stop[];
  /** Pairs [a, b]: stop a must be visited before stop b. */
  before: [string, string][];
  returnToStart: boolean;
  /** Length of the shortest valid route, precomputed and verified in tests. */
  optimal: number;
}

export type Puzzle = FitPuzzle | SequencePuzzle | NumericPuzzle | ChoicePuzzle | RoutePuzzle;
