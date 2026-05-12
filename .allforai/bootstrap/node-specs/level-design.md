---
node: level-design
capability: game-design
discipline_owner: level-designer
human_gate: true
hard_blocked_by: [core-loop-design]
unlocks: [puzzle-design, game-design-finalize]
approval_record_path: .allforai/game-design/approval-records.json
exit_artifacts:
  - .allforai/game-design/level-design.html
  - .allforai/game-design/systems/level-design.json
review_checklist:
  - 关卡数量与章节分布合理（目标：6章×30关=180关）
  - 难度曲线平滑，首次通关率目标70%
  - 叙事触发点与区域解锁节点标注清晰
  - 关卡布局规格（棋盘形状/障碍分布/奖励投放）完整
  - 教学节拍覆盖所有核心机制的首次引入
---

# Goal

Execute level-design for this project.

> **Non-interactive execution.** All design decisions are recorded in `.allforai/`.

> **Output language (mandatory):** All HTML navigation tabs, section headings, labels, captions,
> and descriptive text MUST be in Chinese (zh-CN). In-game proper nouns (place/character/item names)
> keep the game world's native language (Japanese). JSON field keys stay English snake_case.

> Do NOT use AskUserQuestion or request user input. If a decision is ambiguous,
> apply the most conservative interpretation derivable from the input contracts.

## Sub-Skill Invocation

Follow these sub-skills in sequence:

- Read and follow `${CLAUDE_PLUGIN_ROOT}/skills/game-design/20-spec/level-design-spec/SKILL.md`
- Read and follow `${CLAUDE_PLUGIN_ROOT}/skills/game-level/00-env/level-registry/SKILL.md`
- Read and follow `${CLAUDE_PLUGIN_ROOT}/skills/game-level/10-design/level-flow-design/SKILL.md`
- Read and follow `${CLAUDE_PLUGIN_ROOT}/skills/game-level/20-spec/level-layout-spec/SKILL.md`
- Read and follow `${CLAUDE_PLUGIN_ROOT}/skills/game-level/20-spec/level-difficulty-budget-spec/SKILL.md`
- Read and follow `${CLAUDE_PLUGIN_ROOT}/skills/game-level/20-spec/teaching-beat-spec/SKILL.md`
- Read and follow `${CLAUDE_PLUGIN_ROOT}/skills/game-level/20-spec/encounter-placement-spec/SKILL.md`
- Read and follow `${CLAUDE_PLUGIN_ROOT}/skills/game-level/20-spec/reward-placement-spec/SKILL.md`
- Read and follow `${CLAUDE_PLUGIN_ROOT}/skills/game-level/40-qa/level-pacing-qa/SKILL.md`
- Read and follow `${CLAUDE_PLUGIN_ROOT}/skills/game-level/40-qa/level-playability-qa/SKILL.md`

## Inputs

- `.allforai/concept-contract.json`
- `.allforai/product-concept/concept-baseline.json`
- `.allforai/game-design/systems/core-mechanics.json` — core loop and mechanic unlock schedule
- Sub-skill SKILL.md files define their specific input contracts.

## Key Design Decisions Already Made

- 6章×30关=180关总量，步进棋盘（不滚动）
- Ch1-2：标准矩形棋盘（8×8至10×10）；Ch3+：不规则形状解锁
- 每章末尾一个Boss关（高难度+叙事触发），Boss关通过后解锁新岛屿区域
- 关卡数据以JSON驱动，支持关卡编辑器热更新
- 首次通关率目标70%，通关率低于50%触发难度降级建议
- 每章有1~2个"故事关"（低难度+NPC对话+剧情推进）
