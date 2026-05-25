/**
 * Web Audio API 音效管理器
 *
 * 使用 AudioContext 合成所有音效，无需外部音频文件。
 * 单例模式，可在组件和 hook 中直接调用。
 */

type SoundName = "place" | "erase" | "mistake" | "victory" | "select" | "click" | "note" | "complete";

class SoundManager {
  private static instance: SoundManager;
  private ctx: AudioContext | null = null;
  private _muted = false;

  static getInstance(): SoundManager {
    if (!SoundManager.instance) {
      SoundManager.instance = new SoundManager();
    }
    return SoundManager.instance;
  }

  private getContext(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
    }
    // Resume if suspended (autoplay policy)
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    return this.ctx;
  }

  get muted(): boolean {
    return this._muted;
  }

  setMuted(m: boolean): void {
    this._muted = m;
  }

  toggleMute(): boolean {
    this._muted = !this._muted;
    return this._muted;
  }

  play(name: SoundName): void {
    if (this._muted) return;
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;

      switch (name) {
        case "place":
          this.place(ctx, now);
          break;
        case "erase":
          this.erase(ctx, now);
          break;
        case "mistake":
          this.mistake(ctx, now);
          break;
        case "victory":
          this.victory(ctx, now);
          break;
        case "select":
          this.select(ctx, now);
          break;
        case "click":
          this.click(ctx, now);
          break;
        case "note":
          this.note(ctx, now);
          break;
        case "complete":
          this.complete(ctx, now);
          break;
      }
    } catch {
      // AudioContext may be blocked by browser policy — silently ignore
    }
  }

  /**
   * 放置数字：短促清脆的 click/pop
   * 正弦波 800Hz → 1.2kHz 快速扫频，快速衰减
   */
  private place(ctx: AudioContext, t: number): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.exponentialRampToValueAtTime(1200, t + 0.02);
    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.08);
  }

  /**
   * 擦除：柔和的 whoosh
   * 白噪声 → 带通滤波，快速衰减
   */
  private erase(ctx: AudioContext, t: number): void {
    const bufferSize = ctx.sampleRate * 0.12;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const bandpass = ctx.createBiquadFilter();
    bandpass.type = "bandpass";
    bandpass.frequency.setValueAtTime(1200, t);
    bandpass.frequency.exponentialRampToValueAtTime(400, t + 0.1);
    bandpass.Q.value = 2;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.06, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    source.connect(bandpass).connect(gain).connect(ctx.destination);
    source.start(t);
    source.stop(t + 0.12);
  }

  /**
   * 错误：低沉嗡鸣
   * 锯齿波 150Hz → 100Hz 下滑，带颤音
   */
  private mistake(ctx: AudioContext, t: number): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(100, t + 0.25);
    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

    // Vibrato for unease
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 20;
    lfoGain.gain.value = 20;
    lfo.connect(lfoGain).connect(osc.frequency);

    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.3);
    lfo.start(t);
    lfo.stop(t + 0.3);
  }

  /**
   * 胜利：上行琶音 C5 → E5 → G5 → C6
   * 正弦波，每音 120ms
   */
  private victory(ctx: AudioContext, t: number): void {
    const notes = [523, 659, 784, 1047]; // C5 E5 G5 C6
    const noteLen = 0.12;
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      const start = t + i * noteLen;
      gain.gain.setValueAtTime(0.2, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + noteLen * 2);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + noteLen * 2);
    });
  }

  /**
   * 选中格子：极短的 tick
   * 正弦波 1000Hz
   */
  private select(ctx: AudioContext, t: number): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 1000;
    gain.gain.setValueAtTime(0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.025);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.025);
  }

  /**
   * 按钮点击：轻柔 tap
   * 正弦波 600Hz
   */
  private click(ctx: AudioContext, t: number): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 600;
    gain.gain.setValueAtTime(0.1, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.04);
  }

  /**
   * 笔记模式切换：较高音 1200Hz
   */
  private note(ctx: AudioContext, t: number): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 1200;
    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.06);
  }

  /**
   * 过关/完成：C 大三和弦 (C4 E4 G4)
   */
  private complete(ctx: AudioContext, t: number): void {
    const freqs = [262, 330, 392];
    freqs.forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.4);
    });
  }
}

const soundManager = SoundManager.getInstance();
export { soundManager };
export type { SoundName };
