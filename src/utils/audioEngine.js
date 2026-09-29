/**
 * Web Audio Ambient Engine
 * Synthesizes a luxury cinematic deep drone, subtle exhaust rumble, and aerodynamic air sweep
 */
class CinematicAudioEngine {
  constructor() {
    this.ctx = null;
    this.isPlaying = false;
    this.masterGain = null;
    this.osc1 = null;
    this.osc2 = null;
    this.filter = null;
  }

  init() {
    if (this.ctx) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    this.ctx = new AudioContext();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);

    // Deep sub-harmonic tone (engine idle warmth)
    this.osc1 = this.ctx.createOscillator();
    this.osc1.type = "sine";
    this.osc1.frequency.setValueAtTime(48, this.ctx.currentTime); // 48Hz deep warm hum

    // Secondary harmonic texture
    this.osc2 = this.ctx.createOscillator();
    this.osc2.type = "triangle";
    this.osc2.frequency.setValueAtTime(96, this.ctx.currentTime);

    // Warm Lowpass filter
    this.filter = this.ctx.createBiquadFilter();
    this.filter.type = "lowpass";
    this.filter.frequency.setValueAtTime(140, this.ctx.currentTime);
    this.filter.Q.setValueAtTime(2.5, this.ctx.currentTime);

    const gain1 = this.ctx.createGain();
    gain1.gain.setValueAtTime(0.5, this.ctx.currentTime);

    const gain2 = this.ctx.createGain();
    gain2.gain.setValueAtTime(0.2, this.ctx.currentTime);

    this.osc1.connect(gain1);
    gain1.connect(this.filter);

    this.osc2.connect(gain2);
    gain2.connect(this.filter);

    this.filter.connect(this.masterGain);

    this.osc1.start();
    this.osc2.start();
  }

  toggle() {
    if (!this.ctx) this.init();
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }

    if (this.isPlaying) {
      this.stop();
    } else {
      this.start();
    }
    return this.isPlaying;
  }

  start() {
    if (!this.ctx) this.init();
    if (!this.masterGain) return;
    const now = this.ctx.currentTime;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
    this.masterGain.gain.linearRampToValueAtTime(0.28, now + 1.2);
    this.isPlaying = true;
  }

  stop() {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
    this.masterGain.gain.linearRampToValueAtTime(0.0001, now + 0.8);
    this.isPlaying = false;
  }

  // Modulate frequency based on scroll velocity/progress
  modulate(speed = 0) {
    if (!this.isPlaying || !this.filter || !this.ctx) return;
    const now = this.ctx.currentTime;
    const targetFreq = 120 + Math.min(speed * 300, 380);
    this.filter.frequency.setTargetAtTime(targetFreq, now, 0.2);
  }
}

export const audioEngine = new CinematicAudioEngine();
