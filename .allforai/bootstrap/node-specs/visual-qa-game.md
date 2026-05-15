---
node_id: visual-qa-game
node: visual-qa-game
capability: visual-verify
human_gate: false
hard_blocked_by: [compile-verify, ui-forge-game]
unlocks: [game-2d-code-repair-loop]
exit_artifacts:
  - .allforai/visual-qa/visual-qa-report.json
---

# Task: 游戏视觉 QA（0.8.8 感知判断标准）

## 概述

对游戏运行时截图，用感知判断（非像素指标）评估视觉质量。

**0.8.8 关键规则**：
- 不能仅凭"颜色种类 ≥5"等像素统计通过。必须实际观察截图，判断游戏是否符合设计意图。
- 如果背景是黑色、或 HUD 不可见、或图块是灰色方块，则 `overall = "fail"`，即使颜色多样性指标通过。
- 每个维度必须给出观察到的事实描述，不能只写 pass/fail。

## 前置条件

- Cocos Creator Preview 服务运行中：`http://localhost:7456`
- ui-forge-game 节点已完成（fidelity-assessment.json 存在且 status=completed）

若 Preview 服务未运行：

```bash
cd game-client && npx @cocos/cocos-cli preview &
sleep 5
```

## 截图步骤

```typescript
await page.goto('http://localhost:7456');
await page.waitForTimeout(4000); // 等待棋盘初始化

// 全屏截图
await page.screenshot({ path: '.allforai/visual-qa/screenshots/full-game.png' });

// 棋盘区域
const vp = page.viewportSize();
await page.screenshot({
    path: '.allforai/visual-qa/screenshots/board-detail.png',
    clip: { x: vp.width * 0.1, y: vp.height * 0.15, width: vp.width * 0.8, height: vp.height * 0.7 }
});

// HUD 区域（顶部 15%）
await page.screenshot({
    path: '.allforai/visual-qa/screenshots/hud-area.png',
    clip: { x: 0, y: 0, width: vp.width, height: vp.height * 0.15 }
});
```

截图保存至 `.allforai/visual-qa/screenshots/`。

## 感知判断维度（必须逐项描述所见）

### 1. 背景渲染（必须通过，否则整体 fail）
- 观察全屏截图的背景区域（棋盘外的画面边角）
- **Pass 标准**：背景有颜色（暖色海蓝 #86C4C8 或任何明显的非黑色）
- **Fail 标准**：背景是纯黑色 #000000 或非常深的颜色（R<30, G<30, B<30）
- 描述你观察到的颜色：`"background_observation": "背景为深蓝色/浅绿色/黑色，RGB约(x,y,z)"`

### 2. 图块视觉质量（必须通过）
- 观察棋盘区域截图的图块形状
- **Pass 标准**：图块有圆角，不是正方形；颜色丰富（5种可区分的暖色系）
- **Fail 标准**：图块是正方形/矩形；或颜色单一（灰色/白色/只有1-2种颜色）
- 描述：`"tile_observation": "图块呈圆角矩形/正方形，颜色为..."`

### 3. HUD 可见性（必须通过）
- 观察 HUD 区域截图
- **Pass 标准**：顶部区域有文字（步数、分数、关卡名等任一项可读）
- **Fail 标准**：HUD 区域完全空白，无任何文字或 UI 元素
- 描述：`"hud_observation": "HUD 区域可见文字.../ HUD 区域为空"`

### 4. 特殊图块区分（可选，不阻塞）
- 特殊图块（光波/光链/穿透等）视觉上是否与普通图块有区别

## 评分规则

```
overall = "pass" 当且仅当：
  background_rendered == "pass"
  AND tile_rounded_corners == "pass"
  AND hud_visible == "pass"

否则 overall = "fail"
```

"partial" 不是有效状态。0.8.8 标准下每个必须项都必须明确 pass 或 fail。

## 输出格式

```json
{
  "assessed_at": "<ISO>",
  "screenshots": [
    ".allforai/visual-qa/screenshots/full-game.png",
    ".allforai/visual-qa/screenshots/board-detail.png",
    ".allforai/visual-qa/screenshots/hud-area.png"
  ],
  "observations": {
    "background_observation": "<描述观察到的背景颜色和内容>",
    "tile_observation": "<描述图块形状和颜色>",
    "hud_observation": "<描述 HUD 区域内容>"
  },
  "dimensions": {
    "background_rendered": "pass|fail",
    "tile_rounded_corners": "pass|fail",
    "color_variety_5plus": "pass|fail",
    "hud_visible": "pass|fail"
  },
  "overall": "pass|fail",
  "code_gaps": [
    { "gap_id": "VQ-01", "severity": "major|minor", "description": "<具体描述>" }
  ]
}
```

`code_gaps` 进入 game-2d-code-repair-loop；记录具体观察证据，不是主观描述。
