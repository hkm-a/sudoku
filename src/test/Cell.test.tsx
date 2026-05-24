import { render } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Cell } from "../components/Cell";

describe("Cell", () => {
  it("renders value when non-zero", () => {
    const { container } = render(
      <Cell
        value={5}
        isGiven={false}
        isSelected={false}
        isConflict={false}
        isHinted={false}
        isHighlighted={false}
        noteValues={[]}
        onClick={() => {}}
      />
    );

    expect(container.querySelector(".cell-value")).toBeTruthy();
    expect(container.querySelector(".cell-value")?.textContent).toBe("5");
  });

  it("renders nothing when value is 0 and no notes", () => {
    const { container } = render(
      <Cell
        value={0}
        isGiven={false}
        isSelected={false}
        isConflict={false}
        isHinted={false}
        isHighlighted={false}
        noteValues={[]}
        onClick={() => {}}
      />
    );

    expect(container.querySelector(".cell-value")).toBeNull();
    expect(container.querySelector(".cell-notes")).toBeNull();
  });

  it("renders notes grid when value is 0 and notes exist", () => {
    const { container } = render(
      <Cell
        value={0}
        isGiven={false}
        isSelected={false}
        isConflict={false}
        isHinted={false}
        isHighlighted={false}
        noteValues={[3, 7]}
        onClick={() => {}}
      />
    );

    expect(container.querySelector(".cell-notes")).toBeTruthy();
    const notes = container.querySelectorAll(".cell-note");
    expect(notes.length).toBe(9);
    expect(notes[2].textContent).toBe("3");
    expect(notes[6].textContent).toBe("7");
  });

  it("applies cell-given class when isGiven", () => {
    const { container } = render(
      <Cell
        value={5}
        isGiven={true}
        isSelected={false}
        isConflict={false}
        isHinted={false}
        isHighlighted={false}
        noteValues={[]}
        onClick={() => {}}
      />
    );

    expect(container.firstChild).toHaveClass("cell-given");
  });

  it("applies cell-user class when value present and not given", () => {
    const { container } = render(
      <Cell
        value={5}
        isGiven={false}
        isSelected={false}
        isConflict={false}
        isHinted={false}
        isHighlighted={false}
        noteValues={[]}
        onClick={() => {}}
      />
    );

    expect(container.firstChild).toHaveClass("cell-user");
  });

  it("applies cell-selected class", () => {
    const { container } = render(
      <Cell
        value={0}
        isGiven={false}
        isSelected={true}
        isConflict={false}
        isHinted={false}
        isHighlighted={false}
        noteValues={[]}
        onClick={() => {}}
      />
    );

    expect(container.firstChild).toHaveClass("cell-selected");
  });

  it("applies cell-conflict class", () => {
    const { container } = render(
      <Cell
        value={5}
        isGiven={false}
        isSelected={false}
        isConflict={true}
        isHinted={false}
        isHighlighted={false}
        noteValues={[]}
        onClick={() => {}}
      />
    );

    expect(container.firstChild).toHaveClass("cell-conflict");
  });

  it("applies cell-hinted class", () => {
    const { container } = render(
      <Cell
        value={5}
        isGiven={false}
        isSelected={false}
        isConflict={false}
        isHinted={true}
        isHighlighted={false}
        noteValues={[]}
        onClick={() => {}}
      />
    );

    expect(container.firstChild).toHaveClass("cell-hinted");
  });

  it("applies cell-highlighted class (but not when selected)", () => {
    const { container: c1 } = render(
      <Cell
        value={5}
        isGiven={false}
        isSelected={false}
        isConflict={false}
        isHinted={false}
        isHighlighted={true}
        noteValues={[]}
        onClick={() => {}}
      />
    );

    expect(c1.firstChild).toHaveClass("cell-highlighted");

    const { container: c2 } = render(
      <Cell
        value={5}
        isGiven={false}
        isSelected={true}
        isConflict={false}
        isHinted={false}
        isHighlighted={true}
        noteValues={[]}
        onClick={() => {}}
      />
    );

    expect(c2.firstChild).not.toHaveClass("cell-highlighted");
  });

  it("calls onClick when clicked", () => {
    const onClick = vi.fn();
    const { container } = render(
      <Cell
        value={0}
        isGiven={false}
        isSelected={false}
        isConflict={false}
        isHinted={false}
        isHighlighted={false}
        noteValues={[]}
        onClick={onClick}
      />
    );

    (container.firstChild as HTMLElement).click();
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("has pop-in animation on value span", () => {
    const { container } = render(
      <Cell
        value={7}
        isGiven={false}
        isSelected={false}
        isConflict={false}
        isHinted={false}
        isHighlighted={false}
        noteValues={[]}
        onClick={() => {}}
      />
    );

    expect(container.querySelector(".pop-in")).toBeTruthy();
  });
});
