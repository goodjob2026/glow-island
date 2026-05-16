// AudioManager — Web Audio API wrapper for BGM + SFX
// Falls back silently when AudioContext is unavailable (SSR / restricted environments).

export class AudioManager {
  constructor() {
    this._ctx = null;
    this._bgmSource = null;
    this._bgmGain = null;
    this._bgmBuffer = {};
    this._sfxBuffer = {};
    this._masterGain = null;
    this._muted = false;
    this._comboLevel = 0;
    this._currentBgmKey = null;
    // CRITICAL: expose for audio-qa tests
    if (typeof window !== 'undefined') window._audioManager = this;
  }

  // ── Context init ──────────────────────────────────────────────────────────

  _ensureContext() {
    if (this._ctx) return;
    try {
      this._ctx = new (window.AudioContext || window.webkitAudioContext)();
      this._masterGain = this._ctx.createGain();
      this._masterGain.gain.value = 1.0;
      this._masterGain.connect(this._ctx.destination);
    } catch (e) {
      console.warn('[AudioManager] Web Audio not available:', e);
    }
  }

  /** Resume AudioContext on first user gesture (call from tap handler). */
  async resume() {
    this._ensureContext();
    if (this._ctx && this._ctx.state === 'suspended') {
      await this._ctx.resume();
    }
  }

  // ── Asset loading ─────────────────────────────────────────────────────────

  async loadBGM(key, url) {
    try {
      this._ensureContext();
      if (!this._ctx) return;
      const res = await fetch(url);
      const buf = await res.arrayBuffer();
      this._bgmBuffer[key] = await this._ctx.decodeAudioData(buf);
    } catch (e) {
      console.warn(`[AudioManager] loadBGM failed (${key}):`, e.message);
    }
  }

  async loadSFX(key, url) {
    try {
      this._ensureContext();
      if (!this._ctx) return;
      const res = await fetch(url);
      const buf = await res.arrayBuffer();
      this._sfxBuffer[key] = await this._ctx.decodeAudioData(buf);
    } catch (e) {
      console.warn(`[AudioManager] loadSFX failed (${key}):`, e.message);
    }
  }

  // ── BGM playback ──────────────────────────────────────────────────────────

  playBGM(key, loop = true, volume = 0.6) {
    if (!this._ctx || !this._bgmBuffer[key]) return;
    if (this._currentBgmKey === key) return;

    // Fade out current BGM
    if (this._bgmSource && this._bgmGain) {
      const oldGain = this._bgmGain;
      const oldSource = this._bgmSource;
      oldGain.gain.setTargetAtTime(0, this._ctx.currentTime, 0.1);
      setTimeout(() => { try { oldSource.stop(); } catch (e) {} }, 350);
    }

    this._currentBgmKey = key;
    const source = this._ctx.createBufferSource();
    source.buffer = this._bgmBuffer[key];
    source.loop = loop;

    const gainNode = this._ctx.createGain();
    gainNode.gain.value = 0;
    gainNode.gain.setTargetAtTime(volume, this._ctx.currentTime, 0.1);

    source.connect(gainNode);
    gainNode.connect(this._masterGain);
    source.start();

    this._bgmSource = source;
    this._bgmGain = gainNode;
  }

  stopBGM(fadeMs = 300) {
    if (!this._bgmSource || !this._bgmGain) return;
    this._bgmGain.gain.setTargetAtTime(0, this._ctx.currentTime, fadeMs / 3000);
    const src = this._bgmSource;
    setTimeout(() => { try { src.stop(); } catch (e) {} }, fadeMs + 50);
    this._bgmSource = null;
    this._bgmGain = null;
    this._currentBgmKey = null;
  }

  // ── SFX playback ──────────────────────────────────────────────────────────

  playSFX(key, volume = 1.0) {
    if (!this._ctx || !this._sfxBuffer[key]) return;
    const source = this._ctx.createBufferSource();
    source.buffer = this._sfxBuffer[key];
    // Combo pitch shift: detune = comboLevel * 50 cents (max 200 cents at level 4)
    source.detune.value = this._comboLevel * 50;

    const gainNode = this._ctx.createGain();
    gainNode.gain.value = volume;
    source.connect(gainNode);
    gainNode.connect(this._masterGain);
    source.start();

    // Auto-cleanup
    source.onended = () => {
      try { source.disconnect(); } catch (_) {}
      try { gainNode.disconnect(); } catch (_) {}
    };
  }

  // ── Combo / volume / mute ─────────────────────────────────────────────────

  setComboLevel(n) {
    this._comboLevel = Math.min(Math.max(0, n), 4);
  }

  setMasterVolume(v) {
    if (!this._masterGain) return;
    this._masterGain.gain.value = Math.max(0, Math.min(1, v));
  }

  mute(bool) {
    this._muted = bool;
    if (!this._masterGain) return;
    this._masterGain.gain.value = bool ? 0 : 1.0;
  }

  isMuted() {
    return this._muted;
  }
}
