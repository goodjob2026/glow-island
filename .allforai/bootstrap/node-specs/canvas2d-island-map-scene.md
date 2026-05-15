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

## 小区域视觉修复（每5关一次渐变）

章节内每通过5关，对应章节的背景区域小范围"修复"（从灰白渐入彩色）：

```js
// 章节内修复层级：0/5/10/15/20/25/30 = 0%→100% 饱和度
// 每5关解锁一段颜色
const restoredLevels = progress.getChapterClearedCount(chapter); // 0-30
const saturation = Math.min(restoredLevels / 30, 1.0);          // 0→1
ctx.filter = `saturate(${saturation * 100}%)`;

// 视觉上：章节节点周围有一小块背景图像，代表该章节场景
// 灰白(未开始) → 半彩色(进行中) → 全彩(章节通关)
```

章节节点旁显示进度文字：`12/30` 表示已通12关。

## 章节完成庆典

通关章节最后一关（第30关）后，返回岛图时触发庆典动画：
1. 该章节节点发出金色爆发粒子（VFXSystem.showChapterUnlock）
2. 节点从灰白骤变全彩（saturate animation 0.5s）
3. SFX: `sfx_lighthouse_on`（Ch6）或 `sfx_level_complete`（其他章节）
4. 弹出章节完成对话（触发 DialogScene with chapter_outro key）

## 沙漏奖励快速入口

岛图右下角常驻沙漏图标：
- 可领取状态：发光动画，点击领取并显示"+N 沙滩币"粒子动画
- 冷却状态：灰色，显示"还需 Xh Ym"倒计时
- 点击→ SceneManager.push(ShopScene) 打开商店（商店内有完整沙漏UI）

```js
_drawHourglass() {
  const last = this._pm.getHourglassLastClaim();
  const ready = Date.now() - last >= 4 * 3600 * 1000;
  // 渲染沙漏图标（右下角），ready=true 时发光
}
```

## 顶部 HUD

```
[GLOW ISLAND]    [🪙 200]  [💎 0]  [🛍 商店]
```
- 左：游戏名
- 中：沙滩币（🪙）和丹青石（💎）双货币显示
- 右：商店快捷按钮

## 交互

- 点击已解锁章节节点 → SceneManager.go(LevelSelectScene, { chapter })
- 点击商店按钮 → SceneManager.push(ShopScene)
- 点击沙漏图标（可领取时）→ 直接领取奖励
- 底部：禅模式按钮（叶片图标）→ SceneManager.go(LevelSelectScene, { chapter, zenMode: true })
- 底部：设置图标（静音/BGM音量/SFX音量）

## 验收标准

1. `IslandMapScene.js` 可实例化，渲染6个章节节点
2. 未解锁章节呈灰白，当前章节有脉冲动画
3. 点击已解锁章节正确跳转到 LevelSelectScene
4. 顶部同时显示沙滩币（初始200）和丹青石（初始0）
5. 章节节点旁显示 "X/30" 进度，饱和度随进度插值
6. 沙漏图标在冷却结束后发光，可领取奖励
7. 商店按钮点击打开 ShopScene
