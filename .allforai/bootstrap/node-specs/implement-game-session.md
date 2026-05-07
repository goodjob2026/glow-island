---
node: implement-game-session
exit_artifacts:
  - game-client/assets/scripts/game/GameSession.ts
  - game-client/assets/scripts/game/LevelLoader.ts
  - game-client/assets/scripts/game/RewardCalculator.ts
  - game-client/assets/scripts/game/MaterialCollector.ts
---

# Task: 局内游戏状态机和奖励系统实现

## Context Pull

**必需：**
- 从 `.allforai/game-design/level-design.json` 读取关卡数据结构（LevelLoader按此格式解析）
- 从 `.allforai/game-design/economy-model.json` 读取 `coin_per_level` 和 `material_rewards`（奖励计算基础）

## Guidance

### GameSession.ts（状态机）
状态：`loading → playing → paused → (levelComplete | failed)`

关键逻辑：
- `loading`：调用 LevelLoader.load(levelId) 初始化棋盘
- `playing`：监听 TileGrid 事件，监听步数/目标完成
- `levelComplete`：计算奖励 → 调用 MaterialCollector.add() → 发射 `sessionEnded(result)` 事件
- `failed`（步数耗尽/目标未完成）：提示续命（丹青石）或退出

边界处理：
- 用户退出中途：保存当前关卡进度（本局重新开始，不扣材料）
- 续命：增加5步，仅当 `failed` 状态且用户确认扣除丹青石后

### LevelLoader.ts
- `load(levelId: string)`: 读取 level-design.json 中对应关卡配置
- 验证关卡数据完整性（目标/网格/图块类型均存在）
- 初始化 TileGrid（调用 BoardGenerator.generateFromConfig）
- 初始化 BoardEventManager（注册关卡的动态事件队列）

### RewardCalculator.ts
```typescript
class RewardCalculator {
  calculate(result: SessionResult): Reward {
    // base coins + combo bonus + perfect clear bonus
    // material: 按 level.material_reward 分配
  }
}
interface Reward { coins: number; materials: MaterialItem[]; }
```

### MaterialCollector.ts
- 背包数据：`{ materialType: string, count: number }[]`
- `add(materials: MaterialItem[])`: 加入背包
- `canRepair(chapterId: number)`: 检查是否有足够材料修复该章节
- `consume(recipe: MaterialRecipe)`: 消耗材料（修复时调用）
- 满时：发射 `inventoryFull` 事件，触发修复引导

## Exit Artifacts

4个 TypeScript 文件

## Downstream Contract

→ `stitch-game-client` 读取：`sessionEnded` 事件（验证IslandMap在收到后更新进度）、`inventoryFull` 事件（验证UI显示修复引导）
