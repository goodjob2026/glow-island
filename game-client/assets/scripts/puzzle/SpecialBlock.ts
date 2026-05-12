// SpecialBlock.ts — behaviors for the 5 tactical tiles (wave, light_chain, pierce, swap, cascade).

import { TileGrid, TileCell, TileType, Point } from './TileGrid';

// ---------------------------------------------------------------------------
// Enum + display names
// ---------------------------------------------------------------------------

export enum SpecialBlockType {
  WAVE        = 'wave',
  LIGHT_CHAIN = 'light_chain',
  PIERCE      = 'pierce',
  SWAP        = 'swap',
  CASCADE     = 'cascade',
}

export const SPECIAL_BLOCK_DISPLAY_NAMES: Record<SpecialBlockType, { zh: string; en: string }> = {
  [SpecialBlockType.WAVE]:        { zh: '光波',  en: 'Wave' },
  [SpecialBlockType.LIGHT_CHAIN]: { zh: '光链',  en: 'Light Chain' },
  [SpecialBlockType.PIERCE]:      { zh: '穿透',  en: 'Pierce' },
  [SpecialBlockType.SWAP]:        { zh: '置换',  en: 'Swap' },
  [SpecialBlockType.CASCADE]:     { zh: '连锁',  en: 'Cascade' },
};

/**
 * Minimum combo count that auto-generates this tile.
 * null = editor preset only (never auto-generated).
 */
export const SPECIAL_BLOCK_GENERATION_COMBO: Record<SpecialBlockType, number | null> = {
  [SpecialBlockType.WAVE]:        6,
  [SpecialBlockType.LIGHT_CHAIN]: 4,
  [SpecialBlockType.PIERCE]:      null,
  [SpecialBlockType.SWAP]:        null,
  [SpecialBlockType.CASCADE]:     3,
};

// ---------------------------------------------------------------------------
// Interface
// ---------------------------------------------------------------------------

export interface ISpecialBlockBehavior {
  type: SpecialBlockType;
  trigger(grid: TileGrid, position: Point, comboCount: number): void;
}

// ---------------------------------------------------------------------------
// Obstacle layer helpers (ice, chain, vine, crate)
// ---------------------------------------------------------------------------

/** Clear all obstacle layers in a single cell. */
function clearObstacleAt(grid: TileGrid, pos: Point): void {
  const cell = grid.getTile(pos.row, pos.col);
  if (!cell || !cell.isObstacle) return;
  grid.setTile(pos.row, pos.col, {
    ...cell,
    isObstacle: false,
    obstacleType: undefined,
    obstacleHits: undefined,
    isLocked: false,
  });
}

/** Midpoint (floor) between two grid positions. */
function midpoint(a: Point, b: Point): Point {
  return {
    row: Math.floor((a.row + b.row) / 2),
    col: Math.floor((a.col + b.col) / 2),
  };
}

// ---------------------------------------------------------------------------
// WaveBehavior
// Trigger: player pairs two 光波 tiles.
// Effect:  clears ALL obstacle layers in the 3×3 area centred on the midpoint
//          of the two tiles' connection. The matching tiles themselves stay.
//          Also grants "free path zone" buff for 5s via onWaveBuffStart callback.
// ---------------------------------------------------------------------------

export class WaveBehavior implements ISpecialBlockBehavior {
  readonly type = SpecialBlockType.WAVE;

  onWaveBuffStart: ((duration: number, center: Point) => void) | null = null;

  trigger(grid: TileGrid, position: Point, _comboCount: number): void {
    // `position` is the midpoint between the two paired wave tiles.
    // Callers should pass the midpoint directly; if only one tile position is
    // available, it is used as the centre.
    const center = position;

    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        clearObstacleAt(grid, { row: center.row + dr, col: center.col + dc });
      }
    }

    // TODO: trigger VFX — wave ripple on 3×3 area
    this.onWaveBuffStart?.(5, center);
  }

  /**
   * Convenience helper — callers may pass both paired tile positions so the
   * midpoint is computed automatically.
   */
  triggerWithPair(grid: TileGrid, a: Point, b: Point, comboCount: number): void {
    this.trigger(grid, midpoint(a, b), comboCount);
  }
}

