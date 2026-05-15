---
node_id: canvas2d-gameplay-scene
node: canvas2d-gameplay-scene
goal: "实现连连看核心玩法：BFS路径+Portal零转弯+异形棋盘+Combo生成特殊图块+4种关卡目标+步数结算"
capability: canvas2d-engineer
human_gate: false
hard_blocked_by:
  - canvas2d-scene-manager
  - canvas2d-asset-bundle
  - canvas2d-level-data
  - canvas2d-obstacles
exit_artifacts:
  - "canvas2d-client/www/src/scenes/GameplayScene.js"
  - "canvas2d-client/www/src/game/TileGrid.js"
  - "canvas2d-client/www/src/game/ComboSystem.js"
  - "canvas2d-client/www/src/game/SpecialTiles.js"
---

# canvas2d-gameplay-scene

## Mission

实现完整连连看玩法，严格对照 `.allforai/game-design/puzzle-mechanics-spec.json`。

---

## 1. BFS 路径规则（来自 path_rules）

- 两格可连条件：类型相同 + 路径转弯 ≤ 2 + 不穿过已占用格
- 棋盘外1格边框走廊可通行
- 已消除的活跃格（值=0）可通行
- 非活跃格（layout='_'，值=null）不可通行（形状空洞）

### Portal 障碍物 BFS（零转弯代价）

```js
// Portal 格子：进入时坐标跳至出口，方向和 turns 不变
if (grid[nr][nc] === OBSTACLE.portal) {
  const exit = levelData.portalMap[`${nr},${nc}`]; // {r, c}
  queue.push({ r: exit.r, c: exit.c, dir: newDir, turns: newTurns, path: [...] });
  continue; // 不再以 (nr,nc) 继续扩展
}
```

### 格子三态

```
null  → 非活跃格（layout 空洞）：不可走，不放图块
0     → 活跃空格（已消除 or 初始空格）：路径可穿越
1-5   → 普通图块（阻断路径，除终点外）
6     → 炸弹（Bomb）
7     → 风车（Windmill）
8     → 灯光（Lantern）
9     → 海浪（Wave）
100+  → 障碍物覆盖层（见 canvas2d-obstacles）
```

---

## 2. 特殊图块（来自 special_blocks，设计文档权威）

### Bomb（炸弹） type=6

- 生成：3-Combo 时系统自动在棋盘随机活跃格生成1个；或关卡预置
- 效果：消除以炸弹格为中心 3×3 范围内所有图块（无视路径，无视障碍覆盖层）
- 动画：0.5s 爆炸粒子 + 冲击波环扩散，SFX: `sfx_special_bomb`

### Windmill（风车） type=7

- 生成：4-Combo 时系统自动生成1个；或关卡预置
- 效果：消除风车格所在整行 + 整列（十字消除，同时触发）
- 动画：0.4s 横竖双光柱扫过，SFX: `sfx_special_windmill`

### Lantern（灯光） type=8

- 生成：仅关卡预置，不可由 Combo 生成
- 效果：自动寻路连接最近同类型图块并消除；若无可达同类则持续脉冲等待
- 动画：0.3s 发光连线飞向目标，SFX: `sfx_special_light`

### Wave（海浪） type=9

- 生成：仅关卡预置，不可由 Combo 生成
- 效果：重排棋盘所有图块位置（类型数量不变）；重排后若仍无合法对则再次重排（最多3次）
- 动画：波浪扫过整盘，SFX: `sfx_special_wave`

### Combo → 特殊图块生成逻辑

```js
// ComboSystem.onMatch() 返回后检查
const { combo } = comboSystem.onMatch();
if (combo === 3) spawnSpecial(BOMB, randomActiveCell());
if (combo === 4) spawnSpecial(WINDMILL, randomActiveCell());
// 5+ combo: 继续累加分数倍率，不再额外生成

function randomActiveCell() {
  // 从空活跃格（grid[r][c]===0）中随机选一个
  const empties = activeCells.filter(({r,c}) => grid[r][c] === 0);
  return empties[Math.floor(Math.random() * empties.length)];
}
```

---

## 3. 棋盘尺寸（严格按设计文档）

| 章节 | 棋盘 | 最大活跃格 | 说明 |
|------|------|-----------|------|
| Ch1 | **6×6** | ≤36 | 入门，layout空洞后活跃格更少（约22-28） |
| Ch2 | **7×7** | ≤49 | 含障碍层 |
| Ch3 | **8×8** | ≤64 | |
| Ch4 | **8×8** | ≤64 | |
| Ch5 | **9×9** | ≤81 | |
| Ch6 | **10×10** | 100格 |

---

## 4. Combo 系统

```
消除间隔 < 2秒 → Combo +1
Combo 1x → 分数×1.0
Combo 2x → 分数×1.5，音效增强
Combo 3x → 分数×2.0，特效升级 + 生成 Bomb
Combo 4x → 分数×3.0，屏幕震动 + 粒子爆发 + 生成 Windmill
超过2秒无操作 → Combo 归零
```

