# BATCH-02 — Special Tactical Tiles Visual Acceptance

**Batch ID**: BATCH-02-tiles-special
**Task ID**: TASK-02
**Asset Family**: tileset / special_tactical_tile
**Asset Count**: 5
**Task Risk**: HIGH
**Visual Model**: codex-default (multimodal, satisfies marker-verification requirement)
**Review Goal**: Verify all 5 special tactical tiles have unique mechanic markers that are not shared with any regular tiles, and are mutually distinguishable from each other.

---

## CRITICAL REVIEWER INSTRUCTION

You MUST visually inspect all 5 special tile images. You must also compare against the 20 regular tiles from BATCH-01. Do not pass any special tile without confirming its required mechanic marker is present and visually distinct.

---

## Asset Table

| asset_id | image_path | required_marker | required_color | mechanic |
|---|---|---|---|---|
| tile_wave_block | `.allforai/game-design/art/tilesets/tile_wave_block_frame_01.png` | Concentric ring ripple pattern | Teal-cyan #7ECDE8 | Clears entire row or column |
| tile_light_chain_block | `.allforai/game-design/art/tilesets/tile_light_chain_block_frame_01.png` | Gold chain link pattern with scan-line glow | Sakura pink #F0C4C4 + Gold #F5C842 | Chains adjacent matches |
| tile_pierce_block | `.allforai/game-design/art/tilesets/tile_pierce_block_frame_01.png` | Single directional arrow (UNIQUE — only directional tile) | Orange #F5A840 | Pierces through obstacles in a line |
| tile_swap_block | `.allforai/game-design/art/tilesets/tile_swap_block_frame_01.png` | Bidirectional swap arrows (two-way) | Golden yellow #F5C842 base | Swaps two tile positions |
| tile_cascade_block | `.allforai/game-design/art/tilesets/tile_cascade_block_frame_01.png` | Sequential step dots or numbered chain pattern | Dark forest green #4A7D55 | Auto-chain sequential trigger |

---

## Key Distinctions (Must Not Be Confused)

- `wave_block` vs `cascade_block`: Both involve "rings" but wave=expanding concentric circles (teal), cascade=sequential dots in chain (dark green)
- `swap_block` vs `light_chain_block`: Both use gold but swap=bidirectional arrows + green spiral (gold base), chain=chain link pattern (pink base + gold accents)
- `pierce_block` is the ONLY tile with a directional arrow — this must be unique across all 25 tiles

---

## Visual Questions

### Theme A: Marker Presence
1. Does `tile_wave_block` show visible concentric ring ripple motif?
2. Does `tile_light_chain_block` show visible chain link or chain connector motif?
3. Does `tile_pierce_block` show a visible directional arrow pointing in one direction?
4. Does `tile_swap_block` show bidirectional arrows (arrows pointing in two directions)?
5. Does `tile_cascade_block` show a sequential/step pattern or numbered dots?

### Theme B: Color Identity
6. Is `tile_wave_block` predominantly teal-cyan colored?
7. Is `tile_light_chain_block` sakura pink base with gold accents?
8. Is `tile_pierce_block` orange based?
9. Is `tile_swap_block` golden-yellow based?
10. Is `tile_cascade_block` dark forest green based?

### Theme C: Mutual Distinction
11. Are all 5 special tiles clearly distinguishable from each other at a glance?
12. Does any special tile look similar to another special tile?

### Theme D: Regular Tile Separation
13. Do any special tile motifs (rings, chain links, arrows, sequential dots) appear to match or overlap with visual elements from regular tiles?
14. Does a player unfamiliar with the game have any reason to confuse a special tile with a regular tile?

---

## Acceptance Criteria Summary

- Each special tile has its required mechanic marker visible
- Each special tile has its required color signature
- All 5 special tiles are mutually distinct
- No special tile marker motif appears on any regular tile
- All tiles display hand-drawn watercolor style (not photorealistic)

## Blocking Failure Codes

- `TILE_SPECIAL_MARKER_ABSENT` — required mechanic marker not visible
- `TILE_SPECIAL_MARKER_SHARED` — special tile marker motif appears on regular tile
- `TILE_IDENTICAL_SILHOUETTE` — two special tiles are visually indistinguishable

## Output Format

For each finding, report:
```json
{
  "finding_id": "F02-...",
  "task_id": "TASK-02",
  "asset_id": "tile_XXX_block",
  "severity": "blocker|major|minor|pass",
  "claim": "what you observed",
  "evidence_paths": ["path to image"],
  "failure_code": "CODE or null",
  "recommended_fix": "specific action"
}
```
