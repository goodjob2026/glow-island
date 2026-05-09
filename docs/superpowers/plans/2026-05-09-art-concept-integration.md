# Art Concept Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the newly created art-concept skill into the meta-skill plugin's game design pipeline, and update glow-island's existing art-gen node-specs to consume art-pipeline-config.json.

**Architecture:** Three integration points: (1) gaming.md documents the art_overview output contract for art-direction; (2) game-design.md capability registers art-concept in the canonical node registry + bootstrap.md injects it into game workflows; (3) existing art-gen node-specs for glow-island gain a Context Pull entry that reads art-pipeline-config.json to adapt their behavior.

**Tech Stack:** Markdown files only — no code, no tests. Changes are in the meta-skill plugin (`~/.claude/plugins/cache/myskills/meta-skill/0.8.0/`) and glow-island project (`.allforai/bootstrap/node-specs/`).

---

## File Map

Files to **modify** (no new files):

| File | What changes |
|------|-------------|
| `~/.claude/plugins/cache/myskills/meta-skill/0.8.0/knowledge/domains/gaming.md` | art-direction section: output declaration updated to include art-style-guide.json with art_overview schema |
| `~/.claude/plugins/cache/myskills/meta-skill/0.8.0/knowledge/capabilities/game-design.md` | Canonical Node Registry: add art-concept row between art-direction and art-spec-design |
| `~/.claude/plugins/cache/myskills/meta-skill/0.8.0/skills/bootstrap.md` | Game node injection §3.1: add Art Concept Node Injection rule |
| `.allforai/bootstrap/node-specs/tile-art-gen.md` | Context Pull: add art-pipeline-config.json read + tileset field usage |
| `.allforai/bootstrap/node-specs/character-art-gen.md` | Context Pull: add art-pipeline-config.json read + character.rig field usage |
| `.allforai/bootstrap/node-specs/environment-art-gen.md` | Context Pull: add art-pipeline-config.json read + environment.parallax_layers usage |
| `.allforai/bootstrap/node-specs/ui-art-gen.md` | Context Pull: add art-pipeline-config.json read + style/toolchain usage |
| `.allforai/bootstrap/node-specs/vfx-art-gen.md` | Context Pull: add art-pipeline-config.json read + vfx.approach usage |

Plugin root alias used below: `PLUGIN=~/.claude/plugins/cache/myskills/meta-skill/0.8.0`

---

## Task 1: gaming.md — Update art-direction Output Declaration

**Files:**
- Modify: `$PLUGIN/knowledge/domains/gaming.md` (art-direction section, around line 190)

- [ ] **Step 1: Read the current art-direction section**

Run:
```bash
grep -n "art-direction\|输出：\|art-tokens\|art-direction.md" ~/.claude/plugins/cache/myskills/meta-skill/0.8.0/knowledge/domains/gaming.md
```
Expected: Lines around 190–204 showing the art-direction table and old `**输出：** \`art-direction.md\`、\`art-tokens.json\``

- [ ] **Step 2: Replace the output declaration line**

Find this exact text in `$PLUGIN/knowledge/domains/gaming.md`:
```
**输出：** `art-direction.md`、`art-tokens.json`
```

Replace with:
```
**输出：** `art-style-guide.json`（必含 `art_overview` 字段）、`art-tokens.json`

`art_overview` 为必填字段，缺少将阻塞下游 art-concept skill 执行：
```json
{
  "dimension": "2d",           // "2d" | "3d" | "2.5d"
  "style": "cartoon",          // "cartoon" | "pixel" | "realistic" | "hand_drawn" | "vector"
  "animation_system": "spine", // "frame" | "spine" | "3d_skeletal" | "mixed"
  "notes": "<一句话说明选择理由>"
}
```

**下一步（自动触发）：** art-concept skill — 基于 art_overview 问答确认技术规格，产出 `art-pipeline-config.json`。
```

- [ ] **Step 3: Verify the edit looks correct**

Run:
```bash
grep -A 20 "art-direction（美术风格）" ~/.claude/plugins/cache/myskills/meta-skill/0.8.0/knowledge/domains/gaming.md | tail -15
```
Expected: Output declaration now shows art-style-guide.json + art_overview block + downstream note.

