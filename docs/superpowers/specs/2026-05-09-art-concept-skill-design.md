# Art Concept Skill Design

**Date:** 2026-05-09  
**Scope:** meta-skill plugin — art discovery skill + domain knowledge files

---

## 1. 背景与动机

当前 meta-skill 游戏设计流水线中，美术节点（`art-direction → art-spec-design → [6 art-gen nodes]`）是基于 scenario template 硬选的，无法根据游戏类型特化：

- 2D 卡通 vs 像素风 vs 3D 低模 → 完全不同的工具链和节点行为
- AI 生图能力对不同美术类型差异极大（卡通可用，像素风间接可用，Spine 不可用）
- game-doc-design 阶段缺少技术层面的美术决策，导致 art-spec-design 无依据可循

**目标**：在 `art-direction`（已产出视觉风格方向）完成后、`art-spec-design` 执行前，插入 `art-concept` 阶段。通过搜索驱动的交互式对话确定美术技术规格，产出 `art-pipeline-config.json`，驱动 art-spec-design 和所有 art-gen 节点的特化行为。

---

## 2. 整体架构

### 新增文件（meta-skill 插件内）

```
meta-skill/
  skills/
    art-concept.md              ← 新增：交互式美术概念 skill
  knowledge/
    domains/
      art-methodology.md        ← 新增：美术方法论 + 理论锚点
      art-tools.md              ← 新增：AI 可调用工具能力矩阵
```

### 修改文件

| 文件 | 修改内容 |
|---|---|
| `knowledge/capabilities/game-design.md` | pipeline 中 art-direction **之后**、art-spec-design **之前**插入 art-concept 触发检查 |
| `knowledge/domains/gaming.md` | art-direction 节点输出字段补充 `art_overview`（high-level 美术决策结构） |

---

## 3. 信息流与触发机制

### 完整 Pipeline（修改后）

```
/bootstrap
  → product-concept（产出 product-concept.json）
  → 检测 is_game_project = true，进入 game-design 阶段
  → [game-doc-design 节点组]
      ├─ core-loop-design
      ├─ [scenario-specific 系统节点]
      ├─ art-direction          ← 产出视觉风格方向 + art_overview（新增字段）
      ↓
  → 检查 art-pipeline-config.json 是否存在
      不存在 → 调起 art-concept skill（拉取 art_overview）
      已存在 → 跳过（art-concept 已执行过，可单独运行 /art-concept 修订）
      ↓
  → art-spec-design             ← 读取 art-pipeline-config.json 特化资产清单
      ↓
  → [art-gen 节点组]（由 active_nodes 字段决定）
      ↓
  → art-qa
      ↓
  → game-design-finalize
```

**art-concept 的位置**：art-direction 完成后、art-spec-design 开始前。它验收的是 art-direction 的输出，产出被 art-spec-design 消费。

### 两层美术规格职责分工

| | art-direction 产出（art_overview） | art-concept 产出（art-pipeline-config.json） |
|---|---|---|
| 粒度 | 决策级：选视觉方向 | 技术级：选工具/格式/参数 |
| 示例 | `style: "cartoon"`, `animation: "spine"` | 骨骼数量上限、Atlas 打包策略、帧率 |
| 驱动下游 | art-concept 验收时拉取 | art-spec-design + art-gen 节点执行时拉取 |

### art-spec-design 与 art-concept 的关系

art-spec-design（现有节点）在 art-concept 执行后：
- 读取 `art-pipeline-config.json` 中的 `tileset.tile_size`、`character.rig`、`vfx.approach` 等字段
- 据此生成 `art-asset-inventory.json`（资产清单），条目格式与工具链对齐
- **不再硬编码资产规格**，改为从 config 拉取

---

## 4. art-concept Skill 内部流程

### Step 0：验收 art-direction 输出

```
拉取 art_overview（来自 art-direction 节点产出）：
  ✓ dimension: "2d" | "3d" | "2.5d"
  ✓ style: "cartoon" | "pixel" | "realistic" | "hand_drawn" | "vector"
  ✓ animation_system: "frame" | "spine" | "3d_skeletal" | "mixed"

验收问题（仅此一问）：
  "以上美术方向是否需要修订？"
  → 有修订 → 先回 art-direction 节点修改，再继续
  → 确认无误 → 进入 Step 0.5
```

