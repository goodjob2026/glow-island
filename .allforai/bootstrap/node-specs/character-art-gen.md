---
node: character-art-gen
discipline_owner: character-modeler
discipline_reviewers: [art-director]
human_gate: true
blocked_by: [art-spec-design]
unlocks: [art-qa]
exit_artifacts:
  - game-client/assets/resources/sprites/characters/npc_kenzo_default.png
  - game-client/assets/resources/sprites/characters/hinata_default.png
---

# Task: 角色美术生成（Character Art Generation）

## Context Pull
- 读取 `.allforai/game-design/art-pipeline-config.json`（若存在且 status=final）：
  - `character.rig`：
    - `frame_sequence` → 生成每个角色的多帧序列参考图（含关键帧标注）
    - `spine_lite` 或 `spine_full` → 生成骨骼分层参考图（头部/躯干/四肢分层，含 bone 标注）
    - 缺失 → 默认 `frame_sequence`
  - `character.expressions`：`true` 则生成 default/happy/serious 3 种表情，`false` 仅 default
  - `character.bone_limit`：骨骼数限制，写入资产规格说明
- 读取 `.allforai/game-design/systems/art-asset-inventory.json` — category=character 条目
- 读取 `.allforai/game-design/systems/character-arc.json` — 角色外貌描述、性格关键词
- 读取 `art-direction-v2.html` — 角色设计规范（比例、眼睛大小、轮廓风格）

## 样本策略（Sample Strategy）

**每次执行生成样本集，不生成全部表情变体。**

### 必须生成（每次执行）
- **主角 律（Ritsu）** default 表情 × 1
- **ひなた（Hinata）** default 表情 × 1
- **任意 1 个 NPC** default 表情 × 1

共 **3 张**，覆盖主角 + 重要配角 + NPC 三个层级，供 art-director 确认风格统一性。

### 可选生成（样本审批通过后）
- 律 happy + serious（+2）
- ひなた happy + serious（+2）
- 剩余 4 NPC default（+4）
- 各 NPC happy + serious（+8）

### 跳过（gold milestone）
- 律 / ひなた 全身立绘（需更高分辨率和构图控制）

## Prompt 构造规则

```
final_prompt = style_prompt_prefix
             + ", " + character.description
             + ", " + expression_suffix[expression]
             + ", transparent background, portrait crop"

expression_suffix:
  default  → "neutral calm expression, gentle eyes"
  happy    → "warm smile, eyes curved with joy"
  serious  → "thoughtful focused gaze, slight frown"
```

角色描述从 character-arc.json 的 `characters[].appearance` 字段读取。

## 工具优先级
1. `flux_generate_image` (portrait_4_3, 768×1024)
2. `generate_image` (3:4)
3. 降级：保持 placeholder

## 状态回写
同 tile-art-gen，更新 art-asset-inventory.json 对应 character 条目。

## 已知问题（需在本节点解决）
- inventory 角色 ID（npc_ahai 等）与 character-arc-design 命名（npc_kenzo 等）不一致
- 本节点执行时：**以 character-arc.json 的角色名为准**，同步更新 inventory 的 asset_id

## HTML 输出
`character-art-review.html` — 角色卡片展示（姓名、表情标注、风格符合度自评）
