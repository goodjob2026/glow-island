---
node_id: canvas2d-gameplay-scene
node: canvas2d-gameplay-scene
goal: "实现连连看核心玩法场景：BFS路径、步数制、Combo计时、5种特殊图块、星评结算"
capability: canvas2d-engineer
human_gate: false
hard_blocked_by:
  - canvas2d-scene-manager
  - canvas2d-asset-bundle
  - canvas2d-level-data
exit_artifacts:
  - "canvas2d-client/www/src/scenes/GameplayScene.js"
  - "canvas2d-client/www/src/game/TileGrid.js"
  - "canvas2d-client/www/src/game/ComboSystem.js"
  - "canvas2d-client/www/src/game/SpecialTiles.js"
---

# canvas2d-gameplay-scene

## Mission

实现完整连连看玩法：格子连接消除、步数扣减、Combo加速、5种特殊图块触发、关卡通关/失败结算。

## 连连看规则

### 路径规则（BFS）
- 两个相同类型图块之间存在路径：经过空格（已消除格），转弯次数 ≤ 2
- 允许在格子区外1格的边框区域走（即路径可绕到棋盘边框外）
- 路径不能穿过未消除的图块
- 路径不能穿过非活跃格（棋盘形状空洞）

```js
// BFS状态：(row, col, direction, turnsUsed)
// direction: -1(起始) | 0上 | 1下 | 2左 | 3右
// turnsUsed: 0-2

// 格子三态
// null  → 非活跃格（形状轮廓外/内部空洞）：路径不可穿越
// 0     → 活跃空格（图块已消除）：路径可穿越
// 1-10  → 活跃图块：阻挡路径（终点除外）

// 可走判断
function canWalk(r, c, grid, layout) {
  if (r < -1 || r > ROWS || c < -1 || c > COLS) return false; // 超出边框
  if (r === -1 || r === ROWS || c === -1 || c === COLS) return true; // 边框走廊
  if (layout[r][c] === 0) return false; // 非活跃格，不可走
  return grid[r][c] === 0; // 活跃空格才可走
}
```

### 棋盘布局（异形 + 随机）

关卡数据的 `layoutPool` 包含1-5个同主题形状变体；`getLevel()` 在调用时随机选1个并随机镜像/旋转，返回最终 `layout` 字符串数组给 TileGrid。

- `'X'` = 活跃格（可放图块）
- `'_'` = 非活跃格（形状空洞，路径不可穿越）

ROWS/COLS 从 layout 数组的行数/列数推算。

图块生成时只在活跃格（layout='X'）放置，确保总数为偶数，成对出现。

### 特殊图块随机落点

关卡的 `specials: [{ type: 6, count: 1 }]` 只指定类型和数量，不指定位置。
`_init()` 在 Fisher-Yates shuffle 后，将前 N 个图块替换为对应特殊类型：

```js
_init(levelData) {
  const activeCells = /* 解析layout，收集所有活跃格 (r,c) 列表 */;
  const total = activeCells.length; // 必须为偶数
  
  // 生成配对图块
  let types = [];
  for (let i = 0; i < total / 2; i++) types.push((i % levelData.types) + 1, (i % levelData.types) + 1);
  shuffle(types); // Fisher-Yates
  
  // 替换特殊图块（随机位置）
  for (const { type, count } of (levelData.specials || [])) {
    for (let n = 0; n < count; n++) {
      const idx = Math.floor(Math.random() * types.length);
      types[idx] = type; // 随机替换一个图块为特殊类型
    }
  }
  
  // 填入棋盘
  activeCells.forEach(({r, c}, i) => { this.grid[r][c] = types[i]; });
}
```

### cellSize 自适应缩放

棋盘整体始终填满 HUD 以下的可用区域，不滚动：

