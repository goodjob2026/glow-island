---
node: environment-art-gen
discipline_owner: environment-artist
discipline_reviewers: [art-director]
human_gate: true
blocked_by: [art-spec-design]
unlocks: [art-qa]
exit_artifacts:
  - game-client/assets/resources/sprites/backgrounds/ch01_harbor_after.png
  - game-client/assets/resources/sprites/island/island_base.png
---

# Task: 场景美术生成（Environment Art Generation）

## Context Pull
- 读取 `art-asset-inventory.json` — category=background + island_zone 条目
- 读取 `systems/meta-game.json` — 岛屿区域描述、修复前/后情感弧线
- 读取 `art-direction-v2.html` — 章节环境美术方案

## 样本策略（Sample Strategy）

**分两个子任务：章节背景（Backgrounds）和岛屿地图（Island Zones）。**

### 背景（Backgrounds）— 必须生成
- 第 1 章 harbor **before + after** × 2（验证修复前灰暗 → 修复后温暖的色彩转变）
- 第 6 章 lighthouse **after** × 1（验证最终章氛围）

共 **3 张**，验证修复弧线和章节差异。

### 背景（Backgrounds）— 可选生成（审批后）
- 第 2–5 章各 before + after（+8）
- 特殊变体（sunset、overview）

### 岛屿地图（Island Zones）— 必须生成
- **island_base.png** 全岛总览 × 1
- 任意 1 个区域的 **s1（desolate）+ s4（radiant）** × 2（验证恢复弧线两端）

共 **3 张**（base + 2 zone states）

### 岛屿地图 — 可选生成（审批后）
- 剩余 5 个区域的 s0–s4（+25，但 s0 fog 可程序化，优先生成 s1/s4）

## Prompt 构造规则

**背景：**
```
final_prompt = style_prompt_prefix + ", " + chapter.environment_description
             + ", " + state_suffix[state] + ", 9:16 portrait, cinematic"

state_suffix:
  before → "desolate abandoned grey atmosphere, no color, neglected"
  after  → "vibrant restored warm colors, golden light, flourishing"
```

**岛屿区域：**
```
final_prompt = style_prompt_prefix + ", top-down view, " + zone.description
             + ", " + restoration_state[s_index] + ", square tile, mobile game map"

restoration_state: s0=fog, s1=desolate, s2=stirring, s3=blooming, s4=radiant
```

## 工具优先级
- 背景：`generate_image` (Imagen 4, 9:16) → `flux_generate_image` (portrait_16_9)
- 岛屿：`generate_image` (1:1) → `flux_generate_image` (square)

## 状态回写
更新 art-asset-inventory.json 中 background + island_zone 条目。
island_zone 条目的 `ai_generated.all_states` 字段记录已生成的状态列表。

## HTML 输出
`environment-art-review.html` — before/after 对比展示 + 岛屿地图状态矩阵
