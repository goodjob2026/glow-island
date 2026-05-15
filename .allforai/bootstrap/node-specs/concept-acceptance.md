---
node_id: concept-acceptance
node: concept-acceptance
capability: concept-acceptance
human_gate: false
hard_blocked_by: [code-repair-loop]
unlocks: [runtime-smoke-verify]
exit_artifacts:
  - .allforai/product-concept/acceptance-report.json---

# Task: 产品概念验收

## 目标

验证最终实现的产品体验是否与 `.allforai/product-concept/concept-baseline.json` 描述的产品愿景闭合。

## 输入

- `.allforai/product-concept/concept-baseline.json`（产品愿景基线）
- `.allforai/product-concept/product-concept.json`（产品概念详细功能）
- `.allforai/bootstrap/e2e-results.json`（E2E 验证结果）
- `.allforai/visual-qa/visual-qa-report.json`（视觉 QA 结果）
- `.allforai/bootstrap/repair-loop-report.json`（修复循环结果）

## 验收维度

### 1. 核心体验闭合

对照 `concept-baseline.json` 中的核心体验承诺，检查：

| 概念承诺 | 实现状态 | 证据 |
|---------|---------|------|
| 连连看核心玩法（步数制，无倒计时） | 通过/失败 | e2e TC-003 |
| 治愈系视觉（Animal Crossing 美学） | 通过/失败 | visual-qa dimensions |
| 无体力系统 | 通过/待验证 | 代码检查 |
| 5种战术特殊图块 | 通过/失败 | 代码检查 |
| 单货币（沙滩币）续关付费点 | 通过/待验证 | 代码检查 |

### 2. Must-Have 功能覆盖率

遍历 `product-concept.json` 中 `priority == "must_have"` 的功能，逐一检查是否有代码实现：

```bash
cat .allforai/product-concept/product-concept.json | python3 -c "
import json, sys
d = json.load(sys.stdin)
must_have = [f for f in d.get('features', []) if f.get('priority') == 'must_have']
print(f'Must-have features: {len(must_have)}')
for f in must_have:
    print(f'  {f[\"id\"]}: {f[\"name\"]}')
"
```

对每个 must-have 功能，搜索对应代码实现：
```bash
grep -r "ZenMode\|SpecialTile\|MetaProgress\|AudioManager\|NPC\|Shop\|IAP" game-client/assets/scripts/ | wc -l
```

### 3. 视觉概念闭合

对照 art-direction.md 的核心原则：
- 圆润优先 → visual-qa `tile_rounded_corners` == pass？
- 暖色主导 → visual-qa 截图中暖色占主导？
- 手绘质感 → 非纯色块？（截图对比）

### 4. 技术负债扫描

快速扫描关键技术指标：
```bash
# 检查是否有 TODO/FIXME 指向核心功能
grep -r "TODO\|FIXME\|HACK\|stub\|placeholder" game-client/assets/scripts/ --include="*.ts" | grep -v ".meta" | grep -v "node_modules" | head -20
```

## 评分

总分 100 分（核心体验30 + must-have覆盖40 + 视觉闭合20 + 技术健康10）：
- 90+：PASS — 产品体验与概念闭合
- 75-89：PASS_WITH_WARNINGS — 有minor差距，不阻塞发布
- <75：FAIL — 需要补齐后重跑

## 完成标准

```json
{
  "assessed_at": "<ISO>",
  "concept_version": "1.0",
  "scores": {
    "core_experience": { "score": N, "max": 30 },
    "must_have_coverage": { "score": N, "max": 40, "covered": K, "total": M },
    "visual_closure": { "score": N, "max": 20 },
    "tech_health": { "score": N, "max": 10 }
  },
  "total_score": N,
  "verdict": "PASS|PASS_WITH_WARNINGS|FAIL",
  "gaps": [],
  "recommended_actions": []
}
```
