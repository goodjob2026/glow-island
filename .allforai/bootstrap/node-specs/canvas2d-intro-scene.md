---
node_id: canvas2d-intro-scene
node: canvas2d-intro-scene
goal: "实现 Glow Island 3幕开场过场动画：渡轮甲板→抵岛码头→踏上木栈道→自然推进第1关"
capability: canvas2d-engineer
human_gate: false
hard_blocked_by:
  - canvas2d-scene-manager
  - canvas2d-asset-bundle
exit_artifacts:
  - "canvas2d-client/www/src/scenes/IntroScene.js"
---

# canvas2d-intro-scene

## Mission

按策划 FTUE 规格实现开场过场动画，零强制教程框、以视觉叙事代替弹窗说明。

## 参考设计（来自 .allforai/game-design/systems/ftue.json）

opening_sequence: "3幕过场动画（渡轮甲板→抵岛码头→踏上木栈道）→ 自然推进第一关棋盘"

## 幕结构

### 幕1：渡轮甲板（Act 1: Ferry Deck）
- 背景：海天渐变（深蓝→水蓝），画面从右向左缓慢平移（视差效果）
- 前景：栏杆轮廓（底部1/4）
- 文字淡入（0.8s fade-in）：
  - 日文: 「あの島に何かが残っているはずだ」（白字，居中）
  - 中文小字: 那座岛上，一定还留着什么

### 幕2：抵岛码头（Act 2: Arriving at Dock）
- 背景：ch01_harbor_before.png 全屏，轻微放大（1.0→1.05 over 3s）
- 前景：码头木桩轮廓（图形绘制）
- 文字：「輝島（かがやきじま）」（标题字号），淡入后静止1.5s

### 幕3：踏上木栈道（Act 3: Stepping onto Boardwalk）
- 背景继续放大，重心下移（模拟走近）
- 磯部健三出现（简单文字气泡）：「ようこそ、輝島へ。」/ 欢迎来到輝岛。
- 屏幕底部：「点击继续」（脉冲动画）

### 过渡
- 点击后：黑色淡出(0.5s) → SceneManager.go(IslandMapScene)

## 实现要点

- 每幕持续约3s，用户可点击跳过（快进到下一幕，第3幕点击直接结束）
- 文字渲染用 Renderer.text()，背景用 Renderer.image()
- 幕与幕之间用白色半透明遮罩(0.3s)过渡
- 第一次运行后记录 progress.introSeen = true，重进游戏跳过此场景直接进岛屿地图

## 验收标准

1. `IntroScene.js` 可被 SceneManager 实例化，`update(dt)` 和 `draw()` 正常调用
2. 3幕按顺序展示，每幕有文字和背景
3. 点击可正确推进幕，第3幕点击后跳转到 IslandMapScene
4. `progress.introSeen` 在浏览器 localStorage 中写入
