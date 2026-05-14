---
node: audio-asset-gen
node_id: audio-asset-gen
capability: implement
human_gate: false
hard_blocked_by: []
unlocks: [compile-verify]
exit_artifacts:
  - .allforai/game-client/audio-asset-gen-report.json
---

# Task: 生成音频占位资产

## 背景

`game-client/assets/resources/audio/` 目录不存在。`AudioManager.ts` 的 `playSFX()` 和 `playBGM()` 在每次调用时静默失败（Cocos Creator 找不到资源），不崩溃但无声音。

App Store 上架 P0 阻塞项：音效和 BGM 完全缺失。

## 需要创建的文件

### SFX（14 个）

```
sfx_connect.mp3
sfx_disappear.mp3
sfx_combo1.mp3
sfx_combo2.mp3
sfx_combo3.mp3
sfx_special_wave.mp3
sfx_special_light_chain.mp3
sfx_special_pierce.mp3
sfx_special_swap.mp3
sfx_special_cascade.mp3
sfx_level_complete.mp3
sfx_area_restore.mp3
sfx_lighthouse_on.mp3
sfx_zen_complete.mp3
```

### BGM（8 个）

```
bgm_menu.mp3
bgm_chapter1_seaside.mp3
bgm_chapter2_town.mp3
bgm_chapter3_flower.mp3
bgm_chapter4_forest.mp3
bgm_chapter5_hotspring.mp3
bgm_chapter6_lighthouse.mp3
bgm_zen_ambient.mp3
```

## 执行步骤

### 1. 检查是否已有音频目录

```bash
ls game-client/assets/resources/audio/ 2>/dev/null || echo "no audio dir"
```

### 2. 创建目录结构

```bash
mkdir -p game-client/assets/resources/audio/sfx
mkdir -p game-client/assets/resources/audio/bgm
```

### 3. 生成静音占位 MP3

使用 Python 生成最小有效 MP3 文件（44 字节 ID3 标签 + 静音帧），确保 Cocos Creator 能加载而不报错：

```python
import os, struct

# 最小有效 MP3 = ID3v2 header(10 bytes) + 静音 MPEG frame(4 bytes header + silence data)
# 这是一个合法的 MP3 文件，Cocos Creator 可以加载
SILENCE_MP3 = bytes([
    # ID3v2.3 header: ID3, version 2.3.0, no flags, size=0
    0x49, 0x44, 0x33, 0x03, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    # MPEG1 Layer3, 128kbps, 44100Hz, stereo, frame sync
    0xFF, 0xFB, 0x90, 0x00,
    # 417 bytes of silence (standard 128kbps frame size)
] + [0x00] * 417)

sfx_files = [
    'sfx_connect', 'sfx_disappear', 'sfx_combo1', 'sfx_combo2', 'sfx_combo3',
    'sfx_special_wave', 'sfx_special_light_chain', 'sfx_special_pierce',
    'sfx_special_swap', 'sfx_special_cascade', 'sfx_level_complete',
    'sfx_area_restore', 'sfx_lighthouse_on', 'sfx_zen_complete'
]

bgm_files = [
    'bgm_menu', 'bgm_chapter1_seaside', 'bgm_chapter2_town', 'bgm_chapter3_flower',
    'bgm_chapter4_forest', 'bgm_chapter5_hotspring', 'bgm_chapter6_lighthouse',
    'bgm_zen_ambient'
]

for name in sfx_files:
    path = f'game-client/assets/resources/audio/sfx/{name}.mp3'
    with open(path, 'wb') as f:
        f.write(SILENCE_MP3)

for name in bgm_files:
    path = f'game-client/assets/resources/audio/bgm/{name}.mp3'
    with open(path, 'wb') as f:
        f.write(SILENCE_MP3)

print(f"Created {len(sfx_files)} SFX + {len(bgm_files)} BGM placeholder files")
```

运行：

```bash
python3 -c "..."  # 上述脚本
```

### 4. 检查 AudioConfig.ts 路径

读取 `game-client/assets/scripts/audio/AudioConfig.ts`，确认其引用的路径与创建的文件一致。

如果 AudioConfig.ts 期望文件在 `audio/sfx_connect` 而非 `audio/sfx/sfx_connect`，需要调整目录结构或 AudioConfig.ts 中的路径常量。

```bash
grep -n "resources\|audio\|mp3\|ogg" game-client/assets/scripts/audio/AudioConfig.ts | head -20
```

### 5. 验证文件创建

```bash
ls game-client/assets/resources/audio/sfx/ | wc -l
ls game-client/assets/resources/audio/bgm/ | wc -l
```

期望：sfx = 14，bgm = 8

### 6. 生成报告

写入 `.allforai/game-client/audio-asset-gen-report.json`：

```json
{
  "generated_at": "<ISO timestamp>",
  "sfx_count": 14,
  "bgm_count": 8,
  "audio_dir": "game-client/assets/resources/audio/",
  "format": "mp3",
  "type": "silence-placeholder",
  "note": "占位静音文件。正式音效需由音效设计师提供并替换。",
  "overall_status": "generated"
}
```
