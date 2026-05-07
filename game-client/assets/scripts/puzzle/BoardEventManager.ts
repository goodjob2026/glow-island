// BoardEventManager.ts — manages dynamic board events defined in puzzle-mechanics-spec.json v2.0.
//
// Original events: water_flow, freeze_zone (ice_freeze), vine_spread
// New events (ch5): tile_fall, tile_slide, board_rotate
//
// Each event carries a chapter_unlock field; only events whose chapter_unlock ≤
// currentChapter are active.

import { TileGrid, TileType, TileCell, Point, TILE_GRID_EVENT } from './TileGrid';

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

export interface BoardEvent {
  type: string;
  /** Chapter at which this event becomes active. */
  chapter_unlock: number;
  config: Record<string, unknown>;
}

/** Config shape for water_flow events. */
interface WaterFlowConfig {
  /** Row index (0-based) or column index to shift. */
  axis: 'row' | 'column';
  index: number;
  direction: 'left' | 'right' | 'up' | 'down';
  /** Trigger interval in seconds. Default: 5. */
  interval_s: number;
}

/** Config shape for freeze_zone (ice_freeze) events. */
interface FreezeZoneConfig {
  /** Top-left corner of the frozen rectangle. */
  topLeft: Point;
  /** Bottom-right corner (inclusive). */
  bottomRight: Point;
  /** Number of adjacent matches required to unfreeze each cell. Default: 2. */
  required_hits: number;
}

/** Config shape for vine_spread events. */
interface VineSpreadConfig {
  /** Spread interval in seconds. Default: 10. */
  interval_s: number;
  /** Initial vine cells (array of {row, col}). */
  initial_cells: Point[];
}

/** Config shape for tile_fall (chapter 5). */
interface TileFallConfig {
  /** Ease-in-bounce animation hint for the renderer. */
  easing: 'ease_in_bounce';
  /** Per-cell fall duration in seconds. */
  duration_per_cell_s: number;
}

/** Config shape for tile_slide (chapter 5). */
interface TileSlideConfig {
  /** Array of "slide surface" cells and their slide direction. */
  surfaces: Array<{ pos: Point; direction: 'left' | 'right' }>;
  /** Duration in seconds. */
  duration_s: number;
}

/** Config shape for board_rotate (chapter 5). */
interface BoardRotateConfig {
  /** Sub-rectangle top-left. */
  topLeft: Point;
  /** Sub-rectangle bottom-right (inclusive). */
  bottomRight: Point;
  /** Trigger every N moves. */
  every_n_moves: number;
  /** Flash-warning duration before rotation (seconds). */
  warning_flash_s: number;
}

// ---------------------------------------------------------------------------
// Freeze state per cell (used by freeze_zone)
// ---------------------------------------------------------------------------

interface FreezeCellState {
  hits: number;
  required: number;
}

// ---------------------------------------------------------------------------
// BoardEventManager
// ---------------------------------------------------------------------------

export class BoardEventManager {
  private events: BoardEvent[] = [];
  private currentChapter: number = 1;

  // Per-event-type runtime state
  private waterFlowTimers = new Map<number, number>(); // eventIndex → elapsed seconds
  private vineSpreadTimer = 0;
  private vineCells = new Set<string>();               // "row,col" keys of current vine cells
  private freezeMap = new Map<string, FreezeCellState>(); // "row,col" → FreezeCellState

  // board_rotate state
  private movesSinceLastRotate = 0;
  private boardRotateWarningActive = false;
  private boardRotateWarningTimer = 0;
  private pendingRotateEvent: BoardEvent | null = null;

  // Internal grid reference — set by setGrid().
  private _grid: TileGrid | null = null;

  // Optional callback invoked when a board_rotate warning fires (for HUD flash).
  private _onBoardRotateWarning: ((payload: { topLeft: Point; bottomRight: Point; warningDuration: number }) => void) | null = null;

  // -------------------------------------------------------------------------
  // Chapter gating
  // -------------------------------------------------------------------------

  setChapter(ch: number): void {
    this.currentChapter = ch;
  }

  /**
   * Bind the live TileGrid so it can be used as a default by onMoveMade,
   * onMatchComplete, and the per-frame update tick.
   */
  setGrid(grid: TileGrid): void {
    this._grid = grid;
  }

