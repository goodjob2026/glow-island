---
node: compile-verify
node_id: compile-verify
capability: compile-verify
human_gate: false
hard_blocked_by: [fix-prototype-board, fix-compliance-urls, audio-asset-gen, obstacle-art-gen, ui-forge-game]
unlocks: [game-2d-playable-slice-assembly]
exit_artifacts:
  - path: .allforai/bootstrap/compile-result.json
---

# Task: 双模块编译验证 + Level-Gen 冒烟

验证 backend + game-client 均可干净构建，level-gen pipeline 冒烟通过。
任何模块失败需修复后重试（最多 3 次）。

## 1. Backend — TypeScript 类型检查 + 单元测试

```bash
cd backend
npx tsc --noEmit
npm test
```

期望：tsc 无错误，测试全过（无测试文件时跳过）。

## 2. Game Client — Cocos Creator CLI 构建

```bash
COCOS_BIN="${COCOS_CREATOR_APP:-/Applications/CocosCreator.app}/Contents/MacOS/CocosCreator"
"$COCOS_BIN" --project "$(pwd)/game-client" --build "platform=web-mobile"
```

**重要**：standalone `tsc` 对 game-client 报的 `module 'cc'` 错误是引擎类型噪声，
Cocos Creator CLI 构建环境内自动解决，**不算构建失败**。
退出码 0 = 成功。首次运行较慢（项目缓存初始化），等待最多 5 分钟。

若 Cocos Creator CLI 不可用（CI 环境），改为运行 backend tsc 检查 game-client ts 交叉类型：

```bash
cd game-client
npx tsc --noEmit --skipLibCheck 2>&1 | grep -v "Cannot find module 'cc'" | head -30
```

仅 `Cannot find module 'cc'` 类型错误可忽略；其他 TypeScript 错误需修复。

## 3. Level-Gen Pipeline — 冒烟验证

```bash
cd tools/level-gen
npm run gen -- --chapter 1 --count 3
```

期望：3 关均 `✓ OK`，0 warnings。验证难度曲线验收逻辑正常工作。

## 失败处理

- TypeScript 错误：读取错误信息，定位文件和行号，直接修复
- Cocos 构建错误：区分资源缺失（可忽略占位）vs 代码错误（必须修复）
- Level-gen 警告：如有 `⚠ WARN`，检查 pipeline.ts 的接受条件是否被跳过

## Exit Artifacts

**`.allforai/bootstrap/compile-result.json`**：

```json
{
  "verified_at": "<ISO>",
  "backend": { "tsc": "pass|fail", "tests": "pass|skipped|fail", "errors": [] },
  "game_client": { "cocos_build": "pass|fail", "platform": "web-mobile", "errors": [] },
  "level_gen": { "smoke": "pass|fail", "levels_accepted": 3, "warnings": 0 },
  "overall": "pass|fail"
}
```

## Downstream Contract

→ demo-forge 读取: `overall`（pass 时才继续）
→ runtime-smoke-verify 读取: `backend.tsc`（确认后端代码无类型错误）
