// Level Schema TypeScript types derived from puzzle-mechanics-spec.json

export type TileId =
  | 'tile_01' | 'tile_02' | 'tile_03' | 'tile_04' | 'tile_05'
  | 'tile_06' | 'tile_07' | 'tile_08' | 'tile_09' | 'tile_10'
  | 'tile_11' | 'tile_12' | 'tile_13' | 'tile_14' | 'tile_15'
  | 'tile_16' | 'tile_17' | 'tile_18' | 'tile_19' | 'tile_20';

export type SpecialBlockId = 'bomb' | 'windmill' | 'lantern' | 'wave';

export type ObstacleId = 'ice_block' | 'weed' | 'wooden_crate' | 'water_current';

export type BoardEventId = 'tile_gravity' | 'water_flow' | 'freeze_zone' | 'vine_spread';

export type ObjectiveType =
  | 'tile_target'
  | 'obstacle_clear'
  | 'score_target'
  | 'glow_energy'
  | 'combo_challenge';

export type CellType = 'empty' | 'tile' | 'special' | 'obstacle';

export interface CellContent {
  type: CellType;
  tileId?: TileId;
  specialId?: SpecialBlockId;
  obstacleId?: ObstacleId;
  /** overlay on top of tile (e.g. freeze_zone, vine_spread) */
  overlayEvent?: BoardEventId;
}

export interface LevelObjective {
  type: ObjectiveType;
  /** for tile_target */
  targetTileType?: TileId;
  /** for tile_target, obstacle_clear */
  requiredCount?: number;
  /** for score_target */
  requiredScore?: number;
  /** for glow_energy */
  requiredGlowEnergy?: number;
  /** for combo_challenge */
  requiredComboCount?: number;
  minComboThreshold?: number;
  /** for obstacle_clear */
  obstacleType?: ObstacleId;
}

export interface MaterialReward {
  type: string;
  amount: number;
}

export interface LevelReward {
  material?: MaterialReward;
  coins?: number;
}

export interface WaterFlowConfig {
  rowsOrCols: ('row' | 'col')[];
  indices: number[];
  direction: 'left' | 'right' | 'up' | 'down';
  intervalSeconds: number;
}

export interface BoardEventConfig {
  id: BoardEventId;
  waterFlow?: WaterFlowConfig;
}

export interface Level {
  id: string;
  chapter: number;
  sequence: number;
  name?: string;
  cols: number;
  rows: number;
  maxMoves?: number;
  objectives: LevelObjective[];
  reward: LevelReward;
  emotionalNote?: string;
  boardEvents: BoardEventConfig[];
  /** row-major: grid[row][col] */
  grid: CellContent[][];
}

export interface Chapter {
  id: number;
  name: string;
  levels: Level[];
}

export interface LevelDesign {
  version: string;
  chapters: Chapter[];
}

export type PaletteItemType = 'empty' | TileId | SpecialBlockId | ObstacleId;

export interface PaletteItem {
  id: PaletteItemType;
  label: string;
  color: string;
  category: 'empty' | 'tile' | 'special' | 'obstacle';
}
