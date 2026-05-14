---
node_id: store-assets
capability: launch-prep
human_gate: false
hard_blocked_by: [launch-gap-analysis]
unlocks: [launch-checklist]
exit_artifacts:
  - path: .allforai/launch-prep/store-assets.json
---

# Task: App Store 上架素材准备

准备 Glow Island iOS App Store 上架所需的所有文字素材和资源清单，包括商店描述（中英双语）、关键词、截图规格指引，以及 IAP 定价配置。

## Project Context

- **App Name**: Glow Island（候选：Glow Island - Healing Puzzle）
- **Genre**: 治愈系休闲连连看
- **USP**: 无体力/无倒计时、岛屿修复元层叙事、治愈视觉
- **Target Audience**: iOS 25-40岁，都市休闲玩家
- **Monetization**: 消耗型 IAP（丹青石硬货币套餐）

## Context Pull

**必需（缺失则报错）：**
- 从 `.allforai/launch-prep/implementation-gaps.json` 读取 `pricing_decision.iap_tiers`（IAP 定价档位）、`launch_readiness.p0_blockers`（若有 P0 阻断则记录 warning 但继续生成文案）

**可选（缺失则 warning 后继续）：**
- `.allforai/launch-prep/competitive-research.json` — 读取 `synthesis.aso_keyword_candidates` 用于 ASO 关键词
- `.allforai/product-concept/product-concept.json` — 读取 `positioning`、`features` 用于描述文案

## Guidance

### 1. App 基本信息

根据 App Store Connect 填写要求准备以下字段：

| 字段 | 限制 | 建议内容 |
|------|------|---------|
| App Name | 30字符 | `Glow Island` |
| Subtitle | 30字符 | `治愈系连连看 · 点亮小岛` |
| Category | — | Games > Puzzle |
| Secondary Category | — | Games > Casual |
| Keywords | 100字符（逗号分隔，无空格） | 见 §3 |

### 2. 商店描述文案

**中文描述（4000字符以内）**

写作要点：
- 第一段：产品核心定位（治愈、无压力、岛屿修复）
- 第二段：核心玩法说明（连连看机制、光能系统）
- 第三段：特色功能亮点（无体力、特殊图块、6章叙事）
- 第四段：适合人群 + 品牌承诺

参考格式（在节点执行时基于 product-concept.json 的内容实际写出完整描述）：

```
🏝 连接图块，点亮沉睡的光辉岛

一片被遗忘的小岛，等待着你的光芒。

【轻松连连看，随心所欲玩】
无体力限制，无倒计时，失败随时重来。步数制关卡让你从容思考每一步连接。

【连接光块，积累光能】
...（基于实际 features 补充）

【6章叙事，一个有温度的小岛】
...

【你的治愈时光】
...
```

**英文描述（4000字符以内）**

写作要点同上，语言风格：warm, calming, no pressure。

### 3. ASO 关键词策略

目标关键词（从竞品研究的 aso_keyword_candidates 中挑选高价值词，共不超过 100字符）：

优先词（高搜索量 + 中低竞争）：
- `healing puzzle` / `relaxing match`
- `island restore` / `tile connect`
- `puzzle game no energy` / `calm puzzle`
- `match tiles` / `connect tiles`

中文区关键词（App Store 支持中文关键词）：
- `连连看` / `消除` / `治愈` / `休闲` / `小岛`

在 store-assets.json 中准备两套关键词：英语区 + 简体中文区（台湾区为繁体）

### 4. 截图规格清单

Apple 要求至少提交以下尺寸：

| 设备 | 尺寸（px） | 方向 | 最少张数 |
|------|-----------|------|---------|
| iPhone 6.7" (15 Pro Max) | 1290×2796 | 竖屏 | 4张 |
| iPhone 6.1" (15) | 1179×2556 | 竖屏 | 4张 |
| iPhone 5.5" (8 Plus) | 1242×2208 | 竖屏 | 4张（若未提供 6.1" 则必须） |

