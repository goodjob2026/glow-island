---
node_id: canvas2d-zen-mode
node: canvas2d-zen-mode
goal: "实现禅模式：无步数限制、无失败、使用专属 BGM、保留 Combo 和特殊图块"
capability: canvas2d-engineer
human_gate: false
hard_blocked_by:
  - canvas2d-gameplay-scene
exit_artifacts:
  - "canvas2d-client/www/src/scenes/ZenGameplayScene.js"
---

# canvas2d-zen-mode

## Mission

实现禅模式，复用 GameplayScene 核心逻辑，移除压力元素（步数上限、失败态）。
适合放松游玩，保留 Combo 和特殊图块的策略层。

## 设计原则（来自 product-concept.json）

```
zen_mode: {
  enabled: true,
  no_step_limit: true,
  no_failure_state: true,
  keeps_combo: true,
  keeps_specials: true,
  removes_obstacles: true,       // 障碍物不生效（障碍物给有压力感）
  removes_board_events: true     // 水流/蔓延等动态障碍不触发
}
```

## 实现方案：GameplayScene 内置 zenMode 参数

**不使用 extends**（GameplayScene 未按可继承基类设计，私有状态无法干净覆盖）。
改为：GameplayScene.init() 原生支持 `zenMode` 参数，ZenGameplayScene 是独立场景类，内部创建并代理 GameplayScene 实例。

### GameplayScene 需要的改动（在 canvas2d-gameplay-scene 节点实现时必须包含）

```js
// GameplayScene.init() 新增 zenMode 分支
init(params = {}) {
  const levelData = getLevel(params.chapter, params.level);
  this._zenMode = params.zenMode || false;
  
  // 步数：禅模式无限
  this._steps = this._zenMode ? Infinity : levelData.steps;
  this._maxSteps = levelData.steps;
  
  // 障碍物：禅模式不初始化
  if (!this._zenMode && levelData.obstacles?.length) {
    this._obstacles = new ObstacleSystem(this._grid, levelData);
    this._obstacles.init(levelData);
  } else {
    this._obstacles = null;
  }
  
  // BGM 由外部（ZenGameplayScene）在 init 后覆盖
}

// _drawHUD() 内部分支
_drawHUD() {
  if (this._zenMode) {
    // 显示 "∞" 叶片图标，不显示步数进度条
    ctx.fillText('∞', centerX, topY);
  } else {
    // 正常步数进度条
  }
}

// _checkFailure() 内部分支
_checkFailure() {
  if (this._zenMode) return false;  // 永不触发失败
  return this._steps <= 0;
}

// _onVictory() 内部分支
_onVictory() {
  if (this._zenMode) {
    // 简单完成动画，不显示星评
    // 显示 [再来一局] [返回] 面板
  } else {
    // 正常星评结算面板
  }
}
```

### ZenGameplayScene 实现

```js
export class ZenGameplayScene {
  constructor(sceneManager, renderer, assets, audio, progress) {
    this._sm = sceneManager;
    this._renderer = renderer;
    this._assets = assets;
    this._audio = audio;
    this._pm = progress;
    // 内部持有一个 GameplayScene 实例，以 zenMode=true 运行
    this._inner = new GameplayScene(sceneManager, renderer, assets, audio, progress);
  }
  
  init(params = {}) {
    this._inner.init({ ...params, zenMode: true });
    // 覆盖 BGM 为禅模式专属
    this._audio.playBGM('bgm_zen_ambient');
  }
  
  update(dt) { this._inner.update(dt); }
  draw()     { this._inner.draw(); }
  destroy()  { this._inner.destroy(); }
  onTap(x, y) { this._inner.onTap(x, y); }
  onBack()   { this._inner.onBack(); }
  resize(w, h) { this._inner.resize(w, h); }
}
```

## 禅模式入口

从岛屿地图底部设置区域进入：
```
[岛图] → 底部 [禅模式] 按钮（叶片图标）→ 选关界面（禅模式标签）→ ZenGameplayScene
```

或从关卡选择界面右上角切换：
```
LevelSelectScene → 右上角 [☯ 禅模式] 切换按钮 → 同一关卡以禅模式进入
```

## HUD 外观差异

| 元素 | 普通模式 | 禅模式 |
|------|---------|--------|
| 步数显示 | "步数: 45/80" 进度条 | "∞" 叶片图标 |
| 分数 | 显示 | 显示 |
| Combo | 显示 | 显示 |
| 星评结算 | 3星评分面板 | 简单完成动画 |
| 背景色调 | 章节主题色 | 柔和化处理（+10%亮度，-10%饱和度）|

## 存档

禅模式不计入关卡进度，不写入 stars。
仅记录"禅模式最长连击数"（`zenBestCombo`）到 progress：
```js
// ProgressManager 新增字段
{ zenBestCombo: 0 }
updateZenBestCombo(n) { if (n > this._data.zenBestCombo) { this._data.zenBestCombo = n; this.save(); } }
```

## 验收标准

1. `ZenGameplayScene.js` 可实例化，使用 bgm_zen_ambient BGM
2. HUD 显示 "∞" 而非步数进度条
3. 消除图块不减少步数（内部 `_steps === Infinity`）
4. 不触发失败面板（即使尝试注入步数归零也不失败）
5. 消清所有图块显示完成动画（[再来一局] [返回] 两个按钮）
6. 障碍物不初始化（`this._obstacles === null`），棋盘无障碍覆盖层
