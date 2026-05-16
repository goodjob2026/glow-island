// TileGrid.js — 连连看 grid with layout support, BFS path, obstacle integration

import { pickLayout } from '../data/layouts.js';

// Default grid dimensions (used by legacy GameScene and exported for module consumers)
export const ROWS = 6;
export const COLS = 6;

const DIRS = [
  { dr: -1, dc: 0 }, // 0: up
  { dr:  1, dc: 0 }, // 1: down
  { dr:  0, dc: -1 }, // 2: left
  { dr:  0, dc:  1 }, // 3: right
];

/**
 * Fisher-Yates in-place shuffle.
 * @param {any[]} arr
 */
function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

export class TileGrid {
  /**
   * @param {object} levelData
   * @param {import('./ObstacleSystem.js').ObstacleSystem|null} obstacleSystem
   */
  constructor(levelData, obstacleSystem) {
    this.levelData = levelData;
    this.obstacles = obstacleSystem ?? null;
    this.grid = [];       // grid[r][c] = null | 0 | 1-9
    this.ROWS = levelData.gridRows;
    this.COLS = levelData.gridCols;
    this.selected = null; // {r, c}
    this.layout = null;   // string[] — set by _init()

    // Callbacks wired by GameplayScene
    this.onMatch = null;  // ({r1,c1,r2,c2,path}) => void
    this.onNoPath = null; // ({r1,c1,r2,c2}) => void

    this._init();
  }

  // ── Initialisation ─────────────────────────────────────────────────────────

  _init() {
    const layout = pickLayout(this.levelData.layoutPool);
    this.layout = layout;
    const { ROWS, COLS } = this;

    // Step 1: mark active / inactive cells
    this.grid = [];
    const activeCells = []; // {r, c}
    for (let r = 0; r < ROWS; r++) {
      this.grid[r] = [];
      for (let c = 0; c < COLS; c++) {
        const ch = layout[r]?.[c] ?? '_';
        if (ch === 'X') {
          this.grid[r][c] = 0; // will be filled
          activeCells.push({ r, c });
        } else {
          this.grid[r][c] = null; // inactive
        }
      }
    }

    // Step 2: distribute specials + paired normal tiles
    this._fillTiles(activeCells);

    // Step 3: verify solvability, shuffle up to 10 more times if needed
    if (!this.hasMoves()) {
      for (let attempt = 0; attempt < 10; attempt++) {
        this._shuffleTilesInPlace(activeCells);
        if (this.hasMoves()) break;
      }
    }
  }

  /**
   * Fill active cells with specials first, then paired normal tiles.
   * @param {{r:number, c:number}[]} activeCells
   */
  _fillTiles(activeCells) {
    const specials = this.levelData.specials ?? [];
    const types = this.levelData.types ?? 3;
    const total = activeCells.length;

    // Build tile pool
    const tilePool = [];

    // Place specials (each appears once or count times)
    let specialCount = 0;
    for (const spec of specials) {
      const count = spec.count ?? 1;
      for (let i = 0; i < count; i++) {
        tilePool.push(spec.type);
        specialCount++;
      }
    }

    // Remaining active cells filled with pairs of normal tiles (1..types)
    const remaining = total - specialCount;
    // remaining must be even; if odd, drop one special slot
    const pairs = Math.floor(remaining / 2);
    for (let i = 0; i < pairs; i++) {
      const t = (i % types) + 1;
      tilePool.push(t, t);
    }
    // If still short (total is odd after specials), pad with a single tile of type 1
    while (tilePool.length < total) {
      tilePool.push(1);
    }
    // Trim if oversized (rare edge case when specials push over limit)
    tilePool.splice(total);

    shuffleArray(tilePool);

    // Assign to active cells
    for (let i = 0; i < activeCells.length; i++) {
      const { r, c } = activeCells[i];
      this.grid[r][c] = tilePool[i];
    }
  }

  /**
   * Collect all non-null tiles, shuffle their values, redistribute.
   * @param {{r:number, c:number}[]} activeCells
   */
  _shuffleTilesInPlace(activeCells) {
    const values = activeCells.map(({ r, c }) => this.grid[r][c]);
    shuffleArray(values);
    for (let i = 0; i < activeCells.length; i++) {
      const { r, c } = activeCells[i];
      this.grid[r][c] = values[i];
    }
  }

  // ── Selection / matching ───────────────────────────────────────────────────

  /**
   * Called on tap at grid cell (r, c).
   * Returns null, {matched: true, r1,c1,r2,c2,path}, or {matched: false}.
   */
  select(r, c) {
    // Ignore inactive cells
    if (this.grid[r][c] === null) return null;
    // Ignore empty cells (value 0) — specials handled externally before select()
    if (this.grid[r][c] === 0) return null;

    if (!this.selected) {
      this.selected = { r, c };
      return null;
    }

    const prev = this.selected;

    // Same cell — deselect
    if (prev.r === r && prev.c === c) {
      this.selected = null;
      return null;
    }

    const prevVal = this.grid[prev.r][prev.c];
    const curVal  = this.grid[r][c];

    // Different type — switch selection to new tile
    if (prevVal !== curVal) {
      this.selected = { r, c };
      return null;
    }

    // Same type — attempt BFS
    this.selected = null;
    const path = this._findPath(prev.r, prev.c, r, c);
    if (path) {
      this.grid[prev.r][prev.c] = 0;
      this.grid[r][c] = 0;
      if (this.onMatch) this.onMatch({ r1: prev.r, c1: prev.c, r2: r, c2: c, path });
      return { matched: true, r1: prev.r, c1: prev.c, r2: r, c2: c, path };
    } else {
      if (this.onNoPath) this.onNoPath({ r1: prev.r, c1: prev.c, r2: r, c2: c });
      return { matched: false };
    }
  }

