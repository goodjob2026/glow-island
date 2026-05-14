---
node_id: competitive-research
capability: launch-prep
human_gate: false
hard_blocked_by: []
unlocks: [launch-gap-analysis]
exit_artifacts:
  - path: .allforai/launch-prep/competitive-research.json
---

# Task: 竞品调研 — 治愈系连连看 iOS App Store 竞品分析

为 Glow Island 的 iOS 上架定价和定位决策提供竞品情报基础。

## Project Context

- **Product**: Glow Island — 治愈系连连看手游（Healing Casual Tile-Connect）
- **Platform**: iOS App Store（主要）+ WebGL（次要）
- **Monetization**: 双货币（沙滩币软货币 + 丹青石硬货币），IAP 购买丹青石，无能量/无订阅
- **Tech**: Cocos Creator 3.x 客户端 + Fastify/Prisma/PostgreSQL 后端
- **Genre**: 治愈系休闲（Healing Casual），核心玩法连连看（Tile-Connect），元层玩法岛屿修复

## Guidance

### 1. 确定竞品范围

直接竞品（相同品类）：
- **Tile-connect / 连连看类**: Tile Busters, Onet Puzzle, Tile Connect, Mahjong-style apps
- **Match-3 + Meta-loop**: Gardenscapes, Homescapes, Merge Dragons!, Fishdom, Project Makeover
- **治愈系休闲**: Disney Dreamlight Valley（轻量版）, Stardew Valley Mobile（氛围参考）

对每个竞品搜索：
- `"[game name]" iOS App Store pricing 2025`
- `"[game name]" review "healing" OR "relaxing" OR "no energy"`
- `"[game name]" monetization model`

### 2. 提取定价情报

对每个竞品记录：
- **商业模式**: 免费/付费/混合
- **IAP 价格点**: 最低/中间/最高档（USD 标准 Tier，例如 $0.99 / $4.99 / $9.99）
- **有无能量系统**: 是否有体力限制
- **订阅**: 是否有月订阅或 VIP
- **付费触点**: 续关、道具包、皮肤、无限制

### 3. 提取定位情报

对每个竞品记录：
- App Store 副标题（30字符以内）
- 描述中的核心 USP 关键词
- 评论高频好评词（用于 ASO 关键词提取）
- 评论高频差评词（差异化机会）

### 4. 合成竞品定位图谱

分析维度：
- **压力轴**: 高压力（有能量/计时）↔ 低压力（无限制）
- **叙事轴**: 无叙事（纯消除）↔ 强叙事（情感线/修复进度）
- Glow Island 应定位在哪个象限？

### 5. 写竞品报告

生成 `.allforai/launch-prep/competitive-research.json`，字段如下：

```json
{
  "generated_at": "<ISO timestamp>",
  "target_product": "Glow Island",
  "target_platform": "iOS App Store",
  "competitors": [
    {
      "name": "<app name>",
      "genre": "<genre>",
      "business_model": "freemium | paid | subscription",
      "iap_price_points_usd": [0.99, 4.99, 9.99],
      "has_energy_system": true,
      "has_subscription": false,
      "paid_touchpoints": ["continue", "booster_pack"],
      "app_store_subtitle": "<subtitle>",
      "usp_keywords": ["healing", "relaxing"],
      "positive_review_themes": ["beautiful art", "no pressure"],
      "negative_review_themes": ["pay to continue", "too easy"],
      "positioning_notes": "<synthesis>"
    }
  ],
  "synthesis": {
    "glow_island_position": "<narrative positioning statement>",
    "price_recommendation": {
      "model": "freemium",
      "iap_tiers_usd": [0.99, 2.99, 9.99],
      "rationale": "<research-based rationale>"
    },
    "differentiation": ["no energy system", "narrative-driven meta loop", "dual currency non-P2W"],
    "aso_keyword_candidates": ["healing puzzle", "relaxing match", "island restore"]
  }
}
```

## Theory Anchors

- **竞品情报 → 定价锚点**: 价格区间应与竞品中位数对齐，若有明确差异化（无能量）可设略高定价
- **ERRC 框架**: 消除（体力系统）、降低（付费压力）、提升（叙事体验）、创造（岛屿修复元层）

## Knowledge References

**§D User Confirmation Gate** (cross-phase-protocols): 本节点仅产出研究数据，不做决策。定价决策在 launch-gap-analysis 节点经用户确认后写入。

**Brave Search 降级链**: 若 `mcp__plugin_meta-skill_ai-gateway__brave_web_search` 可用，优先使用；否则使用内置 WebSearch 工具。每次搜索加 "2025" 确保结果时效性。

## Exit Artifacts

**`.allforai/launch-prep/competitive-research.json`**
- 包含 5-8 个竞品的完整情报
- synthesis 部分必须有 `price_recommendation`（含 USD 价格和 rationale）
- `aso_keyword_candidates` 至少 10 个候选词

## Downstream Contract

→ launch-gap-analysis 读取: `synthesis.price_recommendation`（定价建议）、`synthesis.differentiation`（差异化定位）、`synthesis.aso_keyword_candidates`（ASO 候选词）
