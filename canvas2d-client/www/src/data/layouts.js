// Board shape layouts for each chapter
// Each layout is an array of strings; 'X' = active cell, '_' = empty
// Row width must exactly match chapter column count

export const LAYOUTS = {
  // ── Chapter 1: Harbor Boat  (6 cols × 6 rows) ──────────────────────────
  harbor_boat_v1: [
    "_XXXX_",
    "XXXXXX",
    "XXXXXX",
    "_XXXX_",
    "__XX__",
    "__XX__",
  ], // 24 active

  harbor_boat_v2: [
    "__XX__",
    "__XXX_",
    "_XXXXX",
    "XXXXXX",
    "_XXXX_",
    "__XX__",
  ], // 22 active

  harbor_boat_v3: [
    "XX__XX",
    "XXXXXX",
    "XXXXXX",
    "XX__XX",
    "XX__XX",
    "_XXXX_",
  ], // 28 active

  // ── Chapter 2: Pottery Vase  (7 cols × 7 rows) ─────────────────────────
  pottery_vase_v1: [
    "__XXX__",
    "_XXXXX_",
    "_X___X_",
    "_XXXXX_",
    "_XXXXX_",
    "XXXXXXX",
    "XXXXXXX",
  ], // 34 active

  pottery_vase_v2: [
    "__XXX__",
    "_X___X_",
    "_XXXXX_",
    "XXXXXXX",
    "XXXXXXX",
    "_XXXXX_",
    "__XXX__",
  ], // 32 active (hollow)

  pottery_vase_v3: [
    "XX___XX",
    "XXXXXXX",
    "XXXXXXX",
    "_XXXXX_",
    "__XXX__",
    "__XXX__",
    "___X___",
  ], // 30 active

  // ── Chapter 3: Flower  (8 cols × 8 rows) ───────────────────────────────
  flower_v1: [
    "___XX___",
    "_XXXXXX_",
    "_XXXXXX_",
    "XXXXXXXX",
    "XXXXXXXX",
    "_XXXXXX_",
    "_XXXXXX_",
    "___XX___",
  ], // 44 active

  flower_v2: [
    "__XXXX__",
    "_XX__XX_",
    "XX_XX_XX",
    "XXXXXXXX",
    "XXXXXXXX",
    "XX_XX_XX",
    "_XX__XX_",
    "__XXXX__",
  ], // 44 active

  flower_v3: [
    "___XX___",
    "__XXXX__",
    "_XX__XX_",
    "_XXXXXX_",
    "_XXXXXX_",
    "_XX__XX_",
    "__XXXX__",
    "___XX___",
  ], // 32 active

  // ── Chapter 4: Forest Tree  (8 cols × 8 rows) ──────────────────────────
  forest_v1: [
    "___XX___",
    "__XXXX__",
    "_XXXXXX_",
    "XXXXXXXX",
    "XXXXXXXX",
    "_XXXXXX_",
    "___XX___",
    "___XX___",
  ], // 38 active

  forest_v2: [
    "_XXX_XXX",
    "XXXXXXXX",
    "XXXXXXXX",
    "XXXXXXXX",
    "__XXXX__",
    "___XX___",
    "___XX___",
    "___XX___",
  ], // 40 active

  forest_v3: [
    "___XX___",
    "__XXXX__",
    "_XXXXXX_",
    "XXXXXXXX",
    "XXXXXXXX",
    "_XXXXXX_",
    "_XX__XX_",
    "_XX__XX_",
  ], // 42 active

  // ── Chapter 5: Hotspring Water Drop  (9 cols × 9 rows) ─────────────────
  hotspring_v1: [
    "____X____",
    "___XXX___",
    "__XXXXX__",
    "_XXXXXXX_",
    "_XXX_XXX_",
    "_XXXXXXX_",
    "__XXXXX__",
    "___XXX___",
    "____X____",
  ], // 38 active

  hotspring_v2: [
    "_XXXXX___",
    "XXXXXXX__",
    "XXXXXXX__",
    "_XXXXXX__",
    "__XXXXXXX",
    "__XXXXXXX",
    "__XXXXXXX",
    "___XXXXX_",
    "____XXX__",
  ], // 54 active

  hotspring_v3: [
    "___XXX___",
    "__XXXXX__",
    "_XX___XX_",
    "_XX___XX_",
    "_XX___XX_",
    "__XXXXX__",
    "__XXXXX__",
    "_XXXXXXX_",
    "__XXXXX__",
  ], // 42 active

  // ── Chapter 6: Lighthouse  (10 cols × 10 rows) ─────────────────────────
  lighthouse_v1: [
    "____XX____",
    "____XX____",
    "___XXXX___",
    "__XXXXXX__",
    "_XXXXXXXX_",
    "_XXXXXXXX_",
    "XXXXXXXXXX",
    "XXXXXXXXXX",
    "XXXXXXXXXX",
    "XXXXXXXXXX",
  ], // 70 active

  lighthouse_v2: [
    "____XX____",
    "____XX____",
    "___XXXX___",
    "__XXXXXX__",
    "_XXXXXXXX_",
    "XX_XXXX_XX",
    "XXXXXXXXXX",
    "XXXXXXXXXX",
    "XXXXXXXXXX",
    "XXXXXXXXXX",
  ], // 70 active

  lighthouse_v3: [
    "_____XX___",
    "____XXXX__",
    "___XXXXXX_",
    "__XXXXXXXX",
    "_XXXXXXXXX",
    "XXXXXXXXX_",
    "XXXXXXXX__",
    "XXXXXX____",
    "XXXXXXXXXX",
    "XXXXXXXXXX",
  ], // 72 active
};

/**
 * Pick a random layout from the pool and apply a random transform.
 * @param {string[][]} pool - Array of layout arrays
 * @returns {string[]} Transformed layout rows
 */
export function pickLayout(pool) {
  const base = pool[Math.floor(Math.random() * pool.length)];
  return randomTransform(base);
}

/**
 * Randomly flip the layout horizontally and/or vertically.
 * @param {string[]} layout
 * @returns {string[]}
 */
function randomTransform(layout) {
  const flipH = Math.random() < 0.5;
  const flipV = Math.random() < 0.5;
  let rows = [...layout];
  if (flipV) rows = rows.reverse();
  if (flipH) rows = rows.map(r => r.split('').reverse().join(''));
  return rows;
}