- [ ] **Step 4: Commit checkpoint**

```bash
cd /Users/aa/workspace/glow-island
git add -A
git commit -m "docs: note art_overview output contract in gaming.md art-direction section"
```

---

## Task 2: game-design.md — Add art-concept to Canonical Node Registry

**Files:**
- Modify: `$PLUGIN/knowledge/capabilities/game-design.md` (Canonical Node Registry table, after art-direction row ~line 222)

- [ ] **Step 1: Read the registry table around art-direction row**

Run:
```bash
grep -n "art-direction\|art-spec-design\|art-concept" ~/.claude/plugins/cache/myskills/meta-skill/0.8.0/knowledge/capabilities/game-design.md | head -20
```
Expected: art-direction at ~line 222, art-spec-design at ~line 223, no art-concept row between them.

- [ ] **Step 2: Insert art-concept row after art-direction in the registry table**

Find this exact text in `$PLUGIN/knowledge/capabilities/game-design.md`:
```
| `art-direction` | `art-director` | `game-design/art-direction.html` | `game-design/art-style-guide.json` (含 art_overview 字段) | art-direction |
| `art-spec-design` | `concept-artist` | `game-design/art-spec-design.html` | `game-design/art-asset-inventory.json` | art-direction |
```

Replace with:
```
| `art-direction` | `art-director` | `game-design/art-direction.html` | `game-design/art-style-guide.json` (含 art_overview 字段) | art-direction |
| `art-concept` | _(skill — /run 自动调起，无 discipline_owner)_ | — | `game-design/art-pipeline-config.json` | art-direction |
| `art-spec-design` | `concept-artist` | `game-design/art-spec-design.html` | `game-design/art-asset-inventory.json` | art-direction |
```

- [ ] **Step 3: Verify the row was inserted correctly**

Run:
```bash
grep -n "art-direction\|art-concept\|art-spec-design" ~/.claude/plugins/cache/myskills/meta-skill/0.8.0/knowledge/capabilities/game-design.md | head -10
```
Expected: Three consecutive lines: art-direction, art-concept, art-spec-design (in order).

- [ ] **Step 4: Commit checkpoint**

```bash
cd /Users/aa/workspace/glow-island
git add -A
git commit -m "docs: add art-concept to game-design canonical node registry"
```

---

## Task 3: bootstrap.md — Add Art Concept Node Injection Rule

**Files:**
- Modify: `$PLUGIN/skills/bootstrap.md` (game injection §3.1, after step 4 around line 883)

The existing step 4 says: `All nodes get: capability: game-design, human_gate: true, ...`
We need to add a new numbered item **after item 4** (before item 5 "Initialise approval-records.json") that injects the art-concept node whenever art-direction is part of the game workflow.

- [ ] **Step 1: Read the exact context around game injection step 4-5**

Run:
```bash
grep -n "All nodes get\|Initialise.*approval-records\|art-concept\|art-direction" ~/.claude/plugins/cache/myskills/meta-skill/0.8.0/skills/bootstrap.md | head -20
```
Expected: Lines showing step 4 "All nodes get..." and step 5 "Initialise .allforai/game-design/approval-records.json".

- [ ] **Step 2: Find the exact text of steps 4 and 5 to anchor the insertion**

Read lines around the target area:
```bash
sed -n '880,890p' ~/.claude/plugins/cache/myskills/meta-skill/0.8.0/skills/bootstrap.md
```

- [ ] **Step 3: Insert the Art Concept Node Injection rule between steps 4 and 5**

Find this exact text in `$PLUGIN/skills/bootstrap.md`:
```
   - All nodes get: `capability: game-design`, `human_gate: true`, `approval_record_path: ".allforai/game-design/approval-records.json"`, `gate_status: "pending"`
5. Initialise `.allforai/game-design/approval-records.json` with one `pending` record per game-design node
```

