---
node_id: implement-audio
capability: implement
human_gate: false
hard_blocked_by: []
unlocks: [stitch-game-client]
exit_artifacts:
  - path: .allforai/implement/implement-audio-report.json
---

# Task: 音频系统验证与补全 (F-013)

`AudioManager.ts` 和 `AudioConfig.ts` 已存在，但本轮新增了 ZenMode 和 ZenComplete 音效枚举。验证现有音频系统完整性，补充缺失的枚举值并生成报告。

## Project Context

- **Files**: `game-client/assets/scripts/audio/AudioManager.ts`, `game-client/assets/scripts/audio/AudioConfig.ts`
- **现状**: AudioManager 已实现 BGM 淡入淡出 + SFX 单次播放 + 音量持久化
- **缺失**: `BGMKey.ZEN_AMBIENT`、`SFXKey.ZEN_COMPLETE` — ZenMode 需要这两个枚举值

## Guidance

### 1. 检查现有枚举

```bash
grep -n "BGMKey\|SFXKey\|ZEN\|enum" \
  game-client/assets/scripts/audio/AudioConfig.ts
```

### 2. 补充 ZenMode 音频枚举

若 `BGMKey.ZEN_AMBIENT` 缺失，在 `AudioConfig.ts` 的 `BGMKey` enum 末尾添加：

```typescript
ZEN_AMBIENT = 'bgm_zen_ambient',
```

若 `SFXKey.ZEN_COMPLETE` 缺失，在 `SFXKey` enum 末尾添加：

```typescript
ZEN_COMPLETE = 'sfx_zen_complete',
```

### 3. 验证 AudioManager 接口

```bash
grep -n "playBGM\|playSFX\|setBGMVolume\|setSFXVolume\|getInstance" \
  game-client/assets/scripts/audio/AudioManager.ts | head -20
```

确认以下接口均存在：
- `playBGM(key: BGMKey, fadeDuration?: number): void`
- `stopBGM(): void`
- `playSFX(key: SFXKey): void`
- `setBGMVolume(v: number): void`
- `setSFXVolume(v: number): void`
- `static getInstance(): AudioManager`

若任一缺失，参照下方签名补充：

```typescript
static getInstance(): AudioManager { return AudioManager._instance!; }

playSFX(key: SFXKey): void {
  const path = `audio/sfx/${key}`;
  resources.load(path, AudioClip, (err, clip) => {
    if (err || !clip) return;   // 占位文件不存在时静默跳过
    const src = this.node.addComponent(AudioSource);
    src.clip = clip;
    src.loop = false;
    src.play();
  });
}
```

### 4. 音效占位策略

实际音效文件在正式交付前使用占位策略：`AudioManager.playSFX()` 在 `resources.load` 回调中检查 `err`，若文件不存在则静默跳过（不抛异常）。此设计已在现有实现中体现，无需修改。

### 5. 生成报告

```json
{
  "timestamp": "<ISO>",
  "status": "fixed | no_issues_found",
  "issues_found": [
    {
      "file": "game-client/assets/scripts/audio/AudioConfig.ts",
      "issue": "缺少 BGMKey.ZEN_AMBIENT 和 SFXKey.ZEN_COMPLETE",
      "fix_applied": "添加两个枚举值"
    }
  ],
  "enum_counts": {
    "BGMKey": 8,
    "SFXKey": 14
  },
  "interface_verified": [
    "playBGM", "stopBGM", "playSFX", "setBGMVolume", "setSFXVolume", "getInstance"
  ]
}
```

## Exit Artifacts

**`.allforai/implement/implement-audio-report.json`**
- `status` 明确
- `enum_counts.BGMKey` ≥ 7（含 ZEN_AMBIENT）
- `enum_counts.SFXKey` ≥ 13（含 ZEN_COMPLETE）

## Downstream Contract

→ stitch-game-client 读取: `BGMKey.ZEN_AMBIENT`（ZenModeManager.enterZenMode() 调用）、`SFXKey.ZEN_COMPLETE`（GameSession._triggerZenComplete() 调用）
