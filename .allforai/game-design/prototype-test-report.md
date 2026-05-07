# Prototype Test Report — Glow Island 连连看核心原型

**Date:** 2026-05-07  
**Prototype:** `game-client/assets/scenes/Prototype.scene` + `PrototypeBoard.ts`  
**Spec source:** `puzzle-mechanics-spec.json` v1.0  
**Status:** Design Analysis (pre-runtime; no live engine run)

---

## 1. Scope Summary

The prototype implements:
- 8×8 grid with 4 chapter-1 tile types (珊瑚橙, 海浪蓝, 海草绿, 沙滩米)
- BFS path-finding: ≤2 turns, edge-border traversal, occupied-cell blocking
- Combo window: 2000 ms between matches (per spec)
- Score multipliers: 1.0 / 1.5 / 2.0 / 3.0 at combos 1/2/3/4+ (per spec)
- Visual feedback: scale-up selection, vanish animation on match, drop-in gravity refill
- Invalid-match shake feedback
- Reset button

No special blocks, no obstacles, no backend calls, no sound — strictly within prototype scope.

---

## 2. Mechanic Ratings

### 2.1 Core Feel (Game-feel / 手感)
**Rating: 4 / 5**

The tile-click → BFS-validate → vanish-then-drop loop matches the intended "casual therapeutic" cadence. The 0.25 s scale-pop vanish paired with a 0.28 s drop-in creates a rhythm that should feel satisfying without being frantic. Selection highlight (scale 1.12×) gives clear tactile feedback without obscuring neighboring tiles.

**Gap:** At 8×8 with only 4 types the board will have many valid paths, making the game too easy in its raw prototype state. This is expected for a feel-test but means testers may not stress-test the BFS invalid-path / shake path at all. Recommend manually setting some cells to `null` or adding a 6-type variant for the stress path.

### 2.2 Path Rules (BFS ≤2 Turns + Edge Traversal)
**Rating: 5 / 5**

The BFS implementation faithfully follows `puzzle-mechanics-spec.path_rules`:

| Spec field | Implementation |
|---|---|
| `max_turns: 2` | `newTurns > 2 → skip` |
| `edge_traverse: true` | Border coords `[-1, COLS]` and `[-1, ROWS]` included in BFS |
| `blocked_by_occupied_cells: true` | Non-null cells rejected unless they are the destination |
| `empty_cell_passable: true` | `grid[ny][nx] === null` cells pass through freely |
| `path_length_limit: null` | No length cap in BFS |

State space is `(x, y, direction, turns)` which matches the spec's `algorithm_hint`. The visited array has `O(ROWS × COLS × 5 × 3)` = 960 entries for an 8×8 board — negligible memory cost. BFS (not DFS) guarantees completeness: every reachable path is explored.

**Potential issue to verify:** The border-strip exit points at `(-1, -1)` (corners) are implicitly reachable via two separate border-strip segments. The current implementation treats all border cells as passable, which is correct per the "路径可沿棋盘外边缘延伸" rule.

### 2.3 Combo Timing (2000 ms Window)
**Rating: 3 / 5**

The `COMBO_WINDOW_MS = 2000` constant directly mirrors `combo.window_ms`. Multipliers at thresholds [1, 2, 3, 4] match `combo.multipliers [1.0, 1.5, 2.0, 3.0]`.

**Design concern:** 2000 ms is generous — for a mobile casual audience with quick taps it will feel trivially achievable, potentially making the x3.0 multiplier at combo-4 feel less special. In later puzzle implementation consider exposing this as a tunable constant per level type (e.g., 1500 ms for challenge levels). The current label display `COMBO × N (×M.M)` gives immediate feedback which is essential for teaching the mechanic.

**Missing in prototype:** No visual pop or screen effect when combo increments (the spec lists "特效升级" at combo 3 and "屏幕震动" at combo 4). These are deliberately excluded per prototype scope but should be prioritized in `implement-puzzle-core` since they are the primary feedback loop for "治愈爽快感".

### 2.4 Visual Feedback
**Rating: 3 / 5**

