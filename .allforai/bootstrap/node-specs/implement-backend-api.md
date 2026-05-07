---
node: implement-backend-api
exit_artifacts:
  - backend/src/server.ts
  - backend/src/routes/auth.ts
  - backend/src/routes/save.ts
  - backend/src/routes/leaderboard.ts
  - backend/src/routes/iap.ts
  - backend/prisma/schema.prisma
---

# Task: Fastify 后端 REST API 实现

## Context Pull

**必需：**
- 从 `.allforai/game-design/backend-schema.json` 读取完整PostgreSQL Schema（Prisma格式）
- 从 `.allforai/game-design/api-spec.json` 读取所有Endpoint的请求/响应JSON Schema

## Guidance

### server.ts
```typescript
const app = Fastify({ logger: true })
app.register(fastifyJwt, { secret: process.env.JWT_SECRET })
app.register(fastifyCors, { origin: '*' })
app.register(authRoutes, { prefix: '/auth' })
app.register(saveRoutes, { prefix: '/save' })
app.register(leaderboardRoutes, { prefix: '/leaderboard' })
app.register(iapRoutes, { prefix: '/iap' })
```

### auth.ts — POST /auth/anonymous
- 接收：`{ device_id: string }`
- 查找或创建 Player 记录
- 返回：`{ token: string, player_id: string, is_new: boolean }`
- JWT payload：`{ player_id, device_id, iat, exp: 7days }`

### save.ts
- `GET /save`（需认证）：返回当前玩家存档JSON（chapter_progress, currency, materials）
- `PUT /save`（需认证）：更新存档，响应`{ updated_at }`
- 冲突处理：以最新时间戳为准（客户端发送 `client_updated_at`，服务端比较）

### leaderboard.ts
- `GET /leaderboard?limit=50&offset=0`：返回排行榜条目 + 当前玩家排名（通过 player_id 从JWT读取）
- `POST /leaderboard/submit`（需认证）：提交新分数，仅在高于历史最高分时更新

### iap.ts — POST /iap/verify
- 接收：`{ receipt: string, product_id: string }`（iOS: Base64 AppStore收据）
- 请求Apple验证API：沙箱环境用 sandbox.itunes.apple.com
- 验证通过：创建IAPTransaction记录，增加玩家丹青石余额
- 验证失败：返回 `{ error: 'invalid_receipt' }`
- 防重放：检查 transaction_id 是否已处理

### prisma/schema.prisma
按 backend-schema.json 精确实现：
- Player, PlayerSave（JSONB存档）, LeaderboardEntry, IAPTransaction
- 所有索引：player_id外键、leaderboard_entries按score排序索引

## Exit Artifacts

6个文件（4个路由 + server.ts + schema.prisma）

## Downstream Contract

→ `implement-shop-iap` 读取：/iap/verify 接口规格（receipt字段格式和响应结构）
→ `cross-module-stitch` 读取：全部4个路由的请求/响应格式，与客户端调用对照
→ `demo-forge` 读取：/auth/anonymous 和 /save 接口，创建测试账户和存档
