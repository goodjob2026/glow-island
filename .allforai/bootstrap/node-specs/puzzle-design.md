---
node: puzzle-design
discipline_owner: level-designer
human_gate: true
exit_artifacts:
  - .allforai/game-design/puzzle-design.html
  - .allforai/game-design/systems/puzzle-design.json
---

# Task: 谜题机制设计文档（HTML + JSON）

## Context Pull
- 读取 `.allforai/game-design/puzzle-mechanics-spec.json`（v2.0，含分章解锁）
- 读取 `.allforai/game-design/level-design.json`（前10关验证教学设计）

## Output

**puzzle-design.html** — 包含：
1. 连连看路径规则（BFS ≤2转弯）
2. 20种图块类型表（T01-T20，日式自然主题）
3. 4种特殊块机制（炸弹/十字行消/自动连/重排）
4. 章节障碍解锁表（冰封→锁链+传送门→单路径→重力→扩散）
5. 连击系统（2000ms窗口，×1.0/1.5/2.0/3.0）
6. 天天爱消除爽快感设计原则

**systems/puzzle-design.json** — 机制规格摘要
