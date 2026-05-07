---
node: prototype-design
exit_artifacts:
  - game-client/assets/scenes/Prototype.scene
  - game-client/assets/scripts/prototype/PrototypeBoard.ts
  - .allforai/game-design/prototype-test-report.md
---

# Task: 核心玩法最小可玩原型构建

在Cocos Creator中创建一个独立的Prototype Scene，用纯色块验证连连看核心手感是否治愈爽快。不需要美术资产，只需证明机制可玩。

## Context Pull

**必需：**
- 从 `.allforai/game-design/puzzle-mechanics-spec.json` 读取 `path_rules`（≤2转弯规则）和 `combo`（连击阈值和窗口时间）

**可选：**
- 从 `game-client/package.json` 确认Cocos Creator版本

## Theory Anchors

- **Lean Startup**: Build-Measure-Learn，最小验证，不过度投入
- **Flow Theory**: 原型应产生心流感——不能太难（找不到匹配），不能太简单（随便点击）

## Guidance

### 原型范围（严格限定）

实现范围：
1. **PrototypeBoard.ts** — 核心组件：
   - 8×8网格，使用Cocos Label/Sprite色块表示图块（不需要真实美术）
   - 图块类型：仅4种（用颜色区分：红/蓝/绿/黄）
   - 点击选中高亮，再点击同类型图块触发BFS路径检查（≤2转弯）
   - 路径合法：播放简单动画（图块消失+新图块从顶部落下）
   - 路径不合法：轻微抖动反馈
   - 连击计数器：屏幕显示当前连击数

2. **Prototype.scene** — 独立场景：
   - PrototypeBoard组件挂载
   - 简单UI：连击数/已消除数/重置按钮
   - 无声音，无后端调用

### 禁止事项
- 不实现特殊块、障碍、动态事件
- 不实现后端调用
- 不实现美术动画
- 不实现关卡加载

### 测试报告
测试5局后，在 prototype-test-report.md 中记录：
- 手感评估：连接操作是否流畅自然？（1-5分）
- 路径规则：≤2转弯是否让玩家感到公平？是否需要调整？
- 连击感：2秒连击窗口是否合适？太长/太短？
- 视觉反馈：消除动画是否有爽感？缺什么？
- **调整建议**（供 implement-puzzle-core 参考的具体修改）

## Exit Artifacts

**game-client/assets/scenes/Prototype.scene** — Cocos Creator 场景文件
**game-client/assets/scripts/prototype/PrototypeBoard.ts** — 核心逻辑（约200行）
**.allforai/game-design/prototype-test-report.md** — 手感测试报告

## Downstream Contract

→ `implement-puzzle-core` 读取：`prototype-test-report.md` 中的调整建议，作为正式引擎实现的优化输入
