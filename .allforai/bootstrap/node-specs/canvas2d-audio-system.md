---
node_id: canvas2d-audio-system
node: canvas2d-audio-system
goal: "实现音频系统：Web Audio API加载BGM/SFX、章节BGM切换、Combo音效升调"
capability: canvas2d-engineer
human_gate: false
hard_blocked_by:
  - canvas2d-scene-manager
  - canvas2d-asset-bundle
exit_artifacts:
  - "canvas2d-client/www/src/AudioManager.js"
---

# canvas2d-audio-system

## Mission

实现完整音频管理，包含BGM流畅切换、Combo连击音效升调、静音切换。

注意：此节点是对 canvas2d-scene-manager 中 AudioManager 骨架的完整实现。

## Web Audio API 实现

```js
export class AudioManager {
  constructor() {
    this._ctx = null;      // AudioContext，首次用户交互后初始化
    this._bgmSource = null;
    this._bgmBuffer = {};
    this._sfxBuffer = {};
    this._masterGain = null;
    this._muted = false;
    this._comboLevel = 0;  // 0-4，影响SFX音高
  }
  
  // 首次用户点击时调用，解锁 AudioContext
  async resume() { ... }
  
  // 预加载（传入manifest中的路径）
  async loadBGM(key, url) { /* fetch → decodeAudioData → _bgmBuffer[key] */ }
  async loadSFX(key, url) { /* fetch → decodeAudioData → _sfxBuffer[key] */ }
  
  // BGM切换（淡出旧→淡入新，过渡300ms）
  playBGM(key, loop = true, volume = 0.6) { ... }
  stopBGM(fadeMs = 300) { ... }
  
  // SFX播放（Combo升调：每级+0.5个半音）
  playSFX(key, volume = 1.0) {
    // detune = this._comboLevel * 50  // cent单位，50=半音
  }
  
  setComboLevel(n) { this._comboLevel = Math.min(n, 4); }
  setMasterVolume(v) { this._masterGain.gain.value = v; }
  mute(bool) { ... }
  isMuted() { return this._muted; }
}
```

## 章节BGM映射

| 场景 | BGM key |
|------|---------|
| 菜单/岛图 | bgm_menu |
| 第1章游戏 | bgm_chapter1_seaside |
| 第2章游戏 | bgm_chapter2_pottery |
| 第3章游戏 | bgm_chapter3_flower |
| 第4章游戏 | bgm_chapter4_forest |
| 第5章游戏 | bgm_chapter5_hotspring |
| 第6章游戏 | bgm_chapter6_lighthouse |
| 禅模式 | bgm_zen_ambient |

## SFX时机

| 事件 | SFX key |
|------|---------|
| 连接成功 | sfx_connect |
| 图块消除 | sfx_disappear |
| Combo×2 | sfx_combo1 |
| Combo×3 | sfx_combo2 |
| Combo×4+ | sfx_combo3 |
| 关卡完成 | sfx_level_complete |
| 灯塔点亮（Ch6通关）| sfx_lighthouse_on |
| 区域修复 | sfx_area_restore |
| UI按钮 | sfx_ui_button |
| 特殊-光波 | sfx_special_wave |
| 特殊-光链 | sfx_special_light_chain |
| 特殊-穿透 | sfx_special_pierce |
| 特殊-置换 | sfx_special_swap |
| 特殊-连锁 | sfx_special_cascade |

## 集成到游戏循环

- GameplayScene 在每次消除成功后调用 `audio.playSFX('sfx_connect')`
- ComboSystem 在 combo 升级时调用 `audio.setComboLevel(combo)` 和 `audio.playSFX('sfx_comboN')`
- SceneManager.go() 切换场景时根据 chapter 切换 BGM

## 验收标准

1. `AudioManager.js` 实例化后首次用户交互解锁 AudioContext，无报错
2. `playBGM` 切换时有300ms淡出淡入，无爆音
3. `playSFX` 在 comboLevel=4 时 detune=200 cents（两个全音）
4. 静音切换（mute/unmute）即时生效
5. 资产不存在时 loadBGM/loadSFX 静默失败（catch住fetch error），不中断游戏
