---
node_id: implement-memory-capsule
capability: implement
human_gate: false
hard_blocked_by: []
unlocks: [stitch-game-client]
exit_artifacts:
  - path: game-client/assets/scripts/meta/MemoryCapsuleManager.ts
---

# Task: 实现岛屿记忆胶囊系统 (F-010)

玩家修复区域后，解锁对应的"记忆胶囊"——渉与小岛居民的共同记忆片段（照片+短文）。需新建 `MemoryCapsuleManager.ts`。

## Project Context

- **位置**: `game-client/assets/scripts/meta/MemoryCapsuleManager.ts`
- **触发时机**: 每章区域完全修复（`EVENT_CHAPTER_FULLY_RESTORED`）时解锁 1 枚胶囊
- **内容类型**: 记忆照片（概念图路径）+ 短文（JP/ZH）
- **存储**: localStorage，key `glow_memory_capsules`
- **相关文件**: `IslandMapScene.ts`（监听 `EVENT_CHAPTER_FULLY_RESTORED`）、`AreaRestorationEffect.ts`（发射该事件）

## Guidance

### 1. 创建 MemoryCapsuleManager.ts

```typescript
// game-client/assets/scripts/meta/MemoryCapsuleManager.ts
import { _decorator, Component, sys } from 'cc';

const { ccclass } = _decorator;

const LS_CAPSULES_KEY = 'glow_memory_capsules';

export interface MemoryCapsule {
  id: string;
  chapter: number;
  title_jp: string;
  title_zh: string;
  body_jp: string;
  body_zh: string;
  image_path: string;   // resources/sprites/memories/<id>.png
  unlocked_at: string | null;  // ISO timestamp, null if locked
}

@ccclass('MemoryCapsuleManager')
export class MemoryCapsuleManager extends Component {
  private static _instance: MemoryCapsuleManager | null = null;
  private _unlockedIds: Set<string> = new Set();

  static getInstance(): MemoryCapsuleManager { return MemoryCapsuleManager._instance!; }

  onLoad(): void {
    MemoryCapsuleManager._instance = this;
    this._load();
  }

  private _load(): void {
    try {
      const raw = sys.localStorage.getItem(LS_CAPSULES_KEY) ?? '[]';
      this._unlockedIds = new Set(JSON.parse(raw) as string[]);
    } catch { this._unlockedIds = new Set(); }
  }

  /** Call when chapter is fully restored. Returns the newly unlocked capsule or null if already unlocked. */
  unlockForChapter(chapter: number): MemoryCapsule | null {
    const capsule = CAPSULES.find(c => c.chapter === chapter);
    if (!capsule || this._unlockedIds.has(capsule.id)) return null;
    this._unlockedIds.add(capsule.id);
    sys.localStorage.setItem(LS_CAPSULES_KEY, JSON.stringify([...this._unlockedIds]));
    return { ...capsule, unlocked_at: new Date().toISOString() };
  }

  isUnlocked(capsuleId: string): boolean {
    return this._unlockedIds.has(capsuleId);
  }

  /** Returns all capsules with unlock status merged in. */
  getAllCapsules(): MemoryCapsule[] {
    return CAPSULES.map(c => ({
      ...c,
      unlocked_at: this._unlockedIds.has(c.id) ? 'unlocked' : null,
    }));
  }

  getUnlockedCapsules(): MemoryCapsule[] {
    return this.getAllCapsules().filter(c => c.unlocked_at !== null);
  }
}

// ---------- Static capsule data ----------

const CAPSULES: MemoryCapsule[] = [
  {
    id: 'mem_ch1',
    chapter: 1,
    title_jp: '磯の記憶',
    title_zh: '渔港的记忆',
    body_jp: '健三さんの古い小舟。傷んだ木の板が、長い年月を語る。',
    body_zh: '健三老伯的旧渔船。斑驳的木板讲述着漫长的岁月。',
    image_path: 'sprites/memories/mem_ch1',
    unlocked_at: null,
  },
  {
    id: 'mem_ch2',
    chapter: 2,
    title_jp: '梅子の窯',
    title_zh: '梅子的窑火',
    body_jp: '工房に積み上げられた失敗作。梅子さんは「これが財産」と笑う。',
    body_zh: '工坊里堆满了失败品。梅子说"这些才是财富"，笑着。',
    image_path: 'sprites/memories/mem_ch2',
    unlocked_at: null,
  },
  {
    id: 'mem_ch3',
    chapter: 3,
    title_jp: '夏帆の海図',
    title_zh: '夏帆的海图',
    body_jp: '研究室の壁一面に貼られた海図。夢の続きがそこにある。',
    body_zh: '研究室墙上贴满了海图。梦想的延续就在那里。',
    image_path: 'sprites/memories/mem_ch3',
    unlocked_at: null,
  },
  {
    id: 'mem_ch4',
    chapter: 4,
    title_jp: '父への手紙',
    title_zh: '写给父亲的信',
    body_jp: '冬子さんが書きかけた手紙。「お父さん、島が戻ってきたよ」',
    body_zh: '冬子写了一半的信。"爸爸，小岛回来了。"',
    image_path: 'sprites/memories/mem_ch4',
    unlocked_at: null,
  },
  {
    id: 'mem_ch5',
    chapter: 5,
    title_jp: '温泉の夜',
    title_zh: '温泉之夜',
    body_jp: 'ひなたと並んで見た星空。言葉はいらなかった。',
    body_zh: '和阿晴并排看了夜空。什么都不需要说。',
    image_path: 'sprites/memories/mem_ch5',
    unlocked_at: null,
  },
  {
    id: 'mem_ch6',
    chapter: 6,
    title_jp: '灯台の光',
    title_zh: '灯塔的光',
    body_jp: '初めて灯台に灯がともった夜、島全体が息をのんだ。',
    body_zh: '灯塔第一次亮起的夜晚，整座岛屿都屏住了呼吸。',
    image_path: 'sprites/memories/mem_ch6',
    unlocked_at: null,
  },
];
```

