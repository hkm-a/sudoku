import React from "react";
import { useSudoku } from "./hooks/useSudoku";
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
    <div className="app">
      <header className="header">
        <h1 className="title">数独</h1>
        <div className="header-info">
          <Timer seconds={timer} gameStatus={gameStatus} />
          {gameStatus === "playing" && <span className="mistakes">错误: {mistakes}</span>}
        </div>
      </header>

      {loading && (
        <div className="loading-overlay">
          <div className="spinner" />
        </div>
      )}

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

      {noteMode && <div className="note-indicator">笔记模式</div>}

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

      {message && (
        <div className="toast" onClick={dismissMessage}>
          {message}
        </div>
      )}
    </div>
  );
};

export default App;