---
name: glow-island-tile-readability-qa
specialization_id: glow-island-tile-readability-qa
trigger: >
  连线消除 puzzle board where 25 base tile types + seasonal variants must remain
  visually distinct at 64-128px on mobile, across active/selected/matched/combo/
  obstacle states and all 4 seasonal color palettes.
generated_by: bootstrap-update-2026-05-13
---

# Glow Island — Tile Readability QA Skill

Project-local specialized skill. Validates tile family distinctiveness on the
actual Kagayaki-jima game board, not one asset in isolation.

## Specialization Trigger Evidence

- 25 base tile types in `canonical_registry.tiles[]` (concept-contract.json)
- 4 seasonal palettes (spring/summer/autumn/winter) × 25 base tiles = up to 100 variants
- 5 special tactical tiles (光波/光链/穿透/置换/连锁) with distinct activated states
- 3 obstacle types per chapter (ice blocks 1-3 layers, chains, portals, gravity, rotation)
- 60-100 tiles visible simultaneously on 8×8–9×9 board plus irregular island shapes (Ch3+)
- Combo state overlay (combo-2 → combo-5+) must not obscure tile identity
- Day/night lighting shifts color temperature — tile contrast must hold in both modes

## Input Contract

Required:
- `.allforai/concept-contract.json` — `canonical_registry.tiles[]` (all 25 base tile IDs)
- `.allforai/game-design/systems/tile-art-spec.json` — tile spec with palette assignments
- `.allforai/game-design/art-style-guide.json` — color palette, line rules
- `.allforai/game-design/systems/worldbuilding.json` — `season_chapter_mapping` (season palettes)
- `.allforai/game-design/art/qa/2d-style-consistency-qa-report.json` — baseline consistency score

Optional:
- `.allforai/game-design/art/tilesets/` — actual generated tile assets (if available)
- Runtime board layout screenshots (manual test scenarios if assets not yet generated)

Missing required inputs → return `UPSTREAM_DEFECT` with missing path.

## Output Contract

Write:
- `.allforai/game-design/art/qa/tile-readability-report.json` — per-tile readability scores, family matrix, seasonal coverage
- `.allforai/game-design/art/qa/tile-readability-report.html` — visual board simulation with tile family matrix

Report structure:
```json
{
  "schema_version": "1.0",
  "overall_score": 0.0,
  "pass_threshold": 3.5,
  "family_distinctiveness": {
    "base_tiles": { "score": 0.0, "failing_pairs": [] },
    "seasonal_variants": { "spring": 0.0, "summer": 0.0, "autumn": 0.0, "winter": 0.0 },
    "special_tiles": { "score": 0.0, "issues": [] }
  },
  "state_readability": {
    "normal": 0.0, "selected": 0.0, "matched_flash": 0.0,
    "combo_2": 0.0, "combo_3": 0.0, "combo_5plus": 0.0,
    "obstacle_ice_1": 0.0, "obstacle_ice_2": 0.0, "obstacle_ice_3": 0.0,
    "obstacle_chain": 0.0, "obstacle_portal": 0.0
  },
  "day_night_contrast": { "day": 0.0, "night": 0.0 },
  "failing_tiles": [],
  "repair_targets": []
}
```

## Invocation Contract

```json
{
  "skill": "glow-island-tile-readability-qa",
  "mode": "full_family_qa | seasonal_only | state_only | repair_verify",
  "input_paths": {
    "concept_contract": ".allforai/concept-contract.json",
    "tile_art_spec": ".allforai/game-design/systems/tile-art-spec.json",
    "art_style_guide": ".allforai/game-design/art-style-guide.json",
    "worldbuilding": ".allforai/game-design/systems/worldbuilding.json"
  },
  "board_size": "8x8",
  "output_root": ".allforai/game-design/art/qa"
}
```

Modes:
- `full_family_qa` — all 25 base tiles × 4 seasons × all states
- `seasonal_only` — validate only seasonal variants against base tiles
- `state_only` — validate combo/obstacle/special state overlays
- `repair_verify` — re-check specific failing_tiles from previous report

## Automatic Validation

**Deterministic checks (always run):**
1. All 25 base tile IDs in `canonical_registry.tiles[]` have entries in `tile-art-spec.json`.
2. Each tile has a unique primary color group (no two tiles share the same dominant hue ±15°).
3. Each seasonal variant maintains the tile's primary color group identity (hue shift ≤ 30°).
4. Special tiles (光波/光链/穿透/置换/连锁) have visual markers distinct from all base tiles.
5. Combo overlay (glow ring) does not cover >30% of tile icon area at any combo level.
6. Obstacle overlays (ice/chain) do not reduce tile identity below 40% visible area.

**LLM visual review (when tile assets exist):**
7. Board simulation: place all 25 tile types on a simulated 9×9 grid; assess whether any two adjacent tiles are confusable at 80px display size.
8. Seasonal board: replace base palette with each seasonal palette; confirm tile distinctiveness is maintained.
9. Night mode: apply -20% brightness, +5% blue shift; confirm contrast holds (no tile falls below WCAG 3:1 contrast ratio against board background).
10. Combo state: overlay combo-3 and combo-5+ glow effects; confirm tile type remains identifiable.

**Failing score thresholds:**
- Overall score < 3.5 → `FAILED_VALIDATION`, populate `repair_targets[]`
- Any individual tile score < 2.5 → flag as `critical_failure`
- Seasonal coverage < 3 of 4 seasons validated → `INCOMPLETE`

## Repair Routing

| Failure Type | Repair Target |
|---|---|
| Two base tiles confusable | tile-art-gen revision: differentiate primary shape or hue |
| Seasonal variant loses tile identity | seasonal art spec: tighten hue shift rules |
| Combo overlay obscures tile | vfx-art-gen revision: reduce combo glow coverage % |
| Special tile not distinct from base | tile-art-gen + art-direction: reserve distinct visual zone |
| Night mode contrast failure | art-direction revision: adjust night palette brightness floor |
| Missing seasonal variant | environment/tile art gen: add missing season spec |

## Completion Conditions

- `COMPLETED` — all 25 base tiles scored ≥ 3.5, all 4 seasonal palettes validated, all state overlays pass
- `FAILED_VALIDATION` — any critical_failure tile or overall score < 3.5; repair targets populated
- `INCOMPLETE` — not all seasonal variants available yet; partial report with coverage status
- `UPSTREAM_DEFECT` — missing required input files; cannot validate
