---
node_id: canvas2d-ftue
node: canvas2d-ftue
goal: "实现零强制教程：前3关引导箭头+高亮提示，不使用弹窗锁屏"
capability: canvas2d-engineer
human_gate: false
hard_blocked_by:
  - canvas2d-gameplay-scene
exit_artifacts:
  - "canvas2d-client/www/src/game/FTUEOverlay.js"
---

# canvas2d-ftue

## Mission

实现无打扰FTUE（首次用户体验）引导，以视觉提示代替弹窗说明，不阻断玩家操作。

## 设计原则（来自 .allforai/game-design/systems/ftue.json）

- zero_forced_tutorial：无强制教程框，以视觉叙事代替弹窗说明
- 前3关嵌入引导箭头+高亮，第4关起完全放手

## 引导阶段

### 第1-1关（首次进入）

步骤1：进入棋盘后2秒
- 高亮一对可消除的图块（绿色脉冲边框）
- 左侧显示箭头指向高亮图块
- 不锁定操作，玩家可点击任意图块

步骤2：玩家选中第一个图块后
- 高亮第二个同类图块
- 显示"连接相同图块"小提示条（底部，2秒后自动消失）

步骤3：首次消除成功后
- 显示"+1步减少"提示（1.5秒后消失）
- 不再显示箭头

### 第1-2关（Combo引导）

- 第一次成功消除后1秒内再次消除：显示"COMBO! 快速连击获得更高分数"（顶部，2秒）
- 若错误点击（无路径）：显示"路径需≤2次转弯"（底部，1.5秒）

### 第1-3关（特殊图块引导，若有）

- 棋盘中首次出现特殊图块时：高亮该图块，显示其效果说明
- "⚡光波：消除同行所有图块！"

### 第4关起

- 无任何引导，纯玩法

## FTUEOverlay.js 接口

```js
export class FTUEOverlay {
  constructor(renderer)
  
  // 由 GameplayScene 在特定时机调用
  showHint(r1, c1, r2, c2, cellSize, offsetX, offsetY) // 高亮一对图块
  showText(msg, position)  // 'top' | 'bottom'，显示2秒后自动消失
  showArrow(x, y, direction) // 指向箭头（'right' | 'left' | 'up' | 'down'）
  hide()
  
  update(dt)
  draw()
  
  // 是否应该显示引导（检查 progress）
  static shouldShowFTUE(chapter, level, progress) { ... }
}
```

## 进度检查

- FTUE引导只在 chapter=1 且 level<=3 时激活
- `progress.ftueCompleted = true` 后不再显示任何引导
- 第1-3关通关后设置 `progress.ftueCompleted = true`

## 验收标准

1. `FTUEOverlay.js` 可在 GameplayScene 中实例化
2. 1-1关进入2秒后自动高亮一对图块，不锁定操作
3. 首次消除后提示条显示1.5秒后消失，不影响操作
4. 第4关及以后不显示任何引导元素
5. `ftueCompleted` 在localStorage中正确写入
