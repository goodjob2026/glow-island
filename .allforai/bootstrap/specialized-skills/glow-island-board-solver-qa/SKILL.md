---
name: glow-island-board-solver-qa
specialization_id: glow-island-board-solver-qa
trigger: >
  连线消除 puzzle with steps-based difficulty, 5 special tiles, chapter-progressive
  obstacles, combo system, and 180 levels requiring solver feasibility and
  difficulty-band validation that generic QA cannot cover.
generated_by: bootstrap-update-2026-05-13
---

# Glow Island — Board Solver QA Skill

Project-local specialized skill. Validates puzzle feasibility, difficulty bands,
deadlock conditions, and special tile interactions for Glow Island's 180 levels.

## Specialization Trigger Evidence

- 180 levels across 6 chapters × 30 levels, each with a step budget
- 5 tactical special tiles with chain interactions (光波/光链/穿透/置换/连锁)
- Progressive obstacle introduction (ice 1-3L, chains, portals, gravity, rotation, spread)
- Combo system (consecutive clears maintain timer) — solver must account for combo paths
- Irregular board shapes from Ch3+ (海湾/岛屿轮廓)
- Target: 1-2 min/level session, 3 stars at optimal solve, 1 star at minimum solve

## Input Contract

Required:
- `.allforai/game-design/systems/core-mechanics.json` — steps system, special tiles, combo rules
- `.allforai/game-design/systems/puzzle-design.json` — difficulty bands, obstacle rules
- `.allforai/game-design/systems/level-design.json` — level data (board layout, tiles, steps budget, targets)
- `.allforai/game-design/systems/progression-curve-design.json` — chapter difficulty targets

Optional:
- Runtime matcher code at `src/` (Cocos Creator) — when available, run executable solver
- `.allforai/game-design/systems/retention-hook.json` — session duration targets

Missing required inputs → return `UPSTREAM_DEFECT`.

## Output Contract

Write:
- `.allforai/game-design/systems/board-solver-qa-report.json` — per-level feasibility scores
- `.allforai/game-design/systems/board-solver-qa-report.html` — chapter difficulty curve charts

Report structure:
```json
{
  "schema_version": "1.0",
  "overall_pass_rate": 0.0,
  "pass_threshold": 0.95,
  "chapters": [
    {
      "chapter_id": 1,
      "levels_tested": 30,
      "feasibility_rate": 0.0,
      "avg_steps_to_solve": 0,
      "deadlock_count": 0,
      "difficulty_band_match": 0.0,
      "session_duration_estimate_sec": 0,
      "issues": []
    }
  ],
  "failing_levels": [],
  "deadlock_levels": [],
  "special_tile_interaction_issues": [],
  "repair_targets": []
}
```

## Invocation Contract

```json
{
  "skill": "glow-island-board-solver-qa",
  "mode": "full_180 | chapter_range | single_level | deadlock_only | repair_verify",
  "input_paths": {
    "core_mechanics": ".allforai/game-design/systems/core-mechanics.json",
    "puzzle_design": ".allforai/game-design/systems/puzzle-design.json",
    "level_design": ".allforai/game-design/systems/level-design.json",
    "progression_curve": ".allforai/game-design/systems/progression-curve-design.json"
  },
  "runtime_solver_path": "src/game/puzzle/solver/",
  "output_root": ".allforai/game-design/systems"
}
```

Modes:
- `full_180` — validate all 180 levels
- `chapter_range` — validate specific chapter range
- `single_level` — validate one level by ID
- `deadlock_only` — scan for deadlock conditions only
- `repair_verify` — re-verify specific failing_levels from previous report

## Automatic Validation

**Feasibility checks (per level):**
1. Minimum solve path exists within step budget (solver: greedy path-finding or BFS if runtime available).
2. 3-star solve path exists within ⌊step_budget × 0.75⌋ steps.
3. No deadlock state reachable from initial board position under optimal play.
4. Board is not pre-cleared (min 30% tiles must require active matching).

**Difficulty band checks:**
5. Ch1 (levels 1-30): avg steps to solve 8-15, no obstacles beyond standard tiles.
6. Ch2 (levels 31-60): avg steps 12-20, ice blocks 1-2 layers.
7. Ch3 (levels 61-90): avg steps 15-25, chains + portals.
8. Ch4 (levels 91-120): avg steps 18-30, gravity + single-path constraint.
9. Ch5 (levels 121-150): avg steps 20-35, rotation + multi-obstacle.
10. Ch6 (levels 151-180): avg steps 22-40, spread + combined mechanics.

**Special tile interaction checks:**
11. 光波 (wave clear) — target clear count matches design spec, does not over-clear board.
12. 光链 (chain link) — chain reaction depth ≤ spec maximum, no infinite loop.
13. 穿透 (pierce) — pierce path does not exceed board boundary.
14. 置换 (swap) — post-swap board is not in a worse state than pre-swap for optimal play.
15. 连锁 (cascade) — cascade trigger conditions match puzzle-design.json spec exactly.

**Session duration estimate:**
16. Per level: (steps_to_solve × 4sec) + (special_tile_activations × 2sec) ≤ 120sec target.
17. Avg session (3-5 consecutive levels): 5-10 min.

## Repair Routing

| Failure Type | Repair Target |
|---|---|
| Level infeasible (no solution) | level-design revision: increase step budget or simplify board |
| Deadlock state reachable | puzzle-design revision: add shuffle trigger rule |
| Difficulty band out of range | progression-curve-design revision: rebalance chapter difficulty |
| Special tile interaction bug | core-mechanics revision: fix interaction rule spec |
| Session duration exceeds target | level-design: reduce board complexity or increase step budget |

## Completion Conditions

- `COMPLETED` — ≥ 95% levels feasible, all chapters within difficulty bands, no critical deadlocks
- `FAILED_VALIDATION` — any chapter < 85% feasibility or critical deadlock in Ch1-3
- `BLOCKED_BY_MISSING_SOLVER` — runtime solver not available; LLM heuristic score only (flag as manual validation required)
- `UPSTREAM_DEFECT` — missing required input files
