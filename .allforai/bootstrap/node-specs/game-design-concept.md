---
node: game-design-concept
exit_artifacts:
  - .allforai/product-concept/product-concept.json
  - .allforai/game-design/game-design-document.md
  - .allforai/game-design/player-archetypes.json
  - .allforai/game-design/monetization-design.json
---

# Task: 完整游戏设计文档（GDD）生成

综合竞品分析+创新探索+世界观，生成Glow Island完整GDD和结构化产品概念文档。

## Context Pull

**必需：**
- 从 `.allforai/product-concept/errc-matrix.json` 读取 `create[]`
- 从 `.allforai/product-concept/innovation-opportunities.json` 读取 `selected_differentiators[]`
- 从 `.allforai/game-design/worldbuilding-bible.md` 读取世界观背景
- 从 `.allforai/game-design/chapter-emotional-arcs.json` 读取 `chapters[]`

## Theory Anchors

- **Bartle Types**: Achiever/Explorer/Socializer — 确定目标玩家原型
- **Self-Determination Theory (Deci & Ryan)**: 自主/胜任/关联 — 内在动机设计
- **MDA Framework**: Mechanics→Dynamics→Aesthetics — 从机制推导体验
- **Core Loop + Meta Loop**: 定义局内（30s-3min）和局外（岛屿成长）的循环结构

## Guidance

### 玩家原型（player-archetypes.json）
基于Bartle Types，Glow Island的主要玩家原型：
- **Explorer（探索者）**: 喜欢看到新内容，被岛屿逐渐恢复的视觉变化驱动
- **Achiever（成就者）**: 喜欢完成关卡，追求连击和完美通关
- 次要原型：Socializer（排行榜社交）
- 排除：Killer（无PvP设计空间）

### GDD核心内容
包含以下部分：
1. **游戏定位**（一句话+三句话展开）
2. **核心循环**（局内30s-3min的连接→combo→消除→奖励）
3. **元循环**（材料收集→自动轻合成→修复区域→解锁新章节）
4. **6章节概览**（名称/情绪/解锁条件/标志性视觉）
5. **特殊系统概述**（4种特殊块/动态棋盘事件/障碍系统）
6. **商业化策略概述**（双货币/IAP/无P2W承诺）
7. **成功指标**（次日留存目标≥40%，7日留存≥20%，ARPU目标）

### product-concept.json 关键字段
必须包含：
- `features[]` / `mvp_features[]`：列出所有MVP功能
- `errc_highlights.must_have[]`：核心不可删减特性
- `errc_highlights.differentiators[]`：差异化特性
- `roles[]`：玩家角色定义（单角色：Player，平台iOS+WebGL）

### monetization-design.json 关键内容
- 双货币：沙滩币（免费软货币）+ 丹青石（付费硬货币）
- IAP产品：小包（6丹青石）/ 中包（30丹青石）/ 大包（88丹青石）/ 月卡（每日10丹青石×30天）
- 付费点设计原则：不P2W，只买便利和外观
- 用途：续命（丹青石买额外步数）、跳关、道具、装饰

## Exit Artifacts

**product-concept.json** — 结构化产品概念，含 features[], mvp_features[], errc_highlights, roles[]
**game-design-document.md** — 完整GDD Markdown文档
**player-archetypes.json** — 玩家画像（Bartle Types + 动机分析）
**monetization-design.json** — 商业化策略详细文档

## Downstream Contract

→ `core-mechanics-design` 读取：`game-design-document.md` 核心循环部分，作为机制规格的范围约束
→ `level-design` 读取：`chapter-emotional-arcs` 和 GDD章节概览，指导关卡情绪设计
→ `economy-design` 读取：`monetization-design.json` 双货币架构和IAP产品目录
→ `art-concept` 读取：GDD的情感定位和视觉关键词
→ `concept-acceptance` 读取：`product-concept.json` 的 `mvp_features[]` 和 `errc_highlights`
