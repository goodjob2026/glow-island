---
node: level-editor-tool
exit_artifacts:
  - tools/level-editor/src/App.tsx
  - tools/level-editor/src/components/GridEditor.tsx
  - tools/level-editor/src/components/LevelExporter.tsx
  - tools/level-editor/package.json
---

# Task: 关卡编辑器工具开发（React+TypeScript Web应用）

构建独立的关卡编辑器，让关卡设计师可以通过可视化界面创建和编辑关卡，而无需手动编写JSON。

## Context Pull

**必需：**
- 从 `.allforai/game-design/puzzle-mechanics-spec.json` 读取：所有枚举类型（tile_types、special_blocks[]、obstacles[]、board_events[]），作为编辑器的选项数据源
- 从 `.allforai/game-design/level-design.json` 读取：已有关卡数据，作为编辑器的初始数据和格式参考

## Theory Anchors

- **WYSIWYG Editing**: 编辑器中所见即实际游戏中的布局
- **Data-Driven Design**: 关卡数据与引擎代码分离，关卡设计师无需改代码

## Guidance

### 工具架构（tools/level-editor/）
```
tools/level-editor/
  src/
    App.tsx              # 主界面：左栏关卡列表 + 中间编辑器 + 右栏属性面板
    components/
      GridEditor.tsx     # 核心：可视化网格编辑器
      LevelList.tsx      # 左侧：章节/关卡列表（树形结构）
      ObjectivesPanel.tsx # 右侧：目标/步数/奖励配置
      TilePalette.tsx    # 底部：图块/障碍/特殊块选择面板
      LevelExporter.tsx  # 导出：JSON预览+复制+下载
    types/
      LevelSchema.ts     # Level JSON的TypeScript类型定义（与游戏客户端共用）
    data/
      tile-types.ts      # 从puzzle-mechanics-spec.json导入的枚举
    hooks/
      useGridEditor.ts   # 编辑器状态管理
  package.json
  vite.config.ts
```

### GridEditor 核心功能
- 可配置尺寸（6×6 ~ 10×10），渲染为可视化网格
- 左键放置选中的图块/障碍/特殊块
- 右键清除格子
- 悬停显示格子坐标
- 颜色/图标按 art-tokens.json 的占位色块方案

### 关卡属性面板
- 关卡ID、章节、序号
- 目标类型（下拉选择 + 数量输入）
- 最大步数（可选）
- 材料奖励（类型+数量）
- 沙滩币奖励
- 情感备注

### 导出功能
- 实时预览JSON（右侧面板）
- 导出单关JSON
- 批量导出（整个level-design.json）
- 导入已有JSON（编辑已有关卡）

### 技术栈
- React 18 + TypeScript 5
- Vite（构建）
- 无CSS框架（纯CSS Module，保持轻量）
- 无后端（纯前端工具，数据通过localStorage缓存+文件导出）

## Exit Artifacts

**tools/level-editor/src/App.tsx** — 主应用组件
**tools/level-editor/src/components/GridEditor.tsx** — 网格编辑器核心
**tools/level-editor/src/components/LevelExporter.tsx** — 导出功能
**tools/level-editor/package.json** — 依赖配置（react, typescript, vite）

## Downstream Contract

→ `level-design` 读取：关卡编辑器可以导入和验证 `level-design.json`（在level-design节点之后使用编辑器精修关卡）
→ `demo-forge` 读取：使用编辑器验证数据格式，确认导出JSON可被LevelLoader正确解析
