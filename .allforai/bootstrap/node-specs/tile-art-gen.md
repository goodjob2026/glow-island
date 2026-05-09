---
node: tile-art-gen
discipline_owner: concept-artist
discipline_reviewers: [art-director]
human_gate: true
blocked_by: [art-spec-design]
unlocks: [art-qa]
exit_artifacts:
  - game-client/assets/resources/sprites/tiles/tile_01.png
  - game-client/assets/resources/sprites/tiles/special/special_bomb.png
---

# Task: 图块美术生成（Tile Art Generation）

## Context Pull
- 读取 `.allforai/game-design/systems/art-asset-inventory.json` — category=tile + tile_special 条目
- 读取 `.allforai/game-design/art-style-guide.json`（若存在）或 `art-direction-v2.html` 提取 style_prompt_prefix
- 读取 `art-tokens.json` 获取章节配色

## 样本策略（Sample Strategy）

**不生成全部，生成有代表性的样本供人工感知和审批。**

### 必须生成（每次执行）
- 每章节选 **1 个** 代表性基础图块 → 共 6 张（验证章节配色）
- 全部 4 个特殊块 → 4 张（bomb / windmill / light / wave，验证功能可识别性）

### 可选生成（art-director 确认样本通过后触发）
- 剩余 14 个基础图块（补全 t01–t20）
- 各图块 highlighted 状态（可程序化着色处理，优先级低）

### 跳过（gold milestone）
- 消除动画帧序列（disappear_01–12）→ 需 Spine 或序列帧工具

## Prompt 构造规则

```
final_prompt = style_prompt_prefix
             + ", " + asset.theme
             + ", " + asset.primary_color + " dominant color"
             + ", Animal Crossing style icon, 128x128, white background"
```

`style_prompt_prefix` 从 art-style-guide.json 读取；若文件不存在则使用：
> "Animal Crossing style, rounded soft shapes, warm pastel colors, Japanese island theme, clean edges"

## 工具优先级
1. `mcp__plugin_meta-skill_ai-gateway__flux_generate_image` (FLUX Pro, square)
2. `mcp__plugin_meta-skill_ai-gateway__generate_image` (Imagen 4, 1:1)
3. 降级：保持 placeholder，写 `ai_generatable: true`

## 状态回写（art-asset-inventory.json）
每张成功生成的图块：
```json
{
  "current_state": "temp",
  "ai_generated": { "attempted": true, "success": true, "path": "<实际路径>" },
  "substitution": { "temp": "<实际路径>" }
}
```
失败则：`attempted: true, success: false, current_state` 保持 `placeholder`

## HTML 输出
`tile-art-review.html` — 网格展示所有已生成图块（含样本标注和待生成条目灰显），
供 concept-artist 提交、art-director 审批。

## 完成条件
- 10 张图块已生成（6 章节代表 + 4 特殊块）
- HTML 报告包含每张图的 prompt、生成工具、asset_id 对照
