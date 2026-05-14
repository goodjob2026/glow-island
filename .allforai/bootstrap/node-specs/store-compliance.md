---
node_id: store-compliance
capability: launch-prep
human_gate: false
hard_blocked_by: [launch-gap-analysis]
unlocks: [launch-checklist]
exit_artifacts:
  - path: .allforai/launch-prep/compliance-checklist.json
---

# Task: iOS App Store 合规检查

检查 Glow Island 是否满足 iOS App Store 的所有合规要求，生成可直接用于 App Store Connect 填写的合规清单。

## Project Context

- **Target**: iOS App Store（主）
- **Monetization**: IAP — 丹青石硬货币套餐（非订阅型 IAP）
- **No ads**: 无广告 SDK，无 IDFA 使用
- **Game engine**: Cocos Creator 3.x
- **Backend**: Fastify REST API（用于云存档和 IAP 服务端验证）

## Context Pull

**必需（缺失则报错返回）：**
- 从 `.allforai/launch-prep/implementation-gaps.json` 读取 `gaps[]`（筛选 category=="compliance" 的 P0/P1 缺口），了解哪些合规项已知存在问题

**可选（缺失则继续，使用通用检查）：**
- `.allforai/product-concept/product-concept.json` — 读取 features 确认功能集（影响内容评级）

## Guidance

### 1. App Store Review Guidelines 合规检查清单

逐项检查以下合规项。对每项：
- 检查代码/配置（grep 或 find）
- 记录当前状态 (done / missing / needs_action)
- 给出具体的操作建议

**1.1 隐私政策 (P0 — 必须)**

```bash
# 检查是否有隐私政策相关代码或配置
grep -r "privacyPolicy\|privacy_policy\|privacy-policy" game-client/assets/ --include="*.ts"
grep -r "privacy" backend/src/ --include="*.ts"
```

要求：
- App Store Connect 中填写可访问的隐私政策 URL（必须是 HTTPS）
- App 内（设置页面）有链接到隐私政策

**1.2 App Privacy Labels (P0 — App Store Connect 填写项)**

分析 Glow Island 收集了哪些数据：
- Device ID（匿名认证用）→ 归类为"Device ID — App Functionality"
- Game progress / save data → "Gameplay Content — App Functionality"
- 无广告追踪 → 无需声明 IDFA

检查后端：
```bash
grep -r "device_id\|userId\|analytics\|crashlytics" backend/src/ --include="*.ts" | head -10
grep -r "firebase\|sentry\|amplitude\|mixpanel" package.json game-client/package.json 2>/dev/null
```

**1.3 IAP 合规 (P0)**

- [ ] 所有付费功能必须通过 StoreKit（不得有外部支付链接）
- [ ] 若有消耗型 IAP：无需恢复购买按钮（但若有非消耗型 IAP 需要恢复）
- [ ] 丹青石属于消耗型 IAP → 严格来说不强制恢复购买，但 Apple 指南建议提供
- [ ] App 内不得出现 "如果需要更多选项，请访问我们的网站" 等绕过 IAP 的提示

```bash
grep -r "purchase\|Payment\|Product\|Store\|subscribe" game-client/assets/ --include="*.ts" | grep -v ".meta" | head -20
```

**1.4 App Tracking Transparency (P0 — iOS 14.5+)**

确认：Glow Island 是否使用 IDFA 或任何追踪 SDK？
```bash
# 检查广告/分析 SDK
grep -r "AdMob\|AppsFlyer\|Adjust\|IDFA\|ATTrackingManager\|requestTrackingAuthorization" game-client/ -r 2>/dev/null
grep -r "firebase\|amplitude\|segment\|appsflyer" game-client/package.json 2>/dev/null
```

若无追踪 SDK → App Privacy Labels 中声明"不追踪用户"，无需 ATT 弹窗

**1.5 出口合规 (P1)**

Cocos Creator 使用标准 HTTPS/TLS — 属于"使用标准加密"：
- 在 Info.plist 或 App Store Connect 中声明 `ITSAppUsesNonExemptEncryption = NO`（标准加密豁免）
- 检查游戏是否有自定义加密算法

```bash
# 检查是否有自定义加密
grep -r "AES\|RSA\|encrypt\|decrypt\|cipher" game-client/assets/ backend/src/ --include="*.ts" | grep -v "node_modules" | head -10
```

**1.6 内容评级 (P1)**

