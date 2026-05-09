---
node: vfx-art-gen
discipline_owner: vfx-artist
discipline_reviewers: [art-director, technical-artist]
human_gate: true
blocked_by: [art-spec-design]
unlocks: [art-qa]
exit_artifacts:
  - .allforai/game-design/systems/vfx-asset-spec.json
---

# Task: 特效美术规格生成（VFX Art Generation）

## Context Pull
- 读取 `art-asset-inventory.json` — category=vfx 条目（8 个 Spine 动画）
- 读取 `art-direction-v2.html` — 动画风格参数（动森弹跳曲线）
- 读取 `systems/audio-design.json` — SFX 与 VFX 配合时序

## 重要说明

VFX 资产为 Spine 骨骼动画或 PNG 帧序列，**无法直接由 FLUX/Imagen 生成完整资产**。
本节点的职责是：
1. 生成每个 VFX 的**关键帧参考图**（AI 生图，供动画师参考）
2. 输出完整的 `vfx-asset-spec.json`（Spine 制作规格书）
3. 生成一个代表性 VFX 的**PNG 帧序列样本**（`fx_tile_disappear` 消除特效）

## 样本策略（Sample Strategy）

### 必须生成（每次执行）

**关键帧参考图（AI 生图）：**
- `fx_tile_disappear` — 消除特效关键帧 × 3（起始/中间/消失）
- `fx_combo_popup` — 连击弹出特效关键帧 × 2（弹出/消散）

共 **5 张参考图**，供动画师感知风格。

**PNG 帧样本（程序化）：**
- 基于 `fx_tile_disappear` 规格，生成 `assets/effects/frames/fx_tile_disappear_f01.png`
  作为帧序列占位（纯色块，展示尺寸和裁切规范）

### 可选生成（审批后）
- `fx_area_restore`、`fx_firefly_chain` 等关键帧参考图
- 完整 Spine 工程文件（需 Spine 软件和 technical-artist 配合，gold milestone）

## vfx-asset-spec.json 输出规格

```json
{
  "spec_version": "1.0",
  "vfx_assets": [
    {
      "asset_id": "fx_tile_disappear",
      "type": "png_sequence",
      "frame_count": 12,
      "frame_size": "128x128",
      "fps": 24,
      "loop": false,
      "color_palette": ["#7EC8E3", "#FFFFFF", "#F0F8FF"],
      "animation_curve": "ease-out cubic (动森弹跳)",
      "keyframes": [
        { "frame": 1, "desc": "tile normal size, full opacity" },
        { "frame": 4, "desc": "scale 1.3x squash" },
        { "frame": 8, "desc": "scale 0.5x collapse" },
        { "frame": 12, "desc": "opacity 0, particle scatter" }
      ],
      "spine_bones": [],
      "reference_images": ["<AI 生成的参考图路径>"],
      "status": "spec_ready_pending_production"
    }
  ]
}
```

## 工具优先级
- 参考图生成：`flux_generate_image` (square) → `generate_image` (1:1)
- 帧序列：程序化（Python PIL / canvas，不调用 AI 生图）

## HTML 输出
`vfx-art-review.html` — 每个 VFX 的关键帧参考图 + Spine 规格摘要 + 制作工时估算，
供 technical-artist 评估 Spine 制作可行性，vfx-artist 确认风格方向。
