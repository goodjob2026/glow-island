# Visual Review Closure Audit

**Audit ID**: AUDIT-001
**Date**: 2026-05-13
**Auditor**: Claude Code (structure/routing audit only — does NOT re-score visual quality)
**Codex Review Ref**: `.allforai/game-design/art/qa/codex-visual-review.json`
**Verdict**: INCOMPLETE (repair loop required)

---

## Audit Scope

This audit checks whether the Codex CLI review is structurally sound and usable for repair routing. It does NOT override Codex's visual judgments. Claude Code is not the visual judge.

---

## Structural Checks

| Check | Result | Notes |
|---|---|---|
| Codex report exists and parseable | PASS | Both JSON and MD files present, well-formed |
| All 6 batches reviewed | PASS | 6 batch_summaries with assets_referenced/assets_inspected counts |
| total_inspected = 85 | PASS | Matches expected asset count |
| Evidence contact sheets exist | PASS | 16 PNG contact sheets in codex-visual-evidence/ — real files, Codex composed them from actual PNGs |
| Assets inspected match assets referenced per batch | PASS | 20/20, 5/5, 35/35, 10/10, 15/15, 6/6 |
| Codex did not pass from specs alone | PASS | Findings cite specific visual observations tied to contact sheet evidence |
| Every blocker has evidence_paths and repair_suggestion | PASS | All 6 blockers have both |
| Every blocker has failure_code | PARTIAL | F010 has failure_code=null; should be ANIM_IDENTITY_DRIFT |
| Every major has evidence_paths and repair_suggestion | PASS | All 7 majors have both |
| Every major has failure_code | PARTIAL | F002, F007, F013 have null codes; should map to TILE_TEXT_ARTIFACT / EXPR_TEXT_BAKED |
| No asset accepted without Codex inspection | PASS | overall_verdict=fail; no assets accepted |

---

## Findings Summary

| ID | Batch | Severity | Failure Code | Affected Assets | Repair Route |
|---|---|---|---|---|---|
| F001 | BATCH-01 | **BLOCKER** | TILE_DIMENSION_WRONG | All 20 regular tiles | image-generation-contract: re-export at 128×128px |
| F002 | BATCH-01 | Major | (null — text artifacts) | tile_starfish, tile_hermit_crab, tile_lanternfish | image-generation-contract: regenerate without guide marks |
| F003 | BATCH-01 | Minor | (null — saturation) | 5 tiles too saturated for Ch1 s0 | image-generation-contract: palette correction or regenerate |
| F004 | BATCH-02 | **BLOCKER** | TILE_DIMENSION_WRONG | All 5 special tiles (frame_01) | image-generation-contract: re-export at 128×128px |
| F005 | BATCH-03 | **BLOCKER** | EXPR_IDENTITY_DRIFT | char_ritsu ×5, char_umeko ×5 | image-generation-contract: regenerate from locked character refs |
| F006 | BATCH-03 | Major | EXPR_EMOTION_AMBIGUOUS | char_ritsu/kenzo/gicho react_jump | image-generation-contract: stronger pose energy |
| F007 | BATCH-03 | Major | (null — baked text) | 9 expressions with baked text/labels | image-generation-contract: negative prompt for all text |
| F008 | BATCH-04 | **BLOCKER** | PORTRAIT_IDENTITY_MISMATCH | char_hinata_portrait_happy | image-generation-contract: regenerate from Hinata reference |
| F009 | BATCH-04 | Major | PORTRAIT_DIMENSION_INCONSISTENT | char_hinata_portrait_happy, char_fuyuko_portrait_react_jump | image-generation-contract: re-export at 1024×1024 |
| F010 | BATCH-05 | **BLOCKER** | (null — should be ANIM_IDENTITY_DRIFT) | All 15 char_gicho frames | image-generation-contract: rebuild from locked model sheet |
| F011 | BATCH-05 | **BLOCKER** | ANIM_LOOP_BREAK | char_gicho_idle_f04/f01 | image-generation-contract: rebuild idle as breathing loop |
| F012 | BATCH-05 | Major | ANIM_POSITION_JUMP | 10 of 15 gicho frames | image-generation-contract: normalize anchor/scale/orientation |
| F013 | BATCH-05 | Major | (null — baked labels) | 4 gicho frames with baked numbers/labels | image-generation-contract: remove baked text |
| F014 | BATCH-06 | Major | CROSS_FAMILY_PALETTE_MISMATCH | Cross-family style | image-generation-contract: recheck after tile+char fixes |

