# Visual Review Closure Audit — Iteration 3

**Audit date:** 2026-05-13  
**Codex rerun:** iteration 3 (post repair-run-2, targeted BATCH-03 + BATCH-04)  
**Overall status:** FAILED_VALIDATION

---

## Resolved Across All Iterations

| ID | What | How |
|----|------|-----|
| F001 | 20 regular tiles at 512/1024px | sips resize → 128×128 (commit ede9e68) |
| F004 | 5 special tiles at 512px | sips resize → 128×128 (commit ede9e68) |
| F005 (ritsu) | Ritsu expression drift | Repair1 regen with locked identity (commit 16ab5be) — confirmed PASS in iteration 3 |
| F008 | Hinata portrait_happy wrong character | Repair1 regen with locked identity (commit 16ab5be) — confirmed PASS |
| F05-BLOCKER-001+002 | Gicho animation loop break + identity drift | **ACCEPTED AS DESIGN-PHASE PLACEHOLDER** (user decision) — text-to-image limitation |

---

## Remaining Blockers (2)

| ID | Batch | Code | Status | Budget Left | Notes |
|----|-------|------|--------|-------------|-------|
| F03-BLOCKER-001 | BATCH-03 | EXPR_IDENTITY_DRIFT | Unresolved after repair 2 | **1 attempt** | Umeko: bun/apron lock but age/face/scale drift persists across 5 emotions |
| F04-BLOCKER-001 | BATCH-04 | PORTRAIT_IDENTITY_MISMATCH | Unresolved after repair 2 | 2 attempts | Ritsu portrait_happy: hair/shirt now match but face structure differs from default |

---

## Root Cause

Prompt-only identity locking cannot control subtle facial geometry, age rendering, and body scale across independent text-to-image generations. The `ABSOLUTE FIXED APPEARANCE` anchor successfully locked obvious visual markers (bun shape, apron color, shirt color) but could not enforce consistent face proportions, apparent age, or body scale across separate model calls.

**Fix options:**
- **Option A:** Accept as design-phase placeholders (same decision as Gicho)
- **Option B:** Repair3 — last attempt for BATCH-03 (1 budget remaining); attempt stronger dimensional anchoring
- **Option C:** img2img — use `portrait_default` as reference seed for Ritsu; use `expr_default` as seed for Umeko (requires ChatGPT canvas or DALL-E img2img API)

---

## Repair Budget Remaining

| Batch | Attempts Used | Remaining |
|-------|--------------|-----------|
| BATCH-03 | 2 | **1 (last)** |
| BATCH-04 | 1 | 2 |
| BATCH-05 | 1 | 2 (moot — accepted as placeholder) |
