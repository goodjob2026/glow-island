---
node: environment-art-gen
capability: game-design
discipline_owner: environment-artist
human_gate: true
hard_blocked_by: [concept-freeze]
unlocks: [art-qa]
approval_record_path: .allforai/game-design/approval-records.json
exit_artifacts:
  - path: .allforai/game-design/environment-art-review.html
  - path: .allforai/game-design/systems/environment-art-spec.json
review_checklist:
  - 地砖可无缝拼接（边缘像素匹配）
  - 视差层数与 art-pipeline-config 一致（背景/中景/前景层分离）
  - 光源方向全场景统一（所有章节使用相同光照模型）
  - 6章节场景各有独特视觉特征（码头/渔村/森林/山顶/神社/灯塔各不相同）
  - 岛屿进度状态变化资产已区分（每章节前/后期场景状态两套）
  - 四季变体规格已涵盖（春/夏/秋/冬各章节对应）
  - 冬季温泉场景特殊规格完整（积雪/蒸汽/雪花层/灯塔光晕）
  - 日夜三段色温变体已定义（白天/黄昏/夜晚）
---

# Goal

Generate environment art assets for all entries in `.allforai/concept-contract.json` `canonical_registry.environments[]`.

> **Non-interactive execution.** All design decisions are recorded in `.allforai/`.
> Do NOT use AskUserQuestion or request user input.

> **Output language (mandatory):** All HTML navigation tabs, section headings, labels, captions,
> and descriptive text MUST be in Chinese (zh-CN). In-game proper nouns (place/character/item names)
> keep the game world's native language (Japanese). JSON field keys stay English snake_case.


> **Design integrity (mandatory):** All mechanics, currencies, item names, and system
> values in output documents MUST be sourced from the authoritative input files
> (concept-baseline.json, core-mechanics.json). NEVER reference old/deprecated systems,
> use "旧版"/"previously"/"replaced" in visible UI text, or include content for systems
> absent from concept-baseline.json. See game-design.md §Design Integrity Rules.
## Inputs

- `.allforai/concept-contract.json` — `canonical_registry.environments[]` (authoritative asset IDs and `file_prefix` values; do not invent your own names)
- `.allforai/game-design/art-pipeline-config.json` — `environment` configuration and `toolchain.detected_capabilities`
- `.allforai/game-design/art-asset-inventory.json` — current asset states (skip assets with `current_state == "locked"`)
- `.allforai/game-design/asset-registry.json` — canonical registry built by concept-freeze

## Sub-Skill Invocation

Read and follow each sub-skill SKILL.md in order. Each sub-skill defines its own output contract — follow it exactly.

### Step 0 — Source Resolution (per asset, before Pre-Spec)

For each asset in `canonical_registry.environments[]`, check its `source_strategy` from `asset-registry.json`:

- **`existing_asset_pack`:**
  1. `${CLAUDE_PLUGIN_ROOT}/skills/game-art/20-spec/asset-pack-search-spec/SKILL.md` — search and select candidate pack
  2. `${CLAUDE_PLUGIN_ROOT}/skills/game-art/40-qa/asset-license-provenance-qa/SKILL.md` — verify license; if FAIL → fall back to `ai_generated` and proceed to Step 1
  3. `${CLAUDE_PLUGIN_ROOT}/skills/game-art/20-spec/existing-asset-adaptation-spec/SKILL.md` — adapt to spec
  4. Mark asset `current_state: adapted`; skip Step 1 and Step 2 for this asset.

- **`adapt_existing_asset`:**
  1. `${CLAUDE_PLUGIN_ROOT}/skills/game-art/40-qa/asset-license-provenance-qa/SKILL.md` — verify license; if FAIL → fall back to `ai_generated` and proceed to Step 1
  2. `${CLAUDE_PLUGIN_ROOT}/skills/game-art/20-spec/existing-asset-adaptation-spec/SKILL.md` — adapt to spec
  3. Mark asset `current_state: adapted`; skip Step 1 and Step 2 for this asset.

- **`existing_3d_source_asset` / `user_provided_asset`:**
  1. `${CLAUDE_PLUGIN_ROOT}/skills/game-art/40-qa/asset-license-provenance-qa/SKILL.md` — verify license; if FAIL → halt with UPSTREAM_DEFECT
  2. Proceed to Step 1 (pre-spec for rendering/conversion pipeline).

- **`ai_generated` / `hybrid` / `placeholder_only`:** skip Step 0, proceed directly to Step 1.

### Step 1 — Pre-Spec

1. `${CLAUDE_PLUGIN_ROOT}/skills/game-art/20-spec/2d-view-mode-spec/SKILL.md` — always
2. `${CLAUDE_PLUGIN_ROOT}/skills/game-art/20-spec/3d-source-asset-spec/SKILL.md` — when `dimension=3d` or `2.5d`

Skip for assets that completed Step 0 and are already marked `adapted`.

### Step 2 — Generate

1. `${CLAUDE_PLUGIN_ROOT}/skills/game-art/30-generate/background-generation/SKILL.md` — always
2. `${CLAUDE_PLUGIN_ROOT}/skills/game-art/30-generate/prop-generation/SKILL.md` — always
3. `${CLAUDE_PLUGIN_ROOT}/skills/game-art/30-generate/render-to-2d-asset-generation/SKILL.md` — when `dimension=3d` or `2.5d`

Skip for assets already marked `adapted`.

### Step 3 — Seasonal Variant Spec

After completing Steps 0-2, invoke the project-local seasonal art skill:

- `.allforai/bootstrap/specialized-skills/glow-island-seasonal-art-generation/SKILL.md`
  - Mode: `backgrounds_only`
  - Generates `.allforai/game-design/art/seasonal/seasonal-background-variants-spec.json`
  - Winter hot-spring scene MUST complete with full 4-element composition spec

## Completion Condition

`.allforai/game-design/systems/environment-art-spec.json` exists AND `.allforai/game-design/environment-art-review.html` exists AND `.allforai/game-design/art/seasonal/seasonal-background-variants-spec.json` exists AND all `canonical_registry.environments[]` entries have `current_state != "placeholder"`.

If any sub-skill returns `UPSTREAM_DEFECT` → halt and report the defect. Do not advance to `art-qa`.
