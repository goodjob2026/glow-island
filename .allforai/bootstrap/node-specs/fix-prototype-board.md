---
node: fix-prototype-board
node_id: fix-prototype-board
capability: implement
human_gate: false
hard_blocked_by: []
unlocks: [ui-forge-game, compile-verify]
exit_artifacts:
  - .allforai/game-client/fix-prototype-board-report.json
---

# Task: 修复 PrototypeBoard 核心 Bug

## 背景

`PrototypeBoard.ts` 是当前唯一可运行的游戏原型场景（Prototype.scene）。存在两个已知 bug：

1. **`dropColumns` Set spread 编译 bug（高优先级）**
   - 位置：`game-client/assets/scripts/prototype/PrototypeBoard.ts` 约第 250 行
   - 问题：`const uniqueCols = [...new Set(cols)]`
   - Cocos Creator 3 的 TypeScript 编译器将此编译为 `[].concat(new Set(t))` ——
     `Array.concat` 不会展开 Iterable，而是将整个 Set 对象作为单个元素包装。
     导致 `dropColumns` 始终用 Set 对象作为列索引，永远无法正确补充列。
   - 修复：替换为 `Array.from(new Set(cols))`

2. **GameScene Canvas 位置问题（中优先级）**
   - 位置：`game-client/assets/scenes/GameScene.scene`
   - 问题：Canvas `_lpos` 为 `{x: 480, y: 320}` 而非 `{x: 0, y: 0}`
   - 症状：在某些 Chrome 窗口尺寸下，棋盘看起来分裂为两半（视觉错位）
   - 修复：将 Canvas `_lpos` 改为 `{x: 0, y: 0, z: 0}`

## 执行步骤

### 1. 修复 PrototypeBoard.ts

读取 `game-client/assets/scripts/prototype/PrototypeBoard.ts`，找到：

```typescript
const uniqueCols = [...new Set(cols)];
```

替换为：

```typescript
const uniqueCols = Array.from(new Set(cols));
```

### 2. 修复 GameScene.scene Canvas 位置

读取 `game-client/assets/scenes/GameScene.scene`（JSON 格式），找到 Canvas 节点的 `_lpos` 字段：

```json
"_lpos": { "__type__": "cc.Vec3", "x": 480, "y": 320, "z": 0 }
```

将 x 和 y 改为 0：

```json
"_lpos": { "__type__": "cc.Vec3", "x": 0, "y": 0, "z": 0 }
```

**注意**：GameScene.scene 是 JSON 文件，可以直接编辑。找到 Canvas 节点下的 `_lpos`（UITransform ContentSize 为 960×640 的那个节点）。

### 3. 验证修复

用 grep 确认修复已应用：

```bash
grep "uniqueCols" game-client/assets/scripts/prototype/PrototypeBoard.ts
# 应该输出：Array.from(new Set(cols))

python3 -c "
import json
with open('game-client/assets/scenes/GameScene.scene') as f:
    scene = json.load(f)
# 找 Canvas 节点
for obj in scene.get('_globals', {}).get('_nodes', scene.get('nodes', [])):
    pass
# 简单 grep 验证
"
grep -A1 '"name": "Canvas"' game-client/assets/scenes/GameScene.scene | head -5
```

### 4. 生成报告

写入 `.allforai/game-client/fix-prototype-board-report.json`：

```json
{
  "fixed_at": "<ISO timestamp>",
  "fixes": [
    {
      "file": "game-client/assets/scripts/prototype/PrototypeBoard.ts",
      "issue": "dropColumns Set spread compiled to [].concat(Set) instead of spreading",
      "fix": "Changed [...new Set(cols)] to Array.from(new Set(cols))",
      "status": "applied"
    },
    {
      "file": "game-client/assets/scenes/GameScene.scene",
      "issue": "Canvas _lpos at (480, 320) caused board to appear split in certain Chrome window sizes",
      "fix": "Changed Canvas _lpos to (0, 0, 0)",
      "status": "applied"
    }
  ],
  "overall_status": "fixed"
}
```
