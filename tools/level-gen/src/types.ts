/**
 * Level JSON types for Glow Island Match-3
 * Aligned with level-design.json schema_version 3.0
 * and puzzle-design.json v4.0 tile/obstacle/special_tile definitions.
 *
 * NOTE: This is NOT the same as level-editor's LevelSchema.ts (that file has
 * legacy type names).  This file uses the canonical names from the game-design docs.
 */

// ── Tile types ─────────────────────────────────────────────────────────────────

/** Canonical tile IDs as defined in puzzle-design.json */
export type TileCode =
  | 'T01' | 'T02' | 'T03' | 'T04' | 'T05' | 'T06' | 'T07' | 'T08'
  | 'T09' | 'T10' | 'T11' | 'T12' | 'T13' | 'T14' | 'T15' | 'T16'
  | 'T17' | 'T18' | 'T19' | 'T20';

export const ALL_TILES: TileCode[] = [
  'T01','T02','T03','T04','T05','T06','T07','T08',
  'T09','T10','T11','T12','T13','T14','T15','T16',
  'T17','T18','T19','T20',
];

/** Tiles unlocked per chapter (cumulative) — from puzzle-design.json */
export const TILES_BY_CHAPTER: Record<number, TileCode[]> = {
  1: ['T01','T02','T03','T04'],
  2: ['T01','T02','T03','T04','T05','T06','T07','T08'],
  3: ['T01','T02','T03','T04','T05','T06','T07','T08','T09','T10','T11','T12'],
  4: ['T01','T02','T03','T04','T05','T06','T07','T08','T09','T10','T11','T12','T13','T14','T15','T16'],
  5: ['T01','T02','T03','T04','T05','T06','T07','T08','T09','T10','T11','T12','T13','T14','T15','T16','T17','T18'],
  6: ALL_TILES,
};

// ── Cell ───────────────────────────────────────────────────────────────────────

export type CellKind = 'tile' | 'obstacle' | 'void';

export interface Cell {
  kind: CellKind;
  /** Present when kind === 'tile' */
  tile?: TileCode;
  /** Present when kind === 'obstacle' */
  obstacle?: ObstacleSpec;
}

// ── Obstacles ──────────────────────────────────────────────────────────────────

export type ObstacleType =
  | 'ice_block'
  | 'weed'
  | 'chain_lock'
  | 'portal'
  | 'single_path_corridor'
  | 'wooden_crate'
  | 'water_current'
  | 'spreading_obstacle';

export interface ObstacleSpec {
  type: ObstacleType;
  position?: [number, number];   // [row, col]
  /** ice_block: 1-3 */
  layers?: number;
  /** chain_lock: 1-3 matches required */
  required_matches?: number;
  /** portal */
  pair_id?: number;
  role?: 'entry' | 'exit';
  /** water_current */
  initial_direction?: 'up' | 'down' | 'left' | 'right';
  change_interval_s?: number;
  /** single_path_corridor */
  cells?: [number, number][];
  direction?: string;
  /** spreading_obstacle */
  variant?: 'vine' | 'moss';
  spread_interval_moves?: number;
}

// ── Special tiles ──────────────────────────────────────────────────────────────

export type SpecialTileType = 'cascade' | 'light_chain' | 'wave' | 'pierce' | 'swap';

export interface SpecialTileSpec {
  type: SpecialTileType;
  position: [number, number];
}

// ── Board events ───────────────────────────────────────────────────────────────

export type BoardEventType = 'tile_fall' | 'tile_slide' | 'board_rotate' | 'vine_spread';

export interface BoardEventSpec {
  type: BoardEventType;
  enabled: boolean;
  direction?: string;
  spread_interval_moves?: number;
}

// ── Objectives ─────────────────────────────────────────────────────────────────

export type ObjectiveType =
  | 'clear_tiles'
  | 'clear_ice'
  | 'free_chains'
  | 'traverse_path'
  | 'survive_spread';

export interface Objective {
  type: ObjectiveType;
  /** clear_tiles: optional tile type filter */
  tile_type?: TileCode | 'any';
  /** clear_tiles count / clear_ice count / free_chains count */
  count?: number;
  /** traverse_path */
  corridor_count?: number;
  /** survive_spread */
  tile_count?: number;
  spreading_obstacle_type?: string;
}

// ── Rewards ────────────────────────────────────────────────────────────────────

export interface MaterialReward {
  type: string;
  amount: number;
}

// ── Level ──────────────────────────────────────────────────────────────────────

export type LevelRole = 'tutorial' | 'standard' | 'story' | 'boss' | 'zen' | 'breather';

export type BoardShape = 'rectangle' | 'bay_contour' | 'island_contour' | 'lighthouse_contour';

/**
 * Canonical Level JSON schema (v3.0)
 * Written to game-client/assets/resources/levels/ch{N}/level_{N}_{M}.json
 */
export interface Level {
  /** "<chapter>-<level>" e.g. "1-3" */
  id: string;
  schema_version: '3.0';
  chapter: number;
  level: number;
  level_role: LevelRole;
  grid_size: [number, number];   // [rows, cols]
  shape: BoardShape;
  tile_types: TileCode[];
  objectives: Objective[];
  /** null means unlimited (zen/tutorial) */
  max_moves: number | null;
  obstacles: ObstacleSpec[];
  special_tiles: SpecialTileSpec[];
  board_events: BoardEventSpec[];
  material_reward: MaterialReward;
  coin_reward: number;
  emotional_note?: string;
  /**
   * Grid data — flat array, row-major.
   * Length == grid_size[0] * grid_size[1].
   * Each element is the TileCode, 'void', 'obstacle', or special tile type.
   * Primarily used by the solver; runtime loads from this field.
   */
  grid_data: string[];
}

// ── Generator / Solver API ─────────────────────────────────────────────────────

export type DifficultyBand = 'easy' | 'standard' | 'challenge' | 'boss' | 'zen';

export interface GeneratorParams {
  chapter: number;          // 1-6
  level_index: number;      // 1-30
  difficulty: DifficultyBand;
  seed: number;
}

export interface SolverResult {
  solvable: boolean;
  /** Minimum moves found by BFS; -1 if not solvable */
  min_moves: number;
  /** True when BFS hit the state cap (likely solvable) */
  bfs_exhausted: boolean;
  solution_path: string[];
}

export interface PipelineResult {
  level: Level | null;
  solver: SolverResult | null;
  accepted: boolean;
  attempts: number;
  rejection_reason?: string;
}