分析 Glow Island 内容：
- 无暴力、无成人内容、无赌博机制（无"老虎机"或纯概率付费盲盒）
- 有虚构货币（丹青石）但不可与真实货币兑换
- 推荐评级：4+

检查：
```bash
grep -r "random\|gacha\|lootbox\|loot.box\|盲盒\|概率" game-client/assets/ --include="*.ts" | head -10
```

**1.7 崩溃监控 (P1 — 上架强烈建议)**

```bash
grep -r "Sentry\|Crashlytics\|Firebase\|bugsnag" game-client/package.json backend/package.json 2>/dev/null
```

若无 → 建议集成 Sentry（免费额度足够独立游戏）

**1.8 应用最低系统版本 (P1)**

Cocos Creator 3.x 最低支持 iOS 12.0。检查项目配置：
```bash
cat game-client/settings/v2/packages/project.json 2>/dev/null | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('ios',{}))" 2>/dev/null || echo "未找到 Cocos 项目配置"
```

### 2. 生成合规清单

```json
{
  "generated_at": "<ISO>",
  "platform": "iOS App Store",
  "product": "Glow Island",
  "checklist": [
    {
      "id": "COMP-001",
      "category": "privacy",
      "requirement": "隐私政策 URL",
      "priority": "P0",
      "status": "done | missing | needs_action",
      "evidence": "<grep 结果或检查结论>",
      "action_required": "<具体操作步骤，若 needs_action>",
      "app_store_connect_field": "App Privacy Policy URL"
    },
    {
      "id": "COMP-002",
      "category": "privacy_labels",
      "requirement": "App Privacy Labels 数据声明",
      "priority": "P0",
      "status": "needs_action",
      "data_collected": [
        {"type": "Device ID", "purpose": "App Functionality", "linked_to_user": false, "used_for_tracking": false},
        {"type": "Gameplay Content", "purpose": "App Functionality", "linked_to_user": false, "used_for_tracking": false}
      ],
      "action_required": "在 App Store Connect > App Privacy 中填写以上数据声明"
    },
    {
      "id": "COMP-003",
      "category": "iap",
      "requirement": "IAP 通过 StoreKit 实现",
      "priority": "P0",
      "status": "<done | missing>",
      "evidence": "<grep 结果>"
    },
    {
      "id": "COMP-004",
      "category": "att",
      "requirement": "ATT 弹窗 (若使用 IDFA)",
      "priority": "P0",
      "status": "not_applicable",
      "evidence": "无广告追踪 SDK"
    },
    {
      "id": "COMP-005",
      "category": "export_compliance",
      "requirement": "出口合规声明",
      "priority": "P1",
      "status": "needs_action",
      "action_required": "在 App Store Connect > 加密出口合规 中选择「是」（使用标准加密）并上传 ERN（若需要）或选择豁免"
    },
    {
      "id": "COMP-006",
      "category": "content_rating",
      "requirement": "内容评级",
      "priority": "P1",
      "recommended_rating": "4+",
      "status": "needs_action",
      "action_required": "在 App Store Connect 中完成年龄评级问卷，预期评级 4+"
    },
    {
      "id": "COMP-007",
      "category": "crash_monitoring",
      "requirement": "崩溃监控",
      "priority": "P1",
      "status": "<done | missing>",
      "recommendation": "集成 Sentry iOS SDK"
    }
  ],
  "summary": {
    "p0_items": 4,
    "p0_done": 0,
    "p0_missing": 0,
    "p0_needs_action": 0,
    "p1_items": 3,
    "overall_status": "ready | not_ready",
    "blocking_items": []
  }
}
```

## Theory Anchors

- **Apple App Store Review Guidelines 5.1**: 数据隐私要求（Privacy Policy + App Privacy Labels）
- **StoreKit 2**: 消耗型 IAP 的正确实现路径（iOS 15+ 推荐）
- **ATT Framework**: App Tracking Transparency 仅在使用 IDFA 时需要

## Exit Artifacts

**`.allforai/launch-prep/compliance-checklist.json`**
- 覆盖所有 7 个合规项
- 每个 `needs_action` 项都有具体的 `action_required` 说明
- `summary.overall_status` 基于 P0 项是否全部 done/not_applicable

## Downstream Contract

→ launch-checklist 读取: `checklist[]`（完整合规项列表）、`summary.blocking_items`（阻断项）、`summary.overall_status`
