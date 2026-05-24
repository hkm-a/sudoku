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
    <>
      {/* Difficulty */}
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

      {/* Notes toggle */}
      <div className="notes-row">
        <span className="notes-label">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
          </svg>
          笔记
        </span>
        <button
          className={`toggle-track ${noteMode ? "active" : ""}`}
          onClick={onToggleNote}
          aria-label="切换笔记模式"
          disabled={loading}
        >
          <div className="toggle-thumb" />
        </button>
      </div>

      {/* Number Pad: 3x3 */}
      <div>
        <div className="num-pad-grid">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
            <button
              key={n}
              className="num-btn"
              onClick={() => {
                window.dispatchEvent(new CustomEvent("enter-number", { detail: n }));
              }}
              disabled={loading}
            >
              {n}
            </button>
          ))}
        </div>
        <div className="erase-row">
          <button
            className="erase-btn"
            onClick={() => window.dispatchEvent(new CustomEvent("erase"))}
            disabled={loading}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 20H7l-5-5 5-5h13c1.1 0 2 .9 2 2v6c0 1.1-.9 2-2 2z"/>
              <line x1="18" y1="12" x2="12" y2="18"/>
              <line x1="12" y1="12" x2="18" y2="18"/>
            </svg>
            擦除
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="actions">
        <button className="action-btn" onClick={() => onNewGame(difficulty)} disabled={loading}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10"/>
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
          </svg>
          新游戏
        </button>
        <button className="action-btn" onClick={onCheck} disabled={loading}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          检查
        </button>
        <div className="action-btn-row">
          <button className="action-btn" onClick={onHint} disabled={loading}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18h6"/>
              <path d="M10 22h4"/>
              <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/>
            </svg>
            提示
          </button>
          <button className="action-btn" onClick={onUndo} disabled={loading}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="1 4 1 10 7 10"/>
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
            </svg>
            撤销
          </button>
        </div>
        <button className="action-btn" onClick={onReset} disabled={loading}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10"/>
            <polyline points="1 20 1 14 7 14"/>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
          </svg>
          重置
        </button>
      </div>
    </>
  );
};