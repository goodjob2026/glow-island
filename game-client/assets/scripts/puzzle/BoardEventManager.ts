// BoardEventManager.ts — Cocos Component that drives periodic board events.
// Handles: water_flow, ice_freeze, vine_spread, tile_gravity
// Attaches to the same node as (or a child of) the PuzzleController.

import { _decorator, Component } from 'cc';
import { TileGrid, TileCell, TileType, ObstacleType } from './TileGrid';

const { ccclass, property } = _decorator;

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface BoardEvent {
  /** The kind of event. */
  type: 'water_flow' | 'ice_freeze' | 'vine_spread' | 'tile_gravity';
  /** Seconds between periodic triggers (null = one-shot / on-demand). */
  triggerInterval: number;
  /** For water_flow: which rows to shift. */
  affectedRows?: number[];
  /** For water_flow: which cols to shift. */
  affectedCols?: number[];
  /** For ice_freeze / vine_spread: rectangular zone. */
  affectedArea?: { row: number; col: number; width: number; height: number };
  /** For water_flow: shift direction (+1 = forward/right/down, -1 = backward/left/up). */
  direction?: 1 | -1;
}

// ---------------------------------------------------------------------------
// Internal timer record
// ---------------------------------------------------------------------------

interface TimerEntry {
  event: BoardEvent;
  elapsed: number;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

@ccclass('BoardEventManager')
export class BoardEventManager extends Component {
  /** Level-config driven event list — set before onLoad / initFromLevelConfig. */
  events: BoardEvent[] = [];

  /** Must be injected by the owning controller before the first update tick. */
  private grid: TileGrid | null = null;

  private timers: TimerEntry[] = [];

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  onLoad(): void {
    this.rebuildTimers();
  }

