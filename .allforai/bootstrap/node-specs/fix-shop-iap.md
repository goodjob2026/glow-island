---
node_id: fix-shop-iap
capability: implement
human_gate: false
hard_blocked_by: []
unlocks: [stitch-game-client]
exit_artifacts:
  - path: .allforai/implement/fix-shop-iap-report.json
---

# Task: 修复 IAP / 商店系统 (F-011, F-014)

`IAPManager.ts`、`ShopScene.ts`、后端 `iap.ts` 已存在，但上一轮 bootstrap 检测到集成问题。本节点验证并修复完整 IAP 购买流程。

## Project Context

- **Client IAP**: `game-client/assets/scripts/shop/IAPManager.ts`（使用 `ccf.purchaseInApp` 触发 iOS StoreKit）
- **Backend verify**: `backend/src/routes/iap.ts`（POST `/iap/verify` + `/hourglass/claim`）
- **货币**: 双货币（沙滩币 beach_coins 软货币 + 丹青石 glowstone 硬货币）
- **IAP 商品**: 丹青石套餐（消耗型 IAP），无订阅
- **Sandbox**: WebGL/dev 路径自动成功（`NODE_ENV !== 'production'` 时）

## Guidance

### 1. 验证 IAPManager 核心流程

```bash
cat game-client/assets/scripts/shop/IAPManager.ts | grep -n "purchaseInApp\|_nativeIAP\|API_BASE_URL\|verifyPurchase\|glowstone_granted\|updated_currency" | head -30
```

确认以下完整流程：
1. `IAPManager.purchase(sku)` 调用 `_nativeIAP(productId)` → 获取 `receipt`
2. `receipt` POST 到 `${API_BASE_URL}/iap/verify` with `{ sku_id, platform: 'ios', receipt_data: receipt }`
3. 后端返回 `{ glowstone_granted, updated_currency }` 
4. 客户端更新本地 `ProgressionManager` 货币显示

检查 `API_BASE_URL` 是否正确（应为 `http://localhost:3000/v1` 或生产 URL）：
```bash
grep -n "API_BASE_URL\|GLOW_API_BASE_URL\|v1\|localhost" \
  game-client/assets/scripts/shop/IAPManager.ts
```

### 2. 验证后端 IAP 路由

```bash
cat backend/src/routes/iap.ts | grep -n "app.post\|'/iap/verify'\|receipt_data\|glowstone\|sku_id" | head -20
```

检查后端是否有 `POST /v1/iap/verify` 路由（注意 `/v1` 前缀）：
```bash
grep -n "prefix\|'/v1'\|router\|register" backend/src/server.ts 2>/dev/null | head -10
```

常见问题：路由注册缺少 `/v1` 前缀，或 `iapRoutes` 未被 `server.ts` 导入。

### 3. 修复货币字段命名不一致

客户端 `IAPManager.ts` 期望 `glowstone_granted`，但后端可能返回 `coins_granted`（旧字段）：

```bash
grep -n "glowstone_granted\|coins_granted\|beachCoins\|glowstone" \
  backend/src/routes/iap.ts \
  game-client/assets/scripts/shop/IAPManager.ts 2>/dev/null | head -20
```

若字段不匹配 → 统一为 `glowstone_granted`（新标准）。

### 4. 沙盒模式验证

在 dev/WebGL 下，IAP 应跳过真实 StoreKit 并直接模拟成功。验证沙盒路径：

```typescript
// 期望行为：NODE_ENV !== 'production' 时
// 1. 跳过 ccf.purchaseInApp
// 2. 生成 mock receipt: 'sandbox-receipt-<sku>'
// 3. 正常调用后端 /iap/verify（后端也应在 dev 模式下接受 sandbox receipt）
```

检查后端是否处理 sandbox receipt：
```bash
grep -n "sandbox\|NODE_ENV\|mock\|dev.*receipt" backend/src/routes/iap.ts 2>/dev/null
```

若未处理 → 在后端 `/iap/verify` 中添加 sandbox 快速通道：
```typescript
if (body.receipt_data.startsWith('sandbox-receipt-')) {
  // Dev mode: 直接 grant 丹青石，跳过 Apple 验证
  const sku = SKU_CONFIG[body.sku_id];
  if (!sku) return reply.status(400).send({ error: 'INVALID_SKU' });
  // ... grant coins and return
}
```

### 5. 测试沙盒购买流程

启动 backend + WebGL 客户端，手动触发一次购买：

```bash
cd backend && npm run dev &
sleep 3
# 模拟客户端 IAP verify 调用
TOKEN=$(curl -s -X POST http://localhost:3000/v1/auth/anonymous \
  -H "Content-Type: application/json" \
  -d '{"device_id":"test-001"}' | python3 -c "import json,sys; print(json.load(sys.stdin)['token'])")

curl -s -X POST http://localhost:3000/v1/iap/verify \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"sku_id":"glowstone_50","platform":"ios","receipt_data":"sandbox-receipt-glowstone_50"}'
```

期望：返回 `{"glowstone_granted": 50, "updated_currency": {...}}`

### 6. 写修复报告

```json
{
  "timestamp": "<ISO>",
  "status": "fixed | partial | no_issues_found",
  "issues_found": [
    {
      "file": "<path>",
      "issue": "<description>",
      "fix_applied": "<what changed>"
    }
  ],
  "sandbox_test": {
    "purchase_flow_works": true,
    "currency_granted_correctly": true,
    "response_preview": "<JSON snippet>"
  }
}
```

## Knowledge References

**Maximum Realism Principle**: 沙盒测试必须调用真实后端 `/iap/verify`，不允许在客户端直接 mock 货币增加。测试数据流必须经过后端。

## Exit Artifacts

**`.allforai/implement/fix-shop-iap-report.json`**
- `status` 明确
- `sandbox_test.purchase_flow_works: true`

## Downstream Contract

→ stitch-game-client 读取: `status`（是否有文件变更）、`sandbox_test`（IAP 流程验证结果）
