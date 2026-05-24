import { useState, useEffect, useCallback, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { Difficulty, Conflict } from "../types";

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

function deepClone(board: number[][]): number[][] {
  return board.map((row) => [...row]);
}

function detectConflicts(board: number[][]): Conflict[] {
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

function isBoardComplete(board: number[][]): boolean {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (board[r][c] === 0) return false;
    }
  }
  return true;
}

function boardToIPC(board: number[][]): (number | null)[][] {
  return board.map((row) => row.map((v) => (v === 0 ? null : v)));
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

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hintTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      const result = await invoke<{ puzzle: (number | null)[][]; solution: number[][] }>(
        "generate_puzzle",
        { difficulty: diff }
      );
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

  const selectCell = useCallback(
    (row: number, col: number) => {
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

      if (noteMode) {
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

      // Check conflicts
      const newConflicts = detectConflicts(newBoard);
      setConflicts(newConflicts);

      // Check if correct
      if (num !== solution[row][col]) {
        setMistakes((m) => m + 1);
      }

      // Check completion
      if (newConflicts.length === 0 && isBoardComplete(newBoard)) {
        setGameStatus("completed");
        setMessage(`🎉 完成！用时 ${formatTime(timer)}`);
      }
    },
    [selectedCell, gameStatus, given, noteMode, board, solution, timer]
  );

  const eraseCell = useCallback(() => {
    if (!selectedCell || gameStatus !== "playing") return;
    const [row, col] = selectedCell;
    if (given[row][col]) return;

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
    setNoteMode((prev) => !prev);
  }, []);

  const getHint = useCallback(async () => {
    if (gameStatus !== "playing") return;
    setLoading(true);
    try {
      const result = await invoke<{ row: number; col: number; num: number }>("get_hint", {
        board: boardToIPC(board),
        solution,
      });
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
    if (gameStatus !== "playing") return;
    setLoading(true);
    try {
      const result = await invoke<number[][]>("solve_board", {
        board: boardToIPC(board),
      });
      // Highlight all cells that differ from solution
      const errs: Conflict[] = [];
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          if (!given[r][c] && board[r][c] !== 0 && board[r][c] !== result[r][c]) {
            errs.push({ row: r, col: c });
          }
        }
      }
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

  const undo = useCallback(() => {
    if (history.length === 0) return;
    setHistory((prev) => {
      const next = [...prev];
      const prevBoard = next.pop()!;
      setBoard(prevBoard);
      setConflicts(detectConflicts(prevBoard));
      return next;
    });
  }, [history]);

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
    setHintCell(null);
    setNotes(new Set());
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