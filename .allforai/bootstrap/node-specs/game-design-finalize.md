---
node: game-design-finalize
capability: game-design
discipline_owner: lead-designer
human_gate: true
hard_blocked_by: [core-loop-design, ftue-design, monetization-design, retention-hook-design, meta-game-design, level-design, puzzle-design, progression-curve-design, audio-design, worldbuilding, character-arc-design, art-qa]
unlocks: [setup-runtime-env, implement-puzzle-core, implement-special-mechanics, implement-game-session, implement-island-map, implement-ui-systems, implement-backend-api, implement-shop-iap, implement-audio, level-editor-tool]
approval_record_path: .allforai/game-design/approval-records.json
exit_artifacts:
  - .allforai/game-design/game-design-dashboard.html
  - .allforai/game-design/game-design-doc.json
  - .allforai/game-design/design/art-input-handoff.json
  - .allforai/game-design/design/art-input-handoff-report.json
  - .allforai/game-design/design/game-planning-handoff.md
  - .allforai/game-design/design/program-development-node-handoff.json
review_checklist:
  - game-design-doc.json 包含所有系统JSON的完整聚合（core-mechanics/monetization/retention-hook/meta-game/puzzle/level/progression-curve/audio/character-arc/worldbuilding）
  - art-input-handoff.json 包含所有视觉规格（art-style-guide/art-asset-inventory/art-pipeline-config）
  - program-development-node-handoff.json 包含程序开发所需的所有系统接口定义
  - game-design-dashboard.html 展示所有节点审批状态、未解决的修订备注
  - 无遗漏的未审批节点（所有human_gate节点均已approved才能通过本关卡）
---

# Goal

Aggregate all approved game-design system JSONs into the canonical `game-design-doc.json`, produce the `game-design-dashboard.html` status overview, and generate all cross-phase handoff artifacts.

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

## Sub-Skill Invocation

Read and follow in sequence:

1. **Data Table Generation:** Read and follow `${CLAUDE_PLUGIN_ROOT}/skills/game-design/30-generate/design-data-table-generation/SKILL.md`
2. **Art Input Handoff Generation:** Read and follow `${CLAUDE_PLUGIN_ROOT}/skills/game-design/30-generate/art-input-handoff-generation/SKILL.md`
3. **Content Coverage QA:** Read and follow `${CLAUDE_PLUGIN_ROOT}/skills/game-design/40-qa/content-coverage-qa/SKILL.md`
4. **Core Loop Closure QA:** Read and follow `${CLAUDE_PLUGIN_ROOT}/skills/game-design/40-qa/core-loop-closure-qa/SKILL.md`
5. **Contract Wiring QA:** Read and follow `${CLAUDE_PLUGIN_ROOT}/skills/game-design/40-qa/contract-wiring-qa/SKILL.md`
6. **Game Design Final Closure QA:** Read and follow `${CLAUDE_PLUGIN_ROOT}/skills/game-design/40-qa/game-design-final-closure-qa/SKILL.md`

**Templates sub-skills** (game has levels, items, economy rows — templates required):

7. Read and follow `${CLAUDE_PLUGIN_ROOT}/skills/game-templates/00-env/template-registry/SKILL.md`
8. Read and follow `${CLAUDE_PLUGIN_ROOT}/skills/game-templates/20-spec/template-schema-spec/SKILL.md`
9. Read and follow `${CLAUDE_PLUGIN_ROOT}/skills/game-templates/20-spec/template-inheritance-spec/SKILL.md`
10. Read and follow `${CLAUDE_PLUGIN_ROOT}/skills/game-templates/20-spec/template-reference-binding-spec/SKILL.md`
11. Read and follow `${CLAUDE_PLUGIN_ROOT}/skills/game-templates/30-generate/template-instance-generation/SKILL.md`
12. Read and follow `${CLAUDE_PLUGIN_ROOT}/skills/game-templates/40-qa/template-reference-closure-qa/SKILL.md`
13. Read and follow `${CLAUDE_PLUGIN_ROOT}/skills/game-templates/40-qa/template-runtime-load-qa/SKILL.md`

## Inputs

- `.allforai/game-design/approval-records.json` — all node gate statuses (must all be "approved")
- `.allforai/game-design/systems/core-mechanics.json`
- `.allforai/game-design/systems/monetization-design.json`
- `.allforai/game-design/systems/retention-hook.json`
- `.allforai/game-design/systems/meta-game.json`
- `.allforai/game-design/systems/puzzle-design.json`
- `.allforai/game-design/systems/level-design.json`
- `.allforai/game-design/systems/progression-curve.json`
- `.allforai/game-design/systems/audio-design.json`
- `.allforai/game-design/systems/character-arc.json`
- `.allforai/game-design/systems/worldbuilding.json`
- `.allforai/game-design/systems/ftue.json`
- `.allforai/game-design/art-style-guide.json`
- `.allforai/game-design/art-asset-inventory.json`
- `.allforai/game-design/art-pipeline-config.json`
- `.allforai/game-runtime/art/engine-ready-art-manifest.json`

## Key Integration Points

- `demo-forge` reads: `game-design-doc.json.progression`, `economy.currencies`
- `quality-checks` reads: `game-design-doc.json.economy.balance_targets`, `audio.sfx_events`, art counts
- All implementation nodes (`implement-*`) read: `program-development-node-handoff.json`
- `implement-audio` reads: `game-design-doc.json.audio`
- `implement-shop-iap` reads: `game-design-doc.json.economy`

## Dashboard Requirements

`game-design-dashboard.html` must at minimum show:
- Node status (approved/pending/in-review/revision-requested) for all game-design nodes
- Approval blockers and revision notes
- Art/audio/system readiness summary
- Link to `game-design-doc.json` for drill-down
