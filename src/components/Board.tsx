import React from "react";
import { Cell } from "./Cell";
import type { Conflict } from "../types";

interface BoardProps {
  board: number[][];
  given: boolean[][];
  selectedCell: [number, number] | null;
  conflicts: Conflict[];
  hintCell: [number, number] | null;
  sameNumberCells: Set<string>;
  notes: Set<string>;
  onSelectCell: (row: number, col: number) => void;
}

export const Board: React.FC<BoardProps> = ({
  board,
  given,
  selectedCell,
  conflicts,
  hintCell,
  sameNumberCells,
  notes,
  onSelectCell,
}) => {
  const isConflictCell = (r: number, c: number) =>
    conflicts.some((conf) => conf.row === r && conf.col === c);

  const getNoteValues = (r: number, c: number): number[] => {
    const vals: number[] = [];
    for (let n = 1; n <= 9; n++) {
      if (notes.has(`note:${r}-${c}:${n}`)) {
        vals.push(n);
      }
    }
    return vals;
  };

  return (
    <div className="board">
      {board.map((row, r) =>
        row.map((val, c) => (
          <Cell
            key={`${r}-${c}`}
            value={val}
            isGiven={given[r][c]}
            isSelected={selectedCell?.[0] === r && selectedCell?.[1] === c}
            isConflict={isConflictCell(r, c)}
            isHinted={hintCell?.[0] === r && hintCell?.[1] === c}
            isHighlighted={sameNumberCells.has(`${r}-${c}`)}
            noteValues={getNoteValues(r, c)}
            onClick={() => onSelectCell(r, c)}
          />
        ))
      )}
    </div>
  );
};