  /**
   * Register a callback invoked when a board_rotate warning flash begins.
   * Use this from GameScene/GameHUD to show the visual warning overlay.
   */
  setBoardRotateWarningCallback(
    cb: (payload: { topLeft: Point; bottomRight: Point; warningDuration: number }) => void,
  ): void {
    this._onBoardRotateWarning = cb;
  }

  /**
   * Convenience alias for loadEvents(). Called from GameScene with the raw
   * board_events array from LevelConfig.
   *
   * Accepts either a `BoardEvent[]` (typed form) or a `string[]` (simple event
   * name list from older level data). String names are converted to minimal
   * BoardEvent descriptors with chapter_unlock=1 and empty config.
   */
  initFromLevelConfig(levelEvents: BoardEvent[] | string[]): void {
    if (!Array.isArray(levelEvents) || levelEvents.length === 0) {
      this.loadEvents([]);
      return;
    }

    if (typeof levelEvents[0] === 'string') {
      // Convert string[] to BoardEvent[]
      const converted: BoardEvent[] = (levelEvents as string[]).map(name => ({
        type: name,
        chapter_unlock: 1,
        config: {},
      }));
      this.loadEvents(converted);
    } else {
      this.loadEvents(levelEvents as BoardEvent[]);
    }
  }

  private isEventActive(event: BoardEvent): boolean {
    return event.chapter_unlock <= this.currentChapter;
  }

  // -------------------------------------------------------------------------
  // Load events
  // -------------------------------------------------------------------------

  loadEvents(levelEvents: BoardEvent[]): void {
    this.events = levelEvents ?? [];
    this.waterFlowTimers.clear();
    this.vineSpreadTimer = 0;
    this.vineCells.clear();
    this.freezeMap.clear();
    this.movesSinceLastRotate = 0;
    this.boardRotateWarningActive = false;
    this.boardRotateWarningTimer = 0;
    this.pendingRotateEvent = null;

    // Initialise per-event state.
    for (let i = 0; i < this.events.length; i++) {
      const ev = this.events[i];
      if (!this.isEventActive(ev)) continue;

      switch (ev.type) {
        case 'water_flow': {
          this.waterFlowTimers.set(i, 0);
          break;
        }
        case 'vine_spread': {
          const cfg = ev.config as unknown as VineSpreadConfig;
          this.vineSpreadTimer = 0;
          for (const p of cfg.initial_cells ?? []) {
            this.vineCells.add(`${p.row},${p.col}`);
          }
          break;
        }
        case 'freeze_zone': {
          const cfg = ev.config as unknown as FreezeZoneConfig;
          const required = cfg.required_hits ?? 2;
          for (let r = cfg.topLeft.row; r <= cfg.bottomRight.row; r++) {
            for (let c = cfg.topLeft.col; c <= cfg.bottomRight.col; c++) {
              this.freezeMap.set(`${r},${c}`, { hits: 0, required });
            }
          }
          break;
        }
        // tile_fall, tile_slide, board_rotate: state initialised on-demand.
        default:
          break;
      }
    }
  }

  // -------------------------------------------------------------------------
  // onMatchComplete — called after each tile-match operation
  // -------------------------------------------------------------------------

  /**
   * Handles tile_fall and tile_slide after a match completes.
   * Also processes freeze_zone hit detection.
   *
   * @param grid            Live TileGrid (optional — uses internal grid if omitted).
   * @param matchedPositions The pair of positions that were matched (for adjacency checks).
   */
  onMatchComplete(grid?: TileGrid, matchedPositions: Point[] = []): void {
    const g = grid ?? this._grid;
    if (!g) return;

    for (const ev of this.events) {
      if (!this.isEventActive(ev)) continue;

      switch (ev.type) {
        case 'tile_fall':
          this._applyTileFall(g, ev);
          break;

        case 'tile_slide':
          this._applyTileSlide(g, ev);
          break;

        case 'freeze_zone':
          this._tickFreezeZone(g, matchedPositions);
          break;

        default:
          break;
      }
    }
  }

  // -------------------------------------------------------------------------
  // onMoveMade — called after each player move
  // -------------------------------------------------------------------------

