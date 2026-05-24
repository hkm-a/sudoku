import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { Board } from "../components/Board";

function emptyBoard(): number[][] {
  return Array.from({ length: 9 }, () => Array(9).fill(0));
}

function emptyGiven(): boolean[][] {
  return Array.from({ length: 9 }, () => Array(9).fill(false));
}

describe("Board", () => {
  it("renders 81 cells", () => {
    const board = emptyBoard();
    board[0][0] = 5;
    board[4][4] = 3;

    render(
      <Board
        board={board}
        given={emptyGiven()}
        selectedCell={null}
        conflicts={[]}
        hintCell={null}
        sameNumberCells={new Set()}
        notes={new Set()}
        onSelectCell={() => {}}
      />
    );

    const cells = document.querySelectorAll(".cell");
    expect(cells.length).toBe(81);
  });

  it("renders given cells with cell-given class", () => {
    const board = emptyBoard();
    board[0][0] = 5;
    const given = emptyGiven();
    given[0][0] = true;

    render(
      <Board
        board={board}
        given={given}
        selectedCell={null}
        conflicts={[]}
        hintCell={null}
        sameNumberCells={new Set()}
        notes={new Set()}
        onSelectCell={() => {}}
      />
    );

    const cells = document.querySelectorAll(".cell");
    expect(cells[0].classList.contains("cell-given")).toBe(true);
  });

  it("renders user-entered cells with cell-user class", () => {
    const board = emptyBoard();
    board[0][0] = 5;
    const given = emptyGiven();
    // given[0][0] stays false → user-entered

    render(
      <Board
        board={board}
        given={given}
        selectedCell={null}
        conflicts={[]}
        hintCell={null}
        sameNumberCells={new Set()}
        notes={new Set()}
        onSelectCell={() => {}}
      />
    );

    const cells = document.querySelectorAll(".cell");
    expect(cells[0].classList.contains("cell-user")).toBe(true);
  });

  it("marks selected cell", () => {
    const board = emptyBoard();

    render(
      <Board
        board={board}
        given={emptyGiven()}
        selectedCell={[3, 5]}
        conflicts={[]}
        hintCell={null}
        sameNumberCells={new Set()}
        notes={new Set()}
        onSelectCell={() => {}}
      />
    );

    const cells = document.querySelectorAll(".cell");
    const idx = 3 * 9 + 5;
    expect(cells[idx].classList.contains("cell-selected")).toBe(true);
  });

  it("marks conflict cells", () => {
    const board = emptyBoard();

    render(
      <Board
        board={board}
        given={emptyGiven()}
        selectedCell={null}
        conflicts={[{ row: 1, col: 2 }, { row: 5, col: 6 }]}
        hintCell={null}
        sameNumberCells={new Set()}
        notes={new Set()}
        onSelectCell={() => {}}
      />
    );

    const cells = document.querySelectorAll(".cell");
    expect(cells[1 * 9 + 2].classList.contains("cell-conflict")).toBe(true);
    expect(cells[5 * 9 + 6].classList.contains("cell-conflict")).toBe(true);
    expect(cells[0].classList.contains("cell-conflict")).toBe(false);
  });

  it("marks hinted cell", () => {
    const board = emptyBoard();

    render(
      <Board
        board={board}
        given={emptyGiven()}
        selectedCell={null}
        conflicts={[]}
        hintCell={[2, 7]}
        sameNumberCells={new Set()}
        notes={new Set()}
        onSelectCell={() => {}}
      />
    );

    const cells = document.querySelectorAll(".cell");
    expect(cells[2 * 9 + 7].classList.contains("cell-hinted")).toBe(true);
  });

  it("marks same-number highlighted cells", () => {
    const board = emptyBoard();
    board[0][0] = 5;
    board[3][3] = 5;

    render(
      <Board
        board={board}
        given={emptyGiven()}
        selectedCell={null}
        conflicts={[]}
        hintCell={null}
        sameNumberCells={new Set(["0-0", "3-3"])}
        notes={new Set()}
        onSelectCell={() => {}}
      />
    );

    const cells = document.querySelectorAll(".cell");
    expect(cells[0].classList.contains("cell-highlighted")).toBe(true);
    expect(cells[3 * 9 + 3].classList.contains("cell-highlighted")).toBe(true);
  });

  it("renders notes for a cell", () => {
    const board = emptyBoard();
    const given = emptyGiven();
    const notes = new Set(["note:1-2:3", "note:1-2:7", "note:1-2:9"]);

    render(
      <Board
        board={board}
        given={given}
        selectedCell={null}
        conflicts={[]}
        hintCell={null}
        sameNumberCells={new Set()}
        notes={notes}
        onSelectCell={() => {}}
      />
    );

    const cells = document.querySelectorAll(".cell");
    const target = cells[1 * 9 + 2];
    expect(target.querySelector(".cell-notes")).toBeTruthy();
    expect(target.querySelectorAll(".cell-note").length).toBe(9);
  });

  it("calls onSelectCell when clicking a cell", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    render(
      <Board
        board={emptyBoard()}
        given={emptyGiven()}
        selectedCell={null}
        conflicts={[]}
        hintCell={null}
        sameNumberCells={new Set()}
        notes={new Set()}
        onSelectCell={onSelect}
      />
    );

    const cells = document.querySelectorAll(".cell");
    await user.click(cells[4 * 9 + 6]);
    expect(onSelect).toHaveBeenCalledWith(4, 6);
  });

  it("displays number value in cells", () => {
    const board = emptyBoard();
    board[0][0] = 7;
    board[8][8] = 3;

    render(
      <Board
        board={board}
        given={emptyGiven()}
        selectedCell={null}
        conflicts={[]}
        hintCell={null}
        sameNumberCells={new Set()}
        notes={new Set()}
        onSelectCell={() => {}}
      />
    );

    expect(screen.getByText("7")).toBeTruthy();
    expect(screen.getByText("3")).toBeTruthy();
  });
});
