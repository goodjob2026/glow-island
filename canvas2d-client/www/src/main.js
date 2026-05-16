import { Renderer }         from './engine/Renderer.js';
import { AssetLoader }      from './engine/AssetLoader.js';
import { SceneManager }     from './SceneManager.js';
import { ProgressManager }  from './ProgressManager.js';
import { AudioManager }     from './AudioManager.js';
import { GameScene }        from './scenes/GameScene.js';

// ── Design resolution ──────────────────────────────────────────────────────
const LOGICAL_W = 390;
const LOGICAL_H = 844;

// ── Canvas setup ───────────────────────────────────────────────────────────
let canvas = document.getElementById('game');
if (!canvas) {
  canvas = document.createElement('canvas');
  canvas.id = 'game';
  document.body.appendChild(canvas);
}

// Basic positioning styles so the canvas centres itself inside the body
canvas.style.display  = 'block';
canvas.style.position = 'absolute';
canvas.style.touchAction = 'none';

// ── Renderer ───────────────────────────────────────────────────────────────
const renderer = new Renderer(canvas);

// ── Asset loader ───────────────────────────────────────────────────────────
const assets = new AssetLoader();

// Load tile sprites — fire-and-forget; scenes render gracefully without them
assets.loadAll([
  ['tile_01', 'assets/tiles/tile_01.png'],
  ['tile_02', 'assets/tiles/tile_02.png'],
  ['tile_03', 'assets/tiles/tile_03.png'],
  ['tile_04', 'assets/tiles/tile_04.png'],
  ['tile_05', 'assets/tiles/tile_05.png'],
  ['bg',      'assets/backgrounds/ch01_harbor_before.png'],
]).catch(() => {}); // swallow network errors

// ── Progress ───────────────────────────────────────────────────────────────
const progress = new ProgressManager();
progress.load();

// ── Audio ──────────────────────────────────────────────────────────────────
const audio = new AudioManager();

// ── Scene manager ──────────────────────────────────────────────────────────
const sceneManager = new SceneManager(renderer, assets, audio, progress);

// ── Resize handler ─────────────────────────────────────────────────────────
function resize() {
  const sw  = window.innerWidth;
  const sh  = window.innerHeight;
  const dpr = window.devicePixelRatio || 1;

  // Fit the design aspect ratio (portrait) inside the window with letterboxing
  let cssW, cssH;
  if (sh / sw > LOGICAL_H / LOGICAL_W) {
    // Window is taller than design → fit width
    cssW = sw;
    cssH = Math.round(sw * LOGICAL_H / LOGICAL_W);
  } else {
    // Window is wider than design → fit height
    cssH = sh;
    cssW = Math.round(sh * LOGICAL_W / LOGICAL_H);
  }

  // CSS positioning — centred
  canvas.style.width  = cssW + 'px';
  canvas.style.height = cssH + 'px';
  canvas.style.left   = Math.round((sw - cssW) / 2) + 'px';
  canvas.style.top    = Math.round((sh - cssH) / 2) + 'px';

  // Physical pixel resolution
  const physW = Math.round(cssW * dpr);
  const physH = Math.round(cssH * dpr);

  canvas.width  = physW;
  canvas.height = physH;

  // Tell renderer: now logical dimensions are the CSS size (not LOGICAL_W/H
  // because the game board uses renderer.width/height in physical px for layout)
  renderer.resize(physW, physH, dpr);

  // Notify all active scenes (logical dimensions)
  sceneManager.handleResize(renderer.lw, renderer.lh);
}

window.addEventListener('resize', resize);
resize();

// ── Initial scene ──────────────────────────────────────────────────────────
// Use go() so the SceneManager owns the lifecycle from the start.
// SceneManager._pushScene falls back to the legacy (renderer, assets) constructor
// if GameScene doesn't accept the new 5-arg signature.
sceneManager.go(GameScene);

// ── Input ──────────────────────────────────────────────────────────────────
function toLogical(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  // rect.width / rect.height are the CSS dimensions
  const relX = clientX - rect.left;
  const relY = clientY - rect.top;
  // Map from CSS pixels → logical pixels
  // renderer.lw = Math.round(physW / dpr), which equals cssW for integer dpr
  const lx = relX * (renderer.lw / rect.width);
  const ly = relY * (renderer.lh / rect.height);
  return { x: lx, y: ly };
}

canvas.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  const { x, y } = toLogical(e.clientX, e.clientY);
  sceneManager.handleTap(x, y);
});

// Hardware back button (Android)
window.addEventListener('popstate', () => {
  sceneManager.handleBack();
});

// ── Game loop ──────────────────────────────────────────────────────────────
let lastTime = performance.now();

function loop(now) {
  const dt = Math.min((now - lastTime) / 1000, 0.05); // cap at 50ms
  lastTime = now;

  sceneManager.update(dt);
  sceneManager.draw();

  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
