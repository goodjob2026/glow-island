---
node_id: implement-npc-narrative
capability: implement
human_gate: false
hard_blocked_by: []
unlocks: [stitch-game-client]
exit_artifacts:
  - path: game-client/assets/scripts/meta/NarrativeManager.ts
  - path: game-client/assets/scripts/ui/NPCDialog.ts
---

# Task: 实现 NPC 叙事系统 (F-006)

`ChapterNode.ts` 有 `npcNode` 属性但无对话/叙事逻辑。需要实现：灯台守日记碎片解锁系统 + NPC 对话气泡组件。

## Project Context

- **NPCs（来自 concept-baseline.json）**:
  - 磯部健三 (Isobe Kenzo) — Ch1，老渔夫，向导
  - 桐島梅子 (Kirishima Umeko) — Ch2，陶艺工匠
  - 海野夏帆 (Umino Kaho) — Ch3，海洋生物研究者  
  - 丸山冬子 (Maruyama Fuyuko) — Ch4，渉的女儿
  - 丸山ひなた (Maruyama Hinata) — 跨章节情感线
- **灯台守日记碎片**: 渉的手记，每章解锁数条（story_memory_fragments）
- **触发时机**: 每次区域修复完成后（`AreaRestorationEffect` 完成时）NPC 出现并有反应
- **对话风格**: 无强制对话，玩家点击 NPC 触发，点击外部关闭

## Guidance

### 1. 创建 NarrativeManager.ts

```typescript
// game-client/assets/scripts/meta/NarrativeManager.ts
import { _decorator, Component, sys } from 'cc';

const { ccclass } = _decorator;

export interface DiaryFragment {
  id: string;
  chapter: number;
  order: number;       // 章内序号
  author: 'wataru';    // 灯台守渉
  text_jp: string;
  text_zh: string;
  unlock_condition: 'area_restore' | 'chapter_complete';
}

export interface NPCLine {
  npc_id: string;
  chapter: number;
  trigger: 'area_restore' | 'player_tap' | 'chapter_enter';
  lines: Array<{ text_zh: string; text_en: string }>;
}

const LS_UNLOCKED_FRAGMENTS_KEY = 'glow_diary_fragments';

@ccclass('NarrativeManager')
export class NarrativeManager extends Component {
  private static _instance: NarrativeManager | null = null;
  private _unlockedFragments: Set<string> = new Set();

  static getInstance(): NarrativeManager { return NarrativeManager._instance!; }

  onLoad(): void {
    NarrativeManager._instance = this;
    this._loadUnlocked();
  }

  private _loadUnlocked(): void {
    try {
      const raw = sys.localStorage.getItem(LS_UNLOCKED_FRAGMENTS_KEY) ?? '[]';
      this._unlockedFragments = new Set(JSON.parse(raw) as string[]);
    } catch { this._unlockedFragments = new Set(); }
  }

  unlockFragment(fragmentId: string): boolean {
    if (this._unlockedFragments.has(fragmentId)) return false;
    this._unlockedFragments.add(fragmentId);
    sys.localStorage.setItem(
      LS_UNLOCKED_FRAGMENTS_KEY,
      JSON.stringify([...this._unlockedFragments])
    );
    return true;
  }

  isFragmentUnlocked(fragmentId: string): boolean {
    return this._unlockedFragments.has(fragmentId);
  }

  /** Returns all fragments for a chapter in order. */
  getChapterFragments(chapter: number): DiaryFragment[] {
    return DIARY_FRAGMENTS.filter(f => f.chapter === chapter)
      .sort((a, b) => a.order - b.order);
  }

  /** Returns NPC lines triggered by a given event in a chapter. */
  getNPCLines(chapter: number, trigger: NPCLine['trigger']): NPCLine[] {
    return NPC_LINES.filter(l => l.chapter === chapter && l.trigger === trigger);
  }
}

// ---------- Static data (embedded; no JSON load overhead) ----------

const DIARY_FRAGMENTS: DiaryFragment[] = [
  { id: 'ch1_f1', chapter: 1, order: 1, author: 'wataru',
    text_jp: '今日、一人の若者が島に来た。東京から逃げてきた目をしている。',
    text_zh: '今天，一个年轻人来到了岛上。他有一双逃离东京的眼神。',
    unlock_condition: 'area_restore' },
  { id: 'ch1_f2', chapter: 1, order: 2, author: 'wataru',
    text_jp: '健三は「あいつは残る」と言った。老人はいつも正しい。',
    text_zh: '健三说"那小子会留下来"。老人总是对的。',
    unlock_condition: 'area_restore' },
  { id: 'ch2_f1', chapter: 2, order: 1, author: 'wataru',
    text_jp: '梅子の工房に明かりが戻ってきた。島が息をしている。',
    text_zh: '梅子的工坊又亮起了灯。小岛在呼吸。',
    unlock_condition: 'area_restore' },
  // ... ch3-ch6 fragments (add 2-3 per chapter following same pattern)
  { id: 'ch6_f1', chapter: 6, order: 1, author: 'wataru',
    text_jp: '灯台の光が戻る日、私はもういないだろう。でも光は残る。',
    text_zh: '灯塔重燃的那天，我大概已不在了。但光会留下。',
    unlock_condition: 'chapter_complete' },
];

const NPC_LINES: NPCLine[] = [
  { npc_id: 'isobe_kenzo', chapter: 1, trigger: 'area_restore',
    lines: [
      { text_zh: '这地方... 活回来了。像当年渉刚来时一样。', text_en: 'This place... it's alive again. Like when Wataru first arrived.' },
    ]},
  { npc_id: 'kirishima_umeko', chapter: 2, trigger: 'area_restore',
    lines: [
      { text_zh: '（摸了摸刚出窑的陶器）今天的土，烧得很好。', text_en: '(touches fresh pottery) Today\'s clay fired well.' },
    ]},
  // ... more NPC lines per chapter
];
```

