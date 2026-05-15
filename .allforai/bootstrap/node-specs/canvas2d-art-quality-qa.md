---
node_id: canvas2d-art-quality-qa
node: canvas2d-art-quality-qa
goal: "游戏画面质量深度评估：资产真实性、视觉一致性、动画流畅度、移动端适配"
capability: canvas2d-engineer
human_gate: false
hard_blocked_by:
  - canvas2d-visual-qa
exit_artifacts:
  - "canvas2d-client/www/qa/art-quality-report.json"
  - "canvas2d-client/www/qa/art-quality/island_map_saturation_check.png"
  - "canvas2d-client/www/qa/art-quality/gameplay_tile_clarity.png"
  - "canvas2d-client/www/qa/art-quality/combo_fever_effect.png"
  - "canvas2d-client/www/qa/art-quality/mobile_375_layout.png"
  - "canvas2d-client/www/qa/art-quality/mobile_428_layout.png"
  - "canvas2d-client/www/qa/art-quality/ch1_boat_shape.png"
  - "canvas2d-client/www/qa/art-quality/ch2_vase_hollow.png"
  - "canvas2d-client/www/qa/art-quality/ch3_flower_petals.png"
  - "canvas2d-client/www/qa/art-quality/ch4_tree_shape.png"
  - "canvas2d-client/www/qa/art-quality/ch5_drop_hollow.png"
  - "canvas2d-client/www/qa/art-quality/ch6_lighthouse_complex.png"
---

# canvas2d-art-quality-qa

## Mission

不只验证"有画面"，而是系统评估游戏画面质量：资产真实性、风格一致性、动画反馈质量、移动端多分辨率适配。

## 1. 资产真实性验证

检查所有背景图和图块是否为真实美术资产（非空白/占位）：

```bash
# 验证每个PNG不是全白/全黑/空白
for f in canvas2d-client/www/assets/backgrounds/*.png; do
  python3 -c "
from PIL import Image
img = Image.open('$f').convert('RGB')
colors = set(img.getdata())
print('$f', len(colors), 'unique_colors', 'FAIL' if len(colors) < 50 else 'PASS')
"
done
```

判断标准：每张PNG的唯一色数 ≥ 50（真实照片/插画级别）

## 2. 视觉风格一致性检查（截图感知评估）

用 Playwright 截取关键画面，用 AI 感知判断视觉一致性：

```
截图清单（共5张）：
① island_map_saturation_check.png
   - 验证：Ch1节点彩色、Ch6节点灰白，有明显饱和度梯度
   - 不合格：所有节点颜色相同

② gameplay_tile_clarity.png  
   - 验证：图块大小合适（≥60px）、5种类型视觉可区分（颜色/形状不同）
   - 不合格：图块太小(<40px)或颜色过于相似

③ combo_fever_effect.png
   - 验证：Combo×4时屏幕有发光/金色边缘特效，"FEVER!"文字可见
   - 不合格：无视觉区分（Combo×4和×1画面一样）

④ mobile_375_layout.png（iPhone SE宽度375px）
   - 验证：棋盘居中，无元素超出屏幕，HUD可读

⑤ mobile_428_layout.png（iPhone 14 Plus宽度428px）
   - 验证：棋盘填充合理，不留过多空白
```

## 3. 动画流畅度评估

在 Playwright 中录制10帧连续截图，分析帧间差：

```
GameplayScene 中触发消除动画 → 连续截图10帧（间隔50ms）
→ 分析：消除帧序列中至少有3帧有中间状态（alpha渐变）
→ 验证：不是"突然消失"（单帧跳变）
```

| 动画类型 | 最低帧数要求 | 预期时长 |
|---------|------------|---------|
| 图块消除（淡出） | ≥3帧中间态 | 300-500ms |
| 选中高亮（脉冲） | 持续可见，非静止 | 无限循环 |
| Combo数字出现 | ≥2帧缩放态 | 200-400ms |
| 结算星星出现 | ≥3帧动画 | 500ms |

## 4. 移动端多分辨率适配

测试以下5种视口尺寸，验证无布局破坏：

| 设备 | 宽×高 | 测试重点 |
|------|-------|---------|
| iPhone SE | 375×667 | 最小屏，棋盘是否完整 |
| iPhone 14 Pro | 414×896 | 标准目标机型 |
| iPhone 14 Plus | 428×926 | 宽屏，留白是否合理 |
| Android 360px | 360×800 | 常见Android宽度 |
| iPad mini | 768×1024 | 平板，棋盘是否居中+适当缩放 |

每种视口截一张图（共5张），验证：
- 棋盘不超出屏幕
- HUD文字可读（字号≥14px等效）
- 按钮可点击区域≥44×44px

## 5. 异形棋盘视觉质量

截取每章至少1种异形关卡的棋盘截图（共6张），验证：

| 截图 | 验证要点 |
|------|---------|
| ch1_boat_shape.png | 船形轮廓清晰，两侧 `_` 区域为背景色（非图块色） |
| ch2_vase_hollow.png | 罐形镂空区域明显，颈部变窄可辨 |
| ch3_flower_petals.png | 五瓣分区清晰，花瓣间隙可见 |
| ch4_tree_shape.png | 树形轮廓，底部树干瓶颈明显 |
| ch5_drop_hollow.png | 中心空洞显眼，外环图块整齐 |
| ch6_lighthouse_complex.png | 灯室最窄处（3格）可辨，底座拱门镂空可见 |

判断标准：非活跃格区域颜色与活跃格有明显视觉区分（背景色 vs. 图块底色），
棋盘整体在屏幕中居中，不超出 HUD 和底部操作区。

## 6. 颜色与对比度（无障碍基础）

- HUD文字（分数/步数）与背景对比度 ≥ 4.5:1
- 图块类型5种颜色对色盲用户可区分（至少形状辅助区分）

## 报告格式

```json
{
  "run_at": "...",
  "sections": {
    "asset_authenticity": {
      "backgrounds_checked": 18,
      "tiles_checked": 30,
      "fail_list": [],
      "pass": true
    },
    "visual_consistency": {
      "island_saturation_gradient": "pass",
      "tile_clarity": "pass",
      "combo_fever_visible": "pass"
    },
    "animation_smoothness": {
      "vanish_intermediate_frames": 4,
      "selection_pulse_active": true,
      "overall": "pass"
    },
    "responsive_layout": {
      "375x667": "pass",
      "414x896": "pass",
      "428x926": "pass",
      "360x800": "pass",
      "768x1024": "pass"
    },
    "accessibility_basic": {
      "hud_contrast_ratio": 5.8,
      "tile_shape_distinct": true,
      "overall": "pass"
    }
  },
  "screenshots": ["island_map_saturation_check.png", "..."],
  "overall": "pass|fail",
  "blockers": []
}
```

## 验收标准

1. `art-quality-report.json` overall = "pass"
2. 所有背景PNG唯一色数≥50（真实资产，非占位）
3. island_map_saturation_check.png 中Ch1与Ch6有可量化饱和度差异（HSL S值差≥30%）
4. 消除动画有≥3帧中间状态（不是单帧跳变）
5. 5种视口宽度下棋盘完整不截断，非活跃格区域为背景色
6. 异形棋盘6章各1张截图，形状轮廓可辨
7. HUD对比度≥4.5:1
