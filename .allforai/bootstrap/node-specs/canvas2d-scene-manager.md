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
  // {
  //   chapter: 1,        // 当前解锁章节 (1-6)
  //   level: 1,          // 章节内当前关卡 (1-30)
  //   stars: {},         // { "1-1": 3, "1-2": 2, ... }
  //   coins: 0,          // 沙滩币
  //   lastSaved: "<ISO>"
  // }
  
  load()
  save()
  getMaxUnlocked()        // { chapter, level }
  isLevelUnlocked(ch, lv) // bool
  setStars(ch, lv, n)
  addCoins(n)
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

## 验收标准

1. `SceneManager.js` 可 import，`go()` 方法切换场景时有淡入淡出
2. `ProgressManager.js`：save/load roundtrip 正确（写入再读出数据一致）
3. `AudioManager.js`：构造时不报错，Web Audio API 可用时静默初始化
4. `main.js` 启动后在浏览器 console 无报错，游戏画面正常渲染
