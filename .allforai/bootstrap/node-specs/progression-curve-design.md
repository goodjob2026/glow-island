---
node: progression-curve-design
discipline_owner: numeric-designer
human_gate: true
exit_artifacts:
  - .allforai/game-design/progression-curve.html
  - .allforai/game-design/systems/progression-curve.json
---

# Task: 数值进度曲线文档（HTML + JSON）

## Context Pull
- 读取 `.allforai/game-design/progression-curve.json`（v2.0）
- 读取 `.allforai/game-design/economy-model.json`（材料配方）
- 读取 `.allforai/game-design/level-design.json`（关卡分布）

## Output

**progression-curve.html** — 包含：
1. 6章节关卡数量与网格尺寸进度
2. 材料收集速率曲线（每章预估时间）
3. 难度曲线（3:1呼吸节奏）
4. 章节解锁材料阈值
5. 沙滩币收入预测

**systems/progression-curve.json** — 数值摘要
