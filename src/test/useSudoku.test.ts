import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import {
  deepClone,
  boardToIPC,
  detectConflicts,
  isBoardComplete,
  useSudoku,
} from "../hooks/useSudoku";

// ── Mock Tauri invoke ──────────────────────────────────────────────
const mockInvoke = vi.fn();
vi.mock("@tauri-apps/api/core", () => ({
  invoke: (...args: unknown[]) => mockInvoke(...args),
}));

// ── A known valid sudoku ───────────────────────────────────────────
const SOLUTION = [
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

const PUZZLE: (number | null)[][] = [
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

function emptyBoard(): number[][] {
  return Array.from({ length: 9 }, () => Array(9).fill(0));
}

beforeEach(() => {
  mockInvoke.mockReset();
  // Default mock: generate_puzzle returns the sample
  mockInvoke.mockImplementation((cmd: string) => {
    if (cmd === "generate_puzzle") {
      return Promise.resolve({ puzzle: PUZZLE, solution: SOLUTION });
    }
    if (cmd === "get_hint") {
      return Promise.resolve({ row: 0, col: 2, num: 4 });
    }
    if (cmd === "solve_board") {
      return Promise.resolve(SOLUTION);
    }
    return Promise.reject(new Error(`Unknown command: ${cmd}`));
  });
});

afterEach(() => {
  vi.useRealTimers();
});

// ══════════════════════════════════════════════════════════════════
// Pure function tests (existing)
// ══════════════════════════════════════════════════════════════════

describe("deepClone", () => {
  it("returns a new array with same values", () => {
    const board = emptyBoard();
    board[0][0] = 5;
    board[4][4] = 3;
    const cloned = deepClone(board);
    expect(cloned).toEqual(board);
    expect(cloned).not.toBe(board);
  });
  it("deep clone is independent", () => {
    const original = emptyBoard();
    original[0][0] = 7;
    const cloned = deepClone(original);
    cloned[0][0] = 9;
    expect(original[0][0]).toBe(7);
    expect(cloned[0][0]).toBe(9);
  });
});

describe("boardToIPC", () => {
  it("converts 0 to null, keeps other numbers", () => {
    const board = emptyBoard();
    board[0][0] = 5;
    const result = boardToIPC(board);
    expect(result[0][0]).toBe(5);
    expect(result[1][2]).toBeNull();
  });
});

describe("detectConflicts", () => {
  it("returns empty for empty board", () => {
    expect(detectConflicts(emptyBoard())).toEqual([]);
  });
  it("returns empty for valid single number", () => {
    const board = emptyBoard();
    board[4][4] = 5;
    expect(detectConflicts(board)).toEqual([]);
  });
  it("detects row conflict", () => {
    const board = emptyBoard();
    board[0][0] = 5; board[0][3] = 5;
    const r = detectConflicts(board);
    expect(r).toContainEqual({ row: 0, col: 0 });
    expect(r).toContainEqual({ row: 0, col: 3 });
  });
  it("detects column conflict", () => {
    const board = emptyBoard();
    board[2][4] = 7; board[6][4] = 7;
    const r = detectConflicts(board);
    expect(r).toContainEqual({ row: 2, col: 4 });
    expect(r).toContainEqual({ row: 6, col: 4 });
  });
  it("detects 3x3 box conflict", () => {
    const board = emptyBoard();
    board[0][0] = 9; board[2][2] = 9;
    const r = detectConflicts(board);
    expect(r).toContainEqual({ row: 0, col: 0 });
    expect(r).toContainEqual({ row: 2, col: 2 });
  });
  it("does not flag same number in different boxes", () => {
    const board = emptyBoard();
    board[0][0] = 9; board[3][3] = 9;
    expect(detectConflicts(board)).toEqual([]);
  });
  it("finds multiple conflicts", () => {
    const board = emptyBoard();
    board[0][0] = 1; board[0][4] = 1; board[2][0] = 1;
    const r = detectConflicts(board);
    expect(r).toContainEqual({ row: 0, col: 0 });
    expect(r).toContainEqual({ row: 0, col: 4 });
    expect(r).toContainEqual({ row: 2, col: 0 });
  });
  it("does not flag zeroes", () => {
    const board = emptyBoard();
    board[0][0] = 0; board[0][1] = 0;
    expect(detectConflicts(board)).toEqual([]);
  });
});

describe("isBoardComplete", () => {
  it("returns false for empty board", () => {
    expect(isBoardComplete(emptyBoard())).toBe(false);
  });
  it("returns false for partially filled board", () => {
    const board = emptyBoard();
    board[0][0] = 5;
    expect(isBoardComplete(board)).toBe(false);
  });
  it("returns true for fully filled board", () => {
    const board = Array.from({ length: 9 }, () => Array(9).fill(1));
    expect(isBoardComplete(board)).toBe(true);
  });
  it("returns false when exactly one cell empty", () => {
    const board = Array.from({ length: 9 }, () => Array(9).fill(1));
    board[8][8] = 0;
    expect(isBoardComplete(board)).toBe(false);
  });
});

// ══════════════════════════════════════════════════════════════════
// useSudoku hook tests
// ══════════════════════════════════════════════════════════════════

describe("useSudoku — initial state", () => {
  it("starts with empty board, idle status, zero timer", () => {
    const { result } = renderHook(() => useSudoku());

    expect(result.current.gameStatus).toBe("idle");
    expect(result.current.board).toEqual(emptyBoard());
    expect(result.current.timer).toBe(0);
    expect(result.current.mistakes).toBe(0);
    expect(result.current.selectedCell).toBeNull();
    expect(result.current.noteMode).toBe(false);
    expect(result.current.conflicts).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.message).toBeNull();
  });
});

describe("useSudoku — newGame", () => {
  it("loads puzzle from backend and sets playing state", async () => {
    const { result } = renderHook(() => useSudoku());

    await act(async () => {
      await result.current.newGame("easy");
    });

    expect(result.current.gameStatus).toBe("playing");
    expect(result.current.difficulty).toBe("easy");
    expect(result.current.timer).toBe(0);
    expect(result.current.mistakes).toBe(0);
    expect(result.current.selectedCell).toBeNull();
    // Board should have given numbers from puzzle
    expect(result.current.board[0][0]).toBe(5); // given
    expect(result.current.board[0][2]).toBe(0); // empty
    expect(result.current.given[0][0]).toBe(true);
    expect(result.current.given[0][2]).toBe(false);
    expect(mockInvoke).toHaveBeenCalledWith("generate_puzzle", {
      difficulty: "easy",
    });
  });

  it("supports all difficulty levels", async () => {
    const { result } = renderHook(() => useSudoku());
    for (const diff of ["easy", "medium", "hard", "expert"] as const) {
      await act(async () => { await result.current.newGame(diff); });
      expect(result.current.difficulty).toBe(diff);
    }
  });

  it("resets previous state when starting a new game", async () => {
    const { result } = renderHook(() => useSudoku());

    await act(async () => { await result.current.newGame("easy"); });
    await act(async () => { result.current.selectCell(1, 2); });
    await act(async () => { result.current.enterNumber(7); });

    // Start a new game
    await act(async () => { await result.current.newGame("medium"); });

    expect(result.current.selectedCell).toBeNull();
    expect(result.current.mistakes).toBe(0);
    expect(result.current.timer).toBe(0);
    expect(result.current.notes.size).toBe(0);
  });

  it("starts a playable local puzzle when backend generation is unavailable", async () => {
    mockInvoke.mockRejectedValueOnce(new TypeError("Cannot read properties of undefined (reading 'invoke')"));
    const { result } = renderHook(() => useSudoku());

    await act(async () => { await result.current.newGame("medium"); });

    expect(result.current.gameStatus).toBe("playing");
    expect(result.current.message).toBeNull();
    expect(result.current.board.flat().filter((value) => value !== 0).length).toBeGreaterThan(0);
    expect(result.current.solution[0][2]).toBe(4);
  });
});

describe("useSudoku — selectCell", () => {
  it("selects a cell and sets selectedCell", async () => {
    const { result } = renderHook(() => useSudoku());
    await act(async () => { await result.current.newGame("easy"); });

    act(() => { result.current.selectCell(3, 5); });

    expect(result.current.selectedCell).toEqual([3, 5]);
  });

  it("highlights same numbers when selecting a cell with a value", async () => {
    const { result } = renderHook(() => useSudoku());
    await act(async () => { await result.current.newGame("easy"); });

    // Board[0][0] = 5 (given), board[0][4] = 7 (given)
    act(() => { result.current.selectCell(0, 0); }); // value 5

    // Only [0][0] has 5 on the initial board from puzzle
    expect(result.current.sameNumberCells.has("0-0")).toBe(true);
  });

  it("clears same-number highlighting when selecting an empty cell", async () => {
    const { result } = renderHook(() => useSudoku());
    await act(async () => { await result.current.newGame("easy"); });

    act(() => { result.current.selectCell(0, 2); }); // empty cell

    expect(result.current.sameNumberCells.size).toBe(0);
  });

  it("highlights all cells with the same number after user entry", async () => {
    const { result } = renderHook(() => useSudoku());
    await act(async () => { await result.current.newGame("easy"); });

    // Enter 7 at [0][2], same as given [0][4] = 7
    act(() => { result.current.selectCell(0, 2); });
    act(() => { result.current.enterNumber(7); });
    act(() => { result.current.selectCell(0, 2); }); // re-select

    expect(result.current.sameNumberCells.has("0-2")).toBe(true);
    expect(result.current.sameNumberCells.has("0-4")).toBe(true);
  });
});

describe("useSudoku — enterNumber", () => {
  it("enters a number in an empty cell", async () => {
    const { result } = renderHook(() => useSudoku());
    await act(async () => { await result.current.newGame("easy"); });

    act(() => { result.current.selectCell(0, 2); });
    act(() => { result.current.enterNumber(4); });

    expect(result.current.board[0][2]).toBe(4);
  });

  it("does nothing when no cell is selected", async () => {
    const { result } = renderHook(() => useSudoku());
    await act(async () => { await result.current.newGame("easy"); });

    act(() => { result.current.enterNumber(5); });

    expect(result.current.board[0][0]).toBe(5); // unchanged (still given)
    expect(result.current.mistakes).toBe(0);
  });

  it("does nothing on a given cell", async () => {
    const { result } = renderHook(() => useSudoku());
    await act(async () => { await result.current.newGame("easy"); });

    act(() => { result.current.selectCell(0, 0); }); // given cell
    act(() => { result.current.enterNumber(9); });

    expect(result.current.board[0][0]).toBe(5); // unchanged
  });

  it("does nothing when game is not playing", async () => {
    const { result } = renderHook(() => useSudoku());
    // gameStatus is "idle", not "playing"

    act(() => { result.current.selectCell(0, 2); });
    act(() => { result.current.enterNumber(4); });

    expect(result.current.board[0][2]).toBe(0);
  });

  it("increments mistakes on wrong number", async () => {
    const { result } = renderHook(() => useSudoku());
    await act(async () => { await result.current.newGame("easy"); });

    act(() => { result.current.selectCell(0, 2); }); // solution says 4
    act(() => { result.current.enterNumber(9); }); // wrong

    expect(result.current.mistakes).toBe(1);
  });

  it("does not increment mistakes on correct number", async () => {
    const { result } = renderHook(() => useSudoku());
    await act(async () => { await result.current.newGame("easy"); });

    act(() => { result.current.selectCell(0, 2); }); // solution says 4
    act(() => { result.current.enterNumber(4); }); // correct

    expect(result.current.mistakes).toBe(0);
  });

  it("detects conflicts after entry", async () => {
    const { result } = renderHook(() => useSudoku());
    await act(async () => { await result.current.newGame("easy"); });

    // Board[0][0] = 5 (given). Enter 5 at [0][2] → row conflict
    act(() => { result.current.selectCell(0, 2); });
    act(() => { result.current.enterNumber(5); });

    expect(result.current.conflicts.length).toBeGreaterThanOrEqual(1);
    expect(result.current.conflicts).toContainEqual({ row: 0, col: 0 });
    expect(result.current.conflicts).toContainEqual({ row: 0, col: 2 });
  });

  it("clears notes for the same cell when entering a number", async () => {
    const { result } = renderHook(() => useSudoku());
    await act(async () => { await result.current.newGame("easy"); });

    // Add a note first
    act(() => { result.current.selectCell(0, 2); });
    act(() => { result.current.toggleNoteMode(); });
    act(() => { result.current.enterNumber(7); }); // note mode: adds note

    // Now enter a number normally
    act(() => { result.current.toggleNoteMode(); }); // back to normal
    act(() => { result.current.enterNumber(4); });

    // Notes for this cell should be cleared
    expect(result.current.notes.has("note:0-2:7")).toBe(false);
    expect(result.current.board[0][2]).toBe(4);
  });

  it("triggers completion when board is fully and correctly filled", async () => {
    const { result } = renderHook(() => useSudoku());
    vi.useFakeTimers();
    await act(async () => { await result.current.newGame("easy"); });

    // Fill every empty cell with the correct solution value
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (!result.current.given[r][c]) {
          act(() => { result.current.selectCell(r, c); });
          act(() => { result.current.enterNumber(SOLUTION[r][c]); });
        }
      }
    }

    expect(result.current.gameStatus).toBe("completed");
    expect(result.current.message).toContain("完成");
  });
});