### Step 0.5：竞品美术研究（搜索驱动）

基于 `product-concept.json.genre` + `art_overview.style` 搜索，结论用于后续问答选项：

```
搜索关键词（各执行中英文双轮）：
  1. "{genre} game art style {dimension} {year}"  → 同类游戏主流美术方向
  2. "{style} game asset production pipeline"     → 可行技术方案
  3. "{genre} top games art direction breakdown"  → 竞品截图/风格分析

源质量分级：
  P1: GDC 演讲 / 艺术总监 ArtStation 博客 / 官方游戏美术指南
  P2: 游戏开发博客 / IndieDB / Gamasutra 案例
  P3: Reddit r/gamedev / Twitter 美术师帖子
  P4: 泛 SEO 教程（仅参考，不引用）

输出：各维度的推荐选项 + 证据（供 Step 1 使用）
```

### Step 1：按维度逐一问答

**铁律：从不问开放性问题。每个问题提供 2-4 个选项，选项来自 Step 0.5 搜索结论，附带证据。**

#### 2D 通用分支（`dimension = "2d"` 且 `style ≠ "pixel"`，共 6 问）

| # | 问题 | 选项示例（实际选项来自搜索） | 驱动 config 字段 |
|---|---|---|---|
| 1 | 地砖系统？ | 正交网格 / 等距 / 无地砖（自由场景） | `tileset.type` |
| 2 | 角色骨骼精度？ | 无骨骼（帧序列）/ Spine Lite / Spine Full | `character.rig` |
| 3 | 特效方案？ | 帧序列 / Spine FX / Shader 粒子 | `vfx.approach` |
| 4 | 场景层次？ | 单层 / 2-3 层视差 / 完整多层视差 | `environment.parallax_layers` |
| 5 | 需要概念原画？ | 不需要 / 角色设定图 / 场景概念图 / 两者都要 | `concept_art.types[]` |
| 6 | 工具链约束？ | 已有 Spine 授权 / 仅开源工具 / 有外包支持 | `toolchain.constraints` |

> Q1 选"无地砖"时：`active_nodes` 中移除 `tile-art-gen`  
> Q2 选"无骨骼"时：`active_nodes` 中移除 `character-art-gen`，改用 `character-frame-gen`（若存在）  
> Q5 选非"不需要"时：`active_nodes` 中加入 `concept-art-gen`

#### 2D 像素风分支（`style = "pixel"`，替换 Q1/Q2/Q3/Q4）

| # | 问题 | 选项 | 驱动 config 字段 |
|---|---|---|---|
| 1 | 地砖分辨率？ | 8×8 / 16×16 / 32×32 / 64×64 | `tileset.tile_resolution` |
| 2 | 调色板大小？ | 8色 / 16色 / 32色 / 256色 | `pixel.palette_size` |
| 3 | 动画帧数预算？ | 4帧（最简）/ 8帧（流畅）/ 16帧（精细） | `pixel.anim_frames` |
| 4 | Aseprite 是否可用？ | 已安装 / 未安装（用 PIL 降级） | `toolchain.aseprite_available` |
| 5 | 需要概念原画？ | 同上 | `concept_art.types[]` |
| 6 | 工具链约束？ | 同上 | `toolchain.constraints` |

#### 3D 分支（`dimension = "3d"`，共 5 问）

| # | 问题 | 选项 | 驱动 config 字段 |
|---|---|---|---|
| 1 | 多边形面数预算？ | 低模移动端（角色 500-2000面）/ 中模（2000-5000面）/ 不限 | `model_3d.poly_budget` |
| 2 | 贴图工作流？ | PBR 金属度/粗糙度 / 卡通平涂 / 手绘风格 | `model_3d.texture_workflow` |
| 3 | 骨骼动画方案？ | Blender 无头导出 / 需外包动画师 | `model_3d.anim_source` |
| 4 | VFX 方案？ | 粒子系统（引擎内置）/ 帧序列叠加 / Shader | `vfx.approach` |
| 5 | 场景构建方式？ | 手工建模 / 程序化生成 / 混合 | `environment.build_method` |

