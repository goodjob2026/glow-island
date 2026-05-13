---
node_id: runtime-smoke-verify
capability: runtime-smoke-verify
human_gate: false
hard_blocked_by: [compile-verify]
unlocks: [e2e-test]
exit_artifacts:
  - path: .allforai/bootstrap/runtime-smoke-result.json
---

# Task: Backend 运行时冒烟验证

启动 backend 服务并验证关键 API 端点可访问，确认运行时合约未漂移。

## 1. 启动 Backend

```bash
cd backend
npm run dev &
BACKEND_PID=$!
sleep 3  # 等待初始化
```

检查进程启动：`curl -s http://localhost:3000/health` 返回 200 或任意非错误响应。
若端口 3000 已被占用，检查 `.env` 中的 `PORT` 配置。

## 2. 冒烟用例

**TC-S01: 匿名认证**
```bash
curl -s -X POST http://localhost:3000/auth/anonymous \
  -H "Content-Type: application/json" \
  -d '{"device_id":"smoke-test-device-001"}' | jq .
```
期望：返回 `{ token, player_id, is_new }`，HTTP 200。

**TC-S02: 带 token 读取存档**
```bash
TOKEN=$(curl -s -X POST http://localhost:3000/auth/anonymous \
  -H "Content-Type: application/json" \
  -d '{"device_id":"smoke-test-device-002"}' | jq -r .token)

curl -s http://localhost:3000/save \
  -H "Authorization: Bearer $TOKEN" | jq .
```
期望：HTTP 200，返回存档对象（可为空初始存档）。

**TC-S03: 排行榜**
```bash
curl -s "http://localhost:3000/leaderboard?limit=5" \
  -H "Authorization: Bearer $TOKEN" | jq .
```
期望：HTTP 200，返回 `{ entries: [] }` 或有数据的数组。

**TC-S04: 无 token 访问受保护端点**
```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/save
```
期望：401。

## 3. 关闭服务

```bash
kill $BACKEND_PID 2>/dev/null
```

## Exit Artifacts

**runtime-smoke-result.json**：
```json
{
  "checked_at": "<ISO>",
  "backend_url": "http://localhost:3000",
  "cases": [
    { "id": "TC-S01", "name": "匿名认证", "status": "pass|fail", "http_code": 200 },
    { "id": "TC-S02", "name": "读取存档", "status": "pass|fail", "http_code": 200 },
    { "id": "TC-S03", "name": "排行榜", "status": "pass|fail", "http_code": 200 },
    { "id": "TC-S04", "name": "无 token 401", "status": "pass|fail", "http_code": 401 }
  ],
  "overall": "pass|fail"
}
```
