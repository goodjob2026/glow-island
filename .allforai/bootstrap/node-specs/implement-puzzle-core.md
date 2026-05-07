---
node: implement-puzzle-core
exit_artifacts:
  - game-client/assets/scripts/puzzle/TileGrid.ts
  - game-client/assets/scripts/puzzle/TileMatcher.ts
  - game-client/assets/scripts/puzzle/BoardGenerator.ts
  - game-client/assets/scripts/puzzle/ComboTracker.ts
---

# Task: 连连看核心引擎实现

基于 puzzle-mechanics-spec.json 和原型测试报告，实现完整的连连看引擎（不含UI和特殊块）。

## Context Pull

**必需：**
- 从 `.allforai/game-design/puzzle-mechanics-spec.json` 读取完整规格
- 从 `game-client/assets/resources/sprites/tiles/tile-placeholder-spec.json` 读取 `tiles[].id` 命名规范

**可选：**
- 从 `.allforai/game-design/prototype-test-report.md` 读取调整建议（优先于规格文档）
- 从 `.allforai/game-design/animation-spec.json` 读取动画时序，确保引擎事件与动画时序匹配

## Theory Anchors

- **Event-Driven Architecture**: 引擎通过EventTarget发射事件（tileMatched, comboUpdated），UI/特效监听，解耦
- **Pure Logic Separation**: TileMatcher不依赖Cocos节点，纯TypeScript逻辑——便于单元测试

## Guidance

### TileType 枚举
```typescript
// 20种图块，按章节分组
enum TileType {
  // 第1章：海边码头
  SHELL = 'shell', STARFISH = 'starfish', CRAB = 'crab', WAVE = 'wave',
  // 第2章：中央小镇
  BRICK = 'brick', LAMP = 'lamp', FLOWER_POT = 'flower_pot', BELL = 'bell',
  // ... 以此类推
  NONE = 'none'  // 空格
}
```

### TileGrid
- 内部状态：`grid: TileCell[][]`（二维数组）
- TileCell：`{ type: TileType, isObstacle: boolean, obstacleType?: ObstacleType, isSelected: boolean, isLocked: boolean }`
- 方法：`getTile(row,col)`, `setTile(row,col,cell)`, `clearTile(row,col)`, `applyGravity()`（消除后滑落）
- 事件：通过Cocos EventTarget发射

### TileMatcher（核心算法）
BFS实现≤2次转弯路径搜索：
```typescript
class TileMatcher {
  // 返回从(r1,c1)到(r2,c2)的合法路径，不存在则返回null
  findPath(grid: TileCell[][], r1: number, c1: number, r2: number, c2: number): Point[] | null
}
```
搜索策略：
- BFS遍历所有可能的路径（水平段+垂直段+再水平/垂直段，最多3段=2转弯）
- 路径经过的格子必须为空（NONE或边界外）
- 两端点格子类型相同才触发搜索

### BoardGenerator
- `generateFromConfig(levelConfig: LevelConfig)`: 按关卡JSON生成初始棋盘
- `generateRandom(gridSize, tileTypes, seed?)`: 随机生成（带死局检测）
- 死局检测：生成后检查是否至少有5对可连接图块，不足则重新生成

### ComboTracker
- 维护：上次消除时间、当前连击数
- `onTileMatched()`: 更新连击（检查时间窗口2000ms）
- `getMultiplier()`: 返回当前倍率（按 mechanics-spec.combo.multipliers[]）
- 发射事件：`comboChanged(newCount, multiplier)`

### 集成动画
- TileGrid 在 `applyGravity()` 完成后发射 `tilesSettled` 事件
- 消除时发射 `tilesMatched(path: Point[])` → AnimationController 播放 tile-disappear.anim

## Exit Artifacts

4个 TypeScript 文件，每个文件头部有简短注释说明职责（不超过1行）。

## Downstream Contract

→ `implement-special-mechanics` 读取：TileGrid的公共方法接口（`clearTile`, `setTile`），用于特殊块效果
→ `implement-game-session` 读取：TileMatcher和ComboTracker的公共接口
→ `stitch-game-client` 读取：所有事件名称（`tilesMatched`, `comboChanged`, `tilesSettled`），验证监听者已绑定
