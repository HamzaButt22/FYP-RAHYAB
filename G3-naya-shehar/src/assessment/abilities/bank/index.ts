import { AbilityFamily } from '../../types';
import { Puzzle } from '../puzzleTypes';
import { SPA_BANK, SPA_PRACTICE } from './spa';
import { ABS_BANK } from './abs';
import { NUM_BANK, NUM_PRACTICE } from './num';
import { LOG_BANK } from './log';
import { PLN_BANK } from './pln';
import { VRB_BANK } from './vrb';

export const PUZZLE_BANK: Record<AbilityFamily, Puzzle[]> = {
  SPA: SPA_BANK,
  ABS: ABS_BANK,
  NUM: NUM_BANK,
  LOG: LOG_BANK,
  PLN: PLN_BANK,
  VRB: VRB_BANK,
};

export const ALL_PUZZLES: Puzzle[] = Object.values(PUZZLE_BANK).flat();
export const PRACTICE_PUZZLES: Puzzle[] = [SPA_PRACTICE, NUM_PRACTICE];

export const puzzleById = (id: string): Puzzle | undefined =>
  ALL_PUZZLES.find((p) => p.id === id) ?? PRACTICE_PUZZLES.find((p) => p.id === id);