Replace with:
```
   - All nodes get: `capability: game-design`, `human_gate: true`, `approval_record_path: ".allforai/game-design/approval-records.json"`, `gate_status: "pending"`

**Art Concept Node Injection (always applies when `art-direction` is in the selected workflow):**

After inserting the `art-direction` node, also insert an `art-concept` node immediately following it:
- `node_id: "art-concept"`, `capability: "art-concept-skill"`, `human_gate: false`
- `blocked_by: ["art-direction"]`; update `art-spec-design` to `blocked_by: ["art-concept"]` (remove `art-direction` from its blocked_by list)
- `unlocks: ["art-spec-design"]`
- **No approval-records entry** (art-concept is a skill invocation, not a human-reviewed document)
- **Node-spec content** for art-concept (write verbatim to `.allforai/bootstrap/node-specs/art-concept.md`):

```markdown
---
node: art-concept
human_gate: false
blocked_by: [art-direction]
unlocks: [art-spec-design]
exit_artifacts:
  - .allforai/game-design/art-pipeline-config.json
---

# Task: 美术技术规格确认（Art Concept Skill Invocation）

## 执行方法

读取并执行 `${CLAUDE_PLUGIN_ROOT}/skills/art-concept.md` skill。

该 skill 完成以下工作：
1. 验收 art-direction 输出（读取 art-style-guide.json.art_overview，3个字段）
2. 执行竞品美术研究（搜索驱动，内部使用）
3. 按维度分支（2D通用/2D像素/3D）进行 Q&A，逐问确认技术规格
4. 产出 `.allforai/game-design/art-pipeline-config.json`（status=final）

## 完成条件

`.allforai/game-design/art-pipeline-config.json` 存在且 `status == "final"`。
```

5. Initialise `.allforai/game-design/approval-records.json` with one `pending` record per game-design node
```

- [ ] **Step 4: Verify the injection rule was added correctly**

Run:
```bash
grep -n "Art Concept Node Injection\|art-concept-skill\|art-concept.*node" ~/.claude/plugins/cache/myskills/meta-skill/0.8.0/skills/bootstrap.md | head -10
```
Expected: Lines showing "Art Concept Node Injection" and "art-concept-skill" capability identifier.

- [ ] **Step 5: Commit checkpoint**

```bash
cd /Users/aa/workspace/glow-island
git add -A
git commit -m "docs: add art-concept node injection rule to bootstrap game workflow"
```

---

## Task 4: tile-art-gen.md — Add art-pipeline-config.json Context Pull

**Files:**
- Modify: `.allforai/bootstrap/node-specs/tile-art-gen.md`

Relevant config fields: `tileset.type`, `tileset.tile_size`, `style`, `pixel.*` (for pixel branch)

- [ ] **Step 1: Read the current Context Pull section**

Run:
```bash
head -20 /Users/aa/workspace/glow-island/.allforai/bootstrap/node-specs/tile-art-gen.md
```
Expected: Context Pull reads art-asset-inventory.json, art-style-guide.json, art-tokens.json.

- [ ] **Step 2: Add art-pipeline-config.json to Context Pull**

Find this exact text in `.allforai/bootstrap/node-specs/tile-art-gen.md`:
```
## Context Pull
- 读取 `.allforai/game-design/systems/art-asset-inventory.json` — category=tile + tile_special 条目
- 读取 `.allforai/game-design/art-style-guide.json`（若存在）或 `art-direction-v2.html` 提取 style_prompt_prefix
- 读取 `art-tokens.json` 获取章节配色
```

Replace with:
```
## Context Pull
- 读取 `.allforai/game-design/art-pipeline-config.json`（若存在且 status=final）：
  - `tileset.type`：`grid`→正交生图，`isometric`→等距斜视生图，缺失默认 `grid`
  - `tileset.tile_size`：覆盖默认 128px（如 64、32）
  - `style`：若为 `pixel`，激活像素化后处理管道（AI 生高清 → PIL NEAREST 降采样 → pngquant）
  - `pixel.tile_resolution`：像素风 tile 目标分辨率（如 `32x32`）
  - `pixel.palette_size`：调色板颜色数（如 32），传给 pngquant
- 读取 `.allforai/game-design/systems/art-asset-inventory.json` — category=tile + tile_special 条目
- 读取 `.allforai/game-design/art-style-guide.json`（若存在）或 `art-direction-v2.html` 提取 style_prompt_prefix
- 读取 `art-tokens.json` 获取章节配色
```

- [ ] **Step 3: Verify the change**

Run:
```bash
head -25 /Users/aa/workspace/glow-island/.allforai/bootstrap/node-specs/tile-art-gen.md
```
Expected: art-pipeline-config.json is now the first item in Context Pull with tileset/pixel field notes.

