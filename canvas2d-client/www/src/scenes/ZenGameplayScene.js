// ZenGameplayScene.js — wraps GameplayScene with zenMode=true (composition)

import { GameplayScene } from './GameplayScene.js';

export class ZenGameplayScene {
  /**
   * @param {import('../SceneManager.js').SceneManager} sceneManager
   * @param {object} renderer  - { ctx, lw, lh, dpr, canvas }
   * @param {object} assets
   * @param {object} audio
   * @param {import('../ProgressManager.js').ProgressManager} progress
   */
  constructor(sceneManager, renderer, assets, audio, progress) {
    this._sm       = sceneManager;
    this._renderer = renderer;
    this._assets   = assets;
    this._audio    = audio;
    this._pm       = progress;
    this._inner    = new GameplayScene(sceneManager, renderer, assets, audio, progress);
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  /**
   * @param {{ chapter?: number, level?: number }} params
   */
  init(params = {}) {
    this._inner.init({ ...params, zenMode: true });
    // Override BGM to zen ambient track
    this._audio?.playBGM?.('bgm_zen_ambient');
  }

  update(dt)   { this._inner.update(dt); }
  draw()       { this._inner.draw(); }
  destroy()    { this._inner.destroy(); }
  onTap(x, y) { this._inner.onTap(x, y); }
  onBack()     { this._inner.onBack(); }
  resize(w, h) { this._inner.resize?.(w, h); }
}
