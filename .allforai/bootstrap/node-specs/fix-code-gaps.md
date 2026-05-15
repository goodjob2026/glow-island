---
node_id: fix-code-gaps
node: fix-code-gaps
capability: implement
human_gate: false
hard_blocked_by: []
unlocks: [ui-forge-game, compile-verify]
exit_artifacts:
  - .allforai/game-client/fix-code-gaps-report.json
---

# Task: 修复代码层缺口

## 已知缺口（来自 asset-binding-visual-qa-report.json）

### 1. HUD/UI 层不可见

**症状：** 步数计数器、分数、操作按钮在游戏场景中不显示。

**调查步骤：**
1. 找到 HUD 组件所在脚本（搜索 `HUD`、`StepCounter`、`GameHUD`）
2. 检查 `onLoad` / `start` 中是否有 `node.active = false` 未恢复
3. 检查 Canvas Layer 顺序（HUD 层必须高于棋盘层）
4. 检查 z-order：`node.setSiblingIndex()` 调用是否错位

**修复方式：** 根据调查结果修复，确保 HUD 在游戏启动后可见。

### 2. 章节背景未渲染

**症状：** 14 张章节背景 PNG 存在于磁盘（`resources/sprites/backgrounds/`）但不渲染。

**调查步骤：**
1. 搜索 `Background`、`bg_`、`BackgroundManager` 相关脚本
2. 检查 `resources.load()` 调用路径是否与实际文件路径一致
3. 检查 SpriteFrame 绑定：`spriteFrame` 属性是否从 Resources 动态加载
4. 若未加载，参考 `PrototypeBoard.ts` 中 `resources.load` 模式补全

**修复方式：** 确保背景图正确从 Resources 加载并绑定到 Sprite 组件。

### 3. 合规 URL 验证

URL 已设置为 `https://glow-island.vercel.app/privacy` 等，验证这些 URL 在代码中的所有引用一致，无遗漏占位符。

```bash
grep -r "placeholder\|TODO.*url\|YOUR_URL\|example.com" game-client/assets/scripts/ --include="*.ts"
```

若有遗漏，修复为正确 URL。

## 完成标准

- HUD 可见性：在 Playwright 截图中可见步数计数器
- 背景渲染：章节背景在 Prototype 场景加载后可见
- URL 检查：无占位符 URL 残留
- 输出 `.allforai/game-client/fix-code-gaps-report.json`：
  ```json
  {
    "status": "completed",
    "fixes": [
      { "gap_id": "hud_ui_not_visible", "fix_applied": "<描述>", "verified": true },
      { "gap_id": "background_not_rendering", "fix_applied": "<描述>", "verified": true },
      { "gap_id": "compliance_urls", "fix_applied": "verified_clean", "verified": true }
    ]
  }
  ```
