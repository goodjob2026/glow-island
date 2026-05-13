# Codex Visual Review Rerun

Reviewed at: 2026-05-13T20:47:56+09:00

Overall verdict: **FAIL**

Inspected batches: BATCH-01, BATCH-02, BATCH-03, BATCH-04, BATCH-05, BATCH-06.

## Summary

| Batch | Verdict | Blockers | Majors | Minors | Notes |
|---|---:|---:|---:|---:|---|
| BATCH-01 | FAIL | 0 | 1 | 0 | 128x128 repair passed, but some regular tiles contain baked-in annotation text. |
| BATCH-02 | PASS | 0 | 0 | 0 | Special tile mechanic markers are readable and distinct. |
| BATCH-03 | FAIL | 1 | 2 | 0 | Ritsu expression identity repair passed; Umeko still fails the locked ~55yo identity check; text/symbol artifacts and weak react_jump readability remain. |
| BATCH-04 | FAIL | 1 | 1 | 1 | Hinata happy repair passed; Ritsu happy only matches broad hair/shirt markers and still fails default-portrait face/style continuity. |
| BATCH-05 | FAIL | 2 | 1 | 0 | Gicho animation still fails idle loop closure and locked identity across frames. |
| BATCH-06 | FAIL | 0 | 1 | 0 | Cross-family style is not yet coherent. |

Overall counts: **4 blockers**, **6 majors**.

## BATCH-01 Regular Tiles

Verdict: **FAIL**

The rerun dimension repair is successful. All 20 regular tile files were visually inspected and are 128x128. The tile subjects are visually distinct enough for a match-3 board.

Failure: several tiles contain visible baked-in annotation text, including pixel-size labels or quality notes. Affected assets:

- `.allforai/game-design/art/tilesets/tile_octopus_ch1.png`
- `.allforai/game-design/art/tilesets/tile_starfish_ch1.png`
- `.allforai/game-design/art/tilesets/tile_hermit_crab_ch1.png`
- `.allforai/game-design/art/tilesets/tile_lanternfish_ch1.png`

Repair: regenerate or clean those PNGs with no labels, measurements, prompt notes, or quality annotations.

## BATCH-02 Special Tactical Tiles

Verdict: **PASS**

All five special tactical tiles were visually inspected at 128x128. The wave rings, chain links, directional pierce arrow, bidirectional swap arrows, and cascade dots are readable. The markers are mutually distinct and do not visually overlap with the regular tile subjects.

## BATCH-03 Character Expressions

Verdict: **FAIL**

Ritsu's regenerated set passes the rerun identity check: the dark disheveled hair, rolled light blue-grey shirt, lanky build, and expression changes stay consistent across all five emotions.

Blocker: Umeko still has `EXPR_IDENTITY_DRIFT`. The bamboo-green apron and updo/bun are present across all five emotions, but the same ~55-year-old woman is not locked. The default image reads as a mature broad-faced woman with stronger age lines; thinking and react_jump become much younger and smaller; the face shape, age, and body scale do not stay consistent.

Major: multiple expression images contain baked-in text, punctuation, symbols, or signature marks. Affected assets include:

- `.allforai/game-design/art/expressions/char_hinata_expr_react_jump.png`
- `.allforai/game-design/art/expressions/char_natsuka_expr_surprised.png`
- `.allforai/game-design/art/expressions/char_fuyuko_expr_surprised.png`
- `.allforai/game-design/art/expressions/char_fuyuko_expr_react_jump.png`
- `.allforai/game-design/art/expressions/char_gicho_expr_default.png`
- `.allforai/game-design/art/expressions/char_gicho_expr_surprised.png`

Major: some react_jump emotions are ambiguous. Gicho happy and react_jump both read as closed-eye smiling busts, and Kenzo react_jump lacks the expected energetic reaction.

## BATCH-04 Character Portraits

Verdict: **FAIL**

Hinata happy now passes the rerun identity check. It shows brown hair tied back, sakura-pink accents, and a worn notebook, and reads as Hinata.

Blocker: Ritsu default and happy portraits do not read as the same character. The happy portrait partially matches the broad requested markers, with dark disheveled hair and a blue-grey shirt, but it does not match the default portrait's face structure or rendering style. The default is a simplified chibi portrait with a rounder face, droopy eyes, flatter parted hair, and a pale blue-grey shirt; the happy portrait is a more realistic adult bust with a longer face, different eye/cheek structure, and a deeper open collar.

Major: Fuyuko react_jump has a scene background and Japanese text, so it does not match the neutral dialogue portrait crop/style.

Minor: portrait source dimensions are still inconsistent. Ritsu happy is 256x256 despite the batch doc listing 1024x1024, Hinata happy is now 1254x1254 instead of the listed 512x512, Fuyuko react_jump remains 512x512, and most other portraits are 1024x1024.

## BATCH-05 Gicho Animation

Verdict: **FAIL**

Blocker: idle loop closure fails. `char_gicho_idle_f04.png` is visibly smaller and proportionally different from `char_gicho_idle_f01.png`, so f04 to f01 would pop.

Blocker: Gicho identity still drifts across the 15 frames. Head size, body width, collar thickness, facial structure, and scale change between frames and animation sets.

Major: wave motion is present, but sequence continuity is unstable. `wave_f04` changes into a different lowered-paw pose, and the surprised sequence peaks at f02 then softens at f03 instead of escalating cleanly.

## BATCH-06 Cross-Family Style

Verdict: **FAIL**

The six representative assets do not yet feel like one coherent visual family. The tiles are muted watercolor icons, Ritsu is a tiny full-body chibi, Hinata reads cleaner anime, Kenzo reads like a storybook portrait, and Gicho reads more naturalistic. The palette is generally warm, but the rendering style, outline treatment, and proportions are inconsistent.

Repair: define one cross-family style target and normalize characters, portraits, and animation frames toward the same watercolor texture, saturation, colored-outline treatment, and chibi proportion language.
