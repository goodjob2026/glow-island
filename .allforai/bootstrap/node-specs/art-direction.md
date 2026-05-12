---
node: art-direction
capability: game-design
discipline_owner: art-director
human_gate: true
approval_record_path: .allforai/game-design/approval-records.json
exit_artifacts:
  - .allforai/game-design/art-direction.html
  - .allforai/game-design/art-style-guide.json
review_checklist:
  - 风格参考图与治愈/日式离岛目标受众匹配（非竞技、非暗黑风格）
  - 色调方案有明确主色/辅色/强调色（章节配色对应情感阶段）
  - 字体层级清晰（正文/标题/UI三级层次）
  - 动画风格与引擎能力匹配（2D帧动画/DragonBones/Tween，Web Canvas）
  - art-style-guide.json 包含 art_overview 字段（供 art-concept 节点读取）
---

# Goal

Define the visual art direction for Glow Island: style guide, color system, character design principles, and animation direction.

> **Non-interactive execution.** All design decisions are recorded in `.allforai/`.

> **Output language (mandatory):** All HTML navigation tabs, section headings, labels, captions,
> and descriptive text MUST be in Chinese (zh-CN). In-game proper nouns (place/character/item names)
> keep the game world's native language (Japanese). JSON field keys stay English snake_case.


> **Design integrity (mandatory):** All mechanics, currencies, item names, and system
> values in output documents MUST be sourced from the authoritative input files
> (concept-baseline.json, core-mechanics.json). NEVER reference old/deprecated systems,
> use "旧版"/"previously"/"replaced" in visible UI text, or include content for systems
> absent from concept-baseline.json. See game-design.md §Design Integrity Rules.
> Do NOT use AskUserQuestion or request user input.

## Inputs

- `.allforai/product-concept/concept-baseline.json` — gameplay_feel, audio_direction (for tone alignment), narrative_progression
- `.allforai/game-design/systems/worldbuilding.json` — chapters[], island environments, characters

## Sub-Skill Invocation

Read and follow:

1. **Art Direction Input Contract:** Read and follow `${CLAUDE_PLUGIN_ROOT}/skills/game-art/10-design/art-direction-input-contract/SKILL.md`

## Key Design Decisions Already Made

- **整体风格:** Animal Crossing × 日式治愈离岛——软萌、温暖、细腻；不走像素风或写实风
- **色彩方向:** 暖色主调（珊瑚橙/沙滩米/海洋蓝）；夜间场景以柔和月光蓝为主；章节随进度逐渐变亮（对应岛屿复苏）
- **角色设计:** 简化anime风格，圆润身材比例，大眼睛表情丰富；每个NPC有独特的服装标识色
- **动画方向:** 2D动画为主；角色有idle动效（轻微呼吸感）；combo特效要炫酷但不遮挡棋盘
- **UI风格:** 扁平化+软阴影；卡片式UI；避免强对比色的警示感（治愈调性）
- **平台优先:** Web Canvas 2D（Cocos Creator）；资产按2x分辨率设计，1x降级
- **art_overview字段要求:** art-style-guide.json必须包含art_overview字段，供art-concept节点读取（包含dimension、style_keywords、color_palette摘要、animation_system）
