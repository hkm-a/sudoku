import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// ── Mock Tauri invoke ONLY — NOT the useSudoku hook ──────────────
const mockInvoke = vi.fn();
vi.mock("@tauri-apps/api/core", () => ({
  invoke: (...args: unknown[]) => mockInvoke(...args),
}));

// ── Known valid sudoku (matches useSudoku.test.ts) ───────────────
const SOLUTION: number[][] = [
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

function cellIndex(r: number, c: number) {
  return r * 9 + c;
}

async function waitForBoard() {
  await waitFor(() => {
    expect(document.querySelectorAll(".cell").length).toBe(81);
  });
}

function getCell(r: number, c: number): HTMLElement {
  const cells = document.querySelectorAll(".cell");
  return cells[cellIndex(r, c)] as HTMLElement;
}

/** Get a num-btn by its 1-indexed position (1-9) */
function getNumBtn(n: number): HTMLElement {
  const btn = document.querySelector<HTMLElement>(
    `.num-pad-grid .num-btn:nth-child(${n})`
  );
  if (!btn) throw new Error(`num-btn ${n} not found`);
  return btn;
}

beforeEach(() => {
  mockInvoke.mockReset();
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

// ══════════════════════════════════════════════════════════════════
// Integration Tests: App + real useSudoku + Board + Controls
// ══════════════════════════════════════════════════════════════════

describe("App integration — new game lifecycle", () => {
  it("auto-starts medium game on mount and renders puzzle", async () => {
    const { default: App } = await import("../App");
    render(<App />);
    await waitForBoard();

    expect(getCell(0, 0).textContent).toBe("5");
    expect(getCell(0, 0).classList.contains("cell-given")).toBe(true);
    expect(getCell(0, 1).textContent).toBe("3");

    expect(getCell(0, 2).textContent?.trim()).toBe("");
    expect(getCell(0, 2).classList.contains("cell-given")).toBe(false);

    const givenCount = PUZZLE.flat().filter((v) => v !== null).length;
    expect(screen.getByText(`提示 ${givenCount}`)).toBeTruthy();
  });

  it("shows stage mode bar and can start a new stage via replay", async () => {
    const { default: App } = await import("../App");
    render(<App />);
    await waitForBoard();

    // Stage bar should show current stage info
    expect(screen.getByText("第 1 关")).toBeTruthy();

    // Click 新游戏 to restart current stage
    await userEvent.setup().click(screen.getByText("新游戏"));
    await waitForBoard();
    // Should have called generate_puzzle again
    expect(mockInvoke).toHaveBeenLastCalledWith("generate_puzzle", {
      difficulty: "easy",
    });
  });

  it("resets board when clicking 新游戏", async () => {
    const { default: App } = await import("../App");
    render(<App />);
    await waitForBoard();

    const user = userEvent.setup();
    await user.click(getCell(0, 2));
    await user.keyboard("4");
    expect(getCell(0, 2).textContent).toBe("4");

    await user.click(screen.getByText("新游戏"));
    await waitForBoard();
    expect(getCell(0, 2).textContent?.trim()).toBe("");
  });
});

describe("App integration — keyboard input", () => {
  it("click cell then type number enters value on board", async () => {
    const { default: App } = await import("../App");
    render(<App />);
    await waitForBoard();

    const user = userEvent.setup();
    await user.click(getCell(0, 2));
    await user.keyboard("4");

    expect(getCell(0, 2).textContent).toBe("4");
    expect(getCell(0, 2).classList.contains("cell-user")).toBe(true);
    expect(getCell(0, 2).classList.contains("cell-selected")).toBe(true);
  });

  it("entering wrong number increments mistake badge", async () => {
    const { default: App } = await import("../App");
    render(<App />);
    await waitForBoard();

    const user = userEvent.setup();
    await user.click(getCell(0, 2));
    await user.keyboard("9"); // wrong — should be 4

    await waitFor(() => {
      expect(document.querySelector(".mistakes")?.textContent).toBe("1");
    });
  });

  it("conflict highlighting for row conflict", async () => {
    const { default: App } = await import("../App");
    render(<App />);
    await waitForBoard();

    const user = userEvent.setup();
    await user.click(getCell(0, 3)); // empty, same row as (0,0)=5
    await user.keyboard("5");

    await waitFor(() => {
      expect(getCell(0, 0).classList.contains("cell-conflict")).toBe(true);
      expect(getCell(0, 3).classList.contains("cell-conflict")).toBe(true);
    });
  });

  it("column conflict detection", async () => {
    const { default: App } = await import("../App");
    render(<App />);
    await waitForBoard();

    // (0,4) = 7 (given). (2,4) empty. Enter 7 → column conflict.
    const user = userEvent.setup();
    await user.click(getCell(2, 4));
    await user.keyboard("7");

    await waitFor(() => {
      expect(getCell(0, 4).classList.contains("cell-conflict")).toBe(true);
      expect(getCell(2, 4).classList.contains("cell-conflict")).toBe(true);
    });
  });

  it("box conflict detection", async () => {
    const { default: App } = await import("../App");
    render(<App />);
    await waitForBoard();

    // (0,0) = 5 in top-left box. (1,1) empty in same box. Enter 5 → box conflict.
    const user = userEvent.setup();
    await user.click(getCell(1, 1));
    await user.keyboard("5");

    await waitFor(() => {
      expect(getCell(0, 0).classList.contains("cell-conflict")).toBe(true);
      expect(getCell(1, 1).classList.contains("cell-conflict")).toBe(true);
    });
  });

  it("arrow keys move selection and clamp at edges", async () => {
    const { default: App } = await import("../App");
    render(<App />);
    await waitForBoard();

    const user = userEvent.setup();
    await user.click(getCell(0, 2));
    expect(getCell(0, 2).classList.contains("cell-selected")).toBe(true);

    await user.keyboard("{ArrowDown}");
    expect(getCell(1, 2).classList.contains("cell-selected")).toBe(true);

    await user.keyboard("{ArrowRight}");
    expect(getCell(1, 3).classList.contains("cell-selected")).toBe(true);

    await user.keyboard("{ArrowUp}");
    expect(getCell(0, 3).classList.contains("cell-selected")).toBe(true);

    await user.keyboard("{ArrowLeft}");
    expect(getCell(0, 2).classList.contains("cell-selected")).toBe(true);

    // Clamp at top-left
    await user.click(getCell(0, 0));
    await user.keyboard("{ArrowUp}");
    expect(getCell(0, 0).classList.contains("cell-selected")).toBe(true);
    await user.keyboard("{ArrowLeft}");
    expect(getCell(0, 0).classList.contains("cell-selected")).toBe(true);
  });

  it("clamp at bottom-right edge", async () => {
    const { default: App } = await import("../App");
    render(<App />);
    await waitForBoard();

    const user = userEvent.setup();
    await user.click(getCell(8, 8));

    await user.keyboard("{ArrowDown}");
    expect(getCell(8, 8).classList.contains("cell-selected")).toBe(true);

    await user.keyboard("{ArrowRight}");
    expect(getCell(8, 8).classList.contains("cell-selected")).toBe(true);
  });

  it("Backspace and Delete erase user-entered number", async () => {
    const { default: App } = await import("../App");
    render(<App />);
    await waitForBoard();

    const user = userEvent.setup();
    await user.click(getCell(0, 2));
    await user.keyboard("4");
    expect(getCell(0, 2).textContent).toBe("4");

    await user.keyboard("{Backspace}");
    expect(getCell(0, 2).textContent?.trim()).toBe("");

    await user.keyboard("7");
    expect(getCell(0, 2).textContent).toBe("7");
    await user.keyboard("{Delete}");
    expect(getCell(0, 2).textContent?.trim()).toBe("");
  });

  it("Ctrl+Z undoes the last move", async () => {
    const { default: App } = await import("../App");
    render(<App />);
    await waitForBoard();

    const user = userEvent.setup();
    await user.click(getCell(0, 2));
    await user.keyboard("4");
    expect(getCell(0, 2).textContent).toBe("4");

    await user.keyboard("{Control>}z{/Control}");
    expect(getCell(0, 2).textContent?.trim()).toBe("");
  });
});

describe("App integration — Controls interaction", () => {
  it("number pad button enters value on board", async () => {
    const { default: App } = await import("../App");
    render(<App />);
    await waitForBoard();

    const user = userEvent.setup();
    await user.click(getCell(0, 2));
    await user.click(getNumBtn(4));

    expect(getCell(0, 2).textContent).toBe("4");
  });

  it("undo button reverts last move", async () => {
    const { default: App } = await import("../App");
    render(<App />);
    await waitForBoard();

    const user = userEvent.setup();
    await user.click(getCell(0, 2));
    await user.keyboard("4");
    expect(getCell(0, 2).textContent).toBe("4");

    await user.click(screen.getByText("撤销"));
    expect(getCell(0, 2).textContent?.trim()).toBe("");
  });

  it("hint button fills an empty cell and highlights it", async () => {
    const { default: App } = await import("../App");
    render(<App />);
    await waitForBoard();

    await userEvent.setup().click(screen.getByText("提示"));

    await waitFor(() => {
      expect(getCell(0, 2).textContent).toBe("4");
    });
    expect(getCell(0, 2).classList.contains("cell-hinted")).toBe(true);
  });

  it("reset button clears user entries but keeps given cells", async () => {
    const { default: App } = await import("../App");
    render(<App />);
    await waitForBoard();

    const user = userEvent.setup();
    await user.click(getCell(0, 2));
    await user.keyboard("4");
    await user.click(getCell(1, 1));
    await user.keyboard("7");

    expect(getCell(0, 2).textContent).toBe("4");
    expect(getCell(1, 1).textContent).toBe("7");

    await user.click(screen.getByText("重置"));

    await waitFor(() => {
      expect(getCell(0, 2).textContent?.trim()).toBe("");
      expect(getCell(1, 1).textContent?.trim()).toBe("");
    });
    expect(getCell(0, 0).textContent).toBe("5");
  });

  it("check board shows correct toast when solved correctly", async () => {
    const { default: App } = await import("../App");
    render(<App />);
    await waitForBoard();

    // Fill every empty cell with correct solution value
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (PUZZLE[r][c] === null) {
          const user = userEvent.setup();
          await user.click(getCell(r, c));
          await user.keyboard(String(SOLUTION[r][c]));
        }
      }
    }

    await userEvent.setup().click(screen.getByText("检查"));

    await waitFor(() => {
      expect(document.querySelector(".toast")).toBeTruthy();
      expect(screen.getByText(/全部正确/)).toBeTruthy();
    });
  }, 30000);
});

describe("App integration — note mode", () => {
  it("toggle + keyboard number adds note to cell", async () => {
    const { default: App } = await import("../App");
    render(<App />);
    await waitForBoard();

    const user = userEvent.setup();
    await user.click(getCell(0, 2));

    // Click the toggle-track button (has aria-label)
    const toggle = screen.getByRole("button", { name: "切换笔记模式" });
    await user.click(toggle);
    // Verify note mode is now active
    expect(toggle.classList.contains("active")).toBe(true);

    await user.keyboard("7");

    await waitFor(() => {
      expect(getCell(0, 2).querySelector(".cell-value")).toBeNull();
      expect(getCell(0, 2).querySelector(".cell-notes")).toBeTruthy();
    });
  });

  it("toggle + number pad click adds note to cell", async () => {
    const { default: App } = await import("../App");
    render(<App />);
    await waitForBoard();

    const user = userEvent.setup();
    await user.click(getCell(0, 2));
    const toggle = screen.getByRole("button", { name: "切换笔记模式" });
    await user.click(toggle);
    expect(toggle.classList.contains("active")).toBe(true);

    await user.click(getNumBtn(7));

    await waitFor(() => {
      expect(getCell(0, 2).querySelector(".cell-notes")).toBeTruthy();
    });
  });
});

describe("App integration — game completion", () => {
  it("correctly filling all cells marks game as completed", async () => {
    const { default: App } = await import("../App");
    render(<App />);
    await waitForBoard();

    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (PUZZLE[r][c] === null) {
          const user = userEvent.setup();
          await user.click(getCell(r, c));
          await user.keyboard(String(SOLUTION[r][c]));
        }
      }
    }

    await waitFor(() => {
      expect(screen.getByText("已完成")).toBeTruthy();
    });
  }, 30000);
});