```js
export class ComboSystem {
  onMatch()       // 返回 { combo, multiplier }，内部处理计时重置
  onMiss()        // 错误点击，combo 不重置（只有超时重置）
  update(dt)
  getCombo()
  reset()         // 场景退出时调用
}
```

---

## 5. 关卡目标（4种，来自 level_completion）

关卡数据中 `goal` 字段指定：

```js
// goal 类型
{ type: 'tile_target',    target_type: 2, required_count: 10 }  // 消除10个type=2图块
{ type: 'obstacle_clear', obstacle_type: 'ice_block', required_clear_count: 5 }
{ type: 'score_target',   required_score: 5000 }
{ type: 'clear_all' }  // 默认：消清所有图块（前期章节）
```

HUD 显示当前目标进度，不同目标有不同进度条样式。

---

## 6. 计分

```
base_score_per_match = 100
score = base_score_per_match × combo_multiplier
结算时剩余步数每步 +50分
```

---

## 7. 星评（统一标准，来自 scoring.star_rating）

**所有章节统一：**
- ★☆☆：完成关卡目标（任意步数）
- ★★☆：完成目标 + 剩余步数 ≥ **20%** 上限
- ★★★：完成目标 + 剩余步数 ≥ **40%** 上限

---

## 8. 沙滩币辅助（正确费用）

```
续关（Continue）：30沙滩币，追加 +5步（不是+20）
重排（Reshuffle）：30沙滩币，保证新布局有合法对
预判（Hint）：10沙滩币，高亮最优下一步，持续3秒（不是5秒）
```

---

## 9. hasMoves 死局处理

```js
// 每次消除后检查
if (!tileGrid.hasMoves() && !tileGrid.isCleared()) {
  // 显示提示："棋盘无法继续，自动重排？"
  // 玩家可选：免费重排一次（本关首次免费）/ 花30币再排
  autoReshuffleIfNeeded();
}
```

棋盘生成后也必须验证（`_init()`最后调用`hasMoves()`，若为false则重新生成，最多尝试10次）。

---

## 10. 场景生命周期

```js
export class GameplayScene {
  init(params)    // 初始化，从 LevelData 加载配置
  update(dt)
  draw()
  resize(w, h)    // 重新计算 cellSize
  destroy()       // 清理：comboSystem.reset()，取消所有计时器，释放事件监听
  onTap(x, y)
  onBack()        // Android 返回键 → 弹出暂停/退出确认
}
```

---

## 11. cellSize 自适应

```js
// 设计分辨率 390×844，HUD 80px，底部操作区 60px
const playW = renderer.lw - 32;
const playH = renderer.lh - 80 - 60;
const cellSize = Math.floor(Math.min(playW / COLS, playH / ROWS));
const offsetX  = Math.round((renderer.lw - cellSize * COLS) / 2);
const offsetY  = 80 + Math.round((playH - cellSize * ROWS) / 2);
```

---

## 12. 多触点保护

只处理第一个触点，忽略后续同时触点：

```js
canvas.addEventListener('pointerdown', e => {
  if (e.isPrimary === false) return; // 忽略非主触点
  // ... 处理点击
});
```

---

## 13. 测试钩子（测试模式必须暴露，勿省略）

ios-build WebKit 触控坐标验证 和 audio-qa 需要两个全局钩子，**必须在构造/初始化时注入**：

```js
// GameplayScene.onTap(x, y) 首行（DPR 映射测试用）
if (typeof window !== 'undefined') window._lastTap = { x, y };
```

```js
// AudioManager constructor 最后一行（audio-qa 需要访问实例）
if (typeof window !== 'undefined') window._audioManager = this;
```

---

## 14. Zen Mode 接口约定（zen-mode 节点依赖此接口）

`GameplayScene.init()` 必须接受 `zenMode` 参数：

```js
init(params = {}) {
  this._zenMode = params.zenMode === true;
  this._steps = this._zenMode ? Infinity : levelData.steps;
  // ...
}
```

HUD 绘制：
```js
// _drawHUD()
const stepsText = this._zenMode ? '∞' : String(this._steps);
```

失败检测：
```js
_checkFailure() {
  if (this._zenMode) return false; // 禅模式不触发失败
  return this._steps <= 0 && !this._tileGrid.isCleared();
}
```

结算面板（禅模式）：无星评数字，显示"再来一局"按钮，写入 `ProgressManager.updateZenBestCombo()`。

---

## 验收标准

1. BFS 路径：转弯≤2、边框走廊、非活跃格阻断、Portal 零转弯代价
2. 特殊图块：Bomb(3×3消除)、Windmill(十字消除)、Lantern(自动连接)、Wave(重排最多3次)
3. Combo 3 → 生成 Bomb，Combo 4 → 生成 Windmill
4. 棋盘尺寸：Ch1=6×6、Ch2=7×7、Ch3-4=8×8、Ch5=9×9、Ch6=10×10
5. 星评：2星≥20%步数剩余，3星≥40%，所有章节统一
6. 续关+5步/30币，重排30币，预判3秒/10币
7. hasMoves=false 自动提示重排，生成时校验有效性
8. destroy() 清理所有计时器和监听器
9. 多触点只处理 isPrimary
10. onBack() 弹出退出确认面板
