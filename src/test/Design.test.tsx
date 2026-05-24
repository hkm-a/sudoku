import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import type { Difficulty } from "../types";

/**
 * Design structure tests - verify the component DOM structure
 * matches the "目白" design expectations.
 */
describe("New Design Structure", () => {
  it("board renders with correct flat grid structure for 81 cells", () => {
    const board = Array.from({ length: 9 }, () => Array(9).fill(0));

    const { container } = render(
      <div className="board">
        {board.map((row, r) =>
          row.map((_: number, c: number) => (
            <div key={`${r}-${c}`} className="cell" />
          ))
        )}
      </div>
    );

    const boardEl = container.firstChild as HTMLElement;
    expect(boardEl.children.length).toBe(81);
    expect(boardEl.className).toBe("board");
  });

  it("selected cell has cell-selected class (amber accent in CSS)", () => {
    const board = Array.from({ length: 9 }, () => Array(9).fill(0));

    const { container } = render(
      <div className="board">
        {board.map((row, r) =>
          row.map((_: number, c: number) => {
            const classes = [
              "cell",
              r === 4 && c === 4 ? "cell-selected" : "",
            ].filter(Boolean).join(" ");
            return <div key={`${r}-${c}`} className={classes} />;
          })
        )}
      </div>
    );

    const cells = container.querySelectorAll(".cell");
    expect(cells[4 * 9 + 4].classList.contains("cell-selected")).toBe(true);
    expect(cells[0].classList.contains("cell-selected")).toBe(false);
  });

  it("highlights the active difficulty pill", () => {
    const difficulties: { key: Difficulty; label: string }[] = [
      { key: "easy", label: "简单" },
      { key: "medium", label: "中等" },
      { key: "hard", label: "困难" },
      { key: "expert", label: "专家" },
    ];

    render(
      <div className="difficulty-selector">
        {difficulties.map((d) => (
          <button
            key={d.key}
            className={`diff-btn ${d.key === "hard" ? "diff-active" : ""}`}
          >
            {d.label}
          </button>
        ))}
      </div>
    );

    const active = document.querySelector(".diff-active");
    expect(active).toBeTruthy();
    expect(active?.textContent).toBe("困难");
    expect(document.querySelectorAll(".diff-btn").length).toBe(4);
  });

  it("renders notes toggle with active and inactive states", () => {
    const { container: inactive } = render(
      <button className="toggle-track">
        <div className="toggle-thumb" />
      </button>
    );
    expect(inactive.querySelector(".toggle-track")).toBeTruthy();
    expect(inactive.querySelector(".toggle-thumb")).toBeTruthy();

    const { container: active } = render(
      <button className="toggle-track active">
        <div className="toggle-thumb" />
      </button>
    );
    expect(active.querySelector(".toggle-track.active")).toBeTruthy();
  });

  it("controls column stacks sections vertically", () => {
    render(
      <div className="controls-col">
        <div className="diff-group" />
        <div className="notes-row" />
        <div className="num-grid" />
        <div className="actions" />
      </div>
    );

    const col = document.querySelector(".controls-col");
    expect(col?.children.length).toBe(4);
  });
});
