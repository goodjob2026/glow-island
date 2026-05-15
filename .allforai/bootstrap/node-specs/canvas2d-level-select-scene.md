---
node_id: canvas2d-level-select-scene
node: canvas2d-level-select-scene
goal: "实现章节选关场景：30关网格、星评显示、解锁状态、关卡进入"
capability: canvas2d-engineer
human_gate: false
hard_blocked_by:
  - canvas2d-scene-manager
  - canvas2d-asset-bundle
exit_artifacts:
  - "canvas2d-client/www/src/scenes/LevelSelectScene.js"
---

# canvas2d-level-select-scene

## Mission

实现章节内30关选关界面，显示星评、解锁进度，点击进入对应关卡。

## 参数

由 SceneManager.go(LevelSelectScene, { chapter: 1 }) 传入：
- `chapter`: 1-6，当前所选章节

## 布局

```
[← 返回]     [第1章：码头]     [COINS: 0]

┌─────────────────────────────────────┐
│  ★★★   ★★☆   ★★★   ★☆☆   ...     │
│  [1]    [2]    [3]    [4]   [5]     │
│                                     │
│  ★★☆   ★☆☆   [🔒]   [🔒]  [🔒]   │
│  [6]    [7]    [8]    [9]   [10]    │
│  ...（共6行，每行5关，共30关）         │
└─────────────────────────────────────┘
```

## 关卡格子渲染

每格 (80×80px)：
- 已通关：圆角矩形底色(章节主题色) + 关卡编号 + 星评（☆☆☆~★★★）
- 当前解锁但未通关：脉冲发光边框 + 关卡编号
- 未解锁：灰色圆角矩形 + 🔒图标

章节主题色：
- ch1 码头：#4A90D9（海蓝）
- ch2 陶艺：#E8A87C（陶土橙）
- ch3 花田：#F0B4D4（樱粉）
- ch4 森林：#5BAD6F（苔绿）
- ch5 温泉：#C4A0D0（薰衣草紫）
- ch6 灯塔：#F5D76E（琥珀金）

## 星评计算

每关最高3星，来自 progress.stars["ch-lv"]（如 "1-3": 2）
- 显示 3 个星形图标，空心/实心

## 交互

- 点击已解锁关格 → SceneManager.go(GameplayScene, { chapter, level })
- 点击返回按钮 → SceneManager.pop()（回到 IslandMapScene）
- 画面可垂直滚动（如超过屏幕高度）

## 验收标准

1. `LevelSelectScene.js` 可实例化，接受 chapter 参数渲染30个格子
2. 未解锁格子显示锁图标，当前关卡有脉冲动画
3. 星评正确读取 ProgressManager 并显示
4. 点击已解锁关卡正确进入 GameplayScene