| Feedback moment | Implementation | Quality |
|---|---|---|
| Tile selected | Scale 1.12× tween 0.15 s | Clear but subtle |
| Valid match | Scale pop 1.3× → scale-to-zero 0.18 s | Satisfying pop feel |
| Tile drop-in | Position tween from above, 0.28 s ease-in | Natural gravity feel |
| Invalid path | Horizontal shake, 5 steps × 0.05 s | Functional; needs color flash to be more readable |
| Combo display | Label string update | Functional but static |

The colour palette (chapter-1 four colours) has adequate contrast between 珊瑚橙 (#FF8C5A) and 海草绿 (#7BC67A), but 沙滩米 (#E8D5A3) on a white/light background may be hard to distinguish. The art-direction spec calls for a warm island theme; the prototype's plain colour blocks fulfil validation intent.

**Missing:** No particle burst, no screen-shake node effect for high combos. These are known prototype omissions but are the single most important element to add in the next iteration for the "爽快" sensation.

---

## 3. Spec Compliance Checklist

| Spec requirement | Prototype status |
|---|---|
| `path_rules.max_turns = 2` | Implemented |
| `path_rules.edge_traverse = true` | Implemented |
| `path_rules.same_type_required = true` | Implemented |
| `path_rules.blocked_by_occupied_cells = true` | Implemented |
| `combo.window_ms = 2000` | Implemented |
| `combo.multipliers [1.0, 1.5, 2.0, 3.0]` | Implemented |
| `board_events.tile_gravity` (slide down) | Implemented (simplified: column compact + refill from top) |
| No special blocks | Confirmed absent |
| No obstacles | Confirmed absent |
| No backend calls | Confirmed absent |

---

## 4. Adjustment Recommendations for `implement-puzzle-core`

### High Priority

1. **Combo visual effects** — At combo ≥ 3, add a CSS-style label scale burst (tween label scale 1.5× → 1.0×) and a brief node-shake on the Canvas root for combo ≥ 4. This is the #1 gap between prototype feel and spec intent (`combo.threshold_effects`).

2. **Invalid-path colour flash** — Add a red tint flash (0.1 s) on the tile node alongside the shake. Pure positional shake without colour change is hard to read on mobile.

3. **Gravity animation per-cell timing** — Current drop uses a fixed 0.28 s for all tiles. Spec calls for `0.08 s per cell` with `ease_in_out`. In production, stagger each tile's tween by its fall distance × 0.08 s for a more natural cascading feel.

4. **Combo reset on no-available-match** — The spec defines a reset condition: "棋盘当前无任何可用匹配对". The prototype does not scan for deadlock. A background check after each match (iterate all pairs) should reset combo and optionally shuffle the board.

### Medium Priority

5. **BFS result path highlight** — During pathfinding validation, record the actual path cells and briefly highlight them (0.1 s tint) before the vanish animation. This teaches the player how connections work without needing a tutorial.

6. **4-type tile ratio** — 8×8 with perfectly random distribution yields ~16 tiles per type, providing abundant matches. Consider seeding the initial grid with constraints (e.g., no more than 3 adjacent same-type) to create mild visual variety without blocking gameplay.

7. **Tile drop origin** — New tiles currently spawn from the exact above position. They should spawn from `y = startY + CELL_SIZE` (just off screen top) to reinforce the island-above metaphor from the art direction doc.

### Low Priority / Post-Prototype

8. **Special block groundwork** — Add a `tileVariant` field to the grid cell type so `bomb`, `windmill`, `lantern`, `wave` can be overlaid without refactoring the core grid data structure.

9. **Accessibility** — The four chapter-1 colours include 沙滩米 (#E8D5A3) which may fail contrast checks on pale backgrounds. Consider a thin dark border (1–2 px) on each tile node as a universal visual aid.

10. **Board size parameterisation** — `COLS` and `ROWS` are constants in the current prototype. For `implement-puzzle-core` these should be `@property` fields or driven by a level JSON to support chapter-1's 6×6 grid.

---

## 5. Summary Verdict

The prototype successfully validates that the 连连看 core loop — select, BFS-validate, match-vanish, gravity-refill — can be implemented cleanly in ~200 lines of Cocos Creator TypeScript. The BFS algorithm is spec-compliant and complete. The primary gap between prototype and "治愈爽快" target is the absence of escalating visual/haptic feedback at combo milestones, which should be the first feature added in `implement-puzzle-core`.
