import React from "react";
import { soundManager, type SoundName } from "../utils/SoundManager";

interface UseSoundReturn {
  play: (name: SoundName) => void;
  muted: boolean;
  toggleMute: () => void;
  SoundToggle: React.FC;
}

/**
 * 音效 React hook
 *
 * 封装 SoundManager 单例，提供响应式的 muted 状态和 SoundToggle 组件。
 * 在 App 层使用一次，将 play() 传递给子组件或通过事件触发。
 */
export function useSound(): UseSoundReturn {
  const [muted, setMuted] = React.useState(soundManager.muted);

  const toggleMute = React.useCallback(() => {
    const next = soundManager.toggleMute();
    setMuted(next);
  }, []);

  const play = React.useCallback((name: SoundName) => {
    soundManager.play(name);
  }, []);

  const SoundToggle = React.useMemo(() => {
    const Toggle: React.FC = () => (
      <button
        className={`sound-toggle ${muted ? "sound-toggle-muted" : ""}`}
        onClick={toggleMute}
        aria-label={muted ? "开启音效" : "关闭音效"}
        title={muted ? "开启音效" : "关闭音效"}
      >
        {muted ? (
          /* Muted icon */
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <line x1="23" y1="9" x2="17" y2="15" />
            <line x1="17" y1="9" x2="23" y2="15" />
          </svg>
        ) : (
          /* Speaker icon with waves */
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          </svg>
        )}
      </button>
    );
    return Toggle;
  }, [muted, toggleMute]);

  return { play, muted, toggleMute, SoundToggle };
}
