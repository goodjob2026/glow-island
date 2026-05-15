---
node_id: generate-missing-assets
node: generate-missing-assets
capability: implement
human_gate: false
hard_blocked_by: []
unlocks: [ui-forge-game, compile-verify]
exit_artifacts:
  - .allforai/game-client/missing-assets-gen-report.json
---

# Task: 生成缺失资产

## 美术风格基准

参考 `.allforai/game-design/art-direction.md`：
- Animal Crossing × 日式离岛美学
- 圆角优先（≥16px）
- 手绘质感轮廓，非纯黑（轮廓色 = 主色加深30%）
- 暖色主导，饱和度55-75%
- 图块尺寸：128×128px（@2x），文件保存至 `game-client/assets/resources/sprites/tiles/`

## 1. 缺失障碍精灵（3个）

输出至 `game-client/assets/resources/sprites/tiles/`：

| 文件名 | 视觉描述 | 风格提示 |
|--------|---------|---------|
| obstacle_weed.png | 绿色杂草丛，弯曲藤蔓，看起来顽固但圆润 | Bamboo Green #7DBE77，圆叶，Q版 |
| obstacle_wooden_crate.png | 木箱，有金属角扣和X型绳索固定 | Driftwood #C4955A，木纹纹理，圆角 |
| obstacle_water_current.png | 蓝色水流漩涡，圆形旋转箭头 | Ocean Teal #5BBFB5，流动感，圆润 |

使用 `mcp__plugin_meta-skill_ai-gateway__generate_image` 工具生成每个精灵。
提示语模板：
```
"Animal Crossing style game tile sprite, [描述], cute chibi aesthetic, pastel colors, rounded corners, 
white background, 128x128px, hand-drawn style, flat design, [色名 + hex], no text, transparent background"
```

**若 AI 工具不可用：** 使用 Cocos Creator 的 Graphics API 程序化生成占位精灵（圆角矩形 + 颜色 + 简单图案），确保文件存在且可被 Cocos 加载。

每个文件生成后，同步创建对应的 `.meta` 文件（复制已有障碍精灵的 meta 模板，修改 UUID）。

## 2. 章节专属图块美术（6章 × 基础图块集）

`game-client/assets/resources/sprites/tiles/chapter1/` 到 `chapter6/` 目前为空目录。

每章需要的文件：`tile_01.png` 到 `tile_20.png`（章节主题变体）。

章节主题色对照（来自 art-direction.md）：

| 章节 | 主题 | 主色 | 提示词关键词 |
|------|------|------|------------|
| Ch1 | 海边夕阳 | #5BBFB5 Ocean Teal + #EE8C55 Dusk Orange | seaside, warm sunset, coral, sand |
| Ch2 | 小镇 | #7DBE77 Bamboo Green + #E2C48A Warm Dune | cozy town, wooden, warm daylight |
| Ch3 | 花圃 | #F0C4C4 Sakura Pink + #7DBE77 Bamboo Green | flower garden, sakura, spring |
| Ch4 | 森林深处 | #4A7D55 Forest Moss + #C4955A Driftwood | deep forest, dark green, mushroom |
| Ch5 | 神社 | #C8402A Torii Red + #F7EDD8 Island Sand | shrine, torii, autumn leaves |
| Ch6 | 夜晚礁石 | #1E2E50 Night Indigo + #F5C842 Golden Hour | night, starlight, lighthouse glow |

**生成策略：**
- 优先使用 AI 生成工具生成每章的代表性 tile_01.png（主题色基础图块）
- tile_02-20 可通过程序化变色（色相偏移）从 tile_01 派生，确保章节色调统一
- 文件路径：`game-client/assets/resources/sprites/tiles/chapterN/tile_XX.png`

若时间/资源有限，优先生成 Ch1 完整集（20个），其余章节至少生成 tile_01-tile_06（最高频使用的颜色）。

## 3. VFX 帧序列

`game-client/assets/resources/effects/frames/` 目前为空。

需要帧序列（每个效果 6-8 帧，每帧 128×128px PNG）：

| 效果 | 帧数 | 描述 |
|------|------|------|
| tile_disappear | 6 | 图块消失：淡出 + 缩小 + 粒子扩散 |
| wave_ripple | 8 | 光波效果：圆形波纹扩展 |
| light_chain | 6 | 光链效果：光线连接两点闪烁 |
| pierce_shimmer | 6 | 穿透效果：垂直光束穿过 |
| cascade_glow | 8 | 连锁发光：多点同时亮起 |

**生成策略：** 使用程序化 Canvas 2D 生成 PNG 帧（Python Pillow 或类似库），渲染圆形/光线等基础图形，确保帧序列可被 `AnimationClip` 引用。

## 4. 特殊图块徽章修复

`game-client/assets/resources/sprites/tiles/special/` 现有：bomb, light, wave, windmill

缺失/错误：
- `special_pierce.png`：当前复用 windmill.png → 需要独立精灵（垂直箭头穿透图案）
- `special_cascade.png`：不存在 → 需要新建（星形/连锁爆发图案）
- `special_light_chain.png`：验证是否存在，若无则新建（链条连接光点图案）

生成风格与其他特殊图块保持一致（金黄 #F5C842 为强调色，深色轮廓，白色高光）。

## 完成标准

- `obstacle_weed.png`、`obstacle_wooden_crate.png`、`obstacle_water_current.png` 存在且 > 500B
- `tiles/chapter1/tile_01.png` 至少存在（其他章节 tile_01 存在为佳）
- `effects/frames/tile_disappear/` 下至少 4 个帧 PNG
- `special/special_pierce.png`、`special/special_cascade.png` 存在且独立
- 所有新文件有对应 `.meta` 文件
- 输出 `.allforai/game-client/missing-assets-gen-report.json`：
  ```json
  {
    "status": "completed",
    "obstacles_generated": ["obstacle_weed", "obstacle_wooden_crate", "obstacle_water_current"],
    "chapter_tiles_generated": { "chapter1": 20, "chapter2": 6, ... },
    "vfx_frames_generated": { "tile_disappear": 6, "wave_ripple": 8, ... },
    "special_badges_fixed": ["special_pierce", "special_cascade"]
  }
  ```
