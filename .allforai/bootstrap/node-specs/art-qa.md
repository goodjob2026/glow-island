---
node: art-qa
discipline_owner: art-director
discipline_reviewers: [lead-designer]
human_gate: true
blocked_by: [tile-art-gen, character-art-gen, environment-art-gen, ui-art-gen, vfx-art-gen]
unlocks: []
exit_artifacts:
  - .allforai/game-design/art-qa-report.html
---

# Task: 美术 QA 验收（Art QA Review）

## Context Pull
- 读取 `art-asset-inventory.json` — 查看所有 current_state 分布
- 读取各 art-gen 节点产出的 HTML 报告：
  - `tile-art-review.html`
  - `character-art-review.html`
  - `environment-art-review.html`
  - `ui-art-review.html`
  - `vfx-art-review.html`
- 读取 `art-direction-v2.html` — 验收标准参照

## 验收维度

对已生成的所有 `current_state=temp` 资产，按以下维度逐类评分（1–5 分）：

### 1. 风格一致性（Style Consistency）
- 所有图块/角色/背景是否共享同一视觉语言（Animal Crossing 圆润、暖色调）
- 各类别之间不应有明显的风格断层

### 2. 颜色合规性（Color Compliance）
- 图块配色是否符合对应章节 color token
- UI 图标颜色是否使用 art-tokens.json 中的标准色值

### 3. 功能可识别性（Functional Legibility）
- 特殊块（bomb/windmill/light/wave）是否在小尺寸下功能可辨
- UI 图标在 32px 尺寸下是否清晰可读
- 岛屿区域 s0/s4 两端状态是否有足够视觉差异

### 4. 角色一致性（Character Consistency）
- NPC 们的风格是否统一（比例、轮廓线粗细）
- 律与 ひなた 在表情变体间是否保持身份可识别

### 5. 资产完整性（Coverage）
- 已生成样本是否覆盖所有关键视觉区域
- 记录缺口清单（gap list）供下一迭代

## 输出

**art-qa-report.html** — 深色主题，包含：
1. 总体评分卡（5 个维度雷达图）
2. 各类别详细评审（类别名 / 样本截图 / 评分 / 通过/待修）
3. **GAP 列表**：`current_state=placeholder` 的资产清单 + 生产路径建议
4. **不一致记录**：inventory ID ↔ 实际文件名的不匹配清单（需在下次 art-spec-design 修订解决）
5. 下一迭代建议（优先级排序）

## 完成条件
- 所有 5 个 art-gen 节点均为 approved 状态
- art-qa-report.html 已生成，包含明确的通过/待修决策
- 若有 category 评分 < 3 分 → 对应 art-gen 节点回到 revision-requested

## 注意
art-qa 不触发 game-design-finalize 重新执行（finalize 已完成）。
但 art-qa 的 gap list 作为下一轮设计迭代的输入，
写入 `corrections_applied[]`（workflow.json）供 /run 学习提取。
