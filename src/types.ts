export type Difficulty = "easy" | "medium" | "hard" | "expert";

export interface Puzzle {
  puzzle: number[][];
  solution: number[][];
}

export interface Hint {
  row: number;
  col: number;
  num: number;
}

export interface Conflict {
  row: number;
  col: number;
}

export interface GameState {
  board: number[][];
  solution: number[][];
  given: boolean[][];
  selectedCell: [number, number] | null;
  difficulty: Difficulty;
  timer: number;
  gameStatus: "idle" | "playing" | "paused" | "completed";
  conflicts: Conflict[];
  hintCell: [number, number] | null;
  mistakes: number;
  notes: Set<string>; // "row-col" -> Set of candidate numbers
  noteMode: boolean;
  history: number[][][];
}