---
node: progression-curve-design
capability: game-design
discipline_owner: numeric-designer
human_gate: true
approval_record_path: .allforai/game-design/approval-records.json
exit_artifacts:
  - .allforai/game-design/progression-curve.html
  - .allforai/game-design/systems/progression-curve.json
review_checklist:
  - combo倍率曲线定义完整（初始值/每击递增/上限/重置规则）
  - 步数初始值曲线合理（前3关步数充裕，中期逐渐收紧，章末挑战关偏紧）
  - 视觉进度触发N值已确定（每N关触发一次岛屿小变化，建议5-10）
  - 每日签到奖励量不影响付费平衡（沙滩币赠送上限合理）
  - 续关成本曲线参考天天爱消除/Candy Crush定价，本地化适配
---

# Goal

Design numerical progression curves for Glow Island: combo multiplier curve, step count curve across 180 levels, and visual progress trigger thresholds.

> **Non-interactive execution.** All design decisions are recorded in `.allforai/`.

> **Output language (mandatory):** All HTML navigation tabs, section headings, labels, captions,
> and descriptive text MUST be in Chinese (zh-CN). In-game proper nouns (place/character/item names)
> keep the game world's native language (Japanese). JSON field keys stay English snake_case.

> Do NOT use AskUserQuestion or request user input.

## Inputs

- `.allforai/product-concept/concept-baseline.json` — gameplay_feel, differentiation_strategy (combo_system), session_design
- `.allforai/game-design/systems/core-mechanics.json` — combo_system, steps_system, special_blocks
- `.allforai/game-design/systems/monetization-design.json` — currency balance, continuation cost
- `.allforai/game-design/systems/retention-hook.json` — daily sign-in reward amounts, visual trigger cadence

## Sub-Skill Invocation

Read and follow:

1. **Progression Spec:** Read and follow `${CLAUDE_PLUGIN_ROOT}/skills/game-systems/20-spec/progression-spec/SKILL.md`

## Key Design Decisions Already Made

- **Combo倍率设计原则:** 爽快感优先——combo要让玩家感受到明显的分数飙升；初始倍率1x，连击3次后开始显著递增
- **连击计时器宽松度:** 前3关计时器宽松（保障新手combo体验）；中期收紧；特殊道具可延长计时器
- **步数曲线:** 前3关步数充裕（保护新手）；Ch1平均步数约30-40；随章节逐步收紧但不应让玩家频繁失败
- **通关率目标:** 约70%玩家首次通关每关（10-20%需要2次，5-10%需要续关）
- **视觉进度N值:** 待本节点确定（参考范围5-10关/次小变化，30关/次大变化）
- **每日签到奖励:** 沙滩币小额赠送（不破坏付费平衡，但足够吸引每日登录）
- **续关成本参考:** 天天爱消除/Candy Crush续关成本，本地化定价（中国市场价格敏感）
