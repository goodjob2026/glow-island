---
node: competitive-research
node_id: competitive-research
exit_artifacts:
  - .allforai/launch-prep/competitive-research.json
---

# Task: App Store 竞品调研（Glow Island 上架定位分析）

## Project Context

- 游戏：Glow Island — 治愈系连连看（Onet/Tile-Connect），iOS + WebGL
- 核心特征：无体力、无倒计时、单货币（沙滩币），步数续关是唯一付费点，6章叙事+岛屿修复Meta
- 目标受众：25-40岁都市休闲玩家，偏好低压力、精美视觉、有温度的故事
- 技术栈：Cocos Creator 3.x（游戏端）+ Fastify + PostgreSQL（后端）
- 目标平台：iOS App Store（主），WebGL（次）

## Guidance

### 调研对象

搜索以下品类竞品（WebSearch 驱动，关注 2024-2025 App Store 数据）：

**直接竞品（连连看/Tile-Connect）**：
- Mahjong Connect
- Onet Connect Classic
- Shanghai Mahjong
- Tile Match

**邻近竞品（治愈休闲）**：
- Zen Match
- Unpuzzle (Relax Puzzle)
- Lily's Garden
- June's Journey
- Merge Mansion

**同类优质休闲**：
- Wordle (NYT)
- Flow Free
- Stardew Valley（参考叙事深度定价）

### 调研维度（每个竞品）

1. **定价模式**：免费下载 + IAP / Freemium / 买断制
2. **IAP 价格点**：最低档 / 中档 / 高档（对应沙滩币包大小参考）
3. **App Store 分类**：Games > Puzzle / Casual
4. **关键词**：App Store 标题/副标题/关键词字段（通过截图或 ASO 分析）
5. **评分 & 评分量**：平均分 / 总评分数
6. **用户评价高频词**：好评关键词 / 差评关键词
7. **截图风格**：视觉风格、卖点展示方式

### 分析输出

1. **价格区间基准**：同类 IAP 的市场定价范围（USD/CNY）
2. **关键词机会**：未被头部竞品占领、与 Glow Island 定位匹配的关键词
3. **差异化优势**：Glow Island 比竞品明显更好的 2-3 个维度
4. **差距警示**：竞品有而 Glow Island 缺失的 P0/P1 功能或体验
5. **定价建议**：基于竞品数据的沙滩币定价方案建议（3-4 个价格点）

> **规则：不得在无竞品数据支撑的情况下直接给出定价建议。**
> 必须先完成调研，再基于数据给出建议。

## Exit Artifacts

### `.allforai/launch-prep/competitive-research.json`

```json
{
  "schema_version": "1.0",
  "researched_at": "<ISO>",
  "target_platforms": ["iOS App Store"],
  "competitors": [
    {
      "name": "<竞品名>",
      "category": "direct | adjacent | reference",
      "pricing_model": "free+iap | freemium | premium",
      "iap_price_points_usd": [0.99, 2.99, 4.99],
      "app_store_category": "Games > Puzzle",
      "rating": 4.5,
      "rating_count": 12000,
      "top_positive_keywords": ["relaxing", "satisfying", "addictive"],
      "top_negative_keywords": ["ads", "paywall", "too easy"],
      "screenshot_style": "gameplay-focused | lifestyle | ui-showcase"
    }
  ],
  "market_insights": {
    "iap_price_range_usd": {"min": 0.99, "median": 2.99, "max": 9.99},
    "keyword_opportunities": ["healing puzzle", "cozy tile game", "island restore"],
    "differentiation_strengths": ["<Glow Island 相比竞品的优势>"],
    "gap_warnings": [
      {"gap": "<缺失功能>", "priority": "P0 | P1 | P2", "competitor_example": "<竞品名>"}
    ]
  },
  "pricing_recommendation": {
    "currency": "USD",
    "tiers": [
      {"coins": 50, "price_usd": 0.99, "label": "小包"},
      {"coins": 150, "price_usd": 2.99, "label": "中包"},
      {"coins": 350, "price_usd": 4.99, "label": "大包"},
      {"coins": 800, "price_usd": 9.99, "label": "超值包"}
    ],
    "rationale": "<基于竞品数据的定价逻辑>"
  }
}
```

## Downstream Contract

→ `launch-concept-finalize` 读取：
- `competitors[]` — 竞品画像，用于定位决策
- `market_insights.pricing_recommendation` — IAP 定价基准
- `market_insights.keyword_opportunities` — ASO 关键词候选
- `market_insights.gap_warnings[]` — P0/P1 差距，影响 launch-gap-implementation 范围
