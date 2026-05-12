---
node: audio-design
capability: game-design
discipline_owner: audio-director
human_gate: true
approval_record_path: .allforai/game-design/approval-records.json
exit_artifacts:
  - .allforai/game-design/audio-design.html
  - .allforai/game-design/systems/audio-design.json
review_checklist:
  - BGM风格与Animal Crossing治愈调性一致，6章各有情感色调变化
  - combo音效节奏系统完整（每级combo对应的音效描述/节拍加速规则）
  - SFX目录覆盖所有核心交互（点击/连线/消除/combo触发/道具使用/关卡完成）
  - NPC对话音效（动森风格的嘟嘟声，非全语音）与角色性格匹配
  - 音频技术规格与目标平台（Web/移动）兼容（文件格式/码率/流式加载）
---

# Goal

Design the complete audio system for Glow Island: BGM direction, combo audio feedback system, SFX catalogue, and NPC voice style.

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

- `.allforai/product-concept/concept-baseline.json` — audio_direction, gameplay_feel, narrative_progression
- `.allforai/game-design/systems/worldbuilding.json` — chapters[], NPC characters
- `.allforai/game-design/systems/core-mechanics.json` — combo_system (for audio feedback levels)
- `.allforai/game-design/systems/retention-hook.json` — NPC idle line triggers

## Sub-Skill Invocation

Read and follow in sequence:

1. **Audio Style Design:** Read and follow `${CLAUDE_PLUGIN_ROOT}/skills/game-audio/10-design/audio-style-design/SKILL.md`
2. **Music Cue Spec:** Read and follow `${CLAUDE_PLUGIN_ROOT}/skills/game-audio/20-spec/music-cue-spec/SKILL.md`
3. **SFX Spec:** Read and follow `${CLAUDE_PLUGIN_ROOT}/skills/game-audio/20-spec/sfx-spec/SKILL.md`

## Key Design Decisions Already Made

- **整体风格:** Animal Crossing式治愈音乐——轻松愉快、岛屿氛围、无压迫感
- **BGM策略:** 6章各有主题BGM，随章节解锁；关卡内BGM与菜单/地图BGM有区别
- **Combo音频反馈系统（核心）:**
  - 每次消除有轻柔的击中音
  - Combo计时器运行时背景节拍逐渐加速（不切歌，是tempo变化）
  - Combo等级提升时有对应音效（爽快感关键）
  - Combo断连时有轻微下行音效（不惩罚性，只是提示）
- **NPC声音风格:** Animal Crossing式的嘟嘟声（每个NPC声音音色不同，体现性格）；不做全语音
  - 健三：低沉温厚的嘟嘟声
  - 梅子：清脆欢快的叮叮声
  - 夏帆：温柔细腻、略带沙哑
  - 冬子：明亮活泼、偶尔带颤音
- **SFX目录必须覆盖:** 点击图案/连线/消除/combo升级/道具使用/关卡完成/关卡失败/日记解锁
- **平台音频规格:** Web优先（MP3/OGG双格式）；移动端后期适配
