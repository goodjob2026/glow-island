---
node: implement-special-mechanics
exit_artifacts:
  - game-client/assets/scripts/puzzle/SpecialBlock.ts
  - game-client/assets/scripts/puzzle/BoardEventManager.ts
  - game-client/assets/scripts/puzzle/ObstacleManager.ts
---

# Task: 特殊块系统、动态棋盘事件和障碍管理器实现

## Context Pull

**必需：**
- 从 `.allforai/game-design/puzzle-mechanics-spec.json` 读取 `special_blocks[]`（触发条件/效果）、`board_events[]`（触发时机/持续）、`obstacles[]`（消除规则）
- 从 `game-client/assets/scripts/puzzle/TileGrid.ts`（已实现）了解可调用的公共接口

**可选：**
- 从 `.allforai/game-design/vfx-spec.json` 读取 `trigger` 字段，在正确时机触发粒子特效

## Guidance

### SpecialBlock.ts
```typescript
enum SpecialBlockType { BOMB = 'bomb', WINDMILL = 'windmill', LIGHT = 'light', WAVE = 'wave' }

interface ISpecialBlockBehavior {
  type: SpecialBlockType
  trigger(grid: TileGrid, position: Point, comboCount: number): void
  // 触发后播放对应粒子特效
}
```
4种实现：
- `BombBehavior`: clearArea(grid, pos, radius=1)（3×3）
- `WindmillBehavior`: clearColumn(grid, col)
- `LightBehavior`: findNearestSameTile(grid, pos) → triggerMatch()
- `WaveBehavior`: reshuffleBoard(grid)（保持类型数量不变）

### BoardEventManager.ts
- 维护事件队列（关卡配置的事件序列）
- `update(dt: number)`: Cocos生命周期调用，检查定时触发
- 事件类型实现：
  - TileFall：消除后自动（applyGravity已在TileGrid处理）
  - WaterFlow：选定行/列每N秒平移1格（循环）
  - IceFreeze：标记指定区域为frozen状态
  - VineSpread：每10秒向随机相邻格子扩展

### ObstacleManager.ts
- 维护每个格子的障碍状态（hitCount, obstacleType）
- `onTileMatched(adjacentPositions: Point[])`: 相邻消除触发hit计数
- `isPathBlocked(path: Point[])`: 检查路径是否被木箱阻挡
- 配合BoardEventManager处理杂草扩散

## Exit Artifacts

3个 TypeScript 文件

## Downstream Contract

→ `stitch-game-client` 读取：SpecialBlockType枚举（确保枚举全覆盖），BoardEventManager事件类型（确保全部有渲染处理）
