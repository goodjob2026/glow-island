// Loads, validates, and converts level configs from bundled level-design data.
// Production: swap hardcoded import for resources.load('data/level-design', JsonAsset)

import { TileCell, TileType, ObstacleType } from '../puzzle/TileGrid';
import { BoardGenerator } from '../puzzle/BoardGenerator';
import type { LevelConfig as BoardLevelConfig } from '../puzzle/BoardGenerator';

// ------- Domain types -------------------------------------------------------

export interface ObjectiveConfig {
  type: string;
  count?: number;
  target_type?: string;
  tile_type?: string;
  required_combo_count?: number;
  min_combo_threshold?: number;
}

export interface ObstacleConfig {
  type: string;
  positions: [number, number][];
}

export interface SpecialBlockConfig {
  type: string;
  position: [number, number];
}

export interface LevelConfig {
  id: string;
  chapter: number;
  level: number;
  grid_size: [number, number];
  tile_types: string[];
  objectives: ObjectiveConfig[];
  max_moves: number | null;
  obstacles: ObstacleConfig[];
  special_blocks: SpecialBlockConfig[];
  board_events: string[];
  material_reward: { type: string; amount: number };
  coin_reward: number;
}

// ------- Tile-type mapping ---------------------------------------------------

const TILE_TYPE_MAP: Record<string, TileType> = {
  tile_01: TileType.T01,
  tile_02: TileType.T02,
  tile_03: TileType.T03,
  tile_04: TileType.T04,
  tile_05: TileType.T05,
  tile_06: TileType.T06,
  tile_07: TileType.T07,
  tile_08: TileType.T08,
  tile_09: TileType.T09,
  tile_10: TileType.T10,
  tile_11: TileType.T11,
  tile_12: TileType.T12,
  tile_13: TileType.T13,
  tile_14: TileType.T14,
  tile_15: TileType.T15,
  tile_16: TileType.T16,
  tile_17: TileType.T17,
  tile_18: TileType.T18,
  tile_19: TileType.T19,
  tile_20: TileType.T20,
};

const OBSTACLE_TYPE_MAP: Record<string, ObstacleType> = {
  ice_block: ObstacleType.ICE_BLOCK,
  weed: ObstacleType.WEED,
  wooden_crate: ObstacleType.WOODEN_CRATE,
  water_current: ObstacleType.WATER_CURRENT,
};

// ------- Bundled level data (MVP) -------------------------------------------
// Production: replace with resources.load('data/level-design', cc.JsonAsset)

let _levelDataCache: LevelConfig[] | null = null;

async function getBundledLevels(): Promise<LevelConfig[]> {
  if (_levelDataCache) return _levelDataCache;

  // Dynamic import of the local design JSON.
  // In a Cocos Creator project this should be replaced with:
  //   const asset = await new Promise<cc.JsonAsset>(...) using resources.load
  // For MVP, fall back to a minimal inline dataset if the import fails.
  try {
    // Attempt dynamic import from project root via the engine bundle path.
    // This path is relative to the Cocos web-mobile/native bundle output.
    const json = await import('../../../../.allforai/game-design/level-design.json');
    _levelDataCache = (json.default?.levels ?? json.levels ?? []) as LevelConfig[];
  } catch {
    console.warn('[LevelLoader] Could not dynamically import level-design.json, using inline fallback.');
    _levelDataCache = INLINE_FALLBACK_LEVELS;
  }

  return _levelDataCache;
}

// ------- Public API ---------------------------------------------------------

export class LevelLoader {
  private generator = new BoardGenerator();

  /**
   * Load a level config by id (e.g. "1-1").
   * Rejects if the level is not found or validation fails.
   */
  async load(levelId: string): Promise<LevelConfig> {
    const levels = await getBundledLevels();
    const config = levels.find(l => l.id === levelId);
    if (!config) {
      throw new Error(`[LevelLoader] Level "${levelId}" not found`);
    }
    if (!this.validate(config)) {
      throw new Error(`[LevelLoader] Level "${levelId}" failed validation`);
    }
    return config;
  }

  /** Validate that all required fields are present and sensible. */
  validate(config: LevelConfig): boolean {
    if (!config || typeof config !== 'object') return false;
    if (typeof config.id !== 'string' || config.id.trim() === '') return false;
    if (typeof config.chapter !== 'number' || config.chapter < 1) return false;
    if (typeof config.level !== 'number' || config.level < 1) return false;
    if (!Array.isArray(config.grid_size) || config.grid_size.length !== 2) return false;
    if (config.grid_size[0] < 2 || config.grid_size[1] < 2) return false;
    if (!Array.isArray(config.tile_types) || config.tile_types.length === 0) return false;
    if (!Array.isArray(config.objectives) || config.objectives.length === 0) return false;
    if (config.max_moves !== null && (typeof config.max_moves !== 'number' || config.max_moves < 1)) return false;
    if (!config.material_reward || typeof config.material_reward.type !== 'string') return false;
    if (typeof config.coin_reward !== 'number' || config.coin_reward < 0) return false;
    return true;
  }

  /** Build a TileCell[][] from a level config, delegating to BoardGenerator. */
  createBoard(config: LevelConfig): TileCell[][] {
    const [rows, cols] = config.grid_size;

    const tileTypes: TileType[] = config.tile_types
      .map(t => TILE_TYPE_MAP[t])
      .filter((t): t is TileType => t !== undefined);

    const obstacles = config.obstacles.flatMap(obs =>
      obs.positions.map(([r, c]) => ({
        row: r,
        col: c,
        obstacleType: OBSTACLE_TYPE_MAP[obs.type] ?? ObstacleType.WOODEN_CRATE,
      }))
    );

    const lockedCells = config.special_blocks
      .filter(sb => sb.type === 'locked')
      .map(sb => ({ row: sb.position[0], col: sb.position[1] }));

    const boardCfg: BoardLevelConfig = { rows, cols, tileTypes, obstacles, lockedCells };
    return this.generator.generateFromConfig(boardCfg);
  }
}

// ------- Inline fallback (first 3 levels) used if JSON import fails ----------

const INLINE_FALLBACK_LEVELS: LevelConfig[] = [
  {
    id: '1-1', chapter: 1, level: 1,
    grid_size: [4, 4], tile_types: ['tile_01', 'tile_02'],
    objectives: [{ type: 'clear_tiles', tile_type: 'any', count: 16 }],
    max_moves: null, obstacles: [], special_blocks: [], board_events: [],
    material_reward: { type: '浮木', amount: 3 }, coin_reward: 15,
  },
  {
    id: '1-2', chapter: 1, level: 2,
    grid_size: [5, 5], tile_types: ['tile_01', 'tile_02', 'tile_03'],
    objectives: [{ type: 'clear_tiles', tile_type: 'any', count: 20 }],
    max_moves: null, obstacles: [], special_blocks: [], board_events: ['tile_gravity'],
    material_reward: { type: '浮木', amount: 3 }, coin_reward: 18,
  },
  {
    id: '1-3', chapter: 1, level: 3,
    grid_size: [5, 5], tile_types: ['tile_01', 'tile_02', 'tile_03'],
    objectives: [
      { type: 'clear_tiles', tile_type: 'any', count: 24 },
      { type: 'combo_challenge', required_combo_count: 2, min_combo_threshold: 2 },
    ],
    max_moves: null, obstacles: [], special_blocks: [], board_events: ['tile_gravity'],
    material_reward: { type: '绳索', amount: 2 }, coin_reward: 20,
  },
];
