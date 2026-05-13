# BATCH-03 — Character Expressions Visual Acceptance

**Batch ID**: BATCH-03-char-expressions
**Task ID**: TASK-03
**Asset Family**: character_expression
**Asset Count**: 35 (7 characters × 5 emotions)
**Task Risk**: HIGH
**Visual Model**: codex-default (multimodal, satisfies character identity consistency requirement)
**Review Goal**: Verify (a) each character is consistently identifiable across all 5 emotion variants, (b) all 5 emotions are mutually distinguishable, and (c) all 7 characters are distinguishable from each other.

---

## CRITICAL REVIEWER INSTRUCTION

You MUST visually inspect all 35 images. Group your review per character first (identity consistency), then per emotion (readability). Do not pass any character set without confirming identity consistency across all 5 emotions. Do not pass any emotion without confirming it is visually distinct from the other 4 emotions for that character.

---

## Character Identity Reference Table

| char_id | identity_markers | signature_color | species/gender |
|---|---|---|---|
| char_ritsu (律) | Slightly disheveled dark hair, rumpled dress shirt with rolled sleeves (light blue-grey), relaxed/casual posture | warm neutral — no assigned signature | adult male human |
| char_hinata (ひなた) | Sakura pink clothing or accessories (#F0C4C4), practical windswept hair tied back, notebook often held or visible, graceful posture | #F0C4C4 sakura pink | adult female human |
| char_kenzo (健三) | Deep sea blue fisherman's vest (#4A6D9A), sparse grey hair, weathered lined face, stocky broad-shouldered build, bare feet or deck shoes | #4A6D9A deep sea blue | older adult male human |
| char_umeko (梅子) | Bamboo green pottery apron (#7DBE77), practical updo bun, a few loose strands, slight forward work posture, clay-stained hands implied | #7DBE77 bamboo green | adult female human |
| char_natsuka (夏帆) | Deep forest green outdoor vest with pockets (#3D6645), windswept free hair, attentive head tilt posture | #3D6645 deep forest green | adult female human |
| char_fuyuko (冬子) | Night blue kimono-style top (#2A4060), neat upswept white/grey hair, upright serene lighthouse-keeper's posture | #2A4060 night blue | older adult female human |
| char_gicho (橘猫) | Orange tabby cat, sitting upright, dark navy collar/marking (#2A3650), round cat body, ears, tail, cat facial features | #2A3650 navy accent | cat (non-human) |

---

## Emotion Readability Reference

| emotion | required_visual_signals |
|---|---|
| default | Neutral relaxed expression — no strong emotion. Baseline face. |
| happy | Visible smile or upturned/crinkled eyes. Clear sense of joy or warmth. Meaningfully different from default. |
| thinking | Head tilted, or finger/hand to chin/cheek, or visible furrowed brow of concentration. |
| surprised | Wide eyes, often open mouth, raised eyebrows. Shock or pleasant surprise energy. |
| react_jump | Full-body reactive energy visible even in bust crop — excited, jumping, dynamic. More intense than surprised. |

---

## Asset Table — Per Character

### char_ritsu
| emotion | path |
|---|---|
| default | `.allforai/game-design/art/expressions/char_ritsu_expr_default.png` |
| happy | `.allforai/game-design/art/expressions/char_ritsu_expr_happy.png` |
| thinking | `.allforai/game-design/art/expressions/char_ritsu_expr_thinking.png` |
| surprised | `.allforai/game-design/art/expressions/char_ritsu_expr_surprised.png` |
| react_jump | `.allforai/game-design/art/expressions/char_ritsu_expr_react_jump.png` |

### char_hinata
| emotion | path |
|---|---|
| default | `.allforai/game-design/art/expressions/char_hinata_expr_default.png` |
| happy | `.allforai/game-design/art/expressions/char_hinata_expr_happy.png` |
| thinking | `.allforai/game-design/art/expressions/char_hinata_expr_thinking.png` |
| surprised | `.allforai/game-design/art/expressions/char_hinata_expr_surprised.png` |
| react_jump | `.allforai/game-design/art/expressions/char_hinata_expr_react_jump.png` |

### char_kenzo
| emotion | path |
|---|---|
| default | `.allforai/game-design/art/expressions/char_kenzo_expr_default.png` |
| happy | `.allforai/game-design/art/expressions/char_kenzo_expr_happy.png` |
| thinking | `.allforai/game-design/art/expressions/char_kenzo_expr_thinking.png` |
| surprised | `.allforai/game-design/art/expressions/char_kenzo_expr_surprised.png` |
| react_jump | `.allforai/game-design/art/expressions/char_kenzo_expr_react_jump.png` |

### char_umeko
| emotion | path |
|---|---|
| default | `.allforai/game-design/art/expressions/char_umeko_expr_default.png` |
| happy | `.allforai/game-design/art/expressions/char_umeko_expr_happy.png` |
| thinking | `.allforai/game-design/art/expressions/char_umeko_expr_thinking.png` |
| surprised | `.allforai/game-design/art/expressions/char_umeko_expr_surprised.png` |
| react_jump | `.allforai/game-design/art/expressions/char_umeko_expr_react_jump.png` |

### char_natsuka
| emotion | path |
|---|---|
| default | `.allforai/game-design/art/expressions/char_natsuka_expr_default.png` |
| happy | `.allforai/game-design/art/expressions/char_natsuka_expr_happy.png` |
| thinking | `.allforai/game-design/art/expressions/char_natsuka_expr_thinking.png` |
| surprised | `.allforai/game-design/art/expressions/char_natsuka_expr_surprised.png` |
| react_jump | `.allforai/game-design/art/expressions/char_natsuka_expr_react_jump.png` |

### char_fuyuko
| emotion | path |
|---|---|
| default | `.allforai/game-design/art/expressions/char_fuyuko_expr_default.png` |
| happy | `.allforai/game-design/art/expressions/char_fuyuko_expr_happy.png` |
| thinking | `.allforai/game-design/art/expressions/char_fuyuko_expr_thinking.png` |
| surprised | `.allforai/game-design/art/expressions/char_fuyuko_expr_surprised.png` |
| react_jump | `.allforai/game-design/art/expressions/char_fuyuko_expr_react_jump.png` |

### char_gicho
| emotion | path |
|---|---|
| default | `.allforai/game-design/art/expressions/char_gicho_expr_default.png` |
| happy | `.allforai/game-design/art/expressions/char_gicho_expr_happy.png` |
| thinking | `.allforai/game-design/art/expressions/char_gicho_expr_thinking.png` |
| surprised | `.allforai/game-design/art/expressions/char_gicho_expr_surprised.png` |
| react_jump | `.allforai/game-design/art/expressions/char_gicho_expr_react_jump.png` |

---

## Visual Questions

### Theme A: Per-Character Identity Consistency (evaluate each character set as a group)
1. For each character: looking at the 5 expressions side by side, does the same character look like the same person/entity across all 5 emotions?
2. For char_ritsu: is the disheveled dark hair and rolled-sleeve casual shirt consistently present?
3. For char_hinata: is sakura pink (#F0C4C4) visible in all 5 expressions? Is the notebook implied or visible?
4. For char_kenzo: is the fisherman vest (deep blue) visible? Is the weathered stocky appearance consistent?
5. For char_umeko: is the green apron (#7DBE77) consistently visible? Is the hair bun consistent?
6. For char_natsuka: is the forest green vest (#3D6645) consistently visible? Is the windswept hair consistent?
7. For char_fuyuko: is the night blue kimono-style top (#2A4060) consistently visible? Is the upswept neat hair consistent?
8. For char_gicho: is the orange tabby cat with navy collar (#2A3650) consistently identifiable across all 5 expressions?

### Theme B: Inter-Character Distinctness
9. Could any two characters be confused with each other? (Especially: are natsuka and umeko distinct? Are ritsu and kenzo distinct?)
10. Does char_gicho (the cat) look immediately different from all human characters?

### Theme C: Emotion Readability
11. Is `happy` clearly different from `default` for each character? Can you see a smile or eye change?
12. Is `thinking` clearly different from `default` for each character? Is there a head tilt or gesture?
13. Is `surprised` clearly different from `happy`? (Wide eyes vs. smiling eyes?)
14. Is `react_jump` the most energetic/dynamic expression, clearly more intense than `surprised`?

### Theme D: Art Style
15. Are all 35 expressions in hand-drawn watercolor style?
16. Does any expression exhibit photorealistic rendering, neon colors, or non-watercolor style?
17. Are there any expressions with text/labels baked into the artwork?

---

## Acceptance Criteria Summary

- Same character recognizable across all 5 emotions (hair, clothing, signature color consistent)
- All 5 emotions clearly readable and distinguishable from each other per character
- All 7 characters visually distinguishable from each other
- Hand-drawn watercolor style on all 35 images
- No text baked into artwork

## Blocking Failure Codes

- `EXPR_IDENTITY_DRIFT` — same character looks like different person across expressions
- `EXPR_EMOTION_AMBIGUOUS` — two emotions indistinguishable for a character
- `EXPR_WRONG_CHAR` — character does not match expected identity markers
- `EXPR_STYLE_BREAK` — non-watercolor style rendering

## Output Format

For each finding, report:
```json
{
  "finding_id": "F03-...",
  "task_id": "TASK-03",
  "asset_id": "char_XXX_expr_YYY",
  "severity": "blocker|major|minor|pass",
  "claim": "what you observed",
  "evidence_paths": ["path to image"],
  "failure_code": "CODE or null",
  "recommended_fix": "specific action"
}
```
