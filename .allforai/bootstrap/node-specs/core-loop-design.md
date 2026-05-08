---
node: core-loop-design
discipline_owner: lead-designer
human_gate: true
exit_artifacts:
  - .allforai/game-design/core-loop.html
  - .allforai/game-design/systems/core-mechanics.json
---

# Task: 核心循环设计文档（HTML + JSON）

读取现有 GDD 内容，生成符合 game-design capability 格式的 HTML 设计文档和紧凑 JSON。

## Context Pull
- 读取 `.allforai/game-design/game-design-document.md`（主策划文档 v2.1）
- 读取 `.allforai/product-concept/concept-baseline.json`（设计基线）
- 读取 `.allforai/game-design/puzzle-mechanics-spec.json`（机制规格）

## Output

**core-loop.html** — 深色主题 HTML，章节包含：
1. 核心循环图（文字描述：单局30s-3min → 材料奖励 → 岛屿修复 → 章节解锁）
2. 元循环（岛屿地图 → 章节目标 → 关卡 → 材料 → 修复）
3. 步数制设计原则（无倒计时、无体力）
4. 连击系统（天天爱消除爽快感）
5. 特殊块（炸弹/行消/自动连/重排）
6. 章节机制解锁进度表（Ch1-Ch6）

**systems/core-mechanics.json** — 紧凑摘要：
```json
{
  "core_loop": { "session_duration": "30s-3min", "currency": "steps" },
  "meta_loop": { "layers": ["puzzle", "material", "restoration", "narrative"] },
  "special_blocks": [...],
  "chapter_mechanics": {...}
}
```

## Human Gate
执行完成后将 approval-records.json 中 core-loop-design 的 gate_status 更新为 "in-review"（已是 in-review，保持）。
