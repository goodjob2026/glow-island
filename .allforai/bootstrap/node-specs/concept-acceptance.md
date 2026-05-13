---
node_id: concept-acceptance
capability: concept-acceptance
human_gate: true
approval_record_path: .allforai/game-design/approval-records.json
hard_blocked_by: [e2e-test]
unlocks: []
exit_artifacts:
  - path: .allforai/product-concept/acceptance-report.md
---

# Task: 游戏体验验收（对照产品概念）

对照 product-concept.json 的 MVP 功能清单，逐项确认游戏实现完整性和体验一致性。

## Context Pull

读取：
- `.allforai/product-concept/product-concept.json` — mvp_features, errc_highlights
- `.allforai/game-design/game-design-doc.json` — 游戏设计文档
- `.allforai/bootstrap/e2e-report.json` — E2E 测试结果
- `.allforai/bootstrap/compile-result.json` — 编译结果
- `.allforai/bootstrap/runtime-smoke-result.json` — 后端冒烟结果

## 验收清单

**核心玩法（连连看）**
- [ ] 6 章节关卡数据存在（game-client/assets/resources/levels/ch1-ch6/）
- [ ] 关卡 JSON 格式正确（有 grid_data, objectives, max_moves 字段）
- [ ] 5 种战术特殊图块有对应 TypeScript 实现（SpecialBlock.ts）
- [ ] 连击系统（ComboTracker.ts）存在

**难度曲线**
- [ ] 180 关全部 accepted，0 warnings（level-gen pipeline 产出）
- [ ] 难度带内单调递增（easy→standard→challenge→boss 分层清晰）
- [ ] boss 关（第 30 关）min_moves > challenge 关卡均值

**岛屿修复 Meta**
- [ ] 岛屿地图脚本（IslandMapScene.ts）存在
- [ ] ProgressionManager 持久化逻辑存在
- [ ] 区域恢复动画配置存在（animations/ 目录）

**后端服务**
- [ ] 匿名认证 + JWT 冒烟通过（TC-S01）
- [ ] 云存档读写冒烟通过（TC-S02）
- [ ] 排行榜端点可访问（TC-S03）

**美术资产**
- [ ] 地图瓦片集存在（resources/sprites/tiles/）
- [ ] 角色立绘存在（resources/sprites/characters/）
- [ ] UI 图标存在（resources/sprites/ui/）

**商业化**
- [ ] 商店 IAP 代码存在（IAPManager.ts）
- [ ] 单货币（沙滩币）货币显示组件存在（CurrencyDisplay.ts）

## 验收结论

- `pass`：所有 ✓ 项通过，无 P0 缺口
- `needs_iteration`：有核心功能缺失，列出具体缺口和建议行动

## Exit Artifacts

写入 `.allforai/product-concept/acceptance-report.md`（Markdown，中文）：
- 验收日期
- 通过项 / 未通过项汇总
- verdict（pass | needs_iteration）
- gaps[]（如有，含建议修复方式）
