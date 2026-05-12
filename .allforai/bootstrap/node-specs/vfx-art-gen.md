---
node: vfx-art-gen
capability: game-design
discipline_owner: vfx-artist
human_gate: true
hard_blocked_by: [concept-freeze]
unlocks: [art-qa]
approval_record_path: .allforai/game-design/approval-records.json
exit_artifacts:
  - path: .allforai/game-design/vfx-art-review.html
  - path: .allforai/game-design/systems/vfx-asset-spec.json
review_checklist:
  - 特效帧序列完整（消除特效/combo升级特效/道具使用特效各自完整）
  - 粒子参数与引擎兼容（Cocos Creator粒子系统支持）
  - combo层级特效视觉清晰，不遮挡关键棋盘信息（z-index分层正确）
  - 特效循环无闪烁（帧序列首尾衔接流畅）
  - 高combo等级特效炫酷程度明显高于低等级（爽快感梯度）
---

# Goal

Generate VFX art assets for all entries in `.allforai/concept-contract.json` `canonical_registry.vfx[]`.

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

- `.allforai/concept-contract.json` — `canonical_registry.vfx[]` (authoritative asset IDs and `file_prefix` values; do not invent your own names)
- `.allforai/game-design/art-pipeline-config.json` — `vfx` configuration and `toolchain.detected_capabilities`
- `.allforai/game-design/art-asset-inventory.json` — current asset states (skip assets with `current_state == "locked"`)
- `.allforai/game-design/asset-registry.json` — canonical registry built by concept-freeze

## Sub-Skill Invocation

Read and follow each sub-skill SKILL.md in order. Each sub-skill defines its own output contract — follow it exactly.

### Step 0 — Source Resolution (per asset, before Pre-Spec)

For each asset in `canonical_registry.vfx[]`, check its `source_strategy` from `asset-registry.json`:

- **`existing_asset_pack`:**
  1. `${CLAUDE_PLUGIN_ROOT}/skills/game-art/20-spec/asset-pack-search-spec/SKILL.md` — search and select candidate pack
  2. `${CLAUDE_PLUGIN_ROOT}/skills/game-art/40-qa/asset-license-provenance-qa/SKILL.md` — verify license; if FAIL → fall back to `ai_generated` for this asset and proceed to Step 1
  3. `${CLAUDE_PLUGIN_ROOT}/skills/game-art/20-spec/existing-asset-adaptation-spec/SKILL.md` — adapt to spec
  4. Mark asset `current_state: adapted`; skip Step 1 and Step 2 for this asset.

- **`adapt_existing_asset`:**
  1. `${CLAUDE_PLUGIN_ROOT}/skills/game-art/40-qa/asset-license-provenance-qa/SKILL.md` — verify license; if FAIL → fall back to `ai_generated` and proceed to Step 1
  2. `${CLAUDE_PLUGIN_ROOT}/skills/game-art/20-spec/existing-asset-adaptation-spec/SKILL.md` — adapt to spec
  3. Mark asset `current_state: adapted`; skip Step 1 and Step 2 for this asset.

- **`existing_3d_source_asset` / `user_provided_asset`:**
  1. `${CLAUDE_PLUGIN_ROOT}/skills/game-art/40-qa/asset-license-provenance-qa/SKILL.md` — verify license; if FAIL → halt with UPSTREAM_DEFECT
  2. Proceed to Step 1.

- **`ai_generated` / `hybrid` / `placeholder_only`:** skip Step 0, proceed directly to Step 1.

### Step 1 — Pre-Spec

- `${CLAUDE_PLUGIN_ROOT}/skills/game-art/20-spec/vfx-spec/SKILL.md` — always

Skip for assets that completed Step 0 and are already marked `adapted`.

### Step 2 — Generate

- `${CLAUDE_PLUGIN_ROOT}/skills/game-art/30-generate/vfx-generation/SKILL.md` — always (orchestrates all VFX sub-skills internally)
- `${CLAUDE_PLUGIN_ROOT}/skills/game-art/30-generate/particle-system/SKILL.md` — when `vfx.approach` includes `particle`
- `${CLAUDE_PLUGIN_ROOT}/skills/game-art/30-generate/sprite-vfx-generation/SKILL.md` — when `vfx.approach` includes `sprite` or `spritesheet`
- `${CLAUDE_PLUGIN_ROOT}/skills/game-art/30-generate/shader-vfx-generation/SKILL.md` — when `vfx.approach` includes `shader`
- `${CLAUDE_PLUGIN_ROOT}/skills/game-art/30-generate/trail-generation/SKILL.md` — when `vfx.approach` includes `trail`
- `${CLAUDE_PLUGIN_ROOT}/skills/game-art/30-generate/screen-effect-generation/SKILL.md` — when `vfx.approach` includes `screen` or `postprocess`
- `${CLAUDE_PLUGIN_ROOT}/skills/game-art/30-generate/light-pulse-generation/SKILL.md` — when `vfx.approach` includes `light`

Skip for assets already marked `adapted`.

## Completion Condition

`.allforai/game-design/systems/vfx-asset-spec.json` exists AND `.allforai/game-design/vfx-art-review.html` exists AND all `canonical_registry.vfx[]` entries have `current_state != "placeholder"`.

If any sub-skill returns `UPSTREAM_DEFECT` → halt and report the defect. Do not advance to `art-qa`.
