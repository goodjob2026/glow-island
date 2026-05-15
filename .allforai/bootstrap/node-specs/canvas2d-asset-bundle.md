---
node_id: canvas2d-asset-bundle
node: canvas2d-asset-bundle
goal: "将 CC3 美术资产（6章背景、图块、音频）全部复制到 canvas2d-client/www/assets/ 并建立资产清单"
capability: canvas2d-engineer
human_gate: false
hard_blocked_by: []
exit_artifacts:
  - "canvas2d-client/www/assets/manifest.json"
  - "canvas2d-client/www/assets/backgrounds/ch06_lighthouse_after.png"
  - "canvas2d-client/www/assets/audio/bgm_chapter6_lighthouse.mp3"
---

# canvas2d-asset-bundle

## Mission

把 CC3 game-client 里的所有美术资产复制进 canvas2d-client www 目录，建立资产清单供运行时按需加载。

## 需要复制的资产

### 背景图（来自 game-client/assets/resources/sprites/backgrounds/）
每章 3 张：before / after / sunset
- ch01_harbor_before.png, ch01_harbor_after.png, ch01_harbor_sunset.png
- ch02_pottery_before.png, ch02_pottery_after.png, ch02_pottery_sunset.png
- ch03_flower_before.png, ch03_flower_after.png, ch03_flower_sunset.png
- ch04_forest_before.png, ch04_forest_after.png, ch04_forest_sunset.png
- ch05_hotspring_before.png, ch05_hotspring_after.png, ch05_hotspring_sunset.png
- ch06_lighthouse_before.png, ch06_lighthouse_after.png, ch06_lighthouse_sunset.png

目标：`canvas2d-client/www/assets/backgrounds/`

### 图块精灵（来自 game-client/assets/resources/sprites/tiles/）
6章各5个图块：chapter1-6/tile_01-05.png
目标：`canvas2d-client/www/assets/tiles/ch01/tile_01.png` ... `ch06/tile_05.png`

### 音频（来自 game-client/assets/resources/audio/）
BGM：bgm_chapter1_seaside.mp3 ... bgm_chapter6_lighthouse.mp3, bgm_menu.mp3, bgm_zen_ambient.mp3
SFX：sfx_combo1.mp3, sfx_combo2.mp3, sfx_combo3.mp3, sfx_connect.mp3, sfx_disappear.mp3,
     sfx_level_complete.mp3, sfx_lighthouse_on.mp3, sfx_area_restore.mp3, sfx_ui_button.mp3,
     sfx_special_cascade.mp3, sfx_special_light.mp3, sfx_special_light_chain.mp3,
     sfx_special_pierce.mp3, sfx_special_swap.mp3, sfx_special_wave.mp3, sfx_special_windmill.mp3,
     sfx_special_bomb.mp3, sfx_zen_complete.mp3

目标：`canvas2d-client/www/assets/audio/`

## 资产清单

写入 `canvas2d-client/www/assets/manifest.json`：
```json
{
  "version": "1.0",
  "backgrounds": { "ch01_before": "backgrounds/ch01_harbor_before.png", ... },
  "tiles": { "ch01_01": "tiles/ch01/tile_01.png", ... },
  "bgm": { "chapter1": "audio/bgm_chapter1_seaside.mp3", ... },
  "sfx": { "combo1": "audio/sfx_combo1.mp3", ... }
}
```

## 验收标准

1. `manifest.json` 存在，包含全部 6章背景、30张图块、所有音频路径
2. `ch06_lighthouse_after.png` 和 `bgm_chapter6_lighthouse.mp3` 作为最后章节资产存在
3. 文件总数：背景18 + 图块30 + bgm 8+ + sfx 18+ ≥ 74个媒体文件
4. 所有路径可从 manifest.json 推断，`fetch('assets/manifest.json')` 能正确解析