  // ── BFS path ───────────────────────────────────────────────────────────────

  /**
   * BFS with state (r, c, dir, turns).  Max 2 turns.
   * 1-cell border outside the grid is always passable.
   * Returns array of {r,c} waypoints or null.
   */
  _findPath(r1, c1, r2, c2) {
    const { ROWS, COLS } = this;

    // Encode state as a string key
    const key = (r, c, dir, turns) => `${r},${c},${dir},${turns}`;

    const visited = new Set();
    // Each queue entry: {r, c, dir (-1=none, 0-3), turns (0-2), path}
    const startKey = key(r1, c1, -1, 0);
    visited.add(startKey);
    const queue = [{ r: r1, c: c1, dir: -1, turns: 0, path: [{ r: r1, c: c1 }] }];

    while (queue.length > 0) {
      const cur = queue.shift();

      for (let d = 0; d < 4; d++) {
        let nr = cur.r + DIRS[d].dr;
        let nc = cur.c + DIRS[d].dc;

        // Compute turn cost
        const newTurns = (cur.dir === -1 || cur.dir === d) ? cur.turns : cur.turns + 1;
        if (newTurns > 2) continue;

        // Allow only 1-cell border outside the grid
        if (nr < -1 || nr > ROWS || nc < -1 || nc > COLS) continue;

        const onBorder = nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS;

        // Reached destination?
        if (nr === r2 && nc === c2) {
          return [...cur.path, { r: nr, c: nc }];
        }

        if (onBorder) {
          // Border cells are freely passable
        } else {
          // Inactive (null) cells block path
          if (this.grid[nr][nc] === null) continue;

          // Non-zero tile cells block path (except start/end handled above)
          if (this.grid[nr][nc] !== 0) {
            // Check obstacle passability for non-zero active tile cells — always blocked
            continue;
          }

          // Check obstacle passability for empty cells
          if (this.obstacles && !this.obstacles.isPassable(nr, nc)) continue;

          // Portal redirect: if stepping into a portal entry, redirect to exit
          const portalExit = this.obstacles?.getPortalExit(nr, nc);
          if (portalExit) {
            // Redirect: continue BFS from exit cell, same dir & turns (zero turn cost)
            const pk = key(portalExit.r, portalExit.c, d, newTurns);
            if (!visited.has(pk)) {
              visited.add(pk);
              queue.push({
                r: portalExit.r,
                c: portalExit.c,
                dir: d,
                turns: newTurns,
                path: [...cur.path, { r: nr, c: nc }, { r: portalExit.r, c: portalExit.c }],
              });
            }
            continue;
          }
        }

        const k = key(nr, nc, d, newTurns);
        if (visited.has(k)) continue;
        visited.add(k);
        queue.push({ r: nr, c: nc, dir: d, turns: newTurns, path: [...cur.path, { r: nr, c: nc }] });
      }
    }

    return null;
  }

  // ── Board-state queries ────────────────────────────────────────────────────

  /**
   * Returns true when all active (non-null) cells have been cleared (value === 0).
   */
  isCleared() {
    for (let r = 0; r < this.ROWS; r++)
      for (let c = 0; c < this.COLS; c++)
        if (this.grid[r][c] !== null && this.grid[r][c] !== 0) return false;
    return true;
  }

  /**
   * Returns true if at least one valid same-type pair has a path.
   * Special tiles (6-9) count as one type each.
   */
  hasMoves() {
    const { ROWS, COLS } = this;

    // Group non-zero active cells by type
    const byType = {};
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const v = this.grid[r][c];
        if (v === null || v === 0) continue;
        if (!byType[v]) byType[v] = [];
        byType[v].push({ r, c });
      }
    }

    for (const cells of Object.values(byType)) {
      for (let i = 0; i < cells.length; i++) {
        for (let j = i + 1; j < cells.length; j++) {
          if (this._findPath(cells[i].r, cells[i].c, cells[j].r, cells[j].c)) return true;
        }
      }
    }

    return false;
  }

  // ── Special tile helpers ───────────────────────────────────────────────────

  /** Place a special tile at (r, c). */
  spawnSpecial(type, r, c) {
    if (this.grid[r]?.[c] !== null) {
      this.grid[r][c] = type;
    }
  }

  /**
   * Clear all active cells within Chebyshev distance `radius` (inclusive).
   * Bomb uses radius=1 for a 3×3 area.
   */
  clearRect(r, c, radius) {
    for (let dr = -radius; dr <= radius; dr++) {
      for (let dc = -radius; dc <= radius; dc++) {
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < this.ROWS && nc >= 0 && nc < this.COLS && this.grid[nr][nc] !== null) {
          this.grid[nr][nc] = 0;
        }
      }
    }
  }

  /** Clear entire row and column through (r, c) (Windmill). */
  clearCross(r, c) {
    for (let cc = 0; cc < this.COLS; cc++) {
      if (this.grid[r][cc] !== null) this.grid[r][cc] = 0;
    }
    for (let rr = 0; rr < this.ROWS; rr++) {
      if (this.grid[rr][c] !== null) this.grid[rr][c] = 0;
    }
  }

  /**
   * Reshuffle tile values in active cells, preserving counts.
   * Attempts up to `maxAttempts` times until hasMoves() returns true.
   * Returns true if a valid arrangement was found.
   */
  shuffle(maxAttempts = 10) {
    const { ROWS, COLS } = this;
    const activeCells = [];
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++)
        if (this.grid[r][c] !== null) activeCells.push({ r, c });

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      this._shuffleTilesInPlace(activeCells);
      if (this.hasMoves()) return true;
    }
    return false;
  }
}
