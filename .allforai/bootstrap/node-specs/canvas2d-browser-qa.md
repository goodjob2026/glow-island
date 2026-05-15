---
node_id: canvas2d-browser-qa
node: canvas2d-browser-qa
goal: "用 Playwright 对 Canvas2D 客户端做浏览器 QA：渲染正确性、交互响应、无 JS 错误"
capability: qa-engineer
human_gate: false
hard_blocked_by:
  - canvas2d-client-scaffold
exit_artifacts:
  - ".allforai/canvas2d/qa/browser-qa-report.json"
  - ".allforai/canvas2d/qa/screenshots/initial-render.png"
  - ".allforai/canvas2d/qa/screenshots/after-tap.png"
---

# canvas2d-browser-qa

## Mission

用 Playwright 对 Canvas2D 客户端做完整浏览器 QA。

## 步骤

### 1. 启动开发服务器

```bash
cd canvas2d-client
python3 -m http.server 3001 --directory www &
SERVER_PID=$!
sleep 2
```

### 2. Playwright 验收

使用 `mcp__plugin_playwright_playwright__*` 工具：

```
browser_navigate → http://127.0.0.1:3001/
browser_wait_for → time: 3
browser_take_screenshot → initial-render.png
```

**TC-B1: 无 JS 错误**
- Console errors 数量 = 0（favicon 404 除外）

**TC-B2: 渲染正确**
- 截图分析：canvas 元素存在
- HUD 显示 SCORE/MOVES
- 8×8 棋盘可见（彩色方块）

**TC-B3: 点击交互**
```
browser_click → canvas 中心偏上（第1行中间列）
browser_wait_for → time: 1
browser_take_screenshot → after-tap-1.png
browser_click → 相邻格子
browser_wait_for → time: 2
browser_take_screenshot → after-tap-2.png
```
- 截图对比：tap 后棋盘有变化（说明交互生效）

**TC-B4: 移动端视口**
```
browser_resize → 390×844（iPhone 15 尺寸）
browser_take_screenshot → mobile-viewport.png
```
- 棋盘填满屏幕，无布局溢出

### 3. 输出报告

```json
{
  "completed_at": "<ISO>",
  "platform": "browser",
  "viewport": "1280x800 + 390x844",
  "test_cases": {
    "no_js_errors": "pass|fail",
    "renders_correctly": "pass|fail",
    "tap_interaction": "pass|fail",
    "mobile_viewport": "pass|fail"
  },
  "screenshots": ["..."],
  "overall": "pass|fail"
}
```

写入 `.allforai/canvas2d/qa/browser-qa-report.json`
