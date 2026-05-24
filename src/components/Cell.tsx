import React from "react";

interface CellProps {
  value: number;
  isGiven: boolean;
  isSelected: boolean;
  isConflict: boolean;
  isHinted: boolean;
  isHighlighted: boolean;
  noteValues: number[];
  onClick: () => void;
}

export const Cell: React.FC<CellProps> = ({
  value,
  isGiven,
  isSelected,
  isConflict,
  isHinted,
  isHighlighted,
  noteValues,
  onClick,
}) => {
  // A cell is user-entered if it has a value and is NOT given
  const isUser = !isGiven && value !== 0;

  const classNames = [
    "cell",
    isGiven ? "cell-given" : "",
    isUser ? "cell-user" : "",
    isSelected ? "cell-selected" : "",
    isConflict ? "cell-conflict" : "",
    isHinted ? "cell-hinted" : "",
    isHighlighted && !isSelected ? "cell-highlighted" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classNames} onClick={onClick}>
      {value !== 0 ? (
        <span key={value} className="cell-value pop-in">{value}</span>
      ) : noteValues.length > 0 ? (
        <div className="cell-notes">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
            <span key={n} className="cell-note">
              {noteValues.includes(n) ? n : ""}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
};