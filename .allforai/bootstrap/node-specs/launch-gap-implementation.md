---
node: launch-gap-implementation
node_id: launch-gap-implementation
exit_artifacts:
  - .allforai/launch-prep/launch-gap-implementation.json
---

# Task: 上架差距补齐实施（Launch Gap Implementation）

## Project Context

- 游戏：Glow Island — Cocos Creator 3.x + Fastify/PostgreSQL
- 当前状态：核心功能全部实现（concept-acceptance: passed），进入上架最后一公里
- 输入：`launch-concept-finalize.json.gap_warnings_inherited[]` — P0/P1 差距清单

## Context Pull

**必需（缺失则报错返回）：**
- 读取 `.allforai/launch-prep/launch-concept-finalize.json` → `gap_warnings_inherited[]`，
  确定需要实施的差距范围

**可选（缺失则 warning 后继续）：**
- 读取 `.allforai/product-concept/acceptance-report.json` — 上轮验收遗留问题

## Guidance

### 差距优先级处理规则

**P0（必须在上架前完成）：**
- 崩溃/闪退监控（如无：集成 Firebase Crashlytics 或 Sentry）
- Analytics 基础埋点（关卡开始/完成/放弃、IAP 触发/完成）
- 评分引导弹窗（通关第5关后首次弹出，SKStoreReviewRequest API）
- 客服/帮助入口（Settings 页面内，支持邮件跳转）

**P1（强烈建议，不硬阻上架）：**
- App Store 截图制作（5张，用 Playwright 截图或 Cocos 截图工具）
- 首次启动隐私弹窗（GDPR/CCPA 说明，收集邮件/匿名ID时需要）
- 应用图标 1024×1024 PNG 确认（需要已有图标文件）

**P2（可以上线后迭代）：**
- 推送通知（不是治愈类游戏标配，可以跳过）
- 社交分享（可以后期加）

### 实施步骤

1. 从 `gap_warnings_inherited[]` 中过滤 P0 和 P1 差距
2. 逐项检查代码中是否已有实现（避免重复开发）
3. 对每个缺失项：
   - 编写实施代码（Cocos Creator TypeScript）
   - 或添加后端接口（Fastify/PostgreSQL）
   - 写入变更记录
4. 完成后验证：运行 `npm test` (backend) + Cocos build

### 关于截图制作

如需制作 App Store 截图：
- 使用 Playwright 对 WebGL 版本截图（运行 `npm run start-demo`，访问 localhost:8080）
- 截取 6.7" 分辨率（1290×2796），每个关键场景截一张
- 保存至 `.allforai/launch-prep/screenshots/` 目录

## Exit Artifacts

### `.allforai/launch-prep/launch-gap-implementation.json`

```json
{
  "schema_version": "1.0",
  "implemented_at": "<ISO>",
  "p0_gaps": [
    {
      "gap": "<差距描述>",
      "status": "implemented | already_exists | deferred",
      "files_changed": ["<file path>"],
      "notes": "<实施说明>"
    }
  ],
  "p1_gaps": [
    {
      "gap": "<差距描述>",
      "status": "implemented | already_exists | deferred",
      "files_changed": [],
      "notes": ""
    }
  ],
  "screenshots_produced": [
    {"order": 1, "path": ".allforai/launch-prep/screenshots/screen_1.png", "scene": "core-loop-combo"}
  ],
  "remaining_p0_blockers": [],
  "launch_readiness": "ready | blocked_by_p0"
}
```

> **注意**：如果 `remaining_p0_blockers` 非空，`launch_readiness` 必须为 `"blocked_by_p0"`，
> `launch-checklist` 节点会读取此字段并相应标记发布状态。

## Downstream Contract

→ `launch-checklist` 读取：
- `launch_readiness` — 是否存在 P0 阻塞
- `p0_gaps[].status` — 所有 P0 差距是否已解决
- `screenshots_produced[]` — 截图资产清单
