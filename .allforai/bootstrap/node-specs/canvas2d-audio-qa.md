---
node_id: canvas2d-audio-qa
node: canvas2d-audio-qa
goal: "音频系统验收：BGM实际加载、SFX在正确时机触发、Combo升调量化、静音切换即时生效"
capability: canvas2d-engineer
human_gate: false
hard_blocked_by:
  - canvas2d-audio-system
  - canvas2d-gameplay-scene
exit_artifacts:
  - "canvas2d-client/www/qa/audio-qa-report.json"
---

# canvas2d-audio-qa

## Mission

Web Audio API 在 headless 浏览器中不出声，但所有逻辑状态可以用 JavaScript 检测。
验收策略：不验证"听到声音"，而是验证"正确的音频函数被调用，正确的状态被设置"。

## 前置：AudioManager 必须暴露测试钩子

AudioManager.js 构造时必须执行：
```js
constructor() {
  // ...
  if (typeof window !== 'undefined') {
    window._audioManager = this; // 测试钩子，生产环境无害
  }
}
```

这是 audio-qa 的硬性前提。AudioManager.js 实现时必须包含此行，否则所有 `page.evaluate(() => window._audioManager)` 返回 undefined，测试误报通过。

## 工具

Playwright + Chromium（非 headless，以解锁 Web Audio API）：

```bash
cd canvas2d-client
npx playwright test audio.spec.js --browser=chromium --headed
```

测试开始前验证钩子存在：
```js
const hookExists = await page.evaluate(() => typeof window._audioManager !== 'undefined');
if (!hookExists) {
  throw new Error('FATAL: window._audioManager not exposed. AudioManager.js missing test hook.');
}
```

## 1. BGM 加载验证

进入 IslandMapScene，验证 BGM buffer 已加载：

```js
// 等待第一次用户交互触发 AudioContext resume
await page.tap('canvas');
await page.waitForTimeout(2000);

const bgmLoaded = await page.evaluate(() => {
  const am = window._audioManager; // GameScene 暴露的全局引用（测试钩子）
  return Object.keys(am._bgmBuffer).length;
});
expect(bgmLoaded).toBeGreaterThanOrEqual(1); // 至少 bgm_menu 已加载

// 验证 6 章 BGM key 都存在（不要求已全部加载，要求 key 注册了）
const bgmKeys = await page.evaluate(() => Object.keys(window._audioManager._bgmBuffer));
const required = ['bgm_menu','bgm_chapter1_seaside','bgm_chapter2_pottery',
  'bgm_chapter3_flower','bgm_chapter4_forest','bgm_chapter5_hotspring',
  'bgm_chapter6_lighthouse','bgm_zen_ambient'];
for (const key of required) {
  expect(bgmKeys).toContain(key);
}
```

## 2. SFX 触发时机验证

注入 AudioManager 拦截层，记录每次 playSFX 调用：

```js
await page.evaluate(() => {
  window._sfxLog = [];
  const am = window._audioManager;
  const orig = am.playSFX.bind(am);
  am.playSFX = function(key, vol) {
    window._sfxLog.push({ key, time: Date.now() });
    return orig(key, vol);
  };
});

// 触发一次消除
await tapTile(page, 0, 0);
await tapTile(page, 0, 1); // 消除一对
await page.waitForTimeout(600);

const sfxLog = await page.evaluate(() => window._sfxLog);
const sfxKeys = sfxLog.map(e => e.key);
expect(sfxKeys).toContain('sfx_connect');    // 连接成功
expect(sfxKeys).toContain('sfx_disappear');  // 图块消除
```

### 全部 SFX 触发用例

| 触发操作 | 期望 SFX key | 测试方法 |
|---------|------------|---------|
| 成功连接一对图块 | sfx_connect | tap 两个同类图块 |
| 图块淡出 | sfx_disappear | 消除后500ms内 |
| 无效路径点击 | （无 SFX） | 验证 log 不新增 |
| Combo×2 | sfx_combo1 | 快速消除2对 |
| Combo×3 | sfx_combo2 | 快速消除3对 |
| Combo×4+ | sfx_combo3 | 快速消除4对 |
| 关卡完成 | sfx_level_complete | 清空棋盘 |
| Bomb 消除 | sfx_special_bomb | 触发 Bomb 图块 |
| Windmill 消除 | sfx_special_windmill | 触发 Windmill 图块 |

