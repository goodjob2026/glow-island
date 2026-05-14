---
node_id: stitch-game-client
capability: implement
human_gate: false
hard_blocked_by:
  - fix-special-mechanics
  - fix-shop-iap
  - implement-zen-mode
  - implement-npc-narrative
  - implement-memory-capsule
  - implement-audio
unlocks: [compile-verify]
exit_artifacts:
  - path: .allforai/bootstrap/stitch-game-client-report.json
---

# Task: Game Client 新组件串联整合

将本轮实现的 6 个新组件连接到现有场景图，修复集成缺口，产出覆盖率报告。

## Context Pull

读取本轮所有 implement 节点的 exit_artifacts，重点关注：
- `.allforai/implement/fix-special-mechanics-report.json` — `issues_found[]` 中的文件变更
- `.allforai/implement/fix-shop-iap-report.json` — `sandbox_test.purchase_flow_works`
- `.allforai/implement/implement-audio-report.json` — 新增枚举值
- 新建的 TypeScript 文件：`ZenModeManager.ts`, `ZenModeHUD.ts`, `NarrativeManager.ts`, `NPCDialog.ts`, `MemoryCapsuleManager.ts`

## Theory Anchors

- **Event Coverage**: 每个 `node.emit(event)` 都必须有对应的 `node.on(event)` 监听者
- **Singleton Initialization**: 每个 `Manager.getInstance()` 的单例组件必须挂载到场景中的某个节点

## Guidance

### 1. ZenModeManager — 接入 MainMenuScene

```bash
grep -n "ZenMode\|zen\|zenButton" \
  game-client/assets/scripts/ui/MainMenuScene.ts 2>/dev/null | head -10
```

若 MainMenuScene 无 ZenMode 入口 → 在按钮回调区添加：

```typescript
import { ZenModeManager } from '../puzzle/ZenModeManager';

// 禅境模式入口按钮回调
onZenModeButtonClick(): void {
  const mgr = ZenModeManager.getInstance();
  if (!mgr || !mgr.consumeSlot()) {
    // 今日次数已用完，弹出提示
    this.node.emit('showToast', '今日禅境次数已用完，明天再来');
    return;
  }
  mgr.enterZenMode();
  director.loadScene('GameScene');
}
```

确认 `ZenModeManager` 组件已挂载到 MainMenuScene 或持久化节点（PersistentNode）。

### 2. NarrativeManager + NPCDialog — 接入 IslandMapScene

```bash
grep -n "narrativeTrigger\|NPCDialog\|NarrativeManager\|AreaRestoration" \
  game-client/assets/scripts/meta/IslandMapScene.ts 2>/dev/null | head -15
```

若 `IslandMapScene` 无 `narrativeTrigger` 监听 → 在 `onLoad` 添加：

```typescript
import { NarrativeManager } from '../meta/NarrativeManager';
import { NPCDialog } from '../ui/NPCDialog';

// 在场景初始化中注册：
this.areaRestorationEffect?.node.on('narrativeTrigger', (data: { chapter: number, trigger: string }) => {
  const lines = NarrativeManager.getInstance()?.getNPCLines(data.chapter, data.trigger as any);
  if (lines && lines.length > 0) {
    const line = lines[0].lines[0];
    this.npcDialog?.showLine(line.text_zh);
  }
  // 解锁日记碎片
  NarrativeManager.getInstance()?.getChapterFragments(data.chapter).forEach(f => {
    if (f.unlock_condition === 'area_restore') {
      NarrativeManager.getInstance()?.unlockFragment(f.id);
    }
  });
});
```

确认 `NPCDialog` 组件实例（`this.npcDialog`）已通过 `@property` 绑定。

### 3. MemoryCapsuleManager — 接入 IslandMapScene

```bash
grep -n "memoryCapsule\|MemoryCapsule\|EVENT_CHAPTER_FULLY_RESTORED" \
  game-client/assets/scripts/meta/IslandMapScene.ts 2>/dev/null | head -10
```

若未接入 → 添加：

