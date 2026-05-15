---
node_id: canvas2d-concept-acceptance
node: canvas2d-concept-acceptance
goal: "Canvas2D 重写版产品概念终验：对照设计文档验证核心体验闭合、经济模型、双货币、禅模式"
capability: canvas2d-engineer
human_gate: false
hard_blocked_by:
  - canvas2d-mobile-build
  - canvas2d-ios-build
  - canvas2d-qa-repair-loop
exit_artifacts:
  - "canvas2d-client/www/qa/canvas2d-acceptance-report.json"
---

# canvas2d-concept-acceptance

## Mission

Canvas2D 重写完成后的终验节点。对照产品概念文档验证实现是否闭合，
覆盖玩法规则、经济模型、视觉、音频、移动端适配5个维度。

## 输入文档

- `.allforai/product-concept/product-concept.json`
- `.allforai/game-design/puzzle-mechanics-spec.json`
- `canvas2d-client/www/qa/browser-qa-report.json`
- `canvas2d-client/www/qa/gameplay-quality-report.json`

## 验收维度

### 1. 核心玩法闭合（30分）

| 验收点 | 验证方式 | 满分 |
|--------|---------|------|
| BFS路径：转弯≤2，Portal零转弯 | gameplay-quality-report bfs_rules全部pass | 8 |
| 特殊图块：bomb/windmill/lantern/wave 4种正确 | grep 代码 + 报告 | 8 |
| Combo生成：combo=3→bomb，combo=4→windmill | gameplay-quality-report combo section | 7 |
| 关卡目标：4种类型（tile_target/obstacle_clear/score_target/clear_all）| grep LevelGoal | 7 |

### 2. 经济模型闭合（25分）

| 验收点 | 验证方式 | 满分 |
|--------|---------|------|
| 初始沙滩币=200 | grep ProgressManager "coins: 200" | 5 |
| 续关=30沙滩币，+5步（不是+20）| grep GameplayScene continue | 5 |
| 重排=30沙滩币 | grep "reshuffle" "30" | 5 |
| 预判=10沙滩币，持续3秒 | grep "hint" "10" "3" | 5 |
| 沙漏奖励=每4h，10-20币 | ShopScene._claimHourglass 存在 | 5 |

### 3. 双货币系统（15分）

| 验收点 | 验证方式 | 满分 |
|--------|---------|------|
| ProgressManager 含 glowstone 字段 | grep glowstone ProgressManager.js | 5 |
| IAP 购买流程：submitIAP → addGlowstone | ApiClient.js 存在 + ShopScene.js | 5 |
| 丹青石→沙滩币兑换 UI 存在 | ShopScene._exchangeCoins | 5 |

### 4. 视觉与音频闭合（20分）

| 验收点 | 验证方式 | 满分 |
|--------|---------|------|
| 6章棋盘形状各不同（异形非矩形）| layouts.js 6章各3变体 | 5 |
| 棋盘形状每次进关随机变换 | pickLayout + randomTransform | 5 |
| 6章专属BGM | AudioManager + bgm_chapter1-6 key | 5 |
| 禅模式 bgm_zen_ambient | ZenGameplayScene.js | 5 |

### 5. 移动端适配（10分）

| 验收点 | 验证方式 | 满分 |
|--------|---------|------|
| 竖屏锁定 | AndroidManifest screenOrientation=portrait | 5 |
| Android APK 可安装运行 | canvas2d-mobile-build report | 5 |

> **IAP 范围说明**：`canvas2d-mobile-build` 报告只验证 APK 可启动，不含原生 IAP 路径。
> IAP 可用性验证由 `canvas2d-ios-build` 的 WebKit 降级模式覆盖（`Capacitor.isNativePlatform() = false` 时
> 自动走浏览器测试流程，addGlowstone(60) 直接调用）。
> 不可降级的原生 IAP 收据验证属于 App Store / Google Play 上架后回归范围，不阻塞本节点。

## 评分与判定

总分 100：
- **90+**：PASS — 可提交 App Store / Google Play
- **75-89**：PASS_WITH_WARNINGS — 有 minor 差距，记录但不阻塞
- **<75**：FAIL — 需补齐后重跑

## 输出格式

```json
{
  "assessed_at": "<ISO>",
  "canvas2d_version": "1.0",
  "scores": {
    "core_gameplay": { "score": 0, "max": 30, "details": {} },
    "economy_model": { "score": 0, "max": 25, "details": {} },
    "dual_currency": { "score": 0, "max": 15, "details": {} },
    "visual_audio": { "score": 0, "max": 20, "details": {} },
    "mobile_fit": { "score": 0, "max": 10, "details": {} }
  },
  "total_score": 0,
  "verdict": "PASS|PASS_WITH_WARNINGS|FAIL",
  "gaps": [],
  "recommended_actions": []
}
```

写入 `canvas2d-client/www/qa/canvas2d-acceptance-report.json`

## 验收标准

1. 报告文件存在，verdict 不为 FAIL
2. core_gameplay 满分（BFS + 特殊图块必须正确）
3. economy_model 至少 20/25（允许1个 minor 差距）
4. 双货币：ProgressManager 含 glowstone 字段
5. 移动端：APK 已构建成功
