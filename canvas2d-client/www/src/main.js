import { Renderer } from './engine/Renderer.js';
import { AssetLoader } from './engine/AssetLoader.js';
import { GameScene } from './scenes/GameScene.js';

const canvas = document.getElementById('game');
const renderer = new Renderer(canvas);
const assets = new AssetLoader();

// Design resolution: 390×844 (portrait, ~9:19 like iPhone 14)
// On real devices the canvas fills the full screen.
// On desktop/tablet we letterbox: maintain portrait aspect, center horizontally.
const DESIGN_W = 390;
const DESIGN_H = 844;

function resize() {
  const sw = window.innerWidth;
  const sh = window.innerHeight;
  let w, h;
  if (sh / sw > DESIGN_H / DESIGN_W) {
    // Taller than design → fit width, letterbox top/bottom
    w = sw;
    h = Math.round(sw * DESIGN_H / DESIGN_W);
  } else {
    // Wider than design → fit height, letterbox left/right
    h = sh;
    w = Math.round(sh * DESIGN_W / DESIGN_H);
  }
  canvas.style.width  = w + 'px';
  canvas.style.height = h + 'px';
  canvas.style.position = 'absolute';
  canvas.style.left = Math.round((sw - w) / 2) + 'px';
  canvas.style.top  = Math.round((sh - h) / 2) + 'px';
  // Internal resolution matches physical pixels for sharpness on mobile
  const dpr = window.devicePixelRatio || 1;
  canvas.width  = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  renderer.resize(canvas.width, canvas.height, dpr);
  if (typeof scene !== 'undefined' && scene && scene.resize) scene.resize(canvas.width, canvas.height);
}
window.addEventListener('resize', resize);
resize();

// Load tile sprites — bundled in assets/ directory
assets.loadAll([
  ['tile_01', 'assets/tiles/tile_01.png'],
  ['tile_02', 'assets/tiles/tile_02.png'],
  ['tile_03', 'assets/tiles/tile_03.png'],
  ['tile_04', 'assets/tiles/tile_04.png'],
  ['tile_05', 'assets/tiles/tile_05.png'],
  ['bg',      'assets/backgrounds/ch01_harbor_before.png'],
]).then(() => console.log('[assets] loaded'));

let scene = new GameScene(renderer, assets);

// Touch / mouse input
function getPos(e) {
  const rect = canvas.getBoundingClientRect();
  const src = e.touches ? e.touches[0] : e;
  return { x: src.clientX - rect.left, y: src.clientY - rect.top };
}
canvas.addEventListener('pointerdown', e => {
  e.preventDefault();
  const { x, y } = getPos(e);
  scene.onTap(x, y);
});

// Game loop
let last = performance.now();
function loop(now) {
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;
  scene.update(dt);
  scene.draw();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
