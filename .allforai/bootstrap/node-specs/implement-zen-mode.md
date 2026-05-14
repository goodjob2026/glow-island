---
node_id: implement-zen-mode
capability: implement
human_gate: false
hard_blocked_by: []
unlocks: [stitch-game-client]
exit_artifacts:
  - path: game-client/assets/scripts/puzzle/ZenModeManager.ts
  - path: game-client/assets/scripts/ui/ZenModeHUD.ts
---

# Task: 实现禅境模式 (F-005)

禅境模式是 must_have 功能，当前完全缺失。需要新建 `ZenModeManager.ts` 和 `ZenModeHUD.ts`。

## Project Context

- **位置**: `game-client/assets/scripts/puzzle/ZenModeManager.ts`
- **设计规格**: 每日解锁 2-3 个特殊关卡，无步数限制、无失败判定、完成获得装饰性奖励
- **视觉风格**: 柔和配色、慢节奏音乐（BGMKey.ZEN 枚举值）
- **入口**: 从 `MainMenuScene` 或 `IslandMapScene` 进入
- **已有接口可复用**: `TileGrid`、`TileMatcher`、`GameSession`（去掉步数判定逻辑）、`AudioManager`

## Guidance

### 1. 创建 ZenModeManager.ts

```typescript
// game-client/assets/scripts/puzzle/ZenModeManager.ts
import { _decorator, Component, sys } from 'cc';
import { AudioManager } from '../audio/AudioManager';
import { BGMKey } from '../audio/AudioConfig';

const { ccclass } = _decorator;

const LS_ZEN_DATE_KEY = 'glow_zen_last_date';
const LS_ZEN_USED_KEY = 'glow_zen_used_today';
const DAILY_ZEN_SLOTS = 3;  // 每日 3 个禅境关卡

@ccclass('ZenModeManager')
export class ZenModeManager extends Component {
  private static _instance: ZenModeManager | null = null;

  static getInstance(): ZenModeManager { return ZenModeManager._instance!; }

  onLoad(): void {
    ZenModeManager._instance = this;
  }

  /** Returns how many Zen slots remain today (0–DAILY_ZEN_SLOTS). */
  getRemainingSlots(): number {
    const today = new Date().toDateString();
    const savedDate = sys.localStorage.getItem(LS_ZEN_DATE_KEY);
    if (savedDate !== today) {
      sys.localStorage.setItem(LS_ZEN_DATE_KEY, today);
      sys.localStorage.setItem(LS_ZEN_USED_KEY, '0');
      return DAILY_ZEN_SLOTS;
    }
    const used = parseInt(sys.localStorage.getItem(LS_ZEN_USED_KEY) ?? '0', 10);
    return Math.max(0, DAILY_ZEN_SLOTS - used);
  }

  /** Call when player starts a Zen level. Returns false if no slots left. */
  consumeSlot(): boolean {
    if (this.getRemainingSlots() <= 0) return false;
    const today = new Date().toDateString();
    sys.localStorage.setItem(LS_ZEN_DATE_KEY, today);
    const used = parseInt(sys.localStorage.getItem(LS_ZEN_USED_KEY) ?? '0', 10);
    sys.localStorage.setItem(LS_ZEN_USED_KEY, String(used + 1));
    return true;
  }

  /** True when playing in Zen mode (no step limit, no fail state). */
  isActive(): boolean { return this._active; }

  private _active = false;

  enterZenMode(): void {
    this._active = true;
    AudioManager.getInstance()?.playBGM(BGMKey.ZEN_AMBIENT);
  }

  exitZenMode(): void {
    this._active = false;
  }
}
```

### 2. 修改 GameSession.ts — 步数判定旁路

打开 `game-client/assets/scripts/game/GameSession.ts`，找到步数耗尽判断逻辑：

```bash
grep -n "stepsLeft\|steps.*<=.*0\|outOfMoves\|no.*moves\|fail\b" \
  game-client/assets/scripts/game/GameSession.ts | head -10
```

在判断 `stepsLeft <= 0` 的条件处增加 Zen Mode 旁路：

