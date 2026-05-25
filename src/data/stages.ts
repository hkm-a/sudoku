import type { Difficulty } from "../types";

export interface Stage {
  number: number;
  difficulty: Difficulty;
  label: string;
}

export const TOTAL_STAGES = 20;

const STORAGE_KEY = "sudoku_stage";

export function getStage(stageNum: number): Stage {
  let difficulty: Difficulty;
  if (stageNum <= 5) difficulty = "easy";
  else if (stageNum <= 10) difficulty = "medium";
  else if (stageNum <= 15) difficulty = "hard";
  else difficulty = "expert";

  const diffLabels: Record<Difficulty, string> = {
    easy: "简单",
    medium: "中等",
    hard: "困难",
    expert: "专家",
  };

  return {
    number: stageNum,
    difficulty,
    label: diffLabels[difficulty],
  };
}

export function loadUnlockedStage(): number {
  try {
    const val = localStorage.getItem(STORAGE_KEY);
    return val ? Math.max(1, parseInt(val, 10)) : 1;
  } catch {
    return 1;
  }
}

export function saveUnlockedStage(stage: number): void {
  try {
    localStorage.setItem(STORAGE_KEY, String(Math.min(stage, TOTAL_STAGES)));
  } catch {
    // silently fail
  }
}

export function resetProgress(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // silently fail
  }
}
