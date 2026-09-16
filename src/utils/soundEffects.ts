// High-fidelity Sound Engine with Apple Pay / iOS sound effects & Web Audio zero-latency buffering

class SoundEngine {
  private ctx: AudioContext | null = null;
  private correctBuffer: AudioBuffer | null = null;
  private wrongBuffer: AudioBuffer | null = null;
  private correctAudio: HTMLAudioElement | null = null;
  private wrongAudio: HTMLAudioElement | null = null;
  private isPreloaded = false;

  constructor() {
    if (typeof window !== 'undefined') {
      // Preload HTML5 Audio as immediate backup
      try {
        this.correctAudio = new Audio('/sounds/correct.mp3');
        this.correctAudio.preload = 'auto';
        this.correctAudio.volume = 0.85;

        this.wrongAudio = new Audio('/sounds/wrong.mp3');
        this.wrongAudio.preload = 'auto';
        this.wrongAudio.volume = 0.8;
      } catch (_) {}

      // Preload Web Audio buffers for instant 0ms latency playback
      this.preloadBuffers();
    }
  }

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private async preloadBuffers() {
    if (this.isPreloaded) return;
    this.isPreloaded = true;

    try {
      const [resCorrect, resWrong] = await Promise.all([
        fetch('/sounds/correct.mp3'),
        fetch('/sounds/wrong.mp3')
      ]);

      const [bufCorrect, bufWrong] = await Promise.all([
        resCorrect.arrayBuffer(),
        resWrong.arrayBuffer()
      ]);

      const ctx = this.getContext();
      if (ctx) {
        // Decode in parallel
        ctx.decodeAudioData(
          bufCorrect.slice(0),
          (decoded) => {
            this.correctBuffer = decoded;
          },
          () => {}
        );
        ctx.decodeAudioData(
          bufWrong.slice(0),
          (decoded) => {
            this.wrongBuffer = decoded;
          },
          () => {}
        );
      }
    } catch (_) {
      // Quietly continue if offline or blocked
    }
  }

  /**
   * Plays sound from an in-memory AudioBuffer (0ms latency, supports unlimited rapid replays)
   */
  private playBuffer(buffer: AudioBuffer, volume = 0.85): boolean {
    const ctx = this.getContext();
    if (!ctx || ctx.state !== 'running') return false;

    try {
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(volume, ctx.currentTime);
      source.connect(gain);
      gain.connect(ctx.destination);
      source.start(0);
      return true;
    } catch (_) {
      return false;
    }
  }

  /**
   * Plays sound from an HTML5 Audio Element as instant fallback
   */
  private playAudioElement(src: string, volume = 0.85) {
    try {
      const a = new Audio(src);
      a.volume = volume;
      a.play().catch(() => {});
    } catch (_) {}
  }

  /**
   * Apple Pay / App Store payment confirmation chime (Correct Answer)
   */
  playCorrect() {
    // 1. Try zero-latency Web Audio buffer
    if (this.correctBuffer && this.playBuffer(this.correctBuffer, 0.9)) {
      return;
    }

    // 2. Try HTML5 Audio
    this.playAudioElement('/sounds/correct.mp3', 0.9);

    // 3. Fallback: Synthesize Apple Pay rising double chime if audio unavailable
    const ctx = this.getContext();
    if (!ctx) return;
    this.playCorrectSynthesized(ctx);
  }

  /**
   * Apple Pay / iOS rejection double-thud tone (Wrong Answer)
   */
  playWrong() {
    // 1. Try zero-latency Web Audio buffer
    if (this.wrongBuffer && this.playBuffer(this.wrongBuffer, 0.85)) {
      return;
    }

    // 2. Try HTML5 Audio
    this.playAudioElement('/sounds/wrong.mp3', 0.85);

    // 3. Fallback: Synthesize iOS double-bump rejection if audio unavailable
    const ctx = this.getContext();
    if (!ctx) return;
    this.playWrongSynthesized(ctx);
  }

  /**
   * Synthesizer fallback: Apple Pay-like harmonic double chime
   */
  private playCorrectSynthesized(ctx: AudioContext) {
    const now = ctx.currentTime;

    // Note 1: Clear bell chime (C6 ~ 1046.5Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(1046.5, now);
    gain1.gain.setValueAtTime(0.12, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    // Note 2: Higher resonant chime (E6 ~ 1318.5Hz) starting 90ms later
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1318.51, now + 0.09);
    gain2.gain.setValueAtTime(0.18, now + 0.09);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.09);
    osc2.stop(now + 0.55);
  }

  /**
   * Synthesizer fallback: iOS-like subtle double rejection pulse
   */
  private playWrongSynthesized(ctx: AudioContext) {
    const now = ctx.currentTime;

    // Pulse 1
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(140, now);
    osc1.frequency.exponentialRampToValueAtTime(80, now + 0.12);
    gain1.gain.setValueAtTime(0.15, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.12);

    // Pulse 2 (double-tap)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(120, now + 0.15);
    osc2.frequency.exponentialRampToValueAtTime(70, now + 0.28);
    gain2.gain.setValueAtTime(0.12, now + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.15);
    osc2.stop(now + 0.28);
  }

  /**
   * Victory fanfare for Phase 6 Summary
   */
  playVictory() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.1);

      gain.gain.setValueAtTime(0.15, now + idx * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.1);
      osc.stop(now + idx * 0.1 + 0.4);
    });
  }

  /**
   * Crisp UI touch / click sound
   */
  playClick() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.05);
  }
}

export const sounds = new SoundEngine();
