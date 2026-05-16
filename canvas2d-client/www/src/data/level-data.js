import { LAYOUTS, pickLayout } from './layouts.js';

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Linear interpolation of steps across a level range (inclusive).
 * @param {number} lv       - 1-based level index within the segment
 * @param {number} total    - total levels in the segment
 * @param {number} start    - steps at lv 1
 * @param {number} end      - steps at lv = total
 * @returns {number}
 */
function lerp(lv, total, start, end) {
  if (total === 1) return start;
  return Math.round(start - (lv - 1) * (start - end) / (total - 1));
}

// ── Build LEVELS ──────────────────────────────────────────────────────────────

export const LEVELS = {};

// ── Chapter 1: Harbor Boat (6×6) ─────────────────────────────────────────────
// Levels 1–10: steps 80→68, types 3, specials []
for (let lv = 1; lv <= 10; lv++) {
  LEVELS[`1-${lv}`] = {
    chapter: 1, level: lv,
    gridCols: 6, gridRows: 6,
    steps: lerp(lv, 10, 80, 68),
    types: 3,
    specials: [],
    layoutPool: [LAYOUTS.harbor_boat_v1, LAYOUTS.harbor_boat_v2],
  };
}
// Levels 11–20: steps 65→55, types 4, specials: Wave
for (let lv = 11; lv <= 20; lv++) {
  LEVELS[`1-${lv}`] = {
    chapter: 1, level: lv,
    gridCols: 6, gridRows: 6,
    steps: lerp(lv - 10, 10, 65, 55),
    types: 4,
    specials: [{ type: 9, count: 1 }],
    layoutPool: [LAYOUTS.harbor_boat_v1, LAYOUTS.harbor_boat_v2, LAYOUTS.harbor_boat_v3],
  };
}
// Levels 21–30: steps 55→45, types 4, specials: Wave + Lantern
for (let lv = 21; lv <= 30; lv++) {
  LEVELS[`1-${lv}`] = {
    chapter: 1, level: lv,
    gridCols: 6, gridRows: 6,
    steps: lerp(lv - 20, 10, 55, 45),
    types: 4,
    specials: [{ type: 9, count: 1 }, { type: 8, count: 1 }],
    layoutPool: [LAYOUTS.harbor_boat_v1, LAYOUTS.harbor_boat_v2, LAYOUTS.harbor_boat_v3],
  };
}

// ── Chapter 2: Pottery Vase (7×7) ────────────────────────────────────────────
// Levels 1–15: steps 62→50, types 4, specials: Wave + Lantern
for (let lv = 1; lv <= 15; lv++) {
  LEVELS[`2-${lv}`] = {
    chapter: 2, level: lv,
    gridCols: 7, gridRows: 7,
    steps: lerp(lv, 15, 62, 50),
    types: 4,
    specials: [{ type: 9, count: 1 }, { type: 8, count: 1 }],
    layoutPool: [LAYOUTS.pottery_vase_v1, LAYOUTS.pottery_vase_v2],
  };
}
// Levels 16–30: steps 50→40, types 5, specials: Wave + Lantern + Bomb
for (let lv = 16; lv <= 30; lv++) {
  LEVELS[`2-${lv}`] = {
    chapter: 2, level: lv,
    gridCols: 7, gridRows: 7,
    steps: lerp(lv - 15, 15, 50, 40),
    types: 5,
    specials: [{ type: 9, count: 1 }, { type: 8, count: 1 }, { type: 6, count: 1 }],
    layoutPool: [LAYOUTS.pottery_vase_v1, LAYOUTS.pottery_vase_v2, LAYOUTS.pottery_vase_v3],
  };
}

// ── Chapter 3: Flower (8×8) ───────────────────────────────────────────────────
// Levels 1–10: steps 52→46, types 5, specials: Wave + Lantern + Bomb
for (let lv = 1; lv <= 10; lv++) {
  LEVELS[`3-${lv}`] = {
    chapter: 3, level: lv,
    gridCols: 8, gridRows: 8,
    steps: lerp(lv, 10, 52, 46),
    types: 5,
    specials: [{ type: 9, count: 1 }, { type: 8, count: 1 }, { type: 6, count: 1 }],
    layoutPool: [LAYOUTS.flower_v1, LAYOUTS.flower_v2],
  };
}
// Levels 11–30: steps 46→38, types 5, specials: add Windmill
for (let lv = 11; lv <= 30; lv++) {
  LEVELS[`3-${lv}`] = {
    chapter: 3, level: lv,
    gridCols: 8, gridRows: 8,
    steps: lerp(lv - 10, 20, 46, 38),
    types: 5,
    specials: [
      { type: 9, count: 1 },
      { type: 8, count: 1 },
      { type: 6, count: 1 },
      { type: 7, count: 1 },
    ],
    layoutPool: [LAYOUTS.flower_v1, LAYOUTS.flower_v2, LAYOUTS.flower_v3],
  };
}

