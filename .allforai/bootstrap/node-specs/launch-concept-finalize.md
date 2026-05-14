---
node: launch-concept-finalize
node_id: launch-concept-finalize
exit_artifacts:
  - .allforai/launch-prep/launch-concept-finalize.json
  - .allforai/launch-prep/launch-concept-finalize.md
---

# Task: 上架概念定稿（Glow Island iOS 发布方案）

## Project Context

- 游戏：Glow Island — 治愈系连连看，iOS + WebGL
- 上轮完成：concept-acceptance: passed，基础功能全部实现
- 输入：`competitive-research.json`（竞品定价/关键词/差距分析）

## Context Pull

**必需（缺失则报错返回）：**
- 读取 `.allforai/launch-prep/competitive-research.json` → `market_insights` 字段，
  用于定价决策和关键词选择的数据依据

**可选（缺失则输出 warning 后继续）：**
- 读取 `.allforai/product-concept/product-concept.json` → `positioning` 字段，
  作为上架定位的起点
- 读取 `.allforai/game-design/game-design-doc.json` → `product_summary`，
  用于撰写 App Store 描述

## Guidance

### 1. IAP 定价定稿

基于 `competitive-research.json.pricing_recommendation` 和竞品数据：
- 确认沙滩币 4 个价格档位（以 Apple Tier 为准，覆盖 USD / CNY / JPY）
- 确认每档对应的沙滩币数量（确保续关性价比清晰）
- 决策说明：为什么这个价格对玩家有吸引力？

### 2. App Store 元数据

**应用名称**（30 字符内）：
- 主名称（中文）：光辉岛 / Glow Island
- 副标题（30 字符内）：治愈系连连看 / Healing Tile Connect

**关键词**（100 字符，逗号分隔，不含空格，英文）：
- 从 `keyword_opportunities` 中选取高搜索量、低竞争度的组合
- 避免重复已在 title/subtitle 中的词

**应用描述**（4000 字符内，英文 + 中文）：
- 第一段：核心玩法一句话钩子
- 第二段：特色功能列表（5条）
- 第三段：目标受众 & 情感诉求
- 不得包含竞品名称
- 不得过度承诺未实现的功能

**分类**：Games > Puzzle（Primary）

### 3. 截图方案

规划 6.7英寸（iPhone 15 Pro Max）截图方案（5-10张）：
- 截图1：核心玩法瞬间（连线 + Combo 特效）
- 截图2：岛屿修复前后对比（Meta Loop 卖点）
- 截图3：NPC 叙事对话场景
- 截图4：特殊图块效果展示
- 截图5：沙滩环境美术全景

（注：截图文字叠加层文案需给出，实际截图在 launch-gap-implementation 中制作）

### 4. 年龄分级建议

- 基于无暴力、无社交、无成人内容 → 建议申报 4+
- 如含 In-App Purchases → 必须勾选「Frequent/Intense」下的 IAP 选项

## Exit Artifacts

### `.allforai/launch-prep/launch-concept-finalize.json`

```json
{
  "schema_version": "1.0",
  "finalized_at": "<ISO>",
  "iap_tiers": [
    {"tier_id": "com.glowisland.coins_small", "coins": 50, "price_usd": 0.99, "apple_tier": "Tier 1"},
    {"tier_id": "com.glowisland.coins_medium", "coins": 150, "price_usd": 2.99, "apple_tier": "Tier 3"},
    {"tier_id": "com.glowisland.coins_large", "coins": 350, "price_usd": 4.99, "apple_tier": "Tier 5"},
    {"tier_id": "com.glowisland.coins_xl", "coins": 800, "price_usd": 9.99, "apple_tier": "Tier 10"}
  ],
  "app_store_metadata": {
    "app_name_zh": "光辉岛",
    "app_name_en": "Glow Island",
    "subtitle_zh": "治愈系连连看",
    "subtitle_en": "Healing Tile Connect",
    "keywords_en": "<comma-separated 100-char keywords>",
    "primary_category": "Games",
    "secondary_category": "Puzzle",
    "description_en": "<full English description>",
    "description_zh": "<full Chinese description>",
    "age_rating": "4+",
    "contains_iap": true
  },
  "screenshot_plan": [
    {"order": 1, "scene": "core-loop-combo", "headline_en": "Connect tiles, feel the rhythm", "headline_zh": "连接图块，感受节奏"},
    {"order": 2, "scene": "island-restoration", "headline_en": "Restore the glowing island", "headline_zh": "唤醒光辉岛"},
    {"order": 3, "scene": "npc-dialogue", "headline_en": "Meet warm island residents", "headline_zh": "遇见温暖的岛屿居民"},
    {"order": 4, "scene": "special-tiles", "headline_en": "5 tactical special tiles", "headline_zh": "5种战术特殊图块"},
    {"order": 5, "scene": "island-overview", "headline_en": "Your peaceful escape", "headline_zh": "你的治愈角落"}
  ],
  "positioning_statement": "<一句话定位声明，中文>",
  "gap_warnings_inherited": ["<从 competitive-research.json 继承的 P0/P1 差距>"]
}
```

### `.allforai/launch-prep/launch-concept-finalize.md`

人类可读的上架方案摘要，包含：IAP 定价决策说明、关键词策略、描述文案草稿、截图规划。

## Downstream Contract

→ `launch-gap-implementation` 读取：`gap_warnings_inherited[]` — 决定差距补齐范围
→ `compliance-check` 读取：`contains_iap`、`age_rating` — 合规检查输入
→ `launch-checklist` 读取：`app_store_metadata` — 最终清单素材
