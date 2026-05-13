# BATCH-04 — Character Portraits Visual Acceptance

**Batch ID**: BATCH-04-char-portraits
**Task ID**: TASK-04
**Asset Family**: portrait / dialogue_portrait
**Asset Count**: 10
**Task Risk**: MEDIUM
**Visual Model**: codex-default (multimodal, satisfies crop discipline check requirement)
**Review Goal**: Verify all 10 dialogue portraits show face + shoulder crop, are properly centered, character identity is recognizable, and investigate the two dimension-inconsistent portraits.

---

## CRITICAL REVIEWER INSTRUCTION

You MUST visually inspect all 10 portrait images. Do not pass portraits based on filenames or metadata. Pay particular attention to the two portraits with different source dimensions (512×512 vs 1024×1024) and report whether this affects composition or crop quality.

---

## Asset Table

| asset_id | image_path | dimension | character | variant |
|---|---|---|---|---|
| char_ritsu_portrait_default | `.allforai/game-design/art/portraits/char_ritsu_portrait_default.png` | 1024×1024 | ritsu | neutral |
| char_ritsu_portrait_happy | `.allforai/game-design/art/portraits/char_ritsu_portrait_happy.png` | 1024×1024 | ritsu | happy |
| char_hinata_portrait_default | `.allforai/game-design/art/portraits/char_hinata_portrait_default.png` | 1024×1024 | hinata | neutral |
| char_hinata_portrait_happy | `.allforai/game-design/art/portraits/char_hinata_portrait_happy.png` | **512×512** | hinata | happy |
| char_kenzo_portrait_default | `.allforai/game-design/art/portraits/char_kenzo_portrait_default.png` | 1024×1024 | kenzo | neutral |
| char_natsuka_portrait_default | `.allforai/game-design/art/portraits/char_natsuka_portrait_default.png` | 1024×1024 | natsuka | neutral |
| char_fuyuko_portrait_default | `.allforai/game-design/art/portraits/char_fuyuko_portrait_default.png` | 1024×1024 | fuyuko | neutral |
| char_fuyuko_portrait_react_jump | `.allforai/game-design/art/portraits/char_fuyuko_portrait_react_jump.png` | **512×512** | fuyuko | react_jump |
| char_gicho_portrait_default | `.allforai/game-design/art/portraits/char_gicho_portrait_default.png` | 1024×1024 | gicho (cat) | neutral |
| char_umeko_portrait_default | `.allforai/game-design/art/portraits/char_umeko_portrait_default.png` | 1024×1024 | umeko | neutral |

**Note**: Two portraits are 512×512px (char_hinata_portrait_happy and char_fuyuko_portrait_react_jump). All others are 1024×1024px. This requires visual investigation.

---

## Portrait Crop Standard

A passing portrait must show:
- **Face**: fully visible, not cropped at top, sides, or bottom of face
- **Shoulders**: visible at the lower frame edge
- **Centering**: face centered horizontally
- **Content**: no full body below chest — portrait is not a full character sprite
- **Background**: neutral or gradient — not a scene background

---

## Visual Questions

### Theme A: Crop Discipline
1. For each portrait: does the image show face + shoulders (not body below chest)?
2. For each portrait: is the top of the head fully visible without cropping?
3. For each portrait: are the shoulders visible at or near the bottom edge of the frame?
4. Is the face horizontally centered in each portrait?

### Theme B: Dimension Inconsistency Investigation
5. For `char_hinata_portrait_happy` (512×512): does this portrait have the same crop style (face+shoulder) as `char_hinata_portrait_default` (1024×1024)?
6. For `char_fuyuko_portrait_react_jump` (512×512): does this portrait show a different composition or tighter crop compared to `char_fuyuko_portrait_default` (1024×1024)?
7. Do the 512×512 portraits look lower resolution or noticeably different quality compared to the 1024×1024 portraits?

### Theme C: Character Identity
8. Is each portrait clearly identifiable as the correct character (reference identity markers from BATCH-03)?
9. Does `char_gicho_portrait_default` clearly show the orange tabby cat (not a human character)?

### Theme D: Art Style
10. Are all 10 portraits in hand-drawn watercolor style consistent with the expression set?

---

## Acceptance Criteria Summary

- Each portrait shows face + shoulders, no face cropping
- Face centered horizontally
- Character identity recognizable from portrait crop alone
- Consistent watercolor style across all 10 portraits
- 512×512 portraits do not have noticeably different crop or composition

## Blocking Failure Codes

- `PORTRAIT_FACE_CROPPED` — face cut off at top or sides
- `PORTRAIT_IDENTITY_MISMATCH` — portrait does not match expected character

## Non-Blocking Watch Item

- `PORTRAIT_DIMENSION_INCONSISTENT` — 2 portraits at 512×512 vs 8 at 1024×1024; flag as major if crop or quality is meaningfully different; flag as minor if visually equivalent

## Output Format

For each finding, report:
```json
{
  "finding_id": "F04-...",
  "task_id": "TASK-04",
  "asset_id": "char_XXX_portrait_YYY",
  "severity": "blocker|major|minor|pass",
  "claim": "what you observed",
  "evidence_paths": ["path to image"],
  "failure_code": "CODE or null",
  "recommended_fix": "specific action"
}
```
