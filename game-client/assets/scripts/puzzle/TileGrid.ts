// Manages the 2D grid state, tile access/mutation, gravity, and board-level events.

import { EventTarget } from 'cc';

export enum TileType {
  NONE = 'none',
  T01 = 'T01',
  T02 = 'T02',
  T03 = 'T03',
  T04 = 'T04',
  T05 = 'T05',
  T06 = 'T06',
  T07 = 'T07',
  T08 = 'T08',
  T09 = 'T09',
  T10 = 'T10',
  T11 = 'T11',
  T12 = 'T12',
  T13 = 'T13',
  T14 = 'T14',
  T15 = 'T15',
  T16 = 'T16',
  T17 = 'T17',
  T18 = 'T18',
  T19 = 'T19',
  T20 = 'T20',
}

export enum ObstacleType {
  ICE_BLOCK = 'ice_block',
  WEED = 'weed',
  WOODEN_CRATE = 'wooden_crate',
  WATER_CURRENT = 'water_current',
}

export interface TileCell {
  type: TileType;
  isObstacle: boolean;
  obstacleType?: ObstacleType;
  obstacleHits?: number;
  isSelected: boolean;
  isLocked: boolean;
  /**
   * When set, this cell holds a special block of the given type.
   * The renderer should display the special-tile visual instead of the base
   * tile sprite, and the input handler should call triggerSpecialBlock() when
   * either tile in a matched pair has this field set.
   */
  specialBlockType?: string;
}

export interface Point {
  row: number;
  col: number;
}

export const TILE_GRID_EVENT = {
  TILES_MATCHED: 'tilesMatched',
  TILES_SETTLED: 'tilesSettled',
  COMBO_CHANGED: 'comboChanged',
} as const;

function makeEmptyCell(): TileCell {
  return {
    type: TileType.NONE,
    isObstacle: false,
    isSelected: false,
    isLocked: false,
  };
}

export class TileGrid extends EventTarget {
  private grid: TileCell[][] = [];
  private rows: number = 0;
  private cols: number = 0;

  initialize(rows: number, cols: number): void {
    this.rows = rows;
    this.cols = cols;
    this.grid = [];
    for (let r = 0; r < rows; r++) {
      this.grid[r] = [];
      for (let c = 0; c < cols; c++) {
        this.grid[r][c] = makeEmptyCell();
      }
    }
  }

  getSize(): { rows: number; cols: number } {
    return { rows: this.rows, cols: this.cols };
  }

  getTile(row: number, col: number): TileCell | null {
    if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) return null;
    return this.grid[row][col];
  }

  setTile(row: number, col: number, cell: TileCell): void {
    if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) return;
    this.grid[row][col] = cell;
  }

  clearTile(row: number, col: number): void {
    if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) return;
    this.grid[row][col] = makeEmptyCell();
  }

  applyGravity(): void {
    for (let c = 0; c < this.cols; c++) {
      let writeRow = this.rows - 1;
      for (let r = this.rows - 1; r >= 0; r--) {
        const cell = this.grid[r][c];
        if (cell.type !== TileType.NONE || cell.isObstacle) {
          if (r !== writeRow) {
            this.grid[writeRow][c] = cell;
            this.grid[r][c] = makeEmptyCell();
          }
          writeRow--;
        }
      }
    }
    this.emit(TILE_GRID_EVENT.TILES_SETTLED);
  }

  emitTilesMatched(path: Point[]): void {
    this.emit(TILE_GRID_EVENT.TILES_MATCHED, path);
  }

  emitComboChanged(count: number, multiplier: number): void {
    this.emit(TILE_GRID_EVENT.COMBO_CHANGED, count, multiplier);
  }

  getRawGrid(): TileCell[][] {
    return this.grid;
  }
}