---

## Task 5: character-art-gen.md — Add art-pipeline-config.json Context Pull

**Files:**
- Modify: `.allforai/bootstrap/node-specs/character-art-gen.md`

Relevant config fields: `character.rig`, `character.expressions`, `character.bone_limit`

- [ ] **Step 1: Read the current Context Pull section**

Run:
```bash
head -20 /Users/aa/workspace/glow-island/.allforai/bootstrap/node-specs/character-art-gen.md
```

- [ ] **Step 2: Add art-pipeline-config.json to Context Pull**

Find this exact text in `.allforai/bootstrap/node-specs/character-art-gen.md`:
```
## Context Pull
- 读取 `.allforai/game-design/systems/art-asset-inventory.json` — category=character 条目
- 读取 `.allforai/game-design/systems/character-arc.json` — 角色外貌描述、性格关键词
- 读取 `art-direction-v2.html` — 角色设计规范（比例、眼睛大小、轮廓风格）
```

Replace with:
```
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
```

- [ ] **Step 3: Verify the change**

Run:
```bash
head -28 /Users/aa/workspace/glow-island/.allforai/bootstrap/node-specs/character-art-gen.md
```
Expected: art-pipeline-config.json is first in Context Pull with character.rig branch explanation.

---

## Task 6: environment-art-gen.md — Add art-pipeline-config.json Context Pull

**Files:**
- Modify: `.allforai/bootstrap/node-specs/environment-art-gen.md`

Relevant config fields: `environment.parallax_layers`

- [ ] **Step 1: Read the current Context Pull section**

Run:
```bash
head -20 /Users/aa/workspace/glow-island/.allforai/bootstrap/node-specs/environment-art-gen.md
```

- [ ] **Step 2: Add art-pipeline-config.json to Context Pull**

Find this exact text in `.allforai/bootstrap/node-specs/environment-art-gen.md`:
```
## Context Pull
- 读取 `art-asset-inventory.json` — category=background + island_zone 条目
- 读取 `systems/meta-game.json` — 岛屿区域描述、修复前/后情感弧线
- 读取 `art-direction-v2.html` — 章节环境美术方案
```

Replace with:
```
## Context Pull
- 读取 `.allforai/game-design/art-pipeline-config.json`（若存在且 status=final）：
  - `environment.parallax_layers`：视差层数（1=单层无视差，2-3=主流手游，5+=精细多层）
    - ≥2 层时：生成图时构图须预留前景/中景/背景分层空间（避免满构图）
    - 1 层时：正常满构图生图
  - 缺失 → 默认 2 层
- 读取 `art-asset-inventory.json` — category=background + island_zone 条目
- 读取 `systems/meta-game.json` — 岛屿区域描述、修复前/后情感弧线
- 读取 `art-direction-v2.html` — 章节环境美术方案
```

- [ ] **Step 3: Verify the change**

Run:
```bash
head -22 /Users/aa/workspace/glow-island/.allforai/bootstrap/node-specs/environment-art-gen.md
```
Expected: art-pipeline-config.json is first in Context Pull with parallax_layers instruction.

---

## Task 7: ui-art-gen.md — Add art-pipeline-config.json Context Pull

**Files:**
- Modify: `.allforai/bootstrap/node-specs/ui-art-gen.md`

Relevant config fields: `style`, `toolchain.spine_licensed`, `toolchain.aseprite_available`

- [ ] **Step 1: Read the current Context Pull section**

Run:
```bash
head -20 /Users/aa/workspace/glow-island/.allforai/bootstrap/node-specs/ui-art-gen.md
```

- [ ] **Step 2: Add art-pipeline-config.json to Context Pull**

Find this exact text in `.allforai/bootstrap/node-specs/ui-art-gen.md`:
```
## Context Pull
- 读取 `sprites/ui/ui-asset-manifest.json` — 30 个图标完整规格
- 读取 `art-direction-v2.html` — UI 视觉语言（圆角、描边、颜色规范）
- 读取 `art-tokens.json` — 颜色系统，验证图标颜色符合 token
```

Replace with:
```
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
```

- [ ] **Step 3: Verify the change**

