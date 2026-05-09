# Art Concept Skill Design

**Date:** 2026-05-09  
**Status:** Awaiting user review  
**Scope:** meta-skill plugin — art discovery skill + domain knowledge files

---

## 1. 背景与动机

当前 meta-skill 游戏设计流水线（`game-design.md`）中，美术节点（`art-direction → art-spec-design → ai-art-generation`）是硬编码在 scenario template 里的，无法根据游戏类型进行特化：

- 2D 卡通 vs 像素风 vs 3D 低模 → 完全不同的工具链和节点行为
- AI 生图能力对不同美术类型差异极大（卡通可用，像素风几乎不可用，Spine 不可用）
- 缺乏上游产品概念阶段的美术规格讨论，导致后期执行节点无依据可循

**目标**：引入 `art-concept` 阶段，在游戏文档设计完成后、执行节点生成前，通过搜索驱动的交互式对话确定美术技术规格，产出 `art-pipeline-config.json` 驱动后续所有美术节点的特化行为。

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
    capabilities/
      game-design.md            ← 修改：art-concept 触发逻辑
```

### 修改文件

- `knowledge/capabilities/game-design.md`：pipeline 中 art-direction 前插入 art-concept 触发检查
- `knowledge/domains/gaming.md`：art-direction 节点补充 `art_overview` 输出字段

---

## 3. 信息流与触发机制

### Bootstrap 自然顺序（拉为主）

```
/bootstrap
  → product-concept（交互，产出 product-concept.json）
  → 检测 is_game_project = true
  → game-doc-design 阶段（世界观/角色弧/系统设计 + art_overview）  ← 新增 art_overview 输出
  → 检查 art-pipeline-config.json 是否存在
      不存在 → 调起 art-concept skill（拉取 game-doc-design 产出）
      已存在 → 跳过，直接使用已有 config 生成节点
  → bootstrap 读 art-pipeline-config.active_nodes 生成对应美术执行节点
```

**art-concept 不是独立命令**，由 bootstrap 在 game-doc-design 完成后自动串联。用户仍可单独运行 `/art-concept` 修订美术决策。

### 两层美术规格职责

| | game-doc-design 美术概要（art_overview） | art-concept 详细规格 |
|---|---|---|
| 粒度 | 决策级（选方向） | 技术级（选工具/格式/参数） |
| 示例 | `dimension: "2d"`, `style: "cartoon"`, `animation: "spine"` | 骨骼数量上限、帧率、Atlas 打包策略 |
| 产出字段 | 写入 game-design 主文档的 `art_overview` | `art-pipeline-config.json` |
| 驱动下游 | art-concept 验收时拉取 | art-gen 节点执行时拉取 |

---

## 4. art-concept Skill 内部流程

### Step 0：验收 game-doc-design 美术概要

```
拉取 art_overview（来自 game-doc-design 产出）：
  ✓ dimension: "2d" | "3d" | "2.5d"
  ✓ style: "cartoon" | "pixel" | "realistic" | "hand_drawn"
  ✓ animation_system: "frame" | "spine" | "3d_skeletal" | "mixed"

展示已决策内容，问一个问题：
  "以上游戏文档中的美术方向是否需要修订？"
  → 有修订 → 先回 game-doc-design 修改，再继续
  → 确认无误 → 进入 Step 0.5
```

### Step 0.5：竞品美术研究（搜索驱动）

基于 `genre` + `style` 自动搜索，结果用于后续问答的选项和推荐：

```
搜索目标：
  1. "{genre} mobile game art style {year}"      → 同类型主流美术方向
  2. "{style} {dimension} game asset pipeline"   → 可行技术方案
  3. "{genre} top games art direction reference"  → 竞品截图/风格分析

源质量分级：
  P1: GDC 演讲 / 艺术总监 ArtStation 博客 / 官方美术指南
  P2: 游戏开发博客 / IndieDB 案例分析
  P3: Reddit r/gamedev / Twitter 美术师帖子
  P4: 泛 SEO 教程内容（仅参考，不引用）

搜索结论用于：
  - 各问答维度的默认推荐选项
  - 选项附带证据（"同类游戏 70% 使用 Spine Lite…"）
```

### Step 1：按维度逐一问答

**铁律：从不问开放性问题。每个问题提供 2-4 个选项，选项来自搜索结论。**

#### 2D 分支（6 问）

| # | 问题 | 选项来源 | 驱动 config 字段 |
|---|---|---|---|
| 1 | 地砖系统？ | 竞品调研 | `tileset.type` |
| 2 | 角色骨骼精度？ | 竞品调研 + 团队约束 | `character.rig` |
| 3 | 特效方案？ | 竞品调研 | `vfx.approach` |
| 4 | 场景层次？ | 竞品调研 | `environment.parallax_layers` |
| 5 | 需要原画吗？ | 项目规模推断 | `concept_art.types[]` |
| 6 | 工具链约束？ | 用户已有授权/团队技能 | `toolchain.constraints` |

像素风分支（`style = "pixel"`）替换 Q2/Q3/Q4 为：
- 地砖分辨率（8/16/32/64px）
- 调色板大小（8/16/32/256色）
- 动画帧数预算（4帧走路/8帧流畅/16帧精细）

**3D 分支另有独立问题组（面数预算/贴图流程/动画系统/VFX方案）**

### Step 2：XV 交叉验证

art-pipeline-config.json 产出后，发给另一模型独立审查：

```
发送内容：art-pipeline-config.json 摘要
审查问题：
  - 这套美术方案对 {genre} 游戏有哪些技术风险？
  - 是否有风格不一致的潜在问题？
  - 工具链选择有什么盲点？

