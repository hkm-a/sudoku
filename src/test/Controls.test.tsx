import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Controls } from "../components/Controls";

describe("Controls", () => {
  const defaultProps = {
    difficulty: "medium" as const,
    loading: false,
    noteMode: false,
    onNewGame: vi.fn(),
    onCheck: vi.fn(),
    onHint: vi.fn(),
    onReset: vi.fn(),
    onUndo: vi.fn(),
    onToggleNote: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders all four difficulty buttons", () => {
    render(<Controls {...defaultProps} />);
    expect(screen.getByText("简单")).toBeTruthy();
    expect(screen.getByText("中等")).toBeTruthy();
    expect(screen.getByText("困难")).toBeTruthy();
    expect(screen.getByText("专家")).toBeTruthy();
  });

  it("highlights active difficulty", () => {
    render(<Controls {...defaultProps} difficulty="hard" />);
    const btns = screen.getAllByRole("button");
    const hardBtn = btns.find(
      (b) => b.textContent === "困难" && b.classList.contains("diff-active")
    );
    expect(hardBtn).toBeTruthy();
  });

  it("renders all nine number pad buttons", () => {
    render(<Controls {...defaultProps} />);
    for (let i = 1; i <= 9; i++) {
      expect(screen.getByText(i.toString())).toBeTruthy();
    }
  });

  it("renders action buttons", () => {
    render(<Controls {...defaultProps} />);
    expect(screen.getByText("新游戏")).toBeTruthy();
    expect(screen.getByText("检查")).toBeTruthy();
    expect(screen.getByText("提示")).toBeTruthy();
    expect(screen.getByText("撤销")).toBeTruthy();
    expect(screen.getByText("重置")).toBeTruthy();
  });

  it("renders erase button", () => {
    render(<Controls {...defaultProps} />);
    expect(screen.getByText("擦除")).toBeTruthy();
  });

  it("renders notes toggle", () => {
    render(<Controls {...defaultProps} />);
    expect(screen.getByText("笔记")).toBeTruthy();
    expect(document.querySelector(".toggle-track")).toBeTruthy();
  });

  it("shows note toggle as active when noteMode is true", () => {
    render(<Controls {...defaultProps} noteMode={true} />);
    expect(document.querySelector(".toggle-track.active")).toBeTruthy();
  });

  it("calls onNewGame with difficulty when clicking a difficulty button", async () => {
    const user = userEvent.setup();
    const onNewGame = vi.fn();
    render(<Controls {...defaultProps} onNewGame={onNewGame} />);

    await user.click(screen.getByText("困难"));
    expect(onNewGame).toHaveBeenCalledWith("hard");
  });

  it("calls onCheck when clicking check button", async () => {
    const user = userEvent.setup();
    const onCheck = vi.fn();
    render(<Controls {...defaultProps} onCheck={onCheck} />);

    await user.click(screen.getByText("检查"));
    expect(onCheck).toHaveBeenCalledOnce();
  });

  it("calls onHint when clicking hint button", async () => {
    const user = userEvent.setup();
    const onHint = vi.fn();
    render(<Controls {...defaultProps} onHint={onHint} />);

    await user.click(screen.getByText("提示"));
    expect(onHint).toHaveBeenCalledOnce();
  });

  it("calls onReset when clicking reset button", async () => {
    const user = userEvent.setup();
    const onReset = vi.fn();
    render(<Controls {...defaultProps} onReset={onReset} />);

    await user.click(screen.getByText("重置"));
    expect(onReset).toHaveBeenCalledOnce();
  });

  it("calls onUndo when clicking undo button", async () => {
    const user = userEvent.setup();
    const onUndo = vi.fn();
    render(<Controls {...defaultProps} onUndo={onUndo} />);

    await user.click(screen.getByText("撤销"));
    expect(onUndo).toHaveBeenCalledOnce();
  });

  it("calls onToggleNote when clicking notes toggle", async () => {
    const user = userEvent.setup();
    const onToggleNote = vi.fn();
    render(<Controls {...defaultProps} onToggleNote={onToggleNote} />);

    await user.click(document.querySelector(".toggle-track")!);
    expect(onToggleNote).toHaveBeenCalledOnce();
  });

  it("dispatches enter-number event when clicking number pad", async () => {
    const user = userEvent.setup();
    const listener = vi.fn();
    window.addEventListener("enter-number", listener);

    render(<Controls {...defaultProps} />);
    await user.click(screen.getByText("5"));

    expect(listener).toHaveBeenCalledOnce();
    const event = listener.mock.calls[0][0] as CustomEvent;
    expect(event.detail).toBe(5);
    window.removeEventListener("enter-number", listener);
  });

  it("dispatches erase event when clicking erase", async () => {
    const user = userEvent.setup();
    const listener = vi.fn();
    window.addEventListener("erase", listener);

    render(<Controls {...defaultProps} />);
    await user.click(screen.getByText("擦除"));

    expect(listener).toHaveBeenCalledOnce();
    window.removeEventListener("erase", listener);
  });

  it("disables buttons when loading", () => {
    render(<Controls {...defaultProps} loading={true} />);

    const buttons = document.querySelectorAll("button");
    buttons.forEach((btn) => {
      expect(btn.disabled).toBe(true);
    });
  });
});
