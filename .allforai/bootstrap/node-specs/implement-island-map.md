---
node: implement-island-map
exit_artifacts:
  - game-client/assets/scripts/meta/IslandMapScene.ts
  - game-client/assets/scripts/meta/ChapterNode.ts
  - game-client/assets/scripts/meta/AreaRestorationEffect.ts
  - game-client/assets/scripts/meta/ProgressionManager.ts
---

# Task: 岛屿地图场景和章节进度系统实现

## Context Pull

**必需：**
- 从 `.allforai/game-design/chapter-emotional-arcs.json` 读取 `restore_stages[]`（4阶段恢复序列），作为AreaRestorationEffect的动画序列依据
- 从 `.allforai/game-design/art-tokens.json` 读取 `colors.chapters[]`，各章节的视觉颜色

**可选：**
- 从 `.allforai/game-design/animation-spec.json` 读取 `area-restore-sequence` 动画时序
- 从 `.allforai/game-design/vfx-spec.json` 读取 `vfx-area-restore` 和 `vfx-lighthouse-final` 触发规格

## Guidance

### IslandMapScene.ts
- Cocos Scene组件，包含6个ChapterNode子节点
- 场景进入时：从ProgressionManager加载进度 → 更新各ChapterNode状态
- 点击ChapterNode：已解锁→进入关卡选择；未解锁→显示"收集X材料解锁"提示
- 第6章完成时：触发vfx-lighthouse-final全屏特效序列

### ChapterNode.ts
状态机（4状态）：
- `LOCKED`：灰白色，锁图标，不可点击
- `AVAILABLE`：彩色，材料不足但可预览，点击显示所需材料
- `IN_PROGRESS`：有动画进度条，部分恢复动画已播放
- `COMPLETED`：全彩，恢复完成状态，NPC出现

### AreaRestorationEffect.ts
- 接收 `chapter: number` 和 `stage: 1|2|3|4`
- 按 chapter-emotional-arcs.json 中的 `restore_stages[]` 描述播放对应动画
- 播放 area-restore-sequence.anim（Cocos Animation组件）
- 触发 vfx-area-restore.effect 粒子系统
- 第4阶段结束时发射 `chapterFullyRestored(chapterId)` 事件

### ProgressionManager.ts
- 单例，管理全局游戏进度
- 持久化：优先云存档（后端API），降级本地storage
- 状态：chapterProgress[1-6]（已完成关卡数）、materials（背包）、currency（沙滩币/丹青石）
- `syncToCloud()`: 调用后端/save API（异步，失败静默重试）
- `loadFromCloud()`: 场景进入时调用

## Exit Artifacts

4个 TypeScript 文件

## Downstream Contract

→ `stitch-game-client` 读取：`chapterFullyRestored` 事件名称（验证GameSession在通关后触发）、`ProgressionManager.syncToCloud()` 调用时机
