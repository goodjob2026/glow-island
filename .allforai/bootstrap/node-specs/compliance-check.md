---
node: compliance-check
node_id: compliance-check
human_gate: false
hard_blocked_by: [launch-concept-finalize, fix-compliance-urls]
unlocks: [launch-checklist]
exit_artifacts:
  - .allforai/launch-prep/compliance-checklist.json
---

# Task: iOS App Store 合规检查（Glow Island）

## Project Context

- 平台：iOS App Store（主），WebGL（次）
- 技术：Cocos Creator 3.x（游戏端）+ Fastify + PostgreSQL（后端）
- IAP：沙滩币（Sand Coins）单货币，StoreKit 2（或 cordova-plugin-purchase）
- 数据收集：匿名用户 ID（UUID）+ 云存档 + 排行榜昵称（可选）

## Context Pull

**必需（缺失则报错返回）：**
- 读取 `.allforai/launch-prep/launch-concept-finalize.json` → `contains_iap`、`age_rating`，
  确认合规检查范围

## Guidance

### 合规检查清单

#### 1. 隐私政策
- [ ] 隐私政策 URL 已存在（需要可访问的 HTTPS 页面）
- [ ] 隐私政策说明：匿名 UUID 收集、云存档数据、无广告追踪
- [ ] App Store Connect → App Privacy → 数据类型声明填写正确

**数据类型声明（App Store Privacy Nutrition Label）：**
| 数据类型 | 是否收集 | 用途 | 与用户身份关联 |
|---------|---------|------|--------------|
| 用户 ID（UUID） | 是 | App Functionality | 是（设备绑定） |
| 游戏进度 | 是 | App Functionality | 是 |
| 购买历史 | 是（IAP 验证） | App Functionality | 是 |
| 崩溃数据 | 是（如集成 Crashlytics） | Analytics | 否 |
| 精确位置 | 否 | — | — |
| 联系信息 | 否 | — | — |

#### 2. NSPrivacyUsageDescription（Info.plist）
检查 Cocos Creator 构建输出的 Info.plist，确认已包含所有使用的权限说明：
- 如使用相机/麦克风：需 NSCameraUsageDescription / NSMicrophoneUsageDescription
- 如使用推送通知：NSUserNotificationUsageDescription
- **Glow Island 预期**：通常只需 NSPhotoLibraryUsageDescription（截图保存功能，如有）

#### 3. App Tracking Transparency (ATT)
- 如无广告追踪，**不需要** NSUserTrackingUsageDescription
- 确认代码中无第三方广告 SDK（AdMob、Meta Audience Network 等）
- 如有 Crashlytics：Firebase SDK 已内置 IDFA 豁免逻辑

#### 4. IAP 合规
- [ ] StoreKit 收据验证使用服务端验证（`/api/iap/validate`，已实现）
- [ ] 消耗型 IAP（Consumable）使用正确类型
- [ ] IAP 产品 ID 格式：`com.glowisland.coins_*`（与代码一致）
- [ ] Sandbox 测试账号已创建并测试购买流程

#### 5. 年龄分级问卷（App Store Connect）
- Cartoon or Fantasy Violence: None
- Realistic Violence: None
- Sexual Content: None
- Nudity: None
- Horror/Fear Themes: None
- Gambling: None（续关不属于赌博）
- **建议最终分级：4+**

#### 6. App Store 审核指南关键检查
- [ ] 无虚假功能承诺
- [ ] 不使用禁止关键词（hack, crack, cheat 等）
- [ ] 截图真实反映游戏内容
- [ ] 隐私政策链接在 App Store Connect 中填写
- [ ] 客服邮件在 App Store Connect 中填写

#### 7. WebGL（次要平台）
- [ ] HTTPS 托管（无 mixed-content）
- [ ] 隐私政策链接在页面底部可访问

## Exit Artifacts

### `.allforai/launch-prep/compliance-checklist.json`

```json
{
  "schema_version": "1.0",
  "checked_at": "<ISO>",
  "platform": "iOS App Store",
  "items": [
    {
      "category": "privacy_policy",
      "item": "隐私政策页面 URL 可访问",
      "status": "passed | failed | not_applicable | manual_required",
      "notes": "",
      "url": "<URL if applicable>"
    }
  ],
  "blockers": [
    {
      "item": "<阻塞上架的合规问题>",
      "priority": "P0",
      "resolution": "<建议解决方案>"
    }
  ],
  "age_rating": "4+",
  "iap_compliance": "passed | failed | not_checked",
  "att_required": false,
  "overall_status": "compliant | non_compliant | manual_review_required"
}
```

## Downstream Contract

→ `launch-checklist` 读取：
- `overall_status` — 合规总状态
- `blockers[]` — 合规阻塞项
- `age_rating` — 年龄分级确认值
