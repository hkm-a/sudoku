import { useState, useEffect, useCallback, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { Difficulty, Conflict } from "../types";
import { getStage } from "../data/stages";
import { soundManager } from "../utils/SoundManager";

interface UseSudokuReturn {
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
  notes: Set<string>;
  noteMode: boolean;
  loading: boolean;
  message: string | null;
  newGame: (diff: Difficulty) => void;
  startStageGame: (stage: number) => void;
  currentStage: number;
  selectCell: (row: number, col: number) => void;
  enterNumber: (num: number) => void;
  eraseCell: () => void;
  toggleNoteMode: () => void;
  getHint: () => void;
  checkBoard: () => void;
  undo: () => void;
  resetGame: () => void;
  sameNumberCells: Set<string>;
  dismissMessage: () => void;
}

export function deepClone(board: number[][]): number[][] {
  return board.map((row) => [...row]);
}

export function detectConflicts(board: number[][]): Conflict[] {
  const conflicts: Conflict[] = [];
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const num = board[row][col];
      if (num === 0) continue;
      // Check row
      for (let c = 0; c < 9; c++) {
        if (c !== col && board[row][c] === num) {
          conflicts.push({ row, col });
          break;
        }
      }
      // Check column
      for (let r = 0; r < 9; r++) {
        if (r !== row && board[r][col] === num) {
          if (!conflicts.some((c) => c.row === row && c.col === col)) {
            conflicts.push({ row, col });
          }
          break;
        }
      }
      // Check 3x3 box
      const br = Math.floor(row / 3) * 3;
      const bc = Math.floor(col / 3) * 3;
      for (let r = br; r < br + 3; r++) {
        for (let c = bc; c < bc + 3; c++) {
          if ((r !== row || c !== col) && board[r][c] === num) {
            if (!conflicts.some((x) => x.row === row && x.col === col)) {
              conflicts.push({ row, col });
            }
            break;
          }
        }
      }
    }
  }
  return conflicts;
}

export function isBoardComplete(board: number[][]): boolean {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (board[r][c] === 0) return false;
    }
  }
  return true;
}

export function boardToIPC(board: number[][]): (number | null)[][] {
  return board.map((row) => row.map((v) => (v === 0 ? null : v)));
}

const LOCAL_SOLUTION: number[][] = [
  [5, 3, 4, 6, 7, 8, 9, 1, 2],
  [6, 7, 2, 1, 9, 5, 3, 4, 8],
  [1, 9, 8, 3, 4, 2, 5, 6, 7],
  [8, 5, 9, 7, 6, 1, 4, 2, 3],
  [4, 2, 6, 8, 5, 3, 7, 9, 1],
  [7, 1, 3, 9, 2, 4, 8, 5, 6],
  [9, 6, 1, 5, 3, 7, 2, 8, 4],
  [2, 8, 7, 4, 1, 9, 6, 3, 5],
  [3, 4, 5, 2, 8, 6, 1, 7, 9],
];

const LOCAL_PUZZLE: (number | null)[][] = [
  [5, 3, null, null, 7, null, null, null, null],
  [6, null, null, 1, 9, 5, null, null, null],
  [null, 9, 8, null, null, null, null, 6, null],
  [8, null, null, null, 6, null, null, null, 3],
  [4, null, null, 8, null, 3, null, null, 1],
  [7, null, null, null, 2, null, null, null, 6],
  [null, 6, null, null, null, null, 2, 8, null],
  [null, null, null, 4, 1, 9, null, null, 5],
  [null, null, null, null, 8, null, null, 7, 9],
];

function localPuzzle() {
  return {
    puzzle: LOCAL_PUZZLE.map((row) => [...row]),
    solution: deepClone(LOCAL_SOLUTION),
  };
}

function hasLoadedSolution(solution: number[][]): boolean {
  return solution.some((row) => row.some((value) => value !== 0));
}

function findHintForBoard(board: number[][], solution: number[][]) {
  if (!hasLoadedSolution(solution)) return null;

  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (board[row][col] !== 0 && board[row][col] !== solution[row][col]) {
        return { row, col, num: solution[row][col] };
      }
    }
  }

  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (board[row][col] === 0) {
        return { row, col, num: solution[row][col] };
      }
    }
  }

  return null;
}

function collectSolutionErrors(board: number[][], given: boolean[][], solution: number[][]): Conflict[] {
  const errs: Conflict[] = [];
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (!given[r][c] && board[r][c] !== 0 && board[r][c] !== solution[r][c]) {
        errs.push({ row: r, col: c });
      }
    }
  }
  return errs;
}

