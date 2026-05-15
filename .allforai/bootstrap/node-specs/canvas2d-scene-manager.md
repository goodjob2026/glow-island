---
node_id: canvas2d-scene-manager
node: canvas2d-scene-manager
goal: "实现 Canvas2D 场景管理器、进度管理器（localStorage）、音频管理器骨架"
capability: canvas2d-engineer
human_gate: false
hard_blocked_by: []
exit_artifacts:
  - "canvas2d-client/www/src/SceneManager.js"
  - "canvas2d-client/www/src/ProgressManager.js"
  - "canvas2d-client/www/src/AudioManager.js"
---

# canvas2d-scene-manager

## Mission

为 Glow Island canvas2d-client 实现核心基础设施：场景路由、进度持久化、音频管理。

## 技术约束

- 纯 ES Modules，零依赖，零构建
- 所有文件在 `canvas2d-client/www/src/` 下
- 通过 `import` 互相引用，入口为 `main.js`

## SceneManager.js

```js
// 管理当前场景，提供 push/pop/replace 导航
export class SceneManager {
  constructor(renderer, assets, audio, progress) { ... }
  
  go(SceneClass, params = {})   // 替换当前场景
  push(SceneClass, params = {}) // 压栈（返回时恢复）
  pop()                          // 弹栈
  
  // 场景切换：淡出(0.3s) → 实例化新场景 → 淡入(0.3s)
  // 每个场景有 update(dt) 和 draw() 方法
}
```

## ProgressManager.js

```js
export class ProgressManager {
  // 数据结构存 localStorage key: 'glow-island-save'
  // 初始状态（首次安装）：
  // {
  //   chapter: 1,              // 当前解锁章节 (1-6)
  //   level: 1,                // 章节内当前关卡 (1-30)
  //   stars: {},               // { "1-1": 3, "1-2": 2, ... }
  //   coins: 200,              // 沙滩币（初始赠送 200）
  //   glowstone: 0,            // 丹青石（硬货币，IAP 获取）
  //   hourglassLastClaim: 0,   // timestamp ms，沙漏上次领取时间
  //   zenBestCombo: 0,         // 禅模式最佳连击数
  //   lastSaved: "<ISO>",
  //   lastSynced: null,        // 云同步时间（ApiClient 写入）
  // }
  
  load()
  save()
  getMaxUnlocked()           // { chapter, level }
  isLevelUnlocked(ch, lv)   // bool
  setStars(ch, lv, n)
  addCoins(n)
  getCoins()                 // 返回 this._data.coins
  addGlowstone(n)            // 增加丹青石
  getGlowstone()             // 返回 this._data.glowstone
  getHourglassLastClaim()    // 返回 timestamp ms
  setHourglassLastClaim(ts)  // 写入并 save()
  updateZenBestCombo(n)      // 仅当 n > zenBestCombo 时更新
  markSynced()               // 写入 lastSynced = now, save()
  
  // 章节进度统计（供 IslandMapScene 用于饱和度渐变）
  getChapterClearedCount(chapter)  // 返回该章节已通关数 0-30
  // 实现：遍历 stars 中 key 为 "${chapter}-*" 的条目，返回 count

  // 初始数据（_defaultData）
  // coins 初始值必须为 200，不能为 0
  _defaultData() {
    return {
      chapter: 1, level: 1, stars: {},
      coins: 200,           // ← 初始赠送 200 沙滩币
      glowstone: 0,
      hourglassLastClaim: 0,
      zenBestCombo: 0,
      lastSaved: new Date().toISOString(),
      lastSynced: null,
    };
  }
}
```

## AudioManager.js

```js
// Web Audio API 骨架，实际音频在 canvas2d-audio 节点加载
export class AudioManager {
  constructor()
  
  loadBGM(key, url)   // fetch + decodeAudioData, 缓存
  loadSFX(key, url)
  playBGM(key, loop = true, volume = 0.6)
  stopBGM()
  playSFX(key, volume = 1.0)
  setMasterVolume(v)  // 0-1
  mute(bool)
}
```

## main.js 更新

将现有 `main.js` 重构为 SceneManager 入口：
- 初始化 Renderer、AssetLoader、AudioManager、ProgressManager、SceneManager
- 游戏循环委托给 SceneManager.update() / SceneManager.draw()
- 触摸/点击事件转发给当前场景

## 场景接口规范

所有场景类必须实现以下方法，SceneManager 将调用它们：

```js
class AnyScene {
  constructor(sceneManager, renderer, assets, audio, progress)
  init(params = {})   // 场景激活时调用，接收导航参数
  update(dt)          // 每帧更新，dt 单位秒
  draw()              // 每帧渲染
  destroy()           // 场景销毁时调用：清理计时器、取消事件监听、重置状态
  onTap(x, y)         // 触控/点击事件（逻辑坐标）
  onBack()            // Android 返回键（弹出确认面板）
  resize(w, h)        // 窗口尺寸变化（逻辑尺寸）
}
```

`destroy()` 是强制接口：SceneManager.go()/pop() 时必须调用旧场景的 destroy()，以防计时器泄漏。

## 验收标准

1. `SceneManager.js` 可 import，`go()` 方法切换场景时有淡入淡出，且调用旧场景 `destroy()`
2. `ProgressManager.js`：save/load roundtrip 正确；`load()` 首次调用时 coins=200（初始状态）
3. `AudioManager.js`：构造时不报错，Web Audio API 可用时静默初始化
4. `main.js` 启动后在浏览器 console 无报错，游戏画面正常渲染
5. `ProgressManager.getCoins()` 初始返回 200，`getGlowstone()` 初始返回 0
