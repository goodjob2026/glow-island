// SpecialTiles.js — activate special tile effects (Bomb, Windmill, Lantern, Wave)

export const SPECIAL = {
  BOMB:     6,
  WINDMILL: 7,
  LANTERN:  8,
  WAVE:     9,
};

export class SpecialTiles {
  /**
   * @param {import('./TileGrid.js').TileGrid} tileGrid
   * @param {object|null} audioManager
   */
  constructor(tileGrid, audioManager) {
    this.grid  = tileGrid;
    this.audio = audioManager ?? null;
  }

  /**
   * Trigger the special tile at (r, c).
   * @returns {Array<{r:number,c:number}>|null}  Cleared cells, or null if not a special.
   */
  trigger(r, c) {
    const v = this.grid.grid[r][c];
    if (v === SPECIAL.BOMB)     return this._triggerBomb(r, c);
    if (v === SPECIAL.WINDMILL) return this._triggerWindmill(r, c);
    if (v === SPECIAL.LANTERN)  return this._triggerLantern(r, c);
    if (v === SPECIAL.WAVE)     return this._triggerWave(r, c);
    return null;
  }

  // ── Bomb (type 6) — clears 3×3 area ─────────────────────────────────────

  _triggerBomb(r, c) {
    this.audio?.playSFX?.('sfx_special_bomb');
    const cleared = [];
    const { ROWS, COLS } = this.grid;
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && this.grid.grid[nr][nc] !== null) {
          this.grid.grid[nr][nc] = 0;
          cleared.push({ r: nr, c: nc });
        }
      }
    }
    return cleared;
  }

  // ── Windmill (type 7) — clears entire row and column ─────────────────────

  _triggerWindmill(r, c) {
    this.audio?.playSFX?.('sfx_special_windmill');
    const cleared = [];
    const { ROWS, COLS } = this.grid;
    // Clear row
    for (let cc = 0; cc < COLS; cc++) {
      if (this.grid.grid[r][cc] !== null) {
        this.grid.grid[r][cc] = 0;
        cleared.push({ r, c: cc });
      }
    }
    // Clear column (skip already-cleared row cell)
    for (let rr = 0; rr < ROWS; rr++) {
      if (rr !== r && this.grid.grid[rr][c] !== null) {
        this.grid.grid[rr][c] = 0;
        cleared.push({ r: rr, c });
      }
    }
    return cleared;
  }

  // ── Lantern (type 8) — auto-pairs with nearest reachable Lantern ─────────

  _triggerLantern(r, c) {
    this.audio?.playSFX?.('sfx_special_light');
    const { ROWS, COLS } = this.grid;
    for (let rr = 0; rr < ROWS; rr++) {
      for (let cc = 0; cc < COLS; cc++) {
        if (rr === r && cc === c) continue;
        if (this.grid.grid[rr][cc] !== SPECIAL.LANTERN) continue;
        const path = this.grid._findPath(r, c, rr, cc);
        if (path) {
          this.grid.grid[r][c]   = 0;
          this.grid.grid[rr][cc] = 0;
          return [{ r, c }, { r: rr, c: cc }];
        }
      }
    }
    // No reachable partner — visual pulse, lantern stays
    return [];
  }

  // ── Wave (type 9) — remove self then reshuffle up to 3 times ─────────────

  _triggerWave(r, c) {
    this.audio?.playSFX?.('sfx_special_wave');
    this.grid.grid[r][c] = 0;
    for (let attempt = 0; attempt < 3; attempt++) {
      this.grid.shuffle();
      if (this.grid.hasMoves()) break;
    }
    // Wave sweep animation — no discrete cleared cells to return
    return [];
  }
}
