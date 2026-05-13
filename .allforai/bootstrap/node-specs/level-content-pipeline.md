---
node_id: level-content-pipeline
capability: level-gen
human_gate: false
hard_blocked_by: []
unlocks: [compile-verify]
exit_artifacts:
  - path: tools/level-gen/src/generator.ts
  - path: tools/level-gen/src/solver.ts
  - path: tools/level-gen/src/pipeline.ts
  - path: tools/level-gen/src/cli.ts
  - path: game-client/assets/resources/levels/ch1/level_1_1.json
  - path: game-client/assets/resources/levels/ch6/level_6_30.json
---

# Task: 关卡内容生成 Pipeline

> **本节点已完成**（transition_log 中 status=completed）。
> 如需重新生成，执行下方命令。

## 已完成的内容

- **generator.ts** — 基于种子 PRNG 的关卡生成器（章节 config 驱动）
- **solver.ts** — Beam Search 求解器（BEAM_WIDTH=150），替代 BFS，9.5s 完成 180 关
- **pipeline.ts** — 三层难度验收：band floor（带内下限含单调性）+ band ceiling（带间隔离）+ max_moves 余量
- **cli.ts** — `gen --all` 使用 6 个并行子进程（章节级并发），`validate --file` 单关验证
- **180 关 JSON** — 6 章 × 30 关，全部 `✓ OK`，0 warnings

## 重新生成命令

```bash
cd tools/level-gen
npm run gen -- --all          # 重新生成全量 180 关
npm run gen -- --chapter 1 --count 30  # 单章重生成
```

## 关卡质量指标（当前数据）

| 难度带   | min_moves 范围 | 保证              |
|---------|---------------|-------------------|
| easy    | 3–8           | 带内单调，ceil=8  |
| standard| 5–14          | 带内单调，ceil=14 |
| challenge| 8–22         | 带内单调，ceil=22 |
| boss    | 10+           | 无上限            |
| zen     | unlimited     | 跳过求解器        |
