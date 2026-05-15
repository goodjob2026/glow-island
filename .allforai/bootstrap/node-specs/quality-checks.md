---
node_id: quality-checks
node: quality-checks
capability: quality-checks
human_gate: false
hard_blocked_by: [compile-verify]
unlocks: [code-repair-loop]
exit_artifacts:
  - .allforai/quality-checks/deadhunt-report.json
  - .allforai/quality-checks/fieldcheck-report.json
---

# Task: 质量检查 — 死链 + 字段一致性

## 背景

Glow Island 是双模块项目（game-client TypeScript + backend Fastify/Prisma）。以往已知的质量风险（来自 learned/api-contract-deviations.md 和 general-patterns.md）：
- 客户端资源加载器路径指向设计期 JSON 而非生成的运行时资产
- Backend 端点被客户端调用但缺失（隐蔽性高）
- 图块类型格式在设计阶段（tile_01）与生成阶段（T01）之间存在偏差

## Phase 1: Deadhunt — 死链 + CRUD 覆盖

### 1.1 理解结构

```bash
# 路由定义
grep -rn "fastify\.\|router\.\|app\." backend/src/routes/ --include="*.ts" | head -30
# 客户端 API 调用
grep -rn "fetch\|axios\|http\." game-client/assets/scripts/ --include="*.ts" | grep -v "//.*http" | head -30
# 资源加载路径
grep -rn "resources\.load\|load(" game-client/assets/scripts/ --include="*.ts" | head -20
```

### 1.2 API 死链检测

对比客户端调用的 API 路径 vs backend 定义的路由：
- 每条客户端 `fetch('/v1/...')` 调用 → 在 backend routes 中找对应定义
- 若无对应路由 → 记录为 `dead_route`

已知正确路由格式（来自 learned/api-contract-deviations.md）：
- `POST /v1/auth/anonymous`（需要 `platform` 字段）
- `PUT /v1/save/:playerId`（非 POST /v1/save）
- `POST /v1/iap/verify`
- `GET /health`

### 1.3 资源路径死链

```bash
# 找出 resources.load 调用中的路径
grep -rn "resources\.load" game-client/assets/scripts/ --include="*.ts" | sed "s/.*resources\.load('\([^']*\)'.*/\1/"
```

对每个路径验证 `game-client/assets/resources/<path>` 是否存在。

### 1.4 Ghost Feature 检测

```bash
# 找出定义但未被路由调用的处理函数
grep -rn "async.*Handler\|async.*Controller" backend/src/ --include="*.ts" | head -20
```

## Phase 2: Fieldcheck — 字段名一致性

### 2.1 追踪关键字段

选取 3 条高风险字段链路：

**链路 1: 用户认证**
- 客户端发送: `{ device_id, platform }` → `POST /v1/auth/anonymous`
- Backend 处理: `req.body.device_id`, `req.body.platform`
- DB 存储: `Player.deviceId` (Prisma model)
- 验证: 命名风格一致（camelCase/snake_case 转换正确）

**链路 2: 云存档**
- 客户端发送: `{ currency, materials, chapter_progress }` → `PUT /v1/save/:playerId`
- Backend: Prisma `GameSave` model 字段名
- DB: 列名
- 验证: 无字段名漂移

**链路 3: IAP**
- 客户端发送: `{ sku_id, platform, receipt_data }` → `POST /v1/iap/verify`
- Backend: IAP handler 参数名
- 验证: SKU ID 格式（已知正确格式：`com.glowisland.iap.small_pack` 等）

### 2.2 执行检查

```bash
# Prisma schema
cat backend/prisma/schema.prisma | grep -A10 "model Player\|model GameSave\|model Purchase"
# IAP handler
grep -rn "sku_id\|skuId\|receipt" backend/src/ --include="*.ts" | head -20
```

## 完成标准

输出 `.allforai/quality-checks/deadhunt-report.json`：
```json
{
  "checked_at": "<ISO>",
  "dead_routes": [{ "route": "<string>", "file": "<string>", "reason": "<string>" }],
  "ghost_features": [{ "function": "<string>", "file": "<string>", "reason": "<string>" }],
  "resource_path_gaps": [{ "path": "<string>", "used_in": "<string>", "exists": false }],
  "code_gaps": [],
  "summary": "pass|warn|fail"
}
```

输出 `.allforai/quality-checks/fieldcheck-report.json`：
```json
{
  "checked_at": "<ISO>",
  "field_mismatches": [{ "field": "<string>", "layer_from": "<string>", "layer_to": "<string>", "expected": "<string>", "actual": "<string>" }],
  "sku_format_check": { "status": "pass|fail", "canonical_format": "com.glowisland.iap.*", "mismatches": [] },
  "code_gaps": [],
  "summary": "pass|warn|fail"
}
```

`code_gaps` 中的缺口路由给 code-repair-loop 修复。`summary == fail` 时，code-repair-loop 必须修复后方可通过。
