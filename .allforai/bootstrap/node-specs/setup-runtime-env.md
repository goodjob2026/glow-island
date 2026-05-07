---
node: setup-runtime-env
exit_artifacts:
  - .allforai/bootstrap/runtime-env.json
  - game-client/package.json
  - backend/package.json
  - backend/.env
  - tools/level-editor/package.json
---

# Task: 运行时环境初始化

初始化所有三个子项目的目录结构和依赖配置，收集所需的API Key和证书，写入环境变量。

## Guidance

### 检测清单（运行前检查）
1. **Cocos Creator**: `cocos-cli` 是否可用？（`which cocos-cli` 或检查 Cocos Dashboard）
2. **Node.js**: 版本 ≥ 18？（`node --version`）
3. **PostgreSQL**: 本地PostgreSQL是否运行？（`pg_isready`）
4. **Xcode**: iOS开发需要，检查 `xcode-select -p`

### 需要向用户收集的信息
（逐项询问，已有的跳过）

**后端必须项：**
- `DATABASE_URL`: PostgreSQL连接字符串（提示：postgresql://user:pass@localhost:5432/glow_island）
- `JWT_SECRET`: 随机字符串（提示：可自动生成）

**iOS IAP（可选，没有则跳过）：**
- `APPLE_BUNDLE_ID`: App的Bundle Identifier（如 com.example.glowisland）
- `APPLE_SHARED_SECRET`: App Store Connect的IAP共享密钥

**沙箱模式标志：**
- `NODE_ENV`: 设为 development（沙箱模式，IAP走Apple沙箱）

### 项目初始化步骤

**1. game-client/**
```bash
# 创建Cocos Creator项目（如果cocos-cli可用）
cocos new game-client --template empty-ts
# 或手动创建package.json（记录Cocos版本）
```

**2. backend/**
```bash
mkdir -p backend/src/routes backend/src/middleware backend/prisma
cd backend && npm init -y
npm install fastify @fastify/jwt @fastify/cors prisma @prisma/client
npm install -D typescript @types/node ts-node
```

**3. tools/level-editor/**
```bash
npm create vite@latest tools/level-editor -- --template react-ts
cd tools/level-editor && npm install
```

### 写入 backend/.env
收集完所有信息后写入：
```
DATABASE_URL=postgresql://...
JWT_SECRET=<generated>
NODE_ENV=development
APPLE_BUNDLE_ID=<if provided>
APPLE_SHARED_SECRET=<if provided>
PORT=3000
```

### 数据库初始化
```bash
cd backend
npx prisma init
# （backend-schema节点会写入schema.prisma，这里只建库）
createdb glow_island  # 或通过psql创建
```

## Exit Artifacts

**runtime-env.json** — 环境检测结果（不包含实际Key，只记录哪些已配置）：
```json
{
  "checked_at": "ISO timestamp",
  "cocos_creator": "3.8.x",
  "node_version": "20.x",
  "postgresql": "running",
  "jwt_secret": "configured",
  "database_url": "configured",
  "apple_iap": "configured | skipped",
  "projects_initialized": ["game-client", "backend", "tools/level-editor"]
}
```

**game-client/package.json**, **backend/package.json**, **tools/level-editor/package.json** — 各子项目依赖配置
**backend/.env** — 环境变量（已写入真实值）
