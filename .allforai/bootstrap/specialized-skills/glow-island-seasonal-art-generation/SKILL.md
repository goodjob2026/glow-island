---
name: glow-island-seasonal-art-generation
specialization_id: glow-island-seasonal-art-generation
trigger: >
  Four-season + day/night system requires seasonal variants for tiles,
  backgrounds, and UI assets. Generic art generation cannot validate
  seasonal distinctiveness or winter hot-spring visual coherence.
generated_by: bootstrap-update-2026-05-13
---

# Glow Island — Seasonal Art Generation Skill

Project-local specialized skill. Generates and validates seasonal variant art
for tile families, environment backgrounds, and island map UI across 4 seasons
and 3 time-of-day states.

## Specialization Trigger Evidence

- 4 seasons mapped to chapters: Ch1春→Ch2夏→Ch3秋→Ch4冬→Ch5春②→Ch6夏②
- 3 time-of-day states: 白天(06-18) / 黄昏(18-21) / 夜晚(21-06)
- Winter hot-spring (Ch4) is user's core visual desire: snow particles, enhanced steam, rooftop snow
- 25 base tiles need seasonal color-shift variants (not full redraws)
- 18+ background scenes need seasonal atmosphere layers
- Island map UI needs live seasonal indicator

## Input Contract

Required:
- `.allforai/concept-contract.json` — canonical_registry (tiles, environments, ui, vfx)
- `.allforai/game-design/systems/worldbuilding.json` — `season_chapter_mapping`, `time_system`
- `.allforai/game-design/art-style-guide.json` — base color palette, line rules
- `.allforai/game-design/systems/tile-art-spec.json` — base tile specs
- `.allforai/game-design/systems/environment-art-spec.json` — base background specs
- `.allforai/game-design/systems/ui-art-spec.json` — island map UI spec
- `.allforai/game-design/systems/vfx-asset-spec.json` — seasonal VFX specs (already generated)

Optional:
- `.allforai/game-design/art/image-generation/image-model-capability-registry.json`
- `.allforai/game-design/art/image-generation/image-model-routing-report.json`

## Output Contract

Write:
- `.allforai/game-design/art/seasonal/seasonal-tile-variants-spec.json` — per-tile per-season color delta specs
- `.allforai/game-design/art/seasonal/seasonal-background-variants-spec.json` — per-background per-season/time-of-day specs
- `.allforai/game-design/art/seasonal/seasonal-ui-variants-spec.json` — seasonal island map UI states
- `.allforai/game-design/art/seasonal/winter-hotspring-spec.json` — detailed winter hot-spring composition spec
- `.allforai/game-design/art/seasonal/seasonal-art-review.html` — visual spec review with season cards

## Seasonal Palette Specs

### Spring (Ch1, Ch5)
- Hue shift: +5° warm (toward 30°)
- Saturation: +8%
- Brightness: +5%
- Overlay: sakura petal particle (fx_season_spring_sakura)
- Key elements: cherry blossom pink (#FFB7C5), fresh green (#A8D5A2), soft blue sky

### Summer (Ch2, Ch6)
- Hue shift: 0° (baseline)
- Saturation: +12%
- Brightness: +8%
- Overlay: firefly glow at night (fx_season_summer_firefly), seafoam at edges
- Key elements: vivid teal sea (#00B4D8), warm sand (#F4E1C1), bright sun highlight

### Autumn (Ch3)
- Hue shift: -10° warm (toward 20°, orange range)
- Saturation: +5%
- Brightness: -5%
- Overlay: autumn leaves particle (fx_season_autumn_leaves)
- Key elements: warm amber (#D48B3A), russet red (#B03A2E), golden yellow (#F0C14B)

### Winter (Ch4) — PRIORITY
- Hue shift: +15° cool (toward 200°, blue range)
- Saturation: -10%
- Brightness: -8%
- Overlay: snow particles (fx_season_winter_snow), enhanced steam (fx_season_winter_steam_enhanced)
- Key elements: cold blue-white (#D0E8F8), snow white (#F5F5F5), warm steam contrast (#F5D4A0)
- **Hot spring special treatment** — see winter-hotspring-spec.json:
  - Rooftop snow texture layer (snow accumulation visual)
  - Enhanced steam volume ×2, spread +50%
  - Snow particles drift and deflect over hot spring heat zone
  - Lighthouse beam creates volume light halo through snow fog
  - Color temperature contrast: cold blue sky vs warm amber steam

## Day/Night Lighting Variants

All seasonal backgrounds must have 3 time-of-day variants:

| Time | Color Temperature | Brightness | Special |
|---|---|---|---|
| 白天 (06-18) | 6500K (neutral) | baseline | Clear, sharp |
| 黄昏 (18-21) | 3200K (warm orange) | -5% | Golden rim light on lighthouse |
| 夜晚 (21-06) | 7500K (cool blue) | -20% | Lighthouse ON, fireflies (summer), stars |

Night variant critical rule: lighthouse beam must be visible in all night scenes, increasing in prominence from Ch1 to Ch6.

## Tile Seasonal Variant Rules

Tiles use palette shift, not full redraw. Apply palette shift uniformly across all 25 base tiles:
- Preserve tile shape and icon identity
- Only shift dominant background/frame color using season palette
- Special tiles (光波/光链/穿透/置换/连锁) keep their signature color markers; only background area shifts
- Minimum contrast ratio between tile icon and shifted background: 3:1

## Invocation Contract

```json
{
  "skill": "glow-island-seasonal-art-generation",
  "mode": "full_seasonal | tiles_only | backgrounds_only | ui_only | winter_hotspring | validate_only",
  "seasons": ["spring", "summer", "autumn", "winter"],
  "time_variants": ["day", "dusk", "night"],
  "output_root": ".allforai/game-design/art/seasonal",
  "model_routing": ".allforai/game-design/art/image-generation/image-model-routing-report.json"
}
```

## Automatic Validation

1. All 25 base tiles have seasonal palette spec entries for all 4 seasons.
2. Winter tile variants maintain ≥ 3:1 contrast ratio (icon vs shifted background).
3. All 18+ background scenes have seasonal + time-of-day variant specs.
4. Winter hot-spring spec includes all 4 required elements: rooftop snow, snow particles, enhanced steam, lighthouse halo.
5. Seasonal VFX from `vfx-asset-spec.json` are referenced in corresponding seasonal variant specs.
6. Night variants: lighthouse visible in all scenes, brightness delta ≥ 15% from day.
7. No seasonal variant uses the exact same dominant color as an adjacent tile in the tile family.

## Repair Routing

| Failure | Repair Target |
|---|---|
| Tile loses identity in seasonal palette | tile-readability-qa: adjust palette shift bounds |
| Winter hot-spring missing element | winter-hotspring-spec: add missing composition layer |
| Background night too dark (unreadable) | art-direction: set night brightness floor |
| Season VFX not linked to spec | vfx-art-gen revision: add reference link |

## Completion Conditions

- `COMPLETED` — all specs written, all 4 seasons × 3 time-of-day validated, winter hot-spring spec complete
- `FAILED_VALIDATION` — any tile loses identity or contrast fails
- `INCOMPLETE` — partial seasons covered; mark which remain
- `UPSTREAM_DEFECT` — missing tile-art-spec or environment-art-spec
