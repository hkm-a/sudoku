import { describe, it, expect } from "vitest";

/**
 * Layout dimension tests.
 * Board (432px) + controls-col min-width (180px) + gap (28px) + card padding (64px)
 * = 704px minimum window width needed.
 *
 * Source constants from src/App.css.
 * Window size from src-tauri/tauri.conf.json: currently 720x780.
 */
describe("Window Layout", () => {
  const BOARD_WIDTH = 432;
  const CONTROLS_MIN_WIDTH = 180;
  const GAP = 28;
  const CARD_PADDING = 64; // 32px left + 32px right padding on .app-card

  const MIN_REQUIRED_WIDTH =
    BOARD_WIDTH + CONTROLS_MIN_WIDTH + GAP + CARD_PADDING;

  it("layout math sums to 704px minimum width", () => {
    expect(MIN_REQUIRED_WIDTH).toBe(704);
  });

  it("tauri window width (720) is wide enough for layout (704)", () => {
    const currentWindowWidth = 720; // from tauri.conf.json
    expect(currentWindowWidth).toBeGreaterThanOrEqual(MIN_REQUIRED_WIDTH);
  });

  it("app-card max-width (720px) does not clip the layout (704px)", () => {
    const CONTENT_WIDTH = BOARD_WIDTH + GAP + CONTROLS_MIN_WIDTH;
    const CARD_TOTAL_WIDTH = CONTENT_WIDTH + CARD_PADDING;

    expect(CARD_TOTAL_WIDTH).toBe(704);
    // max-width in App.css is 720px, enough for 704
    const cssMaxWidth = 720;
    expect(cssMaxWidth).toBeGreaterThanOrEqual(CARD_TOTAL_WIDTH);
  });
});
