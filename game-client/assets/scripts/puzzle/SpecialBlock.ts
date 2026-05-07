// SpecialBlock.ts — behaviors for Bomb, Windmill, Lantern (Light), and Wave special tiles.

import { TileGrid, TileCell, TileType } from './TileGrid';

// ---------------------------------------------------------------------------
// Enum + interface
// ---------------------------------------------------------------------------

export enum SpecialBlockType {
  BOMB = 'bomb',
  WINDMILL = 'windmill',
  LIGHT = 'light',
  WAVE = 'wave',
}

export interface ISpecialBlockBehavior {
  type: SpecialBlockType;
  /**
   * Execute the special block's effect.
   * @param grid       The live TileGrid instance.
   * @param position   Cell that holds / triggered this special block.
   * @param comboCount Current combo count at trigger time (reserved for future use).
   */
  trigger(grid: TileGrid, position: { row: number; col: number }, comboCount: number): void;
}

// ---------------------------------------------------------------------------
// BombBehavior — clear 3×3 area centred on the tile
// ---------------------------------------------------------------------------

export class BombBehavior implements ISpecialBlockBehavior {
  readonly type = SpecialBlockType.BOMB;

  trigger(grid: TileGrid, position: { row: number; col: number }, _comboCount: number): void {
    const { row, col } = position;
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        grid.clearTile(row + dr, col + dc);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// WindmillBehavior — clear entire column of the matched tile
// ---------------------------------------------------------------------------

export class WindmillBehavior implements ISpecialBlockBehavior {
  readonly type = SpecialBlockType.WINDMILL;

  trigger(grid: TileGrid, position: { row: number; col: number }, _comboCount: number): void {
    const { rows } = grid.getSize();
    const { col } = position;
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

  trigger(grid: TileGrid, position: { row: number; col: number }, _comboCount: number): void {
    const sourceCell = grid.getTile(position.row, position.col);
    if (!sourceCell || sourceCell.type === TileType.NONE) return;

    const targetType = sourceCell.type;
    const { rows, cols } = grid.getSize();

    let nearestPos: { row: number; col: number } | null = null;
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
      // Clear both the lantern tile and the nearest matching tile
      grid.clearTile(position.row, position.col);
      grid.clearTile(nearestPos.row, nearestPos.col);
    }
  }
}

// ---------------------------------------------------------------------------
// WaveBehavior — reshuffle all tiles while preserving type counts
// ---------------------------------------------------------------------------

export class WaveBehavior implements ISpecialBlockBehavior {
  readonly type = SpecialBlockType.WAVE;

  trigger(grid: TileGrid, _position: { row: number; col: number }, _comboCount: number): void {
    const { rows, cols } = grid.getSize();

    // Collect all non-obstacle tile types from the board
    const tileTypes: TileType[] = [];
    const positions: { row: number; col: number }[] = [];

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

    // Fisher-Yates shuffle
    for (let i = tileTypes.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [tileTypes[i], tileTypes[j]] = [tileTypes[j], tileTypes[i]];
    }

    // Write shuffled types back; preserve all other cell properties
    for (let i = 0; i < positions.length; i++) {
      const { row, col } = positions[i];
      const existing = grid.getTile(row, col)!;
      grid.setTile(row, col, { ...existing, type: tileTypes[i] });
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
