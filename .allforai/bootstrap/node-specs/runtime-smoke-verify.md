---
node_id: runtime-smoke-verify
node: runtime-smoke-verify
capability: runtime-smoke-verify
human_gate: false
hard_blocked_by: [concept-acceptance]
unlocks: [launch-checklist]
exit_artifacts:
  - .allforai/bootstrap/runtime-smoke-result.json
---

# Task: 运行时冒烟验证

验证 backend + game-client 在测试框架外独立启动，关键 API 可访问。

## 1. Backend 冒烟

```bash
cd backend
npm install 2>/dev/null
npx prisma generate 2>/dev/null
npm run dev &
BACKEND_PID=$!
sleep 5

# TC-S01: 健康检查
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health

# TC-S02: 匿名认证
TOKEN=$(curl -s -X POST http://localhost:3000/v1/auth/anonymous \
  -H "Content-Type: application/json" \
  -d '{"device_id":"smoke-001"}' | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('token',''))")

# TC-S03: 云存档读取
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/v1/save \
  -H "Authorization: Bearer $TOKEN"

# TC-S04: IAP 端点存在性
curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3000/v1/iap/verify \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"sku_id":"addon_steps_5","platform":"ios","receipt_data":"sandbox-test"}'

kill $BACKEND_PID 2>/dev/null || true
```

期望：TC-S01~S03 返回 2xx；TC-S04 返回 2xx 或 4xx（非 404 端点不存在）。

## 2. Game Client 冒烟

```bash
# 若有构建产物，启动静态服务
ls game-client/build/web-mobile/index.html 2>/dev/null && \
  python3 -m http.server 7457 --directory game-client/build/web-mobile &
  sleep 3
  curl -s -o /dev/null -w "%{http_code}" http://localhost:7457/ || echo "game-client smoke skipped"
```

## 完成标准

```json
{
  "timestamp": "<ISO>",
  "backend": {
    "health": "pass|fail",
    "auth": "pass|fail",
    "save": "pass|fail",
    "iap": "pass|fail"
  },
  "game_client": {
    "static_serve": "pass|skipped"
  },
  "verdict": "pass|partial|fail"
}
```

`verdict == "partial"` 若 game_client 因构建缺失被跳过，但 backend 全通。