推荐内容（4张截图方案）：
1. 核心玩法截图 + 标语（"连接图块，积累光能"）
2. 岛屿修复对比（荒废 vs 修复后）+ 文案（"一步一步，唤醒小岛"）
3. 特殊图块展示 + 连击特效截图
4. 岛屿全景 + 品牌标语

检查现有截图或游戏素材：
```bash
find .allforai/ -name "*.png" -o -name "*.jpg" | grep -v "node_modules" | head -20
find game-client/ -name "*.png" | grep -i "screenshot\|preview\|promo" | head -10
```

记录哪些截图已有、哪些需要拍摄/设计。

### 5. IAP 产品配置

基于 `launch-gap-analysis` 的 `pricing_decision.iap_tiers` 写出 App Store Connect IAP 配置清单：

```json
{
  "iap_products": [
    {
      "product_id": "com.glowisland.coins.small",
      "type": "consumable",
      "reference_name": "小袋丹青石",
      "price_tier": "Tier 1",
      "price_usd": 0.99,
      "coins_granted": 50,
      "display_name_zh": "小袋丹青石 × 50",
      "display_name_en": "Small Pouch of Danqingshi × 50",
      "description_zh": "50颗丹青石，可用于续关或购买道具",
      "description_en": "50 Danqingshi crystals for continues and items"
    }
  ]
}
```

### 6. 生成 store-assets.json

```json
{
  "generated_at": "<ISO>",
  "app_name": "Glow Island",
  "bundle_id": "<从 game-client 配置读取>",
  "metadata": {
    "name": "Glow Island",
    "subtitle_zh": "治愈系连连看 · 点亮小岛",
    "subtitle_en": "Heal & Restore · Tile Connect Puzzle",
    "category": "Games > Puzzle",
    "keywords_en": "<100字符以内，逗号分隔>",
    "keywords_zh": "<100字符以内，逗号分隔>"
  },
  "descriptions": {
    "zh": "<完整中文描述，4000字符以内>",
    "en": "<完整英文描述，4000字符以内>"
  },
  "promotional_text": {
    "zh": "<170字符，用于 App Store 搜索结果展示>",
    "en": "<170字符>"
  },
  "screenshots": {
    "required_sizes": [
      {"device": "iPhone 6.7in", "resolution": "1290x2796", "count_required": 4, "status": "missing | available"},
      {"device": "iPhone 6.1in", "resolution": "1179x2556", "count_required": 4, "status": "missing | available"},
      {"device": "iPhone 5.5in", "resolution": "1242x2208", "count_required": 4, "status": "missing | available"}
    ],
    "existing_assets": [],
    "screenshot_plan": [
      "截图1: 核心玩法（连连看+光能效果）+ 文案标语",
      "截图2: 修复前后对比",
      "截图3: 特殊图块+连击特效",
      "截图4: 岛屿全景+NPC"
    ]
  },
  "iap_products": [],
  "support_url": "<需要配置：支持页面 URL>",
  "privacy_policy_url": "<需要配置：隐私政策 URL>",
  "marketing_url": "<可选>",
  "readiness": {
    "metadata_done": true,
    "descriptions_done": true,
    "screenshots_done": false,
    "iap_config_done": true,
    "support_url_done": false,
    "privacy_policy_done": false
  }
}
```

## Theory Anchors

- **ASO (App Store Optimization)**: 关键词需覆盖高搜索量词（连连看、消除、休闲）并包含产品独特词（治愈、小岛）
- **App Store 截图最佳实践**: 前两张最关键（搜索结果只显示1-2张），必须传达核心 USP

## Exit Artifacts

**`.allforai/launch-prep/store-assets.json`**
- `descriptions.zh` 和 `descriptions.en` 必须有完整文案（不得留 placeholder）
- `metadata.keywords_en` 和 `keywords_zh` 必须在字符限制内
- `iap_products` 必须包含从 launch-gap-analysis 读取的定价档位
- `readiness` 字段准确反映每项状态

## Downstream Contract

→ launch-checklist 读取: `readiness`（各素材就绪状态）、`screenshots.required_sizes[].status`（截图准备情况）、`iap_products`（IAP 配置）
