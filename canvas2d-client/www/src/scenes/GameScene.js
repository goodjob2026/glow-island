import { TileGrid, ROWS, COLS } from '../game/TileGrid.js';
import { LEVELS } from '../data/level-data.js';

const TILE_COLORS = ['', '#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6'];
const TILE_GLOW   = ['', '#ff6b6b', '#74b9ff', '#55efc4', '#fdcb6e', '#d6a2e8'];
const TILE_NAMES  = ['', 'coral', 'wave', 'leaf', 'sun', 'shell'];

// Default level data for the standalone GameScene (level 1-1)
const DEFAULT_LEVEL = LEVELS['1-1'];

export class GameScene {
  constructor(renderer, assets) {
    this.r = renderer;
    this.assets = assets;
    this.grid = new TileGrid(DEFAULT_LEVEL);
    this.score = 0;
    this.pairs = 0;
    this.floatingTexts = [];
    this.vanishAnim = [];   // [{r1,c1,r2,c2,path,t}] — matched pair fading out
    this.shakeAnim = [];    // [{row,col,t,ox}] — shake on no-path
    this.winState = false;
    this.noMoveState = false;

    this.grid.onMatch = ({ r1, c1, r2, c2, path }) => {
      this.pairs++;
      this.score += 100;
      this.vanishAnim.push({ r1, c1, r2, c2, path, t: 1.0 });
      this._addFloat('+100', r1, c1);
      if (this.grid.isCleared()) this.winState = true;
      else if (!this.grid.hasMoves()) this.noMoveState = true;
    };

    this.grid.onNoPath = ({ r1, c1, r2, c2 }) => {
      this.shakeAnim.push({ row: r1, col: c1, t: 1.0 });
      this.shakeAnim.push({ row: r2, col: c2, t: 1.0 });
    };

    this._layout();
  }

  _layout() {
    // Use logical (CSS-pixel) dimensions — ctx is scaled by dpr via setTransform
    const lw = this.r.lw || this.r.width;
    const lh = this.r.lh || this.r.height;
    const hudH = Math.round(lh * 0.12);
    const pad = Math.round(lw * 0.03);
    const boardW = lw - pad * 2;
    const tileSize = Math.floor(boardW / COLS);
    const boardH = tileSize * ROWS;
    const boardY = hudH + pad;
    this.layout = { hudH, pad, tileSize, boardW, boardH, boardX: pad, boardY, lw, lh };
  }

  resize() { this._layout(); }

  tileAt(px, py) {
    const { boardX, boardY, tileSize } = this.layout;
    const col = Math.floor((px - boardX) / tileSize);
    const row = Math.floor((py - boardY) / tileSize);
    if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return null;
    return { row, col };
  }

  onTap(px, py) {
    if (this.winState) { this._restart(); return; }
    if (this.noMoveState) { this.grid.shuffle(); this.noMoveState = false; return; }
    const cell = this.tileAt(px, py);
    if (!cell) return;
    this.grid.select(cell.row, cell.col);
  }

  _restart() {
    this.grid = new TileGrid(DEFAULT_LEVEL);
    this.score = 0;
    this.pairs = 0;
    this.floatingTexts = [];
    this.vanishAnim = [];
    this.shakeAnim = [];
    this.winState = false;
    this.noMoveState = false;
    this.grid.onMatch = ({ r1, c1, r2, c2, path }) => {
      this.pairs++;
      this.score += 100;
      this.vanishAnim.push({ r1, c1, r2, c2, path, t: 1.0 });
      this._addFloat('+100', r1, c1);
      if (this.grid.isCleared()) this.winState = true;
      else if (!this.grid.hasMoves()) this.noMoveState = true;
    };
    this.grid.onNoPath = ({ r1, c1, r2, c2 }) => {
      this.shakeAnim.push({ row: r1, col: c1, t: 1.0 });
      this.shakeAnim.push({ row: r2, col: c2, t: 1.0 });
    };
  }

  _addFloat(text, row, col) {
    const { boardX, boardY, tileSize } = this.layout;
    this.floatingTexts.push({
      text, t: 1.0,
      x: boardX + col * tileSize + tileSize / 2,
      y: boardY + row * tileSize,
    });
  }

