---
node: animation-design
exit_artifacts:
  - game-client/assets/animations/tile-connect.anim
  - game-client/assets/animations/tile-disappear.anim
  - game-client/assets/animations/combo-popup.anim
  - game-client/assets/animations/area-restore-sequence.anim
  - .allforai/game-design/animation-spec.json
---

# Task: Cocos Creator 动画剪辑设计与创建

为连连看引擎和岛屿恢复系统创建所有关键动画剪辑（.anim文件），确保动画时序与机制规格一致。

## Context Pull

**必需：**
- 从 `.allforai/game-design/puzzle-mechanics-spec.json` 读取 `special_blocks[].animation_duration`，确保特效动画时序匹配
- 从 `.allforai/game-design/art-tokens.json` 读取 `animation` 字段的时长规格
- 从 `.allforai/game-design/chapter-emotional-arcs.json` 读取 `restore_stages[]`，设计区域恢复4阶段序列时序

**可选：**
- 从 `game-client/assets/resources/sprites/tiles/tile-placeholder-spec.json` 读取 `states[]`，确认动画覆盖所有状态

## Theory Anchors

- **Animation Easing**: 治愈感动画使用 ease-out（快入慢出）而非线性，更自然柔和
- **Anticipation & Follow-Through**: 消除前有微小预备动作（缩小0.9x），消除后有余韵
- **12 Principles of Animation**: Squash and Stretch 用于combo文字弹出

## Guidance

### 1. tile-connect.anim（图块连接高亮动画）
- 触发：用户选中一个图块
- 时长：0.15s
- 内容：scale 1.0→1.15→1.0（脉冲），色相叠加（按章节强调色）
- 曲线：ease-out

### 2. tile-disappear.anim（图块消除动画）
- 触发：路径验证通过，两个图块消除
- 时长：0.3s
- 内容：scale 1.0→0.9（预备）→1.2（弹出）→0 + alpha 1→0
- 同时：路径光轨从图块A到图块B（0.1s）
- 曲线：cubic-bezier，有弹性感

### 3. combo-popup.anim（连击弹出动画，4个版本）
- combo×1：小字体，白色，快速消失（0.5s）
- combo×2：中字体，黄色，轻微弹跳（0.6s）
- combo×3：大字体，橙色，弹跳+缩放（0.7s）
- combo×4+：超大字体，渐变色，强烈弹跳+屏幕闪白（0.8s）
- 从连击发生位置向上飘出

### 4. area-restore-sequence.anim（岛屿区域恢复序列）
- 总时长：约5秒（4阶段连续）
- 第1阶段（0-1s）：区域从灰白色渐变为彩色（color tween）
- 第2阶段（1-2s）：第一批元素出现（花/海鸥/鱼，scale 0→1，ease-out）
- 第3阶段（2-3.5s）：标志性元素出现（小船/灯光/动物，带入场轨迹）
- 第4阶段（3.5-5s）：NPC出现，粒子特效叠加（引用vfx-area-restore.effect）

### 动画文件创建方式
使用Cocos Creator的Animation编辑器创建.anim文件，关键帧手动配置。
如果命令行创建，在 animation-spec.json 中记录每个动画的详细关键帧规格，
由 implement-island-map 和 implement-puzzle-core 读取并在代码中播放。

## Exit Artifacts

**4个 .anim 文件** — Cocos Creator动画剪辑

**animation-spec.json** — 动画规格（备用，供代码层参考）：
```json
{
  "animations": [
    {
      "id": "tile-connect",
      "file": "game-client/assets/animations/tile-connect.anim",
      "duration_ms": 150,
      "trigger": "tile_selected",
      "keyframes": [
        { "time": 0, "scale": [1.0, 1.0], "easing": "ease-out" },
        { "time": 0.1, "scale": [1.15, 1.15] },
        { "time": 0.15, "scale": [1.0, 1.0] }
      ]
    }
  ]
}
```

## Downstream Contract

→ `implement-puzzle-core` 读取：`tile-connect.anim` 和 `tile-disappear.anim` 路径，在匹配成功时播放
→ `implement-island-map` 读取：`area-restore-sequence.anim` 路径，章节完成时触发
→ `stitch-game-client` 读取：`animation-spec.json`，验证所有动画触发点已绑定
