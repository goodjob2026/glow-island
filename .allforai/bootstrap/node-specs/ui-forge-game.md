---
node: ui-forge-game
node_id: ui-forge-game
capability: ui-forge
human_gate: false
hard_blocked_by: [fix-prototype-board]
unlocks: [compile-verify]
exit_artifacts:
  - .allforai/ui-forge/fidelity-assessment.json
  - .allforai/ui-forge/glow-island-tile-upgrade-report.md
---

# Task: 游戏视觉升级 — Animal Crossing 治愈美学

## 背景

当前 `PrototypeBoard.ts` 渲染纯色方块（4 种颜色，无圆角，无图标），完全没有《动物森友会》的治愈感。

用户反馈：「这哪里有点动森的效果？」

目标：在不改变任何游戏逻辑的前提下，升级 PrototypeBoard 的视觉呈现。

## 视觉设计目标

### 色板（Animal Crossing 治愈系）

```typescript
// 替代 TILE_COLORS 的新色板
const TILE_COLORS: Record<number, Color> = {
    0: new Color(255, 182, 108, 255),  // 珊瑚橙  暖暖的，像沙滩贝壳
    1: new Color( 94, 188, 221, 255),  // 海波蓝  清透，像浅海
    2: new Color(140, 210, 124, 255),  // 叶草绿  自然，像岛上植物
    3: new Color(243, 227, 179, 255),  // 米沙色  温暖，像沙滩
};
```

### 圆角矩形

用 `Graphics.roundRect()` 替代 `rect()`（如果 CC3 支持），或手动实现圆角路径：

```typescript
function roundRect(g: Graphics, x: number, y: number, w: number, h: number, r: number) {
    // CC3 Graphics 圆角路径
    g.moveTo(x + r, y);
    g.lineTo(x + w - r, y);
    g.arc(x + w - r, y + r, r, -Math.PI / 2, 0);
    g.lineTo(x + w, y + h - r);
    g.arc(x + w - r, y + h - r, r, 0, Math.PI / 2);
    g.lineTo(x + r, y + h);
    g.arc(x + r, y + h - r, r, Math.PI / 2, Math.PI);
    g.lineTo(x, y + r);
    g.arc(x + r, y + r, r, Math.PI, -Math.PI / 2);
    g.close();
}
```

圆角半径：`r = CELL_SIZE * 0.2`（20% 圆角）

### 白色内光晕

在圆角矩形之上，叠加一个半透明白色小椭圆（左上角），模拟「光泽感」：

```typescript
// 光泽小圆（左上角高光）
g.fillColor = new Color(255, 255, 255, 80);
g.circle(-CELL_SIZE * 0.18, -CELL_SIZE * 0.18, CELL_SIZE * 0.15);
g.fill();
```

### 柔和描边

描边颜色改为同色系深色（非纯黑），更温和：

```typescript
// 根据填充色生成深色描边（降低饱和度+加深）
g.strokeColor = new Color(
    Math.floor(fillColor.r * 0.75),
    Math.floor(fillColor.g * 0.75),
    Math.floor(fillColor.b * 0.75),
    180
);
g.lineWidth = 1.5;
```

### 选中状态升级

选中时的缩放动画改为弹性效果，增加「咚」的触感：

```typescript
tween(node)
    .to(0.12, { scale: new Vec3(1.15, 1.15, 1) }, { easing: easing.backOut })
    .start();
```

取消选中回弹：

```typescript
tween(node)
    .to(0.1, { scale: new Vec3(0.95, 0.95, 1) }, { easing: easing.quadOut })
    .to(0.08, { scale: new Vec3(1, 1, 1) }, { easing: easing.quadIn })
    .start();
```

### 消除动画升级

当前消除动画：放大到 1.3 → 缩小到 0（比较生硬）

升级为「飞散」效果：先轻微旋转 + 缩放，再淡出：

```typescript
private vanishTile(node: Node | null, onDone?: () => void) {
    if (!node) { onDone?.(); return; }
    const op = node.getComponent(UIOpacity);
    tween(node)
        .to(0.12, { scale: new Vec3(1.2, 1.2, 1) }, { easing: easing.quadOut })
        .parallel(
            tween(node).to(0.2, { scale: new Vec3(0, 0, 0) }, { easing: easing.quadIn }),
            op ? tween(op).to(0.2, { opacity: 0 }) : tween(node)
        )
        .call(() => { node.destroy(); onDone?.(); })
        .start();
}
```

### 背景（可选）

在 Board 节点后面添加一个柔和的渐变背景节点（淡蓝→浅米色渐变），模拟「海滩光线」。

用 Graphics 绘制，无需外部资源：

```typescript
private addBackground() {
    const bg = new Node('Background');
    bg.setPosition(0, 0, -1);
    const gt = bg.addComponent(UITransform);
    gt.setContentSize(600, 600);
    const g = bg.addComponent(Graphics);
    // 简单渐变近似：多层半透明矩形
    for (let i = 0; i < 8; i++) {
        const t = i / 7;
        const r = Math.round(220 + t * 30);
        const gr = Math.round(240 - t * 10);
        const b = Math.round(255 - t * 20);
        g.fillColor = new Color(r, gr, b, 15);
        g.rect(-300, -300 + i * 75, 600, 78);
        g.fill();
    }
    this.node.addChild(bg);
    this.node.setSiblingIndex(bg, 0);
}
```

## 执行步骤

### 1. 读取当前 PrototypeBoard.ts

```bash
cat game-client/assets/scripts/prototype/PrototypeBoard.ts
```

### 2. 实现视觉升级

按照上述设计，修改 `PrototypeBoard.ts`：

1. 替换 `TILE_COLORS` 色板
2. 替换 `createTileNode` 中的 Graphics 绘制（rect → roundRect + 光泽）
3. 升级 `setSelected` 中的选中动画（backOut 弹性）
4. 升级 `clearSelected` 中的取消动画（回弹）
5. 升级 `vanishTile` 消除动画
6. （可选）添加背景

**重要**：
- 不修改任何游戏逻辑（BFS、combo、grid 等）
- 不修改其他文件
- 确保 CC3 Graphics API 仍使用 rect()/fill()/stroke() 路径式 API

### 3. 验证视觉效果

运行 Playwright 截图验证：

```bash
cd game-client && npx @cocos/cocos-cli build --platform web-mobile 2>/dev/null || echo "build attempted"
```

如果 Playwright 可用，截图对比前后效果。

### 4. 生成报告

创建目录：

```bash
mkdir -p .allforai/ui-forge
```

写入 `.allforai/ui-forge/fidelity-assessment.json`：

```json
{
  "assessed_at": "<ISO timestamp>",
  "scope": "PrototypeBoard tile visual upgrade",
  "before": {
    "style": "flat colored rectangles, no rounding, black stroke",
    "animation": "scale to 1.3 then 0 (vanish)"
  },
  "after": {
    "style": "rounded tiles with warm AC palette, inner glow highlight, soft colored stroke",
    "animation": "elastic select bounce, fade+scale vanish"
  },
  "changes_applied": [
    "TILE_COLORS updated to Animal Crossing warm palette",
    "roundRect with r=CELL_SIZE*0.2",
    "inner glow highlight (top-left)",
    "soft same-hue stroke",
    "backOut elastic select animation",
    "vanish: scale+fade parallel"
  ],
  "deviations": []
}
```

写入 `.allforai/ui-forge/glow-island-tile-upgrade-report.md`：

人类可读的升级说明，包含色值、动画参数、截图对比（如可用）。
