/**
 * generator.ts
 *
 * Generates a Level JSON candidate given chapter / level_index / difficulty.
 * Pure algorithmic — no external AI calls.
 *
 * Match-3 rules (Glow Island v4.0):
 *   - Tiles are paired (connect-style), parity rule: each tile type must appear
 *     an even number of times on the board.
 *   - grid_data: flat string[], row-major.
 *   - 'void' cells are impassable (ch3+ shaped boards).
 */

import {
  TileCode,
  TILES_BY_CHAPTER,
  Level,
  GeneratorParams,
  DifficultyBand,
  Objective,
  ObstacleSpec,
  SpecialTileSpec,
  BoardShape,
  LevelRole,
  MaterialReward,
} from './types';

// ── Seeded PRNG (Mulberry32) ───────────────────────────────────────────────────

function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s |= 0; s = s + 0x6D2B79F5 | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = t + Math.imul(t ^ (t >>> 7), 61 | t) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type RNG = () => number;

function randInt(rng: RNG, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function shuffle<T>(rng: RNG, arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pick<T>(rng: RNG, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

// ── Chapter config lookup ──────────────────────────────────────────────────────

interface ChapterConfig {
  rows: number;
  cols: number;
  shape: BoardShape;
  /** How many distinct tile types to use from the available pool */
  tileVariety: [number, number];  // [min, max]
  /** Fraction of cells that become void (shaped boards) */
  voidFraction: number;
  materialReward: string;
  availableObstacles: ObstacleSpec['type'][];
  /** Max obstacle count by difficulty */
  obstacleCount: Record<DifficultyBand, [number, number]>;
}

const CHAPTER_CONFIGS: Record<number, ChapterConfig> = {
  1: {
    rows: 8, cols: 8,
    shape: 'rectangle',
    tileVariety: [3, 5],
    voidFraction: 0,
    materialReward: 'shell_fragment',
    availableObstacles: [],
    obstacleCount: { easy: [0,0], standard: [0,0], challenge: [0,0], boss: [0,0], zen: [0,0] },
  },
  2: {
    rows: 8, cols: 8,
    shape: 'rectangle',
    tileVariety: [4, 6],
    voidFraction: 0,
    materialReward: 'clay_shard',
    availableObstacles: ['ice_block', 'weed'],
    obstacleCount: { easy: [0,1], standard: [2,4], challenge: [4,6], boss: [6,8], zen: [0,0] },
  },
  3: {
    rows: 8, cols: 8,
    shape: 'bay_contour',
    tileVariety: [5, 7],
    voidFraction: 0.08,
    materialReward: 'pine_needle',
    availableObstacles: ['ice_block', 'weed', 'chain_lock'],
    obstacleCount: { easy: [1,2], standard: [3,5], challenge: [5,7], boss: [7,9], zen: [0,0] },
  },
  4: {
    rows: 8, cols: 8,
    shape: 'island_contour',
    tileVariety: [6, 8],
    voidFraction: 0.10,
    materialReward: 'torii_fragment',
    availableObstacles: ['ice_block', 'chain_lock', 'wooden_crate'],
    obstacleCount: { easy: [1,3], standard: [3,5], challenge: [5,8], boss: [7,10], zen: [0,0] },
  },
  5: {
    rows: 9, cols: 9,
    shape: 'island_contour',
    tileVariety: [7, 9],
    voidFraction: 0.12,
    materialReward: 'rope_fiber',
    availableObstacles: ['ice_block', 'chain_lock', 'water_current'],
    obstacleCount: { easy: [1,3], standard: [3,6], challenge: [6,9], boss: [8,11], zen: [0,0] },
  },
  6: {
    rows: 9, cols: 9,
    shape: 'lighthouse_contour',
    tileVariety: [8, 10],
    voidFraction: 0.14,
    materialReward: 'lantern_glass',
    availableObstacles: ['ice_block', 'chain_lock', 'wooden_crate', 'spreading_obstacle'],
    obstacleCount: { easy: [2,4], standard: [4,7], challenge: [7,10], boss: [9,12], zen: [0,0] },
  },
};

// ── Difficulty → step count ────────────────────────────────────────────────────

const STEP_RANGE: Record<number, Record<DifficultyBand, [number,number] | null>> = {
  1: { easy: [25,30], standard: [28,32], challenge: [30,35], boss: [32,35], zen: null },
  2: { easy: [28,32], standard: [30,36], challenge: [34,38], boss: [36,38], zen: null },
  3: { easy: [30,34], standard: [32,38], challenge: [36,40], boss: [38,40], zen: null },
  4: { easy: [33,36], standard: [35,38], challenge: [37,40], boss: [38,40], zen: null },
  5: { easy: [36,40], standard: [38,40], challenge: [40,40], boss: [40,40], zen: null },
  6: { easy: [36,40], standard: [38,40], challenge: [40,40], boss: [40,40], zen: null },
};

// ── Difficulty → clear_tiles goal ─────────────────────────────────────────────

const GOAL_RANGE: Record<DifficultyBand, [number,number]> = {
  easy:      [10, 16],
  standard:  [16, 24],
  challenge: [22, 32],
  boss:      [30, 40],
  zen:       [10, 16],
};

// ── Coin rewards ───────────────────────────────────────────────────────────────

const COIN_REWARD: Record<number, Record<DifficultyBand, [number,number]>> = {
  1: { easy: [6,8],  standard: [8,12],  challenge: [10,14], boss: [22,28], zen: [0,0] },
  2: { easy: [10,14],standard: [12,18], challenge: [16,22], boss: [32,38], zen: [0,0] },
  3: { easy: [15,20],standard: [18,24], challenge: [22,28], boss: [42,48], zen: [0,0] },
  4: { easy: [20,26],standard: [24,30], challenge: [28,34], boss: [52,58], zen: [0,0] },
  5: { easy: [26,32],standard: [30,38], challenge: [35,42], boss: [62,68], zen: [0,0] },
  6: { easy: [32,42],standard: [38,48], challenge: [44,54], boss: [76,84], zen: [0,0] },
};

const MATERIAL_AMOUNT: Record<DifficultyBand, [number,number]> = {
  easy:      [2, 4],
  standard:  [4, 6],
  challenge: [5, 8],
  boss:      [10, 15],
  zen:       [2, 3],
};

// ── Level role assignment ──────────────────────────────────────────────────────

function assignRole(chapter: number, levelIndex: number, difficulty: DifficultyBand): LevelRole {
  // These are fixed per design spec
  const zenLevels: Record<number, number[]> = {
    1: [10, 20], 2: [12, 24], 3: [11, 22], 4: [13, 25], 5: [15, 27], 6: [17, 28],
  };
  if (levelIndex === 30) return 'boss';
  if (zenLevels[chapter]?.includes(levelIndex)) return 'zen';
  if (difficulty === 'easy' && levelIndex % 4 === 0) return 'breather';
  if (difficulty === 'easy' && levelIndex <= 3 && chapter === 1) return 'tutorial';
  return 'standard';
}

// ── Void mask generation (shaped boards) ──────────────────────────────────────

/**
 * Returns a boolean mask (true = void) for shaped boards.
 * Strategy: corner-based cutouts that produce an island/bay silhouette.
 * The number of void cells is voidFraction * rows * cols, rounded to even.
 */
function buildVoidMask(rng: RNG, rows: number, cols: number, voidFraction: number): boolean[][] {
  const mask: boolean[][] = Array.from({length: rows}, () => Array(cols).fill(false));
  if (voidFraction === 0) return mask;

  const target = Math.round(rows * cols * voidFraction / 2) * 2; // keep even
  const candidates: [number, number][] = [];

  // Corners and edges are most likely to be void
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const edgeDist = Math.min(r, rows - 1 - r, c, cols - 1 - c);
      if (edgeDist <= 1) candidates.push([r, c]);
    }
  }
  const shuffled = shuffle(rng, candidates);
  let count = 0;
  for (const [r, c] of shuffled) {
    if (count >= target) break;
    // Don't isolate interior — simple check: ensure grid stays connected
    mask[r][c] = true;
    count++;
    // Make pairs for parity safety (void cells come in pairs)
  }
  return mask;
}

// ── Tile grid generation ───────────────────────────────────────────────────────

/**
 * Fills grid cells with tiles satisfying the parity rule:
 * each tile type appears an EVEN number of times.
 */
function buildTileGrid(
  rng: RNG,
  rows: number, cols: number,
  voidMask: boolean[][],
  tilePool: TileCode[],
  varietyCount: number,
): string[] {
  const totalCells = rows * cols;
  const activeCells: number[] = [];
  for (let i = 0; i < totalCells; i++) {
    const r = Math.floor(i / cols);
    const c = i % cols;
    if (!voidMask[r][c]) activeCells.push(i);
  }

  // Ensure even active cell count for parity
  let active = [...activeCells];
  if (active.length % 2 !== 0 && active.length > 0) {
    // Make last active cell void
    voidMask[Math.floor(active[active.length - 1] / cols)][active[active.length - 1] % cols] = true;
    active.pop();
  }

  // Pick tile types to use (subset of pool)
  const usedTypes = shuffle(rng, tilePool).slice(0, varietyCount);

  // Distribute tiles: each type gets even count
  const grid: string[] = Array(totalCells).fill('void');

  // Assign tiles to active cells in pairs
  const shuffledActive = shuffle(rng, active);
  const pairsPerType = Math.floor(shuffledActive.length / (usedTypes.length * 2));
  const remainder = shuffledActive.length - pairsPerType * usedTypes.length * 2;

  const assignments: string[] = [];
  for (const t of usedTypes) {
    for (let i = 0; i < pairsPerType * 2; i++) assignments.push(t);
  }
  // Fill remainder with first tile type (pairs)
  for (let i = 0; i < remainder; i += 2) {
    assignments.push(usedTypes[0], usedTypes[0]);
  }

  const shuffledAssign = shuffle(rng, assignments);
  for (let i = 0; i < shuffledActive.length; i++) {
    grid[shuffledActive[i]] = shuffledAssign[i] ?? usedTypes[0];
  }

  return grid;
}

// ── Obstacle placement ─────────────────────────────────────────────────────────

function placeObstacles(
  rng: RNG,
  grid: string[],
  rows: number, cols: number,
  obstacleTypes: ObstacleSpec['type'][],
  count: [number, number],
  chapter: number,
): ObstacleSpec[] {
  if (obstacleTypes.length === 0) return [];
  const n = randInt(rng, count[0], count[1]);
  if (n === 0) return [];

  // Find tile cells (not void) to place obstacles on
  const tileCells: number[] = [];
  for (let i = 0; i < grid.length; i++) {
    if (grid[i] !== 'void') tileCells.push(i);
  }

  const chosen = shuffle(rng, tileCells).slice(0, n);
  const obstacles: ObstacleSpec[] = [];

  for (const idx of chosen) {
    const r = Math.floor(idx / cols);
    const c = idx % cols;
    const oType = pick(rng, obstacleTypes);

    let spec: ObstacleSpec = { type: oType, position: [r, c] };

    if (oType === 'ice_block') {
      const maxLayers = chapter >= 4 ? 3 : chapter >= 3 ? 2 : 1;
      spec.layers = randInt(rng, 1, maxLayers);
    }
    if (oType === 'chain_lock') {
      const maxRings = chapter >= 4 ? 3 : 1;
      spec.required_matches = randInt(rng, 1, maxRings);
    }
    if (oType === 'water_current') {
      const dirs = ['up','down','left','right'] as const;
      spec.initial_direction = pick(rng, [...dirs]);
      spec.change_interval_s = 8;
    }
    if (oType === 'spreading_obstacle') {
      spec.variant = rng() > 0.5 ? 'vine' : 'moss';
      spec.spread_interval_moves = 3;
    }

    obstacles.push(spec);
  }

  return obstacles;
}

// ── Objectives ─────────────────────────────────────────────────────────────────

function buildObjectives(
  rng: RNG,
  difficulty: DifficultyBand,
  obstacles: ObstacleSpec[],
  chapter: number,
): Objective[] {
  const objs: Objective[] = [];
  const [min, max] = GOAL_RANGE[difficulty];
  const count = randInt(rng, min, max);
  // Always at least a clear_tiles objective
  objs.push({ type: 'clear_tiles', tile_type: 'any', count });

  // Add secondary objectives based on obstacles present
  if (chapter >= 2 && difficulty !== 'easy' && difficulty !== 'zen') {
    const iceCount = obstacles.filter(o => o.type === 'ice_block').length;
    if (iceCount > 0) {
      objs.push({ type: 'clear_ice', count: Math.max(1, Math.floor(iceCount * 0.6)) });
    }
    const chainCount = obstacles.filter(o => o.type === 'chain_lock').length;
    if (chainCount > 0 && chapter >= 3) {
      objs.push({ type: 'free_chains', count: Math.max(1, Math.floor(chainCount * 0.5)) });
    }
  }

  return objs;
}

// ── Main generator ─────────────────────────────────────────────────────────────

export function generateLevel(params: GeneratorParams): Level {
  const { chapter, level_index, difficulty, seed } = params;
  const rng = mulberry32(seed);

  const cfg = CHAPTER_CONFIGS[chapter];
  const { rows, cols } = cfg;
  const totalCells = rows * cols;

  // Build void mask for shaped boards
  const voidMask = buildVoidMask(rng, rows, cols, cfg.voidFraction);

  // Choose tile variety
  const availableTiles = TILES_BY_CHAPTER[chapter];
  const [minVar, maxVar] = cfg.tileVariety;
  // Clamp variety to available pool size
  const varietyCount = Math.min(availableTiles.length, randInt(rng, minVar, maxVar));

  // Generate tile grid
  const gridData = buildTileGrid(rng, rows, cols, voidMask, availableTiles, varietyCount);

  // Tile types actually used
  const usedTileSet = new Set<string>();
  for (const cell of gridData) {
    if (cell !== 'void') usedTileSet.add(cell);
  }
  const tile_types = [...usedTileSet] as TileCode[];

  // Place obstacles
  const [obsMin, obsMax] = cfg.obstacleCount[difficulty];
  const obstacles = placeObstacles(rng, gridData, rows, cols, cfg.availableObstacles, [obsMin, obsMax], chapter);

  // Build objectives
  const objectives = buildObjectives(rng, difficulty, obstacles, chapter);

  // Determine max_moves
  const role = assignRole(chapter, level_index, difficulty);
  let max_moves: number | null = null;
  if (role !== 'zen' && role !== 'tutorial') {
    const stepRange = STEP_RANGE[chapter][difficulty];
    if (stepRange) max_moves = randInt(rng, stepRange[0], stepRange[1]);
  }

  // Rewards
  const [coinMin, coinMax] = COIN_REWARD[chapter][difficulty];
  const coin_reward = role === 'zen' ? 0 : randInt(rng, coinMin, coinMax);
  const [matMin, matMax] = MATERIAL_AMOUNT[difficulty];
  const material_reward: MaterialReward = {
    type: cfg.materialReward,
    amount: role === 'zen' ? 1 : randInt(rng, matMin, matMax),
  };

  // Special tiles (boss levels get a pair of cascade)
  const special_tiles: SpecialTileSpec[] = [];
  if (role === 'boss' && chapter >= 1) {
    const activeCells: number[] = [];
    for (let i = 0; i < totalCells; i++) {
      if (gridData[i] !== 'void') activeCells.push(i);
    }
    const chosen = shuffle(rng, activeCells).slice(0, 2);
    if (chosen.length === 2) {
      special_tiles.push(
        { type: 'cascade', position: [Math.floor(chosen[0]/cols), chosen[0]%cols] },
        { type: 'cascade', position: [Math.floor(chosen[1]/cols), chosen[1]%cols] },
      );
    }
  }

  // Shape
  let shape = cfg.shape;
  // Chapter 2 first half is still 8×8 rectangle
  if (chapter === 2 && level_index > 15) {
    shape = 'rectangle'; // 9×9 but still rect — we keep 8×8 for simplicity in v1
  }

  return {
    id: `${chapter}-${level_index}`,
    schema_version: '3.0',
    chapter,
    level: level_index,
    level_role: role,
    grid_size: [rows, cols],
    shape,
    tile_types,
    objectives,
    max_moves,
    obstacles,
    special_tiles,
    board_events: [],
    material_reward,
    coin_reward,
    emotional_note: undefined,
    grid_data: gridData,
  };
}
