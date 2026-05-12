---
node: art-concept
human_gate: false
hard_blocked_by: [art-direction]
unlocks: [art-spec-design]
exit_artifacts:
  - .allforai/game-design/art-pipeline-config.json
---

# Task: 美术技术规格确认（Art Concept Skill Invocation）

## 执行方法

读取并执行 `${CLAUDE_PLUGIN_ROOT}/skills/art-concept.md` skill，完成交互式 Q&A 并产出 `art-pipeline-config.json`。

art-concept skill 完成后，依次调用以下 game-art 子 skill 细化策略（读取对应 SKILL.md 并执行）：

1. **动画生产计划：** `${CLAUDE_PLUGIN_ROOT}/skills/game-art/10-design/2d-animation-production-plan/SKILL.md`
   - 输入：参见 SKILL.md 的 Invocation Contract
   - 输出：动画方案选择（帧动画/DragonBones/Tween/混合）及降级路径

2. **动效设计**（当游戏有动效需求时，即 art-pipeline-config.json 中存在动画资产时）：`${CLAUDE_PLUGIN_ROOT}/skills/game-art/10-design/motion-design/SKILL.md`
   - 输入：`art-pipeline-config.json`、`art-style-guide.json.art_overview`
   - 输出：关键帧意图、Timing 规则、可读性规范

## 完成条件

`.allforai/game-design/art-pipeline-config.json` 存在且 `status == "final"`。
