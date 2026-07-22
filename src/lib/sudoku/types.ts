export type Difficulty = "easy" | "medium" | "hard" | "expert";

export type Grid = number[]; // length 81, 0 = empty

export interface Puzzle {
  puzzle: Grid; // givens (0 = blank)
  solution: Grid;
  difficulty: Difficulty;
  seed: string;
  clueCount: number;
}

export interface CellState {
  value: number; // 0 empty
  given: boolean;
  notes: number[]; // pencil marks 1-9
}

export const ALL_DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;
