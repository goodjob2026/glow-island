# Glow Island — 美术资产规格说明书（Art Asset Spec）
> 版本：1.0 | 日期：2026-05-07 | 状态：已确认

---

## 总览

| 资产类别 | 数量 | 主要目录 | 格式 |
|----------|------|----------|------|
| 图块精灵（Tile Sprites） | 20种 × 4状态 = 80帧（静态）+ 动画 | `sprites/tiles/` | PNG / Spine |
| 章节背景（Backgrounds） | 6张 × 2版本（修复前/后）= 12张 | `sprites/backgrounds/` | PNG |
| 岛屿地图区域（Island Zones） | 6区域 × 5状态（修复前 + 4阶段）= 30张 | `sprites/island/` | PNG / Spine |
| NPC角色头像（Characters） | 4个NPC × 3表情 = 12帧（静态）+ 动画 | `sprites/characters/` | PNG / Spine |
| UI图标集（UI Icons） | 约30个 | `sprites/ui/` | PNG / SVG |
| 特效序列帧（Effects） | 8种特效 | `effects/frames/` | PNG序列帧 / Spine |

---

## 1. 图块精灵（Tile Sprites）

### 1.1 基础规格

| 项目 | 规格 |
|------|------|
| 单图块尺寸 @2x | 128 × 128 px |
| 单图块尺寸 @1x | 64 × 64 px |
| 画布出血区 | 4px（四周各留4px透明出血，实际画面区域 120×120 @2x） |
| 颜色深度 | RGBA 32-bit |
| 导出格式 | PNG-24（透明背景）|
| 图集打包 | 合并至 Texture Atlas，最大 2048×2048 per atlas |

### 1.2 图块类型列表（20种）

图块类型按章节分组，每章4-5种，视觉风格与章节主色对应。

**第1章 — 海边码头（4种）**

| 编号 | 名称 | 形状 | 主色 | 说明 |
|------|------|------|------|------|
| T01 | 海浪块 | 波形圆角矩形 | #87CEEB | 顶部波浪轮廓，内有细纹 |
| T02 | 木板块 | 圆角矩形 + 木纹 | #C49A6C | 横向木纹理，两侧铆钉细节 |
| T03 | 绳结块 | 圆形 + 绳圈纹 | #F5DEB3 | 米白绳结图案，中央麻花纹 |
| T04 | 贝壳块 | 扇形圆角 | #F4A261 | 贝壳轮廓，放射状细线 |

**第2章 — 中央小镇（4种）**

| 编号 | 名称 | 形状 | 主色 | 说明 |
|------|------|------|------|------|
| T05 | 石板块 | 正方形圆角 + 石缝 | #D9C9B5 | 石板纹，四角有缝隙细节 |
| T06 | 灯笼块 | 六边形 | #F4C95D | 灯笼轮廓，中央光点，两侧穗子 |
| T07 | 砖瓦块 | 矩形圆角 + 砖纹 | #C97D4E | 砖红色，水平砖缝纹理 |
| T08 | 喷泉块 | 圆形 + 水滴 | #7EC8E3 | 圆形水面 + 中央水柱小图标 |

**第3章 — 花田山坡（4种）**

| 编号 | 名称 | 形状 | 主色 | 说明 |
|------|------|------|------|------|
| T09 | 花朵块 | 花形（5瓣）圆角 | #C9A8D4 | 薰衣草紫，五瓣简约花形 |
| T10 | 叶片块 | 水滴形 | #7DBD7A | 叶形，中央叶脉，草绿色 |
| T11 | 蝴蝶块 | 蝴蝶轮廓圆角 | #F0C060 | 金黄蝴蝶简化图形 |
| T12 | 嫩芽块 | 圆形 + 出芽图 | #A8D88A | 浅绿圆形，中央嫩芽破土图案 |

**第4章 — 森林露营地（4种）**

| 编号 | 名称 | 形状 | 主色 | 说明 |
|------|------|------|------|------|
| T13 | 原木块 | 椭圆形 + 年轮 | #8B6241 | 年轮纹圆木横截面 |
| T14 | 苔藓块 | 不规则圆角 | #6B9E5E | 苔藓绿，略微不规则边缘 |
| T15 | 火星块 | 六边形 | #FF8C42 | 橙色六边形，内有火焰简图 |
| T16 | 帐篷块 | 三角圆角 | #C49A6C | 帐篷三角轮廓，中央拉链线 |

