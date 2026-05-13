---
node: compile-verify
exit_artifacts:
  - .allforai/bootstrap/compile-result.json
---

# Task: 三模块编译验证

## Guidance

依次编译三个子项目，记录结果。任何模块编译失败需修复后重试（最多3次）。

### 1. 后端编译 + 测试
```bash
cd backend
npx tsc --noEmit  # TypeScript类型检查
npm test          # 单元测试（如有）
```

### 2. Cocos Creator WebGL构建（CLI，无需 GUI Dashboard）
```bash
COCOS_BIN="${COCOS_CREATOR_APP:-/Applications/CocosCreator.app}/Contents/MacOS/CocosCreator"
"$COCOS_BIN" --project "$(pwd)/game-client" --build "platform=web-mobile"
```
注意：standalone `tsc` 对 game-client 报的 `module 'cc'` 错误是引擎类型噪声，Cocos Creator CLI 构建环境内自动解决，**不算构建失败**，不需要修复。

### 3. 关卡编辑器构建
```bash
cd tools/level-editor
npm run build
```

### 失败处理
- TypeScript错误：读取错误信息，定位文件和行号，修复后重试
- 构建错误：区分是资源缺失（可忽略占位）还是代码错误（必须修复）
- 测试失败：记录失败用例，不阻塞（警告级别）

## Exit Artifacts

**compile-result.json**：
```json
{
  "verified_at": "ISO timestamp",
  "backend": { "ts_check": "pass", "tests": "pass|warning|skipped", "errors": [] },
  "game_client": { "build": "pass|manual_required", "platform": "web-mobile", "errors": [] },
  "level_editor": { "build": "pass", "errors": [] }
}
```