**Totals: 6 blockers, 7 majors, 1 minor**

---

## Items Missing Before Closure

These items are required before audit can return `closed`:

1. **image-feedback-report.json not written** — All blocker/major findings must be written to `.allforai/game-design/art/image-generation/image-feedback-report.json` with `artifact_id`, `batch_id`, `failure_code`, `severity`, `evidence_refs`, `root_cause`, and `requested_action`.

2. **Repairs not executed** — 6 blockers require repair before revalidation. Priority:
   - char_gicho complete animation rebuild (F010, F011, F012, F013)
   - char_ritsu + char_umeko expression regeneration (F005)
   - All 25 tile re-exports at 128×128px (F001, F004)
   - char_hinata_portrait_happy regeneration (F008)

3. **Affected batch documents not rebuilt** — After repairs, BATCH-01, BATCH-02, BATCH-03, BATCH-04, BATCH-05 must be rebuilt with updated evidence.

4. **Codex CLI rerun for affected batches not executed** — Required after repair.

5. **visual-repair-loop-report.json not written** — Required because blockers/majors were found.

---

## What Is Already Working (Do Not Regress)

| Area | Status |
|---|---|
| Special tile mechanic markers (F004 blocker is DIMENSION ONLY) | All 5 mechanic markers visually present and correct |
| Regular tile distinguishability | 20 subjects are mostly distinct at 128px — a genuine positive |
| 32px silhouette readability | Contact sheet shows broad readability at 32px |
| Hinata, Kenzo, Natsuka, Fuyuko expression identity | Largely consistent — do not modify these sets unless fixing F007 (text removal) |
| Portrait crop discipline | 8 of 10 portraits pass crop and centering |
| Wave animation motion | Paw motion is visible across wave frames — ANIM_MOTION_ABSENT NOT raised |
| Overall art direction | Watercolor direction is broadly correct; harmonization needed, not complete rework |

---

## Repair Priority Order

1. **HIGHEST**: char_gicho complete 15-frame rebuild from locked model sheet (F010, F011, F012, F013)
2. **HIGH**: char_ritsu all 5 expressions + char_umeko all 5 expressions from locked refs (F005)
3. **HIGH**: All 25 tile source dimensions — re-export at 128×128px (F001, F004)
4. **HIGH**: char_hinata_portrait_happy regeneration from correct reference (F008)
5. **MEDIUM**: Baked text removal across expressions (F007) and animation frames (F013)
6. **MEDIUM**: Baked measurement guide removal from 3 tiles (F002)
7. **MEDIUM**: react_jump pose energy strengthening for 3 characters (F006)
8. **MEDIUM**: Portrait 512px dimension standardization (F009)
9. **LOW**: Ch1 saturation correction for 5 tiles (F003)
10. **LOW**: Cross-family style harmonization recheck (F014) — rerun after 1-8 complete

---

## Next Step

Write `.allforai/game-design/art/image-generation/image-feedback-report.json` covering all 6 blockers and 7 majors, then execute repairs in priority order, rebuild affected batches, and rerun Codex CLI for revalidation. Append iteration results to `visual-repair-loop-report.json`.

---

*This audit covers iteration 1. No repair attempts have been made yet. Budget: 3 repair attempts + 2 rerun attempts per affected asset group.*
