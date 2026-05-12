# Glow Island (輝島) — 项目规划移交文档

**版本:** 1.0  
**生成日期:** 2026-05-13  
**生成节点:** game-design-finalize  
**移交对象:** 美术团队 / UI团队 / 音频团队 / 程序开发团队

---

## 一、项目简介

**Glow Island（輝島）** 是一款休闲连连看 + 叙事治愈手游。

- **核心玩法：** 连连看路径匹配（≤2次转弯）+ 节奏驱动连击系统
- **情感定位：** 天天爱消除式爽快感 × 动物森友会式治愈美学
- **平台：** iOS + Android（Cocos Creator 3.x web-mobile导出）
- **引擎：** Cocos Creator 3.x，后端 Fastify + Prisma + PostgreSQL
- **地区：** 全球发行，不上架中国区
- **登录：** Apple ID (iOS) / Google (Android) / 邮箱+密码（跨平台主键）

---

## 二、玩家体验目标

### 核心体验柱

1. **节奏爽快感** — 快速连击，Combo计时器，特效音效强反馈；玩家处于"快速流畅消除"的心流状态
2. **叙事治愈** — 山田律 × 丸山ひなた情感线，灯台守日记碎片，温暖从不宣告
3. **视觉进度感** — 岛屿从废墟到焕新，每6关小变化，每章大变化，饱和度随修复上升

### 会话设计

- 目标关卡时长：1–2分钟/关
- 风格：超休闲，碎片化友好，快进快出
- 无体力，无倒计时，随时重试，随时退出

---

## 三、游戏循环与内容规模

| 指标 | 数值 |
|------|------|
| 总关卡 | 180关（6章×30关） |
| 单章时长（中位玩家）| ~3小时 |
| 总时长（中位玩家）| ~20小时 |
| 图块种类 | 20种（Ch1解锁12种，每章递增） |
| 特殊图块 | 5种（cascade/light_chain/wave/pierce/swap） |
| 场外辅助 | 3种（重排/预判/续关，均消耗沙滩币） |
| 章节解锁机制 | 每章引入新障碍 + 新特殊图块 |

### 章节概览

| 章节 | 主题 | 季节 | 棋盘 | 新障碍 | 新特殊图块 |
|------|------|------|------|--------|-----------|
| Ch1 | 海边码头（漁港） | 春 | 8×8矩形 | — | cascade（连锁） |
| Ch2 | 中央小镇 | 夏 | 8×8→9×9矩形 | 冰封块、杂草 | light_chain（光链） |
| Ch3 | 花田山坡 | 秋 | 8×8异形 | 锁链、传送门 | wave（光波） |
| Ch4 | 森林露营地 | 冬 | 8×8异形 | 单路径通道、木箱 | pierce（穿透） |
| Ch5 | 温泉山谷 | 春② | 9×9异形 | 水流 | swap（置换） |
| Ch6 | 夜晚灯塔 | 夏② | 10×10异形 | 扩散藤蔓/苔藓 | — |

---

## 四、美术影响要求

### 视觉系统

**日夜三段：**
- 白天（06:00–18:00）: 暖白/自然光，饱和度标准
- 黄昏（18:00–21:00）: 暖橙色调，阴影拉长（叙事关键时刻）
- 夜晚（21:00–06:00）: 深蓝/靛蓝，低饱和度，灯台光柱为主光源

**四季视觉：**
- 春（Ch1/Ch5）: 樱花粉，清新
- 夏（Ch2/Ch6）: 翠绿饱满，蓝天高对比
- 秋（Ch3）: 暖橙金色，秋叶渐变
- 冬（Ch4）: 冷白雪景，温泉蒸汽，灯台雪雾光晕（核心视觉诉求）

**修复进度色彩规则：**
- 修复前：灰白色调，低饱和度
- 每次修复：饱和度上升一阶
- Ch6点灯后：最高饱和度，全岛焕然一新

### 美术资产清单

| 类型 | 数量 | 状态 |
|------|------|------|
| 图块（20种×6章变体）| 120个PNG | spec_complete，待生成 |
| 角色（7个，dragonbones层片动画）| 7组 | spec_ready，待生成 |
| 背景场景（18个，parallax多层）| 18组 | spec_ready，待生成 |
| UI资产 | 30个 | spec_ready，待生成 |
| VFX（含10个季节粒子）| 37个 | spec_ready，待生成 |