describe("App integration — same-number highlighting", () => {
  it("selecting a cell with a value highlights other same-number cells", async () => {
    const { default: App } = await import("../App");
    render(<App />);
    await waitForBoard();

    // (0,0) = 5. (1,5) also = 5 (given). Click (0,0), (1,5) should be highlighted.
    await userEvent.setup().click(getCell(0, 0));

    await waitFor(() => {
      // (0,0) is selected so NOT highlighted (cell-highlighted removed when selected)
      expect(getCell(1, 5).classList.contains("cell-highlighted")).toBe(true);
    });
    // Cell with different value not highlighted
    expect(getCell(0, 1).classList.contains("cell-highlighted")).toBe(false);
  });

  it("selecting empty cell clears highlighting", async () => {
    const { default: App } = await import("../App");
    render(<App />);
    await waitForBoard();

    const user = userEvent.setup();
    await user.click(getCell(0, 0)); // value 5
    await waitFor(() => {
      expect(getCell(1, 5).classList.contains("cell-highlighted")).toBe(true);
    });

    // Select empty cell → highlighting cleared
    await user.click(getCell(0, 2));
    await waitFor(() => {
      expect(getCell(1, 5).classList.contains("cell-highlighted")).toBe(false);
    });
  });
});

describe("App integration — loading state", () => {
  it("shows loading spinner during async operations", async () => {
    mockInvoke.mockImplementation((cmd: string) => {
      if (cmd === "generate_puzzle") {
        return new Promise((resolve) => {
          setTimeout(() => resolve({ puzzle: PUZZLE, solution: SOLUTION }), 200);
        });
      }
      return Promise.reject(new Error(`Unknown: ${cmd}`));
    });

    const { default: App } = await import("../App");
    render(<App />);

    expect(document.querySelector(".spinner")).toBeTruthy();

    await waitFor(() => {
      expect(document.querySelector(".spinner")).toBeNull();
    });
  });
});