**第5章 — 温泉山谷（2种）**

| 编号 | 名称 | 形状 | 主色 | 说明 |
|------|------|------|------|------|
| T17 | 水雾块 | 云朵圆角 | #B8D4E0 | 雾蓝云朵形，边缘模糊感 |
| T18 | 石板块（温泉）| 六边形 | #A0A8B0 | 灰蓝石板，防滑纹纹理 |

**第6章 — 夜晚灯塔（2种）**

| 编号 | 名称 | 形状 | 主色 | 说明 |
|------|------|------|------|------|
| T19 | 星光块 | 四角星形圆角 | #F5C842 | 暖黄四角星，中央小圆点 |
| T20 | 海浪夜块 | 波形圆角矩形 | #2D4A7A | 深蓝夜海波形，白色细泡沫线 |

### 1.3 四种状态规范

每个图块必须提供以下状态：

**状态1：Normal（默认）**
- 文件名：`{tile_id}_normal@2x.png`（如 `t01_wave_normal@2x.png`）
- 静态单帧 PNG
- 底部固定阴影：`rgba(0,0,0,0.12)` 偏移 `0,3px`（烘焙进图层）

**状态2：Highlighted（连接高亮）**
- 文件名：`{tile_id}_highlighted@2x.png`
- 亮度 +20%，内发光 `rgba(255,255,255,0.35)`，实际绘制尺寸可略大（128→132px，含光晕，但透明区域留足）
- 也可通过运行时 Shader 实现，此时只需提供 Normal 帧

**状态3：Disappearing（消除序列帧）**
- 文件名：`{tile_id}_disappear_{frame:02d}@2x.png`（frame 01-12）
- 序列帧：12帧，30fps（总时长约0.4s，峰值约第4帧）
- 帧内容：放大至 140×140（含透明），再收缩+碎裂粒子，末帧全透明

**状态4：Special（特殊块循环动画）**
- 针对4种特殊块（Bomb/Lightning/Rainbow/Glow），提供Spine骨骼动画文件
- 循环动画：`{type}_idle` — 持续呼吸/脉冲动画（2-3s周期）
- 激活动画：`{type}_activate` — 触发时一次性播放（0.5-1.0s）
- Spine导出格式：`.skel` + `.atlas` + PNG纹理

### 1.4 命名规范

```
sprites/tiles/
├── t01_wave_normal@2x.png
├── t01_wave_highlighted@2x.png
├── t01_wave_disappear_01@2x.png
├── ...
├── t01_wave_disappear_12@2x.png
├── special/
│   ├── bomb_idle.skel
│   ├── bomb_idle.atlas
│   ├── bomb_idle.png
│   ├── bomb_activate.skel
│   ├── lightning_idle.skel
│   ├── lightning_activate.skel
│   ├── rainbow_idle.skel
│   ├── rainbow_activate.skel
│   ├── glow_idle.skel
│   └── glow_activate.skel
```

---

## 2. 章节背景（Backgrounds）

### 2.1 基础规格

| 项目 | 规格 |
|------|------|
| 尺寸 | 1080 × 1920 px（Portrait，9:16基准）|
| 安全区适配 | 内容主体在中央 1080×1600 区域内，顶底各留240px溢出 |
| 颜色深度 | RGB 24-bit（无需透明通道）|
| 导出格式 | PNG-24 或 JPEG（Q95）|
| 图层说明 | 分层导出（可选）：天空层 / 中景层 / 近景层，供视差滚动使用 |

### 2.2 每章两版本

- **修复前（before）**：整体低饱和度（HSL 饱和度 ≤ 20%），暗调，破败感
- **修复后（after）**：满彩，明亮，参考章节色板

### 2.3 章节背景描述

**Chapter 1 — 海边码头**
- 构图：码头延伸入海，远处海天线，近景左侧停靠木桩，右侧海面
- 修复前：灰木板，锈迹木桩，枯草，海面无反射，阴天
- 修复后：阳光斜射（右上→左下），海面碎金光斑，清澈天空 #87CEEB，温暖沙色码头
- 特殊元素：夕阳版本（标志性时刻，橙红渐变天空）备用图一张

