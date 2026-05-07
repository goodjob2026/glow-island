---
node: concept-acceptance
exit_artifacts:
  - .allforai/product-concept/concept-baseline.json
  - .allforai/product-concept/acceptance-report.json
---

# Task: GDD对照验收 + concept-baseline.json生成

## Context Pull

**必需：**
- 从 `.allforai/product-concept/product-concept.json` 读取 `mvp_features[]` 和 `errc_highlights`
- 从 `.allforai/game-design/game-design-document.md` 读取GDD中承诺的功能
- 从 `.allforai/bootstrap/e2e-report.json` 读取E2E测试结果

## Guidance

### 验收清单

**核心玩法**
- [ ] 6章节关卡数据存在（level-design.json contains 120+ levels）
- [ ] 4种特殊块均已实现并可触发
- [ ] 连击系统正常（combo×1-4+各档位）
- [ ] 动态棋盘事件至少2种已实现

**岛屿恢复**
- [ ] 岛屿地图6个章节区域可见
- [ ] 章节完成后恢复动画可触发
- [ ] ProgressionManager正确持久化进度

**后端服务**
- [ ] 云存档API读写正常（E2E测试中/save被调用）
- [ ] 排行榜有真实数据（≥10条）
- [ ] IAP验证逻辑存在（WebGL沙箱模式可跳过验证）

**美术/音频体系**
- [ ] 资产目录结构存在（sprites/tiles/chapter1/ 等）
- [ ] 原画委托说明书已生成
- [ ] 动画规格文档已生成
- [ ] 粒子特效配置文件已生成
- [ ] AudioManager代码存在，SFXKey枚举完整

**工具**
- [ ] 关卡编辑器可正常构建和运行

### concept-baseline.json生成
从 product-concept.json 提取紧凑摘要（<2KB）：
- `mission`: 产品定位一句话
- `roles[]`: 玩家角色定义（单角色Player，iOS+WebGL）
- `errc_highlights`: must_have/differentiators/eliminate
- `pipeline_preferences.auto_mode`: true

### 验收结论
- `pass`: 所有必选项通过
- `needs_iteration`: 有核心功能缺失，列出具体缺口和建议行动

## Exit Artifacts

**concept-baseline.json** — 紧凑产品基线（供后续迭代加载）
**acceptance-report.json** — 完整验收报告，含 verdict（pass|needs_iteration）和 gaps[]