  update(dt) {
    this.vanishAnim = this.vanishAnim.filter(a => { a.t -= dt * 2.5; return a.t > 0; });
    this.shakeAnim  = this.shakeAnim.filter(a  => { a.t -= dt * 4;   return a.t > 0; });
    this.floatingTexts = this.floatingTexts.filter(ft => {
      ft.y -= dt * 55; ft.t -= dt * 2; return ft.t > 0;
    });
  }

  draw() {
    this.r.clear('#1a1a2e');
    this._drawBg();
    this._drawHUD();
    this._drawBoard();
    this._drawPaths();
    this._drawFloatingTexts();
    if (this.winState)    this._drawOverlay('🎉 CLEARED!', 'Tap to play again', '#f9ca24');
    if (this.noMoveState) this._drawOverlay('No moves left', 'Tap to shuffle', '#e17055');
  }

  _drawBg() {
    const { lw, lh } = this.layout;
    const bg = this.assets.get('bg');
    if (bg) this.r.image(bg, 0, 0, lw, lh);
    else this.r.roundRect(0, 0, lw, lh, 0, '#0f3460', null);
  }

  _drawHUD() {
    const { r } = this;
    const { hudH, pad, lw } = this.layout;
    r.roundRect(pad, pad / 2, lw - pad * 2, hudH - pad, 12, 'rgba(255,255,255,0.08)', 'rgba(255,255,255,0.15)', 1);
    r.text('SCORE', pad * 2, pad * 0.8, { size: 11, color: 'rgba(255,255,255,0.6)', weight: 'bold', align: 'left' });
    r.text(String(this.score), pad * 2, pad * 0.8 + 14, { size: 22, color: '#f9ca24', weight: 'bold', align: 'left', shadow: '#e55039', shadowBlur: 6 });
    r.text('PAIRS', lw - pad * 2, pad * 0.8, { size: 11, color: 'rgba(255,255,255,0.6)', weight: 'bold', align: 'right' });
    const total = ROWS * COLS / 2;
    r.text(`${this.pairs}/${total}`, lw - pad * 2, pad * 0.8 + 14, { size: 22, color: '#dfe6e9', weight: 'bold', align: 'right' });
    r.text('GLOW ISLAND', lw / 2, pad * 0.8 + 6, { size: 14, color: 'rgba(255,255,255,0.85)', weight: 'bold', align: 'center', baseline: 'middle' });
  }

