import { TileGrid, ROWS, COLS, TILE_TYPES } from '../game/TileGrid.js';

// Tile palette — colors used when sprites aren't loaded yet
const TILE_COLORS = ['', '#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6'];
const TILE_GLOW   = ['', '#ff6b6b', '#74b9ff', '#55efc4', '#fdcb6e', '#d6a2e8'];
const TILE_NAMES  = ['', 'coral', 'wave', 'leaf', 'sun', 'shell'];

export class GameScene {
  constructor(renderer, assets) {
    this.r = renderer;
    this.assets = assets;
    this.grid = new TileGrid();
    this.score = 0;
    this.moves = 30;
    this.combo = 0;
    this.floatingTexts = [];
    this.matchAnim = [];      // [{row,col,t}] fading-out matched tiles
    this.swapAnim = null;

    this.grid.onMatch = (cells) => {
      this.score += cells.length * 10 * (1 + this.combo * 0.5);
      this.combo++;
      for (const {row, col} of cells) {
        this.matchAnim.push({ row, col, t: 1.0 });
        this._addFloat(`+${10}`, row, col);
      }
    };

    this._layout();
  }

  _layout() {
    const { width, height } = this.r;
    const hudH = Math.round(height * 0.12);
    const pad = Math.round(width * 0.03);
    const boardW = width - pad * 2;
    const tileSize = Math.floor(boardW / COLS);
    const boardH = tileSize * ROWS;
    const boardY = hudH + pad;

    this.layout = { hudH, pad, tileSize, boardW, boardH, boardX: pad, boardY };
  }

  resize() {
    this._layout();
  }

  tileAt(px, py) {
    const { boardX, boardY, tileSize } = this.layout;
    const col = Math.floor((px - boardX) / tileSize);
    const row = Math.floor((py - boardY) / tileSize);
    if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return null;
    return { row, col };
  }

  onTap(px, py) {
    const cell = this.tileAt(px, py);
    if (!cell) return;
    const swapped = this.grid.select(cell.row, cell.col);
    if (swapped) {
      this.moves = Math.max(0, this.moves - 1);
      this.combo = 0;
    }
  }

  _addFloat(text, row, col) {
    const { boardX, boardY, tileSize } = this.layout;
    const x = boardX + col * tileSize + tileSize / 2;
    const y = boardY + row * tileSize;
    this.floatingTexts.push({ text, x, y, t: 1.0 });
  }

  update(dt) {
    this.matchAnim = this.matchAnim.filter(a => { a.t -= dt * 3; return a.t > 0; });
    this.floatingTexts = this.floatingTexts.filter(ft => {
      ft.y -= dt * 60;
      ft.t -= dt * 2;
      return ft.t > 0;
    });
  }

  draw() {
    const { r } = this;
    r.clear('#1a1a2e');
    this._drawBg();
    this._drawHUD();
    this._drawBoard();
    this._drawFloatingTexts();
  }

  _drawBg() {
    const { r } = this;
    const bg = this.assets.get('bg');
    if (bg) {
      r.image(bg, 0, 0, r.width, r.height);
    } else {
      // Gradient-like background with rects
      r.roundRect(0, 0, r.width, r.height, 0, '#0f3460', null);
    }
  }

  _drawHUD() {
    const { r } = this;
    const { hudH, pad } = this.layout;
    // HUD panel
    r.roundRect(pad, pad / 2, r.width - pad * 2, hudH - pad, 12, 'rgba(255,255,255,0.08)', 'rgba(255,255,255,0.15)', 1);
    // Score
    r.text('SCORE', pad * 2, pad * 0.8, { size: 11, color: 'rgba(255,255,255,0.6)', weight: 'bold', align: 'left' });
    r.text(String(Math.floor(this.score)), pad * 2, pad * 0.8 + 14, { size: 22, color: '#f9ca24', weight: 'bold', align: 'left', shadow: '#e55039', shadowBlur: 6 });
    // Moves
    r.text('MOVES', r.width - pad * 2, pad * 0.8, { size: 11, color: 'rgba(255,255,255,0.6)', weight: 'bold', align: 'right' });
    r.text(String(this.moves), r.width - pad * 2, pad * 0.8 + 14, { size: 22, color: this.moves <= 5 ? '#e74c3c' : '#dfe6e9', weight: 'bold', align: 'right' });
    // Title center
    r.text('GLOW ISLAND', r.width / 2, pad * 0.8 + 6, { size: 14, color: 'rgba(255,255,255,0.85)', weight: 'bold', align: 'center', baseline: 'middle' });
  }

  _drawBoard() {
    const { r } = this;
    const { boardX, boardY, tileSize, boardW, boardH } = this.layout;
    const gap = Math.max(2, Math.round(tileSize * 0.06));
    const ts = tileSize - gap;
    const corner = Math.round(ts * 0.18);

    // Board background
    r.roundRect(boardX - gap, boardY - gap, boardW + gap * 2, boardH + gap * 2, 10, 'rgba(255,255,255,0.05)', 'rgba(255,255,255,0.1)', 1);

    const sel = this.grid.selected;
    const matchSet = new Set(this.matchAnim.map(a => `${a.row},${a.col}`));

    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const type = this.grid.grid[row][col];
        if (!type) continue;

        const x = boardX + col * tileSize + gap / 2;
        const y = boardY + row * tileSize + gap / 2;
        const isSelected = sel && sel.row === row && sel.col === col;
        const isMatching = matchSet.has(`${row},${col}`);
        const matchAlpha = isMatching ? (this.matchAnim.find(a => a.row === row && a.col === col)?.t ?? 1) : 1;

        r.ctx.globalAlpha = matchAlpha;
        this._drawTile(type, x, y, ts, corner, isSelected);
        r.ctx.globalAlpha = 1;
      }
    }
  }

  _drawTile(type, x, y, size, corner, selected) {
    const { r } = this;
    const img = this.assets.get(`tile_0${type}`);
    const color = TILE_COLORS[type];
    const glow = TILE_GLOW[type];

    if (selected) {
      // Glow ring
      r.roundRect(x - 3, y - 3, size + 6, size + 6, corner + 3, null, glow, 3);
    }

    if (img) {
      // White rounded background
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
      // Fallback colored tile
      r.roundRect(x, y, size, size, corner, color, null);
      // Inner shine
      r.ctx.globalAlpha *= 0.3;
      r.roundRect(x + size * 0.1, y + size * 0.08, size * 0.8, size * 0.35, corner * 0.6, '#ffffff', null);
      r.ctx.globalAlpha = 1;
      // Type initial
      r.text(TILE_NAMES[type][0].toUpperCase(), x + size / 2, y + size / 2, {
        size: Math.round(size * 0.38), color: '#fff', weight: 'bold', align: 'center', baseline: 'middle'
      });
    }

    if (selected) {
      r.roundRect(x, y, size, size, corner, 'rgba(255,255,255,0.18)', null);
    }
  }

  _drawFloatingTexts() {
    const { r } = this;
    for (const ft of this.floatingTexts) {
      r.ctx.globalAlpha = ft.t;
      r.text(ft.text, ft.x, ft.y, { size: 18, color: '#f9ca24', weight: 'bold', align: 'center', shadow: '#000', shadowBlur: 3 });
      r.ctx.globalAlpha = 1;
    }
  }
}