describe("useSudoku — note mode", () => {
  it("toggleNoteMode switches between off and on", async () => {
    const { result } = renderHook(() => useSudoku());
    await act(async () => { await result.current.newGame("easy"); });

    expect(result.current.noteMode).toBe(false);
    act(() => { result.current.toggleNoteMode(); });
    expect(result.current.noteMode).toBe(true);
    act(() => { result.current.toggleNoteMode(); });
    expect(result.current.noteMode).toBe(false);
  });

  it("adds a note in note mode instead of filling the cell", async () => {
    const { result } = renderHook(() => useSudoku());
    await act(async () => { await result.current.newGame("easy"); });

    act(() => { result.current.selectCell(0, 2); });
    act(() => { result.current.toggleNoteMode(); });
    act(() => { result.current.enterNumber(7); });

    // Cell should still be empty
    expect(result.current.board[0][2]).toBe(0);
    // Note should exist
    expect(result.current.notes.has("note:0-2:7")).toBe(true);
  });

  it("removes a note if it already exists (toggle)", async () => {
    const { result } = renderHook(() => useSudoku());
    await act(async () => { await result.current.newGame("easy"); });

    act(() => { result.current.selectCell(0, 2); });
    act(() => { result.current.toggleNoteMode(); });
    act(() => { result.current.enterNumber(7); }); // add
    act(() => { result.current.enterNumber(7); }); // remove

    expect(result.current.notes.has("note:0-2:7")).toBe(false);
  });

  it("stores multiple notes in the same cell", async () => {
    const { result } = renderHook(() => useSudoku());
    await act(async () => { await result.current.newGame("easy"); });

    act(() => { result.current.selectCell(0, 2); });
    act(() => { result.current.toggleNoteMode(); });
    act(() => { result.current.enterNumber(3); });
    act(() => { result.current.enterNumber(7); });
    act(() => { result.current.enterNumber(9); });

    expect(result.current.notes.has("note:0-2:3")).toBe(true);
    expect(result.current.notes.has("note:0-2:7")).toBe(true);
    expect(result.current.notes.has("note:0-2:9")).toBe(true);
  });
});

