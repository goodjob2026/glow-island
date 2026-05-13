# Glow Island 美术资产验收标准

> 版本：1.0 | 生成时间：2026-05-13 | 技能：game-art/20-spec/asset-acceptance-criteria

---

## 项目概况

| 字段 | 值 |
|---|---|
| 游戏类型 | Match-3 拼图 + 视觉小说叙事 |
| 视图模式 | board_grid（拼图棋盘）+ front-facing visual novel（对话） |
| 目标平台 | web-canvas-2d / mobile-web |
| 引擎 | Cocos Creator 3.x |
| 动画系统 | DragonBones + 帧动画 + Tween |
| 美术风格 | 手绘水彩，暖色调日式治愈海岛，Chibi比例，有机圆润形态，纸张纹理叠加 |

---

## 全局风格规则（所有资产通用）

### 必须满足
- 可见的手绘水彩笔触纹理
- 暖色调粉彩调色板（见 `visual-style-tokens.json` 色板）
- 描边：主色调降低32%亮度，**绝对禁止纯黑 #000000 描边**
- 圆润有机轮廓，禁止锐利几何直角
- 阴影：`0 4px 0 rgba(0,0,0,0.10)`，最大不透明度 15%
- 纸张纹理叠加（约 6% 透明度）

### 绝对禁止
- 像素画、超写实3D渲染、霓虹赛博朋克配色、金属铬渐变
- 纯黑 #000000
- 角色美术中烘焙文字标签
- 运动模糊、肢体裁剪
- 西方卡通风格

---

## 一、图块（Tileset）验收标准

**适用文件**：`.allforai/game-design/art/tilesets/tile_*.png`（25个文件）

### 1.1 普通图块（20个）

| 维度 | 标准 |
|---|---|
| **可读性尺寸** | 128×128px（棋盘格尺寸），64px，32px缩略图 |
| **区分度** | 20个图块并排时，任意两块不可被混淆；缩至32px后轮廓仍可识别 |
| **美术风格** | 手绘水彩，Ch1为s0饱和度（8-15%饱和，42-48%亮度）——画面去饱和但非灰度，保留暖色底调 |
| **构图** | 主体居中；8px出血区不得溢出；背景透明或中性；无穿越图块边界的阴影 |
| **描边** | 主色调降低32%，无纯黑 |
| **背景** | 透明PNG |

### 1.2 特殊战术图块（5个）

| 图块ID | 必须有的标识物 | 颜色标识 |
|---|---|---|
| tile_wave_block | 同心圆波纹图案 | 蓝绿 #7ECDE8 |
| tile_light_chain_block | 金色链条连接线图案 | 樱花粉 #F0C4C4 + 金色 #F5C842 |
| tile_pierce_block | 单向方向箭头（唯一有方向指示的图块） | 橙色 #F5A840 |
| tile_swap_block | 双向交换箭头 | 金黄色 #F5C842 底色 |
| tile_cascade_block | 序列点/步骤点链式图案 | 森林绿 #4A6D9A |

**关键规则**：任何特殊图块的标识物不得出现在普通图块上

### 1.3 阻断缺陷码

| 缺陷码 | 描述 |
|---|---|
| `TILE_IDENTICAL_SILHOUETTE` | 两个普通图块轮廓无法区分 |
| `TILE_SPECIAL_MARKER_ABSENT` | 特殊图块缺少必须的机制标识物 |
| `TILE_SPECIAL_MARKER_SHARED` | 特殊图块标识物出现在普通图块上 |
| `TILE_SUBJECT_CROPPED` | 主体超出出血区被裁剪 |
| `TILE_PHOTOREALISTIC` | 图块呈现超写实渲染风格 |
| `TILE_DIMENSION_WRONG` | 图块尺寸不符（应为128×128px或2x 256×256px） |

---

## 二、角色表情（Character Expressions）验收标准

**适用文件**：`.allforai/game-design/art/expressions/char_*_expr_*.png`（35个文件，7角色×5表情）

### 2.1 身份一致性

