# Glow Island Tile Visual Upgrade Report

**File:** `game-client/assets/scripts/prototype/PrototypeBoard.ts`
**Date:** 2026-05-15
**Scope:** Visual-only changes — no game logic (BFS, combo, grid) was modified.

---

## 1. TILE_COLORS Palette Update

**Before (lines 17–22):** Slightly muted original palette
```
0: Color(255, 140,  90, 255)  // coral orange #FF8C5A
1: Color( 77, 166, 212, 255)  // sea blue     #4DA6D4
2: Color(123, 198, 122, 255)  // leaf green   #7BC67A
3: Color(232, 213, 163, 255)  // sand beige   #E8D5A3
```

**After:** Warmer, softer Animal Crossing healing palette
```
0: Color(255, 182, 108, 255)  // coral orange  — lighter, warmer apricot
1: Color( 94, 188, 221, 255)  // sea blue      — brighter sky-water tone
2: Color(140, 210, 124, 255)  // leaf green    — fresh leaf, more saturated
3: Color(243, 227, 179, 255)  // sand beige    — lighter warm sand
```

---

## 2. roundRect Helper (new, lines 53–65)

Added a standalone `roundRect(g, x, y, w, h, r)` function before the class, using CC3 path-based Graphics API (`moveTo`, `lineTo`, `arc`, `close`). The radius used at call site is `CELL_SIZE * 0.2` = 12 px for a 60 px tile — producing visibly rounded corners consistent with Animal Crossing UI style.

---

## 3. Tile Drawing Upgrade in createTileNode

**Before:**
- `g.lineWidth = 2; g.strokeColor = new Color(0, 0, 0, 40);`
- `g.rect(-CELL_SIZE/2, -CELL_SIZE/2, CELL_SIZE, CELL_SIZE);`
- `g.fill(); g.stroke();`

**After (3 changes applied):**

### 3a. Rounded base shape
`roundRect(g, -CELL_SIZE/2, -CELL_SIZE/2, CELL_SIZE, CELL_SIZE, CELL_SIZE * 0.2)` replaces the plain `rect()` call.

### 3b. Soft same-hue stroke
The black semi-transparent stroke is replaced with a color derived from the tile's own fill color at 75% brightness, alpha 180:
```typescript
g.strokeColor = new Color(
    Math.floor(fillColor.r * 0.75),
    Math.floor(fillColor.g * 0.75),
    Math.floor(fillColor.b * 0.75),
    180
);
g.lineWidth = 1.5;
```
Per-type stroke colors: coral→(191,136,81), sea→(70,141,165), leaf→(105,157,93), sand→(182,170,134)

### 3c. Inner glow highlight
After the tile fill+stroke, a small white translucent circle is drawn at top-left:
```typescript
g.fillColor = new Color(255, 255, 255, 80);
g.circle(-CELL_SIZE * 0.18, -CELL_SIZE * 0.18, CELL_SIZE * 0.15);
g.fill();
```
Position: (-10.8, -10.8) px from center. Radius: 9 px. Alpha: 80/255 ≈ 31%.

---

## 4. Select Animation (setSelected)

**Before:** `tween.to(0.15, { scale: Vec3(1.12, 1.12, 1) }, { easing: quadOut })`

**After:** `tween.to(0.12, { scale: Vec3(1.15, 1.15, 1) }, { easing: easing.backOut })`

Changes: duration 0.15→0.12 s, scale peak 1.12→1.15, easing `quadOut`→`backOut` (elastic overshoot bounce).

---

## 5. Deselect Animation (clearSelected)

**Before:** `tween.to(0.1, { scale: Vec3(1, 1, 1) })`

**After:** Two-step squish:
```
.to(0.10, { scale: Vec3(0.95, 0.95, 1) }, { easing: quadOut })
.to(0.08, { scale: Vec3(1,    1,    1) }, { easing: quadIn  })
```
Total deselect duration: 0.18 s. Tile briefly dips to 95% scale before snapping back — gives a "pressed release" feel.

---

## 6. Vanish Animation (vanishTile)

**Before:** Sequential scale-up then scale-down, no opacity fade:
```
.to(0.25, { scale: (1.3, 1.3) }, quadOut)
.to(0.18, { scale: (0,   0  ) }, quadIn)
```
Total duration: 0.43 s.

**After:** Brief pop then parallel scale+opacity fade:
```
.to(0.12, { scale: (1.2, 1.2) }, quadOut)
.parallel(
    tween(node).to(0.2, { scale: (0, 0) }, quadIn),
    tween(op).to(0.2, { opacity: 0 })
)
```
Total duration: 0.32 s. The tile pops to 120% then simultaneously shrinks and fades out — the concurrent opacity fade softens the disappearance vs. the previous hard-scale-to-zero.

---

## Imports

No import changes required. `UIOpacity`, `easing`, `tween`, `Vec3`, `Color`, and `Graphics` were all already imported from `'cc'`.

---

## Summary

All 6 change groups applied cleanly. No game logic (BFS, combo counter, grid data, gravity/dropColumns, shakeNode, label updates) was touched.