```typescript
import { MemoryCapsuleManager } from '../meta/MemoryCapsuleManager';
import { EVENT_CHAPTER_FULLY_RESTORED } from './AreaRestorationEffect';

// 在 onLoad 中：
this.node.on(EVENT_CHAPTER_FULLY_RESTORED, (chapter: number) => {
  const capsule = MemoryCapsuleManager.getInstance()?.unlockForChapter(chapter);
  if (capsule) {
    this.node.emit('memoryCapsuleUnlocked', capsule);
    // TODO: 触发胶囊解锁 UI 弹出（后续 UI 迭代实现，当前记录 emit 即可）
  }
});
```

### 4. GameSession — ZenMode 步数旁路

```bash
grep -n "stepsLeft\|outOfMoves\|triggerFail\|_triggerLevelFail\|zenComplete" \
  game-client/assets/scripts/game/GameSession.ts | head -15
```

确认步数耗尽判断中有 ZenMode 旁路：

```typescript
if (stepsLeft <= 0 && !ZenModeManager.getInstance()?.isActive()) {
  this._triggerLevelFail();
} else if (stepsLeft <= 0 && ZenModeManager.getInstance()?.isActive()) {
  this._triggerZenComplete();
}
```

若 `_triggerZenComplete` 缺失 → 添加：

```typescript
private _triggerZenComplete(): void {
  this.emit('zenComplete', { type: 'decoration', item_id: 'flower_pot_01', quantity: 1 });
  AudioManager.getInstance()?.playSFX(SFXKey.ZEN_COMPLETE);
}
```

### 5. AudioConfig 枚举覆盖验证

确认 `AudioConfig.ts` 中存在：
- `BGMKey.ZEN_AMBIENT` （ZenModeManager.enterZenMode() 需要）
- `SFXKey.ZEN_COMPLETE` （GameSession._triggerZenComplete() 需要）

若不存在 → 添加到对应 enum（见 implement-audio 节点）。

### 6. 单例挂载检查

以下 Manager 单例必须在场景加载时初始化（挂载到 PersistentNode 或各自场景根节点）：
- `ZenModeManager` — 建议挂到 PersistentNode（跨场景保持 `_active` 状态）
- `NarrativeManager` — 挂到 IslandMapScene 根节点
- `MemoryCapsuleManager` — 挂到 IslandMapScene 根节点

```bash
grep -rn "ZenModeManager\|NarrativeManager\|MemoryCapsuleManager" \
  game-client/assets --include="*.ts" | grep -v "import\|interface\|type " | head -20
```

### 7. IAP 流程验证

从 `fix-shop-iap-report.json` 读取 `sandbox_test.purchase_flow_works`：
- `true` → IAP 集成已验证，无需额外操作
- `false` / 缺失 → 标注为 unresolved

### 8. SpecialBlock 集成验证

从 `fix-special-mechanics-report.json` 读取 `issues_found[]`：
- 若 `BoardEventManager.ts` 有变更 → 验证 `onSwapSelectionStart` 已注册
- 若 `ComboTracker.ts` 有变更 → 验证 `SPECIAL_BLOCK_GENERATION_COMBO` 已被使用

## Exit Artifacts

**`.allforai/bootstrap/stitch-game-client-report.json`**：

```json
{
  "stitched_at": "<ISO>",
  "new_components_integrated": {
    "ZenModeManager": "connected | missing",
    "ZenModeHUD": "connected | missing",
    "NarrativeManager": "connected | missing",
    "NPCDialog": "connected | missing",
    "MemoryCapsuleManager": "connected | missing"
  },
  "connections_checked": 12,
  "connections_fixed": 3,
  "iap_flow_verified": true,
  "special_blocks_verified": true,
  "fixes_applied": [
    { "location": "IslandMapScene.ts:onLoad()", "fix": "添加 narrativeTrigger 事件监听" }
  ],
  "unresolved": []
}
```

`unresolved` 为空时，compile-verify 可安全进行。

## Downstream Contract

→ compile-verify 读取: `unresolved[]`（不为空则可能编译失败）
