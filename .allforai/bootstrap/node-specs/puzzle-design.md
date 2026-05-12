---
node: puzzle-design
capability: game-design
discipline_owner: level-designer
human_gate: true
hard_blocked_by: [level-design]
unlocks: [game-design-finalize]
approval_record_path: .allforai/game-design/approval-records.json
exit_artifacts:
  - .allforai/game-design/puzzle-design.html
  - .allforai/game-design/systems/puzzle-design.json
review_checklist:
  - 消除机制定义完整（最大路径长度、转折规则）
  - Combo计时器参数与爽快感目标一致（倒计时曲线已定义）
  - 4种特殊块触发条件与效果完整定义，无歧义
  - 6章机制解锁时间表覆盖全部特殊块类型
  - 关卡难度节奏通过教学节拍与步调QA验证
---

# Goal

Execute puzzle-design for this project.

> **Non-interactive execution.** All design decisions are recorded in `.allforai/`.

> **Output language (mandatory):** All HTML navigation tabs, section headings, labels, captions,
> and descriptive text MUST be in Chinese (zh-CN). In-game proper nouns (place/character/item names)
> keep the game world's native language (Japanese). JSON field keys stay English snake_case.


> **Design integrity (mandatory):** All mechanics, currencies, item names, and system
> values in output documents MUST be sourced from the authoritative input files
> (concept-baseline.json, core-mechanics.json). NEVER reference old/deprecated systems,
> use "旧版"/"previously"/"replaced" in visible UI text, or include content for systems
> absent from concept-baseline.json. See game-design.md §Design Integrity Rules.
> Do NOT use AskUserQuestion or request user input. If a decision is ambiguous,
> apply the most conservative interpretation derivable from the input contracts.

## Sub-Skill Invocation

Follow these sub-skills in sequence:

- Read and follow `${CLAUDE_PLUGIN_ROOT}/skills/game-design/20-spec/level-design-spec/SKILL.md`
- Read and follow `${CLAUDE_PLUGIN_ROOT}/skills/game-level/10-design/level-flow-design/SKILL.md`
- Read and follow `${CLAUDE_PLUGIN_ROOT}/skills/game-level/20-spec/level-layout-spec/SKILL.md`
- Read and follow `${CLAUDE_PLUGIN_ROOT}/skills/game-level/20-spec/teaching-beat-spec/SKILL.md`
- Read and follow `${CLAUDE_PLUGIN_ROOT}/skills/game-level/40-qa/level-pacing-qa/SKILL.md`

## Inputs

- `.allforai/concept-contract.json`
- `.allforai/product-concept/concept-baseline.json`
- `.allforai/game-design/systems/level-design.json` — level structure and chapter plan
- `.allforai/game-design/systems/core-mechanics.json` — mechanic unlock schedule
- Sub-skill SKILL.md files define their specific input contracts.

## Key Design Decisions Already Made

- 连线路径：≤2次转折，最大路径长度由本节点的数值设计确定
- Combo计时器：连续消除后出现（触发阈值TBD），倒计时逐级缩短加速爽感
- 4种特殊块：炸弹（范围消除）、行清除、自动连接（AI辅助一步）、重排洗牌
- 6章机制解锁：Ch1基础消除→Ch2炸弹→Ch3行清除→Ch4自动连接→Ch5重排→Ch6全特效组合
- 特殊块通过combo积分触发，非随机投放，确保可预期性