### Step 2：产出 art-pipeline-config.json 草稿

根据 Step 1 所有答案组装 config JSON，写入文件但标记为 `status: "draft"`。

### Step 3：XV 交叉验证（可选）

```
若 OpenRouter MCP 可用：
  发送 art-pipeline-config.json 摘要给另一模型
  审查角度：
    - 这套美术方案对 {genre} 游戏有哪些技术风险？
    - active_nodes 组合是否有遗漏或冗余？
    - 工具链选择有哪些盲点（AI 无法处理但被标记为可用的）？
  输出写入 config.cross_model_review[]
  
若 OpenRouter 不可用：
  跳过，输出 "XV cross-validation unavailable"，config 直接置为 final
```

### Step 4：写入最终 art-pipeline-config.json

将 `status` 从 `"draft"` 改为 `"final"`，XV 结果合并写入。

---

## 5. art-pipeline-config.json Schema

### 2D 卡通示例

```json
{
  "status": "final",
  "dimension": "2d",
  "style": "cartoon",
  "animation_system": "spine",
  "tileset": {
    "type": "grid",
    "tile_size": 128,
    "atlas": true
  },
  "character": {
    "rig": "spine_lite",
    "expressions": true,
    "bone_limit": 30
  },
  "vfx": {
    "approach": "sprite_sheet",
    "spine_fx": false
  },
  "environment": {
    "parallax_layers": 3
  },
  "concept_art": {
    "needed": false,
    "types": []
  },
  "toolchain": {
    "spine_licensed": true,
    "aseprite_available": false,
    "constraints": []
  },
  "active_nodes": [
    "tile-art-gen",
    "character-art-gen",
    "environment-art-gen",
    "ui-art-gen",
    "vfx-art-gen"
  ],
  "skipped_nodes": [],
  "cross_model_review": []
}
```

### 2D 像素风示例

```json
{
  "status": "final",
  "dimension": "2d",
  "style": "pixel",
  "animation_system": "frame",
  "tileset": {
    "type": "grid",
    "tile_resolution": "16x16",
    "atlas": true
  },
  "pixel": {
    "palette_size": 16,
    "anim_frames": 8,
    "dithering": "ordered"
  },
  "character": {
    "rig": "frame_sequence",
    "expressions": true
  },
  "vfx": {
    "approach": "sprite_sheet",
    "spine_fx": false
  },
  "environment": {
    "parallax_layers": 2
  },
  "concept_art": {
    "needed": false,
    "types": []
  },
  "toolchain": {
    "aseprite_available": true,
    "constraints": []
  },
  "active_nodes": [
    "tile-art-gen",
    "character-art-gen",
    "environment-art-gen",
    "ui-art-gen",
    "vfx-art-gen"
  ],
  "skipped_nodes": [],
  "cross_model_review": []
}
```

### 注意事项

- `concept_art.needed = true` 时，`active_nodes` 中加入 `concept-art-gen`
- `3d-model-gen`、`concept-art-gen` 等节点目前未实现，首次出现时由 bootstrap 依据 `art-methodology.md` 动态生成 node-spec
- 不存在的节点不得写入 `active_nodes`；若游戏类型需要，须先在 bootstrap 中生成对应 node-spec

---

## 6. 知识库：art-methodology.md

### 内容原则

- **进知识库**：稳定的分类法、方法论框架、权衡结构、质量评审维度、决策树骨架
- **不进知识库**：工具具体版本/定价、当前市场统计、AI 实时能力、竞品数据

### 完整结构

