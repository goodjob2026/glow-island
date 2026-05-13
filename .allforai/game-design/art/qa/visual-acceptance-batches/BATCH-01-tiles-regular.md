# BATCH-01 — Regular Tiles Visual Acceptance

**Batch ID**: BATCH-01-tiles-regular
**Task ID**: TASK-01
**Asset Family**: tileset / regular_tile
**Asset Count**: 20
**Task Risk**: HIGH
**Visual Model**: codex-default (multimodal, satisfies multi-image distinguishability requirement)
**Review Goal**: Verify all 20 regular marine/island tiles are visually distinct, art-style compliant, and properly composed for Ch1 of a match-3 puzzle game board.

---

## CRITICAL REVIEWER INSTRUCTION

You MUST visually inspect all 20 image files listed below. Do not pass or fail assets based on filenames, specs, or metadata alone. Open each image and assess it visually. Report findings with specific visual evidence.

---

## Asset Table

| asset_id | image_path | expected_subject | ch1_saturation |
|---|---|---|---|
| tile_tuna | `.allforai/game-design/art/tilesets/tile_tuna_ch1.png` | Golden bluefin tuna, side-profile, slight upward tilt, warm golden-yellow scales, teal accent fins | s0 (8-15% sat) |
| tile_octopus | `.allforai/game-design/art/tilesets/tile_octopus_ch1.png` | Chibi octopus, round head, 8 rounded tentacles, pink-purple palette | s0 |
| tile_starfish | `.allforai/game-design/art/tilesets/tile_starfish_ch1.png` | Starfish, 5 rounded arms with small bumps, warm coral-orange | s0 |
| tile_hermit_crab | `.allforai/game-design/art/tilesets/tile_hermit_crab_ch1.png` | Hermit crab peeking from spiral shell, small round claws raised, sandy-tan shell, peach body | s0 |
| tile_lanternfish | `.allforai/game-design/art/tilesets/tile_lanternfish_ch1.png` | Anglerfish/lanternfish, round dark body, glowing bioluminescent lure, deep teal with gold glow | s0 |
| tile_pufferfish | `.allforai/game-design/art/tilesets/tile_pufferfish_ch1.png` | Pufferfish fully inflated, round spiky silhouette, yellow-cream body, short rounded spines | s0 |
| tile_whale | `.allforai/game-design/art/tilesets/tile_whale_ch1.png` | Blue whale, rounded streamlined body, water spout, gentle expression, ocean blue with teal highlights | s0 |
| tile_coral | `.allforai/game-design/art/tilesets/tile_coral_ch1.png` | Branching coral, 3-5 upward branches with rounded tips, coral orange-pink, small decorative dots | s0 |
| tile_conch | `.allforai/game-design/art/tilesets/tile_conch_ch1.png` | Spiral conch shell, wide opening facing viewer, peach-cream tones, soft pink inner glow | s0 |
| tile_shell | `.allforai/game-design/art/tilesets/tile_shell_ch1.png` | Scallop shell, fan shape with ridged top edge, cream and lilac gradient | s0 |
| tile_crab | `.allforai/game-design/art/tilesets/tile_crab_ch1.png` | Red crab, both claws raised joyfully, vivid red-coral watercolor | s0 |
| tile_turtle | `.allforai/game-design/art/tilesets/tile_turtle_ch1.png` | Sea turtle, round patterned shell with hexagonal plates, four flippers wide, green with sandy yellow shell | s0 |
| tile_jellyfish | `.allforai/game-design/art/tilesets/tile_jellyfish_ch1.png` | Jellyfish, round translucent dome, 4-6 trailing tendrils, lavender-pink with inner glow | s0 |
| tile_flying_fish | `.allforai/game-design/art/tilesets/tile_flying_fish_ch1.png` | Flying fish mid-leap, elongated pectoral fins as wings, silvery-blue body, amber belly, water droplets below | s0 |
| tile_dolphin | `.allforai/game-design/art/tilesets/tile_dolphin_ch1.png` | Dolphin leaping upward, rounded streamlined body, ocean-blue, white belly, friendly smile | s0 |
| tile_seagull | `.allforai/game-design/art/tilesets/tile_seagull_ch1.png` | Seagull in flight, wings spread in gentle arc, white body, soft grey wingtips, yellow beak | s0 |
| tile_coconut_palm | `.allforai/game-design/art/tilesets/tile_coconut_palm_ch1.png` | Coconut palm tree, slightly curved trunk, 4-5 palm fronds, 2-3 brown coconuts | s0 |
| tile_lighthouse | `.allforai/game-design/art/tilesets/tile_lighthouse_ch1.png` | Miniature lighthouse, white and red striped tower, rounded top lantern room, golden light glow, small waves at base | s0 |
| tile_fishing_boat | `.allforai/game-design/art/tilesets/tile_fishing_boat_ch1.png` | Wooden fishing boat, rounded hull, small mast with furled sail, driftwood-brown wood, teal water ripples | s0 |
| tile_buoy | `.allforai/game-design/art/tilesets/tile_buoy_ch1.png` | Maritime buoy, round ball with flat top, red and white horizontal stripes, anchor chain, small wave | s0 |

---

## Visual Questions

### Theme A: Distinguishability
1. When you look at all 20 tiles, can you immediately tell each subject apart from every other? List any pair you find potentially confusable.
2. Do any two tiles share the same overall silhouette shape (e.g., two "round blob" tiles that look the same at a glance)?
3. Could a player in a fast match-3 game confuse any two tiles?

### Theme B: Subject Accuracy
4. Does each tile depict the expected subject (check a sample of 5 tiles against the table above)?
5. Is the subject centered in the canvas with visible padding — not cropped at edges?

### Theme C: Art Style
6. Does each tile display visible watercolor texture and brush stroke character (not vector flat, not photorealistic)?
7. Are tile outlines colored (not pure black)? Do any tiles have harsh black outlines?
8. Are all tiles appropriately desaturated for Ch1 (washed-out, muted palette, but not completely grey — warm undertone preserved)?

### Theme D: Technical
9. Source file sizes are mixed: 5 tiles at 1024×1024px and 15 at 512×512px. Does this size difference cause visible quality differences or composition differences?

---

## Acceptance Criteria Summary

- All 20 tiles visually distinct (no pair can be confused)
- Silhouettes readable as distinct shapes
- Hand-drawn watercolor style visible on all tiles
- No pure black outlines
- Subject centered, not cropped
- Ch1 desaturation: muted but warm undertone preserved
- Background transparent or neutral

## Blocking Failure Codes

- `TILE_IDENTICAL_SILHOUETTE` — two regular tiles share undistinguishable silhouette
- `TILE_SUBJECT_CROPPED` — subject extends beyond bleed zone
- `TILE_PHOTOREALISTIC` — photorealistic rendering
- `TILE_PURE_BLACK_OUTLINE` — pure #000000 outlines
- `TILE_DIMENSION_WRONG` — canvas not 128px target size

## Output Format

For each finding, report:
```json
{
  "finding_id": "F01-...",
  "task_id": "TASK-01",
  "asset_id": "tile_XXX",
  "severity": "blocker|major|minor|pass",
  "claim": "what you observed",
  "evidence_paths": ["path to image"],
  "failure_code": "CODE or null",
  "recommended_fix": "specific action"
}
```
