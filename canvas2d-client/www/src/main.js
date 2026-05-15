import { Renderer } from './engine/Renderer.js';
import { AssetLoader } from './engine/AssetLoader.js';
import { GameScene } from './scenes/GameScene.js';

const canvas = document.getElementById('game');
const renderer = new Renderer(canvas);
const assets = new AssetLoader();

// Fit canvas to screen (portrait-first, 9:16 preferred)
function resize() {
  const W = window.innerWidth;
  const H = window.innerHeight;
  renderer.resize(W, H);
  if (typeof scene !== 'undefined' && scene) scene.resize();
}
window.addEventListener('resize', resize);
renderer.resize(window.innerWidth, window.innerHeight);

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