```js
// 设计分辨率 390×844，HUD 80px，底部操作区 60px
const playW = renderer.lw - 32; // 左右各16px边距
const playH = renderer.lh - 80 - 60;
const cellSize = Math.floor(Math.min(playW / COLS, playH / ROWS));
// 棋盘居中绘制
const offsetX = Math.round((renderer.lw - cellSize * COLS) / 2);
const offsetY = 80 + Math.round((playH - cellSize * ROWS) / 2);
```

## 步数制

- 每关有固定步数上限（来自关卡数据，默认60步）
- 每次成功消除一对：步数-1
- 步数归零还有图块未消除 → 失败
- HUD右上角显示剩余步数

## Combo 系统

```
连续消除间隔 < 2秒 → Combo +1
Combo 1x → 普通分数
Combo 2x → 分数×1.5
Combo 3x → 分数×2，屏幕边缘金色光效
Combo 4x+ → 分数×3，"FEVER!" 大字特效
超过2秒无操作 → Combo 归零
```

ComboSystem.js 接口：
```js
export class ComboSystem {
  constructor()
  onMatch()          // 每次消除成功调用，返回 { combo, multiplier }
  onMiss()           // 消除失败或超时，重置combo
  getCombo()         // 当前combo数
  getTimeLeft()      // 距离combo超时剩余秒数
  update(dt)         // 每帧更新计时
}
```

## 5种特殊图块

特殊图块由关卡数据指定初始位置，或由消除触发生成。

### 1. 光波 (Light Wave) — type=6
- 消除时：消除同行所有图块（无视路径）
- 视觉：图块带波纹光环图案

### 2. 光链 (Light Chain) — type=7
- 消除时：消除与之相邻的所有同类图块（链式）
- 视觉：图块带连接节点图案

### 3. 穿透 (Pierce) — type=8
- 消除时：可与任意一个图块配对（无需同类型），路径仍需BFS合法
- 视觉：图块带箭头穿透图案

### 4. 置换 (Swap) — type=9
- 消除时：将目标位置的图块类型与自身交换后再消除
- 视觉：图块带双向箭头图案

### 5. 连锁 (Cascade) — type=10
- 消除时：触发额外一次随机合法消除
- 视觉：图块带星爆图案

SpecialTiles.js 接口：
```js
export class SpecialTiles {
  static applyEffect(type, r, c, grid)  // 返回额外消除的格子列表 [{r,c}]
}
```

## HUD 布局

```
[← 退出]   第1章-第1关    步数: 60    [提示]
                                    [重排]
   [棋盘区域：8×10格]

SCORE: 0        COMBO: ×1        [沙滩币辅助按钮]
```

## 沙滩币辅助（场外）

- 重排（Shuffle）：15沙滩币，重新随机排列棋盘
- 预判（Hint）：10沙滩币，高亮一对可消除的图块5秒
- 续关（Continue）：30沙滩币，失败时追加20步

## 结算面板

### 胜利
```
    ★★★（三星满分条件：步数剩余≥30%）
    ★★☆（二星：步数剩余10%-30%）
    ★☆☆（一星：步数耗尽前消清）
    
    得分: 12,480
    [下一关]  [返回岛图]
```

### 失败
```
    步数耗尽…
    [续关 30币]  [重试]  [退出]
```

## 场景参数

由 SceneManager.go(GameplayScene, { chapter, level }) 传入，
从 LevelData.getLevel(chapter, level) 加载关卡配置。

## 验收标准

1. `TileGrid.js` BFS路径：转弯≤2、边框绕行、非活跃格阻挡路径（不可穿越）
2. 异形棋盘：layout mask 正确解析，非活跃格不放图块，图块只落在活跃格
3. cellSize 自适应：任意 layout 尺寸的棋盘都完整显示在屏幕内，不截断不滚动
4. `ComboSystem.js`：2秒计时器，倍率1→1.5→2→3正确
5. `SpecialTiles.js`：5种效果各自触发正确
6. `GameplayScene.js`：步数归零弹出失败面板，全消弹出胜利面板
7. 星评根据剩余步数百分比正确计算并写入 ProgressManager
8. 沙滩币辅助按钮扣除币后生效
