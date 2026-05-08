# Node Spec: art-spec-design

## Role
Produce the formal art asset specification for Glow Island — a filterable HTML inventory and structured JSON catalogue of every asset needed for implementation. Migrate and formalize the existing `art-asset-spec.md` into the canonical `art-asset-inventory.json` schema for consumption by `ai-art-generation` and `generate-artifacts`.

**discipline_owner:** concept-artist  
**discipline_reviewers:** art-director  
**capability:** game-design  
**human_gate:** true

## Context Pull

Read these files before generating output:
- `.allforai/game-design/art-asset-spec.md` — existing asset specifications (PRIMARY SOURCE)
- `.allforai/game-design/art-direction.md` — art direction, color tokens, style guide
- `.allforai/game-design/art-tokens.json` — color palette and design tokens
- `.allforai/game-design/art-direction-v2.html` (if exists) — updated art direction HTML
- `.allforai/product-concept/concept-baseline.json` — character names, island name, chapter themes
- `.allforai/game-design/approval-records.json` — confirm art-direction is approved

## Content Requirements

### Asset Categories Required

Produce specs for ALL of the following categories:

**Tile Assets (20 types):**
- Base tile set: 20 tile types, one per animal/nature symbol
- Per tile: dimensions (128×128px standard), palette constraints (chapter-gated colors), animation frames (idle + highlight + connect + disappear)
- Special tile variants: bomb tile, line-clear tile, auto-connect tile, reshuffle tile (4 types)
- Design note: Animal Crossing aesthetic — rounded, soft, clearly readable at small size

**Character Assets:**
- 山田律 (Yamada Ritsu): portrait (256×256), full-body idle (512×768), 3 expressions (happy/neutral/contemplative)
- 丸山ひなた (Maruyama Hinata): portrait (256×256), full-body (512×768), 3 expressions (warm/curious/gentle-smile)
- NPCs (4): portrait only (256×256) for 磯部健三, 桐島梅子, 海野夏帆, 丸山冬子
- Style: soft outline, pastel, Animal Crossing proportion (slightly chibi, large eyes)

**Background / Environment Assets:**
- 6 chapter backgrounds (1280×720 or SVG): one per chapter area
- Island map overview (1280×720): full island view with all 6 areas
- 4 restoration states per chapter area (24 environment sprites total)
- Sky variations: daytime, evening, night (for lighthouse finale)

**UI Assets:**
- Main menu background (1280×720)
- HUD elements: step counter panel, combo multiplier badge, material icon set (6 types)
- Button set: primary, secondary, close, back (each in normal/pressed state)
- Dialog box: standard + story variant
- Chapter unlock reveal overlay
- Memory fragment journal page background

**VFX Sprite Sheets:**
- Tile connect path glow (frame sequence)
- Combo burst (frame sequence, 3 intensity levels)
- Area restoration sparkle (frame sequence)
- Lighthouse final beam (full-screen, frame sequence)

**Icon Set:**
- Material icons (6): driftwood, clay, seeds, paving stone, quartz, lamp oil
- Currency icons: 沙滩币 (beach coin), 丹青石 (Danqing stone)
- Chapter unlock icons (6)
- Navigation icons: home, shop, settings, back, close

### Per-Asset Fields Required

For each asset in the JSON output:
- `asset_id`: unique slug (e.g., `tile-koi-base`, `char-hinata-portrait`)
- `name`: human-readable name
- `type`: one of `tile | character | environment | ui | vfx | icon | background | animation-frame`
- `discipline`: which art team produces this
- `dimensions`: pixel size or "vector"
- `description`: what the asset depicts (used as AI generation prompt base)
- `palette_constraints`: which color roles from art-tokens.json apply
- `milestone_gate`: alpha (required for playable demo) or final (ship quality)
- `current_state`: initialize all as "placeholder"
- `ai_generatable`: true for concept-reference images; true for most
- `ai_gen_target`: "concept-reference" for character/environment; "actual-asset" for simple icons

### Asset Count Targets

| Category | Count |
|----------|-------|
| Tile base (20 types × idle frame) | 20 |
| Tile specials (4 types) | 4 |
| Character portraits | 6 |
| Character full-body | 2 (律 + ひなた only) |
| Background environments (6 chapters × 4 states) | 24 |
| Island map overview | 1 |
| UI backgrounds | 3 |
| HUD elements | ~12 |
| Icons (material + currency + nav) | ~20 |
| VFX sprite sheets | 4 |

Total target: ~100-110 assets

## Output Format

**Primary output:** `.allforai/game-design/art-spec.html`
- Above fold: Asset count summary table (rows = asset type, columns = state count); highlight any category with 0 spec cards
- Below: Filterable card grid (filter by discipline / type / state)
  - One card per asset: ID + name + dimensions + description + palette constraint chips + milestone gate + AI-gen target + approval status
- Layout: Dense grid, 4 columns default

**Secondary output:** `.allforai/game-design/systems/art-asset-inventory.json`

Follow the canonical schema from `capabilities/game-design.md`:
```json
{
  "assets": [
    {
      "asset_id": "<slug>",
      "name": "<display name>",
      "type": "<type>",
      "discipline": "<discipline>",
      "dimensions": "<WxH px or vector>",
      "description": "<what this depicts — used as AI prompt base>",
      "palette_constraints": ["<color role>"],
      "milestone_gate": "alpha | final",
      "current_state": "placeholder",
      "ai_generatable": true,
      "ai_gen_target": "concept-reference | actual-asset | mood-reference",
      "ai_generated": {
        "attempted": false,
        "path": null,
        "prompt": null,
        "model": null,
        "generated_at": null
      },
      "substitution": {
        "placeholder": "<path to solid color or geometry>",
        "temp": null,
        "alpha": null,
        "final": null
      }
    }
  ],
  "summary": {
    "total": 0,
    "by_state": { "placeholder": 0, "temp": 0, "alpha": 0, "final": 0 },
    "by_type": {},
    "ai_generatable_count": 0,
    "ai_generated_count": 0
  }
}
```

## Human Gate Instructions

After generating both output files, update `.allforai/game-design/approval-records.json`:
- Set `gate_status` to `"in-review"` for the `art-spec-design` record
- Set `updated_at` to current ISO timestamp

Do NOT proceed to `ai-art-generation` until `gate_status == "approved"`.
