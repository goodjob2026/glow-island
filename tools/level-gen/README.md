# Glow Island — Level Generation Pipeline

Match-3 level generation + BFS solver validation for Glow Island.
Generates 180 levels (6 chapters × 30 levels) aligned with `puzzle-design.json` v4.0 and `progression-curve.json` v3.0.

## Quick Start

```bash
cd tools/level-gen
npm install

# Generate 3 levels for chapter 1
npm run gen -- --chapter 1 --count 3

# Generate all 180 levels
npm run gen -- --all

# Validate a single level file
npm run validate -- --file ../../game-client/assets/resources/levels/ch1/level_1_1.json
```

## CLI Reference

### `npm run gen`

| Flag | Default | Description |
|------|---------|-------------|
| `--chapter N` | `1` | Chapter to generate (1–6) |
| `--count N` | `30` | Number of levels (1–30) |
| `--all` | — | Generate all 180 levels |
| `--verbose` | — | Show per-attempt rejection reasons |

**Output columns:**

```
✓ OK       ch1-06 [easy     ] min_moves=5          attempts=1 → level_1_6.json
~ LIKELY   ch1-04 [easy     ] min_moves=7          attempts=1 → level_1_4.json
⚠ WARN     ch2-15 [standard ] ...                  attempts=10 → level_2_15.json
```

- `✓ OK` — solvable, min_moves within floor and max_moves
- `~ LIKELY` — BFS hit 50k-state cap; level is large but has many moves available
- `⚠ WARN` — all 10 retries exhausted; file written with warning

### `npm run validate`

| Flag | Required | Description |
|------|----------|-------------|
| `--file <path>` | Yes | Path to level JSON file |

Runs the BFS solver on the given file and prints solvability, min_moves, and the first 5 moves of the solution path.

## Output Location

Levels are written to:

```
game-client/assets/resources/levels/
  ch1/
    level_1_1.json
    level_1_2.json
    ...
    level_1_30.json
  ch2/
    ...
  ch6/
    level_6_30.json
```

## Architecture

```
src/
  types.ts       — Level JSON types (schema v3.0), tile/obstacle/objective types
  generator.ts   — Algorithmic level generator (seeded PRNG, chapter config tables)
  solver.ts      — BFS Match-3 solver with ≤2-turn path finding
  pipeline.ts    — Orchestrates generate → solve → accept/retry → write
  cli.ts         — CLI entry point
```

### generator.ts

- Input: `GeneratorParams { chapter, level_index, difficulty, seed }`
- Uses a seeded Mulberry32 PRNG for deterministic, reproducible output
- Chapter configs drive: grid size, tile variety count, void fraction, obstacle pool, step range, coin rewards
- Enforces the parity rule: every tile type appears an **even** number of times
- Assigns `level_role` (tutorial / zen / breather / standard / challenge / boss) per design spec
- Boss levels (level 30) always include a pair of `cascade` special tiles

### solver.ts

- BFS over `(grid_state, moves_used)` with state deduplication via string keys
- Path finding: BFS within a grid snapshot, allows ≤2 turns through empty/void cells
- State cap: 50,000 states — if exceeded, returns `bfs_exhausted: true` (level treated as likely solvable)
- Each "move" removes a pair of matching tiles; goal is to clear ≥ `clear_tiles.count` tiles
- Returns `{ solvable, min_moves, bfs_exhausted, solution_path }`

### pipeline.ts

Acceptance criteria per attempt:
1. `solvable === true` OR `bfs_exhausted === true`
2. `min_moves >= difficulty_floor` (not trivial)
3. `min_moves <= max_moves - 2` (not too tight)

Difficulty floors: easy=3, standard=5, challenge=8, boss=10, zen=1

Up to 10 retries with different seeds. If all fail, writes the last candidate with a warning.

## Design Alignment

| Source | Used for |
|--------|----------|
| `puzzle-design.json` v4.0 | Tile codes (T01–T20), obstacle types, chapter unlock schedule |
| `progression-curve.json` v3.0 | Step counts per chapter/difficulty, first-pass targets |
| `level-design.json` v3.0 | Level JSON schema (id, objectives, grid_size, shape, etc.), sample levels |

### Chapter parameters

| Ch | Grid | Shape | Tile pool | Obstacles |
|----|------|-------|-----------|-----------|
| 1 | 8×8 | rectangle | T01–T04 | none |
| 2 | 8×8 | rectangle | T01–T08 | ice_block, weed |
| 3 | 8×8 | bay_contour | T01–T12 | ice_block, weed, chain_lock |
| 4 | 8×8 | island_contour | T01–T16 | ice_block, chain_lock, wooden_crate |
| 5 | 9×9 | island_contour | T01–T18 | ice_block, chain_lock, water_current |
| 6 | 9×9 | lighthouse_contour | T01–T20 | ice_block, chain_lock, wooden_crate, spreading_obstacle |

## Extending

- **Add new obstacle logic**: extend `placeObstacles()` in `generator.ts` and update `canConnect()` in `solver.ts` to block/allow paths.
- **Add gravity (tile_fall)**: extend the BFS `applyMove()` to drop tiles after a match.
- **Tune difficulty**: adjust `STEP_RANGE`, `GOAL_RANGE`, `obstacleCount` tables in `generator.ts`.
- **Higher BFS cap**: change `MAX_BFS_STATES` in `solver.ts` (trades speed for accuracy).
