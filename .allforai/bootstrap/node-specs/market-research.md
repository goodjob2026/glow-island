---
node: market-research
exit_artifacts:
  - .allforai/product-concept/competitor-analysis.json
  - .allforai/product-concept/errc-matrix.json
---

# Task: 休闲消除类竞品调研 + ERRC定位矩阵

分析4款核心竞品，输出竞品分析和ERRC矩阵，确立Glow Island的差异化定位。

## Project Context

项目：glow-island，治愈系连连看手游，Cocos Creator + Fastify，iOS+WebGL，IAP+云存档+排行榜。

## Theory Anchors

- **Blue Ocean ERRC**: Eliminate（消除）/ Reduce（减少）/ Raise（提升）/ Create（创造）vs竞品
- **Porter's Five Forces**: 分析品类竞争烈度和进入壁垒
- **Kano Model**: Must-be / One-dimensional / Attractive 功能分类

## Guidance

1. WebSearch查询以下竞品：Gardenscapes、Township、Fishdom、Candy Crush Saga
   - 各竞品的核心玩法差异、商业化策略、用户评价（App Store/Google Play）
   - 各竞品的留存/付费数据（公开的）
   - 用户1星/5星评价的高频词

2. 按以下维度建立竞品对比表：
   - 核心玩法（消除机制类型）
   - 元循环设计（局外成长）
   - 压力机制（倒计时/体力/步数限制）
   - 商业化模式（广告/IAP/Battle Pass）
   - 情感定位（治愈/竞技/社交）
   - 玩家评价痛点

3. 输出ERRC矩阵：Glow Island相对于竞品应当：
   - Eliminate: 哪些竞品标配但Glow Island不需要的（如倒计时压力、能量/体力系统）
   - Reduce: 哪些应该弱化（如复杂的公会社交、PvP排名压力）
   - Raise: 哪些应该强化（如视觉美感、音效治愈感、叙事沉浸感）
   - Create: 哪些是竞品没有但Glow Island独有的（如岛屿渐进式视觉恢复作为核心奖励）

## Exit Artifacts

**competitor-analysis.json** — 竞品分析：
```json
{
  "analyzed_at": "ISO timestamp",
  "competitors": [
    {
      "name": "竞品名称",
      "genre": "match-3 / builder / puzzle",
      "core_mechanic": "核心玩法描述",
      "meta_loop": "元循环描述",
      "stress_mechanisms": ["倒计时", "体力值"],
      "monetization": ["IAP", "广告"],
      "emotional_positioning": "竞技/治愈/社交",
      "user_review_pains": ["高频痛点1", "高频痛点2"],
      "strengths": ["优势1"],
      "weaknesses": ["劣势1"],
      "estimated_revenue_tier": "top / mid / low"
    }
  ]
}
```

**errc-matrix.json** — ERRC矩阵：
```json
{
  "eliminate": [{"item": "倒计时压力", "rationale": "治愈定位与紧迫感不兼容"}],
  "reduce": [{"item": "复杂社交系统", "rationale": "单人沉浸体验优先"}],
  "raise": [{"item": "视觉美感奖励", "rationale": "岛屿恢复是核心情感钩子"}],
  "create": [{"item": "渐进式岛屿恢复叙事", "rationale": "竞品无，差异化强"}]
}
```

## Downstream Contract

→ `innovation-exploration` 读取：`errc-matrix.json` 全部字段，作为创新卖点的基础
→ `game-design-concept` 读取：`competitor-analysis.json` 竞品定位区间，指导GDD定位策略
