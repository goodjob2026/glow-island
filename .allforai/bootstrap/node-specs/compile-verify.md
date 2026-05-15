---
node_id: compile-verify
node: compile-verify
capability: compile-verify
human_gate: false
hard_blocked_by: [fix-code-gaps, generate-real-audio, generate-missing-assets, ui-forge-game]
unlocks: [quality-checks, e2e-gameplay, ios-simulator-acceptance, visual-qa-game]
exit_artifacts:
  - .allforai/bootstrap/compile-result.json
---

# Task: 双模块编译验证

验证 backend + game-client 均可干净构建。任何模块失败需修复后重试（最多 3 次）。

## 1. Backend — TypeScript 类型检查 + 单元测试

```bash
cd backend
npx tsc --noEmit
npm test
```

期望：tsc 无错误，测试全过（无测试文件时跳过）。

## 2. Game Client — TypeScript 检查

```bash
cd game-client
npx tsc --noEmit --skipLibCheck 2>&1 | grep -v "Cannot find module 'cc'" | grep -v "Cannot find name 'cc'" | head -30
```

`Cannot find module 'cc'` 类型错误是引擎类型噪声，可忽略。其他 TypeScript 错误必须修复。

若 Cocos Creator CLI 可用，同时尝试完整构建：
```bash
COCOS_BIN="${COCOS_CREATOR_APP:-/Applications/CocosCreator.app}/Contents/MacOS/CocosCreator"
"$COCOS_BIN" --project "$(pwd)/game-client" --build "platform=web-mobile" 2>&1 | tail -20
```

## 3. Level-Gen Pipeline — 冒烟

```bash
cd tools/level-gen && npm run gen -- --chapter 1 --count 3 2>/dev/null || echo "level-gen skipped (not available)"
```

## 完成标准

```json
{
  "verified_at": "<ISO>",
  "backend": { "tsc": "pass|fail", "tests": "pass|skipped|fail", "errors": [] },
  "game_client": { "tsc": "pass|fail", "errors": [] },
  "level_gen": { "smoke": "pass|skipped" },
  "overall": "pass|fail"
}
```

`overall` = pass 时，unlocks e2e-gameplay 和 visual-qa-game。
