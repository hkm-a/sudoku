import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Difficulty } from "../types";

// ── Mutable mock state ─────────────────────────────────────────────
const mockState = {
  board: Array.from({ length: 9 }, () => Array(9).fill(0)),
  solution: Array.from({ length: 9 }, () => Array(9).fill(0)),
  given: Array.from({ length: 9 }, () => Array(9).fill(false)),
  selectedCell: [4, 4] as [number, number] | null,
  difficulty: "medium" as Difficulty,
  timer: 42,
  gameStatus: "playing" as "idle" | "playing" | "paused" | "completed",
  conflicts: [] as { row: number; col: number }[],
  hintCell: null as [number, number] | null,
  mistakes: 2,
  notes: new Set<string>(),
  noteMode: false,
  loading: false,
  message: null as string | null,
  sameNumberCells: new Set<string>(),
};

const mockFns = {
  newGame: vi.fn(),
  selectCell: vi.fn(),
  enterNumber: vi.fn(),
  eraseCell: vi.fn(),
  toggleNoteMode: vi.fn(),
  undo: vi.fn(),
  getHint: vi.fn(),
  checkBoard: vi.fn(),
  resetGame: vi.fn(),
  dismissMessage: vi.fn(),
};

vi.mock("../hooks/useSudoku", () => ({
  useSudoku: () => ({
    board: mockState.board,
    solution: mockState.solution,
    given: mockState.given,
    selectedCell: mockState.selectedCell,
    difficulty: mockState.difficulty,
    timer: mockState.timer,
    gameStatus: mockState.gameStatus,
    conflicts: mockState.conflicts,
    hintCell: mockState.hintCell,
    mistakes: mockState.mistakes,
    notes: mockState.notes,
    noteMode: mockState.noteMode,
    loading: mockState.loading,
    message: mockState.message,
    sameNumberCells: mockState.sameNumberCells,
    newGame: mockFns.newGame,
    selectCell: mockFns.selectCell,
    enterNumber: mockFns.enterNumber,
    eraseCell: mockFns.eraseCell,
    toggleNoteMode: mockFns.toggleNoteMode,
    getHint: mockFns.getHint,
    checkBoard: mockFns.checkBoard,
    undo: mockFns.undo,
    resetGame: mockFns.resetGame,
    dismissMessage: mockFns.dismissMessage,
  }),
  deepClone: vi.fn(),
  boardToIPC: vi.fn(),
  detectConflicts: vi.fn(),
  isBoardComplete: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
  // Reset mock state to defaults
  mockState.board = Array.from({ length: 9 }, () => Array(9).fill(0));
  mockState.solution = Array.from({ length: 9 }, () => Array(9).fill(0));
  mockState.given = Array.from({ length: 9 }, () => Array(9).fill(false));
  mockState.selectedCell = [4, 4];
  mockState.difficulty = "medium";
  mockState.timer = 42;
  mockState.gameStatus = "playing";
  mockState.conflicts = [];
  mockState.hintCell = null;
  mockState.mistakes = 2;
  mockState.notes = new Set();
  mockState.noteMode = false;
  mockState.loading = false;
  mockState.message = null;
  mockState.sameNumberCells = new Set();
});

// ══════════════════════════════════════════════════════════════════
// Keyboard shortcut tests
// ══════════════════════════════════════════════════════════════════

describe("App — keyboard: number input", () => {
  it("pressing key 5 calls enterNumber(5)", async () => {
    const { default: App } = await import("../App");
    render(<App />);
    const user = userEvent.setup();
    await user.keyboard("5");
    expect(mockFns.enterNumber).toHaveBeenCalledWith(5);
  });

  it("pressing 1-9 all call enterNumber with correct values", async () => {
    const { default: App } = await import("../App");
    render(<App />);
    const user = userEvent.setup();
    for (let i = 1; i <= 9; i++) {
      await user.keyboard(String(i));
      expect(mockFns.enterNumber).toHaveBeenLastCalledWith(i);
    }
    expect(mockFns.enterNumber).toHaveBeenCalledTimes(9);
  });
});

describe("App — keyboard: erase", () => {
  it("Backspace calls eraseCell", async () => {
    const { default: App } = await import("../App");
    render(<App />);
    const user = userEvent.setup();
    await user.keyboard("{Backspace}");
    expect(mockFns.eraseCell).toHaveBeenCalledOnce();
  });

  it("Delete calls eraseCell", async () => {
    const { default: App } = await import("../App");
    render(<App />);
    const user = userEvent.setup();
    await user.keyboard("{Delete}");
    expect(mockFns.eraseCell).toHaveBeenCalledOnce();
  });
});

describe("App — keyboard: note mode", () => {
  it("pressing N toggles note mode", async () => {
    const { default: App } = await import("../App");
    render(<App />);
    const user = userEvent.setup();
    await user.keyboard("n");
    expect(mockFns.toggleNoteMode).toHaveBeenCalledOnce();
  });

  it("uppercase N also toggles note mode", async () => {
    const { default: App } = await import("../App");
    render(<App />);
    const user = userEvent.setup();
    await user.keyboard("N");
    expect(mockFns.toggleNoteMode).toHaveBeenCalledOnce();
  });
});

describe("App — keyboard: undo", () => {
  it("Ctrl+Z calls undo", async () => {
    const { default: App } = await import("../App");
    render(<App />);
    const user = userEvent.setup();
    await user.keyboard("{Control>}z{/Control}");
    expect(mockFns.undo).toHaveBeenCalledOnce();
  });

  it("Meta+Cmd+Z calls undo", async () => {
    const { default: App } = await import("../App");
    render(<App />);
    const user = userEvent.setup();
    await user.keyboard("{Meta>}z{/Meta}");
    expect(mockFns.undo).toHaveBeenCalledOnce();
  });
});

describe("App — keyboard: arrow navigation", () => {
  it("ArrowDown moves selection to [5,4]", async () => {
    const { default: App } = await import("../App");
    render(<App />);
    const user = userEvent.setup();
    await user.keyboard("{ArrowDown}");
    expect(mockFns.selectCell).toHaveBeenCalledWith(5, 4);
  });

  it("ArrowUp moves selection to [3,4]", async () => {
    const { default: App } = await import("../App");
    render(<App />);
    const user = userEvent.setup();
    await user.keyboard("{ArrowUp}");
    expect(mockFns.selectCell).toHaveBeenCalledWith(3, 4);
  });

  it("ArrowRight moves selection to [4,5]", async () => {
    const { default: App } = await import("../App");
    render(<App />);
    const user = userEvent.setup();
    await user.keyboard("{ArrowRight}");
    expect(mockFns.selectCell).toHaveBeenCalledWith(4, 5);
  });

  it("ArrowLeft moves selection to [4,3]", async () => {
    const { default: App } = await import("../App");
    render(<App />);
    const user = userEvent.setup();
    await user.keyboard("{ArrowLeft}");
    expect(mockFns.selectCell).toHaveBeenCalledWith(4, 3);
  });
});

describe("App — keyboard: arrow clamping at edges", () => {
  it("ArrowUp from row 0 stays at row 0", async () => {
    mockState.selectedCell = [0, 4];
    const { default: App } = await import("../App");
    render(<App />);
    const user = userEvent.setup();
    await user.keyboard("{ArrowUp}");
    expect(mockFns.selectCell).toHaveBeenCalledWith(0, 4);
  });

  it("ArrowDown from row 8 stays at row 8", async () => {
    mockState.selectedCell = [8, 4];
    const { default: App } = await import("../App");
    render(<App />);
    const user = userEvent.setup();
    await user.keyboard("{ArrowDown}");
    expect(mockFns.selectCell).toHaveBeenCalledWith(8, 4);
  });

  it("ArrowLeft from col 0 stays at col 0", async () => {
    mockState.selectedCell = [4, 0];
    const { default: App } = await import("../App");
    render(<App />);
    const user = userEvent.setup();
    await user.keyboard("{ArrowLeft}");
    expect(mockFns.selectCell).toHaveBeenCalledWith(4, 0);
  });

  it("ArrowRight from col 8 stays at col 8", async () => {
    mockState.selectedCell = [4, 8];
    const { default: App } = await import("../App");
    render(<App />);
    const user = userEvent.setup();
    await user.keyboard("{ArrowRight}");
    expect(mockFns.selectCell).toHaveBeenCalledWith(4, 8);
  });

  it("no arrow movement when no cell selected", async () => {
    mockState.selectedCell = null;
    const { default: App } = await import("../App");
    render(<App />);
    const user = userEvent.setup();
    await user.keyboard("{ArrowDown}");
    expect(mockFns.selectCell).not.toHaveBeenCalled();
  });
});

// ══════════════════════════════════════════════════════════════════
// Rendering tests
// ══════════════════════════════════════════════════════════════════

describe("App — rendering", () => {
  it("renders title 数独", async () => {
    const { default: App } = await import("../App");
    render(<App />);
    expect(screen.getByText("数")).toBeTruthy();
    expect(screen.getByText("独")).toBeTruthy();
  });

  it("renders timer in MM:SS format", async () => {
    const { default: App } = await import("../App");
    render(<App />);
    expect(screen.getByText("00:42")).toBeTruthy();
  });

  it("shows playing status as 进行中", async () => {
    const { default: App } = await import("../App");
    render(<App />);
    expect(screen.getByText("进行中")).toBeTruthy();
  });

  it("shows completed status as 已完成", async () => {
    mockState.gameStatus = "completed";
    const { default: App } = await import("../App");
    render(<App />);
    expect(screen.getByText("已完成")).toBeTruthy();
  });

  it("renders 81 cells on the board", async () => {
    const { default: App } = await import("../App");
    render(<App />);
    expect(document.querySelectorAll(".cell").length).toBe(81);
  });

  it("shows mistake count when playing", async () => {
    const { default: App } = await import("../App");
    render(<App />);
    const badge = document.querySelector(".stat-badge-errors");
    expect(badge).toBeTruthy();
    expect(badge!.querySelector(".mistakes")?.textContent).toBe("2");
  });

  it("hides mistake badge when idle", async () => {
    mockState.gameStatus = "idle";
    const { default: App } = await import("../App");
    render(<App />);
    expect(document.querySelector(".stat-badge-errors")).toBeNull();
  });

  it("shows loading spinner when loading", async () => {
    mockState.loading = true;
    const { default: App } = await import("../App");
    render(<App />);
    expect(document.querySelector(".spinner")).toBeTruthy();
  });

  it("hides loading spinner when not loading", async () => {
    const { default: App } = await import("../App");
    render(<App />);
    expect(document.querySelector(".spinner")).toBeNull();
  });
});

describe("App — message toast", () => {
  it("renders toast when message is set", async () => {
    mockState.message = "✓ 全部正确！";
    const { default: App } = await import("../App");
    render(<App />);
    expect(screen.getByText("✓ 全部正确！")).toBeTruthy();
    expect(document.querySelector(".toast")).toBeTruthy();
  });

  it("does not render toast when message is null", async () => {
    const { default: App } = await import("../App");
    render(<App />);
    expect(document.querySelector(".toast")).toBeNull();
  });

  it("clicking toast calls dismissMessage", async () => {
    mockState.message = "测试消息";
    const { default: App } = await import("../App");
    render(<App />);
    const toast = document.querySelector(".toast")!;
    const user = userEvent.setup();
    await user.click(toast);
    expect(mockFns.dismissMessage).toHaveBeenCalledOnce();
  });
});

// ══════════════════════════════════════════════════════════════════
// Event dispatch from Controls (number pad / erase)
// ══════════════════════════════════════════════════════════════════

describe("App — custom events from Controls", () => {
  it("enter-number event calls enterNumber", async () => {
    const { default: App } = await import("../App");
    render(<App />);
    window.dispatchEvent(new CustomEvent("enter-number", { detail: 5 }));
    expect(mockFns.enterNumber).toHaveBeenCalledWith(5);
  });

  it("erase event calls eraseCell", async () => {
    const { default: App } = await import("../App");
    render(<App />);
    window.dispatchEvent(new CustomEvent("erase"));
    expect(mockFns.eraseCell).toHaveBeenCalledOnce();
  });
});
