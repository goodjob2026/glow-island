---
node: original-art
exit_artifacts:
  - game-client/assets/resources/sprites/tiles/tile-placeholder-spec.json
  - game-client/assets/resources/sprites/ui/ui-asset-manifest.json
  - .allforai/game-design/original-art-commission-brief.md
---

# Task: 游戏原画资产创建（占位 + 委托说明书）

建立完整资产目录结构，用程序化色块创建占位精灵，并生成正式原画委托说明书供美术师执行。

## Context Pull

**必需：**
- 从 `.allforai/game-design/art-direction.md` 读取图块视觉规格和UI规格
- 从 `.allforai/game-design/art-tokens.json` 读取 `colors.chapters[]`、`spacing.tile_size`
- 从 `.allforai/game-design/art-asset-spec.md` 读取完整资产清单
- 从 `.allforai/game-design/worldbuilding-bible.md` 读取章节世界观，为委托说明书提供视觉方向叙述

## Theory Anchors

- **Asset Pipeline First**: 先建立目录结构和命名规范，再填充内容——防止后期重构成本
- **Placeholder-Driven Development**: 用占位资产让代码层可以立即开始工作，不等待正式美术

## Guidance

### 1. 建立资产目录结构

```
game-client/assets/resources/sprites/
  tiles/         # 图块精灵（按章节分组）
    chapter1/    # tile_c1_01_normal.png ... 
    chapter2/
    ...
  backgrounds/   # 章节背景
  island/        # 岛屿地图区域（恢复前/后）
  characters/    # NPC角色头像
  ui/            # UI图标集
  effects/
    frames/      # 特效序列帧（占位）
```

### 2. 创建占位资产（使用Cocos内置工具或代码）

每种图块的占位方式：
- 创建 128×128px 的纯色图片（按 art-tokens.json 章节颜色）
- 叠加简单几何形状（○△□◇）区分类型
- 四种状态用透明度/边框区分

### 3. 生成JSON清单文件

**tile-placeholder-spec.json** — 列出所有图块类型：
```json
{
  "total_tile_types": 20,
  "tiles": [
    {
      "id": "tile_c1_shell",
      "chapter": 1,
      "name": "贝壳",
      "placeholder_color": "#87CEEB",
      "placeholder_shape": "circle",
      "states": ["normal", "highlighted", "disappearing", "special"],
      "commission_status": "pending"
    }
  ]
}
```

**ui-asset-manifest.json** — UI资产清单（按模块分组）

### 4. 委托说明书（original-art-commission-brief.md）

为专业美术师准备的完整说明文档，包含：
- 项目背景和视觉风格（附 art-direction.md 的风格描述）
- 每种资产的尺寸/格式/命名/帧数要求
- 各章节视觉主题说明（附 chapter-emotional-arcs 的情感描述）
- 交付规范（PNG+@2x分辨率，RGBA通道，独立导出）
- 优先级排序（先交付：图块×20种、UI基础图标；后交付：背景、NPC、特效帧）

## Exit Artifacts

**tile-placeholder-spec.json** — 图块资产规格和委托状态追踪
**ui-asset-manifest.json** — UI资产清单
**original-art-commission-brief.md** — 正式美术委托说明书

（注：占位图片文件直接创建在对应目录，不作为exit_artifacts追踪——目录存在即视为完成）

## Downstream Contract

→ `animation-design` 读取：`tile-placeholder-spec.json` 的 `states[]`，确认动画需要覆盖的状态
→ `implement-ui-systems` 读取：`ui-asset-manifest.json` 中的图标命名，代码中按此命名加载
→ `implement-island-map` 读取：island目录结构，按此路径加载章节背景和区域精灵
→ `implement-puzzle-core` 读取：`tiles[].id` 命名规范，TileType枚举与资产命名对应
