---
node: implement-audio
exit_artifacts:
  - game-client/assets/scripts/audio/AudioManager.ts
  - game-client/assets/scripts/audio/AudioConfig.ts
---

# Task: 音频系统实现

## Guidance

### AudioManager.ts（Cocos单例组件）
```typescript
class AudioManager {
  // BGM：淡入淡出切换
  playBGM(key: BGMKey, fadeDuration?: number): void
  stopBGM(): void
  
  // SFX：一次性播放
  playSFX(key: SFXKey): void
  
  // 音量控制
  setBGMVolume(v: number): void  // 0-1，持久化到storage
  setSFXVolume(v: number): void
}
```

### AudioConfig.ts
```typescript
enum BGMKey {
  MAIN_MENU = 'bgm_menu',
  CHAPTER_1 = 'bgm_chapter1_seaside',   // 悠闲，轻快吉他
  CHAPTER_2 = 'bgm_chapter2_town',      // 温暖，小提琴+钢琴
  CHAPTER_3 = 'bgm_chapter3_flower',    // 治愈，风铃+木吉他
  CHAPTER_4 = 'bgm_chapter4_forest',    // 安静，环境音+竖琴
  CHAPTER_5 = 'bgm_chapter5_hotspring', // 放松，古筝+流水
  CHAPTER_6 = 'bgm_chapter6_lighthouse' // 孤独中的温暖，钢琴独奏
}

enum SFXKey {
  TILE_CONNECT = 'sfx_connect',         // 连接成功：清脆水声
  TILE_DISAPPEAR = 'sfx_disappear',     // 消除：轻柔爆裂
  COMBO_LV1 = 'sfx_combo1',            // combo×2
  COMBO_LV2 = 'sfx_combo2',            // combo×3（更高亢）
  COMBO_LV3 = 'sfx_combo3',            // combo×4+（欢呼感）
  SPECIAL_BOMB = 'sfx_special_bomb',
  SPECIAL_WINDMILL = 'sfx_special_windmill',
  SPECIAL_LIGHT = 'sfx_special_light',
  SPECIAL_WAVE = 'sfx_special_wave',
  LEVEL_COMPLETE = 'sfx_level_complete',
  AREA_RESTORE = 'sfx_area_restore',    // 区域恢复专属（温柔的钟声序列）
  LIGHTHOUSE_ON = 'sfx_lighthouse_on'  // 灯塔点亮（宏大尾声）
}
```

音效文件使用占位（AudioManager在文件不存在时静默跳过），待正式音效资产交付后替换。

## Exit Artifacts

2个 TypeScript 文件

## Downstream Contract

→ `stitch-game-client` 读取：所有 `SFXKey` 枚举值（验证每个SFX触发点均已绑定）