  /**
   * Called once per player move. Checks board_rotate threshold.
   *
   * @param grid      Live TileGrid (optional — uses internal grid if omitted).
   * @param moveCount Total move count in this level session (1-based).
   */
  onMoveMade(grid?: TileGrid, moveCount?: number): void {
    const g = grid ?? this._grid;
    this.movesSinceLastRotate++;

    for (const ev of this.events) {
      if (!this.isEventActive(ev)) continue;
      if (ev.type !== 'board_rotate') continue;

      const cfg = ev.config as unknown as BoardRotateConfig;
      const everyN = cfg.every_n_moves ?? 3;

      if (this.movesSinceLastRotate >= everyN) {
        // Trigger 1-second warning flash, then rotate.
        if (!this.boardRotateWarningActive) {
          this.boardRotateWarningActive = true;
          this.boardRotateWarningTimer = 0;
          this.pendingRotateEvent = ev;

          const warningPayload = {
            topLeft: cfg.topLeft,
            bottomRight: cfg.bottomRight,
            warningDuration: cfg.warning_flash_s ?? 1.0,
          };

          // Fire the registered HUD warning callback.
          this._onBoardRotateWarning?.(warningPayload);

          // Also emit on the grid for legacy/renderer listeners.
          if (g) {
            (g as any).emit('boardRotateWarning', warningPayload);
          }
        }
      }
    }
  }

  // -------------------------------------------------------------------------
  // update — called each frame with delta time in seconds
  // -------------------------------------------------------------------------

  /**
   * @param dt   Delta time in seconds.
   * @param grid Live TileGrid (optional — uses internal grid if omitted).
   */
  update(dt: number, grid?: TileGrid): void {
    const g = grid ?? this._grid;
    if (!g) return;
    this._tickWaterFlow(dt, g);
    this._tickVineSpread(dt, g);
    this._tickBoardRotateWarning(dt, g);
  }

  // -------------------------------------------------------------------------
  // tile_fall — gravity: tiles fall down to fill gaps
  // -------------------------------------------------------------------------

  private _applyTileFall(grid: TileGrid, _ev: BoardEvent): void {
    // Delegate to TileGrid's built-in applyGravity which does column-wise
    // downward compaction (ease_in_bounce is applied by the renderer on the
    // TILES_SETTLED event).
    grid.applyGravity();
    // The TILES_SETTLED event is already emitted by applyGravity().
  }

  // -------------------------------------------------------------------------
  // tile_slide — horizontal slide on tagged surface cells after fall
  // -------------------------------------------------------------------------

  private _applyTileSlide(grid: TileGrid, ev: BoardEvent): void {
    const cfg = ev.config as unknown as TileSlideConfig;
    if (!cfg.surfaces || cfg.surfaces.length === 0) return;

    const { rows, cols } = grid.getSize();
    let anySlid = false;

    for (const surface of cfg.surfaces) {
      const { pos, direction } = surface;
      const cell = grid.getTile(pos.row, pos.col);
      if (!cell || cell.type === TileType.NONE || cell.isObstacle) continue;

      const targetCol = direction === 'left' ? pos.col - 1 : pos.col + 1;
      if (targetCol < 0 || targetCol >= cols) continue;

      const targetCell = grid.getTile(pos.row, targetCol);
      if (!targetCell || targetCell.type !== TileType.NONE || targetCell.isObstacle) continue;

      // Slide: move tile to target, clear source.
      grid.setTile(pos.row, targetCol, { ...cell });
      grid.clearTile(pos.row, pos.col);
      anySlid = true;
    }

    if (anySlid) {
      // Re-run gravity after slide to settle any newly hanging tiles.
      grid.applyGravity();
    }
  }

  // -------------------------------------------------------------------------
  // board_rotate — rotate sub-rectangle 90° clockwise
  // -------------------------------------------------------------------------

  private _tickBoardRotateWarning(dt: number, grid: TileGrid): void {
    if (!this.boardRotateWarningActive || !this.pendingRotateEvent) return;

    const cfg = this.pendingRotateEvent.config as unknown as BoardRotateConfig;
    const warningDuration = cfg.warning_flash_s ?? 1.0;

    this.boardRotateWarningTimer += dt;
    if (this.boardRotateWarningTimer >= warningDuration) {
      // Warning period elapsed — execute the rotation.
      this._executeRotate(grid, cfg);
      this.boardRotateWarningActive = false;
      this.boardRotateWarningTimer = 0;
      this.pendingRotateEvent = null;
      this.movesSinceLastRotate = 0;
    }
  }

