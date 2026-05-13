# Codex Visual Acceptance Review

Review date: 2026-05-13

Scope: visually inspected all 85 unique PNG assets referenced by the six visual acceptance batch documents. Cross-family references duplicate assets already present in earlier batches, but the cross-family batch was separately inspected as a style-comparison sheet.

Evidence sheets:

- `.allforai/game-design/art/qa/codex-visual-evidence/batch-01-regular-tiles-128.png`
- `.allforai/game-design/art/qa/codex-visual-evidence/batch-01-regular-tiles-32.png`
- `.allforai/game-design/art/qa/codex-visual-evidence/batch-02-special-tiles.png`
- `.allforai/game-design/art/qa/codex-visual-evidence/batch-03-expressions-*.png`
- `.allforai/game-design/art/qa/codex-visual-evidence/batch-04-portraits.png`
- `.allforai/game-design/art/qa/codex-visual-evidence/batch-05-gicho-*.png`
- `.allforai/game-design/art/qa/codex-visual-evidence/batch-06-cross-family.png`

## Overall Verdict

Fail. No batch was blocked from inspection, but every batch has at least one acceptance failure. The highest-risk areas are tile source dimensions, Ritsu/Umeko expression identity drift, Hinata portrait identity mismatch, and Gicho frame-animation continuity.

## BATCH-01 Regular Tiles

Verdict: Fail

Findings:

- F001 blocker, `TILE_DIMENSION_WRONG`: all 20 regular tile sources are 512x512 or 1024x1024, not the accepted 128x128 or 2x 256x256 tile canvas. Evidence: `batch-01-regular-tiles-128.png`. Repair: re-export or regenerate at the accepted tile canvas size.
- F002 major, no mapped batch failure code: `tile_starfish`, `tile_hermit_crab`, and `tile_lanternfish` contain visible generated guide marks or measurement text. Evidence: `batch-01-regular-tiles-128.png`. Repair: regenerate with labels, measurement guides, and UI annotations prohibited.
- F003 minor, no mapped batch failure code: `tile_tuna`, `tile_lanternfish`, `tile_flying_fish`, `tile_dolphin`, and `tile_crab` read more saturated and contrasty than the requested ch1 s0 stage. Evidence: `batch-01-regular-tiles-128.png`, `batch-06-cross-family.png`. Repair: palette-correct or regenerate with stricter s0 guidance.

Positive notes: the 20 subjects are mostly distinct at 128px, and the 32px contact sheet remains broadly readable.

## BATCH-02 Special Tiles

Verdict: Fail

Findings:

- F004 blocker, `TILE_DIMENSION_WRONG`: all five special tile frame_01 sources are 512x512, not the accepted 128x128 or 2x 256x256 canvas. Evidence: `batch-02-special-tiles.png`. Repair: re-export to accepted tile size.

Positive notes: the required mechanic markers are visible. Wave has concentric rings, light-chain has pink/gold chain links, pierce has a single directional arrow, swap has bidirectional arrows, and cascade has sequential dots.

## BATCH-03 Character Expressions

Verdict: Fail

Findings:

- F005 blocker, `EXPR_IDENTITY_DRIFT`: Ritsu changes face, hair, apparent age, and costume details across emotions; Umeko changes age read, headwear, face proportions, and clothing details. Evidence: `batch-03-expressions-ritsu.png`, `batch-03-expressions-umeko.png`. Repair: regenerate from locked character sheets.
- F006 major, `EXPR_EMOTION_AMBIGUOUS`: `char_ritsu_expr_react_jump`, `char_kenzo_expr_react_jump`, and `char_gicho_expr_react_jump` do not clearly read as energetic reaction-jump poses. Evidence: Ritsu, Kenzo, and Gicho expression sheets. Repair: strengthen pose energy and full-body reaction cues.
- F007 major, no mapped batch failure code: multiple expression assets include punctuation, color-code strings, labels, or Japanese text. Affected examples include Hinata react_jump, Umeko default/thinking/surprised, Natsuka surprised, Fuyuko surprised/react_jump, and Gicho default/surprised. Repair: regenerate with text, captions, punctuation, and color codes prohibited.