```
## 一、美术类型分类法
  ### 2D 通用（卡通/写实/手绘）
  ### 2D 像素风（独立子节）
  ### 2D 矢量（SVG/Flash 风格）
  ### 3D（低模/写实/NPR 卡通渲染）
  ### 骨骼动画（Spine/DragonBones/Live2D）
  ### VFX（帧序列/Spine FX/Shader 粒子）

## 二、理论锚点

  ### 通用视觉基础（全类型适用）
  - 色彩理论（Itten《色彩的艺术》1961 / Albers《色彩互动》）
    → 互补色、类比色、暖冷对比、色彩和谐在地砖配色中的应用
  - 格式塔原则（Wertheimer/Köhler 1920s）
    → 接近性/相似性/图底关系 → UI 分组、视觉层次、引导玩家视线
  - 轮廓可读性（迪士尼角色设计传统）
    → 角色从剪影即可辨认 → 32-64px 小尺寸游戏角色设计约束
  - 色彩功能编码（游戏行业惯例）
    → 危险=红/安全=绿/特殊=金 → 特殊地砖、道具图标颜色语义

  ### 2D 动画
  - 动画12原则（Thomas & Johnston《生命的幻觉》1981）
    → 压扁拉伸/预备动作/缓入缓出/弧线 → Spine 动画和 VFX 的参考基准
  - 游戏手感/Juice（Nijman, GDC 2013《屏幕震动的艺术》）
    → 消除特效、连击弹出的反馈密度设计

  ### 像素风专项
  - 整数缩放约束（物理定律，非惯例）
    → 只能 1x/2x/3x 缩放，自由缩放导致模糊
  - 色相偏移调色板（LoSpec 社区规范）
    → 从暗到亮时色相随之偏移，避免"泥浆色"
  - 帧数经济学：4帧可信 / 8帧流畅 / 16帧精细（过多浪费制作成本）
  - 抖动技术：Bayer 矩阵/有序抖动 → 在有限色板内模拟渐变

  ### 3D
  - PBR（金属度/粗糙度工作流）— 当前行业标准
  - 面数预算与 LOD — 移动端硬约束（角色通常 500-3000 面）
  - 卡通渲染/NPR — 风格化 3D 着色方案（适合动森类游戏）
  - UV 展开规范 — 影响贴图利用率和接缝控制

  ### UI 美术
  - Fitts 定律 — 移动端触控目标最小 44×44px
  - WCAG 2.1 对比度 — 正常文字 4.5:1，大文字/图标 3:1
  - 图标视觉隐喻 — 功能图标需有普遍认知的视觉类比物

## 三、生产流水线模式（每种类型一条链路）

  2D 通用:   概念图(AI) → PSD 精修 → PNG 导出 → Atlas 打包 → 引擎
  2D 像素风: AI 生高分图 → PIL 降采样(nearest) → pngquant 量化 → Aseprite 修整 → Atlas
  骨骼动画:  美术分层 PSD → Spine 工程制作 → JSON/binary 导出 → Runtime 解析
  3D:        Blender 建模 → UV 展开 → 贴图绘制 → FBX/GLB 导出 → 引擎导入 → LOD
  矢量 UI:   AI 直写 SVG → 导出 PNG → Atlas

## 四、决策树骨架（art-concept 问答框架来源）

  入口: dimension?
    → 2d（非像素）: 地砖系统 → 角色骨骼 → 特效方案 → 场景层次 → 原画需求 → 工具约束
    → 2d（像素风）: 地砖分辨率 → 调色板 → 帧数预算 → Aseprite 可用性 → 原画需求 → 工具约束
    → 3d:           面数预算 → 贴图流程 → 骨骼动画方案 → VFX 方案 → 场景构建方式
  
  Q1（地砖系统）选"无地砖" → 移除 tile-art-gen
  Q2（角色骨骼）选"无骨骼" → character-art-gen 策略切换为帧序列
  原画需求选"需要"         → 加入 concept-art-gen

## 五、权衡框架

  Spine vs 帧序列：
    Spine 胜出条件: 换装系统/多表情/平滑补间/重复利用骨骼
    帧序列胜出条件: 手工质感要求高/动画师不熟骨骼/超精细 VFX

  2D vs 3D（移动端）：
    3D 胜出条件: 摄像机自由旋转/深度玩法/资产大量复用（不同贴图同骨骼）
    2D 胜出条件: 制作周期短/文件体积小/视觉精细控制

  AI 生图 vs 人工：
    AI 可覆盖: 2D 卡通/写实/手绘风格（地砖/角色/背景/图标）
    AI 间接可用: 像素风（生高分辨率图 → 程序化像素化）
    AI 不可用: Spine 动画工程 / 高质量 3D 模型 / PBR 贴图精修 / 手工像素艺术

## 六、质量评审维度（art-qa 验收标准来源）

  1. 风格一致性 — 所有资产共享同一视觉语言，无明显风格断层
  2. 颜色合规性 — 配色符合 art-tokens.json 的色值规范
  3. 功能可识别性 — 特殊元素在最小展示尺寸下功能可辨
  4. 角色一致性 — NPC 比例/轮廓线风格统一，表情变体间身份可辨
  5. 资产完整性 — 样本覆盖所有关键视觉区域，缺口已记录

## 七、常见失误模式

  - 过早细化: art-concept 阶段就定死具体数值，没有给样本验收后留修正空间
  - 风格混搭: 不同资产类别由不同参考图生成，导致风格断层
  - 忽略工具链约束: 选了 Spine Full 但团队没有 Spine 授权
  - 低估特效复杂度: 把 Spine FX 标记为 AI 可生成，实际不可能
  - 像素化参数错误: 降采样时用双线性插值而非最近邻，导致边缘模糊
```

