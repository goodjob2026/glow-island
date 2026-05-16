// SceneManager — fade-transition scene stack for Glow Island
//
// Scene interface (all scenes should implement):
//   constructor(sceneManager, renderer, assets, audio, progress)
//   init(params = {})
//   update(dt)
//   draw()
//   destroy()
//   onTap(x, y)
//   onBack()
//   resize(w, h)
//
// SceneManager calls optional methods gracefully — missing methods are skipped.

const FADE_DURATION = 0.3; // seconds

export class SceneManager {
  /**
   * @param {object} renderer  - Renderer instance ({ ctx, lw, lh, dpr, canvas })
   * @param {object} assets    - AssetLoader instance
   * @param {object} audio     - AudioManager instance
   * @param {object} progress  - ProgressManager instance
   */
  constructor(renderer, assets, audio, progress) {
    this._renderer = renderer;
    this._assets   = assets;
    this._audio    = audio;
    this._progress = progress;

    /** @type {Array<{scene: object, SceneClass: Function, params: object}>} */
    this._stack = [];

    // Fade state
    this._fadeAlpha  = 0;         // 0 = transparent, 1 = fully black
    this._fadeDir    = 0;         // -1 = fade in, 1 = fade out, 0 = idle
    this._fadeTimer  = 0;
    this._fadeDone   = null;      // callback invoked when fade-out finishes

    // Pending transition queued while a fade is in progress
    this._pending    = null;      // { SceneClass, params, action: 'go'|'push'|'pop' }
  }

  // ── Public navigation ─────────────────────────────────────────────────────

  /** Replace the entire stack with a new scene. */
  go(SceneClass, params = {}) {
    this._requestTransition({ SceneClass, params, action: 'go' });
  }

  /** Push a new scene on top of the stack. */
  push(SceneClass, params = {}) {
    this._requestTransition({ SceneClass, params, action: 'push' });
  }

  /** Pop the top scene and resume the one beneath. */
  pop() {
    this._requestTransition({ SceneClass: null, params: {}, action: 'pop' });
  }

  // ── Game-loop hooks ───────────────────────────────────────────────────────

  update(dt) {
    this._updateFade(dt);

    const top = this._topScene();
    if (top) this._callOptional(top, 'update', dt);
  }

  draw() {
    const top = this._topScene();
    if (top) this._callOptional(top, 'draw');

    // Draw fade overlay
    if (this._fadeAlpha > 0) {
      const { ctx, canvas, dpr } = this._renderer;
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0); // reset transform — draw in physical pixels
      ctx.globalAlpha = this._fadeAlpha;
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.globalAlpha = 1;
      ctx.restore();
      // Restore the logical transform
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
  }

  handleTap(x, y) {
    // Resume AudioContext on first user gesture
    if (this._audio && this._audio._resumeIfSuspended) {
      this._audio._resumeIfSuspended();
    }
    const top = this._topScene();
    if (top) this._callOptional(top, 'onTap', x, y);
  }

  handleBack() {
    const top = this._topScene();
    if (top) this._callOptional(top, 'onBack');
  }

  handleResize(w, h) {
    // Notify every scene in the stack
    for (const entry of this._stack) {
      this._callOptional(entry.scene, 'resize', w, h);
    }
  }

  // ── Transition internals ──────────────────────────────────────────────────

  _requestTransition(pending) {
    if (this._fadeDir !== 0) {
      // A fade is already in progress — queue the latest request
      this._pending = pending;
      return;
    }

    if (this._stack.length === 0) {
      // No current scene — skip fade-out, go straight to fade-in
      this._applyTransition(pending);
      this._startFadeIn();
      return;
    }

    // Save pending and start fade-out
    this._pending = pending;
    this._startFadeOut(() => {
      const p = this._pending;
      this._pending = null;
      this._applyTransition(p);
      this._startFadeIn();
    });
  }

  _applyTransition({ SceneClass, params, action }) {
    if (action === 'go') {
      // Destroy all scenes in stack
      for (let i = this._stack.length - 1; i >= 0; i--) {
        this._callOptional(this._stack[i].scene, 'destroy');
      }
      this._stack = [];
      this._pushScene(SceneClass, params);

    } else if (action === 'push') {
      this._pushScene(SceneClass, params);

    } else if (action === 'pop') {
      if (this._stack.length > 0) {
        const top = this._stack.pop();
        this._callOptional(top.scene, 'destroy');
      }
      // The scene beneath is now the top — no further action needed
    }
  }

  _pushScene(SceneClass, params) {
    let scene;
    // Detect legacy scenes that only accept (renderer, assets).
    // Static flag opt-in: set SceneClass.useLegacyConstructor = true on old scenes,
    // OR fall back by constructor arity (2 args → legacy).
    const useLegacy = SceneClass.useLegacyConstructor ||
                      (!SceneClass.useSceneManagerConstructor && SceneClass.length <= 2);
    if (useLegacy) {
      scene = new SceneClass(this._renderer, this._assets);
    } else {
      try {
        scene = new SceneClass(this, this._renderer, this._assets, this._audio, this._progress);
      } catch (err) {
        console.warn('[SceneManager] 5-arg constructor failed, falling back to legacy:', err.message);
        scene = new SceneClass(this._renderer, this._assets);
      }
    }
    this._callOptional(scene, 'init', params);
    this._stack.push({ scene, SceneClass, params });
  }

  // ── Fade helpers ──────────────────────────────────────────────────────────

  _startFadeOut(onDone) {
    this._fadeAlpha = 0;
    this._fadeDir   = 1;
    this._fadeTimer = 0;
    this._fadeDone  = onDone;
  }

  _startFadeIn() {
    this._fadeAlpha = 1;
    this._fadeDir   = -1;
    this._fadeTimer = 0;
    this._fadeDone  = null;
  }

  _updateFade(dt) {
    if (this._fadeDir === 0) return;

    this._fadeTimer += dt;
    const t = Math.min(1, this._fadeTimer / FADE_DURATION);

    if (this._fadeDir === 1) {
      // Fade out: 0 → 1
      this._fadeAlpha = t;
      if (t >= 1) {
        this._fadeDir  = 0;
        this._fadeTimer = 0;
        if (this._fadeDone) {
          const cb = this._fadeDone;
          this._fadeDone = null;
          cb();
        }
      }
    } else {
      // Fade in: 1 → 0
      this._fadeAlpha = 1 - t;
      if (t >= 1) {
        this._fadeAlpha = 0;
        this._fadeDir   = 0;
        this._fadeTimer  = 0;
      }
    }
  }

  // ── Utilities ─────────────────────────────────────────────────────────────

  _topScene() {
    if (this._stack.length === 0) return null;
    return this._stack[this._stack.length - 1].scene;
  }

  _callOptional(scene, method, ...args) {
    if (scene && typeof scene[method] === 'function') {
      try {
        scene[method](...args);
      } catch (err) {
        console.error(`[SceneManager] ${scene.constructor?.name}.${method}() threw:`, err);
      }
    }
  }
}