describe("useSudoku — eraseCell", () => {
  it("clears a user-entered cell", async () => {
    const { result } = renderHook(() => useSudoku());
    await act(async () => { await result.current.newGame("easy"); });

    act(() => { result.current.selectCell(0, 2); });
    act(() => { result.current.enterNumber(4); });
    expect(result.current.board[0][2]).toBe(4);

    act(() => { result.current.eraseCell(); });
    expect(result.current.board[0][2]).toBe(0);
  });

  it("does nothing on a given cell", async () => {
    const { result } = renderHook(() => useSudoku());
    await act(async () => { await result.current.newGame("easy"); });

    act(() => { result.current.selectCell(0, 0); }); // given
    act(() => { result.current.eraseCell(); });

    expect(result.current.board[0][0]).toBe(5); // unchanged
  });

  it("does nothing when no cell is selected", async () => {
    const { result } = renderHook(() => useSudoku());
    await act(async () => { await result.current.newGame("easy"); });

    act(() => { result.current.eraseCell(); });

    expect(result.current.board[0][0]).toBe(5); // everything still same
  });

  it("does nothing when game is not playing", async () => {
    const { result } = renderHook(() => useSudoku());

    act(() => { result.current.selectCell(0, 2); });
    act(() => { result.current.eraseCell(); });

    expect(result.current.board[0][2]).toBe(0);
  });

  it("removes notes for the erased cell", async () => {
    const { result } = renderHook(() => useSudoku());
    await act(async () => { await result.current.newGame("easy"); });

    act(() => { result.current.selectCell(0, 2); });
    act(() => { result.current.toggleNoteMode(); });
    act(() => { result.current.enterNumber(7); });
    act(() => { result.current.toggleNoteMode(); });
    act(() => { result.current.enterNumber(4); }); // fill the cell

    expect(result.current.notes.has("note:0-2:7")).toBe(false);
  });
});

