# BATCH-06 — Cross-Family Style Coherence Visual Acceptance

**Batch ID**: BATCH-06-cross-family-style
**Task ID**: TASK-06
**Asset Family**: cross_family / style_coherence
**Asset Count**: 6 representative assets (2 tiles + 2 expressions + 1 portrait + 1 animation frame)
**Task Risk**: HIGH
**Visual Model**: codex-default (multimodal, satisfies cross-family style consistency check)
**Review Goal**: Verify that assets from different families (tiles, character expressions, portraits, animation frames) feel like they belong to the same game world and share a coherent visual style, palette, and aesthetic.

---

## CRITICAL REVIEWER INSTRUCTION

You MUST visually inspect all 6 representative images simultaneously or in close succession. The key question is: do these images feel like they come from the same game? Report any family that feels visually isolated from the others.

---

## Representative Assets

| asset_id | family | image_path | why selected |
|---|---|---|---|
| tile_tuna_ch1 | regular tile | `.allforai/game-design/art/tilesets/tile_tuna_ch1.png` | Most common marine creature tile; represents tile family style |
| tile_jellyfish_ch1 | regular tile | `.allforai/game-design/art/tilesets/tile_jellyfish_ch1.png` | Ethereal/pastel tile; tests palette range within tile family |
| char_ritsu_expr_default | character expression | `.allforai/game-design/art/expressions/char_ritsu_expr_default.png` | Protagonist default; represents human character style |
| char_hinata_expr_happy | character expression | `.allforai/game-design/art/expressions/char_hinata_expr_happy.png` | Signature color character; tests vibrant character style |
| char_kenzo_portrait_default | dialogue portrait | `.allforai/game-design/art/portraits/char_kenzo_portrait_default.png` | Older male character; tests portrait framing style |
| char_gicho_idle_f01 | animation frame | `.allforai/game-design/art/char_gicho/char_gicho_idle_f01.png` | Cat character; tests non-human character style coherence |

---

## Target Style: Japanese Healing Island Watercolor

All assets must share these properties:
- **Rendering**: Hand-drawn watercolor illustration look — visible brush textures, soft edges, organic forms
- **Palette**: Warm pastels — island sand (#F7EDD8), coral warm (#E8866A), ocean teal (#5BBFB5), bamboo green (#7DBE77), sakura pink (#F0C4C4), driftwood (#C4955A), golden hour (#F5C842)
- **Mood**: Soft, warm, healing, non-aggressive — no harsh edges, no cool or aggressive tones
- **Proportions**: Chibi/kawaii proportions for characters (1:1.5 head-body ratio)
- **Outlines**: Colored outlines, not pure black
- **Shadows**: Soft, flat — not realistic 3D lighting

---

## Visual Questions

### Theme A: Shared World Feel
1. Looking at all 6 images: do they feel like they belong to the same game/world?
2. Could a player see a tile and a character side by side and immediately know they are from the same game?
3. Is there any asset family that feels stylistically isolated — like it was made in a different art style than the others?

### Theme B: Palette Coherence
4. Do the color palettes across tiles and characters feel harmonious? (Warm pastels, same temperature family)
5. Are there any assets that use colors that feel jarring or out-of-place compared to the others?
6. Is the warmth/temperature of the palette consistent (tiles and characters both warm-toned)?

### Theme C: Rendering Style Consistency
7. Is the hand-drawn watercolor texture visible on both tiles and character art?
8. Do both tile outlines and character outlines use colored (non-black) outlines?
9. Is the rendering approach (flat shading + soft shadows) consistent between tiles and character art?

### Theme D: Tone and Mood
10. Do tiles and characters share the same soft, healing, non-aggressive mood?
11. Does any asset feel too photorealistic, too aggressive in saturation, or too "Western cartoon" compared to the others?

---

## Acceptance Criteria Summary

- All 6 representative assets share visible hand-drawn watercolor texture
- Color palettes across families are harmonious (same warm pastel temperature)
- Outlines are colored (not pure black) in both tiles and characters
- No asset family feels stylistically isolated from the others
- Overall mood is soft, warm, healing — consistent across all families

## Blocking Failure Codes

- `EXPR_STYLE_BREAK` — character expressions are in a different art style from tiles
- `TILE_PHOTOREALISTIC` — tiles are photorealistic while characters are watercolor (or vice versa)

## Major Failure Codes

- `CROSS_FAMILY_PALETTE_MISMATCH` — palette temperatures are inconsistent across families (note: this is a narrative failure code for this batch; map to closest standard code in report)
- `CROSS_FAMILY_MOOD_MISMATCH` — one family has aggressive/harsh tone while others are soft

## Output Format

For each finding, report:
```json
{
  "finding_id": "F06-...",
  "task_id": "TASK-06",
  "asset_id": "cross_family or specific asset",
  "severity": "blocker|major|minor|pass",
  "claim": "what you observed",
  "evidence_paths": ["list of relevant image paths"],
  "failure_code": "CODE or CROSS_FAMILY_NARRATIVE_CODE",
  "recommended_fix": "specific action or which family needs style correction"
}
```