**Chapter 2 — 中央小镇**
- 构图：石板街道正前方透视，两侧建筑，中央喷泉，远处街道消失点
- 修复前：荒草蔓延石缝，窗户紧闭，喷泉干涸，落叶堆积，蓝灰调
- 修复后：暖黄阳光 #F4C95D，窗台花盆，喷泉有水，街灯点亮，傍晚橙光版本备用

**Chapter 3 — 花田山坡**
- 构图：山坡从近景延伸向远处，花田占画面 60%，天空 40%
- 修复前：枯草黄，花圃轮廓不清，薄雾灰，石阶破损
- 修复后：薰衣草紫 + 金黄花交错，清晨薄雾（低饱和白雾层叠加），石阶整洁，阿花在中景

**Chapter 4 — 森林露营地**
- 构图：营地中央篝火台，周围树木形成自然圆形空间，顶部树冠框景
- 修复前：帐篷倒塌，篝火台石圈散乱，苔藓覆盖坐凳，暗绿调
- 修复后：篝火燃起（暖橙核心光），帐篷挺立，星空隐约可见，夜景为主

**Chapter 5 — 温泉山谷**
- 构图：温泉池居中，周围岩石围绕，远景山峦，水雾弥漫
- 修复前：水池浑浊，青苔遍布池边，水位极低，灰绿调
- 修复后：清澈温泉倒映天空（珍珠白反射），水雾动态层，岩石新铺石板，阿福在右侧

**Chapter 6 — 夜晚灯塔**
- 构图：灯塔占画面右侧 1/3，左侧大海，底部有礁石/海浪
- 修复前：灯塔灰暗，玻璃灰尘，铁锈楼梯断裂，漆黑夜色，无光
- 修复后：灯塔光柱旋转（动态效果由Spine处理），海面金色倒影，满天星斗，暖黄灯室
- 全岛俯视版本（标志性时刻用）：俯视角度，光柱扫过全部五个区域，备用图一张

### 2.4 命名规范

```
sprites/backgrounds/
├── bg_ch01_harbor_before@2x.png
├── bg_ch01_harbor_after@2x.png
├── bg_ch01_harbor_after_sunset@2x.png       (标志性时刻备用)
├── bg_ch02_town_before@2x.png
├── bg_ch02_town_after@2x.png
├── bg_ch02_town_after_evening@2x.png
├── bg_ch03_flower_before@2x.png
├── bg_ch03_flower_after@2x.png
├── bg_ch04_camp_before@2x.png
├── bg_ch04_camp_after@2x.png
├── bg_ch05_spring_before@2x.png
├── bg_ch05_spring_after@2x.png
├── bg_ch06_lighthouse_before@2x.png
├── bg_ch06_lighthouse_after@2x.png
└── bg_ch06_lighthouse_overview@2x.png       (全岛俯视标志性时刻)
```

---

## 3. 岛屿地图区域（Island Zones）

### 3.1 基础规格

| 项目 | 规格 |
|------|------|
| 整体岛屿地图尺寸 | 1080 × 1920 px（全岛俯视图）|
| 单区域图块尺寸 | 约 320 × 320 px（含透明边缘，视区域形状定）|
| 风格 | 俯视45°等轴视角，轻手绘扁平化 |
| 格式 | PNG-24（透明背景，可叠加在地图底图上）|

### 3.2 修复状态分级

每个区域共 5 个状态图：

| 状态 | 文件后缀 | 视觉说明 |
|------|----------|----------|
| 修复前 | `_s0` | 破败灰调，低饱和，特征建筑有破损 |
| 第1阶段 | `_s1` | 基础修复，结构性变化，饱和度 ~35% |
| 第2阶段 | `_s2` | 细节补全，生活气息出现，饱和度 ~55% |
| 第3阶段 | `_s3` | 生命迹象（人物/水/火），饱和度 ~70% |
| 第4阶段（完整）| `_s4` | 满彩，章节特色景观完整呈现 |

### 3.3 各区域说明

| 编号 | 区域 | 地图位置 | 特征建筑/元素 |
|------|------|----------|---------------|
| Z01 | 海边码头 | 岛屿南端 | 木码头、停船木桩、小木船、油灯 |
| Z02 | 中央小镇 | 岛屿中央 | 石板街、喷泉、木质店铺、灯笼 |
| Z03 | 花田山坡 | 岛屿西北 | 花圃、石阶、草帽木桩、花海 |
| Z04 | 森林露营地 | 岛屿东北 | 帐篷、篝火台、坐凳、小灯笼 |
| Z05 | 温泉山谷 | 岛屿西南 | 温泉池、导水渠、石板步道 |
| Z06 | 夜晚灯塔 | 岛屿北端 | 灯塔主体、楼梯、灯室、礁石 |

