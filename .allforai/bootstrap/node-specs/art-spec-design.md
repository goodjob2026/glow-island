---
node: art-spec-design
capability: game-design
discipline_owner: concept-artist
human_gate: true
approval_record_path: .allforai/game-design/approval-records.json
exit_artifacts:
  - .allforai/game-design/art-spec-design.html
  - .allforai/game-design/art-asset-inventory.json
review_checklist:
  - 所有 must_have 资产已列入清单（图块/角色/场景/UI/VFX全覆盖）
  - 每个资产有明确尺寸规格（宽×高px，分辨率倍数）
  - 资产 ID 唯一无重复（遵循命名规范）
  - ai_generatable 分类合理（明确哪些可AI生成，哪些需人工）
  - milestone_gate 与发布计划一致（MVP/Beta/Release分层）
---

# Goal

Produce the formal art asset specification for Glow Island: a filterable HTML inventory and structured JSON catalogue of every asset required for implementation.

> **Non-interactive execution.** All design decisions are recorded in `.allforai/`.

> **Output language (mandatory):** All HTML navigation tabs, section headings, labels, captions,
> and descriptive text MUST be in Chinese (zh-CN). In-game proper nouns (place/character/item names)
> keep the game world's native language (Japanese). JSON field keys stay English snake_case.


> **Design integrity (mandatory):** All mechanics, currencies, item names, and system
> values in output documents MUST be sourced from the authoritative input files
> (concept-baseline.json, core-mechanics.json). NEVER reference old/deprecated systems,
> use "旧版"/"previously"/"replaced" in visible UI text, or include content for systems
> absent from concept-baseline.json. See game-design.md §Design Integrity Rules.
> Do NOT use AskUserQuestion or request user input.

## Inputs

- `.allforai/game-design/art-pipeline-config.json` — dimension, animation_system, toolchain, active_nodes
- `.allforai/game-design/art-style-guide.json` — style reference and art_overview
- `.allforai/game-design/systems/worldbuilding.json` — chapters[], environments, characters
- `.allforai/game-design/systems/core-mechanics.json` — special_blocks, combo visual effects

## Sub-Skill Invocation

Read and follow:

1. **Asset Registry:** Read and follow `${CLAUDE_PLUGIN_ROOT}/skills/game-art/00-env/asset-registry/SKILL.md`

## Context Pull

Bootstrap 在生成此节点时注明：`art-asset-inventory.json` 的 `current_state` 字段必须按以下规则初始化：
- `"placeholder"` — 资产已列入清单但尚未生成
- `"in_progress"` — 正在生成中
- `"alpha"` — 初稿已生成，待 QA
- `"locked"` — 已通过 QA，不再修改

所有资产初始 `current_state = "placeholder"`。art-gen 节点更新状态。art-qa 节点验收最终状态。
