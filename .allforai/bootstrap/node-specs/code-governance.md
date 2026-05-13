---
node_id: code-governance
capability: tune
human_gate: false
hard_blocked_by: []
unlocks: []
exit_artifacts:
  - path: .allforai/bootstrap/code-governance-report.json
---

# Task: 代码治理检查

对 glow-island 两个模块做架构合规 + 重复检测 + 抽象分析，输出改进建议。
本节点可与验证节点并行运行（无依赖）。

## 检查范围

### 1. Backend — 架构合规

读取 `backend/src/` 目录结构。检查：
- **职责分离**：routes/ 是否只做路由，业务逻辑是否在 services/ 或 handlers/ 中
- **错误处理**：所有 route handler 是否有 try/catch 或 Fastify 的 schema validation
- **环境变量**：是否通过 `process.env` 直接访问还是统一从配置模块读取
- **重复代码**：相似的 auth 验证逻辑是否重复出现在多个 route handler

### 2. Game Client — Cocos 组件架构

读取 `game-client/assets/scripts/` 目录。检查：
- **组件职责**：单个 `.ts` 文件是否超过 300 行（可能混入过多职责）
- **事件解耦**：组件间通信是否通过 EventTarget / Cocos 消息机制，或直接引用
- **资源管理**：是否有未清理的 EventListener 或 schedule 回调（内存泄漏风险）
- **关卡加载**：LevelLoader.ts 是否正确加载 `resources/levels/` 下的 JSON（180 关已生成）

### 3. Level-Gen Pipeline — 可维护性

读取 `tools/level-gen/src/`。检查：
- **难度参数集中**：DIFFICULTY_FLOOR、DIFFICULTY_CEILING、MAX_RETRIES 是否在同一位置
- **测试覆盖**：solver 和 generator 是否有单元测试（关键路径：canConnect、findMoves）
- **日志可读性**：CLI 输出是否足以定位被拒绝的关卡的拒绝原因

### 4. 跨模块契约

对照 backend 的 Fastify schema 定义与 game-client 的 API 调用代码，检查：
- 字段名大小写一致性（snake_case vs camelCase）
- 必填字段完整性
- token 传递方式（Authorization header）

## 修复优先级

- **P0（阻塞）**：关卡加载代码无法读取生成的 JSON 文件
- **P1（重要）**：内存泄漏风险，跨模块字段名不一致
- **P2（建议）**：组件职责过大，缺少 pipeline 单元测试

## Exit Artifacts

**code-governance-report.json**：
```json
{
  "checked_at": "<ISO>",
  "backend": {
    "issues": [{ "file": "...", "line": 0, "severity": "P0|P1|P2", "description": "..." }],
    "score": "good|warning|needs_work"
  },
  "game_client": {
    "issues": [],
    "score": "good|warning|needs_work"
  },
  "level_gen": {
    "issues": [],
    "score": "good|warning|needs_work"
  },
  "cross_module": {
    "issues": [],
    "score": "good|warning|needs_work"
  },
  "overall": "good|warning|needs_work",
  "p0_count": 0,
  "p1_count": 0,
  "p2_count": 0
}
```
