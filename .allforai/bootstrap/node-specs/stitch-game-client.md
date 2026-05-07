---
node: stitch-game-client
exit_artifacts:
  - .allforai/bootstrap/stitch-game-client-report.json
---

# Task: Game Client 模块串联整合

读取所有实现模块的产出，识别断开的连接，修复集成缺口，产出覆盖率报告。

## Context Pull

**必需：**
- 读取所有实现节点的exit_artifacts（TypeScript文件），特别是事件名称和接口调用
- 从 `.allforai/game-design/animation-spec.json` 读取 `trigger` 字段（验证动画触发点）
- 从 `.allforai/game-design/vfx-spec.json` 读取 `trigger` 字段（验证粒子触发点）

## Theory Anchors

- **Enum Exhaustiveness**: 每个枚举值（TileType/SFXKey/SpecialBlockType）都必须有代码路径
- **Event Coverage**: 每个发射的事件都必须有至少一个监听者

## Guidance

### 检查清单（逐项验证并修复）

**1. 游戏主流程连线**
- [ ] GameScene组件监听 TileGrid.`tilesMatched` → 播放 tile-disappear.anim
- [ ] GameScene组件监听 ComboTracker.`comboChanged` → 更新 GameHUD 连击显示
- [ ] GameSession监听目标完成 → 触发 LevelCompletePopup
- [ ] LevelCompletePopup → 调用 ProgressionManager.recordLevelComplete()
- [ ] ProgressionManager.`chapterMaterialsSufficient` → 触发 AreaRestorationEffect

**2. 岛屿地图流程**
- [ ] IslandMapScene进入时 → 调用 ProgressionManager.loadFromCloud()
- [ ] ChapterNode.COMPLETED状态 → AreaRestorationEffect已播放

**3. 商店流程**
- [ ] ShopScene → IAPManager.purchase() → 后端/iap/verify → ProgressionManager.addCurrency()
- [ ] CurrencyDisplay 监听 ProgressionManager 的货币变化

**4. 场景跳转**
- [ ] MainMenu → 关卡选择场景（LevelSelectScene）
- [ ] GameScene完成 → IslandMap
- [ ] MainMenu → LeaderboardScene
- [ ] MainMenu / GameScene → ShopScene（通过浮层入口）

**5. 音效绑定**
- [ ] TileMatcher路径合法 → AudioManager.playSFX(TILE_CONNECT)
- [ ] 消除 → TILE_DISAPPEAR
- [ ] ComboTracker等级 → 对应COMBO_LV1/2/3
- [ ] SpecialBlock触发 → 对应SPECIAL_xxx
- [ ] AreaRestorationEffect第4阶段 → AREA_RESTORE
- [ ] LighthouseFinal → LIGHTHOUSE_ON

**6. 枚举覆盖矩阵**
验证以下枚举的每个值都有处理代码路径：
- TileType（20种）：BoardGenerator生成、TileMatcher匹配、UI渲染
- SFXKey（12种）：AudioManager播放调用点
- SpecialBlockType（4种）：触发行为 + 粒子特效 + 音效

### 修复规则
- 缺少监听者：在合适的初始化方法中添加 `eventTarget.on()`
- 场景跳转未接线：在对应UI的按钮回调中添加 `director.loadScene()`
- 枚举缺少处理：在对应switch中补充case

## Exit Artifacts

**stitch-game-client-report.json**：
```json
{
  "stitched_at": "ISO timestamp",
  "connections_checked": 24,
  "connections_fixed": 3,
  "enum_coverage": {
    "TileType": { "total": 20, "covered": 20, "gaps": [] },
    "SFXKey": { "total": 12, "covered": 12, "gaps": [] }
  },
  "fixes_applied": [
    { "location": "GameScene.ts:init()", "fix": "添加tilesMatched事件监听" }
  ],
  "unresolved": []
}
```

## Downstream Contract

→ `cross-module-stitch` 读取：修复后的 API 调用代码（IAPManager/ProgressionManager 的后端调用点）
→ `compile-verify` 读取：报告中的 `unresolved[]`，如不为空则编译可能失败
