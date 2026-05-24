import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Timer } from "../components/Timer";

describe("Timer", () => {
  it("displays 00:00 when seconds is 0", () => {
    render(<Timer seconds={0} gameStatus="playing" />);
    expect(screen.getByText("00:00")).toBeTruthy();
  });

  it("displays correct minutes and seconds", () => {
    render(<Timer seconds={125} gameStatus="playing" />);
    expect(screen.getByText("02:05")).toBeTruthy();
  });

  it("displays 01:00 for 60 seconds", () => {
    render(<Timer seconds={60} gameStatus="playing" />);
    expect(screen.getByText("01:00")).toBeTruthy();
  });

  it("displays 59:59 for 3599 seconds", () => {
    render(<Timer seconds={3599} gameStatus="playing" />);
    expect(screen.getByText("59:59")).toBeTruthy();
  });

  it("applies timer-completed class when game is completed", () => {
    const { container } = render(<Timer seconds={300} gameStatus="completed" />);
    expect(container.querySelector(".timer-completed")).toBeTruthy();
  });

  it("does not apply timer-completed class when playing", () => {
    const { container } = render(<Timer seconds={300} gameStatus="playing" />);
    expect(container.querySelector(".timer-completed")).toBeNull();
  });
});
