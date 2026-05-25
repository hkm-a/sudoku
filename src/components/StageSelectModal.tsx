import React from "react";
import { getStage, TOTAL_STAGES } from "../data/stages";

interface StageSelectModalProps {
  unlockedStage: number;
  currentStage: number;
  onSelect: (stage: number) => void;
  onClose: () => void;
  onResetProgress: () => void;
}

export const StageSelectModal: React.FC<StageSelectModalProps> = ({
  unlockedStage,
  currentStage,
  onSelect,
  onClose,
  onResetProgress,
}) => {
  const stages = React.useMemo(() => {
    const arr: { number: number; difficulty: string }[] = [];
    for (let i = 1; i <= TOTAL_STAGES; i++) {
      const s = getStage(i);
      arr.push({ number: s.number, difficulty: s.label });
    }
    return arr;
  }, []);

  return (
    <div className="help-overlay" onClick={onClose}>
      <div className="stage-select-panel" onClick={(e) => e.stopPropagation()}>
        <button className="help-close" onClick={onClose}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>

        <h2 className="stage-select-title">🗺️ 选择关卡</h2>
        <p className="stage-select-subtitle">共 {TOTAL_STAGES} 关 · 当前解锁至第 {unlockedStage} 关</p>

        <div className="stage-grid">
          {stages.map((s) => {
            const isUnlocked = s.number <= unlockedStage;
            const isCurrent = s.number === currentStage;
            const isLocked = s.number > unlockedStage;

            return (
              <button
                key={s.number}
                className={[
                  "stage-item",
                  isCurrent ? "stage-current" : "",
                  isLocked ? "stage-locked" : "stage-unlocked",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => {
                  if (isUnlocked) {
                    onSelect(s.number);
                    onClose();
                  }
                }}
                disabled={isLocked}
              >
                <span className="stage-item-number">{s.number}</span>
                <span className="stage-item-diff">{s.difficulty}</span>
                {isCurrent && <span className="stage-item-badge">进行中</span>}
                {isLocked && (
                  <span className="stage-item-lock">🔒</span>
                )}
              </button>
            );
          })}
        </div>

        <button
          className="stage-reset-btn"
          onClick={() => {
            if (window.confirm("确定要重置所有闯关进度吗？")) {
              onResetProgress();
              onClose();
            }
          }}
        >
          重置进度
        </button>
      </div>
    </div>
  );
};