  private _executeRotate(grid: TileGrid, cfg: BoardRotateConfig): void {
    const { topLeft, bottomRight } = cfg;
    const rowCount = bottomRight.row - topLeft.row + 1;
    const colCount = bottomRight.col - topLeft.col + 1;

    if (rowCount <= 0 || colCount <= 0) return;

    // Extract the sub-rectangle.
    const snapshot: TileCell[][] = [];
    for (let r = 0; r < rowCount; r++) {
      snapshot[r] = [];
      for (let c = 0; c < colCount; c++) {
        const cell = grid.getTile(topLeft.row + r, topLeft.col + c);
        snapshot[r][c] = cell ? { ...cell } : {
          type: TileType.NONE,
          isObstacle: false,
          isSelected: false,
          isLocked: false,
        };
      }
    }

    // Apply clockwise 90° rotation: new[c][rowCount-1-r] = old[r][c]
    // For a clockwise rotation of an N×M matrix → M×N result:
    //   new_row = c, new_col = (rowCount - 1 - r)
    // We write back into the same rectangular region (assumed square for
    // full correctness; non-square regions are rotated into the same bounding box).
    for (let r = 0; r < rowCount; r++) {
      for (let c = 0; c < colCount; c++) {
        // Clockwise: destination row = c (within colCount), col = (rowCount - 1 - r)
        // Map back to grid coordinates, clamped to the bounding box.
        const destRow = topLeft.row + c;
        const destCol = topLeft.col + (rowCount - 1 - r);
        if (
          destRow >= topLeft.row && destRow <= bottomRight.row &&
          destCol >= topLeft.col && destCol <= bottomRight.col
        ) {
          grid.setTile(destRow, destCol, snapshot[r][c]);
        }
      }
    }

    // Notify renderer to play the rotation animation.
    (grid as any).emit('boardRotateExecuted', {
      topLeft: cfg.topLeft,
      bottomRight: cfg.bottomRight,
    });
  }

  // -------------------------------------------------------------------------
  // water_flow — periodic row/column shift with wrap-around
  // -------------------------------------------------------------------------

  private _tickWaterFlow(dt: number, grid: TileGrid): void {
    for (let i = 0; i < this.events.length; i++) {
      const ev = this.events[i];
      if (!this.isEventActive(ev) || ev.type !== 'water_flow') continue;

      const cfg = ev.config as unknown as WaterFlowConfig;
      const interval = cfg.interval_s ?? 5;

      const elapsed = (this.waterFlowTimers.get(i) ?? 0) + dt;
      if (elapsed >= interval) {
        this._shiftRowOrColumn(grid, cfg);
        this.waterFlowTimers.set(i, elapsed - interval);
      } else {
        this.waterFlowTimers.set(i, elapsed);
      }
    }
  }

  private _shiftRowOrColumn(grid: TileGrid, cfg: WaterFlowConfig): void {
    const { rows, cols } = grid.getSize();

    if (cfg.axis === 'row') {
      const r = cfg.index;
      if (r < 0 || r >= rows) return;

      const rowCells: TileCell[] = [];
      for (let c = 0; c < cols; c++) {
        rowCells.push({ ...(grid.getTile(r, c) ?? this._emptyCell()) });
      }

      if (cfg.direction === 'right') {
        const last = rowCells[cols - 1];
        for (let c = cols - 1; c > 0; c--) rowCells[c] = rowCells[c - 1];
        rowCells[0] = last;
      } else { // left
        const first = rowCells[0];
        for (let c = 0; c < cols - 1; c++) rowCells[c] = rowCells[c + 1];
        rowCells[cols - 1] = first;
      }

      for (let c = 0; c < cols; c++) grid.setTile(r, c, rowCells[c]);

    } else { // column
      const col = cfg.index;
      if (col < 0 || col >= cols) return;

      const colCells: TileCell[] = [];
      for (let r = 0; r < rows; r++) {
        colCells.push({ ...(grid.getTile(r, col) ?? this._emptyCell()) });
      }

      if (cfg.direction === 'down') {
        const last = colCells[rows - 1];
        for (let r = rows - 1; r > 0; r--) colCells[r] = colCells[r - 1];
        colCells[0] = last;
      } else { // up
        const first = colCells[0];
        for (let r = 0; r < rows - 1; r++) colCells[r] = colCells[r + 1];
        colCells[rows - 1] = first;
      }

      for (let r = 0; r < rows; r++) grid.setTile(r, col, colCells[r]);
    }

    (grid as any).emit('waterFlowShifted', { axis: cfg.axis, index: cfg.index, direction: cfg.direction });
  }

  // -------------------------------------------------------------------------
  // freeze_zone — track adjacent-match hits and unfreeze cells
  // -------------------------------------------------------------------------

