---
node: character-art-gen
capability: game-design
discipline_owner: character-modeler
human_gate: true
hard_blocked_by: [concept-freeze]
unlocks: [art-qa]
approval_record_path: .allforai/game-design/approval-records.json
exit_artifacts:
  - path: .allforai/game-design/character-art-review.html
  - path: .allforai/game-design/systems/character-art-spec.json
review_checklist:
  - 主角（律）有完整表情图（至少：默认/困惑/开心/疲惫/感动）
  - 骨骼绑定点位标注清楚（DragonBones/帧动画二选一已确定）
  - 角色比例在同一参考系下统一（律/ひなた/健三/梅子/夏帆/冬子）
  - 各NPC的视觉识别特征明显（服装标识色/独特道具/发型）
  - 角色有idle动效规格（轻微呼吸感动画帧描述）
---

# Goal

Generate character art assets for all entries in `.allforai/concept-contract.json` `canonical_registry.characters[]`.

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

- `.allforai/concept-contract.json` — `canonical_registry.characters[]` (authoritative asset IDs and `file_prefix` values; do not invent your own names)
- `.allforai/game-design/art-pipeline-config.json` — `character` configuration and `toolchain.detected_capabilities`
- `.allforai/game-design/art-asset-inventory.json` — current asset states (skip assets with `current_state == "locked"`)
- `.allforai/game-design/asset-registry.json` — canonical registry built by concept-freeze

## Sub-Skill Invocation

Read and follow each sub-skill SKILL.md in order. Each sub-skill defines its own output contract — follow it exactly.

### Step 0 — Source Resolution (per asset, before Pre-Spec)

For each asset in `canonical_registry.characters[]`, check its `source_strategy` from `asset-registry.json`:

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

1. `${CLAUDE_PLUGIN_ROOT}/skills/game-art/20-spec/character-layer-sheet/SKILL.md` — always
2. `${CLAUDE_PLUGIN_ROOT}/skills/game-art/20-spec/visual-style-tokens/SKILL.md` — always

Skip for assets that completed Step 0 and are already marked `adapted`.

### Step 2 — Generate

- When `character.rig = dragonbones`, `dragonbones_mesh`, or `skeletal_3d`:
  `${CLAUDE_PLUGIN_ROOT}/skills/game-art/30-generate/skeletal-animation/SKILL.md`
- When `character.rig = frame_sequence`:
  `${CLAUDE_PLUGIN_ROOT}/skills/game-art/30-generate/frame-animation-generation/SKILL.md`
- When `character.expressions = true` (append after primary generate):
  `${CLAUDE_PLUGIN_ROOT}/skills/game-art/30-generate/expression-set-generation/SKILL.md`

Skip for assets already marked `adapted`.

## Completion Condition

`.allforai/game-design/systems/character-art-spec.json` exists AND `.allforai/game-design/character-art-review.html` exists AND all `canonical_registry.characters[]` entries have `current_state != "placeholder"`.

If any sub-skill returns `UPSTREAM_DEFECT` → halt and report the defect. Do not advance to `art-qa`.
