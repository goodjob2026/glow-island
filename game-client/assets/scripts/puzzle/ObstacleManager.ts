// ObstacleManager.ts — manages obstacle state for ice_block, weed, wooden_crate,
// and water_current as defined in puzzle-mechanics-spec.json.

import { TileGrid, TileCell, TileType, ObstacleType } from './TileGrid';

// ---------------------------------------------------------------------------
// Water-current direction
// ---------------------------------------------------------------------------

export type WaterDirection = 'up' | 'down' | 'left' | 'right';

const WATER_DIRECTION_CYCLE: WaterDirection[] = ['up', 'right', 'down', 'left'];

/**
 * Persisted extra state for water_current cells, keyed by "row,col".
 */
interface WaterCurrentState {
  direction: WaterDirection;
  directionIndex: number;
  elapsed: number;
}

// ---------------------------------------------------------------------------
// ObstacleManager
// ---------------------------------------------------------------------------

export class ObstacleManager {
  /** Seconds between ice-crack notifications (not auto-triggered; driven externally). */
  private static readonly ICE_HITS_TO_CLEAR = 2;
  /** Seconds between weed auto-spread ticks. */
  private static readonly WEED_SPREAD_INTERVAL = 15;
  /** Seconds between water-current direction changes. */
  private static readonly WATER_DIRECTION_INTERVAL = 5;

  private weedSpreadElapsed = 0;
  private waterCurrentStates = new Map<string, WaterCurrentState>();

  constructor(private grid: TileGrid) {}

  // ---------------------------------------------------------------------------
  // onTileMatched — called with every batch of cleared positions
  // ---------------------------------------------------------------------------

