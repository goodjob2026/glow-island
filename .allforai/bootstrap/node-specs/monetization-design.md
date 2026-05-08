---
node: monetization-design
discipline_owner: monetization-designer
human_gate: true
exit_artifacts:
  - .allforai/game-design/monetization.html
  - .allforai/game-design/systems/monetization-design.json
---

# Task: 商业化设计文档（HTML + JSON）

## Context Pull
- 读取 `.allforai/game-design/economy-model.json`（完整经济模型）
- 读取 `.allforai/product-concept/concept-baseline.json`

## Output

**monetization.html** — 包含：
1. 双货币系统（沙滩币 soft / 丹青石 hard）
2. IAP SKU 表（6个产品）
3. ARPU 目标与LTV模型
4. 无体力/无强制购买承诺
5. 章节材料消耗与收入预测

**systems/monetization-design.json** — 经济摘要（来自 economy-model.json）
