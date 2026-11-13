class SoundEngine {
  private ctx: AudioContext | null = null;
  private enabled = true;
  private musicTimer: ReturnType<typeof setInterval> | null = null;
  private musicPlaying = false;
  private step = 0;

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  public setEnabled(val: boolean): void {
    this.enabled = val;
    if (!val) {
      this.stopMusic();
    }
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public unlock(): void {
    this.ensureContext();
  }

  private playTone(
    freq: number,
    duration: number,
    type: OscillatorType = 'triangle',
    gainLevel = 0.14,
    delay = 0
  ): void {
    if (!this.enabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(gainLevel, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  public playTap(): void {
    this.playTone(540, 0.06, 'sine', 0.08, 0);
  }

  public playCorrect(): void {
    this.playTone(523.25, 0.12, 'triangle', 0.16, 0);
    this.playTone(659.25, 0.12, 'triangle', 0.16, 0.07);
    this.playTone(783.99, 0.22, 'triangle', 0.18, 0.14);
  }

  public playWrong(): void {
    this.playTone(220, 0.14, 'sine', 0.14, 0);
    this.playTone(174.61, 0.22, 'sine', 0.12, 0.1);
  }

  public playStart(): void {
    this.playTone(440, 0.12, 'triangle', 0.14, 0);
    this.playTone(554.37, 0.12, 'triangle', 0.14, 0.12);
    this.playTone(880, 0.28, 'triangle', 0.18, 0.24);
  }

  public playCountdownBeep(isGo = false): void {
    if (isGo) {
      this.playTone(880, 0.28, 'triangle', 0.2, 0);
      this.playTone(1046.5, 0.3, 'triangle', 0.16, 0.06);
    } else {
      this.playTone(440, 0.11, 'triangle', 0.15, 0);
    }
  }

  public playUrgentTick(): void {
    this.playTone(660, 0.05, 'sine', 0.08, 0);
  }

  /**
   * Festive finish celebration: triumphant fanfare + realistic synthesized crowd applause & supporter cheer!
   */
  public playFinishCheer(): void {
    if (!this.enabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    // 1. Triumphant Fanfare Arpeggio
    this.playTone(523.25, 0.14, 'triangle', 0.18, 0);
    this.playTone(659.25, 0.14, 'triangle', 0.18, 0.1);
    this.playTone(783.99, 0.14, 'triangle', 0.18, 0.2);
    this.playTone(1046.5, 0.55, 'triangle', 0.22, 0.3);

    // 2. Crowd Applause ("Tepuk Tangan") using shaped noise bursts
    const duration = 2.8;
    const sampleRate = ctx.sampleRate;
    const bufferSize = Math.floor(sampleRate * duration);
    const noiseBuffer = ctx.createBuffer(1, bufferSize, sampleRate);
    const data = noiseBuffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    // Continuous crowd murmur/applause bed
    const bedSource = ctx.createBufferSource();
    bedSource.buffer = noiseBuffer;

    const bedFilter = ctx.createBiquadFilter();
    bedFilter.type = 'bandpass';
    bedFilter.frequency.setValueAtTime(1450, ctx.currentTime);
    bedFilter.Q.setValueAtTime(0.85, ctx.currentTime);

    const bedGain = ctx.createGain();
    const t0 = ctx.currentTime + 0.05;
    bedGain.gain.setValueAtTime(0.0001, t0);
    bedGain.gain.linearRampToValueAtTime(0.11, t0 + 0.25);
    bedGain.gain.setValueAtTime(0.11, t0 + 1.4);
    bedGain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);

    bedSource.connect(bedFilter);
    bedFilter.connect(bedGain);
    bedGain.connect(ctx.destination);
    bedSource.start(t0);
    bedSource.stop(t0 + duration + 0.05);

    // Individual crisp clap transients layered on top
    const clapCount = 26;
    for (let c = 0; c < clapCount; c++) {
      const clapOffset = 0.08 + (c / clapCount) * 2.1 + Math.random() * 0.08;
      const clapStart = ctx.currentTime + clapOffset;
      const clapSrc = ctx.createBufferSource();
      clapSrc.buffer = noiseBuffer;

      const clapFilter = ctx.createBiquadFilter();
      clapFilter.type = 'bandpass';
      clapFilter.frequency.setValueAtTime(1100 + Math.random() * 1400, clapStart);
      clapFilter.Q.setValueAtTime(2.2, clapStart);

      const clapGain = ctx.createGain();
      const peak = (0.08 + Math.random() * 0.07) * (1 - c / (clapCount * 1.4));
      clapGain.gain.setValueAtTime(0.0001, clapStart);
      clapGain.gain.linearRampToValueAtTime(peak, clapStart + 0.008);
      clapGain.gain.exponentialRampToValueAtTime(0.0001, clapStart + 0.065);

      clapSrc.connect(clapFilter);
      clapFilter.connect(clapGain);
      clapGain.connect(ctx.destination);
      clapSrc.start(clapStart, Math.random() * 0.5, 0.08);
    }

    // 3. Supporter Crowd Cheer Swell ("Horeee!")
    const cheerVoices = [261.63, 329.63, 392.0, 523.25];
    cheerVoices.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      const start = ctx.currentTime + 0.15 + idx * 0.03;
      osc.frequency.setValueAtTime(freq * 0.94, start);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.03, start + 0.45);
      osc.frequency.exponentialRampToValueAtTime(freq, start + 1.4);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(950, start);
      filter.frequency.exponentialRampToValueAtTime(1800, start + 0.5);

      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.linearRampToValueAtTime(0.035, start + 0.28);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 1.6);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 1.65);
    });
  }

  public playVictory(): void {
    this.playFinishCheer();
  }

  public playDefeat(): void {
    this.playTone(392.0, 0.16, 'sine', 0.12, 0);
    this.playTone(329.63, 0.16, 'sine', 0.12, 0.14);
    this.playTone(261.63, 0.3, 'sine', 0.14, 0.28);
  }

  public startMusic(): boolean {
    if (this.musicPlaying) return true;
    const ctx = this.ensureContext();
    if (!ctx) return false;
    if (ctx.state === 'suspended') {
      void ctx.resume();
    }

    this.musicPlaying = true;
    this.step = 0;

    // Cheerful school sports pentatonic melody loop (C major)
    const melody = [523.25, 659.25, 783.99, 659.25, 880.0, 783.99, 659.25, 587.33];
    const bass = [130.81, 0, 196.0, 0, 174.61, 0, 196.0, 0];

    this.musicTimer = setInterval(() => {
      if (!this.musicPlaying || !this.enabled) return;
      const idx = this.step % melody.length;
      this.playTone(melody[idx], 0.18, 'triangle', 0.055, 0);
      if (bass[idx] > 0) {
        this.playTone(bass[idx], 0.22, 'sine', 0.05, 0);
      }
      this.step++;
    }, 260);

    return true;
  }

  public stopMusic(): void {
    this.musicPlaying = false;
    if (this.musicTimer) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }

  public isMusicPlaying(): boolean {
    return this.musicPlaying;
  }
}

export const soundEngine = new SoundEngine();
