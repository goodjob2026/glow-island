---
node: core-mechanics-design
exit_artifacts:
  - .allforai/game-design/puzzle-mechanics-spec.json
---

# Task: 连连看引擎详细机制规格设计

输出puzzle-mechanics-spec.json，作为实现节点的权威技术规格文档。

## Context Pull

**必需：**
- 从 `.allforai/game-design/game-design-document.md` 读取核心循环描述，确认机制设计范围

## Theory Anchors

- **MDA Framework**: Mechanics（规则）→ Dynamics（玩家行为）→ Aesthetics（体验感受）
- **Flow Theory**: 难度随进度非线性上升，早期宽容，中后期挑战
- **Meaningful Choices (Sid Meier)**: 每次连接决策应有意义，而非随机点击

## Guidance

### 网格系统
- 默认尺寸：8×8（可配置，关卡JSON指定）
- 尺寸范围策略：第1章6×6（宽容）→ 第6章10×10（挑战）
- 图块类型：20种（每章4种主力类型+特殊块，按章节分组解锁）
- 空格设计：棋盘中可有空格，路径可经过空格穿越

### 路径算法规则（TileMatcher核心）
- 连接条件：相同TileType，且路径满足：
  - 最多2次转弯（经典连连看规则）
  - 路径不经过已占用图块（只能走空格或边缘）
  - 路径长度：无限制（只要满足转弯约束）
- 边界处理：路径可沿棋盘边缘延伸（经典规则）

### 连击（Combo）系统
- 触发：连续匹配之间间隔 < 2秒
- 倍率阶梯：
  - 1连击：×1.0（正常得分）
  - 2连击：×1.5（+音效增强）
  - 3连击：×2.0（+特效升级）
  - 4+连击：×3.0（+屏幕震动+粒子爆发）
- 连击重置：间隔超过2秒或棋盘无可用匹配时重置

### 4种特殊块
规格必须包含：触发条件、效果范围、动画时长、生成概率

| 特殊块 | 触发条件 | 效果 | 动画时长 |
|--------|---------|------|---------|
| 炸弹 | 3连击时生成/关卡预置 | 消除3×3范围所有图块 | 0.5s |
| 风车 | 4连击时生成/关卡预置 | 清除同色整列（竖列） | 0.4s |
| 灯光 | 关卡预置 | 自动寻路连接距离最近的同类型图块 | 0.3s |
| 海浪 | 关卡预置 | 重新随机排列棋盘所有图块（保持类型数量不变） | 0.8s |

### 动态棋盘事件（BoardEventManager）
- **图块滑落**: 消除后上方图块向下滑落填充，有重力感
- **水流移动**: 特定行/列的图块每N秒向指定方向移动1格
- **冰冻**: 选定区域图块无法被选中，需先消除冰层（需消除2次）
- **藤蔓扩散**: 每10秒向相邻格子扩散，被藤蔓覆盖的图块需消除藤蔓后才能使用

### 障碍系统（ObstacleManager）

| 障碍 | 消除方式 | 对路径影响 |
|------|---------|---------|
| 冰块 | 相邻消除2次 | 不阻挡路径，但图块被锁定 |
| 杂草 | 相邻消除1次，但每15秒扩散1格 | 不阻挡，但占用格子 |
| 木箱 | 无法消除，永久存在 | 阻挡路径 |
| 水流 | 无法消除，每5秒改变方向 | 改变路径可达性 |

## Exit Artifacts

**puzzle-mechanics-spec.json** — 完整机制规格：
```json
{
  "grid": { "default_size": 8, "min": 6, "max": 10 },
  "tile_types": { "total": 20, "per_chapter": 4 },
  "path_rules": { "max_turns": 2, "edge_traverse": true },
  "combo": {
    "window_ms": 2000,
    "multipliers": [1.0, 1.5, 2.0, 3.0],
    "thresholds": [1, 2, 3, 4]
  },
  "special_blocks": [...],
  "board_events": [...],
  "obstacles": [...]
}
```

## Downstream Contract

→ `prototype-design` 读取：`path_rules` 和 `combo` 字段，实现最小可玩原型
→ `implement-puzzle-core` 读取：完整 `path_rules`、`tile_types`、`combo` 字段
→ `implement-special-mechanics` 读取：`special_blocks[]` 和 `board_events[]` 完整规格
→ `level-design` 读取：`grid`、`tile_types`、`obstacles[]` 作为关卡设计约束
→ `level-editor-tool` 读取：所有枚举类型（special_blocks、board_events、obstacles），生成编辑器选项
→ `vfx-design` 读取：`special_blocks[].animation_duration` 和 `combo.thresholds`，对齐特效时序
