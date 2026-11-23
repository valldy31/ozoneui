// ============================================================================
// OzoneUI Procedural Web Audio Synthesizer & Haptics Engine (Zero Assets)
// ============================================================================

class OzoneSoundEngine {
  private ctx: AudioContext | null = null;

  private isEnabled(): boolean {
    const setting = document.documentElement.dataset.ozSound;
    return setting !== 'off' && setting !== 'false';
  }

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (Ctx) this.ctx = new Ctx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private tone(freq: number, endFreq: number, duration: number, type: OscillatorType = 'sine', gainVal = 0.035, delay = 0) {
    if (!this.isEnabled()) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime + delay;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      if (endFreq !== freq) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), now + duration);
      }
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(gainVal, now + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + duration + 0.01);
    } catch {
      // Ignore audio policy restrictions before first user gesture
    }
  }

  private haptic(ms = 6) {
    if (!this.isEnabled()) return;
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      try { navigator.vibrate(ms); } catch {}
    }
  }

  hover() {
    this.tone(1850, 2200, 0.035, 'sine', 0.012);
  }

  click() {
    this.tone(820, 360, 0.055, 'triangle', 0.04);
    this.haptic(6);
  }

  toggle(on: boolean) {
    if (on) {
      this.tone(520, 880, 0.09, 'sine', 0.04);
      this.tone(1040, 1320, 0.08, 'sine', 0.025, 0.04);
    } else {
      this.tone(680, 340, 0.09, 'sine', 0.035);
    }
    this.haptic(8);
  }

  open() {
    this.tone(420, 640, 0.14, 'sine', 0.03);
    this.tone(630, 960, 0.16, 'sine', 0.02, 0.03);
  }

  success() {
    this.tone(587.33, 587.33, 0.10, 'sine', 0.035, 0);
    this.tone(783.99, 783.99, 0.11, 'sine', 0.035, 0.055);
    this.tone(1174.66, 1174.66, 0.16, 'sine', 0.03, 0.11);
    this.haptic(10);
  }

  agent() {
    this.tone(980, 1480, 0.07, 'sine', 0.025, 0);
    this.tone(1480, 1960, 0.08, 'sine', 0.018, 0.05);
  }
}

export const sound = new OzoneSoundEngine();