同时需要提供：
- **底图**：`island_base_map@2x.png`（1080×1920，不含任何区域图块的岛屿轮廓和海洋背景）
- **灯塔光效叠加层**：`island_lighthouse_beam@2x.png`（动态Spine，光柱扫过全岛效果）

### 3.4 命名规范

```
sprites/island/
├── island_base_map@2x.png
├── island_lighthouse_beam.skel
├── zone_ch01_harbor_s0@2x.png
├── zone_ch01_harbor_s1@2x.png
├── zone_ch01_harbor_s2@2x.png
├── zone_ch01_harbor_s3@2x.png
├── zone_ch01_harbor_s4@2x.png
├── zone_ch02_town_s0@2x.png
├── ... (同上规律)
├── zone_ch06_lighthouse_s4@2x.png
```

---

## 4. NPC角色头像（Characters）

### 4.1 基础规格

| 项目 | 规格 |
|------|------|
| 头像尺寸 | 128 × 128 px @2x（64×64 @1x）|
| 画框形状 | 圆形裁切（内容绘制范围约直径 112px，外留 8px 边框区）|
| 背景 | 透明（圆形外透明，便于 CSS 控制边框色）|
| 格式 | PNG-24 |
| 表情版本 | 每个NPC至少3种：默认/开心/若有所思（悲/思考） |
| 动画版本 | Spine骨骼动画文件（对话框内使用），含 idle / talk / react 动画 |

### 4.2 NPC列表

**NPC01 — 渔夫·阿海（第1章）**
- 外形参考：中年渔夫，戴宽檐草帽，蓝色布衣，肤色较深，沉默寡言气质
- 表情：默认（平静看海）/ 微笑（系好缆绳后）/ 发呆（看海的若有所思）
- 特征道具：鱼竿、草帽
- 颜色和谐：与章节淡蓝+米白协调

**NPC02 — 花农·阿花（第3章）**
- 外形参考：年轻女性，圆脸，头戴草帽（宽边），围裙，清秀温柔
- 表情：默认（温柔微笑）/ 开心（捧花递出时）/ 专注（蹲地松土时）
- 特征道具：草帽、浇水壶、花束
- 颜色和谐：与章节粉紫+草绿协调

**NPC03 — 背包客·阿林（第4章）**
- 外形参考：中等身材，帽沿压低（重要：整章多数时候看不清脸），背包，徒步服装
- 表情：默认（低帽沿状态）/ 抬头（标志性时刻，看星空时露出脸）/ 沏茶（推杯子时）
- 特征道具：背包、地图、茶杯、帽子
- 颜色和谐：与章节深绿+棕褐协调

**NPC04 — 温泉老爷爷·阿福（第5章）**
- 外形参考：老年男性，圆脸，笑纹深，穿浴衣，慈祥幽默
- 表情：默认（嫌弃/无奈）/ 满意（点头试石板）/ 享受（闭眼泡温泉）
- 特征道具：毛巾、浴桶
- 颜色和谐：与章节珍珠白+雾蓝协调

**NPC05 — 灯塔守护者·阿明（第6章）**
- 外形参考：成年男性，沉默，海风感气质，深色大衣，站姿像礁石
- 表情：默认（仰望灯塔，沉默）/ 手握点火装置（停顿）/ 背身（灯塔亮起时）
- 特征道具：点火装置、大衣
- 颜色和谐：与章节深蓝+暖黄协调
- 备注：第6章专属NPC，编号 NPC05（文档中列4个主要NPC，此为额外必要角色）

### 4.3 命名规范

```
sprites/characters/
├── npc_ahai_default@2x.png
├── npc_ahai_happy@2x.png
├── npc_ahai_thinking@2x.png
├── npc_ahai_dialog.skel          (对话动画)
├── npc_ahua_default@2x.png
├── npc_ahua_happy@2x.png
├── npc_ahua_focused@2x.png
├── npc_ahua_dialog.skel
├── npc_alin_default@2x.png
├── npc_alin_uplook@2x.png        (标志性时刻：抬头看星空)
├── npc_alin_tea@2x.png
├── npc_alin_dialog.skel
├── npc_afu_default@2x.png
├── npc_afu_satisfied@2x.png
├── npc_afu_enjoying@2x.png
├── npc_afu_dialog.skel
├── npc_aming_default@2x.png
├── npc_aming_holding@2x.png
├── npc_aming_back@2x.png         (背身望海姿态)
└── npc_aming_dialog.skel
```

