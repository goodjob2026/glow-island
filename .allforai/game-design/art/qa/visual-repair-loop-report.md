# Visual Repair Loop Report

**Project**: glow-island
**Skill**: game-art/40-qa/visual-acceptance-review
**Status**: FAILED_VALIDATION — Repair Required
**Budget**: 3 repair attempts per asset group / 2 Codex rerun attempts per batch (0 consumed)

---

## Iteration 1 — Initial QA Pass

**Date**: 2026-05-13
**Status**: Repair Pending
**Codex Review**: `.allforai/game-design/art/qa/codex-visual-review.json`
**Closure Audit**: `.allforai/game-design/art/qa/visual-review-closure-audit.json`
**Feedback Report**: `.allforai/game-design/art/image-generation/image-feedback-report.json`

### Results Summary

| Batch | Verdict | Blockers | Majors | Minors |
|---|---|---|---|---|
| BATCH-01 Regular Tiles (20) | Fail | 1 | 1 | 1 |
| BATCH-02 Special Tiles (5) | Fail | 1 | 0 | 0 |
| BATCH-03 Expressions (35) | Fail | 1 | 2 | 0 |
| BATCH-04 Portraits (10) | Fail | 1 | 1 | 0 |
| BATCH-05 Gicho Animation (15) | Fail | 2 | 2 | 0 |
| BATCH-06 Cross-Family Style (6) | Fail | 0 | 1 | 0 |
| **TOTAL (85 inspected)** | **Fail** | **6** | **7** | **1** |

### What Failed

1. **F001 BLOCKER TILE_DIMENSION_WRONG**: All 20 regular tiles at 512–1024px source, not 128×128px game canvas
2. **F002 MAJOR text artifacts**: guide marks and measurement labels on tile_starfish, hermit_crab, lanternfish
3. **F003 MINOR saturation**: 5 tiles over-saturated for ch1 s0 stage
4. **F004 BLOCKER TILE_DIMENSION_WRONG**: All 5 special block frame_01 at 512px, not 128px
5. **F005 BLOCKER EXPR_IDENTITY_DRIFT**: char_ritsu and char_umeko change appearance across 5 emotions
6. **F006 MAJOR EXPR_EMOTION_AMBIGUOUS**: react_jump reads as plain surprise for ritsu, kenzo, gicho
7. **F007 MAJOR baked text**: 9 expression PNGs contain text/labels/color codes baked into artwork
8. **F008 BLOCKER PORTRAIT_IDENTITY_MISMATCH**: char_hinata_portrait_happy is a different character
9. **F009 MAJOR dimension inconsistency**: 2 portraits at 512px vs 8 at 1024px; fuyuko react_jump has scene background + text
10. **F010 BLOCKER ANIM_IDENTITY_DRIFT**: all 15 gicho frames change body/face/proportions between frames
11. **F011 BLOCKER ANIM_LOOP_BREAK**: gicho idle f04→f01 would produce visible pop in loop
12. **F012 MAJOR ANIM_POSITION_JUMP**: 10 of 15 gicho frames jump between incompatible compositions
13. **F013 MAJOR baked labels**: 4 gicho frames have baked titles/frame numbers/labels
14. **F014 MAJOR cross-family**: tile saturation/glossy vs character anime line art — not fully harmonized

### What Is Working (Do Not Regress)

- All 5 special tile mechanic markers are visually correct and distinct (only dimension fails)
- 20 regular tile subjects are mostly distinguishable at 128px
- Silhouettes broadly readable at 32px
- Hinata, Kenzo, Natsuka, Fuyuko expressions largely identity-consistent
- 8 of 10 portraits pass crop discipline
- Wave animation paw motion IS visible (ANIM_MOTION_ABSENT not raised)
- Overall watercolor direction is correct

### Repair Plan (Iteration 2 Prerequisites)

| Repair Batch | Priority | Assets | Description |
|---|---|---|---|
| REPAIR-A | 1 | 15 | char_gicho complete 15-frame rebuild from locked model sheet |
| REPAIR-B | 2 | 10 | char_ritsu + char_umeko all 5 expressions from locked character refs |
| REPAIR-C | 3 | 25 | All 25 tile re-exports at 128×128px canvas |
| REPAIR-D | 4 | 2 | char_hinata + char_fuyuko portrait regeneration at 1024×1024 |
| REPAIR-E | 5 | 9 | Remaining expression text removal + react_jump pose improvement |
| REPAIR-F | 6 | 8 | 3 tile text artifact regeneration + 5 tile saturation correction |

After repairs: rebuild affected batch docs (BATCH-01 through BATCH-05), rerun Codex CLI review, re-audit closure.

---

*Iteration 2 will be appended here after repair execution.*
