/**
 * Audio Engine for REMANENCE
 * Combines Web Audio API procedural synthesis with Howler.js.
 * Guarantees zero-dependency immediate sound (deep space drone, Martian wind,
 * radar ping, radio static, telemetry beeps, laser pulses, signal glitch)
 * with optional fallback to local audio files in public/sounds/.
 */

import { Howl } from 'howler';

class AudioManager {
  constructor() {
    this.isMuted = false;
    this.hasInteracted = false;
    this.audioCtx = null;
    this.masterGain = null;
    this.droneGain = null;
    this.windGain = null;
    this.staticGain = null;

    // Active nodes
    this.droneNodes = [];
    this.windNode = null;
    this.staticNode = null;

    // Optional Howler sounds
    this.howlerSounds = {};

    this.currentAtmosphere = 'space'; // 'space' | 'moon' | 'mars' | 'storm' | 'transit'
  }

  init() {
    if (this.audioCtx) return;

    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioContext();

      // Master output
      this.masterGain = this.audioCtx.createGain();
      this.masterGain.gain.setValueAtTime(0.7, this.audioCtx.currentTime);
      this.masterGain.connect(this.audioCtx.destination);

      // Sub-busses
      this.droneGain = this.audioCtx.createGain();
      this.droneGain.gain.setValueAtTime(0.35, this.audioCtx.currentTime);
      this.droneGain.connect(this.masterGain);

      this.windGain = this.audioCtx.createGain();
      this.windGain.gain.setValueAtTime(0.0, this.audioCtx.currentTime);
      this.windGain.connect(this.masterGain);

      this.staticGain = this.audioCtx.createGain();
      this.staticGain.gain.setValueAtTime(0.05, this.audioCtx.currentTime);
      this.staticGain.connect(this.masterGain);

      this._initGenerators();
    } catch (e) {
      console.warn('Web Audio API not supported or blocked:', e);
    }
  }

  unlock() {
    if (this.hasInteracted) return;
    this.hasInteracted = true;

    if (!this.audioCtx) {
      this.init();
    }

    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }

    this.playDrone();
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.audioCtx) {
      const target = this.isMuted ? 0 : 0.7;
      this.masterGain.gain.setTargetAtTime(target, this.audioCtx.currentTime, 0.05);
    }
    return this.isMuted;
  }

  // Set atmosphere according to scroll section
  setAtmosphere(type) {
    if (!this.audioCtx) return;
    this.currentAtmosphere = type;
    const now = this.audioCtx.currentTime;

    switch (type) {
      case 'space':
      case 'earth':
        this.droneGain.gain.setTargetAtTime(0.4, now, 0.4);
        this.windGain.gain.setTargetAtTime(0.0, now, 0.4);
        this.staticGain.gain.setTargetAtTime(0.03, now, 0.4);
        break;

      case 'moon':
        // Lunar vacuum - eerie low silence with subtle resonance
        this.droneGain.gain.setTargetAtTime(0.2, now, 0.5);
        this.windGain.gain.setTargetAtTime(0.0, now, 0.2);
        this.staticGain.gain.setTargetAtTime(0.02, now, 0.3);
        break;

      case 'transit':
        // High static, lonely radio signals
        this.droneGain.gain.setTargetAtTime(0.3, now, 0.4);
        this.windGain.gain.setTargetAtTime(0.0, now, 0.3);
        this.staticGain.gain.setTargetAtTime(0.09, now, 0.3);
        break;

      case 'mars':
        // Thin atmospheric Martian wind
        this.droneGain.gain.setTargetAtTime(0.25, now, 0.4);
        this.windGain.gain.setTargetAtTime(0.25, now, 0.6);
        this.staticGain.gain.setTargetAtTime(0.04, now, 0.4);
        break;

      case 'storm':
        // Opportunity dust storm - howling wind, fading transmission
        this.droneGain.gain.setTargetAtTime(0.15, now, 0.3);
        this.windGain.gain.setTargetAtTime(0.45, now, 0.5);
        this.staticGain.gain.setTargetAtTime(0.08, now, 0.3);
        break;

      case 'finale':
        // Resonant harmonic beacon
        this.droneGain.gain.setTargetAtTime(0.45, now, 0.5);
        this.windGain.gain.setTargetAtTime(0.05, now, 0.4);
        this.staticGain.gain.setTargetAtTime(0.02, now, 0.3);
        break;
    }
  }

  _initGenerators() {
    if (!this.audioCtx) return;

    // Procedural Space Drone (multi-frequency deep harmonic hum)
    const freqs = [55, 110, 164.81, 220]; // A1, A2, E3, A3
    freqs.forEach((freq, idx) => {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      const filter = this.audioCtx.createBiquadFilter();

      osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(260 + idx * 50, this.audioCtx.currentTime);

      gain.gain.setValueAtTime(0.15 / (idx + 1), this.audioCtx.currentTime);

      // Slow LFO modulation for cosmic breathing effect
      const lfo = this.audioCtx.createOscillator();
      const lfoGain = this.audioCtx.createGain();
      lfo.frequency.setValueAtTime(0.08 + idx * 0.03, this.audioCtx.currentTime);
      lfoGain.gain.setValueAtTime(0.04, this.audioCtx.currentTime);

      lfo.connect(lfoGain);
      lfoGain.connect(gain.gain);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.droneGain);

      osc.start();
      lfo.start();

      this.droneNodes.push({ osc, gain, lfo });
    });

    // Procedural Martian Wind Generator (Filtered Noise)
    const bufferSize = this.audioCtx.sampleRate * 2;
    const noiseBuffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.audioCtx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    const windFilter = this.audioCtx.createBiquadFilter();
    windFilter.type = 'bandpass';
    windFilter.frequency.setValueAtTime(320, this.audioCtx.currentTime);
    windFilter.Q.setValueAtTime(3.0, this.audioCtx.currentTime);

    // Modulate wind frequency slowly to simulate gusts
    const windLFO = this.audioCtx.createOscillator();
    const windLFOGain = this.audioCtx.createGain();
    windLFO.frequency.setValueAtTime(0.15, this.audioCtx.currentTime);
    windLFOGain.gain.setValueAtTime(140, this.audioCtx.currentTime);

    windLFO.connect(windLFOGain);
    windLFOGain.connect(windFilter.frequency);

    whiteNoise.connect(windFilter);
    windFilter.connect(this.windGain);

    whiteNoise.start();
    windLFO.start();

    // Procedural Cosmic Radio Static
    const staticBuffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
    const staticData = staticBuffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      staticData[i] = (lastOut + 0.02 * white) / 1.02; // Pink-tinted noise
      lastOut = staticData[i];
      staticData[i] *= 3.5;
    }

    const staticSource = this.audioCtx.createBufferSource();
    staticSource.buffer = staticBuffer;
    staticSource.loop = true;

    const staticFilter = this.audioCtx.createBiquadFilter();
    staticFilter.type = 'highpass';
    staticFilter.frequency.setValueAtTime(900, this.audioCtx.currentTime);

    staticSource.connect(staticFilter);
    staticFilter.connect(this.staticGain);
    staticSource.start();
  }

  playDrone() {
    if (!this.audioCtx) return;
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  // Ping sound: deep resonant telemetry ring
  playPing(pitch = 880, duration = 1.6) {
    if (!this.audioCtx || this.isMuted) return;

    const now = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(pitch, now);
    osc.frequency.exponentialRampToValueAtTime(pitch * 0.7, now + duration);

    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + duration);
  }

  // Heartbeat ping (transit)
  playHeartbeat() {
    if (!this.audioCtx || this.isMuted) return;
    const now = this.audioCtx.currentTime;

    const osc1 = this.audioCtx.createOscillator();
    const gain1 = this.audioCtx.createGain();
    osc1.frequency.setValueAtTime(65, now);
    gain1.gain.setValueAtTime(0.3, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc1.connect(gain1);
    gain1.connect(this.masterGain);
    osc1.start(now);
    osc1.stop(now + 0.15);

    const osc2 = this.audioCtx.createOscillator();
    const gain2 = this.audioCtx.createGain();
    osc2.frequency.setValueAtTime(50, now + 0.18);
    gain2.gain.setValueAtTime(0.25, now + 0.18);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc2.connect(gain2);
    gain2.connect(this.masterGain);
    osc2.start(now + 0.18);
    osc2.stop(now + 0.35);
  }

  // Glitch burst (signal digital distortion)
  playGlitch() {
    if (!this.audioCtx || this.isMuted) return;
    const now = this.audioCtx.currentTime;

    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.setValueAtTime(720, now + 0.04);
    osc.frequency.setValueAtTime(90, now + 0.08);
    osc.frequency.setValueAtTime(1400, now + 0.12);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.setValueAtTime(0.02, now + 0.05);
    gain.gain.setValueAtTime(0.2, now + 0.09);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.22);
  }

  // Laser chirp (Apollo retroreflector)
  playLaserPulse() {
    if (!this.audioCtx || this.isMuted) return;
    const now = this.audioCtx.currentTime;

    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(2400, now);
    osc.frequency.exponentialRampToValueAtTime(440, now + 0.4);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.45);
  }

  // Typewriter telemetry click
  playKeyClick() {
    if (!this.audioCtx || this.isMuted) return;
    const now = this.audioCtx.currentTime;

    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1200 + Math.random() * 400, now);

    gain.gain.setValueAtTime(0.04, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.025);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.025);
  }
}

export const audio = new AudioManager();