---

## 7. 知识库：art-tools.md

### 内容原则

**以 AI 可调用性为第一维度组织**（不按工具用途分类）。每个工具条目：
- `invoke`: 调用方式
- `requires_install`: 是否需要预装（默认不可假设已安装）
- `capability`: 能做什么
- `limitation`: 不能做什么
- `fallback`: 不可用时降级

### 完整结构

```
## 一、MCP 直接调用（ai-gateway 工具）

  flux_generate_image
    invoke: MCP tool (mcp__plugin_meta-skill_ai-gateway__flux_generate_image)
    擅长: 角色立绘/地砖/图标/场景（卡通/写实/手绘风格）
    限制: 像素风效果差，无法控制精确构图，文字不可用
    fallback: generate_image（Imagen 4）

  generate_image（Imagen 4）
    invoke: MCP tool (mcp__plugin_meta-skill_ai-gateway__generate_image)
    擅长: 环境/背景/写实风格（支持 9:16 / 3:4）
    限制: 小尺寸图标效果差，不擅长卡通人物
    fallback: flux_generate_image

  openrouter_generate_image（GPT / Gemini 生图）
    invoke: MCP tool (mcp__plugin_meta-skill_ai-gateway__openrouter_generate_image)
    擅长: 风格多样，可通过 model 参数选择
    限制: 速度慢，成本较高
    fallback: flux_generate_image

## 二、Bash CLI 工具

  ImageMagick（convert / mogrify / composite）
    invoke: Bash
    requires_install: true（macOS: brew install imagemagick）
    用途: 格式转换/批量缩放/图片合成/色彩调整
    fallback: Python PIL

  pngquant
    invoke: Bash — pngquant --colors N input.png
    requires_install: true（macOS: brew install pngquant）
    用途: PNG 调色板量化（像素风核心步骤，将颜色减少到 N 色）
    limitation: 只能减色，不能增色；不改变分辨率
    fallback: Python PIL quantize()（质量略差）

  Aseprite（CLI batch 模式）
    invoke: Bash — aseprite --batch input.png --color-mode indexed --palette-size N -o output.png
    requires_install: true（需购买授权或自行编译）
    用途: 像素风颜色模式转换、帧序列导出、精确像素操作
    fallback: Python PIL（功能子集）

  TexturePacker CLI
    invoke: Bash — TexturePacker --sheet atlas.png --data atlas.json input/
    requires_install: true（商业软件，有免费版）
    用途: Sprite Atlas 打包（生成图集 + 坐标 JSON）
    fallback: Cocos Creator 内置 Atlas 自动打包（无需外部工具）

  ffmpeg
    invoke: Bash — ffmpeg -i frames/%04d.png -vf "fps=24" output.mp4
    requires_install: true（macOS: brew install ffmpeg；某些系统预装）
    用途: 帧序列 → 视频预览、格式转换、GIF 生成
    fallback: 跳过视频预览，仅提供帧序列

## 三、Python 脚本（PIL/Pillow / numpy）

  requires_install: pip install Pillow（通常预装或项目依赖）

  像素化管道（像素风核心流程）:
    步骤: AI 生高分辨率图 → PIL.resize(target, Image.NEAREST) → pngquant 量化
    代码模板:
      from PIL import Image
      img = Image.open("input_highres.png")
      img_pixel = img.resize((32, 32), Image.NEAREST)  # 最近邻插值，保留硬边
      img_pixel.save("output_pixel.png")
      # 然后调用: pngquant --colors 16 output_pixel.png

  Atlas 合图:
    多 PNG → PIL composite → 单 Atlas 图 + 坐标 JSON（TexturePacker 不可用时的降级）

  程序化占位帧生成:
    用 PIL 绘制色块 + 尺寸标注，作为 Spine 帧序列的占位资产

## 四、AI 直接生成（无需外部工具）

  SVG（矢量图标）:
    AI 直接写 XML → home/close/check/arrow 等几何图标
    适用: 简单形状类 UI 图标，不适用质感类图标

  JSON / HTML 规格文档:
    AI 直接写 → vfx-asset-spec.json / art-qa-report.html 等

## 五、无头模式（需安装）

  Blender --background --python
    invoke: Bash — blender --background --python script.py
    requires_install: true（blender 需加入 PATH）
    用途: 程序化低多边形 3D 模型生成、场景渲染、GLB 导出
    limitation: 无法替代手工建模；程序化只适合规律性几何体
    fallback: 输出 3D 规格文档（.json），标记 human_gate = true

## 六、需人工介入（不可自动化）

  以下情况 art-gen 节点策略：生成规格文档 + 程序化占位资产 + human_gate = true

  - Spine 工程制作（骨骼绑定/动画调节需 Spine GUI）
  - 高质量像素手绘（色相偏移调色板/手工描边/精细抖动）
  - PBR 贴图精修（Substance Painter 需 GUI）
  - ZBrush 高模雕刻
  - Live2D Cubism 面部动画
```