// ── Chapter 4: Forest Tree (8×8) ─────────────────────────────────────────────
// Levels 1–15: steps 46→40, types 5, specials: Bomb + Windmill
for (let lv = 1; lv <= 15; lv++) {
  LEVELS[`4-${lv}`] = {
    chapter: 4, level: lv,
    gridCols: 8, gridRows: 8,
    steps: lerp(lv, 15, 46, 40),
    types: 5,
    specials: [{ type: 6, count: 1 }, { type: 7, count: 1 }],
    layoutPool: [LAYOUTS.forest_v1, LAYOUTS.forest_v2],
  };
}
// Levels 16–30: steps 40→34, types 5, specials: Bomb + Windmill + Wave
for (let lv = 16; lv <= 30; lv++) {
  LEVELS[`4-${lv}`] = {
    chapter: 4, level: lv,
    gridCols: 8, gridRows: 8,
    steps: lerp(lv - 15, 15, 40, 34),
    types: 5,
    specials: [{ type: 6, count: 1 }, { type: 7, count: 1 }, { type: 9, count: 1 }],
    layoutPool: [LAYOUTS.forest_v1, LAYOUTS.forest_v2, LAYOUTS.forest_v3],
  };
}

// ── Chapter 5: Hotspring (9×9) ────────────────────────────────────────────────
// Levels 1–10: steps 42→38, types 5, specials: Bomb + Windmill + Wave
for (let lv = 1; lv <= 10; lv++) {
  LEVELS[`5-${lv}`] = {
    chapter: 5, level: lv,
    gridCols: 9, gridRows: 9,
    steps: lerp(lv, 10, 42, 38),
    types: 5,
    specials: [{ type: 6, count: 1 }, { type: 7, count: 1 }, { type: 9, count: 1 }],
    layoutPool: [LAYOUTS.hotspring_v1, LAYOUTS.hotspring_v2],
  };
}
// Levels 11–30: steps 38→30, types 5, specials: add Lantern
for (let lv = 11; lv <= 30; lv++) {
  LEVELS[`5-${lv}`] = {
    chapter: 5, level: lv,
    gridCols: 9, gridRows: 9,
    steps: lerp(lv - 10, 20, 38, 30),
    types: 5,
    specials: [
      { type: 6, count: 1 },
      { type: 7, count: 1 },
      { type: 9, count: 1 },
      { type: 8, count: 1 },
    ],
    layoutPool: [LAYOUTS.hotspring_v1, LAYOUTS.hotspring_v2, LAYOUTS.hotspring_v3],
  };
}

// ── Chapter 6: Lighthouse (10×10) ────────────────────────────────────────────
// Levels 1–15: steps 36→30, types 5, specials: Bomb + Windmill + Wave
for (let lv = 1; lv <= 15; lv++) {
  LEVELS[`6-${lv}`] = {
    chapter: 6, level: lv,
    gridCols: 10, gridRows: 10,
    steps: lerp(lv, 15, 36, 30),
    types: 5,
    specials: [{ type: 6, count: 1 }, { type: 7, count: 1 }, { type: 9, count: 1 }],
    layoutPool: [LAYOUTS.lighthouse_v1, LAYOUTS.lighthouse_v2],
  };
}
// Levels 16–29: steps 30→28, types 5, specials: add Lantern
for (let lv = 16; lv <= 29; lv++) {
  LEVELS[`6-${lv}`] = {
    chapter: 6, level: lv,
    gridCols: 10, gridRows: 10,
    steps: lerp(lv - 15, 14, 30, 28),
    types: 5,
    specials: [
      { type: 6, count: 1 },
      { type: 7, count: 1 },
      { type: 8, count: 1 },
      { type: 9, count: 1 },
    ],
    layoutPool: [LAYOUTS.lighthouse_v1, LAYOUTS.lighthouse_v2, LAYOUTS.lighthouse_v3],
  };
}
// Level 30: boss level
LEVELS['6-30'] = {
  chapter: 6, level: 30,
  gridCols: 10, gridRows: 10,
  steps: 25,
  types: 5,
  specials: [
    { type: 6, count: 2 },
    { type: 7, count: 2 },
    { type: 8, count: 1 },
    { type: 9, count: 1 },
  ],
  layoutPool: [LAYOUTS.lighthouse_v2, LAYOUTS.lighthouse_v3],
};

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Get a level definition with a randomly transformed layout applied.
 * @param {number} chapter
 * @param {number} level
 * @returns {{ chapter, level, gridCols, gridRows, steps, types, specials, layout: string[] } | null}
 */
export function getLevel(chapter, level) {
  const lvl = LEVELS[`${chapter}-${level}`];
  if (!lvl) return null;
  return { ...lvl, layout: pickLayout(lvl.layoutPool) };
}
