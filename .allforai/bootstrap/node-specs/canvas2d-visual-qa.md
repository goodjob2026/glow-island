---
node_id: canvas2d-visual-qa
node: canvas2d-visual-qa
goal: "多场景多状态截图视觉验收：每个场景至少5张截图覆盖关键状态"
capability: canvas2d-engineer
human_gate: false
hard_blocked_by:
  - canvas2d-scene-manager
  - canvas2d-asset-bundle
  - canvas2d-intro-scene
  - canvas2d-island-map-scene
  - canvas2d-level-select-scene
  - canvas2d-gameplay-scene
  - canvas2d-dialog-scene
exit_artifacts:
  - "canvas2d-client/www/qa/visual/screenshots/index.json"
  - "canvas2d-client/www/qa/visual/screenshots/intro_act1.png"
  - "canvas2d-client/www/qa/visual/screenshots/intro_act2.png"
  - "canvas2d-client/www/qa/visual/screenshots/intro_act3.png"
  - "canvas2d-client/www/qa/visual/screenshots/island_map_ch1_unlocked.png"
  - "canvas2d-client/www/qa/visual/screenshots/island_map_locked.png"
  - "canvas2d-client/www/qa/visual/screenshots/level_select_ch1.png"
  - "canvas2d-client/www/qa/visual/screenshots/gameplay_initial.png"
  - "canvas2d-client/www/qa/visual/screenshots/gameplay_selected.png"
  - "canvas2d-client/www/qa/visual/screenshots/gameplay_path_drawn.png"
  - "canvas2d-client/www/qa/visual/screenshots/gameplay_combo.png"
  - "canvas2d-client/www/qa/visual/screenshots/gameplay_win.png"
  - "canvas2d-client/www/qa/visual/screenshots/gameplay_fail.png"
  - "canvas2d-client/www/qa/visual/screenshots/dialog_ch1_intro.png"
---

# canvas2d-visual-qa

## Mission

对所有场景进行多状态截图视觉验收，**每个场景最少5张截图，覆盖所有关键渲染状态**。
禁止省略截图步骤。

## 工具

使用 Playwright 自动化截图：
```bash
cd canvas2d-client
npx playwright test visual.spec.js --reporter=html
```

## 截图任务清单（共≥14张）

### IntroScene（过场动画）— 3张

| 文件名 | 触发时机 | 验收要点 |
|--------|----------|----------|
| intro_act1.png | 幕1开始 | 海天渐变背景、日文字幕、栏杆轮廓 |
| intro_act2.png | 幕2开始（点击后） | 码头背景（ch01_harbor_before）、标题字 |
| intro_act3.png | 幕3开始 | 背景放大、ひなた气泡、"点击继续"脉冲 |

### IslandMapScene（岛屿地图）— 3张

| 文件名 | 触发时机 | 验收要点 |
|--------|----------|----------|
| island_map_ch1_unlocked.png | Ch1解锁状态 | 彩色Ch1节点、灰白Ch2-6节点、连线颜色 |
| island_map_locked.png | 默认初始状态 | Ch1节点脉冲发光、其余全灰、硬币显示 |
| island_map_ch3_partial.png | Ch3半解锁 | Ch1-2全彩、Ch3脉冲、Ch4-6灰白 |

### LevelSelectScene（选关）— 2张

| 文件名 | 触发时机 | 验收要点 |
|--------|----------|----------|
| level_select_ch1.png | 初始进入 | 关1彩色(已解锁)、关2-30按进度显示 |
| level_select_stars.png | 通关后进入 | 前N关显示星评(☆★差异清晰) |

### GameplayScene（连连看）— 6张 ← 最重要，不得省略

| 文件名 | 触发时机 | 验收要点 |
|--------|----------|----------|
| gameplay_initial.png | 关卡刚开始 | 完整棋盘、HUD（步数/分数/Combo）、无选中 |
| gameplay_selected.png | 点击第一个图块后 | 选中图块有发光边框高亮 |
| gameplay_path_drawn.png | 消除一对后（连线动画帧） | 两图块间虚线路径可见、图块开始淡出 |
| gameplay_combo.png | Combo×3时 | "×3"大字、屏幕边缘金色光效、图块加速消除 |
| gameplay_win.png | 消清所有图块 | 结算面板、星评、得分、"下一关"按钮 |
| gameplay_fail.png | 步数归零还有图块 | 失败面板、"续关30币"、"重试"按钮 |

### DialogScene（对话）— 1张

| 文件名 | 触发时机 | 验收要点 |
|--------|----------|----------|
| dialog_ch1_intro.png | Ch1开场对话 | 半透明对话框、说话者名、逐字文本 |

## Playwright 脚本要求

- 文件：`canvas2d-client/tests/visual.spec.js`
- 每张截图前等待渲染完成（`waitForTimeout(500)` + `waitForFunction`）
- 截图尺寸固定：414×896（iPhone 14 Pro portrait）
- 所有截图存入 `canvas2d-client/www/qa/visual/screenshots/`
- 截图后输出 index.json：`{ "count": 14, "screenshots": [...], "pass": true/false }`

## index.json 格式

```json
{
  "count": 14,
  "generated_at": "2026-05-16T...",
  "screenshots": [
    { "file": "intro_act1.png", "scene": "IntroScene", "state": "act1", "size_kb": 120, "pass": true },
    ...
  ],
  "overall_pass": true,
  "failures": []
}
```

## 验收标准

1. `screenshots/index.json` 存在，count ≥ 14，overall_pass = true
2. 所有14张截图文件存在，大小 > 50KB（非空白图）
3. gameplay_initial.png 中棋盘格子可见（颜色像素差异 > 5种色块）
4. gameplay_path_drawn.png 中有可见黄色/白色连线像素
5. island_map_ch1_unlocked.png 中Ch1节点区域与Ch6节点区域有明显饱和度差异