// ---------------------------------------------------------------------------
// LightChainBehavior
// Trigger: player pairs two 光链 tiles.
// Effect:  scans board for the tile type with the most instances, then
//          auto-matches ALL valid pairs of that type simultaneously.
//          If the count is odd, the last tile remains (preserves parity).
// ---------------------------------------------------------------------------

export class LightChainBehavior implements ISpecialBlockBehavior {
  readonly type = SpecialBlockType.LIGHT_CHAIN;

  trigger(grid: TileGrid, _position: Point, _comboCount: number): void {
    const { rows, cols } = grid.getSize();

    // Build per-type position lists.
    const typeMap = new Map<TileType, Point[]>();
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cell = grid.getTile(r, c);
        if (!cell || cell.type === TileType.NONE || cell.isObstacle || cell.isLocked) continue;
        const list = typeMap.get(cell.type) ?? [];
        list.push({ row: r, col: c });
        typeMap.set(cell.type, list);
      }
    }

    // Find type with the most instances.
    let bestType: TileType | null = null;
    let bestCount = 0;
    for (const [t, positions] of typeMap) {
      if (positions.length > bestCount) {
        bestCount = positions.length;
        bestType = t;
      }
    }

    if (!bestType || bestCount < 2) return;

    const positions = typeMap.get(bestType)!;
    // Match pairs sequentially (last tile stays if odd count).
    for (let i = 0; i + 1 < positions.length; i += 2) {
      grid.clearTile(positions[i].row, positions[i].col);
      grid.clearTile(positions[i + 1].row, positions[i + 1].col);
    }

    // TODO: trigger VFX — chain lightning connecting all cleared pairs
  }
}

// ---------------------------------------------------------------------------
// PierceBehavior
// Trigger: player pairs two 穿透 tiles.
// Effect:  grants "Pierce Mode" for 8s — connection paths may route through
//          ANY occupied cell. Same-type matching rule still applies.
//          Actual routing logic lives in the path-finder; this behavior only
//          signals the buff start via onPierceBuffStart.
// ---------------------------------------------------------------------------

export class PierceBehavior implements ISpecialBlockBehavior {
  readonly type = SpecialBlockType.PIERCE;

  onPierceBuffStart: ((duration: number) => void) | null = null;

  trigger(grid: TileGrid, _position: Point, _comboCount: number): void {
    // TODO: trigger VFX — pierce shimmer on board
    this.onPierceBuffStart?.(8);
  }
}

// ---------------------------------------------------------------------------
// SwapBehavior
// Trigger: player pairs two 置换 tiles.
// Effect:  enters Selection Mode — player picks any 2 cells; their contents
//          swap. 10s timeout; if not selected in time the swap tiles remain.
// ---------------------------------------------------------------------------

export class SwapBehavior implements ISpecialBlockBehavior {
  readonly type = SpecialBlockType.SWAP;

  onSwapSelectionStart: ((
    timeoutSec: number,
    onSelect: (a: Point, b: Point) => void,
    onTimeout: () => void,
  ) => void) | null = null;

  trigger(grid: TileGrid, _position: Point, _comboCount: number): void {
    // TODO: trigger VFX — selection highlight pulse

    this.onSwapSelectionStart?.(
      10,
      (a: Point, b: Point) => {
        // Perform the swap.
        const cellA = grid.getTile(a.row, a.col);
        const cellB = grid.getTile(b.row, b.col);
        if (cellA && cellB) {
          grid.setTile(a.row, a.col, { ...cellB });
          grid.setTile(b.row, b.col, { ...cellA });
        }
        // TODO: trigger VFX — swap animation
      },
      () => {
        // Timeout: swap tiles remain on board — nothing to clear.
        // TODO: trigger VFX — timeout flash
      },
    );
  }
}

