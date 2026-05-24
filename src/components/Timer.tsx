import React from "react";

interface TimerProps {
  seconds: number;
  gameStatus: string;
}

export const Timer: React.FC<TimerProps> = ({ seconds, gameStatus }) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  const display = `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;

  return (
    <div className={`timer ${gameStatus === "completed" ? "timer-completed" : ""}`}>
      {display}
    </div>
  );
};