  /**
   * Process obstacle interactions when a set of tiles has just been matched/cleared.
   * For each matched position, all orthogonal neighbours are checked for adjacent-
   * match-clearable obstacles (ice_block, weed).
   */
  onTileMatched(matchedPositions: { row: number; col: number }[]): void {
    const DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1]];

    for (const pos of matchedPositions) {
      for (const [dr, dc] of DIRS) {
        const nr = pos.row + dr;
        const nc = pos.col + dc;
        const cell = this.grid.getTile(nr, nc);
        if (!cell || !cell.isObstacle) continue;

        switch (cell.obstacleType) {
          case ObstacleType.ICE_BLOCK:
            this.hitIceBlock(nr, nc, cell);
            break;
          case ObstacleType.WEED:
            this.clearWeed(nr, nc);
            break;
          // wooden_crate and water_current are not clearable by adjacent match
          default:
            break;
        }
      }
    }
  }

  // ---------------------------------------------------------------------------
  // isPathBlocked — wooden_crate (and directional water_current) path checks
  // ---------------------------------------------------------------------------

  /**
   * Returns true if any cell along the given path is permanently blocked.
   * wooden_crate is always blocking.
   * water_current is blocking in its current state (direction blocks traversal).
   */
  isPathBlocked(path: { row: number; col: number }[]): boolean {
    for (const pos of path) {
      const cell = this.grid.getTile(pos.row, pos.col);
      if (!cell) continue;

      if (cell.isObstacle) {
        if (cell.obstacleType === ObstacleType.WOODEN_CRATE) {
          return true;
        }
        if (cell.obstacleType === ObstacleType.WATER_CURRENT) {
          // Water current blocks the path at this moment in time
          return true;
        }
      }
    }
    return false;
  }

  // ---------------------------------------------------------------------------
  // spreadWeed — called by BoardEventManager on vine_spread interval
  // ---------------------------------------------------------------------------

  /**
   * Expand weed obstacle to a single adjacent empty cell for each existing
   * weed cell. Called by BoardEventManager every 15 s (weed spread interval).
   */
  spreadWeed(): void {
    const { rows, cols } = this.grid.getSize();
    const DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1]];

    // Snapshot current weed positions first to avoid spreading twice in one pass
    const weedCells: { row: number; col: number }[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cell = this.grid.getTile(r, c);
        if (cell?.isObstacle && cell.obstacleType === ObstacleType.WEED) {
          weedCells.push({ row: r, col: c });
        }
      }
    }

    for (const { row, col } of weedCells) {
      // Shuffle neighbours for non-deterministic spread
      const neighbours = DIRS.map(([dr, dc]) => ({ row: row + dr, col: col + dc }));
      for (let i = neighbours.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [neighbours[i], neighbours[j]] = [neighbours[j], neighbours[i]];
      }

      for (const nb of neighbours) {
        const target = this.grid.getTile(nb.row, nb.col);
        if (target && !target.isObstacle && target.type === TileType.NONE) {
          this.grid.setTile(nb.row, nb.col, {
            type: TileType.NONE,
            isObstacle: true,
            obstacleType: ObstacleType.WEED,
            obstacleHits: 0,
            isSelected: false,
            isLocked: false,
          });
          break; // spread once per weed cell
        }
      }
    }
  }

  // ---------------------------------------------------------------------------
  // updateWaterCurrent — called every game tick (dt in seconds)
  // ---------------------------------------------------------------------------

  /**
   * Advance internal timers for all water_current cells and rotate direction
   * every WATER_DIRECTION_INTERVAL seconds.  After direction changes, the
   * path-traversability result from isPathBlocked will reflect the new state
   * automatically because water_current always blocks regardless of direction
   * in the current design (spec: "blocks_path: true").  If future iterations
   * make direction matter for traversal, extend isPathBlocked accordingly.
   */
  updateWaterCurrent(dt: number): void {
    const { rows, cols } = this.grid.getSize();

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cell = this.grid.getTile(r, c);
        if (!cell?.isObstacle || cell.obstacleType !== ObstacleType.WATER_CURRENT) continue;

        const key = `${r},${c}`;
        if (!this.waterCurrentStates.has(key)) {
          this.waterCurrentStates.set(key, {
            direction: 'right',
            directionIndex: 1,
            elapsed: 0,
          });
        }

        const state = this.waterCurrentStates.get(key)!;
        state.elapsed += dt;

        if (state.elapsed >= ObstacleManager.WATER_DIRECTION_INTERVAL) {
          state.elapsed -= ObstacleManager.WATER_DIRECTION_INTERVAL;
          state.directionIndex = (state.directionIndex + 1) % WATER_DIRECTION_CYCLE.length;
          state.direction = WATER_DIRECTION_CYCLE[state.directionIndex];
        }
      }
    }

    // Prune stale entries for cells that may have been removed
    for (const key of this.waterCurrentStates.keys()) {
      const [r, c] = key.split(',').map(Number);
      const cell = this.grid.getTile(r, c);
      if (!cell || !cell.isObstacle || cell.obstacleType !== ObstacleType.WATER_CURRENT) {
        this.waterCurrentStates.delete(key);
      }
    }
  }

  /**
   * Returns the current flow direction for a water_current cell, or null if
   * the cell does not exist / is not a water_current obstacle.
   */
  getWaterCurrentDirection(row: number, col: number): WaterDirection | null {
    const cell = this.grid.getTile(row, col);
    if (!cell?.isObstacle || cell.obstacleType !== ObstacleType.WATER_CURRENT) return null;

    const key = `${row},${col}`;
    return this.waterCurrentStates.get(key)?.direction ?? 'right';
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /**
   * Register one hit on an ice block.  Clears the obstacle after 2 hits.
   */
  private hitIceBlock(row: number, col: number, cell: TileCell): void {
    const hits = (cell.obstacleHits ?? 0) + 1;

    if (hits >= ObstacleManager.ICE_HITS_TO_CLEAR) {
      // Ice fully broken — restore the underlying tile (keep tile type, remove obstacle)
      this.grid.setTile(row, col, {
        ...cell,
        isObstacle: false,
        obstacleType: undefined,
        obstacleHits: 0,
        isLocked: false,
      });
    } else {
      // First hit — cell is now "cracked"
      this.grid.setTile(row, col, {
        ...cell,
        obstacleHits: hits,
      });
    }
  }

  /**
   * Clear a weed cell, making the grid cell empty and available again.
   */
  private clearWeed(row: number, col: number): void {
    // Weed takes 1 adjacent match to clear; just remove it entirely
    this.grid.clearTile(row, col);
  }
}
