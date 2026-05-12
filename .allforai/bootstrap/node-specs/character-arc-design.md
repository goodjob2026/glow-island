---
node: character-arc-design
capability: game-design
discipline_owner: narrative-designer
human_gate: true
approval_record_path: .allforai/game-design/approval-records.json
exit_artifacts:
  - .allforai/game-design/character-arc.html
  - .allforai/game-design/systems/character-arc.json
review_checklist:
  - 律的情感弧线从「燃尽孤立」到「重新连接」有清晰的6章节节点
  - ひなた的成长弧线（手账管控情绪到允许误差存在）与剧情触发点对齐
  - 律×ひなた暧昧情感线6章beats（hinata_ambiguous_beat）温度递进清晰，Ch6以沉默/行动收尾不破
  - ひなた手账符号行为系统前后自洽（来访者栏/退潮线/未闭合圆/无箭头光线）
  - 渉已病逝（非失踪），冬子用「不在这里」表达情感延续；邀请来源为冬子按遗愿发送荒诞邮件+船票
  - 三块石刻分散在Ch1/Ch3/Ch5（りつ/二〇二六/灯を見る人），游戏永不解释
  - Ch1-4各有一句NPC台词铺垫「还行」重量（健三/梅子/夏帆/律日记）
---

# Goal

Design character emotional arcs for 山田律, 丸山ひなた, and all NPCs across 6 chapters.

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

- `.allforai/product-concept/concept-baseline.json` — protagonist, romantic_interest, npcs, character_bonds, retention_hooks, narrative_progression
- `.allforai/game-design/systems/worldbuilding.json` — chapters[], npcs[], hidden_mystery, character_bonds

## Sub-Skill Invocation

Read and follow:

1. **Narrative Tone Design (character arc focus):** Read and follow `${CLAUDE_PLUGIN_ROOT}/skills/game-narrative/10-design/narrative-tone-design/SKILL.md`

## Key Design Decisions Already Made

- **律的弧线:** 东京广告高压燃尽→弹窗意外到岛→被奇葩NPC们以奇怪方式接纳→逐渐找回创造力和连接感→第6章点亮灯塔=点亮自己
- **ひなた的弧线:** 用手账管理一切包括情绪（防御机制源自童年事件，第5章揭晓）→被"误差37%"的律打乱→从「控制误差」到「允许误差存在就是成长」
- **律记不住脸只记气味声音** — 认出ひなた靠"海水+碳粉墨水"的气味
- **隐藏谜:** 渉的日记记录早知律会来；健三钓上的信收件人是律；"这次意外根本不是意外"；游戏永远不解释渉怎么做到的
- **NPC关系转折点:**
  - 健三: 交出那封信时说"终于等到你了"——对大海说的，不是对律
  - 梅子: 脸碗第一天就在最显眼处——"这里有你的位置"不用开口
  - 夏帆: 第一次对律说话（通过松树）然后低头说"那是我说的"
  - 冬子: 每晚对灯塔说"律今天很努力"——律路过听到了，装作没听到
- **第5章揭晓:** ひなた的手账管理来源 + 渉消失真相铺垫
- **第6章情感高潮:** 律点亮灯塔；ひなた在手账上那天留白但没有补填数值
