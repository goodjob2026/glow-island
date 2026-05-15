// Match-3 grid logic — pure JS, no dependencies

export const ROWS = 8;
export const COLS = 8;
export const TILE_TYPES = 5;

export class TileGrid {
  constructor() {
    this.grid = [];
    this.selected = null; // {row, col}
    this.onMatch = null;  // callback(matchedCells)
    this._init();
  }

  _init() {
    do {
      this.grid = Array.from({ length: ROWS }, () =>
        Array.from({ length: COLS }, () => Math.floor(Math.random() * TILE_TYPES) + 1)
      );
    } while (this._findMatches().length > 0 || !this._hasMoves());
  }

  select(row, col) {
    if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return false;
    if (this.grid[row][col] === 0) return false;

    if (!this.selected) {
      this.selected = { row, col };
      return false;
    }

    const prev = this.selected;
    this.selected = null;

    if (prev.row === row && prev.col === col) return false;

    if (this._isAdjacent(prev, { row, col })) {
      return this._trySwap(prev.row, prev.col, row, col);
    }

    this.selected = { row, col };
    return false;
  }

  _isAdjacent(a, b) {
    return (Math.abs(a.row - b.row) + Math.abs(a.col - b.col)) === 1;
  }

  _trySwap(r1, c1, r2, c2) {
    [this.grid[r1][c1], this.grid[r2][c2]] = [this.grid[r2][c2], this.grid[r1][c1]];
    const matches = this._findMatches();
    if (matches.length === 0) {
      [this.grid[r1][c1], this.grid[r2][c2]] = [this.grid[r2][c2], this.grid[r1][c1]];
      return false;
    }
    this._resolveMatches(matches);
    return true;
  }

  _findMatches() {
    const matched = new Set();
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS - 2; c++) {
        const t = this.grid[r][c];
        if (t && t === this.grid[r][c+1] && t === this.grid[r][c+2]) {
          matched.add(`${r},${c}`); matched.add(`${r},${c+1}`); matched.add(`${r},${c+2}`);
        }
      }
    }
    for (let c = 0; c < COLS; c++) {
      for (let r = 0; r < ROWS - 2; r++) {
        const t = this.grid[r][c];
        if (t && t === this.grid[r+1][c] && t === this.grid[r+2][c]) {
          matched.add(`${r},${c}`); matched.add(`${r+1},${c}`); matched.add(`${r+2},${c}`);
        }
      }
    }
    return [...matched].map(k => { const [r,c] = k.split(','); return {row:+r, col:+c}; });
  }

  _resolveMatches(matches) {
    if (this.onMatch) this.onMatch(matches);
    for (const {row, col} of matches) this.grid[row][col] = 0;
    this._applyGravity();
    this._refill();
    const next = this._findMatches();
    if (next.length > 0) this._resolveMatches(next);
  }

  _applyGravity() {
    for (let c = 0; c < COLS; c++) {
      let empty = ROWS - 1;
      for (let r = ROWS - 1; r >= 0; r--) {
        if (this.grid[r][c] !== 0) {
          this.grid[empty][c] = this.grid[r][c];
          if (empty !== r) this.grid[r][c] = 0;
          empty--;
        }
      }
      for (let r = empty; r >= 0; r--) this.grid[r][c] = 0;
    }
  }

  _refill() {
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++)
        if (this.grid[r][c] === 0)
          this.grid[r][c] = Math.floor(Math.random() * TILE_TYPES) + 1;
  }

  _hasMoves() {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (c + 1 < COLS) {
          [this.grid[r][c], this.grid[r][c+1]] = [this.grid[r][c+1], this.grid[r][c]];
          const ok = this._findMatches().length > 0;
          [this.grid[r][c], this.grid[r][c+1]] = [this.grid[r][c+1], this.grid[r][c]];
          if (ok) return true;
        }
        if (r + 1 < ROWS) {
          [this.grid[r][c], this.grid[r+1][c]] = [this.grid[r+1][c], this.grid[r][c]];
          const ok = this._findMatches().length > 0;
          [this.grid[r][c], this.grid[r+1][c]] = [this.grid[r+1][c], this.grid[r][c]];
          if (ok) return true;
        }
      }
    }
    return false;
  }

  shuffle() {
    this._init();
  }
}
