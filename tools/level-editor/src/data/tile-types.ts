import type {
  TileId,
  SpecialBlockId,
  ObstacleId,
  PaletteItem,
} from '../types/LevelSchema';

export interface TileDefinition {
  id: TileId;
  name: string;
  colorHex: string;
  unlockChapter: number;
}

export const TILE_DEFINITIONS: TileDefinition[] = [
  { id: 'tile_01', name: '珊瑚橙',   colorHex: '#FF8C5A', unlockChapter: 1 },
  { id: 'tile_02', name: '海浪蓝',   colorHex: '#4DA6D4', unlockChapter: 1 },
  { id: 'tile_03', name: '沙滩米',   colorHex: '#E8D5A3', unlockChapter: 1 },
  { id: 'tile_04', name: '海草绿',   colorHex: '#7BC67A', unlockChapter: 1 },
  { id: 'tile_05', name: '灯笼黄',   colorHex: '#FFD166', unlockChapter: 2 },
  { id: 'tile_06', name: '石板灰',   colorHex: '#A0A0A0', unlockChapter: 2 },
  { id: 'tile_07', name: '砖瓦红',   colorHex: '#C0504D', unlockChapter: 2 },
  { id: 'tile_08', name: '暖木棕',   colorHex: '#8B5E3C', unlockChapter: 2 },
  { id: 'tile_09', name: '薰衣草紫', colorHex: '#B08DCA', unlockChapter: 3 },
  { id: 'tile_10', name: '粉樱',     colorHex: '#F4A7B9', unlockChapter: 3 },
  { id: 'tile_11', name: '晨雾白',   colorHex: '#EAF0F6', unlockChapter: 3 },
  { id: 'tile_12', name: '苔藓绿',   colorHex: '#4E7C59', unlockChapter: 3 },
  { id: 'tile_13', name: '深林棕',   colorHex: '#5C4033', unlockChapter: 4 },
  { id: 'tile_14', name: '营火橙',   colorHex: '#E07832', unlockChapter: 4 },
  { id: 'tile_15', name: '星空靛',   colorHex: '#3D4A8A', unlockChapter: 4 },
  { id: 'tile_16', name: '萤光绿',   colorHex: '#A3E635', unlockChapter: 4 },
  { id: 'tile_17', name: '温泉白',   colorHex: '#F0EAE2', unlockChapter: 5 },
  { id: 'tile_18', name: '矿物蓝',   colorHex: '#6EB5C0', unlockChapter: 5 },
  { id: 'tile_19', name: '夜深蓝',   colorHex: '#1A2A4A', unlockChapter: 6 },
  { id: 'tile_20', name: '灯塔金',   colorHex: '#FFB830', unlockChapter: 6 },
];

export interface SpecialBlockDefinition {
  id: SpecialBlockId;
  name: string;
  nameEn: string;
  colorHex: string;
}

export const SPECIAL_BLOCK_DEFINITIONS: SpecialBlockDefinition[] = [
  { id: 'bomb',     name: '炸弹', nameEn: 'Bomb Tile',    colorHex: '#FF4500' },
  { id: 'windmill', name: '风车', nameEn: 'Windmill Tile', colorHex: '#00BFFF' },
  { id: 'lantern',  name: '灯光', nameEn: 'Lantern Tile',  colorHex: '#FFA500' },
  { id: 'wave',     name: '海浪', nameEn: 'Wave Tile',     colorHex: '#1E90FF' },
];

export interface ObstacleDefinition {
  id: ObstacleId;
  name: string;
  nameEn: string;
  colorHex: string;
  unlockChapter: number;
}

export const OBSTACLE_DEFINITIONS: ObstacleDefinition[] = [
  { id: 'ice_block',     name: '冰块', nameEn: 'Ice Block',     colorHex: '#A8D8EA', unlockChapter: 3 },
  { id: 'weed',          name: '杂草', nameEn: 'Weed',          colorHex: '#5A7A3A', unlockChapter: 2 },
  { id: 'wooden_crate',  name: '木箱', nameEn: 'Wooden Crate',  colorHex: '#8B6914', unlockChapter: 4 },
  { id: 'water_current', name: '水流', nameEn: 'Water Current', colorHex: '#3B9FD1', unlockChapter: 5 },
];

// Build complete palette items
export const PALETTE_ITEMS: PaletteItem[] = [
  { id: 'empty', label: '清空', color: '#2a2a3a', category: 'empty' },
  ...TILE_DEFINITIONS.map((t) => ({
    id: t.id as PaletteItem['id'],
    label: t.name,
    color: t.colorHex,
    category: 'tile' as const,
  })),
  ...SPECIAL_BLOCK_DEFINITIONS.map((s) => ({
    id: s.id as PaletteItem['id'],
    label: s.name,
    color: s.colorHex,
    category: 'special' as const,
  })),
  ...OBSTACLE_DEFINITIONS.map((o) => ({
    id: o.id as PaletteItem['id'],
    label: o.name,
    color: o.colorHex,
    category: 'obstacle' as const,
  })),
];

export function getTileColor(id: TileId): string {
  return TILE_DEFINITIONS.find((t) => t.id === id)?.colorHex ?? '#888';
}

export function getSpecialColor(id: SpecialBlockId): string {
  return SPECIAL_BLOCK_DEFINITIONS.find((s) => s.id === id)?.colorHex ?? '#888';
}

export function getObstacleColor(id: ObstacleId): string {
  return OBSTACLE_DEFINITIONS.find((o) => o.id === id)?.colorHex ?? '#888';
}

export const CHAPTER_SIZES: { chapter: number; cols: number; rows: number }[] = [
  { chapter: 1, cols: 6,  rows: 6 },
  { chapter: 2, cols: 7,  rows: 7 },
  { chapter: 3, cols: 8,  rows: 8 },
  { chapter: 4, cols: 8,  rows: 8 },
  { chapter: 5, cols: 9,  rows: 9 },
  { chapter: 6, cols: 10, rows: 10 },
];