---

## 5. UI图标集（UI Icons）

### 5.1 基础规格

| 项目 | 规格 |
|------|------|
| 尺寸规格 | 24×24px（小）/ 32×32px（中）/ 48×48px（大）@2x |
| 风格 | 线面结合，圆角统一 3px（线宽约 2px @2x）|
| 颜色 | 单色（章节主色 or 中性灰），可程序化着色 |
| 格式 | PNG-24（透明背景）+ SVG（矢量源文件）|
| 导出 | 按尺寸分层导出，合并到 icon sprite sheet |

### 5.2 图标清单（约30个）

**导航与界面（8个）**

| 编号 | 名称 | 尺寸 | 说明 |
|------|------|------|------|
| IC01 | home | 32px | 房屋图标，返回主界面 |
| IC02 | settings | 32px | 齿轮图标，设置 |
| IC03 | back_arrow | 24px | 左箭头，返回上一页 |
| IC04 | close_x | 24px | 关闭/叉号 |
| IC05 | menu | 32px | 三横线菜单 |
| IC06 | info | 24px | 圆圈感叹号，说明 |
| IC07 | check | 24px | 勾选，确认 |
| IC08 | map | 32px | 地图展开图标 |

**游戏道具/助攻（6个）**

| 编号 | 名称 | 尺寸 | 说明 |
|------|------|------|------|
| IC09 | hint | 48px | 灯泡图标，提示道具 |
| IC10 | shuffle | 48px | 循环箭头，重排棋盘 |
| IC11 | add_steps | 48px | 加号+脚印，增加步数 |
| IC12 | bomb_item | 48px | 炸弹道具（关卡前使用） |
| IC13 | lightning_item | 48px | 闪电道具（关卡前使用）|
| IC14 | rainbow_item | 48px | 彩虹道具（关卡前使用）|

**货币与资源（6个）**

| 编号 | 名称 | 尺寸 | 说明 |
|------|------|------|------|
| IC15 | beach_coin | 32px | 沙滩币，软货币，圆形贝壳纹 |
| IC16 | glowstone | 32px | 丹青石，硬货币，发光宝石形 |
| IC17 | material_wood | 24px | 浮木材料图标 |
| IC18 | material_rope | 24px | 绳索材料图标 |
| IC19 | material_seed | 24px | 花种材料图标 |
| IC20 | material_generic | 24px | 通用材料图标（其他章节）|

**进度与状态（6个）**

| 编号 | 名称 | 尺寸 | 说明 |
|------|------|------|------|
| IC21 | star_empty | 32px | 空星，评级 |
| IC22 | star_full | 32px | 满星，评级 |
| IC23 | star_half | 32px | 半星，评级 |
| IC24 | lock | 32px | 锁，章节未解锁 |
| IC25 | progress_bar_cap | 24px | 进度条两端圆帽 |
| IC26 | glow_energy | 32px | 光能图标，光柱+圆形 |

**社交与分享（4个）**

| 编号 | 名称 | 尺寸 | 说明 |
|------|------|------|------|
| IC27 | share | 32px | 分享箭头 |
| IC28 | milestone_flag | 32px | 里程碑旗帜 |
| IC29 | sound_on | 24px | 音量开 |
| IC30 | sound_off | 24px | 音量关 |

### 5.3 命名规范

```
sprites/ui/
├── ic_home@2x.png
├── ic_settings@2x.png
├── ic_back_arrow@2x.png
├── ic_close@2x.png
├── ic_menu@2x.png
├── ic_info@2x.png
├── ic_check@2x.png
├── ic_map@2x.png
├── ic_hint@2x.png
├── ic_shuffle@2x.png
├── ic_add_steps@2x.png
├── ic_item_bomb@2x.png
├── ic_item_lightning@2x.png
├── ic_item_rainbow@2x.png
├── ic_currency_beach_coin@2x.png
├── ic_currency_glowstone@2x.png
├── ic_material_wood@2x.png
├── ic_material_rope@2x.png
├── ic_material_seed@2x.png
├── ic_material_generic@2x.png
├── ic_star_empty@2x.png
├── ic_star_full@2x.png
├── ic_star_half@2x.png
├── ic_lock@2x.png
├── ic_progress_cap@2x.png
├── ic_glow_energy@2x.png
├── ic_share@2x.png
├── ic_milestone_flag@2x.png
├── ic_sound_on@2x.png
├── ic_sound_off@2x.png
└── svg/                           (矢量源文件)
    ├── ic_home.svg
    └── ... (同名SVG文件)
```