| 角色 | 必须可见的标识特征 | 签名色 |
|---|---|---|
| char_ritsu（律） | 略显凌乱的黑发，卷袖衬衫，偏中性休闲 | — （暖米色） |
| char_hinata（ひなた） | 樱花粉系服装，常携笔记本（至少暗示） | #F0C4C4 |
| char_kenzo（健三） | 渔夫背心，灰白稀疏头发，风化皱纹面孔，壮硕身型 | #4A6D9A |
| char_umeko（梅子） | 竹绿围裙，发髻，轻微前倾姿势 | #7DBE77 |
| char_natsuka（夏帆） | 深绿户外马甲，风中乱发，略倾头 | #3D6645 |
| char_fuyuko（冬子） | 夜蓝和服式上衣，整洁盘发（白/灰），挺拔姿态 | #2A4060 |
| char_gicho（猫议长） | 橘色虎斑猫，深藏青 #2A3650 领圈，端坐 | #2A3650 |

### 2.2 表情可读性

| 表情 | 必须清晰传达的视觉信号 |
|---|---|
| default | 中性放松，不带明显情绪 |
| happy | 可见微笑/上扬眼角，明显愉悦感 |
| thinking | 头部倾斜 或 手指触腮 或 皱眉沉思 |
| surprised | 睁大眼睛 + 张嘴 或 眉毛上挑 |
| react_jump | 全身动态反应感（跳起/激动），即使是半身构图也需传达能量感 |

### 2.3 阻断缺陷码

| 缺陷码 | 描述 |
|---|---|
| `EXPR_IDENTITY_DRIFT` | 同角色不同表情看起来像不同人物 |
| `EXPR_EMOTION_AMBIGUOUS` | 两种不同表情无法区分 |
| `EXPR_WRONG_CHAR` | 角色不符合预期身份标识 |
| `EXPR_STYLE_BREAK` | 超写实/霓虹/非水彩风格渲染 |

---

## 三、角色立绘（Portraits）验收标准

**适用文件**：`.allforai/game-design/art/portraits/char_*_portrait_*.png`（10个文件）

### 3.1 构图要求

- **必须显示**：脸部 + 肩部（面部占画面高度至少50%）
- 面部水平居中
- 头顶不得裁剪
- 肩部在画面底部可见
- 视角：正面或轻微3/4侧面，不得有极端透视

### 3.2 技术备注

当前发现维度不一致：`char_fuyuko_portrait_react_jump.png` 和 `char_hinata_portrait_happy.png` 为 512×512px，其余均为 1024×1024px。需Codex确认此尺寸差异是否影响视觉裁剪效果。

### 3.3 阻断缺陷码

| 缺陷码 | 描述 |
|---|---|
| `PORTRAIT_FACE_CROPPED` | 脸部在顶部或侧面被裁剪 |
| `PORTRAIT_IDENTITY_MISMATCH` | 立绘角色与预期不符 |

---

## 四、帧动画（char_gicho Frame Animation）验收标准

**适用文件**：`.allforai/game-design/art/char_gicho/char_gicho_*.png`（15帧）

### 4.1 动画集要求

| 动画集 | 帧数 | 必须验证 |
|---|---|---|
| idle | 4帧 (f01-f04) | f04与f01之间无明显跳帧（循环闭合）；呼吸起伏感可见 |
| happy | 4帧 (f01-f04) | 可见愉悦感/弹跳动态，与idle明显不同 |
| wave | 4帧 (f01-f04) | 爪子/手臂挥手弧线运动在4帧中清晰推进 |
| surprised | 3帧 (f01-f03) | 惊讶反应升级感，眼睛睁大，身体反应 |

### 4.2 猫咪身份一致性

所有15帧中，以下必须保持一致：
- 橘色虎斑毛色
- 深藏青 #2A3650 领圈
- 圆润猫咪身体比例
- 端坐基本姿态（idle/happy）

### 4.3 阻断缺陷码

| 缺陷码 | 描述 |
|---|---|
| `ANIM_LOOP_BREAK` | idle f04→f01循环有明显跳帧 |
| `ANIM_IDENTITY_DRIFT` | 猫的外观在不同帧之间不一致 |
| `ANIM_MOTION_ABSENT` | wave动画中无可见的爪子/手臂运动 |

---

## 证据要求总结

| 资产族 | 所需视觉证据 |
|---|---|
| 图块（25个） | 5×4普通图块联系表（128px）；1×5特殊图块联系表 |
| 角色表情（35个） | 每角色1×5表情联系条（7条） |
| 立绘（10个） | 全部10张立绘联系表 |
| 帧动画（15帧） | 每动画集一条帧序列联系条（4条动画集） |

---

*本文档与 `asset-acceptance-criteria.json` 同步。Codex CLI视觉审查应参阅本文档中对应资产族的标准。*