### 2. 接入 IslandMapScene

在 `IslandMapScene.ts` 中，监听 `EVENT_CHAPTER_FULLY_RESTORED` 并调用 `MemoryCapsuleManager`:

```typescript
import { MemoryCapsuleManager } from '../meta/MemoryCapsuleManager';

// 在 onLoad 或 start 中添加：
this.node.on(EVENT_CHAPTER_FULLY_RESTORED, (chapter: number) => {
  const capsule = MemoryCapsuleManager.getInstance()?.unlockForChapter(chapter);
  if (capsule) {
    // 触发记忆胶囊解锁 UI（弹出提示）
    this.node.emit('memoryCapsuleUnlocked', capsule);
  }
});
```

### 3. 单元测试

```typescript
// tests/MemoryCapsuleManager.test.ts
// mock sys.localStorage 同 ZenModeManager.test.ts 模式

test('unlockForChapter returns capsule on first call', () => { ... });
test('unlockForChapter returns null on second call (already unlocked)', () => { ... });
test('getAllCapsules returns 6 total', () => {
  const mgr = new MemoryCapsuleManager();
  expect(mgr.getAllCapsules().length).toBe(6);
});
test('getUnlockedCapsules filters correctly', () => { ... });
```

## Knowledge References

**§B.3 Closure Thinking**: 6章 × 1胶囊/章 = 6个静态胶囊对象。静态数据嵌入 TS 文件，避免运行时 JSON 加载。

## Exit Artifacts

**`game-client/assets/scripts/meta/MemoryCapsuleManager.ts`**
- `unlockForChapter(chapter)` 正确返回胶囊或 null（幂等）
- `getAllCapsules()` 返回 6 条
- `getUnlockedCapsules()` 只返回已解锁的

## Downstream Contract

→ stitch-game-client 读取: `MemoryCapsuleManager.unlockForChapter()` 已在 `IslandMapScene` 中监听 `EVENT_CHAPTER_FULLY_RESTORED` 事件
