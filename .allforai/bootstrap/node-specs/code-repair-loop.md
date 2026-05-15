---
node_id: code-repair-loop
node: code-repair-loop
capability: implement
human_gate: false
hard_blocked_by: [quality-checks, e2e-gameplay, ios-simulator-acceptance, visual-qa-game]
unlocks: [concept-acceptance]
exit_artifacts:
  - .allforai/bootstrap/repair-loop-report.json
---

# Task: QA 修复循环

遵循 generic QA repair loop 协议：读取 e2e + visual QA 的 code_gaps，修复代码，重跑验证，最多 3 次。

## 步骤

### 1. 读取 QA 报告

```bash
cat .allforai/bootstrap/e2e-results.json | python3 -c "import json,sys; d=json.load(sys.stdin); print('code_gaps:', len(d.get('code_gaps', [])))"
cat .allforai/visual-qa/visual-qa-report.json | python3 -c "import json,sys; d=json.load(sys.stdin); print('code_gaps:', len(d.get('code_gaps', [])))"
cat .allforai/quality-checks/deadhunt-report.json | python3 -c "import json,sys; d=json.load(sys.stdin); print('deadhunt_code_gaps:', len(d.get('code_gaps', [])))"
cat .allforai/quality-checks/fieldcheck-report.json | python3 -c "import json,sys; d=json.load(sys.stdin); print('fieldcheck_code_gaps:', len(d.get('code_gaps', [])))"
```

### 2. 分类

- `code_gaps`：代码实现问题 → 需修复
- `contract_gaps`：测试断言问题 → 更新测试（不改生产代码）
- `asset_gaps`：资产缺失 → 记录但不阻塞本节点
- `environment_blockers`：环境问题 → 报告给用户，停止重试

### 3. 修复循环（最多 3 次）

每次循环：
1. 修复所有 `code_gaps` 中的代码问题
2. 重跑受影响的测试（e2e-gameplay 或 visual-qa-game 的子集）
3. 检查是否所有 code_gaps 已清除
4. 若清除 → 标记通过；若仍有 → 进入下一次循环

若 3 次后仍有 `code_gaps`：
- 将未解决的 code_gaps 标记为 `blocked`
- 报告给用户，说明阻塞原因
- **不因阻塞而跳过**，让 concept-acceptance 继承阻塞信息

### 4. 停止条件

- 所有 code_gaps 修复（success）
- 达到 3 次上限（partial）
- 遇到 environment_blocker（blocked — 停止修复，报告用户）

## 完成标准

```json
{
  "completed_at": "<ISO>",
  "attempts": 1,
  "code_gaps_resolved": N,
  "code_gaps_blocked": M,
  "contract_gaps_updated": K,
  "status": "success|partial|blocked",
  "blocked_reason": null
}
```

若 `status == "blocked"`，`concept-acceptance` 收到阻塞信息后在报告中注明。