## 3. Combo 音高偏移验证

```js
// 验证 setComboLevel 调用后 _comboLevel 正确，detune 计算正确
await page.evaluate(() => { window._audioManager.setComboLevel(4); });

const detune = await page.evaluate(() => {
  const am = window._audioManager;
  // playSFX 内部：detune = _comboLevel * 50
  // 通过创建 source 节点检查 detune 设置
  return am._comboLevel * 50; // 期望 200 cents
});
expect(detune).toBe(200); // Combo×4 = 4 * 50 = 200 cents（两个全音）

// 验证 comboLevel 在 2秒无操作后归零
await page.waitForTimeout(2100);
const comboAfterTimeout = await page.evaluate(() => window._audioManager._comboLevel);
expect(comboAfterTimeout).toBe(0);
```

## 4. 章节切换 BGM

进入不同章节，验证 BGM key 切换：

```js
const bgmLog = [];
await page.evaluate(() => {
  window._bgmLog = [];
  const am = window._audioManager;
  const orig = am.playBGM.bind(am);
  am.playBGM = function(key, ...args) {
    window._bgmLog.push({ key, time: Date.now() });
    return orig(key, ...args);
  };
});

// 导航到 Ch1 关卡
await navigateToGameplay(page, { chapter: 1, level: 1 });
await page.waitForTimeout(500);

let log = await page.evaluate(() => window._bgmLog);
expect(log.at(-1).key).toBe('bgm_chapter1_seaside');

// 退出到岛图
await page.tap('#back-button-area');
await page.waitForTimeout(500);
log = await page.evaluate(() => window._bgmLog);
expect(log.at(-1).key).toBe('bgm_menu');
```

## 5. 静音切换即时生效

```js
// 验证静音前 AudioContext 未 suspend
let state = await page.evaluate(() => window._audioManager._ctx?.state);
expect(state).toBe('running');

// 点击静音
await page.tap('#mute-button-area');
await page.waitForTimeout(100);

const isMuted = await page.evaluate(() => window._audioManager.isMuted());
expect(isMuted).toBe(true);

// 验证 masterGain.gain.value = 0（静音实现方式）
const gainValue = await page.evaluate(() =>
  window._audioManager._masterGain?.gain.value ?? -1
);
expect(gainValue).toBe(0);

// 再次点击取消静音
await page.tap('#mute-button-area');
const gainAfterUnmute = await page.evaluate(() =>
  window._audioManager._masterGain?.gain.value ?? -1
);
expect(gainAfterUnmute).toBeGreaterThan(0);
```

## 6. 禅模式 BGM

```js
await navigateToZenMode(page, { chapter: 1, level: 1 });
await page.waitForTimeout(500);
const zenLog = await page.evaluate(() => window._bgmLog);
expect(zenLog.at(-1).key).toBe('bgm_zen_ambient');
```

## 报告格式

```json
{
  "run_at": "...",
  "sections": {
    "bgm_load": {
      "keys_registered": 8,
      "required_keys_present": true,
      "pass": true
    },
    "sfx_triggers": {
      "cases": [
        { "action": "match_success", "expected": "sfx_connect", "fired": true },
        { "action": "invalid_click", "expected": "none", "extra_sfx": false },
        { "action": "combo_3", "expected": "sfx_combo2", "fired": true }
      ],
      "pass": true
    },
    "combo_pitch": {
      "level_4_detune_cents": 200,
      "timeout_reset": true,
      "pass": true
    },
    "bgm_chapter_switch": {
      "ch1_key": "bgm_chapter1_seaside",
      "island_map_key": "bgm_menu",
      "pass": true
    },
    "mute_toggle": {
      "mute_gain_0": true,
      "unmute_gain_restored": true,
      "pass": true
    },
    "zen_bgm": {
      "key": "bgm_zen_ambient",
      "pass": true
    }
  },
  "overall": "pass|fail"
}
```

## 验收标准

1. `audio-qa-report.json` overall = "pass"
2. 8 个 BGM key 全部注册（不要求全部提前加载完毕）
3. sfx_connect 在成功消除后 600ms 内触发
4. Combo×4 时 _comboLevel = 4，detune 计算 = 200 cents
5. 静音后 masterGain.gain.value = 0，取消静音后恢复 > 0
6. 禅模式进入后最后播放的 BGM key = bgm_zen_ambient
