---
node: cross-module-stitch
exit_artifacts:
  - .allforai/bootstrap/cross-module-stitch-report.json
---

# Task: 客户端↔后端API合约验证

对照api-spec.json，逐个验证客户端代码中的API调用与后端路由实现完全匹配。

## Context Pull

**必需：**
- 从 `.allforai/game-design/api-spec.json` 读取所有endpoint的请求/响应JSON Schema（权威规格）
- 读取 `backend/src/routes/*.ts`（后端实现）
- 读取 `game-client/assets/scripts/meta/ProgressionManager.ts`（/save调用）
- 读取 `game-client/assets/scripts/ui/LeaderboardScene.ts`（/leaderboard调用）
- 读取 `game-client/assets/scripts/shop/IAPManager.ts`（/iap/verify调用）

## Guidance

### 验证逐endpoint

**POST /auth/anonymous**
- 客户端：ProgressionManager初始化时调用，发送 `{ device_id }`
- 后端：接收 device_id，返回 `{ token, player_id, is_new }`
- 检查：设备ID生成方式（Cocos sys.localStorage 或 UUID），JWT存储方式

**GET/PUT /save**
- 客户端PUT请求体的字段名 = 后端期望的字段名（chapter_progress/currency/materials）
- JSONB结构验证：客户端写入的嵌套结构能被后端解析
- 时间戳字段一致性（client_updated_at）

**GET /leaderboard**
- 客户端请求参数：limit/offset
- 响应字段：entries[].rank / display_name / total_score / chapter_reached
- 当前玩家排名字段名一致性

**POST /iap/verify**
- 客户端发送 `{ receipt, product_id }`
- 后端响应 `{ success, stones_added, new_balance }`
- 错误码 `invalid_receipt` 客户端有处理

### 修复不匹配
直接修改客户端代码（不改后端——后端是规格的来源）。

## Exit Artifacts

**cross-module-stitch-report.json** — 合约验证报告
