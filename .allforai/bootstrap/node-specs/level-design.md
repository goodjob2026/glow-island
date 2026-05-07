---
node: level-design
exit_artifacts:
  - .allforai/game-design/level-design.json
  - .allforai/game-design/progression-curve.json
---

# Task: 6章节完整关卡表设计（~135关）

输出可被关卡编辑器直接导入的关卡数据JSON，包含教学关和难度曲线规格。

## Context Pull

**必需：**
- 从 `.allforai/game-design/puzzle-mechanics-spec.json` 读取 `grid`（网格尺寸约束）、`tile_types`（各章节可用图块类型）、`obstacles[]`（障碍类型枚举）、`special_blocks[]`（特殊块类型枚举）
- 从 `.allforai/game-design/chapter-emotional-arcs.json` 读取 `chapters[].emotion`，关卡情绪节奏需与章节情感一致

## Theory Anchors

- **Pacing Theory**: 节奏交替——紧张关卡后跟一个呼吸关卡（3:1节奏）
- **Teaching Through Design**: 前3关不用文字教程，用关卡设计教会玩家规则
- **Difficulty Spike vs Curve**: 章节内难度渐进；章节切换时难度重置（保持动力）
- **Content Gating**: 材料收集控制解锁节奏，防止跳过内容

## Guidance

### 关卡设计原则
1. **教学关（1-1到1-3）**：
   - 1-1：4×4网格，只有2种图块，无障碍，确保第一次必能连接成功
   - 1-2：引入第3种图块，展示消除后新图块从顶部落下
   - 1-3：引入连击，设计让玩家自然发现连击奖励的布局

2. **难度曲线**（每章）：
   - 前25%关卡：宽松（大网格+少种类+无障碍）
   - 中50%关卡：标准难度（引入障碍或动态事件）
   - 后25%关卡：挑战关（障碍+限步数+特殊块组合）

3. **关卡目标类型**（按章节逐渐丰富）：
   - 第1章：仅消除N个指定图块
   - 第2章：引入步数限制（最多X步内完成）
   - 第3章：引入障碍清除目标（消除所有冰块）
   - 第4章：引入组合目标（消除指定图块+清除障碍）
   - 第5-6章：全组合（消除+障碍+特殊块触发）

### 关卡JSON格式
每关记录：
```json
{
  "id": "1-1",
  "chapter": 1,
  "level": 1,
  "grid_size": [4, 4],
  "tile_types": ["shell", "starfish"],
  "objectives": [{ "type": "clear_tiles", "count": 20 }],
  "max_moves": null,
  "initial_board": null,
  "obstacles": [],
  "special_blocks": [],
  "board_events": [],
  "material_reward": { "type": "driftwood", "amount": 3 },
  "coin_reward": 15,
  "emotional_note": "第一次连接，应该感觉很自然"
}
```

### 进度曲线规格（progression-curve.json）
- 每章解锁所需材料数量
- 修复各区域的材料配方
- 章节内关卡的预估完成时间分布（30s/1min/2min/3min）
- 沙滩币收入预测曲线

## Exit Artifacts

**level-design.json** — 完整关卡表（~135关），每关含完整配置
**progression-curve.json** — 进度曲线和材料经济预测

## Downstream Contract

→ `level-editor-tool` 读取：`level-design.json` 格式结构，作为编辑器的导入/导出格式标准
→ `implement-game-session` 读取：`level-design.json` 结构（LevelLoader按此格式解析）
→ `demo-forge` 读取：`level-design.json` 选取代表性关卡创建测试存档
