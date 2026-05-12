---
node: worldbuilding
capability: game-design
discipline_owner: narrative-designer
human_gate: true
approval_record_path: .allforai/game-design/approval-records.json
exit_artifacts:
  - .allforai/game-design/worldbuilding.html
  - .allforai/game-design/systems/worldbuilding.json
  - .allforai/game-design/systems/worldbuilding-bible.md
review_checklist:
  - 輝島的世界观背景自洽，失去生机的原因与治愈基调一致
  - 6章节情绪弧线完整，每章有明确的修复前/后视觉描述
  - NPC设定（健三/梅子/夏帆/冬子/ひなた）各有独特羁绊，治愈温暖底色，无奇葩滑稽成分
  - 律到岛方式（垃圾邮件+休假申请表+船票）和灯台守渉的隐藏谜题逻辑自洽（渉已病逝，冬子按遗愿发出邀请）
  - 角色羁绊网（5条关系线）在世界观层面有根基
---

# Goal

Execute worldbuilding for 輝島（Kagayaki-jima）. Produce the world bible, chapter emotional arcs, and NPC lore that all downstream design nodes will reference.

> **Non-interactive execution.** All design decisions are recorded in `.allforai/`.

> **Output language (mandatory):** All HTML navigation tabs, section headings, labels, captions,
> and descriptive text MUST be in Chinese (zh-CN). In-game proper nouns (place/character/item names)
> keep the game world's native language (Japanese). JSON field keys stay English snake_case.


> **Design integrity (mandatory):** All mechanics, currencies, item names, and system
> values in output documents MUST be sourced from the authoritative input files
> (concept-baseline.json, core-mechanics.json). NEVER reference old/deprecated systems,
> use "旧版"/"previously"/"replaced" in visible UI text, or include content for systems
> absent from concept-baseline.json. See game-design.md §Design Integrity Rules.
> Do NOT use AskUserQuestion or request user input. Derive all decisions from the input contracts below.

## Inputs

- `.allforai/product-concept/concept-baseline.json` — protagonist, romantic interest, NPCs, setting, differentiation_strategy, character_bonds, narrative_progression
- `.allforai/product-concept/product-concept.json` — full product concept

## Sub-Skill Invocation

Read and follow in sequence:

1. **Narrative Tone Design:** Read and follow `${CLAUDE_PLUGIN_ROOT}/skills/game-narrative/10-design/narrative-tone-design/SKILL.md`
   - Key input from concept: protagonist 山田律 (Tokyo ad exec, burnout), romantic interest 丸山ひなた (手账+自创符号体系), setting 輝島, quirk tone (奇葩+相亲相爱), arrival via 弹窗诈骗, can't leave until lighthouse lit
   - NPC roster with quirk+warmth pairs: 磯部健三, 桐島梅子, 海野夏帆, 丸山冬子, 议长（猫）
   - Character bonds: 5 defined bonds in concept-baseline.json character_bonds
   - Retention hooks: narrative-driven (diary fragments), NPC idle quirky lines between levels

## Key Design Decisions Already Made

From enriched concept-baseline.json:
- **到岛方式:** 律凌晨三点收到发件人「Kagayaki-jima」的垃圾邮件（内容是休假申请表+船票），鬼使神差填表买票，请假出走至輝島
- **邀请真相:** 渉已病逝，冬子按渉临终遗愿通过荒诞形式发出邀请；游戏永远不解释机制
- **困岛原因:** 灯塔熄灭后岛从地图消失，渡轮GPS找不到，唯一出路：点亮灯塔
- **隐藏谜:** 渉留给冬子的「不寄出的信」提到一个东京来的年轻人；三块石刻（りつ/二〇二六/灯を見る人）分散Ch1/Ch3/Ch5，从不组合成完整句子
- **NPC基调:** 治愈温暖，各有独特表达方式（梅子的脸碗=你这里有位置；冬子每晚说灯塔=五十年的等待；夏帆通过植物传话）
- **冬子特色:** keeper角色——替大家保管暂时拿不动的东西（ひなた的雨衣/健三的烟盒/夏帆的植物牌/律的便利店小票）
- **章节:** 6章×30关=180关，每章有情感高潮+视觉大变化
- **暧昧情感线:** 律×ひなた 6章beats（Ch1注意→Ch2共鸣→Ch3并肩→Ch4寻找→Ch5临界→Ch6收容），以沉默/行动收尾不破
- **NPC铺垫台词:** Ch1健三「能走就行」→Ch2梅子「不平的东西有时比较稳」→Ch3夏帆「半开的花已经是花了」→Ch4律日记「不知道什么叫够了」

## Output Format

**worldbuilding.html** — 静态HTML，章节：世界背景、六章情绪弧线表格、NPC档案（含quirk+warmth）、角色羁绊网图、隐藏谜题结构

**systems/worldbuilding.json** — 紧凑摘要供下游节点引用：
```json
{
  "world_name": "輝島（Kagayaki-jima）",
  "arrival_hook": "...",
  "exit_condition": "...",
  "hidden_mystery": "...",
  "chapters": [{"id":1,"name":"...","emotion":"...","before_state":"...","restore_stages":[...],"npc":"...","signature_moment":"..."}],
  "npcs": [{"id":"...","name":"...","quirk":"...","warmth":"...","bond_with":"..."}],
  "character_bonds": [{"pair":"...","description":"..."}]
}
```

**systems/worldbuilding-bible.md** — Full lore prose (narrative-designer reference, not parsed as JSON)
