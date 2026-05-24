import React from "react";
import type { Difficulty } from "../types";

interface ControlsProps {
  difficulty: Difficulty;
  loading: boolean;
  noteMode: boolean;
  onNewGame: (diff: Difficulty) => void;
  onCheck: () => void;
  onHint: () => void;
  onReset: () => void;
  onUndo: () => void;
  onToggleNote: () => void;
}

const difficulties: { key: Difficulty; label: string }[] = [
  { key: "easy", label: "简单" },
  { key: "medium", label: "中等" },
  { key: "hard", label: "困难" },
  { key: "expert", label: "专家" },
];

export const Controls: React.FC<ControlsProps> = ({
  difficulty,
  loading,
  noteMode,
  onNewGame,
  onCheck,
  onHint,
  onReset,
  onUndo,
  onToggleNote,
}) => {
  return (
    <div className="controls">
      <div className="difficulty-selector">
        {difficulties.map((d) => (
          <button
            key={d.key}
            className={`diff-btn ${difficulty === d.key ? "diff-active" : ""}`}
            onClick={() => onNewGame(d.key)}
            disabled={loading}
          >
            {d.label}
          </button>
        ))}
      </div>

      <div className="num-pad">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <button
            key={n}
            className="num-btn"
            onClick={() => {
              // emit custom event that App handles
              window.dispatchEvent(new CustomEvent("enter-number", { detail: n }));
            }}
            disabled={loading}
          >
            {n}
          </button>
        ))}
        <button className="num-btn erase-btn" onClick={() => window.dispatchEvent(new CustomEvent("erase"))}>
          ✕
        </button>
      </div>

      <div className="action-buttons">
        <button className="action-btn" onClick={() => onNewGame(difficulty)} disabled={loading}>
          新游戏
        </button>
        <button className="action-btn" onClick={onCheck} disabled={loading}>
          检查
        </button>
        <button className="action-btn" onClick={onHint} disabled={loading}>
          提示
        </button>
        <button className="action-btn" onClick={onReset} disabled={loading}>
          重置
        </button>
        <button className="action-btn" onClick={onUndo} disabled={loading}>
          撤销
        </button>
        <button
          className={`action-btn ${noteMode ? "action-active" : ""}`}
          onClick={onToggleNote}
          disabled={loading}
        >
          笔记
        </button>
      </div>
    </div>
  );
};