### 2. 创建 NPCDialog.ts

```typescript
// game-client/assets/scripts/ui/NPCDialog.ts
import { _decorator, Component, Node, Label, tween, UIOpacity } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('NPCDialog')
export class NPCDialog extends Component {
  @property({ type: Label })
  dialogLabel: Label | null = null;

  @property({ type: Node })
  bubbleNode: Node | null = null;

  private _hideTimer: ReturnType<typeof setTimeout> | null = null;

  /** Show NPC dialog bubble with text, auto-hide after 4s */
  showLine(text: string, autohideMs = 4000): void {
    if (!this.dialogLabel || !this.bubbleNode) return;
    this.dialogLabel.string = text;
    this.bubbleNode.active = true;

    const opacity = this.bubbleNode.getComponent(UIOpacity);
    if (opacity) {
      opacity.opacity = 0;
      tween(opacity).to(0.3, { opacity: 255 }).start();
    }

    if (this._hideTimer) clearTimeout(this._hideTimer);
    this._hideTimer = setTimeout(() => this.hide(), autohideMs);
  }

  hide(): void {
    if (!this.bubbleNode) return;
    const opacity = this.bubbleNode.getComponent(UIOpacity);
    if (opacity) {
      tween(opacity).to(0.2, { opacity: 0 })
        .call(() => { if (this.bubbleNode) this.bubbleNode.active = false; })
        .start();
    } else {
      this.bubbleNode.active = false;
    }
  }
}
```

### 3. 将 NarrativeManager 接入 AreaRestorationEffect

```bash
grep -n "onComplete\|finish\|emit\|EventTarget\|callback" \
  game-client/assets/scripts/meta/AreaRestorationEffect.ts | head -15
```

在 `AreaRestorationEffect` 完成时触发叙事解锁：

```typescript
// 在 AreaRestorationEffect.ts 的完成回调中添加：
import { NarrativeManager } from './NarrativeManager';

// 找到动画完成回调处，添加：
const chapter = this._chapterIndex; // 从属性读取
const fragmentsForChapter = NarrativeManager.getInstance()?.getChapterFragments(chapter);
fragmentsForChapter?.forEach(f => {
  if (f.unlock_condition === 'area_restore') {
    NarrativeManager.getInstance()?.unlockFragment(f.id);
  }
});

// 触发 NPC 对话（由 IslandMapScene 监听事件后调用 NPCDialog.showLine()）
this.node.emit('narrativeTrigger', { chapter, trigger: 'area_restore' });
```

### 4. 单元测试

```typescript
// tests/NarrativeManager.test.ts
// Mock sys.localStorage
test('unlockFragment saves correctly', () => { ... });
test('getChapterFragments returns sorted by order', () => { ... });
test('getNPCLines filters by chapter+trigger', () => { ... });
```

## Knowledge References

**§D User Confirmation Gate**: 对话内容（日文/中文）已在静态数组中定义，不需用户确认。仅集成代码需要执行。

## Exit Artifacts

**`game-client/assets/scripts/meta/NarrativeManager.ts`**
- `unlockFragment()` / `isFragmentUnlocked()` 工作
- `getChapterFragments(1)` 返回 ch1 的 2 条碎片（按 order 排序）
- 每章至少 2 条 DiaryFragment，ch6 至少 1 条

**`game-client/assets/scripts/ui/NPCDialog.ts`**
- `showLine(text)` 显示气泡并自动隐藏
- `hide()` 正常淡出

## Downstream Contract

→ stitch-game-client 读取: 确认 `IslandMapScene` 已监听 `narrativeTrigger` 事件并调用 `NPCDialog.showLine()`
