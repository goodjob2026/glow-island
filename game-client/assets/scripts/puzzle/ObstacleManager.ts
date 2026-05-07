// ObstacleManager.ts — manages all obstacle types defined in puzzle-mechanics-spec.json v2.0.
//
// Obstacle types handled:
//   Original: weed, wooden_crate, water_current
//   New (v2):  ice_block, chain_lock, portal, single_path_corridor, spreading_obstacle

import { TileGrid, TileType, Point } from './TileGrid';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ObstacleKind =
  | 'weed'
  | 'wooden_crate'
  | 'water_current'
  | 'ice_block'
  | 'chain_lock'
  | 'portal'
  | 'single_path_corridor'
  | 'spreading_obstacle';

/** Represents one obstacle-bearing cell on the grid. */
export interface ObstacleCell {
  kind: ObstacleKind;
  row: number;
  col: number;
  /** ice_block: remaining layers (1-3). */
  layers?: number;
  /** chain_lock: remaining chain rings needed. */
  chains?: number;
  /** water_current: current flow direction. Blocks path when active. */
  currentDirection?: 'up' | 'down' | 'left' | 'right';
  /** spreading_obstacle: variant tag */
  variant?: 'vine' | 'moss';
  /** single_path_corridor: the ordered sequence of corridor cells this belongs to. Set by loadObstacles. */
  corridorIndex?: number;
}

/** Portal pair: entryKey and exitKey are "row,col" strings. */
export interface PortalPair {
  a: Point;
  b: Point;
}