Positive notes: Hinata, Kenzo, Natsuka, Fuyuko, and Gicho generally preserve recognizable signature colors or identity cues across most non-failing expressions.

## BATCH-04 Character Portraits

Verdict: Fail

Findings:

- F008 blocker, `PORTRAIT_IDENTITY_MISMATCH`: `char_hinata_portrait_happy` reads as a different character than Hinata default and the Hinata expression set. Evidence: `batch-04-portraits.png`. Repair: regenerate from Hinata reference identity.
- F009 major, `PORTRAIT_DIMENSION_INCONSISTENT`: the two 512x512 portraits are not visually equivalent to the 1024x1024 group. Hinata happy has different crop and identity; Fuyuko react_jump includes a scene background and baked Japanese text. Evidence: `batch-04-portraits.png`. Repair: regenerate both at 1024x1024 with consistent portrait framing and no text or scene background.

Positive notes: most portraits show face and shoulders with centered faces and readable identities.

## BATCH-05 Gicho Animation

Verdict: Fail

Findings:

- F010 blocker, `ANIM_IDENTITY_DRIFT`: Gicho changes body size, face design, crop, posture, stripe pattern, and collar rendering across frames and animation sets. Evidence: all four Gicho animation sheets. Repair: rebuild from one locked model sheet or draw-over base pose.
- F011 blocker, `ANIM_LOOP_BREAK`: idle f04 is a side-facing heavier pose while idle f01 is front-facing, so f04 to f01 would visibly pop. Evidence: `batch-05-gicho-idle.png`. Repair: rebuild idle as a subtle breathing loop around one base pose.
- F012 major, `ANIM_POSITION_JUMP`: adjacent frames jump between full-body, cropped bust, side view, standing, and lying compositions. Evidence: all four Gicho animation sheets. Repair: normalize canvas anchor, scale, and orientation before motion generation.
- F013 major, no mapped batch failure code: several frames contain baked titles, frame numbers, labels, or color codes, including idle f02, happy f01, happy f02, and wave f04. Evidence: idle, happy, and wave sheets. Repair: regenerate or paint out text and numbers.

Positive notes: the wave set does show visible paw movement, so `ANIM_MOTION_ABSENT` is not raised.

## BATCH-06 Cross-Family Style

Verdict: Fail

Findings:

- F014 major, `CROSS_FAMILY_PALETTE_MISMATCH`: the representative set shares a watercolor intent, but the tiles look more saturated and glossy while the character assets use cleaner anime line art. Evidence: `batch-06-cross-family.png`. Repair: unify palette, paper texture, outline softness, and watercolor surface treatment across families.

Positive notes: the overall direction is close to the requested warm, gentle island aesthetic; this is a harmonization issue rather than a complete style mismatch.

## Final Summary Table

| Batch | Assets inspected | Verdict | Blocker | Major | Minor | Notes |
|---|---:|---|---:|---:|---:|---|
| BATCH-01 regular tiles | 20 | Fail | 1 | 1 | 1 | Distinct silhouettes, but dimensions and baked guide marks fail acceptance. |
| BATCH-02 special tiles | 5 | Fail | 1 | 0 | 0 | Markers pass visually; dimensions fail. |
| BATCH-03 expressions | 35 | Fail | 1 | 2 | 0 | Identity drift, text artifacts, weak react_jump poses. |
| BATCH-04 portraits | 10 | Fail | 1 | 1 | 0 | Hinata happy mismatch; 512px portraits not equivalent. |
| BATCH-05 Gicho animation | 15 | Fail | 2 | 2 | 0 | Identity drift, loop break, position jumps, baked labels. |
| BATCH-06 cross-family | 6 | Fail | 0 | 1 | 0 | Style direction is close but not harmonized. |
| Total unique PNGs | 85 | Fail | 6 | 7 | 1 | No blocked batches. |