Run:
```bash
head -25 /Users/aa/workspace/glow-island/.allforai/bootstrap/node-specs/ui-art-gen.md
```
Expected: art-pipeline-config.json is first in Context Pull with style/toolchain branch instructions.

---

## Task 8: vfx-art-gen.md — Add art-pipeline-config.json Context Pull

**Files:**
- Modify: `.allforai/bootstrap/node-specs/vfx-art-gen.md`

Relevant config fields: `vfx.approach`, `vfx.spine_fx`

- [ ] **Step 1: Read the current Context Pull section**

Run:
```bash
head -20 /Users/aa/workspace/glow-island/.allforai/bootstrap/node-specs/vfx-art-gen.md
```

- [ ] **Step 2: Add art-pipeline-config.json to Context Pull**

Find this exact text in `.allforai/bootstrap/node-specs/vfx-art-gen.md`:
```
## Context Pull
- 读取 `art-asset-inventory.json` — category=vfx 条目（8 个 Spine 动画）
- 读取 `art-direction-v2.html` — 动画风格参数（动森弹跳曲线）
- 读取 `systems/audio-design.json` — SFX 与 VFX 配合时序
```

Replace with:
```
## Context Pull
- 读取 `.allforai/game-design/art-pipeline-config.json`（若存在且 status=final）：
  - `vfx.approach`：
    - `sprite_sheet`（帧序列）→ 本节点重点产出 PNG 帧规格 + 样本帧，Spine 规格为次要
    - `spine_fx` → 本节点重点产出 Spine FX 骨骼规格（与角色同骨骼系统），PNG 帧为参考
    - `shader`（引擎粒子）→ 本节点产出参数文档（粒子数/颜色/时长），无需 PNG 资产
    - 缺失 → 默认 `sprite_sheet`
  - `vfx.spine_fx`：`true` 时在规格书中标注 Spine FX 兼容格式要求
  - 缺失 → 使用现有 Spine+PNG 混合方案
- 读取 `art-asset-inventory.json` — category=vfx 条目（8 个 Spine 动画）
- 读取 `art-direction-v2.html` — 动画风格参数（动森弹跳曲线）
- 读取 `systems/audio-design.json` — SFX 与 VFX 配合时序
```

- [ ] **Step 3: Verify the change**

Run:
```bash
head -28 /Users/aa/workspace/glow-island/.allforai/bootstrap/node-specs/vfx-art-gen.md
```
Expected: art-pipeline-config.json is first in Context Pull with vfx.approach branch instructions.

- [ ] **Step 4: Final commit (Tasks 4-8 together)**

```bash
cd /Users/aa/workspace/glow-island
git add .allforai/bootstrap/node-specs/tile-art-gen.md \
         .allforai/bootstrap/node-specs/character-art-gen.md \
         .allforai/bootstrap/node-specs/environment-art-gen.md \
         .allforai/bootstrap/node-specs/ui-art-gen.md \
         .allforai/bootstrap/node-specs/vfx-art-gen.md
git commit -m "feat: wire art-pipeline-config.json into art-gen node-specs Context Pull"
```

---

## Self-Review Checklist

**Spec coverage:**
- ✅ gaming.md art-direction output → Task 1
- ✅ art-concept in canonical node registry → Task 2
- ✅ bootstrap.md art-concept injection rule → Task 3
- ✅ tile-art-gen Context Pull → Task 4
- ✅ character-art-gen Context Pull → Task 5
- ✅ environment-art-gen Context Pull → Task 6
- ✅ ui-art-gen Context Pull → Task 7
- ✅ vfx-art-gen Context Pull → Task 8

**Type consistency checks:**
- art_overview field names in gaming.md match the schema in game-design.md (dimension/style/animation_system/notes) ✅
- art-pipeline-config.json path used consistently: `.allforai/game-design/art-pipeline-config.json` ✅
- Config field paths match art-concept skill schema (tileset.type, character.rig, vfx.approach, etc.) ✅
- art-concept node's `capability` value `"art-concept-skill"` is used to distinguish it from standard game-design nodes ✅

**Placeholder scan:** No TBD, TODO, or incomplete sections found.

**Scope check:** All 8 changes are in-scope. No new files created. No unrelated refactoring.