输出写入 art-pipeline-config.cross_model_review[]
XV 不可用时：跳过，输出 "XV cross-validation unavailable"
```

### Step 3：产出 art-pipeline-config.json

```json
{
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
    "needed": true,
    "types": ["character_sheet"]
  },
  "toolchain": {
    "spine_licensed": true,
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

`active_nodes` 是 bootstrap 后续写入 `workflow.json` 的依据，不再硬编码节点组合。

---

## 5. 知识库：art-methodology.md

### 内容原则

- **进知识库**：稳定的分类法、方法论框架、权衡结构、质量评审维度、决策树骨架
- **不进知识库**：工具具体版本/定价、当前市场统计、AI 工具实时能力、竞品数据

### 结构

```
## 一、美术类型分类法
  ### 2D 通用（卡通/写实/手绘/矢量）
  ### 2D 像素风（独立子节）
  ### 3D
  ### 骨骼动画（Spine/DragonBones/Live2D）
  ### VFX

## 二、理论锚点

  ### 通用视觉基础
  - 色彩理论（Itten 1961 / Albers）— 色彩和谐、互补、暖冷对比
  - 格式塔原则（Wertheimer/Köhler 1920s）— 接近性、相似性、图底关系
  - 轮廓可读性（迪士尼传统）— 剪影即可辨认角色
  - 色彩功能编码（游戏行业惯例）— 危险/安全/特殊的颜色语义

  ### 2D 动画
  - 动画12原则（Thomas & Johnston《生命的幻觉》1981）
  - 游戏手感/Juice（Nijman GDC 2013《屏幕震动的艺术》）

  ### 像素风
  - 整数缩放约束（物理定律，非惯例）
  - 色相偏移调色板（LoSpec 规范）
  - 帧数经济学（4帧可信/8帧流畅/16帧精细）
  - 抖动技术（Bayer 矩阵，有序抖动）

  ### 3D
  - PBR（金属度/粗糙度工作流，行业标准）
  - 面数预算与 LOD（移动端硬件约束）
  - 卡通渲染/NPR（风格化 3D 着色方案）

  ### UI 美术
  - Fitts 定律（移动端触控目标最小 44px）
  - WCAG 对比度（4.5:1 正常文字，3:1 大文字）

## 三、生产流水线模式（每种类型一条链路）
  2D 通用: PSD → PNG → Atlas → 引擎
  像素风:  Aseprite → PNG 帧 → pngquant 量化 → Atlas
  Spine:   Spine 工程 → JSON/binary → Runtime
  3D:      Blender → FBX/GLB → 引擎导入 → LOD

## 四、决策树骨架（art-concept 问答框架来源）

## 五、权衡框架
  Spine vs 帧序列：各自在什么条件下胜出
  2D vs 3D：移动端实际成本对比
  AI 生图 vs 人工：哪类资产 AI 能覆盖

## 六、质量评审维度（art-qa 验收标准来源）

## 七、常见失误模式
  过早细化 / 风格混搭 / 忽略工具链约束 / 低估特效复杂度
```

---

## 6. 知识库：art-tools.md

### 内容原则

**以 AI 可调用性为第一维度组织**，不按工具类型分。每个工具条目包含：
- `invoke`：调用方式
- `requires_install`：是否需要预装
- `capability`：能做什么
- `limitation`：不能做什么
- `fallback`：不可用时降级方案

### 结构

```
## 一、MCP 直接调用（ai-gateway）
  flux_generate_image
    invoke: MCP tool
    擅长: 角色/地砖/图标/场景（卡通/写实）
    差: 像素风/文字/精确构图
    
  generate_image（Imagen 4）
    invoke: MCP tool
    擅长: 环境/背景/写实风格（9:16/3:4）
    差: 小尺寸图标

## 二、Bash CLI 工具
  ImageMagick
    invoke: Bash — convert/composite/mogrify
    用途: 格式转换、批量处理、合图
    fallback: Python PIL

  pngquant
    invoke: Bash — pngquant --colors N
    用途: 调色板量化（像素风核心步骤）
    requires_install: true

  Aseprite CLI（batch 模式）
    invoke: Bash — aseprite --batch
    用途: 像素风转换、帧序列导出
    requires_install: true
    fallback: Python PIL 降采样

  TexturePacker CLI
    invoke: Bash — TexturePacker --sheet
    用途: Sprite Atlas 打包
    requires_install: true
    fallback: Cocos Creator 内置 Atlas

  ffmpeg
    invoke: Bash — ffmpeg -i frames/%d.png
    用途: 帧序列 → 视频预览、格式转换

## 三、Python 脚本（PIL/Pillow）
  像素化管道:
    AI 生图(高分辨率) → PIL resize(nearest) → pngquant 量化 → 像素风资产
  Atlas 合图:
    多 PNG → PIL composite → 单 Atlas 图 + 坐标 JSON
  帧序列生成:
    程序化绘制占位帧（色块 + 尺寸标注）

## 四、AI 直接生成（无需外部工具）
  SVG: AI 直接写 XML → 矢量图标（home/close/check 等几何图标）
  JSON: 配置文件、规格文档
  HTML: 审查报告（art-qa-report.html 等）

## 五、无头模式（需安装）
  Blender --background --python
    用途: 程序化低多边形 3D 模型生成
    requires_install: true
    fallback: 输出 3D 规格文档，标记 human_gate

## 六、需人工介入（不可自动化）
  Spine 工程制作 / 手工像素艺术 / PBR 贴图绘制 / ZBrush 高模
  → 节点策略: 生成规格文档 + 占位资产，设置 human_gate = true
```

### 工具能力矩阵（节点执行策略依据）

| 资产类型 | MCP 生图 | CLI 脚本 | Python | 直写 | 人工必须 |
|---|---|---|---|---|---|
| 2D 地砖（卡通） | ✅ flux | - | - | - | QA |
| 2D 地砖（像素风） | 间接→pixelate | ✅ pngquant | ✅ PIL | - | QA |
| 角色（卡通） | ✅ flux | - | - | - | QA |
| Spine 动画 | ❌ | ❌ | ❌ | 规格文档 | ✅ |
| 3D 模型 | ❌ | - | - | - | ✅ |
| UI 图标（矢量） | 间接 | - | - | ✅ SVG | QA |
| VFX 帧序列 | ✅ flux→frames | ✅ ffmpeg | ✅ PIL | - | QA |
| 背景场景 | ✅ Imagen | - | - | - | QA |
| Atlas 打包 | - | ✅ TexturePacker | ✅ PIL | - | - |

---

## 7. art-gen 节点拉取机制

每个 art-gen 节点的 `Context Pull` 段新增：读取 `art-pipeline-config.json`，据此切换执行策略。

**示例：tile-art-gen**
```
pull art-pipeline-config.json:
  tileset.type = "grid"      → 正交地砖
  tileset.type = "isometric" → 等距视图地砖
  style = "pixel"            → 走 pixelate 管道，不直接用 AI 生图产出
  tileset.tile_size          → 所有样本使用此尺寸
```

**示例：vfx-art-gen**
```
pull art-pipeline-config.json:
  vfx.approach = "sprite_sheet" → 生成帧序列规格 + ffmpeg 占位帧
  vfx.approach = "shader_particle" → 只输出参数文档，不生图
  vfx.spine_fx = false → 跳过 Spine FX 骨骼规格
```

**节点选择：**  
Bootstrap 读 `active_nodes` 写入 `workflow.json`，不再硬编码 scenario template 节点组合。

| 项目类型 | active_nodes 示例 |
|---|---|
| 纯 UI puzzle（无角色） | `["tile-art-gen", "ui-art-gen"]` |
| 3D RPG | `["3d-model-gen", "character-art-gen", "environment-art-gen", "vfx-art-gen"]` |
| 2D 卡通手游（glow-island 类） | `["tile-art-gen", "character-art-gen", "environment-art-gen", "ui-art-gen", "vfx-art-gen"]` |

---

## 8. 知识库边界

| 内容 | 进知识库 | 运行时搜索 |
|---|---|---|
| 美术类型分类法 | ✅ | |
| 决策树骨架（问哪些维度） | ✅ | |
| 权衡框架（Spine vs 帧序列） | ✅ | |
| 质量评审维度 | ✅ | |
| AI 调用方式（MCP/CLI/Python） | ✅ | |
| 工具能力边界（能/不能做什么） | ✅ | |
| 竞品游戏当前美术方案 | | ✅ |
| 具体工具定价/版本 | | ✅ |
| "同类游戏 X% 用 Spine" 统计 | | ✅ |
| AI 生图工具实时能力评测 | | ✅ |

---

## 9. Spec 自检

- [x] 无 TBD 或未完成章节
- [x] pipeline 顺序与 game-design.md 现有结构一致（art-direction 前插入）
- [x] art-pipeline-config.json schema 字段齐全，与 art-gen 节点 pull 对齐
- [x] 像素风有独立分支，覆盖工具链和问答差异
- [x] AI 不可用工具（Spine/ZBrush/Photoshop）已标记 human_gate
- [x] XV 有降级处理（不可用时跳过）
- [x] 两个知识库文件职责清晰，无重叠
