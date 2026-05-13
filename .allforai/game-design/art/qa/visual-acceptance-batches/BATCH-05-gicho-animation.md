# BATCH-05 — char_gicho Frame Animation Visual Acceptance

**Batch ID**: BATCH-05-gicho-animation
**Task ID**: TASK-05
**Asset Family**: animation / frame_animation
**Asset Count**: 15 frames (idle×4, happy×4, wave×4, surprised×3)
**Task Risk**: HIGH
**Visual Model**: codex-default (multimodal, satisfies animation frame continuity requirement)
**Review Goal**: Verify the 4 animation sets form coherent sequential motions, the idle loop closes cleanly (f04→f01), the wave motion is visible, cat identity is consistent across all 15 frames, and animation sets are mutually distinguishable.

---

## CRITICAL REVIEWER INSTRUCTION

You MUST visually inspect all 15 frames in sequential order per animation set. Evaluate frames left-to-right as a filmstrip. Do not pass any animation set without confirming visible motion progression between frames. Pay special attention to idle loop closure (f04 must visually connect back to f01 without a pop).

---

## Asset Table — By Animation Set

### Animation Set 1: IDLE (breathing loop, 4 frames)

| frame | path | expected motion |
|---|---|---|
| idle_f01 | `.allforai/game-design/art/char_gicho/char_gicho_idle_f01.png` | Neutral sitting pose — loop start/end reference |
| idle_f02 | `.allforai/game-design/art/char_gicho/char_gicho_idle_f02.png` | Slight inhale — body or chest slightly raised |
| idle_f03 | `.allforai/game-design/art/char_gicho/char_gicho_idle_f03.png` | Peak inhale or slight head shift |
| idle_f04 | `.allforai/game-design/art/char_gicho/char_gicho_idle_f04.png` | Return toward f01 pose — must not be dramatically different from f01 |

**Loop closure check**: Compare idle_f04 to idle_f01. Can these two frames be adjacent in a loop without visible jarring discontinuity?

### Animation Set 2: HAPPY (bounce/joy motion, 4 frames)

| frame | path | expected motion |
|---|---|---|
| happy_f01 | `.allforai/game-design/art/char_gicho/char_gicho_happy_f01.png` | Happy starting pose — slight anticipation |
| happy_f02 | `.allforai/game-design/art/char_gicho/char_gicho_happy_f02.png` | Rising bounce or ear perk |
| happy_f03 | `.allforai/game-design/art/char_gicho/char_gicho_happy_f03.png` | Peak happy — fully smiling or eyes closed happy |
| happy_f04 | `.allforai/game-design/art/char_gicho/char_gicho_happy_f04.png` | Settling back, still visibly happy |

### Animation Set 3: WAVE (paw/arm wave motion, 4 frames)

| frame | path | expected motion |
|---|---|---|
| wave_f01 | `.allforai/game-design/art/char_gicho/char_gicho_wave_f01.png` | Wave starting — paw/arm at low/neutral position |
| wave_f02 | `.allforai/game-design/art/char_gicho/char_gicho_wave_f02.png` | Paw/arm raised to mid position |
| wave_f03 | `.allforai/game-design/art/char_gicho/char_gicho_wave_f03.png` | Paw/arm at peak height |
| wave_f04 | `.allforai/game-design/art/char_gicho/char_gicho_wave_f04.png` | Paw/arm beginning to lower |

### Animation Set 4: SURPRISED (shock escalation, 3 frames)

| frame | path | expected motion |
|---|---|---|
| surprised_f01 | `.allforai/game-design/art/char_gicho/char_gicho_surprised_f01.png` | Initial surprise — beginning of shock |
| surprised_f02 | `.allforai/game-design/art/char_gicho/char_gicho_surprised_f02.png` | Building surprise — wider eyes or raised posture |
| surprised_f03 | `.allforai/game-design/art/char_gicho/char_gicho_surprised_f03.png` | Peak surprise — full shock face/body |

---

## Cat Identity Reference

char_gicho (议长·橘猫) is an orange tabby cat with:
- Orange/amber tabby striped fur
- Dark navy collar or marking (#2A3650)
- Round cat body, sitting upright by default
- Cat ears, cat face, cat tail
- Canvas: 192×192px spec (source files are 1024×1024 for QA purposes)

---

## Visual Questions

### Theme A: Idle Loop Closure (CRITICAL)
1. Looking at `idle_f01` and `idle_f04` side by side: are they similar enough in pose that playing them in sequence would create a smooth loop?
2. Is there a visible position or pose jump between idle_f04 and idle_f01 that would create a pop in a looping animation?
3. Is there any visible subtle motion difference across the 4 idle frames (breathing, slight head sway)?

### Theme B: Happy Motion
4. Are the happy frames visually different from the idle frames — more energetic or joyful expression?
5. Is there visible progressive motion across happy_f01→f04?

### Theme C: Wave Motion (CRITICAL)
6. Is there a visible paw/arm wave motion arc across wave_f01→f04?
7. Does the paw/arm position clearly change between wave_f01, f02, f03, and f04?
8. If no wave motion is visible, report `ANIM_MOTION_ABSENT`.

### Theme D: Surprised Escalation
9. Does surprise escalate visibly from surprised_f01→f03?
10. Are the surprised frames clearly different from the happy frames?

### Theme E: Cat Identity Consistency
11. Is the orange tabby cat with navy collar consistently identifiable across all 15 frames?
12. Are there any frames where the cat's fur color, body proportions, or collar markings change unexpectedly?
13. Is the sitting upright posture maintained consistently in idle and happy sets?

### Theme F: Animation Set Distinction
14. Are the 4 animation sets (idle, happy, wave, surprised) clearly distinguishable from each other?

---

## Acceptance Criteria Summary

- idle f04 visually connects to f01 without a jarring loop break
- happy frames show distinct joyful energy vs idle
- wave frames show clear paw/arm motion arc progression across 4 frames
- surprised frames show escalating surprise across 3 frames
- Orange tabby cat identity consistent across all 15 frames
- All 4 animation sets mutually distinct

## Blocking Failure Codes

- `ANIM_LOOP_BREAK` — idle f04→f01 would cause visible pop in loop
- `ANIM_IDENTITY_DRIFT` — cat looks different (wrong color/proportion) across frames
- `ANIM_MOTION_ABSENT` — wave animation shows no visible paw/arm position change across 4 frames

## Major Failure Codes

- `ANIM_SETS_INDISTINCT` — two animation sets are visually indistinguishable
- `ANIM_POSITION_JUMP` — subject position jumps discontinuously between adjacent frames

## Output Format

For each finding, report:
```json
{
  "finding_id": "F05-...",
  "task_id": "TASK-05",
  "asset_id": "char_gicho_ANIMATION_fNN",
  "severity": "blocker|major|minor|pass",
  "claim": "what you observed",
  "evidence_paths": ["path(s) to frame(s) involved"],
  "failure_code": "CODE or null",
  "recommended_fix": "specific action"
}
```
