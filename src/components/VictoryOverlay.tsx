import React from "react";
import { soundManager } from "../utils/SoundManager";

interface VictoryOverlayProps {
  stageNumber: number;
  timer: number;
  mistakes: number;
  isLastStage: boolean;
  onNextStage: () => void;
  onReplay: () => void;
  onBackToMenu: () => void;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

/**
 * Get a rating based on mistakes.
 *  0 mistakes → ⭐⭐⭐ 完美
 *  1-2       → ⭐⭐  优秀
 *  3-5       → ⭐    ？？？
 *  >5        → 💪    ？？？
 */
function getRating(mistakes: number): { stars: string; label: string } {
  if (mistakes === 0) return { stars: "⭐⭐⭐", label: "完美！" };
  if (mistakes <= 2) return { stars: "⭐⭐", label: "优秀！" };
  if (mistakes <= 5) return { stars: "⭐", label: "继续加油" };
  return { stars: "💪", label: "争取少犯错" };
}

const COLORS = ["#f97316", "#eab308", "#22c55e", "#3b82f6", "#a855f7", "#ec4899"];

function getRandomColor(): string {
  return COLORS[Math.floor(Math.random() * COLORS.length)];
}

const ConfettiPiece: React.FC<{
  index: number;
  color: string;
  style: React.CSSProperties;
}> = ({ index, color, style }) => (
  <div
    className="confetti-piece"
    style={{
      ...style,
      backgroundColor: color,
      animationDelay: `${(index * 0.08).toFixed(2)}s`,
      animationDuration: `${(2 + Math.random() * 2).toFixed(2)}s`,
    }}
  />
);

export const VictoryOverlay: React.FC<VictoryOverlayProps> = ({
  stageNumber,
  timer,
  mistakes,
  isLastStage,
  onNextStage,
  onReplay,
  onBackToMenu,
}) => {
  // Play celebration chord on mount
  React.useEffect(() => {
    soundManager.play("complete");
  }, []);

  const confettiPieces = React.useMemo(() => {
    const pieces: React.ReactElement[] = [];
    for (let i = 0; i < 60; i++) {
      const x = Math.random() * 100;
      const delay = Math.random() * 0.5;
      const size = 6 + Math.random() * 8;
      pieces.push(
        <ConfettiPiece
          key={i}
          index={i}
          color={getRandomColor()}
          style={{
            left: `${x}%`,
            width: size,
            height: size * (0.4 + Math.random() * 0.6),
            animationDelay: `${delay}s`,
          }}
        />
      );
    }
    return pieces;
  }, []);

  const rating = getRating(mistakes);

  return (
    <div className="victory-overlay">
      {/* Confetti layer */}
      <div className="confetti-container" aria-hidden="true">
        {confettiPieces}
      </div>

      {/* Main card */}
      <div className="victory-card">
        <div className="victory-icon">🏆</div>
        <h2 className="victory-title">恭喜通关！</h2>
        <p className="victory-stage">第 {stageNumber} 关 · 完成</p>

        <div className="victory-stats">
          <div className="victory-stat">
            <span className="victory-stat-value">{formatTime(timer)}</span>
            <span className="victory-stat-label">用时</span>
          </div>
          <div className="victory-stat-divider" />
          <div className="victory-stat">
            <span className="victory-stat-value">{mistakes}</span>
            <span className="victory-stat-label">错误</span>
          </div>
        </div>

        <div className="victory-rating">
          <span className="victory-stars">{rating.stars}</span>
          <span className="victory-rating-label">{rating.label}</span>
        </div>

        <div className="victory-actions">
          {!isLastStage ? (
            <button className="victory-btn victory-btn-primary" onClick={onNextStage}>
              下一关 →
            </button>
          ) : (
            <p className="victory-all-done">🎉 恭喜通关全部 20 关！</p>
          )}
          <div className="victory-secondary-row">
            <button className="victory-btn victory-btn-secondary" onClick={onReplay}>
              重新挑战
            </button>
            <button className="victory-btn victory-btn-secondary" onClick={onBackToMenu}>
              返回选关
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
