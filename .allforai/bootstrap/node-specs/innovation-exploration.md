---
node: innovation-exploration
exit_artifacts:
  - .allforai/product-concept/innovation-opportunities.json
---

# Task: Glow Island 创新点探索与差异化定位

基于竞品分析确立3-5个核心差异化卖点，形成产品创新战略文档。

## Project Context

治愈系连连看，目标玩家倾向轻松解压体验，不喜欢紧张的PvP或P2W压力。

## Context Pull

**必需：**
- 从 `.allforai/product-concept/errc-matrix.json` 读取 `eliminate[]` 和 `create[]`，作为创新空间的起点
- 从 `.allforai/product-concept/competitor-analysis.json` 读取 `competitors[].user_review_pains`，找到用户未被满足的需求

## Theory Anchors

- **Blue Ocean Strategy**: 创新不是在红海竞争，而是创造新的价值空间
- **Jobs To Be Done**: 玩家"雇佣"这款游戏来完成什么情感任务？
- **Flow Theory (Csikszentmihalyi)**: 心流 = 挑战与技能的最优匹配区间

## Guidance

1. 从竞品痛点提炼「用户未被满足的需求」：
   - 竞品1星评价高频词中的情绪词（"强制"/"被迫"/"无聊"/"贵"）
   - 对应用户真实需求（想要放松但被系统强迫付钱）

2. 为Glow Island生成3-5个创新假设，每个包含：
   - **卖点描述**（一句话）
   - **解决的用户痛点**（来自竞品分析）
   - **实现方式**（游戏机制层面如何体现）
   - **风险**（可能导致什么问题）
   - **验证方式**（如何知道这个卖点成立）

3. 对每个创新点做简单可行性评估：
   - 技术可行（Cocos Creator 3.x能实现吗）
   - 设计可行（不会破坏核心连连看手感吗）
   - 商业可行（不会影响IAP营收吗）

## Exit Artifacts

**innovation-opportunities.json**：
```json
{
  "analyzed_at": "ISO timestamp",
  "core_insight": "用户想要治愈放松，但市面产品都在施加压力",
  "opportunities": [
    {
      "id": "IO-001",
      "title": "无倒计时的自由节奏",
      "pain_solved": "竞品强制倒计时导致焦虑，与治愈定位矛盾",
      "mechanic": "默认无时间限制；连击奖励来自快速主动选择，而非倒计时压迫",
      "risk": "可能降低紧张感，影响付费动机",
      "validation": "A/B测试7日留存：无计时vs有计时",
      "feasibility": "high"
    }
  ],
  "selected_differentiators": ["IO-001", "IO-002", "IO-003"]
}
```

## Downstream Contract

→ `game-design-concept` 读取：`selected_differentiators[]` 作为GDD核心特性的依据
