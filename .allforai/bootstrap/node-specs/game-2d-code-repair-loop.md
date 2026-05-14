---
node: game-2d-code-repair-loop
goal: "修复 2D QA 发现的代码缺口并重跑受影响验收"
capability: game-2d-production
human_gate: false
discipline_owner: gameplay-frontend-engineer
hard_blocked_by:
  - "game-2d-core-loop-playability-qa"
  - "game-2d-asset-binding-visual-qa"
  - "game-2d-session-completion-qa"
alignment_refs: []
exit_artifacts:
  - ".allforai/game-2d/repair/code-repair-loop-report.json"
  - ".allforai/game-2d/repair/code-repair-loop-report.md"
  - ".allforai/game-2d/qa/revalidation-report.json"
---

# game-2d-code-repair-loop

## Mission

执行 2D 游戏生产闭环节点。读取并严格遵循：

`${CLAUDE_PLUGIN_ROOT}/skills/game-2d-production/40-qa/code-repair-loop/SKILL.md`

## Inputs

- `.allforai/game-design/game-design-doc.json`
- `.allforai/game-design/design/program-development-node-handoff.json`
- `.allforai/game-runtime/art/engine-ready-art-manifest.json`
- `.allforai/game-frontend/assembly/playable-client-assembly-report.json`
- `.allforai/game-frontend/qa/runtime-gameplay-visual-acceptance-report.json`
- 上游 `game-2d-production` 节点已经生成的 `.allforai/game-2d/` 契约和报告

## Required Behavior

- 使用目标项目真实运行时；如果无法运行，输出阻塞状态，不使用替代验收。
- 需要视觉判断时，使用运行时截图和 Codex CLI 视觉验收文档。
- 不允许只凭 JSON、日志、源码阅读或静态截图通过可玩性验收。
- 输出必须写到 frontmatter 中声明的 `exit_artifacts`。

## Outputs

- `.allforai/game-2d/repair/code-repair-loop-report.json`
- `.allforai/game-2d/repair/code-repair-loop-report.md`
- `.allforai/game-2d/qa/revalidation-report.json`
