import React from "react";
import { useSudoku } from "./hooks/useSudoku";
import "./App.css";
import { Board } from "./components/Board";
import { Controls } from "./components/Controls";
import { Timer } from "./components/Timer";

const App: React.FC = () => {
  const {
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
  } = useSudoku();

  // Listen for number pad events from Controls
  React.useEffect(() => {
    const handleNumber = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      enterNumber(detail);
    };
    const handleErase = () => eraseCell();
    const handleKeyDown = (e: KeyboardEvent) => {
      const num = parseInt(e.key);
      if (num >= 1 && num <= 9) {
        enterNumber(num);
      } else if (e.key === "Backspace" || e.key === "Delete") {
        eraseCell();
      } else if (e.key === "n" || e.key === "N") {
        toggleNoteMode();
      } else if (e.key === "z" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        undo();
      } else if (e.key === "ArrowUp" || e.key === "ArrowDown" || e.key === "ArrowLeft" || e.key === "ArrowRight") {
        e.preventDefault();
        if (selectedCell) {
          let [r, c] = selectedCell;
          if (e.key === "ArrowUp") r = Math.max(0, r - 1);
          if (e.key === "ArrowDown") r = Math.min(8, r + 1);
          if (e.key === "ArrowLeft") c = Math.max(0, c - 1);
          if (e.key === "ArrowRight") c = Math.min(8, c + 1);
          selectCell(r, c);
        }
      }
    };

    window.addEventListener("enter-number", handleNumber);
    window.addEventListener("erase", handleErase);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("enter-number", handleNumber);
      window.removeEventListener("erase", handleErase);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [enterNumber, eraseCell, toggleNoteMode, undo, selectedCell, selectCell]);

  // Start game on mount
  React.useEffect(() => {
    newGame("medium");
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="app-card">
      {loading && (
        <div className="loading-overlay">
          <div className="spinner" />
        </div>
      )}

      <div className="app">
        {/* Left: Board Column */}
        <div className="board-col">
          <Board
            board={board}
            given={given}
            selectedCell={selectedCell}
            conflicts={conflicts}
            hintCell={hintCell}
            sameNumberCells={sameNumberCells}
            notes={notes}
            onSelectCell={selectCell}
          />
          <div className="board-status">
            <span className="status-dot" />
            <span className="status-text">
              {gameStatus === "completed" ? "已完成" : "进行中"}
            </span>
            <span className="status-sep">·</span>
            <span className="status-text">提示 {hintCount(given)}</span>
          </div>
        </div>

        {/* Right: Controls Column */}
        <div className="controls-col">
          {/* Header */}
          <div className="header">
            <h1 className="title">数<em>独</em></h1>
            <div className="header-info">
              <div className="stat-badge stat-badge-clock">
                <svg className="stat-badge-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
                <Timer seconds={timer} gameStatus={gameStatus} />
              </div>
              {gameStatus === "playing" && (
                <div className="stat-badge stat-badge-errors">
                  <svg className="stat-badge-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="15" y1="9" x2="9" y2="15"/>
                    <line x1="9" y1="9" x2="15" y2="15"/>
                  </svg>
                  <span className="mistakes">{mistakes}</span>
                </div>
              )}
            </div>
          </div>

          <div className="divider" />

          <Controls
            difficulty={difficulty}
            loading={loading}
            noteMode={noteMode}
            onNewGame={newGame}
            onCheck={checkBoard}
            onHint={getHint}
            onReset={resetGame}
            onUndo={undo}
            onToggleNote={toggleNoteMode}
          />
        </div>
      </div>

      {message && (
        <div className="toast" onClick={dismissMessage}>
          <div className="toast-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <span>{message}</span>
        </div>
      )}
    </div>
  );
};

/** Count how many cells are given (pre-filled) in the puzzle */
function hintCount(given: boolean[][]): number {
  let count = 0;
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (given[r][c]) count++;
    }
  }
  return count;
}

export default App;