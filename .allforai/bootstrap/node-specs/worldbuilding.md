---
node: worldbuilding
exit_artifacts:
  - .allforai/game-design/worldbuilding-bible.md
  - .allforai/game-design/chapter-emotional-arcs.json
---

# Task: Glow Island 世界观构建

设计岛屿的背景故事、6章节情绪弧线、关键NPC设定、环境叙事细节。

## Project Context

小岛失去生机 → 玩家通过连连看修复 → 岛屿逐渐亮起来。6章节：海边码头→中央小镇→花田→森林→温泉山谷→灯塔夜晚。

## Theory Anchors

- **Hero's Journey (Campbell)**: 普通世界→召唤→试炼→回归，用于章节叙事弧线
- **Environmental Storytelling**: 不靠对话，通过场景变化传递故事
- **Emotional Arc Design**: 每章节有独立的情绪基调，整体构成从孤寂→温暖的旅程

## Guidance

1. **背景故事**（100字以内，点到即止）：
   - 为什么小岛失去生机？（建议：自然原因，非战争/灾难，保持治愈基调）
   - 玩家扮演谁？（建议：旅行者/访客，不是英雄，降低叙事压力）
   - 恢复小岛的动机是什么？（建议：因为美，因为想看见它亮起来）

2. **6章节情绪弧线**，每章包含：
   - 区域名称和视觉主题
   - 情绪基调（1-2个形容词）
   - 恢复前状态（黑白/灰暗的描述）
   - 恢复后变化（分4个阶段的视觉变化）
   - 关键NPC（如有）
   - 标志性的叙事时刻（玩家会记住的画面）

3. **NPC设定**（每个1-2句话，够用即止）：
   - 灯塔守护者（老人，最终章出现，见证者）
   - 渔夫（第1章，码头，教程引导者）
   - 花农（第3章，花田，治愈感代言人）
   - 温泉老人（第5章，放松感体现）

4. **环境叙事元素清单**：
   - 每章恢复后独特出现的场景细节（小船回来/灯亮/花开/动物出现）
   - 这些细节的出现顺序（与AreaRestorationEffect的4阶段对应）

## Exit Artifacts

**worldbuilding-bible.md** — Markdown叙事文档（世界观圣经）

**chapter-emotional-arcs.json**：
```json
{
  "chapters": [
    {
      "id": 1,
      "name": "海边码头",
      "emotion": "悠闲",
      "color_mood": "淡蓝+米白",
      "npc": "渔夫·阿海",
      "before_state": "锈迹斑斑的码头，没有渔船停靠",
      "restore_stages": [
        "第1阶段: 码头木板修复，颜色恢复",
        "第2阶段: 海鸥重新出现",
        "第3阶段: 第一艘小船回来停靠",
        "第4阶段: 阿海出现，点起码头的灯笼"
      ],
      "signature_moment": "第一艘小船回来的那一刻"
    }
  ]
}
```

## Downstream Contract

→ `game-design-concept` 读取：`chapters[]` 全部字段，作为GDD章节卡片的叙事基础
→ `art-concept` 读取：`chapters[].color_mood` 和 `restore_stages`，指导各章节色板和动画设计
→ `level-design` 读取：`chapters[].emotion` 和 `restore_stages`，指导关卡情绪节奏设计
→ `original-art` 读取：`chapters[].npc` 和 `restore_stages`，确定需要绘制的NPC和场景资产清单