/** Corridor definition: an ordered list of cells that a path MUST traverse in sequence. */
export interface Corridor {
  cells: Point[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function pointKey(p: Point): string {
  return `${p.row},${p.col}`;
}

function parsePointKey(key: string): Point {
  const [row, col] = key.split(',').map(Number);
  return { row, col };
}

const CARDINAL_DIRS: Point[] = [
  { row: -1, col: 0 },
  { row: 1,  col: 0 },
  { row: 0,  col: -1 },
  { row: 0,  col: 1 },
];

// ---------------------------------------------------------------------------
// ObstacleManager
// ---------------------------------------------------------------------------

export class ObstacleManager {
  // Map from "row,col" → ObstacleCell for O(1) lookups.
  private obstacleMap = new Map<string, ObstacleCell>();

  // Portal pairs indexed so we can look up a partner quickly.
  private portalPartnerMap = new Map<string, Point>(); // key → partner Point

  // Ordered corridor sequences for single_path_corridor validation.
  private corridors: Corridor[] = [];

  // All spreading obstacle cells (vine/moss) as a Set of keys for fast lookup.
  private spreadCells = new Set<string>();

  // Water-current direction change timer (seconds).
  private waterCurrentTimer = 0;
  private readonly WATER_DIRECTION_CHANGE_INTERVAL = 5; // seconds
  private readonly WATER_DIRECTIONS: Array<'up' | 'down' | 'left' | 'right'> = ['up', 'down', 'left', 'right'];

  // Internal grid reference — set by setGrid() or passed directly to methods.
  private _grid: TileGrid | null = null;

  /** Bind a TileGrid so it can be used as a default by onTileMatched, tickSpread etc. */
  setGrid(grid: TileGrid): void {
    this._grid = grid;
  }

  // -------------------------------------------------------------------------
  // Initialisation
  // -------------------------------------------------------------------------

  /**
   * Load obstacles from level data.
   * @param obstacles   Flat list of ObstacleCell descriptors from level JSON.
   * @param portalPairs Portal pairs from level JSON.
   * @param corridors   Corridor definitions from level JSON.
   */
  loadObstacles(
    obstacles: ObstacleCell[],
    portalPairs: PortalPair[] = [],
    corridors: Corridor[] = [],
  ): void {
    this.obstacleMap.clear();
    this.portalPartnerMap.clear();
    this.spreadCells.clear();
    this.corridors = corridors;

    for (const obs of obstacles) {
      const key = pointKey(obs);
      this.obstacleMap.set(key, { ...obs });

      if (obs.kind === 'spreading_obstacle') {
        this.spreadCells.add(key);
      }
    }

    // Index portal pairs for bidirectional lookup.
    for (const pair of portalPairs) {
      this.portalPartnerMap.set(pointKey(pair.a), pair.b);
      this.portalPartnerMap.set(pointKey(pair.b), pair.a);
    }

    // Tag corridor cells with their sequence index so isSinglePathSatisfied
    // can verify ordering.
    for (let ci = 0; ci < corridors.length; ci++) {
      const corridor = corridors[ci];
      for (let idx = 0; idx < corridor.cells.length; idx++) {
        const key = pointKey(corridor.cells[idx]);
        const obs = this.obstacleMap.get(key);
        if (obs) {
          obs.corridorIndex = idx;
        }
      }
    }
  }

  // -------------------------------------------------------------------------
  // Query helpers
  // -------------------------------------------------------------------------

  getObstacleAt(pos: Point): ObstacleCell | null {
    return this.obstacleMap.get(pointKey(pos)) ?? null;
  }

  // -------------------------------------------------------------------------
  // Path validation
  // -------------------------------------------------------------------------

  /**
   * Returns true if the given path segment is blocked by any obstacle.
   * Traverses every point in `path` and checks obstacle blocking rules.
   *
   * Blocking rules:
   *   - wooden_crate: always blocks.
   *   - water_current: blocks in the direction of flow (cell is considered occupied).
   *   - ice_block: blocks tile selection but NOT path traversal (path can go around).
   *   - chain_lock: does NOT block path.
   *   - weed: does NOT block path.
   *   - portal / spreading_obstacle / single_path_corridor: not path-blocking by type alone.
   *
   * Note: the caller (BFS/DFS in TileMatcher) must already avoid occupied tile cells.
   * This method only checks obstacle-specific blocking on top of that.
   */
  isPathBlocked(path: Point[]): boolean {
    for (const p of path) {
      const obs = this.getObstacleAt(p);
      if (!obs) continue;

      switch (obs.kind) {
        case 'wooden_crate':
          return true;

        case 'water_current':
          // A water_current cell is always path-blocking (the tile on it cannot be
          // traversed regardless of flow direction, matching the spec).
          return true;

        case 'ice_block':
          // ice_block blocks tile selection but the path itself can still traverse
          // the cell if it has no regular tile occupying it.
          // The TileGrid's existing occupied-cell check handles this; no extra block here.
          break;

        // chain_lock, weed, portal, single_path_corridor, spreading_obstacle:
        // do not themselves block path traversal.
        default:
          break;
      }
    }
    return false;
  }

  // -------------------------------------------------------------------------
  // Portal traversal
  // -------------------------------------------------------------------------

  /**
   * Given a path produced by BFS, inject portal exit points.
   * When a path point matches a portal entry, the next point is replaced by
   * the portal exit (zero turn cost semantics: direction and turn count are
   * unchanged from the BFS perspective — the BFS itself handles this; this
   * method post-processes a completed path for rendering/animation purposes).
   *
   * Returns a new path with portal traversal points annotated.
   */
  applyPortalTransform(path: Point[]): Point[] {
    if (this.portalPartnerMap.size === 0) return path;

    const result: Point[] = [];
    for (let i = 0; i < path.length; i++) {
      result.push(path[i]);
      const partner = this.portalPartnerMap.get(pointKey(path[i]));
      if (partner) {
        // Insert the portal exit into the visual path so the renderer can
        // animate the "teleport" segment.
        result.push(partner);
        // Skip the next point if it duplicates the portal exit (BFS may
        // already have emitted the exit as the next step).
        if (i + 1 < path.length && pointKey(path[i + 1]) === pointKey(partner)) {
          i++; // consume the duplicate
        }
      }
    }
    return result;
  }

  /**
   * Returns the portal partner of a given point, or null if it is not a portal.
   * Used by the BFS engine in TileMatcher to implement zero-cost portal traversal.
   */
  getPortalPartner(pos: Point): Point | null {
    return this.portalPartnerMap.get(pointKey(pos)) ?? null;
  }

  // -------------------------------------------------------------------------
  // Single-path corridor validation
  // -------------------------------------------------------------------------

  /**
   * Returns true if the path satisfies ALL defined corridors.
   * For each corridor, the path must visit each of its cells in the specified
   * sequence order (non-contiguous visits are fine; ordering must be preserved).
   */
  isSinglePathSatisfied(path: Point[]): boolean {
    if (this.corridors.length === 0) return true;

    const pathKeys = path.map(pointKey);

    for (const corridor of this.corridors) {
      let seqIdx = 0;
      for (const pathKey of pathKeys) {
        if (seqIdx >= corridor.cells.length) break;
        if (pathKey === pointKey(corridor.cells[seqIdx])) {
          seqIdx++;
        }
      }
      // All corridor cells must have been visited in order.
      if (seqIdx < corridor.cells.length) return false;
    }
    return true;
  }

  // -------------------------------------------------------------------------
  // Tile matched / direct-match events
  // -------------------------------------------------------------------------

  /**
   * Called by the game engine whenever a tile at `pos` participates in a match.
   *
   * Overload 1 (array form): called from GameScene with an array of matched
   *   positions (the two selected tiles). Each position is treated as a
   *   direct match with isDirectMatch=true.
   * Overload 2 (single form): called with explicit isDirectMatch flag and grid.
   *
   * @param posOrPositions  Single matched position or array of matched positions.
   * @param isDirectMatch   True when the tile itself was one of the two selected
   *                        tiles (used for chain_lock counting). Default true.
   * @param grid            The live TileGrid (used to clear ice/spread tiles).
   *                        If omitted the internal stored grid is used.
   */
  onTileMatched(
    posOrPositions: Point | Point[],
    isDirectMatch: boolean = true,
    grid?: TileGrid,
  ): void {
    const g = grid ?? this._grid;
    if (!g) return;

    const positions: Point[] = Array.isArray(posOrPositions)
      ? posOrPositions
      : [posOrPositions];

    for (const pos of positions) {
      // --- ice_block: adjacent match reduces a layer ---
      this._handleAdjacentIceBlock(pos, g);

      // --- chain_lock: direct match reduces chain count ---
      if (isDirectMatch) {
        this._handleDirectChainLock(pos, g);
      }

      // --- weed: adjacent match clears weed ---
      this._handleAdjacentWeed(pos, g);

      // --- spreading_obstacle: adjacent match clears one vine/moss cell ---
      this._handleAdjacentSpread(pos, g);
    }
  }

  /** Reduce ice layers on all ice_block cells adjacent to `pos`. */
  private _handleAdjacentIceBlock(pos: Point, grid: TileGrid): void {
    for (const dir of CARDINAL_DIRS) {
      const neighbor: Point = { row: pos.row + dir.row, col: pos.col + dir.col };
      const key = pointKey(neighbor);
      const obs = this.obstacleMap.get(key);
      if (!obs || obs.kind !== 'ice_block') continue;

      obs.layers = (obs.layers ?? 1) - 1;
      if (obs.layers <= 0) {
        // Ice fully removed — free the tile.
        this.obstacleMap.delete(key);
        const cell = grid.getTile(neighbor.row, neighbor.col);
        if (cell) {
          grid.setTile(neighbor.row, neighbor.col, {
            ...cell,
            isObstacle: false,
            isLocked: false,
            obstacleType: undefined,
            obstacleHits: undefined,
          });
        }
      } else {
        // layers field on ObstacleCell already tracks the remaining count; no
        // additional update needed here.
      }
    }
  }

  /** Reduce chain count on a chain_lock cell at `pos` (direct match). */
  private _handleDirectChainLock(pos: Point, grid: TileGrid): void {
    const key = pointKey(pos);
    const obs = this.obstacleMap.get(key);
    if (!obs || obs.kind !== 'chain_lock') return;

    obs.chains = (obs.chains ?? 1) - 1;
    if (obs.chains <= 0) {
      // All chains broken — tile is freed (it will be cleared by the normal
      // match logic on this Nth direct match).
      this.obstacleMap.delete(key);
      const cell = grid.getTile(pos.row, pos.col);
      if (cell) {
        grid.setTile(pos.row, pos.col, {
          ...cell,
          isObstacle: false,
          isLocked: false,
          obstacleType: undefined,
          obstacleHits: undefined,
        });
      }
    }
    // While chains > 0 the tile survives: the caller's clearTile should be
    // suppressed. The engine checks getObstacleAt() after onTileMatched() to
    // decide whether to actually remove the tile.
  }

  /** Returns true if the chain_lock tile at `pos` should survive this match. */
  chainLockSurvivesMatch(pos: Point): boolean {
    const obs = this.getObstacleAt(pos);
    // Survives if it still has chains remaining BEFORE this match is processed
    // (i.e., chains > 0 even after decrement means we haven't hit 0 yet here).
    // After onTileMatched() is called the map is already updated, so we check
    // whether the obstacle still exists.
    return obs !== null && obs.kind === 'chain_lock';
  }

  /** Clear a weed cell adjacent to `pos`. */
  private _handleAdjacentWeed(pos: Point, grid: TileGrid): void {
    for (const dir of CARDINAL_DIRS) {
      const neighbor: Point = { row: pos.row + dir.row, col: pos.col + dir.col };
      const key = pointKey(neighbor);
      const obs = this.obstacleMap.get(key);
      if (!obs || obs.kind !== 'weed') continue;

      // Weed is cleared by 1 adjacent match.
      this.obstacleMap.delete(key);
      grid.clearTile(neighbor.row, neighbor.col);
    }
  }

  /** Clear one spreading_obstacle cell adjacent to `pos`. */
  private _handleAdjacentSpread(pos: Point, grid: TileGrid): void {
    for (const dir of CARDINAL_DIRS) {
      const neighbor: Point = { row: pos.row + dir.row, col: pos.col + dir.col };
      const key = pointKey(neighbor);
      if (!this.spreadCells.has(key)) continue;
      const obs = this.obstacleMap.get(key);
      if (!obs || obs.kind !== 'spreading_obstacle') continue;

      // 1 adjacent match clears 1 vine/moss cell.
      this.spreadCells.delete(key);
      this.obstacleMap.delete(key);
      grid.clearTile(neighbor.row, neighbor.col);
    }
  }

  // -------------------------------------------------------------------------
  // Spreading obstacle tick (called each turn end)
  // -------------------------------------------------------------------------

  /**
   * Expand each vine/moss cell by 1 random adjacent empty cell.
   * Called once per turn (step-based levels).
   *
   * Spread is blocked by: wooden_crate, portal cells, and
   * single_path_corridor boundary cells (any cell already in obstacleMap with
   * those kinds acts as a blocker).
   *
   * @param grid Optional. Uses internal grid if omitted.
   */
  tickSpread(grid?: TileGrid): void {
    const g = grid ?? this._grid;
    if (!g) return;
    if (this.spreadCells.size === 0) return;

    const SPREAD_BLOCKERS: Set<ObstacleKind> = new Set(['wooden_crate', 'portal', 'single_path_corridor']);

    // Collect expansions first to avoid mutating while iterating.
    const expansions: { key: string; obs: ObstacleCell }[] = [];
    const { rows, cols } = g.getSize();

    for (const srcKey of this.spreadCells) {
      const srcObs = this.obstacleMap.get(srcKey);
      if (!srcObs) continue;

      // Gather candidate adjacent cells.
      const candidates: Point[] = [];
      for (const dir of CARDINAL_DIRS) {
        const neighbor: Point = { row: srcObs.row + dir.row, col: srcObs.col + dir.col };
        if (neighbor.row < 0 || neighbor.row >= rows || neighbor.col < 0 || neighbor.col >= cols) continue;

        const neighborKey = pointKey(neighbor);
        if (this.spreadCells.has(neighborKey)) continue; // already spread
        if (this.obstacleMap.has(neighborKey)) {
          const existingObs = this.obstacleMap.get(neighborKey)!;
          if (SPREAD_BLOCKERS.has(existingObs.kind)) continue; // blocked
        }

        const cell = g.getTile(neighbor.row, neighbor.col);
        // Spread onto empty cells or cells with regular tiles (covering them).
        if (!cell) continue;

        candidates.push(neighbor);
      }

      if (candidates.length === 0) continue;

      // Pick one random adjacent candidate.
      const chosen = candidates[Math.floor(Math.random() * candidates.length)];
      const newKey = pointKey(chosen);
      expansions.push({
        key: newKey,
        obs: {
          kind: 'spreading_obstacle',
          row: chosen.row,
          col: chosen.col,
          variant: srcObs.variant,
        },
      });
    }

    for (const { key, obs } of expansions) {
      this.spreadCells.add(key);
      this.obstacleMap.set(key, obs);
      // Mark the tile in the grid as locked/obstacle so it cannot be selected.
      const cell = g.getTile(obs.row, obs.col);
      if (cell) {
        g.setTile(obs.row, obs.col, { ...cell, isObstacle: true, isLocked: true });
      }
    }
  }

  /**
   * Returns true if spreading_obstacle has covered ALL valid (non-empty) tile
   * cells on the board — game-over condition.
   *
   * @param grid Optional. Uses internal grid if omitted.
   */
  isBoardOverrun(grid?: TileGrid): boolean {
    const g = grid ?? this._grid;
    if (!g) return false;
    const { rows, cols } = g.getSize();
    let totalTileCells = 0;
    let coveredTileCells = 0;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cell = g.getTile(r, c);
        if (!cell) continue;

        // Count cells that can hold tiles (not portals or permanent non-tile cells).
        const key = pointKey({ row: r, col: c });
        const obs = this.obstacleMap.get(key);
        if (obs && (obs.kind === 'portal' || obs.kind === 'wooden_crate')) continue;

        totalTileCells++;

        if (this.spreadCells.has(key)) {
          coveredTileCells++;
        }
      }
    }

    return totalTileCells > 0 && coveredTileCells >= totalTileCells;
  }

