---
node_id: cross-module-stitch
capability: cross-module-stitch
human_gate: false
hard_blocked_by: [compile-verify]
unlocks: [e2e-test]
exit_artifacts:
  - path: .allforai/bootstrap/cross-module-stitch-report.json
---

# Task: 客户端↔后端 API 合约验证

对照后端 Fastify schema 与客户端 API 调用代码，逐端点验证字段名、类型、HTTP 方法一致。

## Context Pull

读取以下文件：
- `backend/src/` 路由文件（找到所有 Fastify route 定义）
- `game-client/assets/scripts/meta/ProgressionManager.ts`（/auth/anonymous + /save 调用）
- `game-client/assets/scripts/ui/LeaderboardScene.ts`（/leaderboard 调用）
- `game-client/assets/scripts/shop/IAPManager.ts`（/iap/verify 调用）

## 逐端点验证

**POST /auth/anonymous**
- 客户端发送字段名：确认是 `device_id`（snake_case，非 `deviceId`）
- 后端响应字段：`token`, `player_id`, `is_new`
- 客户端接收并存储 token 的方式（localStorage / Cocos sys）

**GET/PUT /save**
- PUT 请求体字段：`chapter_progress`, `currency`, `materials`, `client_updated_at`
- JSONB 嵌套结构与后端 Prisma schema 一致
- Authorization header 格式：`Bearer <token>`

**GET /leaderboard**
- 请求参数：`limit`, `offset`
- 响应数组：`entries[].rank`, `entries[].display_name`, `entries[].total_score`, `entries[].chapter_reached`

**POST /iap/verify**
- 请求体：`{ receipt, product_id }`
- 响应：`{ success, stones_added, new_balance }`
- 错误码 `invalid_receipt` 客户端是否有处理

## 修复规则

直接修改**客户端**代码（后端 schema 是权威规格）。记录每处修复的文件和行号。

## Exit Artifacts

**cross-module-stitch-report.json**：
```json
{
  "checked_at": "<ISO>",
  "endpoints": [
    {
      "path": "POST /auth/anonymous",
      "status": "pass|fail",
      "mismatches": []
    }
  ],
  "fixes_applied": [{ "file": "...", "line": 0, "description": "..." }],
  "overall": "pass|fail"
}
```