---

## 6. 特效序列帧（Effects）

### 6.1 基础规格

| 项目 | 规格 |
|------|------|
| 帧率 | 30fps（大多数特效）/ 60fps（关键核心特效）|
| 格式 | PNG序列帧 或 Spine骨骼动画 |
| 单帧尺寸 | 视特效范围定，详见各特效规格 |
| 透明通道 | RGBA，序列帧全部透明背景 |
| 播放模式 | 一次性（Once）或 循环（Loop），详见各特效 |

### 6.2 特效列表

**EF01 — 图块消除特效（Tile Disappear）**
- 触发：任意图块消除时
- 画布尺寸：160×160 @2x（含出血）
- 帧数：12帧 @30fps（总时长 0.4s）
- 内容：图块放大 → 碎裂为6-8个小片 → 粒子扩散消失
- 粒子颜色：跟随图块颜色，末帧全透明
- 变体：6种颜色变体（对应6种基础图块色）
- 命名：`fx_tile_disappear_{color}_f{01-12}@2x.png`

**EF02 — 连击气泡（Combo Popup）**
- 触发：连击数 ≥ 3 时弹出
- 画布尺寸：200×100 @2x
- 帧数：15帧 @30fps（总时长 0.5s）
- 内容：数字+COMBO文字弹入（弹跳曲线）→ 悬停 → 淡出上浮
- Spine文件（推荐）：`fx_combo_popup.skel`
- 文字替换：通过Spine slot替换，不分颜色版本
- 变体：3×3/5×5/10×10连击，字号递增

**EF03 — 光链效果（Glow Chain）**
- 触发：连接 Glow 图块时
- 画布：全屏叠加层（1080×1920 @2x）
- Spine文件：`fx_glow_chain.skel`，路径跟随连接路径动态调整
- 内容：金色光粒子沿连接路径流动，速度约 600px/s，流向岛屿地图区域
- 持续时长：约 0.8-1.5s（视路径长短）

**EF04 — 区域修复光效（Area Restore Glow）**
- 触发：区域修复阶段切换时
- 画布：覆盖区域图块的全区域（约 400×400 @2x）
- Spine文件：`fx_area_restore.skel`，含 4 个阶段动画（stage1-4）
- 内容：白色/金色光波从区域中心向外扩散，持续约 3-5s，配合区域图片切换
- 第4阶段（完整修复）：额外彩色光晕爆发，约 2s

**EF05 — 炸弹爆炸特效（Bomb Explosion）**
- 触发：炸弹块激活时
- 画布：640×640 @2x（3×3格范围）
- Spine文件：`fx_bomb_explosion.skel`
- 内容：中央橙色爆炸冲击波 → 粒子碎片向外扩散（红/橙/黄）→ 轻微烟雾消散
- 总时长：约 0.6s

**EF06 — 闪电特效（Lightning Strike）**
- 触发：闪电块激活时
- 画布：1080×128 @2x（横向全行）或 128×1920 @2x（纵向全列）
- Spine文件：`fx_lightning_row.skel` / `fx_lightning_col.skel`
- 内容：电弧从激活块向两侧延伸 → 白色闪光条横扫 → 消退
- 总时长：约 0.5s

**EF07 — 彩虹消除特效（Rainbow Burst）**
- 触发：彩虹块消除时
- 画布：320×320 @2x
- Spine文件：`fx_rainbow_burst.skel`
- 内容：七彩环形粒子从中央爆发，向外扩散后淡出
- 总时长：约 0.7s

**EF08 — 灯塔光柱特效（Lighthouse Beam）**
- 触发：第6章，每8步自动触发 / 标志性时刻全岛版
- 画布：全屏 1080×1920 @2x
- Spine文件：`fx_lighthouse_beam_row.skel`（单行扫过）/ `fx_lighthouse_beam_island.skel`（全岛扫过）
- 内容：暖黄光柱从右侧灯塔方向扫过棋盘，光柱内 Glow 块高亮
- 总时长：单行约 0.5s；全岛版约 3s（标志性时刻）

