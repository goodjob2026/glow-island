---
node_id: canvas2d-island-map-scene
node: canvas2d-island-map-scene
goal: "实现岛屿地图场景：6章节点、视觉修复进度（灰白→彩色）、章节解锁"
capability: canvas2d-engineer
human_gate: false
hard_blocked_by:
  - canvas2d-scene-manager
  - canvas2d-asset-bundle
exit_artifacts:
  - "canvas2d-client/www/src/scenes/IslandMapScene.js"
---

# canvas2d-island-map-scene

## Mission

实现元游戏层岛屿地图，进度感来自视觉修复（灰白→饱和彩色）。

## 参考设计（.allforai/game-design/systems/meta-game.json）

philosophy: "元游戏层即岛屿地图本身——无独立技能树，进度感来自岛屿视觉修复"
visual_saturation_rule: "修复前灰白，每次修复后饱和度上升一阶，Ch6点灯后最高饱和"

## 布局

```
[GLOW ISLAND]              [COINS: 0]

  ┌─────────────────────────────┐
  │   [Ch6 灯塔] ───灰白         │
  │         │                   │
  │   [Ch5 温泉] ───灰白          │
  │         │                   │
  │   [Ch4 森林] ───灰白          │
  │         │                   │
  │   [Ch3 花田] ───灰白          │
  │         │                   │
  │   [Ch2 陶艺] ───灰白/半彩     │
  │         │                   │
  │ ★[Ch1 码头] ───彩色（当前）   │
  └─────────────────────────────┘
```

## 节点渲染

每章节点：
- 已完成章节：彩色圆形图标（带章节缩略背景图）+ 星评总分
- 当前章节：脉冲发光边框，点击进入关卡选择
- 未解锁章节：灰度圆形 + 锁图标
- 节点间连线：已通关段彩色虚线，未通关段灰色

## 饱和度规则

```js
// 灰度滤镜：未解锁章节
ctx.filter = 'grayscale(100%)';

// 当前章节：饱和度按通关关数插值
const pct = clearedLevels / 30;
ctx.filter = `saturate(${0.3 + pct * 0.7})`;

// 已完成章节：全彩
ctx.filter = 'none';
```

## 交互

- 点击已解锁章节节点 → SceneManager.go(LevelSelectScene, { chapter })
- 底部：设置图标（静音/音量）

## 验收标准

1. `IslandMapScene.js` 可实例化，渲染6个章节节点
2. 未解锁章节呈灰白，当前章节有脉冲动画
3. 点击已解锁章节正确跳转到 LevelSelectScene
4. 沙滩币余额显示在右上角
