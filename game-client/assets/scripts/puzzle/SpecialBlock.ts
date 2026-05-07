// SpecialBlock.ts — behaviors for Bomb, Windmill, Lantern (Light), and Wave special tiles.
// v2: Windmill now clears full row AND full column (cross/十字 pattern).
//     Wave supports up to 3 auto-retries if no valid pair is found after reshuffle.
//     Display names added for UI and analytics.

import { TileGrid, TileCell, TileType, Point } from './TileGrid';

// ---------------------------------------------------------------------------
// Enum + interface
// ---------------------------------------------------------------------------

export enum SpecialBlockType {
  BOMB = 'bomb',
  WINDMILL = 'windmill',
  LIGHT = 'light',
  WAVE = 'wave',
}

/** Human-readable display names keyed by SpecialBlockType. */
export const SPECIAL_BLOCK_DISPLAY_NAMES: Record<SpecialBlockType, { zh: string; en: string }> = {
  [SpecialBlockType.BOMB]:     { zh: '炸弹',        en: 'Bomb' },
  [SpecialBlockType.WINDMILL]: { zh: '风车（行消）', en: 'Windmill (Row/Column Clear)' },
  [SpecialBlockType.LIGHT]:    { zh: '灯光（自动连接）', en: 'Lantern (Auto-Connect)' },
  [SpecialBlockType.WAVE]:     { zh: '海浪（重排）', en: 'Wave (Reshuffle)' },
};

export interface ISpecialBlockBehavior {
  type: SpecialBlockType;
  /**
   * Execute the special block's effect.
   * @param grid       The live TileGrid instance.
   * @param position   Cell that holds / triggered this special block.
   * @param comboCount Current combo count at trigger time.
   */
  trigger(grid: TileGrid, position: Point, comboCount: number): void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Returns true if the board has at least one valid same-type pair available. */
function hasPotentialMatch(grid: TileGrid): boolean {
  const { rows, cols } = grid.getSize();
  const typeToCells = new Map<TileType, Point[]>();

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = grid.getTile(r, c);
      if (!cell || cell.type === TileType.NONE || cell.isObstacle || cell.isLocked) continue;
      const list = typeToCells.get(cell.type) ?? [];
      list.push({ row: r, col: c });
      typeToCells.set(cell.type, list);
      // Any type with ≥ 2 accessible tiles is a potential pair.
      if (list.length >= 2) return true;
    }
  }
  return false;
}

/** Fisher-Yates in-place shuffle of an array. */
function shuffleArray<T>(arr: T[]): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

// ---------------------------------------------------------------------------
// BombBehavior — clear 3×3 area centred on the tile
// ---------------------------------------------------------------------------

export class BombBehavior implements ISpecialBlockBehavior {
  readonly type = SpecialBlockType.BOMB;

  trigger(grid: TileGrid, position: Point, _comboCount: number): void {
    const { row, col } = position;
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        grid.clearTile(row + dr, col + dc);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// WindmillBehavior — clear full row AND full column (cross/十字 pattern)
// ---------------------------------------------------------------------------

export class WindmillBehavior implements ISpecialBlockBehavior {
  readonly type = SpecialBlockType.WINDMILL;

  trigger(grid: TileGrid, position: Point, _comboCount: number): void {
    const { rows, cols } = grid.getSize();
    const { row, col } = position;

    // Clear entire row
    for (let c = 0; c < cols; c++) {
      grid.clearTile(row, c);
    }
    // Clear entire column (intersection cell already cleared above)
    for (let r = 0; r < rows; r++) {
      grid.clearTile(r, col);
    }
  }
}

// ---------------------------------------------------------------------------
// LightBehavior — auto-find nearest tile of same type and trigger match
// ---------------------------------------------------------------------------

export class LightBehavior implements ISpecialBlockBehavior {
  readonly type = SpecialBlockType.LIGHT;

  trigger(grid: TileGrid, position: Point, _comboCount: number): void {
    const sourceCell = grid.getTile(position.row, position.col);
    if (!sourceCell || sourceCell.type === TileType.NONE) return;

    const targetType = sourceCell.type;
    const { rows, cols } = grid.getSize();

    let nearestPos: Point | null = null;
    let nearestDist = Infinity;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        // Skip the lantern cell itself
        if (r === position.row && c === position.col) continue;

        const cell = grid.getTile(r, c);
        if (!cell || cell.type !== targetType || cell.isLocked || cell.isObstacle) continue;

        const dist = Math.abs(r - position.row) + Math.abs(c - position.col);
        if (dist < nearestDist) {
          nearestDist = dist;
          nearestPos = { row: r, col: c };
        }
      }
    }

    if (nearestPos) {
      // Clear both the lantern tile and the nearest matching tile.
      grid.clearTile(position.row, position.col);
      grid.clearTile(nearestPos.row, nearestPos.col);
    }
    // If no match found, the lantern keeps pulsing (no clear occurs).
  }
}

// ---------------------------------------------------------------------------
// WaveBehavior — reshuffle all tiles while preserving type counts.
// Retries up to MAX_AUTO_RETRY times if no valid pair exists after shuffle.
// ---------------------------------------------------------------------------

const WAVE_MAX_AUTO_RETRY = 3;

export class WaveBehavior implements ISpecialBlockBehavior {
  readonly type = SpecialBlockType.WAVE;

  trigger(grid: TileGrid, _position: Point, _comboCount: number): void {
    const { rows, cols } = grid.getSize();

    // Gather all non-obstacle tile positions and their current types.
    const tileTypes: TileType[] = [];
    const positions: Point[] = [];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cell = grid.getTile(r, c);
        if (!cell || cell.isObstacle) continue;
        if (cell.type !== TileType.NONE) {
          tileTypes.push(cell.type);
          positions.push({ row: r, col: c });
        }
      }
    }

    if (positions.length === 0) return;

    let attempt = 0;
    let success = false;

    while (attempt <= WAVE_MAX_AUTO_RETRY) {
      shuffleArray(tileTypes);

      // Write shuffled types back while preserving all other cell properties.
      for (let i = 0; i < positions.length; i++) {
        const { row, col } = positions[i];
        const existing = grid.getTile(row, col) as TileCell;
        grid.setTile(row, col, { ...existing, type: tileTypes[i] });
      }

      if (hasPotentialMatch(grid)) {
        success = true;
        break;
      }

      attempt++;
    }

    // If all retries are exhausted without finding a valid pair, the last
    // shuffle result is kept — the game engine is responsible for handling
    // the deadlock (e.g. hint overlay or forced hint).
    if (!success) {
      console.warn(`[WaveBehavior] No valid pair found after ${WAVE_MAX_AUTO_RETRY} retries. Keeping last shuffle.`);
    }
  }
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export class SpecialBlockFactory {
  static create(type: SpecialBlockType): ISpecialBlockBehavior {
    switch (type) {
      case SpecialBlockType.BOMB:
        return new BombBehavior();
      case SpecialBlockType.WINDMILL:
        return new WindmillBehavior();
      case SpecialBlockType.LIGHT:
        return new LightBehavior();
      case SpecialBlockType.WAVE:
        return new WaveBehavior();
      default: {
        const _exhaustive: never = type;
        throw new Error(`Unknown SpecialBlockType: ${_exhaustive}`);
      }
    }
  }
}