  // -------------------------------------------------------------------------
  // Water-current periodic direction change
  // -------------------------------------------------------------------------

  /**
   * Called each frame with delta time (seconds).
   * Rotates water_current flow directions every 5 seconds.
   */
  update(dt: number): void {
    this.waterCurrentTimer += dt;
    if (this.waterCurrentTimer >= this.WATER_DIRECTION_CHANGE_INTERVAL) {
      this.waterCurrentTimer = 0;
      this._rotateWaterCurrentDirections();
    }
  }

  /**
   * Alias for `update()` — matches the call site in GameScene.ts.
   * Rotates water_current flow directions every 5 seconds.
   */
  updateWaterCurrent(dt: number): void {
    this.update(dt);
  }

  private _rotateWaterCurrentDirections(): void {
    for (const obs of this.obstacleMap.values()) {
      if (obs.kind !== 'water_current') continue;
      const dirs = this.WATER_DIRECTIONS;
      const currentIdx = dirs.indexOf(obs.currentDirection ?? 'right');
      obs.currentDirection = dirs[(currentIdx + 1) % dirs.length];
    }
  }

  // -------------------------------------------------------------------------
  // Utility: all spreading cells (for rendering)
  // -------------------------------------------------------------------------

  getSpreadCells(): Point[] {
    return Array.from(this.spreadCells).map(parsePointKey);
  }

  /** Returns all obstacles of a given kind. */
  getObstaclesByKind(kind: ObstacleKind): ObstacleCell[] {
    const result: ObstacleCell[] = [];
    for (const obs of this.obstacleMap.values()) {
      if (obs.kind === kind) result.push(obs);
    }
    return result;
  }

  /** Clears all obstacle state (e.g., on level restart). */
  reset(): void {
    this.obstacleMap.clear();
    this.portalPartnerMap.clear();
    this.spreadCells.clear();
    this.corridors = [];
    this.waterCurrentTimer = 0;
  }
}