### 工具能力矩阵（节点执行策略依据）

| 资产类型 | MCP 生图 | Bash CLI | Python PIL | AI 直写 | 人工必须 |
|---|---|---|---|---|---|
| 2D 地砖（卡通） | ✅ flux | - | - | - | QA |
| 2D 地砖（像素风） | 间接(高分辨→降采样) | ✅ pngquant | ✅ resize(NEAREST) | - | QA |
| 角色立绘（卡通） | ✅ flux | - | - | - | QA |
| 角色（帧序列动画） | ✅ flux(关键帧参考) | ✅ ffmpeg | ✅ PIL | - | QA |
| Spine 骨骼动画 | ❌ | ❌ | ❌ | ✅ 规格文档 | ✅ 动画制作 |
| 3D 低模（程序化） | ❌ | ✅ Blender无头 | - | - | QA |
| 3D 高质量模型 | ❌ | ❌ | ❌ | ✅ 规格文档 | ✅ |
| UI 图标（矢量形状） | - | - | - | ✅ SVG | QA |
| UI 图标（质感类） | ✅ flux | - | - | - | QA |
| VFX 帧序列 | ✅ flux(参考帧) | ✅ ffmpeg | ✅ PIL(占位帧) | - | QA |
| 背景/环境场景 | ✅ Imagen | - | - | - | QA |
| Sprite Atlas | - | ✅ TexturePacker | ✅ PIL | - | - |

---

## 8. art-gen 节点拉取机制

每个 art-gen 节点的 `Context Pull` 段新增：读取 `art-pipeline-config.json`，据此切换执行策略。

**tile-art-gen 示例**

