---
node: tile-art-gen
capability: game-design
discipline_owner: concept-artist
human_gate: true
hard_blocked_by: [concept-freeze]
unlocks: [art-qa]
approval_record_path: .allforai/game-design/approval-records.json
exit_artifacts:
  - path: .allforai/game-design/tile-art-review.html
  - path: .allforai/game-design/systems/tile-art-spec.json
review_checklist:
  - 图块无缝拼接验证（边缘像素匹配，8方向衔接）
  - 所有图案类型变体已生成（至少8种基础图案 + 各章节主题色变）
  - 图块 atlas 尺寸符合规格（符合 art-pipeline-config.json.tileset 配置）
  - 特殊块视觉识别度高（炸弹/行消/自动连/重排各有独特外观）
  - combo触发特效帧完整（消除动画帧序列，不遮挡关键棋盘信息）
---

# Goal

Generate tile art assets for all entries in `.allforai/concept-contract.json` `canonical_registry.tiles[]`.

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

- `.allforai/concept-contract.json` — `canonical_registry.tiles[]` (authoritative asset IDs and `file_prefix` values; do not invent your own names)
- `.allforai/game-design/art-pipeline-config.json` — `tileset` configuration and `toolchain.detected_capabilities`
- `.allforai/game-design/art-asset-inventory.json` — current asset states (skip assets with `current_state == "locked"`)
- `.allforai/game-design/asset-registry.json` — canonical registry built by concept-freeze

## Sub-Skill Invocation

Read and follow each sub-skill SKILL.md in order. Each sub-skill defines its own output contract — follow it exactly.

### Step 0 — Source Resolution (per asset, before Pre-Spec)

For each asset in `canonical_registry.tiles[]`, check its `source_strategy` from `asset-registry.json`:

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
  2. Proceed to Step 1 (pre-spec for rendering/conversion pipeline).

- **`ai_generated` / `hybrid` / `placeholder_only`:** skip Step 0, proceed directly to Step 1.

### Step 1 — Pre-Spec

1. `${CLAUDE_PLUGIN_ROOT}/skills/game-art/20-spec/tileset-spec/SKILL.md` — define tileset spec (always)
2. `${CLAUDE_PLUGIN_ROOT}/skills/game-art/20-spec/2-5d-production-mode-spec/SKILL.md` + `${CLAUDE_PLUGIN_ROOT}/skills/game-art/20-spec/2-5d-lighting-shadow-spec/SKILL.md` — when `dimension=2.5d`

Skip for assets that completed Step 0 and are already marked `adapted`.

### Step 2 — Generate

1. `${CLAUDE_PLUGIN_ROOT}/skills/game-art/30-generate/tileset-generation/SKILL.md` — always
2. `${CLAUDE_PLUGIN_ROOT}/skills/game-art/30-generate/render-to-2d-asset-generation/SKILL.md` — when `dimension=2.5d`

Skip for assets already marked `adapted`.

## Completion Condition

`.allforai/game-design/systems/tile-art-spec.json` exists AND `.allforai/game-design/tile-art-review.html` exists AND all `canonical_registry.tiles[]` entries have `current_state != "placeholder"`.

If any sub-skill returns `UPSTREAM_DEFECT` → halt and report the defect. Do not advance to `art-qa`.
