---
node: ftue-design
capability: game-design
discipline_owner: ux-designer
human_gate: true
hard_blocked_by: [core-loop-design]
unlocks: [game-design-finalize]
approval_record_path: .allforai/game-design/approval-records.json
exit_artifacts:
  - .allforai/game-design/ftue.html
  - .allforai/game-design/systems/ftue.json
review_checklist:
  - 新手引导流程完整，覆盖核心玩法的首次体验
  - 特性解锁教学节奏自然，不阻塞进度（跳过率目标 < 15%）
  - 摩擦点已识别并有设计对策
  - UI 流程与屏幕布局规格完整，符合 Cocos Creator 分辨率适配要求
  - 引导任务可量化（完成率、跳过率指标已定义）
---

# Goal

Execute ftue-design for this project.

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

- Read and follow `${CLAUDE_PLUGIN_ROOT}/skills/game-onboarding/10-design/first-session-experience-spec/SKILL.md`
- Read and follow `${CLAUDE_PLUGIN_ROOT}/skills/game-onboarding/20-spec/tutorial-step-spec/SKILL.md`
- Read and follow `${CLAUDE_PLUGIN_ROOT}/skills/game-onboarding/20-spec/feature-unlock-teaching-spec/SKILL.md`
- Read and follow `${CLAUDE_PLUGIN_ROOT}/skills/game-onboarding/40-qa/ftue-friction-qa/SKILL.md`
- Read and follow `${CLAUDE_PLUGIN_ROOT}/skills/game-ui/10-design/ui-flow-design/SKILL.md`
- Read and follow `${CLAUDE_PLUGIN_ROOT}/skills/game-ui/20-spec/screen-layout-spec/SKILL.md`

## Inputs

- `.allforai/concept-contract.json`
- `.allforai/product-concept/concept-baseline.json`
- `.allforai/game-design/systems/core-mechanics.json` — core loop reference
- Sub-skill SKILL.md files define their specific input contracts.

## Output Language

**所有输出内容（ftue.html 正文、ftue.json 所有字符串字段）必须使用中文（简体）**。
变量名/字段名保持英文，但描述性文本、说明、流程名称、台词、设计意图全部用中文书写。

## Key Design Decisions Already Made

- 从「点亮灯塔」目标出发，Ch1第1关为手势引导教学，教学终点为律抵达輝島的过场+灯塔第一眼
- 连连看核心机制（选-连-消，≤2转角）在前3关内完成教学，每关不超过3条新规则
- Combo计时器在第5关首次出现，附带一次可跳过的高亮提示
- 节奏连击的「快消维持combo」感受要在教学关卡里被主动触发一次（非靠玩家自发发现）
- 沙滩币续关功能在第10关（首章约1/3处）首次展示，不强制购买
- NPC首次对话顺序：Ch1第1关后→健三（码头老渔夫，简短暖场）；第3关后→ひなた首次出现（手账符号引发好奇）
- 引导结束定义：玩家自主完成一次完整消除+触发一次combo，不需要任何提示框
