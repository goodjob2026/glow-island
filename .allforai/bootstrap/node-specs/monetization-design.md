---
node: monetization-design
capability: game-design
discipline_owner: monetization-designer
human_gate: true
approval_record_path: .allforai/game-design/approval-records.json
exit_artifacts:
  - .allforai/game-design/monetization.html
  - .allforai/game-design/systems/monetization-design.json
review_checklist:
  - 单货币模型（沙滩币）设计完整，无双货币遗留
  - 步数续关的定价曲线合理（单次价格/折扣包/月卡可选）
  - 续关触发时机UX不侵入（步数耗尽后弹出，不主动推送）
  - 无体力机制得到正确实现（不因付费限制游玩时长）
  - IAP产品线SKU简洁（避免选择困难，3-5个档位即可）
---

# Goal

Design the monetization model for Glow Island: single-currency IAP with steps-continuation as the only paywall.

> **Non-interactive execution.** All design decisions are recorded in `.allforai/`.

> **Output language (mandatory):** All HTML navigation tabs, section headings, labels, captions,
> and descriptive text MUST be in Chinese (zh-CN). In-game proper nouns (place/character/item names)
> keep the game world's native language (Japanese). JSON field keys stay English snake_case.

> Do NOT use AskUserQuestion or request user input.

## Inputs

- `.allforai/product-concept/concept-baseline.json` — monetization (model, currency, notes), errc_highlights
- `.allforai/game-design/systems/core-mechanics.json` — core_loop.steps_system

## Sub-Skill Invocation

Read and follow:

1. **Economy Spec:** Read and follow `${CLAUDE_PLUGIN_ROOT}/skills/game-design/20-spec/economy-spec/SKILL.md`

## Key Design Decisions Already Made

- **货币:** 单一沙滩币，只能IAP购买
- **唯一付费点:** 步数耗尽后购买额外步数续关（天天爱消除主要变现点）
- **不卖:** 道具、外观、章节解锁
- **无体力:** 玩家随时可以开始新关卡，不受付费限制
- **IAP产品线:** 沙滩币礼包（小/中/大），可考虑月卡（每日固定沙滩币）
- **反侵入原则:** 不主动弹出购买提示，只在自然失败时展示续关选项
- **定价参考:** 参考天天爱消除/Candy Crush续关成本，本地化定价
