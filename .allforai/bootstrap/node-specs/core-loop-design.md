---
node: core-loop-design
capability: game-design
discipline_owner: lead-designer
human_gate: true
approval_record_path: .allforai/game-design/approval-records.json
exit_artifacts:
  - .allforai/game-design/core-loop.html
  - .allforai/game-design/systems/core-mechanics.json
review_checklist:
  - 连击计时器机制完整（触发条件/重置规则/断连惩罚）
  - combo倍率曲线定义清晰（初始值/递增方式/上限）
  - 步数制关卡结构合理（初始步数/过关目标/续关成本）
  - 单局1-2分钟目标可达（步数与棋盘密度配比）
  - 5种战术棋盘特殊块（光波/光链/穿透/置换/连锁）与连击系统协同设计，不出现孤立单块移除导致无解
  - 3种场外沙滩币辅助（重排/预判/续关）定义清晰，续关为唯一IAP触点
---

# Goal

Design the core gameplay loop for Glow Island: a timing-based combo 连连看 system on top of path-matching mechanics.

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

- `.allforai/product-concept/concept-baseline.json` — gameplay_feel, session_design, differentiation_strategy (combo_system), board_design
- `.allforai/game-design/systems/worldbuilding.json` — chapters[], chapter mechanics unlock schedule

## Sub-Skill Invocation

Read and follow:

1. **Core Loop Design:** Read and follow `${CLAUDE_PLUGIN_ROOT}/skills/game-systems/10-design/core-loop-design/SKILL.md`

## Key Design Decisions Already Made

- **核心机制:** 连连看路径匹配（≤2转角消除同图案）+ 节奏连击系统（非静态解谜）
- **Combo计时器:** 每次消除重置/延长计时器；超时combo归零；音效节奏随combo升级
- **Combo倍率:** 随连击数递增（具体曲线由progression-curve-design设计）
- **步数制:** 无倒计时、无体力；步数耗尽后可花沙滩币续关（唯一付费点）
- **单局目标:** 1-2分钟/关；超休闲快进快出；关卡要保障玩家频繁触发连击
- **棋盘:** Ch1-2标准矩形（8×8/9×9）；Ch3+逐步引入异形棋盘
- **5种战术棋盘特殊块:**
  - 光波（Wave）：向四周清除障碍物（冰/锁链/藤蔓），不移除图块，不破坏配对可能性
  - 光链（Light Chain）：将场上所有同类型图块两两自动配对消除
  - 穿透（Pierce）：消除时路径穿透一个障碍物，图块本身不消失
  - 置换（Swap）：交换任意两个相邻图块的位置，不计入消除步数
  - 连锁（Cascade）：触发后自动连续匹配所有当前可消对，combo不重置
- **3种场外沙滩币辅助（非棋盘图块）:**
  - 重排（30币）：打乱并重新排列所有图块（保证新局面有解）
  - 预判（10币）：高亮显示1-3个可消对，不消耗步数
  - 续关（30币）：步数耗尽后花费沙滩币继续——唯一IAP触点
- **安全性:** 所有特殊块设计不移除单个图块，不破坏棋盘可解性（无需运行时奇偶校验）
- **章节机制解锁:** Ch1基础+combo；Ch2冰封块；Ch3锁链+传送门；Ch4单路径约束；Ch5重力+滑落；Ch6扩散障碍（藤蔓/苔藓）