```typescript
import { ZenModeManager } from '../puzzle/ZenModeManager';

// 找到步数耗尽判断，修改为：
if (stepsLeft <= 0 && !ZenModeManager.getInstance()?.isActive()) {
  this._triggerLevelFail();
}
// Zen Mode 下步数归零时：给予完成奖励而非失败
if (stepsLeft <= 0 && ZenModeManager.getInstance()?.isActive()) {
  this._triggerZenComplete();
}
```

添加 `_triggerZenComplete()` 方法：

```typescript
private _triggerZenComplete(): void {
  // 发放装饰性奖励：随机一件岛屿装饰道具
  const decorationReward = { type: 'decoration', item_id: 'flower_pot_01', quantity: 1 };
  this.emit('zenComplete', decorationReward);
  // AudioManager 播放 ZEN 完成音效
  AudioManager.getInstance()?.playSFX(SFXKey.ZEN_COMPLETE);
}
```

### 3. 创建 ZenModeHUD.ts

```typescript
// game-client/assets/scripts/ui/ZenModeHUD.ts
import { _decorator, Component, Node, Label } from 'cc';
import { ZenModeManager } from '../puzzle/ZenModeManager';

const { ccclass, property } = _decorator;

@ccclass('ZenModeHUD')
export class ZenModeHUD extends Component {
  @property({ type: Label })
  slotsLabel: Label | null = null;  // 显示 "今日剩余: 2"

  @property({ type: Node })
  zenBadge: Node | null = null;    // 禅境模式标识

  start(): void {
    this._updateDisplay();
  }

  private _updateDisplay(): void {
    const remaining = ZenModeManager.getInstance()?.getRemainingSlots() ?? 0;
    if (this.slotsLabel) this.slotsLabel.string = `今日剩余: ${remaining}`;
    if (this.zenBadge) this.zenBadge.active = ZenModeManager.getInstance()?.isActive() ?? false;
  }
}
```

### 4. 更新 AudioConfig.ts — 添加 ZEN BGM 枚举

```bash
grep -n "BGMKey\|enum\|ZEN\|AMBIENT" \
  game-client/assets/scripts/audio/AudioConfig.ts | head -20
```

在 `BGMKey` enum 中添加（若缺失）：
```typescript
ZEN_AMBIENT = 'bgm_zen_ambient',
```

在 `SFXKey` enum 中添加：
```typescript
ZEN_COMPLETE = 'sfx_zen_complete',
```

### 5. 写单元测试

```typescript
// tests/ZenModeManager.test.ts
import { ZenModeManager } from '../game-client/assets/scripts/puzzle/ZenModeManager';

// Mock sys.localStorage
const mockStorage: Record<string, string> = {};
jest.mock('cc', () => ({
  sys: { localStorage: { getItem: (k: string) => mockStorage[k] ?? null, setItem: (k: string, v: string) => { mockStorage[k] = v; } } },
  _decorator: { ccclass: () => (c: any) => c },
  Component: class {}
}));

test('getRemainingSlots returns 3 on first day', () => {
  const mgr = new ZenModeManager();
  expect(mgr.getRemainingSlots()).toBe(3);
});

test('consumeSlot reduces remaining by 1', () => {
  const mgr = new ZenModeManager();
  mgr.consumeSlot();
  expect(mgr.getRemainingSlots()).toBe(2);
});
```

## Knowledge References

**§B.3 Closure Thinking**: ZenMode 完整实现需要：Manager（逻辑）+ HUD（UI）+ GameSession 旁路（步数）+ AudioConfig（BGM 枚举）+ 单元测试。缺任何一项则不视为完成。

## Exit Artifacts

**`game-client/assets/scripts/puzzle/ZenModeManager.ts`**
- `getRemainingSlots()` 返回正确值
- `consumeSlot()` 正确递减
- `isActive()` 返回布尔

**`game-client/assets/scripts/ui/ZenModeHUD.ts`**
- 显示剩余次数
- `zenBadge` 跟随 `isActive()` 状态

## Downstream Contract

→ stitch-game-client 读取: `ZenModeManager`（需将其连接到 `MainMenuScene` 的入口按钮）、`GameSession._triggerZenComplete()`（需确认事件监听器已注册）
