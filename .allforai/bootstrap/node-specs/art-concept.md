---
node: art-concept
exit_artifacts:
  - .allforai/game-design/art-direction.md
  - .allforai/game-design/art-tokens.json
  - .allforai/game-design/art-asset-spec.md
---

# Task: Glow Island 美术概念方向设计

设计整体视觉语言，输出美术方向文档、设计Token（色彩/字体/间距），以及所有美术资产的规格说明书。

## Context Pull

**必需：**
- 从 `.allforai/game-design/chapter-emotional-arcs.json` 读取 `chapters[].color_mood` 和 `emotion`
- 从 `.allforai/game-design/game-design-document.md` 读取情感定位关键词

## Theory Anchors

- **Color Psychology**: 马卡龙色系（低饱和度+高明度）→ 治愈/温暖感
- **Visual Hierarchy**: 重要元素（连击数/目标进度）需要明显的视觉层级差异
- **Negative Space**: 治愈类游戏需要足够的视觉留白，避免视觉噪音

## Guidance

### 整体美术风格
- **风格定位**：扁平化 + 轻手绘质感（非像素，非3D写实）
- **光影风格**：柔和阴影，夜晚场景用暖光光晕
- **UI风格**：圆角卡片，柔和边框，无生硬棱角

### 色彩系统
为6章节设计独立色板（主色/辅色/背景色/强调色），整体色调：
- 白天场景：马卡龙（淡蓝/米白/淡绿/浅粉）
- 夜晚场景（第6章灯塔）：深蓝+暖橙光晕

### 图块视觉规格
- **尺寸**：单图块 128×128px @2x（64×64 @1x）
- **图块风格**：每种类型有独特形状+颜色，章节内保持风格统一
- **状态**：normal / highlighted（连接高亮）/ disappearing（消除中）/ special（特殊块发光）

### UI规格
- **字体**：圆润无衬线字体（中文：思源圆体；数字：自定义圆体）
- **按钮**：圆角12px，主色渐变背景，白色文字
- **弹窗**：圆角16px，半透明白色背景，轻阴影

### art-asset-spec.md 内容
完整列出所有需要创作的美术资产：
1. **图块精灵** (20种，每种4状态) → `sprites/tiles/` 目录
2. **章节背景** (6张，1080×1920) → `sprites/backgrounds/` 目录
3. **岛屿地图区域** (6个区域×2状态：恢复前/后) → `sprites/island/` 目录
4. **NPC角色头像** (4个NPC，各128×128) → `sprites/characters/` 目录
5. **UI图标集** (约30个：按钮/道具/货币图标) → `sprites/ui/` 目录
6. **特效序列帧** (消除/连击/区域恢复) → `effects/frames/` 目录

## Exit Artifacts

**art-direction.md** — 美术方向完整说明文档（风格/规则/参考图说明）

**art-tokens.json** — 设计Token：
```json
{
  "colors": {
    "brand_primary": "#7EC8E3",
    "chapters": [
      { "id": 1, "name": "海边码头", "primary": "#87CEEB", "secondary": "#F5DEB3", "bg": "#E8F4F8" }
    ]
  },
  "typography": { "font_cn": "SourceHanRoundedCN", "font_number": "custom" },
  "spacing": { "tile_size": 128, "grid_gap": 4, "card_radius": 12 },
  "animation": { "tile_connect_duration": 0.15, "tile_disappear_duration": 0.3 }
}
```

**art-asset-spec.md** — 完整资产规格说明书（每类资产：尺寸/格式/命名规范/帧数要求/交付标准）

## Downstream Contract

→ `original-art` 读取：`art-asset-spec.md` 全部内容，按此规格创建占位资产和委托说明书
→ `animation-design` 读取：`art-tokens.json` 中 `animation` 字段的时长规格
→ `vfx-design` 读取：`colors.chapters[]` 各章节色板，特效颜色需与章节主色协调
→ `implement-ui-systems` 读取：`art-tokens.json` 完整token，CSS/样式变量的依据
→ `implement-island-map` 读取：`colors.chapters[]` 各章节视觉主色，地图区域渲染依据
