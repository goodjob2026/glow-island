---
node_id: fix-special-mechanics
capability: implement
human_gate: false
hard_blocked_by: []
unlocks: [stitch-game-client]
exit_artifacts:
  - path: .allforai/implement/fix-special-mechanics-report.json
---

# Task: 修复特殊图块系统 (F-008)

`SpecialBlock.ts` 和 `BoardEventManager.ts` 已存在，但上一轮 bootstrap 检测到集成问题，需要完整验证并修复。

## Project Context

- **Client**: Cocos Creator 3.x, TypeScript, `game-client/assets/scripts/puzzle/`
- **Files to verify**: `SpecialBlock.ts`, `BoardEventManager.ts`, `GameSession.ts`（调用方）
- **5种特殊图块**: WAVE（光波）、LIGHT_CHAIN（光链）、PIERCE（穿透）、SWAP（置换）、CASCADE（连锁）
- **触发规则**: 各类型均通过 `SPECIAL_BLOCK_GENERATION_COMBO` 中的 combo 阈值自动生成（CASCADE=3, LIGHT_CHAIN=4, WAVE=6；PIERCE/SWAP 仅编辑器预设）

## Guidance

### 1. 定位集成入口

```bash
grep -n "SpecialBlock\|applySpecial\|triggerSpecial\|handleSpecial" \
  game-client/assets/scripts/game/GameSession.ts \
  game-client/assets/scripts/puzzle/BoardEventManager.ts 2>/dev/null | head -30
```

确认 `GameSession.ts` 或 `BoardEventManager.ts` 是否正确调用了 `SpecialBlockFactory.create()` 并执行 `behavior.apply(grid)`。

### 2. 验证 ISpecialBlockBehavior 接口实现

检查 `SpecialBlock.ts` 中每种 behavior 的 `apply()` 方法：

- **WaveBehavior**: 应消除配对 WAVE 块周围 3×3 范围内所有匹配色图块
- **LightChainBehavior**: 应消除配对 LIGHT_CHAIN 块所在行和列的所有同色图块
- **PierceBehavior**: 应消除从配对 PIERCE 块出发、穿透障碍的连续同色链
- **SwapBehavior**: 应触发"选择两格位置互换"的 UI 交互流程，等待 `resolveSwapSelection(a, b)` 回调
- **CascadeBehavior**: 应在 combo ≥ 3 后将相邻同色块链式激活成 Glow 块

对每个 behavior 写单元测试（Jest，仅测纯逻辑，不依赖 `cc`）：

```typescript
// tests/SpecialBlock.test.ts
import { WaveBehavior } from '../game-client/assets/scripts/puzzle/SpecialBlock';
import { createMockGrid } from './helpers/mockGrid';

test('WaveBehavior removes 3x3 area around pair', () => {
  const grid = createMockGrid(5, 5, /* seed */);
  const behavior = new WaveBehavior();
  const result = behavior.apply(grid, { x: 2, y: 2 });
  expect(result.removedCells.length).toBeGreaterThan(0);
});
```

### 3. 修复 SwapBehavior 交互回调

`SwapBehavior` 依赖 `onSwapSelectionStart` 回调，检查是否在 `BoardEventManager` 或 `GameScene` 中已注册：

```bash
grep -n "onSwapSelectionStart\|resolveSwapSelection" \
  game-client/assets/scripts/game/GameScene.ts \
  game-client/assets/scripts/puzzle/BoardEventManager.ts 2>/dev/null
```

若缺失 → 在 `BoardEventManager.ts` 中补充注册逻辑：

```typescript
swap.onSwapSelectionStart = (resolve, cancel) => {
  this._pendingSwapResolve = resolve;
  this._pendingSwapCancel = cancel;
  this.emit('openSwapUI');  // GameScene 监听后高亮可选格子
};
```

### 4. 验证 Combo 自动生成

在 `ComboTracker.ts` 和 `BoardGenerator.ts` 中确认 combo 达到阈值时会生成特殊块：

```bash
grep -n "SPECIAL_BLOCK_GENERATION_COMBO\|generateSpecial\|spawnSpecial\|comboThreshold" \
  game-client/assets/scripts/puzzle/ComboTracker.ts \
  game-client/assets/scripts/puzzle/BoardGenerator.ts 2>/dev/null
```

若未引用 `SPECIAL_BLOCK_GENERATION_COMBO` → 在 `ComboTracker.ts` 的 combo 结算逻辑中补充：

```typescript
import { SPECIAL_BLOCK_GENERATION_COMBO, SpecialBlockType } from './SpecialBlock';

private _checkSpecialGeneration(comboCount: number): SpecialBlockType | null {
  for (const [type, threshold] of Object.entries(SPECIAL_BLOCK_GENERATION_COMBO)) {
    if (threshold !== null && comboCount >= threshold) return type as SpecialBlockType;
  }
  return null;
}
```

### 5. 写修复报告

生成 `.allforai/implement/fix-special-mechanics-report.json`：

```json
{
  "timestamp": "<ISO>",
  "status": "fixed | partial | no_issues_found",
  "issues_found": [
    {
      "file": "<file path>",
      "issue": "<description>",
      "fix_applied": "<what was changed>"
    }
  ],
  "tests_added": ["<test file paths>"],
  "tests_passed": true
}
```

## Knowledge References

**§B.3 Closure Thinking**: 每个 bug 修复必须有对应测试覆盖才算关闭。不允许仅修改代码不加测试。

## Exit Artifacts

**`.allforai/implement/fix-special-mechanics-report.json`**
- `status` 明确
- 每个 issue 有 `fix_applied` 说明
- `tests_passed: true`（若 tests 无法运行则说明原因）

## Downstream Contract

→ stitch-game-client 读取: `status`（是否需要进一步集成修复）、`issues_found`（哪些文件有变更）