### 6.3 命名规范

```
effects/frames/
├── fx_tile_disappear_blue_f01@2x.png
├── ... f12@2x.png
├── fx_tile_disappear_yellow_f01@2x.png
├── ... (其他颜色)
├── spine/
│   ├── fx_combo_popup.skel
│   ├── fx_combo_popup.atlas
│   ├── fx_combo_popup.png
│   ├── fx_glow_chain.skel
│   ├── fx_glow_chain.atlas
│   ├── fx_glow_chain.png
│   ├── fx_area_restore.skel
│   ├── fx_area_restore.atlas
│   ├── fx_area_restore.png
│   ├── fx_bomb_explosion.skel
│   ├── fx_lightning_row.skel
│   ├── fx_lightning_col.skel
│   ├── fx_rainbow_burst.skel
│   ├── fx_lighthouse_beam_row.skel
│   └── fx_lighthouse_beam_island.skel
```

---

## 7. 交付标准

### 7.1 通用交付要求

| 要求项 | 说明 |
|--------|------|
| 分辨率 | 全部以 @2x（高分辨率）为主交付，@1x 可通过自动缩小生成 |
| 色彩空间 | sRGB |
| 文件大小 | 单张 PNG ≤ 500KB（大背景 ≤ 1.5MB），Spine 纹理 ≤ 512KB |
| 透明通道 | 使用透明背景的图，确保边缘无多余像素（无白边/黑边溢出）|
| 命名 | 全部小写+下划线，含@2x/@1x后缀，不使用中文或空格 |
| 版本控制 | 文件名含版本号时使用 `_v1`, `_v2` 后缀 |

### 7.2 Spine 动画交付要求

| 要求项 | 说明 |
|--------|------|
| Spine 版本 | 4.1.x（与引擎版本对齐）|
| 导出格式 | Binary `.skel` + JSON `.json`（备用）+ `.atlas` + PNG 纹理 |
| 纹理尺寸 | 2 的幂次：256/512/1024 |
| 命名规范 | Spine 内部动画名称：全英文小写+下划线，如 `idle`, `activate`, `talk` |
| 槽位（Slots）| 可替换颜色/内容的部分使用 Slot，便于程序化控制 |

### 7.3 目录结构总览

```
assets/
├── sprites/
│   ├── tiles/
│   │   ├── (20种 × Normal/Highlighted PNG + 消除序列帧)
│   │   └── special/
│   │       └── (4种特殊块 Spine 文件)
│   ├── backgrounds/
│   │   └── (15张 背景 PNG，含备用版本)
│   ├── island/
│   │   ├── island_base_map@2x.png
│   │   ├── island_lighthouse_beam.skel
│   │   └── (6区域 × 5状态 = 30张 PNG)
│   ├── characters/
│   │   └── (5个NPC × 3表情 PNG + 5个 Spine 对话动画)
│   └── ui/
│       ├── (30个图标 PNG @2x)
│       └── svg/
│           └── (30个图标 SVG 矢量源文件)
└── effects/
    ├── frames/
    │   └── (图块消除序列帧 PNG)
    └── spine/
        └── (8种特效 Spine 文件)
```

---

## 8. 优先级与分批交付建议

### 批次1（MVP，游戏原型验证所需）
- 6种基础图块 Normal 状态（各章1种代表图块）
- 第1章背景（修复前+后）
- 所有图块消除序列帧（通用版）
- UI图标集（按钮/货币/步数，约15个）

### 批次2（第1章完整体验）
- 第1章4种图块全部4状态
- 第1章岛屿区域5个修复状态
- NPC01 阿海全套头像 + 对话动画
- 炸弹/闪电/彩虹/Glow 特殊块 Spine 动画
- 连击气泡特效

### 批次3（第2-4章）
- 第2-4章图块、背景、岛屿区域
- NPC02 阿花 / NPC03 阿林全套
- 光链特效 + 区域修复光效

### 批次4（第5-6章 + 完整交付）
- 第5-6章图块、背景、岛屿区域
- NPC04 阿福 / NPC05 阿明全套
- 灯塔光柱特效（含全岛版）
- 全部剩余UI图标
- 资产全量审查与优化

---

*Art Asset Spec v1.0 · Glow Island · 2026-05-07*
