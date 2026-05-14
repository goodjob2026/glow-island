---
node: launch-checklist
node_id: launch-checklist
exit_artifacts:
  - .allforai/launch-prep/launch-checklist.json
  - .allforai/launch-prep/launch-checklist.md
---

# Task: 最终上架清单（Glow Island App Store Connect 提交）

## Project Context

- 游戏：Glow Island — 治愈系连连看，iOS + WebGL
- 这是最后一个 bootstrap 节点，汇总所有上架准备结果

## Context Pull

**必需（缺失则报错返回）：**
- 读取 `.allforai/launch-prep/launch-concept-finalize.json` → `app_store_metadata`
- 读取 `.allforai/launch-prep/compliance-checklist.json` → `overall_status`、`blockers[]`
- 读取 `.allforai/launch-prep/launch-gap-implementation.json` → `launch_readiness`、`p0_gaps[]`

## Guidance

### 汇总逻辑

1. 读取所有上游 launch-prep 节点的产物
2. 检查所有 P0 阻塞项（来自 gap-implementation 和 compliance-check）
3. 生成可操作的 App Store Connect 提交步骤清单
4. 输出 `overall_launch_status`：
   - `ready`：所有 P0 通过，可以提交 App Store 审核
   - `blocked`：存在未解决的 P0，不得提交

### App Store Connect 提交步骤（生成为清单）

**第一阶段：准备阶段（提交前）**
- [ ] 在 Xcode 中 Archive 构建（Release 配置）
- [ ] 上传到 App Store Connect（Transporter 或 Xcode Organizer）
- [ ] 完成 App 信息填写（名称、副标题、关键词、描述）
- [ ] 上传 6.7" iPhone 截图（5-10张）
- [ ] 填写 Privacy Nutrition Label（数据类型声明）
- [ ] 填写年龄分级问卷
- [ ] 设置 IAP 产品（4个价格档位）并提交 Apple 审核
- [ ] 填写客服 URL 和隐私政策 URL

**第二阶段：TestFlight 测试**
- [ ] 发布到 TestFlight Internal Testing
- [ ] 完成至少 1 轮完整关卡测试（Ch1-5关）
- [ ] 确认 IAP 在 Sandbox 环境正常

**第三阶段：提交审核**
- [ ] 确认所有 P0 阻塞项已解决
- [ ] 提交审核（通常 1-3 个工作日）
- [ ] 准备好可能的追加信息（Demo 账号 / 功能说明）

**第四阶段：上线准备**
- [ ] 设置发布日期（手动发布 vs 审核通过后自动发布）
- [ ] 准备营销素材（如果需要）
- [ ] 配置 App Analytics 追踪

### WebGL 上线步骤（次）
- [ ] 构建 WebGL 版本（`npx @cocos/cocos-cli build --platform web-mobile`）
- [ ] 部署到 HTTPS CDN（Vercel / Cloudflare Pages 推荐）
- [ ] 更新隐私政策页面链接
- [ ] 提交 Google Play（如后续计划 Android）

## Exit Artifacts

### `.allforai/launch-prep/launch-checklist.json`

```json
{
  "schema_version": "1.0",
  "generated_at": "<ISO>",
  "overall_launch_status": "ready | blocked",
  "blocking_reasons": [],
  "app_store_metadata_summary": {
    "app_name": "Glow Island",
    "subtitle": "Healing Tile Connect",
    "category": "Games > Puzzle",
    "age_rating": "4+",
    "iap_tiers_count": 4,
    "screenshots_ready": true,
    "description_ready": true,
    "keywords_ready": true
  },
  "iap_readiness": {
    "products_defined": true,
    "sandbox_tested": false,
    "receipt_validation_backend": true
  },
  "compliance_summary": {
    "privacy_policy_url": "<URL>",
    "att_required": false,
    "age_rating": "4+",
    "overall_status": "compliant"
  },
  "checklist_items": [
    {"phase": "preparation", "item": "<描述>", "status": "pending | done | blocked"},
    {"phase": "testflight", "item": "<描述>", "status": "pending"},
    {"phase": "submit", "item": "<描述>", "status": "pending"}
  ],
  "estimated_review_days": "1-3",
  "notes": "<任何特殊注意事项>"
}
```

### `.allforai/launch-prep/launch-checklist.md`

人类可阅读的完整上架清单，格式为 Markdown Checkbox 列表，包含：
- App Store Connect 操作步骤（带 checkbox）
- 关键数据汇总（IAP 价格、关键词列表、截图规格）
- 发布时间建议
- 如有阻塞项：明确列出阻塞原因和解决方案