```
pull art-pipeline-config.json:
  style = "pixel"            → 走像素化管道（AI 生高分辨率图 → PIL 降采样 → pngquant）
  style ≠ "pixel"            → 直接调 flux_generate_image
  tileset.type = "isometric" → prompt 加入 "isometric view, 2:1 diamond tiles"
  tileset.tile_size          → 所有样本 target 此尺寸
  pixel.tile_resolution      → 像素风降采样的 target 分辨率
```

**character-art-gen 示例**

```
pull art-pipeline-config.json:
  character.rig = "spine_lite" → 生成骨骼分层参考图（各部件独立层）
  character.rig = "frame_sequence" → 生成完整关键帧参考图
  character.expressions = true → 必须覆盖多表情变体
  character.bone_limit        → 规格文档中注明骨骼数量上限
```

**vfx-art-gen 示例**

```
pull art-pipeline-config.json:
  vfx.approach = "sprite_sheet"    → 生成帧序列规格 + PIL 占位帧
  vfx.approach = "shader_particle" → 只输出参数文档，不生图
  vfx.spine_fx = false             → 跳过 Spine FX 规格
```

### active\_nodes 驱动节点选择

Bootstrap 读 `active_nodes` 写入 `workflow.json`，不再硬编码 scenario template 节点组合：

| 项目类型 | active\_nodes 典型值 |
|---|---|
| 纯 UI puzzle（无角色/无地砖） | `["ui-art-gen"]` |
| 2D 卡通手游（glow-island 类） | `["tile-art-gen", "character-art-gen", "environment-art-gen", "ui-art-gen", "vfx-art-gen"]` |
| 2D 像素风独立游戏 | `["tile-art-gen", "character-art-gen", "environment-art-gen", "ui-art-gen"]` |
| 含原画需求（任意类型） | 以上 + `["concept-art-gen"]` |
| 3D 游戏（未来，节点待实现） | 首次出现时由 bootstrap 动态生成 node-spec |

**重要**：未实现的节点（如 `3d-model-gen`、`concept-art-gen`）在 bootstrap 遇到时须先生成 node-spec 再写入 workflow.json，不能直接引用。

---

## 9. 知识库边界

| 内容 | 进知识库 | 运行时搜索 |
|---|---|---|
| 美术类型分类法 | ✅ | |
| 决策树骨架（问哪些维度、什么顺序） | ✅ | |
| 权衡框架（Spine vs 帧序列等） | ✅ | |
| 质量评审维度 | ✅ | |
| AI 调用方式（MCP/CLI/Python/直写） | ✅ | |
| 工具能力边界（能/不能做什么） | ✅ | |
| CLI 命令模板（稳定用法） | ✅ | |
| 竞品游戏当前美术方案 | | ✅ |
| 具体工具定价/版本号 | | ✅ |
| "同类游戏 X% 用 Spine" 统计 | | ✅ |
| AI 生图工具实时能力评测 | | ✅ |
| 当前 GPU 面数基准数据 | | ✅ |

---

## 10. Spec 自检

- [x] 无空标题：art-methodology.md 的四（决策树骨架）和六（质量评审维度）已填写完整
- [x] Pipeline 位置正确：art-concept 在 art-direction **之后**、art-spec-design **之前**
- [x] art-spec-design 与 art-concept 的关系已说明（art-spec-design 读取 config 产出资产清单）
- [x] Step 顺序一致：Q&A → 草稿 config → XV → 最终 config（Step 1→2→3→4）
- [x] 2D / 像素风 / 3D 三个分支问题组均已完整定义
- [x] 像素风 config 有独立 schema 示例
- [x] concept_art 需求通过 active_nodes 路由到 concept-art-gen（注明首次出现需先生成 node-spec）
- [x] 3D 模型工具矩阵反映 Blender 无头模式（低模程序化可用）
- [x] 未实现节点（3d-model-gen / concept-art-gen）已注明"首次出现须先生成 node-spec"
- [x] art-tools.md 按 AI 可调用性分类，每个工具含 requires_install + fallback
- [x] XV 有降级处理（不可用时跳过，直接写 final）
- [x] 两个知识库文件职责清晰，无内容重叠