describe("useSudoku — undo", () => {
  it("does nothing when history is empty", async () => {
    const { result } = renderHook(() => useSudoku());
    await act(async () => { await result.current.newGame("easy"); });

    const before = result.current.board.map(r => [...r]);
    act(() => { result.current.undo(); });

    expect(result.current.board).toEqual(before);
  });

  it("reverts the last move", async () => {
    const { result } = renderHook(() => useSudoku());
    await act(async () => { await result.current.newGame("easy"); });

    act(() => { result.current.selectCell(0, 2); });
    act(() => { result.current.enterNumber(4); });
    expect(result.current.board[0][2]).toBe(4);

    act(() => { result.current.undo(); });
    expect(result.current.board[0][2]).toBe(0);
  });

  it("reverts multiple steps in order", async () => {
    const { result } = renderHook(() => useSudoku());
    await act(async () => { await result.current.newGame("easy"); });

    act(() => { result.current.selectCell(0, 2); });
    act(() => { result.current.enterNumber(4); });
    act(() => { result.current.selectCell(1, 1); });
    act(() => { result.current.enterNumber(7); });
    expect(result.current.board[0][2]).toBe(4);
    expect(result.current.board[1][1]).toBe(7);

    act(() => { result.current.undo(); });
    expect(result.current.board[0][2]).toBe(4); // first move still there
    expect(result.current.board[1][1]).toBe(0); // second move reverted

    act(() => { result.current.undo(); });
    expect(result.current.board[0][2]).toBe(0); // first move reverted
  });

  it("updates same-number highlighting after undoing the selected cell", async () => {
    const { result } = renderHook(() => useSudoku());
    await act(async () => { await result.current.newGame("easy"); });

    act(() => { result.current.selectCell(0, 2); });
    act(() => { result.current.enterNumber(7); });

    expect(result.current.sameNumberCells.has("0-4")).toBe(true);

    act(() => { result.current.undo(); });

    expect(result.current.board[0][2]).toBe(0);
    expect(result.current.sameNumberCells.size).toBe(0);
  });
});

