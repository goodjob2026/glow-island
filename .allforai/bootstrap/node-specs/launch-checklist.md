---
node_id: launch-checklist
capability: launch-prep
human_gate: false
hard_blocked_by: [store-compliance, store-assets, runtime-smoke-verify]
unlocks: []
exit_artifacts:
  - path: .allforai/launch-prep/launch-checklist.json
  - path: .allforai/launch-prep/launch-checklist.md
---

# Task: 上架清单汇总 — 生成 Glow Island iOS 上架就绪报告

汇总所有上架准备节点的结果，生成最终的上架清单和就绪评估报告。

## Project Context

- **Product**: Glow Island — iOS App Store 上架
- **Goal**: 给出明确的"就绪/未就绪"判断，并列出剩余阻断项

## Context Pull

**必需（缺失则报错）：**
- `.allforai/launch-prep/competitive-research.json` — 读取 `synthesis.price_recommendation`（定价确认）
- `.allforai/launch-prep/implementation-gaps.json` — 读取 `gaps[]`、`launch_readiness`（实现缺口状态）
- `.allforai/launch-prep/compliance-checklist.json` — 读取 `checklist[]`、`summary`（合规检查结果）
- `.allforai/launch-prep/store-assets.json` — 读取 `readiness`、`descriptions`（素材准备状态）
- `.allforai/launch-prep/runtime-smoke-result.json` — 读取 `summary.verdict`、`launch_readiness`（后端运行时状态）

## Guidance

### 1. 聚合所有节点结果

读取以上 5 个文件，按以下维度汇总：

**维度 A — 实现完整性 (implementation-gaps.json)**
- 汇总 P0 缺口：全部解决 → ✅；任意未解决 → ❌ + 列出
- 汇总 P1 缺口：作为建议项列出

**维度 B — 合规状态 (compliance-checklist.json)**
- P0 合规项全部 done/not_applicable → ✅；否则 ❌

**维度 C — 后端运行时 (runtime-smoke-result.json)**
- `summary.verdict == "pass"` → ✅；否则 ❌

**维度 D — 素材准备 (store-assets.json)**
- 描述文案（zh + en）: done → ✅
- IAP 定价配置: done → ✅
- 截图: 若 `screenshots.required_sizes[].status` 全为 available → ✅；否则 ⚠️（P1，可上架但建议先准备好）
- 支持 URL + 隐私政策 URL: 若均已配置 → ✅；否则 ❌（P0）

**维度 E — 定价决策 (competitive-research.json)**
- `price_recommendation` 存在且有 rationale → ✅

### 2. 生成 launch-checklist.json

```json
{
  "generated_at": "<ISO>",
  "product": "Glow Island",
  "platform": "iOS App Store",
  "verdict": "ready | not_ready",
  "verdict_reason": "<一句话说明就绪或不就绪的核心原因>",
  "dimensions": [
    {
      "id": "DIM-A",
      "name": "实现完整性",
      "status": "pass | fail | warning",
      "blockers": [],
      "warnings": []
    },
    {
      "id": "DIM-B",
      "name": "App Store 合规",
      "status": "pass | fail | warning",
      "blockers": [],
      "warnings": []
    },
    {
      "id": "DIM-C",
      "name": "后端运行时",
      "status": "pass | fail",
      "blockers": []
    },
    {
      "id": "DIM-D",
      "name": "商店素材",
      "status": "pass | fail | warning",
      "blockers": [],
      "warnings": ["截图需要在实机/模拟器截取"]
    },
    {
      "id": "DIM-E",
      "name": "定价决策",
      "status": "pass | fail",
      "recommended_iap_tiers": []
    }
  ],
  "blocking_items": [
    {
      "id": "<COMP-xxx or GAP-xxx>",
      "source": "<compliance | gaps | smoke | assets>",
      "description": "<阻断项描述>",
      "action": "<具体操作步骤>"
    }
  ],
  "recommended_actions": [
    {
      "priority": "P1",
      "description": "<建议但不阻断的行动项>",
      "action": "<具体步骤>"
    }
  ],
  "next_steps": {
    "immediate": [
      "<今天必须完成的事项>"
    ],
    "before_submit": [
      "<提交前必须完成的事项>"
    ],
    "post_launch": [
      "<上架后建议的行动项>"
    ]
  }
}
```

### 3. 生成 launch-checklist.md

写一份人类可读的 Markdown 上架清单，格式如下：

```markdown
# Glow Island — iOS App Store 上架清单

生成时间: <timestamp>

## 总体评估

**状态**: ✅ 就绪 / ❌ 未就绪

<verdict_reason>

---

## A. 实现完整性

| 缺口 | 优先级 | 状态 | 行动项 |
|------|--------|------|--------|
| IAP StoreKit 实现 | P0 | ✅ | — |
| 恢复购买按钮 | P0 | ❌ | 在设置页面添加恢复购买 |
| ... | | | |

## B. App Store 合规

| 合规项 | 优先级 | 状态 | 操作位置 |
|--------|--------|------|---------|
| 隐私政策 URL | P0 | ⚠️ 需填写 | App Store Connect > App Information |
| App Privacy Labels | P0 | ⚠️ 需填写 | App Store Connect > App Privacy |
| ... | | | |

## C. 后端运行时

| 测试用例 | 状态 |
|---------|------|
| 健康检查 | ✅ |
| 匿名认证 | ✅ |
| 云存档读写 | ✅ |
| IAP 端点存在 | ✅ |

## D. 商店素材

| 素材 | 状态 |
|------|------|
| App 名称 | ✅ Glow Island |
| 中文描述 | ✅ 已生成 |
| 英文描述 | ✅ 已生成 |
| 截图 (iPhone 6.7") | ⚠️ 需拍摄 |
| ... | |

## E. IAP 定价

| 档位 | 丹青石 | 价格 (USD) |
|------|--------|-----------|
| 小袋 | 50 | $0.99 |
| 一袋 | 180 | $2.99 |
| 大袋 | 650 | $9.99 |

---

## 立即行动项

1. [ ] <P0 行动项 1>
2. [ ] <P0 行动项 2>

## 提交前完成

1. [ ] <P1 行动项>

## 上架后建议

- <建议项>
```

### 4. 特殊情况处理

若 `verdict = "not_ready"` 且存在 P0 阻断项：
- `next_steps.immediate` 列出所有 P0 行动项（明确到操作位置：App Store Connect 的哪个页面 / 代码的哪个文件）
- 不要只说"完成 GAP-001"，要展开成具体步骤

若 `verdict = "ready"`：
- 添加提交步骤：`xcodebuild archive → xcrun altool --upload-app → TestFlight 内测 → 正式提交审核`

## Theory Anchors

- **Launch Readiness**: P0 任意未解决 = not_ready（没有例外）
- **Action-oriented Checklist**: 每个 ❌ 项必须有可执行的下一步，不留模糊描述

## Exit Artifacts

**`.allforai/launch-prep/launch-checklist.json`**
- `verdict` 明确为 `ready` 或 `not_ready`
- 所有 `blocking_items` 有具体 `action` 说明

**`.allforai/launch-prep/launch-checklist.md`**
- 完整 Markdown 报告，可直接复制给团队成员
- 所有 ❌/⚠️ 项有可执行的操作步骤
