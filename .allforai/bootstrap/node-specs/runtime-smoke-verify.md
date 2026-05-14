---
node: runtime-smoke-verify
node_id: runtime-smoke-verify
capability: runtime-smoke-verify
human_gate: false
hard_blocked_by: [game-2d-production-closure-qa]
unlocks: [competitive-research]
exit_artifacts:
  - path: .allforai/bootstrap/runtime-smoke-result.json
---

# Task: 后端运行时冒烟验证（实施阶段）

验证 Glow Island 后端服务运行时合约完整，所有关键 API 端点均可正常访问，含本轮新修复的 IAP 流程。

## Project Context

- **Backend**: Fastify 4.x + Prisma + PostgreSQL 16，位于 `backend/` 目录
- **Default Port**: 3000（见 `backend/.env` 中的 `PORT`）
- **Key APIs**: 匿名认证、云存档（读/写）、IAP 收据验证

## Guidance

### 1. 环境检查

```bash
cd backend && ls node_modules/ | head -5
ls backend/.env
ls backend/node_modules/.prisma/client/
```

若 `node_modules` 缺失：`cd backend && npm install`
若 Prisma client 缺失：`cd backend && npx prisma generate`

### 2. 启动 Backend

```bash
cd backend
npm run dev &
BACKEND_PID=$!
sleep 5
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health
```

返回 200 即正常。

### 3. 冒烟用例

**TC-S01: 健康检查**
```bash
curl -s http://localhost:3000/health
# 预期: {"status":"ok"} 或类似 200 响应
```

**TC-S02: 匿名认证**
```bash
TOKEN=$(curl -s -X POST http://localhost:3000/v1/auth/anonymous \
  -H "Content-Type: application/json" \
  -d '{"device_id":"smoke-impl-001"}' | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('token') or d.get('access_token',''))")
echo "TOKEN=$TOKEN"
```

**TC-S03: 云存档读取（空存档）**
```bash
curl -s http://localhost:3000/v1/save \
  -H "Authorization: Bearer $TOKEN"
# 预期: 200，不应 500
```

**TC-S04: 云存档写入**
```bash
curl -s -X POST http://localhost:3000/v1/save \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"save_data":{"chapter":1,"level":1,"coins":0}}'
# 预期: {"ok":true} 或 200
```

**TC-S05: 云存档读回验证**
```bash
curl -s http://localhost:3000/v1/save \
  -H "Authorization: Bearer $TOKEN"
# 预期: save_data.chapter == 1
```

**TC-S06: IAP 沙盒购买流程**
```bash
curl -s -X POST http://localhost:3000/v1/iap/verify \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"sku_id":"glowstone_50","platform":"ios","receipt_data":"sandbox-receipt-glowstone_50"}'
# 预期: {"glowstone_granted":50,"updated_currency":{...}}
# 不应是 404（端点不存在）或 500（内部错误）
```

注意：TC-S06 依赖 `fix-shop-iap` 节点修复，若该节点报告 sandbox 路径已接通则预期通过。

### 4. 清理

```bash
kill $BACKEND_PID 2>/dev/null || true
```

### 5. 生成结果

写入 `.allforai/bootstrap/runtime-smoke-result.json`：

```json
{
  "timestamp": "<ISO>",
  "backend_version": "<从 package.json 读取>",
  "test_cases": [
    {
      "id": "TC-S01",
      "name": "健康检查",
      "status": "pass | fail | skip",
      "http_status": 200,
      "response_preview": "...",
      "error": null
    }
  ],
  "summary": {
    "total": 6,
    "passed": 6,
    "failed": 0,
    "verdict": "pass | fail"
  },
  "iap_smoke": {
    "sandbox_receipt_accepted": true,
    "glowstone_granted": 50,
    "verdict": "pass | fail"
  }
}
```

## Exit Artifacts

**`.allforai/bootstrap/runtime-smoke-result.json`**
- 6 个 TC 均有结果
- `summary.verdict` 明确
- `iap_smoke.verdict` 明确

## Downstream Contract

→ concept-acceptance 读取: `summary.verdict`、`iap_smoke.verdict`
