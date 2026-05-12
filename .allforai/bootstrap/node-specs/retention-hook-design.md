---
node: retention-hook-design
capability: game-design
discipline_owner: systems-designer
human_gate: true
approval_record_path: .allforai/game-design/approval-records.json
exit_artifacts:
  - .allforai/game-design/retention-hook.html
  - .allforai/game-design/systems/retention-hook.json
review_checklist:
  - 留存钩子不依赖体力/强制通知，符合治愈调性
  - 叙事驱动（日记碎片解锁）的触发节奏合理（每N关一次）
  - 岛屿视觉变化频率（每N关）与关卡通关速度匹配
  - 每日签到奖励量合理（不影响付费平衡，但有吸引力）
  - 好友进度展示（Phase 2）的数据结构已在设计中预留
---

# Goal

Design retention hooks for Glow Island: narrative-driven, visual progress-driven, daily sign-in, and friend progress display.

> **Non-interactive execution.** All design decisions are recorded in `.allforai/`.

> **Output language (mandatory):** All HTML navigation tabs, section headings, labels, captions,
> and descriptive text MUST be in Chinese (zh-CN). In-game proper nouns (place/character/item names)
> keep the game world's native language (Japanese). JSON field keys stay English snake_case.

> Do NOT use AskUserQuestion or request user input.

## Inputs

- `.allforai/product-concept/concept-baseline.json` — retention_hooks, session_design, narrative_progression
- `.allforai/game-design/systems/core-mechanics.json` — chapter structure
- `.allforai/game-design/systems/monetization-design.json` — currency balance

## Sub-Skill Invocation

Read and follow:

1. **Player Experience Contract:** Read and follow `${CLAUDE_PLUGIN_ROOT}/skills/game-design/10-concept/player-experience-contract/SKILL.md`

## Key Design Decisions Already Made

- **主要钩子:**
  1. **叙事驱动:** 通关特定关卡解锁灯台守渉的日记碎片，好奇心驱动回归
  2. **视觉进度:** 每N关触发一次明显岛屿场景变化（N由progression-curve-design确定，参考5-10关）
  3. **每日签到:** 连签奖励沙滩币，形成日常习惯
  4. **好友进度展示:** Phase 2实现，Phase 1设计数据结构预留
- **排除:** 限时活动、人为难度墙、PvP竞技压力
- **NPC idle台词:** 关卡间隙随机弹出奇葩文字气泡（健三/梅子/夏帆/冬子），不打断游戏节奏
- **叙事触发节奏:** 每章30关内分布3-5个剧情触发点，章末必有情感高潮+视觉大变化
