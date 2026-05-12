---
node: meta-game-design
capability: game-design
discipline_owner: systems-designer
human_gate: true
approval_record_path: .allforai/game-design/approval-records.json
exit_artifacts:
  - .allforai/game-design/meta-game.html
  - .allforai/game-design/systems/meta-game.json
review_checklist:
  - 岛屿地图视觉变化节点与关卡通关进度精确对齐（每N关一次，N由progression-curve-design确定）
  - 6章节各自的岛屿视觉阶段描述清晰（前/中/后期视觉状态）
  - 章末必有明显视觉大变化（情感高潮锚点）
  - 日记碎片解锁触发机制与关卡节点对应关系已定义
  - 好友进度展示（Phase 2）所需的数据结构字段已在JSON中预留
---

# Goal

Design the meta-game layer for Glow Island: the island map as a living visual progression system, diary fragment narrative unlock triggers, and friend progress data schema.

> **Non-interactive execution.** All design decisions are recorded in `.allforai/`.
> Do NOT use AskUserQuestion or request user input.

> **Output language (mandatory):** All HTML navigation tabs, section headings, labels, captions,
> and descriptive text MUST be in Chinese (zh-CN). In-game proper nouns (place/character/item names)
> keep the game world's native language (Japanese). JSON field keys stay English snake_case.

## Inputs

- `.allforai/product-concept/concept-baseline.json` — retention_hooks, narrative_progression, session_design, character_bonds
- `.allforai/game-design/systems/worldbuilding.json` — chapters[], island visual stages
- `.allforai/game-design/systems/core-mechanics.json` — chapter structure, level count
- `.allforai/game-design/systems/retention-hook.json` — hook trigger cadences

## Sub-Skill Invocation

Read and follow:

1. **Meta-Game Spec:** Read and follow `${CLAUDE_PLUGIN_ROOT}/skills/game-design/20-spec/meta-game-spec/SKILL.md`

## Key Design Decisions Already Made

- **元游戏层就是岛屿地图:** 没有独立的技能树或元进度系统；岛屿本身就是视觉化的元进度展示
- **章节触发视觉大变化:** 每章（30关）完成后岛屿场景发生一次大变化（灯塔亮度提升/新区域解锁）
- **章内小变化:** 每N关触发一次明显但较小的岛屿视觉变化（N值由progression-curve-design节点确定，参考5-10关）
- **叙事解锁节点:** 每章内分布3-5个剧情触发点（对话/日记碎片），章末必有情感高潮
- **6章节结构:** Ch1（码头区）→ Ch2（渔村）→ Ch3（森林）→ Ch4（山顶）→ Ch5（神社）→ Ch6（灯塔顶）
- **好友进度展示（Phase 2）:** Phase 1只设计数据结构（在JSON中预留friend_progress字段），Phase 2实现UI
- **NPC idle台词:** 关卡间隙随机触发，与meta层共享触发器（非阻断式，纯氛围）
- **无限时活动/PvP压力:** 排除一切时间限制类元玩法，保持治愈调性