describe("useSudoku — resetGame", () => {
  it("clears user-entered cells but keeps given cells", async () => {
    const { result } = renderHook(() => useSudoku());
    await act(async () => { await result.current.newGame("easy"); });

    act(() => { result.current.selectCell(0, 2); });
    act(() => { result.current.enterNumber(4); });
    act(() => { result.current.resetGame(); });

    // Given cell unchanged
    expect(result.current.board[0][0]).toBe(5);
    // User-entered cell cleared
    expect(result.current.board[0][2]).toBe(0);
  });

  it("resets timer and restarts playing status", async () => {
    const { result } = renderHook(() => useSudoku());
    vi.useFakeTimers();
    await act(async () => { await result.current.newGame("easy"); });

    // Advance timer
    await act(async () => { vi.advanceTimersByTime(5000); });
    expect(result.current.timer).toBe(5);

    act(() => { result.current.resetGame(); });

    expect(result.current.timer).toBe(0);
    expect(result.current.gameStatus).toBe("playing");
  });

  it("clears mistakes, selection, highlighting, and note mode", async () => {
    const { result } = renderHook(() => useSudoku());
    await act(async () => { await result.current.newGame("easy"); });

    act(() => { result.current.selectCell(0, 2); });
    act(() => { result.current.enterNumber(9); });
    act(() => { result.current.selectCell(0, 0); });
    act(() => { result.current.toggleNoteMode(); });

    expect(result.current.mistakes).toBe(1);
    expect(result.current.selectedCell).toEqual([0, 0]);
    expect(result.current.sameNumberCells.size).toBeGreaterThan(0);
    expect(result.current.noteMode).toBe(true);

    act(() => { result.current.resetGame(); });

    expect(result.current.mistakes).toBe(0);
    expect(result.current.selectedCell).toBeNull();
    expect(result.current.sameNumberCells.size).toBe(0);
    expect(result.current.noteMode).toBe(false);
  });
});

