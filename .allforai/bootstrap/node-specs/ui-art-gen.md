---
node: ui-art-gen
discipline_owner: ui-artist
discipline_reviewers: [art-director, ux-designer]
human_gate: true
blocked_by: [art-spec-design]
unlocks: [art-qa]
exit_artifacts:
  - game-client/assets/resources/sprites/ui/ic_home@2x.png
  - game-client/assets/resources/sprites/ui/ic_star_full@2x.png
---

# Task: UI 美术生成（UI Art Generation）

## Context Pull
- 读取 `.allforai/game-design/art-pipeline-config.json`（若存在且 status=final）：
  - `style`：
    - `pixel` → 简单几何图标优先程序化 SVG + 像素化后处理；复杂图标 AI 生图后降采样
    - `vector` → 全部优先 SVG 直接生成，仅质感类图标调用 AI 生图
    - 其他（cartoon/realistic/hand_drawn）→ 沿用现有 flux→generate_image 工具优先级
  - `toolchain.aseprite_available`：`true` 时像素图标后处理可用 Aseprite CLI，否则用 Python PIL
  - 缺失 → 使用现有工具优先级
- 读取 `sprites/ui/ui-asset-manifest.json` — 30 个图标完整规格
- 读取 `art-direction-v2.html` — UI 视觉语言（圆角、描边、颜色规范）
- 读取 `art-tokens.json` — 颜色系统，验证图标颜色符合 token

## 样本策略（Sample Strategy）

**每个类别取 1–2 个代表性图标，共生成约 8 张样本。**

### 必须生成（每次执行）
按类别各取最高频使用的图标：

| 类别 | 生成目标 | 原因 |
|------|---------|------|
| navigation | `ic_home`, `ic_back_arrow` | 出现频率最高 |
| booster | `ic_hint`, `ic_shuffle` | 游戏内最常见道具 |
| currency | `ic_currency_beach_coin`, `ic_currency_glowstone` | HUD 核心元素 |
| progress | `ic_star_full`, `ic_lock` | 关卡选择核心状态 |

共 **8 张**，覆盖所有类别，供 ux-designer 验证可读性，art-director 验证风格。

### 可选生成（双重审批通过后）
- 剩余 22 个图标（ic_close, ic_menu, ic_info, ic_check, ic_map, ic_add_steps,
  ic_item_bomb/lightning/rainbow, ic_material_*, ic_star_empty/half,
  ic_progress_cap, ic_glow_energy, ic_share, ic_milestone_flag,
  ic_sound_on/off）

### SVG 源文件
纯矢量图标（home, close, check 等简单形状）优先手工或程序化生成 SVG，
而非 AI 生图。AI 生图适合质感类图标（货币、道具）。

## Prompt 构造规则

```
final_prompt = "Mobile game UI icon, " + asset.description_cn
             + ", flat line-fill hybrid design, rounded corners"
             + ", " + asset.default_color + " dominant"
             + ", Animal Crossing aesthetic, white background, 512x512"
```

## 工具优先级
1. `flux_generate_image` (square, 512×512) — 质感类图标（货币、道具）
2. `generate_image` (1:1) — 功能类图标（导航、状态）
3. 降级：程序化生成 SVG 占位（纯几何形状图标）

## 状态回写
更新 art-asset-inventory.json 的 ui_* 条目，并在 `ai_generated` 中
记录每个图标的实际文件路径（ui 类目当前为目录级聚合，需拆分为图标级追踪）。

## HTML 输出
`ui-art-review.html` — 图标网格展示，4×2 规格卡（图标 + ID + 颜色值 + 使用场景），
供 ux-designer 验证对比度和识别度。
