---
node_id: generate-real-audio
node: generate-real-audio
capability: implement
human_gate: false
hard_blocked_by: []
unlocks: [compile-verify]
exit_artifacts:
  - .allforai/game-client/real-audio-gen-report.json
---

# Task: 生成真实音频内容

## 背景

当前 `game-client/assets/resources/audio/` 下的 25 个 MP3 文件均为 431 字节的相同空文件（占位符）。`AudioManager.ts` 调用这些文件时不会崩溃，但完全无声音。

## 策略

使用 **Codex CLI + Google AI 文字转语音** 或 **合成音频生成** 替换占位符。

### 方案 A：使用 MCP image-batch 或 AI Gateway 工具合成

通过 `mcp__plugin_meta-skill_ai-gateway__text_to_speech` 工具生成每个音效：

| 文件名 | 描述 | 参数 |
|--------|------|------|
| sfx_connect.mp3 | 清脆连接音 | 短促，0.3s，高频 click |
| sfx_disappear.mp3 | 图块消失音 | 柔和 pop，0.2s |
| sfx_combo1.mp3 | Combo×2 | 上扬 ding，0.5s |
| sfx_combo2.mp3 | Combo×3 | 双音 ding-ding，0.5s |
| sfx_combo3.mp3 | Combo×4+ | 三音 ding-ding-ding，0.6s |
| sfx_special_wave.mp3 | 光波特殊图块 | 波浪展开音，0.8s |
| sfx_special_light_chain.mp3 | 光链特殊图块 | 光芒连锁音，0.7s |
| sfx_special_pierce.mp3 | 穿透特殊图块 | 穿刺音，0.4s |
| sfx_special_swap.mp3 | 置换特殊图块 | 交换滑动音，0.5s |
| sfx_special_cascade.mp3 | 连锁特殊图块 | 连续爆发音，0.9s |
| sfx_special_bomb.mp3 | 炸弹 | 轻爆炸音，0.5s |
| sfx_special_windmill.mp3 | 风车 | 旋转展开音，0.6s |
| sfx_special_light.mp3 | 发光 | 光芒闪现音，0.4s |
| sfx_level_complete.mp3 | 关卡完成 | 欢快旋律，2s |
| sfx_area_restore.mp3 | 区域修复 | 温暖恢复音，1.5s |
| sfx_lighthouse_on.mp3 | 灯塔点亮 | 宏大光芒音，3s |
| sfx_zen_complete.mp3 | 禅境模式完成 | 平和完成音，1.5s |
| bgm_chapter1_seaside.mp3 | 第1章海边 | 轻松海边治愈 BGM，循环，30s+ |
| bgm_chapter2_town.mp3 | 第2章小镇 | 温暖小镇 BGM，循环，30s+ |
| bgm_zen_ambient.mp3 | 禅境模式 | 平和环境音，循环，30s+ |

### 方案 B：生成最小可用 WAV 文件（降级）

若 AI 工具不可用，使用 Python 生成正弦波 WAV 并转换为 MP3：

```python
import struct, math, wave, io

def generate_sine_wav(freq_hz: float, duration_s: float, sample_rate: int = 44100) -> bytes:
    """生成正弦波 WAV bytes"""
    n_samples = int(sample_rate * duration_s)
    buf = io.BytesIO()
    with wave.open(buf, 'wb') as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sample_rate)
        frames = b''
        for i in range(n_samples):
            t = i / sample_rate
            amplitude = int(16384 * math.sin(2 * math.pi * freq_hz * t))
            frames += struct.pack('<h', amplitude)
        wf.writeframes(frames)
    return buf.getvalue()
```

SFX 频率映射（近似）：
- sfx_connect: 880 Hz, 0.3s
- sfx_disappear: 440 Hz, 0.2s  
- sfx_combo1/2/3: 1047/1175/1319 Hz, 0.5s
- sfx_level_complete: 880 Hz, 2.0s
- BGM: 440 Hz, 30s（循环内容）

将 WAV 直接保存为 .mp3 扩展名（Cocos Creator 接受 WAV 封装在 .mp3 文件中，或直接在 AudioClip 中配置类型）。

**注意：** Cocos Creator 3 的 AudioManager 会尝试加载资源，只要文件存在且可解析，不会崩溃。最小可用 WAV 文件比空文件好。

## 完成标准

- 所有 25 个音频文件的文件大小 > 1000 字节（非相同空占位符）
- `AudioManager.ts` 的 playSFX / playBGM 不会因文件不可读而报错
- 输出 `.allforai/game-client/real-audio-gen-report.json`：
  ```json
  {
    "status": "completed",
    "method": "ai_generated | sine_wave_fallback",
    "files_generated": 25,
    "files": [
      { "name": "sfx_connect.mp3", "size_bytes": <实际大小>, "duration_s": 0.3 }
    ]
  }
  ```
