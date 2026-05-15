---
node_id: ui-forge-game
node: ui-forge-game
capability: ui-forge
human_gate: false
hard_blocked_by: [fix-code-gaps, generate-missing-assets]
unlocks: [visual-qa-game, e2e-gameplay]
exit_artifacts:
  - .allforai/ui-forge/fidelity-assessment.json
  - .allforai/ui-forge/glow-island-tile-upgrade-report.md
---

# Task: 游戏视觉升级 — Animal Crossing 治愈美学（0.8.8）

## 背景

上次 ui-forge 节点以 0.8.7 标准执行，但截图显示：黑色背景 + HUD 不可见 + 图块为纯色方块。
已有修复已落地（相机清屏色从黑色改为暖色海蓝 #86C4C8、CC3 场景 UUID 已修正），本节点重新验证升级效果。

参考：`.allforai/game-design/art-direction.md`（Animal Crossing × 日式离岛美学）

## 第一步：读取当前代码状态

先读取 `game-client/assets/scripts/prototype/PrototypeBoard.ts` 当前内容，检查：
1. `TILE_COLORS` 是否已使用以下 5 色方案（如未使用则替换）
2. `drawRoundRect` 是否存在（如不存在则添加）
3. 相机清屏色是否非黑（读取 `game-client/assets/scenes/Prototype.scene` 中 `_color` 字段）

## 目标颜色方案

```typescript
const TILE_COLORS: Record<number, { fill: Color; stroke: Color }> = {
  0: { fill: new Color(237, 139, 107, 255), stroke: new Color(187,  89,  57, 255) }, // 珊瑚橙 贝壳
  1: { fill: new Color( 91, 191, 181, 255), stroke: new Color( 41, 141, 131, 255) }, // 海水青 波浪
  2: { fill: new Color(125, 190, 119, 255), stroke: new Color( 75, 140,  69, 255) }, // 竹叶绿 叶子
  3: { fill: new Color(240, 196, 196, 255), stroke: new Color(190, 146, 146, 255) }, // 樱粉 樱花
  4: { fill: new Color(196, 149,  90, 255), stroke: new Color(146,  99,  40, 255) }, // 木纹棕 浮木
};
```

## 圆角实现（CC3 Graphics API）

```typescript
private drawRoundRect(g: Graphics, x: number, y: number, w: number, h: number, r: number) {
    g.moveTo(x + r, y);
    g.lineTo(x + w - r, y);
    g.arc(x + w - r, y + r, r, -Math.PI / 2, 0);
    g.lineTo(x + w, y + h - r);
    g.arc(x + w - r, y + h - r, r, 0, Math.PI / 2);
    g.lineTo(x + r, y + h);
    g.arc(x + r, y + h - r, r, Math.PI / 2, Math.PI);
    g.lineTo(x, y + r);
    g.arc(x + r, y + r, r, Math.PI, Math.PI * 1.5);
    g.close();
}
```

**重要**：使用 `rect()/fill()/stroke()` 路径式 API，不要使用 `fillRect()`（CC3 中不存在）。

## 执行步骤

1. 读取 `PrototypeBoard.ts` → 替换 `TILE_COLORS`（如已正确则跳过）
2. 确认 `drawRoundRect` 存在且被 `createTileNode` 调用
3. 确认 `setSelected` 动画使用 backOut 弹性
4. 确认 `vanishTile` 使用飞散淡出（scale+UIOpacity parallel tween）
5. 读取 `Prototype.scene` → 确认 Camera `_color` 为非黑色（r>0 或 g>0 或 b>0）
   - 若为黑色：将 `_color` 改为 `{"r":134,"g":196,"b":200,"a":255}`（暖色海蓝）
6. 若存在 `GameScene.ts` / `GameBoard.ts`，同步相同修改

## 必须验证（0.8.8 要求）

**禁止 fix-without-verify**：代码改好后必须用 Playwright 截图验证渲染结果。

```typescript
// 导航游戏并等待初始化
await page.goto('http://localhost:7456');
await page.waitForTimeout(4000);
await page.screenshot({ path: '.allforai/ui-forge/screenshots/board-after-forge.png' });
```

看截图并判断（感知判断，非像素指标）：
- [ ] 背景不是纯黑（必须通过 → 否则报告阻塞，不继续）
- [ ] 图块有圆角（而非正方形，必须通过）
- [ ] 5 种颜色可区分（饱和度适中，非白/灰，必须通过）
- [ ] HUD 区域有文字可见（步数 / 分数，必须通过）

若任一项 FAIL：报告具体问题，写入 `fidelity-assessment.json`，`status = "blocked"`，停止输出。

## 完成标准

- `PrototypeBoard.ts` 的 `TILE_COLORS` 使用新色板（grep 验证）
- `drawRoundRect` 方法存在且被调用
- Playwright 截图感知通过（背景非黑 + 圆角图块 + HUD 可见）
- `.allforai/ui-forge/fidelity-assessment.json` 存在且 `status == "completed"`

```json
{
  "assessed_at": "<ISO>",
  "screenshots": [".allforai/ui-forge/screenshots/board-after-forge.png"],
  "checks": {
    "background_non_black": "pass|fail",
    "tile_rounded_corners": "pass|fail",
    "color_variety_5": "pass|fail",
    "hud_visible": "pass|fail"
  },
  "status": "completed|blocked",
  "blocked_reason": "<only if blocked>"
}
```
