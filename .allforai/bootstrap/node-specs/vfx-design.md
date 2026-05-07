---
node: vfx-design
exit_artifacts:
  - game-client/assets/effects/vfx-tile-connect.effect
  - game-client/assets/effects/vfx-combo-burst.effect
  - game-client/assets/effects/vfx-area-restore.effect
  - game-client/assets/effects/vfx-lighthouse-final.effect
  - .allforai/game-design/vfx-spec.json
---

# Task: Cocos Creator 粒子特效设计与创建

为游戏核心体验节点创建粒子特效文件（.effect），覆盖连接光轨、连击爆发、区域恢复和灯塔最终点亮。

## Context Pull

**必需：**
- 从 `.allforai/game-design/puzzle-mechanics-spec.json` 读取 `combo.thresholds[]`，设计对应档位的特效强度
- 从 `.allforai/game-design/art-tokens.json` 读取 `colors.chapters[]`，特效颜色需与章节主色协调

**可选：**
- 从 `.allforai/game-design/art-direction.md` 读取特效风格描述（萤火虫/花瓣/光粒子偏好）

## Theory Anchors

- **Juice Philosophy (Martin Jonasson)**: 过度的视觉反馈让游戏感觉更爽，但治愈系需要克制
- **Rule of Thirds**: 粒子特效的发射方向和分布遵循视觉美学
- **Color Harmony**: 特效色彩与章节主色的互补/类似色关系

## Guidance

### 1. vfx-tile-connect.effect（连接路径光轨）
- 类型：Trail Effect（跟随路径）
- 粒子数：约30个小光点
- 颜色：章节主色（运行时动态注入）
- 生命周期：0.15s（与 tile-connect.anim 同步）
- 效果：沿连接路径绘制光轨，消失时散开

### 2. vfx-combo-burst.effect（连击爆发）
- 类型：Burst（爆发型粒子）
- 强度分级：4档（对应combo×1/2/3/4+）
  - ×1：不触发
  - ×2：小范围圆形散射（20粒子，半径80px）
  - ×3：中范围散射+上升（40粒子，彩色）
  - ×4+：全屏爆发+光环扩散（80粒子+光晕）
- 生命周期：0.8s
- 颜色：渐变（从白→章节强调色）

### 3. vfx-area-restore.effect（区域恢复环境粒子）
- 类型：Ambient（环境型，持续）
- 场景：配合 area-restore-sequence.anim 第4阶段
- 效果：萤火虫（缓慢漂浮上升，随机闪烁）+ 花瓣飘落
  - 萤火虫：淡黄绿色小点，生命周期4-8s，随机方向慢速移动
  - 花瓣：粉白色小片，从上方缓慢飘落，轻微旋转
- 持续时间：5s后自动停止
- 颜色：按章节主色调整（如温泉章节改为樱花粉）

### 4. vfx-lighthouse-final.effect（灯塔最终点亮，第6章结局）
- 类型：Radial Burst + Persistent Glow
- 这是游戏的高潮特效，全屏规模
- 效果序列：
  1. 灯塔顶部发出光柱（向上+向四周）
  2. 光波从灯塔向全岛扩散（圆形扩散波，持续2s）
  3. 全岛所有区域灯光同时亮起（各区域同步触发小光粒子）
  4. 最终状态：暖黄光晕持续环绕灯塔
- 需要配合灯塔亮起音效（AudioManager.sfx.lighthouseOn）

### .effect文件创建方式
Cocos Creator 使用JSON格式的粒子系统配置（或通过编辑器创建）。
在 vfx-spec.json 中记录每个特效的完整参数配置，供代码加载和动态修改。

## Exit Artifacts

**4个 .effect 文件** — Cocos Creator粒子系统文件

**vfx-spec.json** — 特效规格备案：
```json
{
  "effects": [
    {
      "id": "vfx-tile-connect",
      "type": "trail",
      "particle_count": 30,
      "lifetime_ms": 150,
      "color_dynamic": true,
      "trigger": "on_tile_match_path"
    }
  ]
}
```

## Downstream Contract

→ `implement-special-mechanics` 读取：`vfx-tile-connect.effect` 路径（连接特效），`vfx-combo-burst.effect` 路径（连击特效）
→ `implement-island-map` 读取：`vfx-area-restore.effect` 和 `vfx-lighthouse-final.effect` 路径
→ `stitch-game-client` 读取：`vfx-spec.json` 的 `trigger` 字段，验证所有触发点已绑定