  private _tickFreezeZone(grid: TileGrid, matchedPositions: Point[]): void {
    if (this.freezeMap.size === 0) return;

    const DIRS: Point[] = [
      { row: -1, col: 0 }, { row: 1, col: 0 },
      { row: 0, col: -1 }, { row: 0, col: 1 },
    ];

    for (const matchedPos of matchedPositions) {
      for (const dir of DIRS) {
        const neighbor = { row: matchedPos.row + dir.row, col: matchedPos.col + dir.col };
        const key = `${neighbor.row},${neighbor.col}`;
        const state = this.freezeMap.get(key);
        if (!state) continue;

        state.hits++;
        if (state.hits >= state.required) {
          // Unfreeze: remove from map and unlock the tile.
          this.freezeMap.delete(key);
          const cell = grid.getTile(neighbor.row, neighbor.col);
          if (cell) {
            grid.setTile(neighbor.row, neighbor.col, {
              ...cell,
              isLocked: false,
              isObstacle: false,
            });
          }
          (grid as any).emit('cellUnfrozen', neighbor);
        }
      }
    }
  }

  // -------------------------------------------------------------------------
  // vine_spread — periodic spread of vine/moss overlay
  // -------------------------------------------------------------------------

  private _tickVineSpread(dt: number, grid: TileGrid): void {
    const vineEvent = this.events.find(ev => ev.type === 'vine_spread' && this.isEventActive(ev));
    if (!vineEvent) return;

    const cfg = vineEvent.config as unknown as VineSpreadConfig;
    const interval = cfg.interval_s ?? 10;

    this.vineSpreadTimer += dt;
    if (this.vineSpreadTimer < interval) return;
    this.vineSpreadTimer -= interval;

    if (this.vineCells.size === 0) return;

    const { rows, cols } = grid.getSize();
    const DIRS: Point[] = [
      { row: -1, col: 0 }, { row: 1, col: 0 },
      { row: 0, col: -1 }, { row: 0, col: 1 },
    ];

    const candidates: string[] = [];
    for (const srcKey of this.vineCells) {
      const [sr, sc] = srcKey.split(',').map(Number);
      for (const dir of DIRS) {
        const nr = sr + dir.row;
        const nc = sc + dir.col;
        if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
        const nKey = `${nr},${nc}`;
        if (this.vineCells.has(nKey)) continue;
        const cell = grid.getTile(nr, nc);
        if (!cell) continue;
        candidates.push(nKey);
      }
    }

    if (candidates.length === 0) return;

    // Spread to one random candidate.
    const chosenKey = candidates[Math.floor(Math.random() * candidates.length)];
    this.vineCells.add(chosenKey);

    const [vr, vc] = chosenKey.split(',').map(Number);
    const cell = grid.getTile(vr, vc);
    if (cell) {
      grid.setTile(vr, vc, { ...cell, isLocked: true });
    }

    (grid as any).emit('vineSpread', { row: vr, col: vc });
  }

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  private _emptyCell(): TileCell {
    return {
      type: TileType.NONE,
      isObstacle: false,
      isSelected: false,
      isLocked: false,
    };
  }

  /** Returns the current vine cell positions (for rendering). */
  getVineCells(): Point[] {
    return Array.from(this.vineCells).map(k => {
      const [row, col] = k.split(',').map(Number);
      return { row, col };
    });
  }

  /** Returns whether a given cell is frozen (for path/selection gating). */
  isCellFrozen(pos: Point): boolean {
    return this.freezeMap.has(`${pos.row},${pos.col}`);
  }

  /** Returns the freeze hit state for a cell (for rendering ice-crack progression). */
  getFreezeCellState(pos: Point): FreezeCellState | null {
    return this.freezeMap.get(`${pos.row},${pos.col}`) ?? null;
  }

  /** Returns whether a board_rotate warning flash is currently active. */
  isBoardRotateWarning(): boolean {
    return this.boardRotateWarningActive;
  }

  /** Resets all event state (e.g. on level restart). */
  reset(): void {
    this.events = [];
    this.waterFlowTimers.clear();
    this.vineSpreadTimer = 0;
    this.vineCells.clear();
    this.freezeMap.clear();
    this.movesSinceLastRotate = 0;
    this.boardRotateWarningActive = false;
    this.boardRotateWarningTimer = 0;
    this.pendingRotateEvent = null;
  }
}
