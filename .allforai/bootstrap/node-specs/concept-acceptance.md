---
node_id: concept-acceptance
capability: concept-acceptance
human_gate: false
hard_blocked_by: [demo-forge, runtime-smoke-verify]
unlocks: []
exit_artifacts:
  - path: .allforai/product-concept/acceptance-report.json
  - path: .allforai/product-concept/acceptance-report.md
---

# Task: 游戏体验验收（对照产品概念）

对照 `concept-baseline.json` 的 MVP 功能清单，逐项确认游戏实现完整性和体验一致性。
读取本轮所有实现节点的产出来评估覆盖率。

## Context Pull

读取：
- `.allforai/product-concept/concept-baseline.json` — mvp_features, must_have, nice_to_have
- `.allforai/product-concept/product-concept.json` — errc_highlights
- `.allforai/bootstrap/compile-result.json` — overall pass/fail
- `.allforai/bootstrap/runtime-smoke-result.json` — summary.verdict + iap_smoke.verdict
- `.allforai/implement/fix-special-mechanics-report.json` — status
- `.allforai/implement/fix-shop-iap-report.json` — sandbox_test.purchase_flow_works
- `.allforai/bootstrap/stitch-game-client-report.json` — new_components_integrated, unresolved

## 验收清单

**核心玩法（连连看）**
- [ ] 6 章节关卡数据存在（`game-client/assets/resources/levels/ch1-ch6/` 或等效路径）
- [ ] 5 种战术特殊图块有 TypeScript 实现（`SpecialBlock.ts`）
- [ ] `fix-special-mechanics-report.json` status = "fixed" 或 "no_issues_found"
- [ ] 连击系统（`ComboTracker.ts`）存在

**禅境模式 (F-005)**
- [ ] `ZenModeManager.ts` 存在
- [ ] `ZenModeHUD.ts` 存在
- [ ] `stitch-game-client-report.json` 中 ZenModeManager = "connected"

**NPC 叙事 (F-006)**
- [ ] `NarrativeManager.ts` 存在，含 2+ 章节的日记碎片
- [ ] `NPCDialog.ts` 存在
- [ ] `stitch-game-client-report.json` 中 NarrativeManager = "connected"

**岛屿记忆胶囊 (F-010)**
- [ ] `MemoryCapsuleManager.ts` 存在，含 6 章胶囊数据
- [ ] `stitch-game-client-report.json` 中 MemoryCapsuleManager = "connected"

**商业化 (F-011/F-014)**
- [ ] `IAPManager.ts` 存在
- [ ] `fix-shop-iap-report.json` `sandbox_test.purchase_flow_works` = true
- [ ] 双货币（沙滩币/丹青石）系统存在

**岛屿修复 Meta**
- [ ] `IslandMapScene.ts` 存在
- [ ] `ProgressionManager.ts` 存在
- [ ] `AreaRestorationEffect.ts` 存在，可发射 `narrativeTrigger` 和 `EVENT_CHAPTER_FULLY_RESTORED`

**后端服务**
- [ ] `runtime-smoke-result.json` summary.verdict = "pass"
- [ ] `runtime-smoke-result.json` iap_smoke.verdict = "pass"

**音频**
- [ ] `AudioManager.ts` 存在
- [ ] `AudioConfig.ts` 含 `BGMKey.ZEN_AMBIENT` 和 `SFXKey.ZEN_COMPLETE`

## 验收结论

评分规则：
- `pass`：所有 ✓ 项通过（或仅 nice_to_have 类缺口），无 P0 缺口
- `needs_iteration`：有 must_have 功能缺失，列出具体缺口

## Exit Artifacts

### `acceptance-report.json`

```json
{
  "accepted_at": "<ISO>",
  "verdict": "pass | needs_iteration",
  "feature_coverage": {
    "zen_mode": "implemented | missing",
    "npc_narrative": "implemented | missing",
    "memory_capsule": "implemented | missing",
    "special_blocks": "fixed | broken",
    "iap_flow": "verified | broken",
    "audio_system": "complete | incomplete"
  },
  "checklist_summary": {
    "total": 20,
    "passed": 20,
    "failed": 0
  },
  "gaps": [],
  "iteration_notes": ""
}
```

### `acceptance-report.md`

Markdown 格式中文报告，包含：
- 验收日期
- 通过项 / 未通过项汇总表
- 每个 must_have 功能的状态
- verdict（pass | needs_iteration）
- gaps[]（如有，含建议修复方式）
- 下一步行动建议