  update(dt: number): void {
    if (!this.grid) return;

    for (const timer of this.timers) {
      if (timer.event.triggerInterval <= 0) continue;

      timer.elapsed += dt;
      if (timer.elapsed >= timer.event.triggerInterval) {
        timer.elapsed -= timer.event.triggerInterval;
        this.dispatchEvent(timer.event);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /** Provide the TileGrid reference (call from owning controller). */
  setGrid(grid: TileGrid): void {
    this.grid = grid;
  }

  /**
   * Build event list from a level config array of event-type strings.
   * Sensible defaults are applied; callers can then modify `this.events` for
   * fine-tuned per-level parameters.
   */
  initFromLevelConfig(levelBoardEvents: string[]): void {
    this.events = [];

    for (const evtId of levelBoardEvents) {
      switch (evtId) {
        case 'water_flow':
          this.events.push({
            type: 'water_flow',
            triggerInterval: 5,
            affectedRows: [],
            affectedCols: [],
            direction: 1,
          });
          break;

        case 'ice_freeze':
          this.events.push({
            type: 'ice_freeze',
            triggerInterval: 0, // one-shot at init — triggered by caller when ready
            affectedArea: { row: 0, col: 0, width: 1, height: 1 },
          });
          break;

        case 'vine_spread':
          this.events.push({
            type: 'vine_spread',
            triggerInterval: 10,
          });
          break;

        case 'tile_gravity':
          this.events.push({
            type: 'tile_gravity',
            triggerInterval: 0, // triggered externally after each match
          });
          break;

        default:
          console.warn(`[BoardEventManager] Unknown event type in level config: "${evtId}"`);
          break;
      }
    }

    this.rebuildTimers();
  }

  /**
   * Manually fire a specific event type immediately (e.g., tile_gravity after
   * a match resolves, or ice_freeze when the level loads its preset obstacles).
   */
  triggerEventNow(type: BoardEvent['type']): void {
    if (!this.grid) return;
    const event = this.events.find(e => e.type === type);
    if (event) this.dispatchEvent(event);
  }

  // ---------------------------------------------------------------------------
  // Internal helpers
  // ---------------------------------------------------------------------------

  private rebuildTimers(): void {
    this.timers = this.events
      .filter(e => e.triggerInterval > 0)
      .map(e => ({ event: e, elapsed: 0 }));
  }

  private dispatchEvent(event: BoardEvent): void {
    if (!this.grid) return;

    switch (event.type) {
      case 'water_flow':
        this.handleWaterFlow(event);
        break;
      case 'ice_freeze':
        this.handleIceFreeze(event);
        break;
      case 'vine_spread':
        this.handleVineSpread(event);
        break;
      case 'tile_gravity':
        this.grid.applyGravity();
        break;
    }
  }

  // ---------------------------------------------------------------------------
  // water_flow — circular shift of specified rows / cols
  // ---------------------------------------------------------------------------

  private handleWaterFlow(event: BoardEvent): void {
    const grid = this.grid!;
    const dir = event.direction ?? 1;

    if (event.affectedRows) {
      for (const row of event.affectedRows) {
        this.shiftRow(grid, row, dir);
      }
    }

    if (event.affectedCols) {
      for (const col of event.affectedCols) {
        this.shiftCol(grid, col, dir);
      }
    }
  }

  /** Shift all tiles in a row left (dir=-1) or right (dir=1) by 1 cell, wrapping. */
  private shiftRow(grid: TileGrid, row: number, dir: 1 | -1): void {
    const { cols } = grid.getSize();
    const snapshot: (TileCell | null)[] = [];
    for (let c = 0; c < cols; c++) snapshot.push(grid.getTile(row, c));

    for (let c = 0; c < cols; c++) {
      const srcCol = ((c - dir) % cols + cols) % cols;
      const srcCell = snapshot[srcCol];
      if (srcCell) grid.setTile(row, c, { ...srcCell });
    }
  }

  /** Shift all tiles in a col up (dir=-1) or down (dir=1) by 1 cell, wrapping. */
  private shiftCol(grid: TileGrid, col: number, dir: 1 | -1): void {
    const { rows } = grid.getSize();
    const snapshot: (TileCell | null)[] = [];
    for (let r = 0; r < rows; r++) snapshot.push(grid.getTile(r, col));

    for (let r = 0; r < rows; r++) {
      const srcRow = ((r - dir) % rows + rows) % rows;
      const srcCell = snapshot[srcRow];
      if (srcCell) grid.setTile(r, col, { ...srcCell });
    }
  }

  // ---------------------------------------------------------------------------
  // ice_freeze — mark cells in area as locked
  // ---------------------------------------------------------------------------

  private handleIceFreeze(event: BoardEvent): void {
    const grid = this.grid!;
    if (!event.affectedArea) return;

    const { row: startRow, col: startCol, width, height } = event.affectedArea;
    const { rows, cols } = grid.getSize();

    for (let r = startRow; r < startRow + height && r < rows; r++) {
      for (let c = startCol; c < startCol + width && c < cols; c++) {
        const cell = grid.getTile(r, c);
        if (cell) {
          grid.setTile(r, c, {
            ...cell,
            isLocked: true,
            isObstacle: true,
            obstacleType: ObstacleType.ICE_BLOCK,
            obstacleHits: cell.obstacleHits ?? 0,
          });
        }
      }
    }
  }

  // ---------------------------------------------------------------------------
  // vine_spread — expand vine obstacle to one adjacent empty cell per tick
  // ---------------------------------------------------------------------------

  private handleVineSpread(event: BoardEvent): void {
    const grid = this.grid!;
    const { rows, cols } = grid.getSize();

    // Collect current vine positions
    const vineCells: { row: number; col: number }[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cell = grid.getTile(r, c);
        if (cell?.isObstacle && cell.obstacleType === ObstacleType.WEED) {
          vineCells.push({ row: r, col: c });
        }
      }
    }

    // For each vine cell, attempt to spread to one empty neighbour
    const DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    for (const { row, col } of vineCells) {
      // Shuffle neighbour order for non-deterministic spread
      const neighbours = DIRS.map(([dr, dc]) => ({ row: row + dr, col: col + dc }));
      for (let i = neighbours.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [neighbours[i], neighbours[j]] = [neighbours[j], neighbours[i]];
      }

      for (const nb of neighbours) {
        const target = grid.getTile(nb.row, nb.col);
        if (target && !target.isObstacle && target.type === TileType.NONE) {
          grid.setTile(nb.row, nb.col, {
            type: TileType.NONE,
            isObstacle: true,
            obstacleType: ObstacleType.WEED,
            obstacleHits: 0,
            isSelected: false,
            isLocked: false,
          });
          break; // only spread once per vine cell per interval
        }
      }
    }
  }
}
