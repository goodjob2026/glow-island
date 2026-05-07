// Generates and validates playable board layouts from level configs or random seeds.

import { TileCell, TileType, ObstacleType } from './TileGrid';
import { TileMatcher } from './TileMatcher';

export interface ObstaclePlacement {
  row: number;
  col: number;
  obstacleType: ObstacleType;
}

export interface LevelConfig {
  rows: number;
  cols: number;
  tileTypes: TileType[];
  obstacles?: ObstaclePlacement[];
  lockedCells?: { row: number; col: number }[];
  tileCounts?: Partial<Record<TileType, number>>;
}

const MIN_MATCHABLE_PAIRS = 5;
const MAX_REGEN_ATTEMPTS = 20;

function makeEmptyCell(): TileCell {
  return { type: TileType.NONE, isObstacle: false, isSelected: false, isLocked: false };
}

function makeTileCell(type: TileType): TileCell {
  return { type, isObstacle: false, isSelected: false, isLocked: false };
}

function makeObstacleCell(obstacleType: ObstacleType): TileCell {
  const cell: TileCell = {
    type: TileType.NONE,
    isObstacle: true,
    obstacleType,
    isSelected: false,
    isLocked: false,
  };
  if (obstacleType === ObstacleType.ICE_BLOCK) {
    cell.obstacleHits = 2;
  }
  return cell;
}

class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed >>> 0;
  }

  next(): number {
    this.seed = (Math.imul(1664525, this.seed) + 1013904223) >>> 0;
    return this.seed / 0x100000000;
  }

  nextInt(max: number): number {
    return Math.floor(this.next() * max);
  }

  shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = this.nextInt(i + 1);
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
}

function countMatchablePairs(grid: TileCell[][], rows: number, cols: number): number {
  const matcher = new TileMatcher();
  let count = 0;
  for (let r1 = 0; r1 < rows; r1++) {
    for (let c1 = 0; c1 < cols; c1++) {
      const cell1 = grid[r1][c1];
      if (cell1.type === TileType.NONE || cell1.isLocked || cell1.isObstacle) continue;
      for (let r2 = r1; r2 < rows; r2++) {
        const cStart = r2 === r1 ? c1 + 1 : 0;
        for (let c2 = cStart; c2 < cols; c2++) {
          const cell2 = grid[r2][c2];
          if (cell2.type === TileType.NONE || cell2.isLocked || cell2.isObstacle) continue;
          if (cell1.type !== cell2.type) continue;
          const path = matcher.findPath(grid, r1, c1, r2, c2);
          if (path !== null) {
            count++;
            if (count >= MIN_MATCHABLE_PAIRS) return count;
          }
        }
      }
    }
  }
  return count;
}

function buildEmptyGrid(rows: number, cols: number): TileCell[][] {
  const grid: TileCell[][] = [];
  for (let r = 0; r < rows; r++) {
    grid[r] = [];
    for (let c = 0; c < cols; c++) {
      grid[r][c] = makeEmptyCell();
    }
  }
  return grid;
}

function generateRandomGrid(
  rows: number,
  cols: number,
  tileTypes: TileType[],
  rng: SeededRandom,
): TileCell[][] {
  const total = rows * cols;
  const typeCount = tileTypes.length;
  if (typeCount === 0) return buildEmptyGrid(rows, cols);

  const perType = Math.floor(total / typeCount);
  const remainder = total - perType * typeCount;

  const pool: TileType[] = [];
  for (let i = 0; i < typeCount; i++) {
    const count = i < remainder ? perType + 1 : perType;
    for (let j = 0; j < count; j++) {
      pool.push(tileTypes[i]);
    }
  }

  const shuffled = rng.shuffle(pool);
  const grid: TileCell[][] = [];
  let idx = 0;
  for (let r = 0; r < rows; r++) {
    grid[r] = [];
    for (let c = 0; c < cols; c++) {
      grid[r][c] = makeTileCell(shuffled[idx++]);
    }
  }
  return grid;
}

export class BoardGenerator {
  generateFromConfig(levelConfig: LevelConfig): TileCell[][] {
    const { rows, cols, tileTypes, obstacles, lockedCells } = levelConfig;
    const rng = new SeededRandom(Date.now() & 0xffffffff);

    for (let attempt = 0; attempt < MAX_REGEN_ATTEMPTS; attempt++) {
      const grid = generateRandomGrid(rows, cols, tileTypes, rng);

      if (obstacles) {
        for (const obs of obstacles) {
          if (obs.row >= 0 && obs.row < rows && obs.col >= 0 && obs.col < cols) {
            grid[obs.row][obs.col] = makeObstacleCell(obs.obstacleType);
          }
        }
      }

      if (lockedCells) {
        for (const lc of lockedCells) {
          if (lc.row >= 0 && lc.row < rows && lc.col >= 0 && lc.col < cols) {
            grid[lc.row][lc.col].isLocked = true;
          }
        }
      }

      if (countMatchablePairs(grid, rows, cols) >= MIN_MATCHABLE_PAIRS) {
        return grid;
      }
    }

    return generateRandomGrid(rows, cols, tileTypes, rng);
  }

  generateRandom(
    rows: number,
    cols: number,
    tileTypes: TileType[],
    seed?: number,
  ): TileCell[][] {
    const rng = new SeededRandom(seed !== undefined ? seed : (Date.now() & 0xffffffff));

    for (let attempt = 0; attempt < MAX_REGEN_ATTEMPTS; attempt++) {
      const grid = generateRandomGrid(rows, cols, tileTypes, rng);
      if (countMatchablePairs(grid, rows, cols) >= MIN_MATCHABLE_PAIRS) {
        return grid;
      }
    }

    return generateRandomGrid(rows, cols, tileTypes, rng);
  }
}
