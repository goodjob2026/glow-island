---
node_id: launch-gap-analysis
capability: launch-prep
human_gate: false
hard_blocked_by: [competitive-research]
unlocks: [store-compliance, store-assets]
exit_artifacts:
  - path: .allforai/launch-prep/implementation-gaps.json
---

# Task: 上架缺口分析 — 竞品研究后识别 P0/P1/P2 实现缺口

基于竞品调研结果，与当前实现对比，识别 Glow Island iOS 上架所需但尚未完成的实现缺口，并按优先级分类。

## Project Context

- **Product**: Glow Island (iOS + WebGL)
- **Monetization**: 双货币 — 沙滩币（软货币，关卡掉落）+ 丹青石（硬货币，IAP 购买）
- **IAP**: 丹青石套餐，无订阅
- **Client**: Cocos Creator 3.x (game-client/)
- **Backend**: Fastify + Prisma + PostgreSQL (backend/)

## Context Pull

**必需（缺失则报错返回，不要继续执行）：**
- 从 `.allforai/launch-prep/competitive-research.json` 读取 `synthesis.price_recommendation` 和 `synthesis.differentiation`，作为 gap 分析的参照基准

**可选（缺失则 warning 后继续）：**
- `.allforai/product-concept/product-concept.json` — 读取 features 列表和 monetization 字段，了解产品预期功能集
- `.allforai/bootstrap/bootstrap-profile.json` — 读取 modules、detected_patterns 了解已检测到的实现状态

## Guidance

### 1. 读取当前实现状态

检查以下关键实现区域（使用 grep/find）：

**IAP 实现 (P0 关键路径)**
```bash
# 检查 StoreKit 相关代码
grep -r "StoreKit\|SKPayment\|purchaseProduct\|IAP\|iap" game-client/assets/ --include="*.ts" -l
grep -r "iap\|receipt\|purchase" backend/src/ --include="*.ts" -l

# 检查 IAP 路由是否存在
grep -r "iap\|purchase\|verify" backend/src/ --include="*.ts" | grep "route\|handler\|fastify.post"
```

**恢复购买 (P0 App Store 强制要求)**
```bash
grep -r "restore\|RestorePurchases\|restoreCompletedTransactions" game-client/assets/ --include="*.ts"
```

**隐私政策 (P0)**
```bash
grep -r "privacy\|privacyPolicy\|privacy_policy" game-client/assets/ --include="*.ts"
```

**App Tracking Transparency / IDFA (P0 — iOS 14.5+)**
```bash
grep -r "ATTrackingManager\|requestTrackingAuthorization\|IDFA\|idfa" game-client/ -r
# 检查是否使用了任何广告 SDK
grep -r "AdMob\|AppsFlyer\|Adjust\|Firebase Analytics" game-client/ -r --include="*.json"
```

**内容评级材料 (P1)**
```bash
ls .allforai/launch-prep/ 2>/dev/null  # 检查已有哪些材料
```

**App 图标 (P1)**
```bash
find game-client/ -name "*.png" | xargs ls -la 2>/dev/null | grep -i "icon\|1024" | head -10
ls game-client/settings/ 2>/dev/null
```

**多语言支持 (P1)**
```bash
grep -r "i18n\|locale\|language\|zh\|en" game-client/assets/ --include="*.ts" -l | head -10
ls game-client/assets/resources/ 2>/dev/null | grep -i "lang\|locale\|i18n"
```

### 2. 对照竞品研究与 App Store 要求分类 Gap

按以下分类评估每个缺口：

**P0 — 上架阻断（必须完成）**
- IAP（StoreKit）实际购买流程可工作
- 恢复购买按钮（App Store 强制要求）
- 隐私政策 URL（在 App Store Connect 填写）
- 若使用 IDFA/广告追踪：ATT 弹窗（iOS 14.5+ 强制）
- App 图标 1024×1024 PNG

**P1 — 重要（强烈建议上架时完成）**
- 内容评级已在 App Store Connect 填写
- 出口合规申报（是否使用加密）
- 崩溃监控（Sentry / Firebase Crashlytics）
- 商店截图（至少 iPhone 6.7" 4张）
- 商店描述（ZH + EN）

**P2 — 可上架后补充**
- iPad 截图（若不针对 iPad 优化可不提交）
- App Preview 视频（可选）
- 多语言本地化（ZH/EN 之外）

### 3. 生成缺口分析报告

```json
{
  "generated_at": "<ISO>",
  "analysis_basis": {
    "competitive_research": ".allforai/launch-prep/competitive-research.json",
    "product_concept": ".allforai/product-concept/product-concept.json"
  },
  "gaps": [
    {
      "id": "GAP-001",
      "title": "<缺口标题>",
      "category": "IAP | compliance | assets | feature | analytics",
      "priority": "P0 | P1 | P2",
      "description": "<现状与期望差距>",
      "evidence": "<发现依据，如 grep 结果或缺失文件>",
      "implementation_effort": "low | medium | high",
      "required_files": ["<需要创建/修改的文件>"],
      "status": "missing | partial | done"
    }
  ],
  "pricing_decision": {
    "recommended_model": "freemium",
    "iap_tiers": [
      {"amount_usd": 0.99, "coins": 50, "label": "小袋丹青石"},
      {"amount_usd": 2.99, "coins": 180, "label": "一袋丹青石"},
      {"amount_usd": 9.99, "coins": 650, "label": "大袋丹青石"}
    ],
    "rationale": "<基于竞品调研的定价理由>",
    "regional_notes": "苹果 CNY 定价参考 Tier 1/3/5"
  },
  "launch_readiness": {
    "p0_gaps_resolved": false,
    "p0_blockers": ["<未解决的 P0 缺口 id 列表>"],
    "estimated_effort_to_launch": "<天数或工作量估计>"
  }
}
```

## Theory Anchors

- **KANO 模型**: 区分 P0（Must-be）/ P1（Performance）/ P2（Delighter）确保最小可上架集合
- **Gap Analysis**: 当前状态 vs 目标状态，每个 gap 需有明确的"证据"和"解决路径"

## Knowledge References

**§D User Confirmation Gate**: pricing_decision 中的定价建议来自竞品数据，但若用户在 /run 时希望调整，orchestrator 应暂停并等待用户确认后再写入 store-assets。

## Exit Artifacts

**`.allforai/launch-prep/implementation-gaps.json`**
- `gaps` 数组中 P0 项必须有 `evidence` 字段（不可为空）
- `pricing_decision` 必须有竞品研究支撑的 `rationale`
- `launch_readiness.p0_blockers` 列出所有未解决 P0

## Downstream Contract

→ store-compliance 读取: `gaps[]` (P0 compliance 类缺口列表)
→ store-assets 读取: `pricing_decision.iap_tiers`（定价档位）、`launch_readiness.p0_blockers`（需先解决的阻断项）
→ launch-checklist 读取: `launch_readiness`（上架就绪评估）、`gaps[].status`（逐项状态）
