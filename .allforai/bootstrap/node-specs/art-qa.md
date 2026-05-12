---
node: art-qa
capability: game-design
discipline_owner: art-director
human_gate: true
hard_blocked_by: [tile-art-gen, character-art-gen, environment-art-gen, ui-art-gen, vfx-art-gen]
unlocks: [game-design-finalize]
approval_record_path: .allforai/game-design/approval-records.json
exit_artifacts:
  - path: .allforai/game-design/art-qa-report.html
  - path: .allforai/game-design/art/export/engine-ready-art-output-contract.json
  - path: .allforai/game-runtime/art/engine-ready-art-manifest.json
review_checklist:
  - 全资产风格一致性（调色板/线条/光影）
  - 所有资产均有 alpha/final 状态
  - Atlas 打包无越界/重叠
  - 运行时导入通过（无丢失引用）
  - 3D 衍生资产透视/枢轴正确（若 dimension=2.5d）
---

# Goal

Run quality assurance across all generated art assets. Invoke the appropriate game-art QA sub-skills and aggregate results into `art-qa-report.html`.

> **Non-interactive execution.** All design decisions are recorded in `.allforai/`.
> Do NOT use AskUserQuestion or request user input.

> **Output language (mandatory):** All HTML navigation tabs, section headings, labels, captions,
> and descriptive text MUST be in Chinese (zh-CN). In-game proper nouns (place/character/item names)
> keep the game world's native language (Japanese). JSON field keys stay English snake_case.

## Inputs

- `.allforai/concept-contract.json` — `canonical_registry` (all types)
- `.allforai/game-design/art-pipeline-config.json` — `dimension`, `style`, `vfx.approach`
- `.allforai/game-design/systems/` — all `*-art-spec.json` outputs from art-gen nodes
- `.allforai/game-design/art-style-guide.json` — visual style reference

## Sub-Skill Invocation

Read and follow each applicable sub-skill SKILL.md in order:

1. **Preview evidence (always):** `${CLAUDE_PLUGIN_ROOT}/skills/game-art/40-qa/art-preview-qa/SKILL.md`
2. **Style consistency (always):** `${CLAUDE_PLUGIN_ROOT}/skills/game-art/40-qa/2d-style-consistency-qa/SKILL.md`
3. **UI readability** (when `ui-art-gen` ran): `${CLAUDE_PLUGIN_ROOT}/skills/game-ui/40-qa/ui-readability-qa/SKILL.md`
4. **Atlas packaging (always):** `${CLAUDE_PLUGIN_ROOT}/skills/game-art/40-qa/atlas-packaging/SKILL.md`
5. **Runtime import (always):** `${CLAUDE_PLUGIN_ROOT}/skills/game-art/40-qa/runtime-import-check/SKILL.md`
6. **3D-assisted QA** (when `dimension=2.5d`): `${CLAUDE_PLUGIN_ROOT}/skills/game-art/40-qa/3d-assisted-2d-qa/SKILL.md`
7. **Asset pack QA** (when any asset has `source_strategy=existing_asset_pack`): `${CLAUDE_PLUGIN_ROOT}/skills/game-art/40-qa/asset-pack-integration-qa/SKILL.md`
8. **License provenance sweep** (always, as final audit): `${CLAUDE_PLUGIN_ROOT}/skills/game-art/40-qa/asset-license-provenance-qa/SKILL.md` — for external-source assets this is a confirmation sweep (primary check already ran in art-gen Step 0); for AI-generated assets this catches potential training-data IP issues
9. **Engine-ready art handoff (always):** `${CLAUDE_PLUGIN_ROOT}/skills/game-art/40-qa/engine-ready-art-output-contract/SKILL.md`

## Completion Condition

`art-qa-report.html` exists, `.allforai/game-runtime/art/engine-ready-art-manifest.json` exists, and no sub-skill returned `UPSTREAM_DEFECT`.

**Gate action on sub-skill score < 3/5:**
For each failing asset, set `gate_status: "revision-requested"` in `.allforai/game-design/approval-records.json` for the relevant art-gen node, and populate `revision_notes` with the QA sub-skill's issue list. The orchestrator will re-run that art-gen node with `revision_notes` as context.