**详细规格参见：**
- `.allforai/game-design/systems/tile-art-spec.json`
- `.allforai/game-design/systems/character-art-spec.json`
- `.allforai/game-design/systems/environment-art-spec.json`
- `.allforai/game-design/systems/ui-art-spec.json`
- `.allforai/game-design/systems/vfx-asset-spec.json`

### Runtime ID要求

所有程序节点引用art资产时必须通过 `.allforai/game-runtime/art/engine-ready-art-manifest.json` 中的 `runtime_id` 字段，**不得hardcode原始文件路径**。

---

## 五、音频影响要求

**音频风格：** acoustic + ambient + light electronic；动物森友会治愈调性

**关键音频系统：**
- Combo音频系统：6档递进（sfx_tile_connect → sfx_combo_lv5），配合VFX同帧触发（±50ms）
- 日夜BGM系统：白天1.0x → 黄昏0.93x（8s过渡）→ 夜晚0.88x-2dB（12s过渡）
- 四季BGM叠加层：每章对应季节变奏
- 冬季专属SFX：sfx_winter_snow_fall（雪花落下loop）、sfx_onsen_steam_winter（温泉蒸汽loop）

**总音频资产：** 67个（含67+新增季节SFX）

**详细规格：** `.allforai/game-design/systems/audio-design.json`

---

## 六、程序开发影响要求

### 核心算法

| 算法 | 规格 |
|------|------|
| 路径匹配 | BFS，state=(x,y,last_dir,turns_used)，最大2转角 |
| 奇偶校验 | 每种图块数量为偶数，仅关卡生成时执行 |
| 传送门处理 | portal不增加转弯计数 |
| 连击计时器 | 2000ms窗口，特殊块激活不中断 |

### 后端接口

| 接口 | 用途 |
|------|------|
| Auth API | Apple ID / Google / Email+Password，JWT |
| SaveSync API | 云存档，email为主键 |
| HourglassAPI | 服务端计时，防时间作弊 |
| LevelProgressAPI | 180关进度持久化 |
| IAP服务 | Apple IAP + Google Billing收据验证 |

### 经济系统

- 单货币：沙滩币（beach_coins）
- 获取：IAP直购 + 沙漏免费领取（每4小时15沙滩币，月卡×2=30）
- 消费：续关30币、重排30币、预判10币
- 服务端余额权威，客户端仅展示

**详细接口：** `.allforai/game-design/design/program-development-node-handoff.json`

---

## 七、开放风险

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| 图片生成质量不达标 | 美术阻塞 | art-qa节点人工审核所有生成图片；低分重生 |
| engine import验证推迟 | 程序阻塞 | 推至implement-puzzle-core后执行headless导入检查 |
| IAP收据验证合规性 | 法律/商业 | 后端服务端验证，参考Apple/Google最新收据验证API |
| 沙漏时间作弊 | 经济平衡 | 后端服务器时间戳权威，客户端不可信 |
| Ch6 10×10棋盘FPS | 体验 | VFX预算控制，粒子数量上限；目标设备测试 |

---

## 八、关键源文件索引

| 文档 | 路径 |
|------|------|
| 综合设计文档 | `.allforai/game-design/game-design-doc.json` |
| 美术移交包 | `.allforai/game-design/design/art-input-handoff.json` |
| 程序开发接口 | `.allforai/game-design/design/program-development-node-handoff.json` |
| 产品概念基准 | `.allforai/product-concept/concept-baseline.json` |
| 核心机制 | `.allforai/game-design/systems/core-mechanics.json` |
| 变现设计 | `.allforai/game-design/systems/monetization-design.json` |
| 关卡设计 | `.allforai/game-design/systems/level-design.json` |
| 数值曲线 | `.allforai/game-design/systems/progression-curve.json` |
| 音频设计 | `.allforai/game-design/systems/audio-design.json` |
| 美术规格（图块） | `.allforai/game-design/systems/tile-art-spec.json` |
| 美术规格（角色） | `.allforai/game-design/systems/character-art-spec.json` |
| 美术规格（环境） | `.allforai/game-design/systems/environment-art-spec.json` |
| 美术规格（UI） | `.allforai/game-design/systems/ui-art-spec.json` |
| 美术规格（VFX） | `.allforai/game-design/systems/vfx-asset-spec.json` |
| Engine-ready manifest | `.allforai/game-runtime/art/engine-ready-art-manifest.json` |
| 审批记录 | `.allforai/game-design/approval-records.json` |

---

*本文档由 game-design-finalize 节点自动生成。所有内容均源自已审批的系统JSON文件，不引入未经记录的设计决策。*