describe("useSudoku — getHint", () => {
  it("calls invoke get_hint and updates hintCell", async () => {
    const { result } = renderHook(() => useSudoku());
    await act(async () => { await result.current.newGame("easy"); });

    await act(async () => { await result.current.getHint(); });

    expect(mockInvoke).toHaveBeenCalledWith("get_hint", expect.any(Object));
    expect(result.current.hintCell).toEqual([0, 2]);
  });

  it("fills the hinted cell with the correct number", async () => {
    const { result } = renderHook(() => useSudoku());
    await act(async () => { await result.current.newGame("easy"); });

    await act(async () => { await result.current.getHint(); });

    expect(result.current.board[0][2]).toBe(4);
  });

  it("does nothing when game is completed", async () => {
    const { result } = renderHook(() => useSudoku());

    await act(async () => { await result.current.getHint(); });
    // gameStatus is "idle" - getHint should be a no-op
    expect(mockInvoke).not.toHaveBeenCalledWith("get_hint", expect.any(Object));
  });

  it("uses the stored solution for hints when backend hinting is unavailable", async () => {
    const { result } = renderHook(() => useSudoku());
    await act(async () => { await result.current.newGame("easy"); });
    mockInvoke.mockRejectedValueOnce(new TypeError("Cannot read properties of undefined (reading 'invoke')"));

    await act(async () => { await result.current.getHint(); });

    expect(result.current.hintCell).toEqual([0, 2]);
    expect(result.current.board[0][2]).toBe(4);
    expect(result.current.message).toBeNull();
  });
});

describe("useSudoku — checkBoard", () => {
  it("calls invoke solve_board and reports errors", async () => {
    const { result } = renderHook(() => useSudoku());
    await act(async () => { await result.current.newGame("easy"); });

    // Enter a wrong number
    act(() => { result.current.selectCell(0, 2); });
    act(() => { result.current.enterNumber(9); });

    await act(async () => { await result.current.checkBoard(); });

    expect(mockInvoke).toHaveBeenCalledWith("solve_board", expect.any(Object));
    expect(result.current.message).toContain("错误");
  });

  it("reports all correct when no errors", async () => {
    const { result } = renderHook(() => useSudoku());
    await act(async () => { await result.current.newGame("easy"); });

    // Enter correct number
    act(() => { result.current.selectCell(0, 2); });
    act(() => { result.current.enterNumber(4); });

    await act(async () => { await result.current.checkBoard(); });

    expect(result.current.message).toContain("全部正确");
  });

  it("checks against the stored solution when backend solving is unavailable", async () => {
    const { result } = renderHook(() => useSudoku());
    await act(async () => { await result.current.newGame("easy"); });
    mockInvoke.mockRejectedValueOnce(new TypeError("Cannot read properties of undefined (reading 'invoke')"));

    act(() => { result.current.selectCell(0, 2); });
    act(() => { result.current.enterNumber(9); });
    await act(async () => { await result.current.checkBoard(); });

    expect(result.current.message).toContain("错误");
    expect(result.current.conflicts).toContainEqual({ row: 0, col: 2 });
  });
});

describe("useSudoku — dismissMessage", () => {
  it("clears the message", async () => {
    const { result } = renderHook(() => useSudoku());
    await act(async () => { await result.current.newGame("easy"); });

    // Trigger a message
    act(() => { result.current.selectCell(0, 2); });
    act(() => { result.current.enterNumber(9); });
    await act(async () => { await result.current.checkBoard(); });
    expect(result.current.message).toBeTruthy();

    act(() => { result.current.dismissMessage(); });
    expect(result.current.message).toBeNull();
  });
});

describe("useSudoku — timer", () => {
  it("starts counting when game starts", async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useSudoku());
    await act(async () => { await result.current.newGame("easy"); });

    expect(result.current.timer).toBe(0);
    await act(async () => { vi.advanceTimersByTime(3000); });
    expect(result.current.timer).toBe(3);
  });

  it("stops counting when game is completed", async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useSudoku());
    await act(async () => { await result.current.newGame("easy"); });

    await act(async () => { vi.advanceTimersByTime(5000); });
    expect(result.current.timer).toBe(5);

    // Complete the board
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (!result.current.given[r][c]) {
          act(() => { result.current.selectCell(r, c); });
          act(() => { result.current.enterNumber(SOLUTION[r][c]); });
        }
      }
    }
    expect(result.current.gameStatus).toBe("completed");

    // Timer should not advance
    const timerAtCompletion = result.current.timer;
    await act(async () => { vi.advanceTimersByTime(3000); });
    expect(result.current.timer).toBe(timerAtCompletion);
  });
});
