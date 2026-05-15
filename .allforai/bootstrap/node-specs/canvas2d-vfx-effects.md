---
node_id: canvas2d-vfx-effects
node: canvas2d-vfx-effects
goal: "实现游戏全量特效：路径连线、图块消除、炸弹爆炸、风车十字扫、Combo爆光、章节解锁粒子"
capability: canvas2d-engineer
human_gate: false
hard_blocked_by:
  - canvas2d-gameplay-scene
exit_artifacts:
  - "canvas2d-client/www/src/game/VFXSystem.js"
---

# canvas2d-vfx-effects

## Mission

实现所有 Canvas2D 特效，基于 vfx-spec.json 设计。特效是纯 Canvas2D 绘制，不依赖任何外部库。

## VFXSystem.js 接口

```js
export class VFXSystem {
  constructor(renderer)
  
  // 每帧更新所有活跃特效
  update(dt)
  
  // 在 draw() 中调用，绘制在棋盘层之上
  draw()
  
  // 特效触发方法（返回 Promise，完成时 resolve）
  showPath(points, color)            // 路径连线
  showTileVanish(r, c, cellSize, ox, oy)  // 图块消除淡出
  showBomb(centerR, centerC, cellSize, ox, oy)    // 炸弹3×3爆炸
  showWindmill(row, col, cols, rows, cellSize, ox, oy)  // 风车十字扫
  showLanternConnect(r1,c1,r2,c2, cellSize, ox, oy)    // 灯光连线
  showWaveReshuffle(cols, rows, cellSize, ox, oy)       // 海浪重排波纹
  showComboText(combo, multiplier, x, y)  // Combo 数字弹出
  showFEVER(canvasW, canvasH)             // Combo 4+ 全屏效果
  showChapterUnlock(chapter)              // 章节解锁粒子庆典
  showTileShake(r, c, cellSize, ox, oy)  // 无效点击震动
  showSelectionGlow(r, c, cellSize, ox, oy)  // 选中脉冲光晕
}
```

## 特效规格

### 1. 路径连线（showPath）

- 触发：两图块成功配对、消除前
- 持续：300ms
- 渲染：沿 BFS 路径绘制虚线（`setLineDash([8,4])`），颜色 `#FFE566`，lineWidth=3
- 动画：虚线 dashOffset 从0→16，产生流动感

```js
showPath(points) {
  // points: [{x,y}] 路径中心点列表（从起点格中心到终点格中心）
  // 300ms 内持续绘制，alpha 0.8 → 0
}
```

### 2. 图块消除淡出（showTileVanish）

- 触发：路径连线结束后
- 持续：350ms
- 渲染：图块缩放+淡出（scale 1.0→1.3→0，alpha 1→0），中心散出4个光点粒子
- 粒子：4个小圆，向四角飞散，半径 4px，颜色与图块匹配

### 3. 炸弹爆炸（showBomb）

- 触发：Bomb 图块被消除
- 持续：500ms
- 渲染：
  - 0-100ms：中心闪光圆扩大（半径 0→cellSize×1.5），白色
  - 100-300ms：冲击波环扩散（半径继续增大），橙色，alpha 淡出
  - 0-500ms：粒子从中心向8个方向飞散（8个小圆，随机速度）
  - 被波及的3×3格子依次触发 showTileVanish（有50ms间隔）

### 4. 风车十字扫（showWindmill）

- 触发：Windmill 图块被消除
- 持续：400ms
- 渲染：
  - 从风车格同时向左右扩展光柱（宽度=cellSize，高度渐细）
  - 同时向上下扩展光柱
  - 光柱颜色：金黄 `#FFD700`，alpha 1→0
  - 被光柱扫过的格子触发 showTileVanish（按扫过顺序，10ms/格间隔）

### 5. 灯光自动连线（showLanternConnect）

- 触发：Lantern 找到目标时
- 持续：300ms
- 渲染：从灯光格向目标格发出弧形光束，颜色 `#FFB347`，粗细 4px
- 光束沿路径飞行（不是直线，按BFS路径弯曲），抵达后双方触发 showTileVanish

### 6. 海浪重排（showWaveReshuffle）

- 触发：Wave 图块被消除
- 持续：600ms
- 渲染：蓝色波纹从左向右扫过整个棋盘区域（3条波纹，间隔 60px，高度=棋盘高）
- 波纹过后图块位置变换完成

### 7. Combo 文字弹出（showComboText）

- 触发：Combo ≥ 2 时每次消除
- 持续：1200ms
- 渲染：
  - Combo 数字从消除格正上方弹出，向上飘动 40px 后消失
  - 字号随 combo 增大：combo2=24px，combo3=32px，combo4=48px
  - 颜色：combo2=白，combo3=金，combo4=橙红
  - scale 从 0→1.2→1.0（0-200ms 弹入），然后静止，最后 alpha 1→0

### 8. FEVER 全屏效果（showFEVER）

- 触发：Combo 达到4时
- 持续：2000ms（或直到 combo 归零）
- 渲染：
  - 屏幕四角发出金色渐变光芒（向中心渐隐）
  - 中央出现 "FEVER!" 文字，字号 64px，金色，带白色描边
  - 文字 scale 1.5→1.0（弹入），持续到 combo 归零后 alpha 淡出
  - 棋盘背景轻微金色覆盖层（alpha 0.15）

### 9. 章节解锁粒子（showChapterUnlock）

- 触发：新章节首次解锁（通关30关后）
- 持续：3000ms
- 渲染：
  - 从屏幕中央爆发 60 个粒子（彩色，章节主题色为主）
  - 粒子从中心向外飞散，带重力下落，尾迹渐隐
  - 配合"章节解锁"文字弹出（章节名称，64px）
  - SFX: `sfx_lighthouse_on`（Ch6时），`sfx_level_complete`（其他章节）

### 10. 选中脉冲光晕（showSelectionGlow）

- 触发：图块被选中时持续渲染
- 渲染：图块边框持续脉冲（border 宽度 3→5→3px，白色，频率 2Hz）
- 取消：点击另一格或消除时停止

### 11. 无效点击震动（showTileShake）

- 触发：路径不通时
- 持续：300ms
- 渲染：图块水平位移 ±4px，频率 5Hz（共3个周期），sin 曲线缓动

## 粒子通用引擎

```js
class Particle {
  constructor(x, y, vx, vy, color, radius, lifetime)
  update(dt) { /* 积分位置，减少lifetime */ }
  draw(ctx)
}

// VFXSystem 内部维护 particles 数组
// update(): particles.forEach(p => p.update(dt))
// draw(): 先 clear particles，再 particles.forEach(p => p.draw(ctx))
```

## 验收标准

1. `VFXSystem.js` 可实例化，update/draw 可安全调用（空列表不报错）
2. showPath：路径虚线流动可见，300ms 后自动消失
3. showBomb：冲击波环 + 8方向粒子，3×3 区域图块依次淡出
4. showWindmill：横竖双光柱同时扫，被扫格图块按顺序消失
5. showComboText：combo4 时 48px 橙红文字从格上方弹出飘走
6. showFEVER：屏幕四角金光 + 中央 "FEVER!" 文字可见
7. showChapterUnlock：60粒子爆发 + 章节名文字，3秒内完成
8. 所有特效结束后不留残影（自动清理粒子列表）