export function useSudoku(): UseSudokuReturn {
  const [board, setBoard] = useState<number[][]>(() =>
    Array.from({ length: 9 }, () => Array(9).fill(0))
  );
  const [solution, setSolution] = useState<number[][]>(() =>
    Array.from({ length: 9 }, () => Array(9).fill(0))
  );
  const [given, setGiven] = useState<boolean[][]>(() =>
    Array.from({ length: 9 }, () => Array(9).fill(false))
  );
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [timer, setTimer] = useState(0);
  const [gameStatus, setGameStatus] = useState<"idle" | "playing" | "paused" | "completed">("idle");
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [hintCell, setHintCell] = useState<[number, number] | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [notes, setNotes] = useState<Set<string>>(new Set());
  const [noteMode, setNoteMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [sameNumberCells, setSameNumberCells] = useState<Set<string>>(new Set());
  const [history, setHistory] = useState<number[][][]>([]);
  const [currentStage, setCurrentStage] = useState(0);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hintTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const noteModeRef = useRef(noteMode);

  const dismissMessage = useCallback(() => setMessage(null), []);

  // Timer effect
  useEffect(() => {
    if (gameStatus === "playing") {
      timerRef.current = setInterval(() => {
        setTimer((t) => t + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameStatus]);

  // Clear hint animation after timeout
  useEffect(() => {
    if (hintCell) {
      hintTimeoutRef.current = setTimeout(() => {
        setHintCell(null);
      }, 1200);
    }
    return () => {
      if (hintTimeoutRef.current) clearTimeout(hintTimeoutRef.current);
    };
  }, [hintCell]);

  const newGame = useCallback(async (diff: Difficulty) => {
    setLoading(true);
    setMessage(null);
    try {
      let result: { puzzle: (number | null)[][]; solution: number[][] };
      try {
        result = await invoke<{ puzzle: (number | null)[][]; solution: number[][] }>(
          "generate_puzzle",
          { difficulty: diff }
        );
      } catch {
        result = localPuzzle();
      }
      const newBoard = result.puzzle.map((row) =>
        row.map((v) => (v === null ? 0 : v))
      );
      const newGiven = result.puzzle.map((row) =>
        row.map((v) => v !== null)
      );
      setBoard(newBoard);
      setSolution(result.solution);
      setGiven(newGiven);
      setSelectedCell(null);
      setDifficulty(diff);
      setTimer(0);
      setGameStatus("playing");
      setConflicts([]);
      setHintCell(null);
      setMistakes(0);
      setNotes(new Set());
      setSameNumberCells(new Set());
      setHistory([]);
    } catch (e) {
      setMessage(`生成谜题失败: ${e}`);
    } finally {
      setLoading(false);
    }
  }, []);

  const startStageGame = useCallback(async (stage: number) => {
    const { difficulty } = getStage(stage);
    setCurrentStage(stage);
    // Must clear "completed" status before the async newGame call,
    // otherwise App.tsx victory effect re-fires on currentStage change.
    setGameStatus("idle");
    await newGame(difficulty);
  }, [newGame]);

  const selectCell = useCallback(
    (row: number, col: number) => {
      soundManager.play("select");
      setSelectedCell([row, col]);
      const num = board[row][col];
      if (num !== 0) {
        const cells = new Set<string>();
        for (let r = 0; r < 9; r++) {
          for (let c = 0; c < 9; c++) {
            if (board[r][c] === num) {
              cells.add(`${r}-${c}`);
            }
          }
        }
        setSameNumberCells(cells);
      } else {
        setSameNumberCells(new Set());
      }
    },
    [board]
  );

  const enterNumber = useCallback(
    (num: number) => {
      if (!selectedCell || gameStatus !== "playing") return;
      const [row, col] = selectedCell;
      if (given[row][col]) return; // Can't edit given cells

      if (noteModeRef.current) {
        const key = `${row}-${col}`;
        setNotes((prev) => {
          const next = new Set(prev);
          const noteKey = `note:${key}:${num}`;
          if (next.has(noteKey)) {
            next.delete(noteKey);
          } else {
            next.add(noteKey);
          }
          return next;
        });
        return;
      }

      // Save history
      setHistory((prev) => [...prev, deepClone(board)]);

      const newBoard = deepClone(board);
      newBoard[row][col] = num;
      setBoard(newBoard);

      // Play place sound (will be overridden if mistake below)
      soundManager.play("place");

      // Clear notes for this cell
      const cellKey = `${row}-${col}`;
      setNotes((prev) => {
        const next = new Set(prev);
        for (const n of next) {
          if (n.startsWith(`note:${cellKey}:`)) {
            next.delete(n);
          }
        }
        return next;
      });

      // Update same-number highlighting if a cell is selected
      const numCells = new Set<string>();
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          if (newBoard[r][c] === num) {
            numCells.add(`${r}-${c}`);
          }
        }
      }
      setSameNumberCells(numCells);

      // Check conflicts
      const newConflicts = detectConflicts(newBoard);
      setConflicts(newConflicts);

      // Check if correct
      if (num !== solution[row][col]) {
        soundManager.play("mistake");
        setMistakes((m) => m + 1);
      }

      // Check completion
      if (newConflicts.length === 0 && isBoardComplete(newBoard)) {
        setGameStatus("completed");
        soundManager.play("victory");
        if (currentStage === 0) {
          setMessage(`🎉 完成！用时 ${formatTime(timer)}`);
        } else {
          setMessage(null);
        }
      }
    },
    [selectedCell, gameStatus, given, board, solution, timer, currentStage]
  );

  const eraseCell = useCallback(() => {
    if (!selectedCell || gameStatus !== "playing") return;
    const [row, col] = selectedCell;
    if (given[row][col]) return;

    soundManager.play("erase");
    setHistory((prev) => [...prev, deepClone(board)]);
    const newBoard = deepClone(board);
    newBoard[row][col] = 0;
    setBoard(newBoard);
    setConflicts(detectConflicts(newBoard));

    // Remove notes
    const key = `${row}-${col}`;
    setNotes((prev) => {
      const next = new Set(prev);
      for (const n of next) {
        if (n.startsWith(`note:${key}:`)) {
          next.delete(n);
        }
      }
      return next;
    });
  }, [selectedCell, gameStatus, given, board]);

  const toggleNoteMode = useCallback(() => {
    soundManager.play("note");
    setNoteMode((prev) => {
      const next = !prev;
      noteModeRef.current = next;
      return next;
    });
  }, []);

  const getHint = useCallback(async () => {
    if (gameStatus !== "playing") return;
    setLoading(true);
    try {
      let result: { row: number; col: number; num: number } | null;
      try {
        result = await invoke<{ row: number; col: number; num: number }>("get_hint", {
          board: boardToIPC(board),
          solution,
        });
      } catch {
        result = findHintForBoard(board, solution);
      }
      if (!result) {
        setMessage("棋盘已完成");
        return;
      }
      const { row, col, num } = result;
      setHintCell([row, col]);

      if (!given[row][col]) {
        setHistory((prev) => [...prev, deepClone(board)]);
        const newBoard = deepClone(board);
        newBoard[row][col] = num;
        setBoard(newBoard);
        setConflicts(detectConflicts(newBoard));
        setSelectedCell([row, col]);
      }
    } catch (e) {
      setMessage(`${e}`);
    } finally {
      setLoading(false);
    }
  }, [gameStatus, board, solution, given]);

  const checkBoard = useCallback(async () => {
    if (gameStatus === "idle") return;
    setLoading(true);
    try {
      let result: number[][];
      try {
        result = await invoke<number[][]>("solve_board", {
          board: boardToIPC(board),
        });
      } catch {
        result = solution;
      }
      const errs = collectSolutionErrors(board, given, result);
      setConflicts(errs);
      if (errs.length === 0) {
        setMessage("✓ 全部正确！");
      } else {
        setMessage(`✗ 发现 ${errs.length} 个错误`);
      }
    } catch (e) {
      setMessage(`${e}`);
    } finally {
      setLoading(false);
    }
  }, [gameStatus, board, given]);

  const updateSameNumberCells = useCallback((boardState: number[][], cell: [number, number] | null) => {
    if (!cell) {
      setSameNumberCells(new Set());
      return;
    }

    const [row, col] = cell;
    const num = boardState[row][col];
    if (num === 0) {
      setSameNumberCells(new Set());
      return;
    }

    const cells = new Set<string>();
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (boardState[r][c] === num) {
          cells.add(`${r}-${c}`);
        }
      }
    }
    setSameNumberCells(cells);
  }, []);

  const undo = useCallback(() => {
    if (history.length === 0) return;
    setHistory((prev) => {
      const next = [...prev];
      const prevBoard = next.pop()!;
      setBoard(prevBoard);
      setConflicts(detectConflicts(prevBoard));
      updateSameNumberCells(prevBoard, selectedCell);
      return next;
    });
  }, [history, selectedCell, updateSameNumberCells]);

  const resetGame = useCallback(() => {
    if (gameStatus === "idle") return;
    setBoard((prev) => {
      const newBoard = prev.map((row, r) =>
        row.map((_, c) => (given[r][c] ? prev[r][c] : 0))
      );
      setConflicts(detectConflicts(newBoard));
      setHistory([]);
      return newBoard;
    });
    setTimer(0);
    setGameStatus("playing");
    setSelectedCell(null);
    setHintCell(null);
    setMistakes(0);
    setNotes(new Set());
    setSameNumberCells(new Set());
    setNoteMode(false);
    noteModeRef.current = false;
    setMessage(null);
  }, [gameStatus, given]);

  return {
    board,
    solution,
    given,
    selectedCell,
    difficulty,
    timer,
    gameStatus,
    conflicts,
    hintCell,
    mistakes,
    notes,
    noteMode,
    loading,
    message,
    newGame,
    startStageGame,
    currentStage,
    selectCell,
    enterNumber,
    eraseCell,
    toggleNoteMode,
    getHint,
    checkBoard,
    undo,
    resetGame,
    sameNumberCells,
    dismissMessage,
  };
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}