// ---------------------------------------------------------------------------
// CascadeBehavior
// Trigger: player pairs two 连锁 tiles.
// Effect:  engine auto-executes up to 5 chain matches with 0.3s delay between
//          each. Stops early when no valid pair exists.
//          Actual pair finding + matching is delegated to callbacks so the
//          behavior stays decoupled from the match-finder.
// ---------------------------------------------------------------------------

const CASCADE_MAX_CHAINS = 5;
const CASCADE_DELAY_MS   = 300;

export class CascadeBehavior implements ISpecialBlockBehavior {
  readonly type = SpecialBlockType.CASCADE;

  onCascadeChainStart: ((
    maxChains: number,
    delayMs: number,
    findNextPair: () => [Point, Point] | null,
    autoMatch: (pair: [Point, Point]) => void,
  ) => void) | null = null;

  trigger(grid: TileGrid, _position: Point, _comboCount: number): void {
    // TODO: trigger VFX — cascade chain glow

    // Default implementation using setTimeout when no external handler is wired.
    if (this.onCascadeChainStart) {
      // Let the caller drive the chain (e.g. Cocos schedule instead of setTimeout).
      this.onCascadeChainStart(
        CASCADE_MAX_CHAINS,
        CASCADE_DELAY_MS,
        () => this._findBestPair(grid),
        (pair) => {
          grid.clearTile(pair[0].row, pair[0].col);
          grid.clearTile(pair[1].row, pair[1].col);
        },
      );
    } else {
      // Fallback: vanilla JS timer-based chain (works in test / web envs).
      this._runChain(grid, CASCADE_MAX_CHAINS);
    }
  }

  private _runChain(grid: TileGrid, remaining: number): void {
    if (remaining <= 0) return;
    const pair = this._findBestPair(grid);
    if (!pair) return;

    grid.clearTile(pair[0].row, pair[0].col);
    grid.clearTile(pair[1].row, pair[1].col);

    setTimeout(() => this._runChain(grid, remaining - 1), CASCADE_DELAY_MS);
  }

  /** Returns the shortest (by Manhattan distance) valid same-type pair, or null. */
  private _findBestPair(grid: TileGrid): [Point, Point] | null {
    const { rows, cols } = grid.getSize();
    const typeMap = new Map<TileType, Point[]>();

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cell = grid.getTile(r, c);
        if (!cell || cell.type === TileType.NONE || cell.isObstacle || cell.isLocked) continue;
        const list = typeMap.get(cell.type) ?? [];
        list.push({ row: r, col: c });
        typeMap.set(cell.type, list);
      }
    }

    let bestPair: [Point, Point] | null = null;
    let bestDist = Infinity;

    for (const positions of typeMap.values()) {
      if (positions.length < 2) continue;
      for (let i = 0; i < positions.length - 1; i++) {
        for (let j = i + 1; j < positions.length; j++) {
          const d = Math.abs(positions[i].row - positions[j].row)
                  + Math.abs(positions[i].col - positions[j].col);
          if (d < bestDist) {
            bestDist = d;
            bestPair = [positions[i], positions[j]];
          }
        }
      }
    }

    return bestPair;
  }
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export class SpecialBlockFactory {
  static create(type: SpecialBlockType): ISpecialBlockBehavior {
    switch (type) {
      case SpecialBlockType.WAVE:        return new WaveBehavior();
      case SpecialBlockType.LIGHT_CHAIN: return new LightChainBehavior();
      case SpecialBlockType.PIERCE:      return new PierceBehavior();
      case SpecialBlockType.SWAP:        return new SwapBehavior();
      case SpecialBlockType.CASCADE:     return new CascadeBehavior();
      default: {
        const _exhaustive: never = type;
        throw new Error(`Unknown SpecialBlockType: ${_exhaustive}`);
      }
    }
  }
}