  _drawBoard() {
    const { r } = this;
    const { boardX, boardY, tileSize, boardW, boardH } = this.layout;
    const gap = Math.max(2, Math.round(tileSize * 0.06));
    const ts = tileSize - gap;
    const corner = Math.round(ts * 0.18);

    r.roundRect(boardX - gap, boardY - gap, boardW + gap * 2, boardH + gap * 2, 10, 'rgba(255,255,255,0.05)', 'rgba(255,255,255,0.1)', 1);

    const sel = this.grid.selected;
    const vanishSet = new Set();
    for (const a of this.vanishAnim) { vanishSet.add(`${a.r1},${a.c1}`); vanishSet.add(`${a.r2},${a.c2}`); }
    const shakeMap = {};
    for (const a of this.shakeAnim) shakeMap[`${a.row},${a.col}`] = a;

    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const type = this.grid.grid[row][col];
        if (!type) continue;

        const key = `${row},${col}`;
        const vanishAlpha = vanishSet.has(key)
          ? (this.vanishAnim.find(a => `${a.r1},${a.c1}` === key || `${a.r2},${a.c2}` === key)?.t ?? 1)
          : 1;

        const shake = shakeMap[key];
        const ox = shake ? Math.sin(shake.t * Math.PI * 6) * 5 * shake.t : 0;

        const x = boardX + col * tileSize + gap / 2 + ox;
        const y = boardY + row * tileSize + gap / 2;
        const isSelected = sel && sel.row === row && sel.col === col;

        r.ctx.globalAlpha = vanishAlpha;
        this._drawTile(type, x, y, ts, corner, isSelected);
        r.ctx.globalAlpha = 1;
      }
    }
  }

  _drawPaths() {
    const { r } = this;
    const { boardX, boardY, tileSize } = this.layout;
    const half = tileSize / 2;

    for (const anim of this.vanishAnim) {
      r.ctx.globalAlpha = anim.t;
      r.ctx.strokeStyle = '#f9ca24';
      r.ctx.lineWidth = 3;
      r.ctx.lineCap = 'round';
      r.ctx.lineJoin = 'round';
      r.ctx.setLineDash([6, 4]);
      r.ctx.beginPath();
      for (let i = 0; i < anim.path.length; i++) {
        // path coords may be on border (negative or = ROWS/COLS) — clamp for drawing
        const pr = Math.max(-0.5, Math.min(ROWS - 0.5, anim.path[i].r));
        const pc = Math.max(-0.5, Math.min(COLS - 0.5, anim.path[i].c));
        const px = boardX + pc * tileSize + half;
        const py = boardY + pr * tileSize + half;
        if (i === 0) r.ctx.moveTo(px, py); else r.ctx.lineTo(px, py);
      }
      r.ctx.stroke();
      r.ctx.setLineDash([]);
      r.ctx.globalAlpha = 1;
    }
  }

  _drawTile(type, x, y, size, corner, selected) {
    const { r } = this;
    const img = this.assets.get(`tile_0${type}`);
    const color = TILE_COLORS[type];
    const glow  = TILE_GLOW[type];

    if (selected) r.roundRect(x - 3, y - 3, size + 6, size + 6, corner + 3, null, glow, 3);

    if (img) {
      r.roundRect(x, y, size, size, corner, 'rgba(255,255,255,0.12)', null);
      r.ctx.save();
      r.ctx.beginPath();
      r.ctx.moveTo(x + corner, y);
      r.ctx.lineTo(x + size - corner, y);
      r.ctx.arcTo(x + size, y, x + size, y + corner, corner);
      r.ctx.lineTo(x + size, y + size - corner);
      r.ctx.arcTo(x + size, y + size, x + size - corner, y + size, corner);
      r.ctx.lineTo(x + corner, y + size);
      r.ctx.arcTo(x, y + size, x, y + size - corner, corner);
      r.ctx.lineTo(x, y + corner);
      r.ctx.arcTo(x, y, x + corner, y, corner);
      r.ctx.closePath();
      r.ctx.clip();
      r.image(img, x, y, size, size);
      r.ctx.restore();
    } else {
      r.roundRect(x, y, size, size, corner, color, null);
      r.ctx.globalAlpha *= 0.3;
      r.roundRect(x + size * 0.1, y + size * 0.08, size * 0.8, size * 0.35, corner * 0.6, '#ffffff', null);
      r.ctx.globalAlpha = 1;
      r.text(TILE_NAMES[type][0].toUpperCase(), x + size / 2, y + size / 2, {
        size: Math.round(size * 0.38), color: '#fff', weight: 'bold', align: 'center', baseline: 'middle'
      });
    }

    if (selected) r.roundRect(x, y, size, size, corner, 'rgba(255,255,255,0.18)', null);
  }

  _drawOverlay(title, subtitle, color) {
    const { r } = this;
    const { lw, lh } = this.layout;
    r.ctx.fillStyle = 'rgba(0,0,0,0.55)';
    r.ctx.fillRect(0, 0, lw, lh);
    r.text(title,    lw / 2, lh / 2 - 20, { size: 32, color, weight: 'bold', align: 'center', baseline: 'middle', shadow: '#000', shadowBlur: 8 });
    r.text(subtitle, lw / 2, lh / 2 + 20, { size: 18, color: '#dfe6e9', align: 'center', baseline: 'middle' });
  }

  _drawFloatingTexts() {
    for (const ft of this.floatingTexts) {
      this.r.ctx.globalAlpha = ft.t;
      this.r.text(ft.text, ft.x, ft.y, { size: 18, color: '#f9ca24', weight: 'bold', align: 'center', shadow: '#000', shadowBlur: 3 });
      this.r.ctx.globalAlpha = 1;
    }
  }
}
