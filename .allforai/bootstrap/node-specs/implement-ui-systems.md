---
node: implement-ui-systems
exit_artifacts:
  - game-client/assets/scripts/ui/MainMenuScene.ts
  - game-client/assets/scripts/ui/GameHUD.ts
  - game-client/assets/scripts/ui/LevelCompletePopup.ts
  - game-client/assets/scripts/ui/LeaderboardScene.ts
  - game-client/assets/scripts/ui/SettingsPanel.ts
---

# Task: 主要UI系统实现

## Context Pull

**必需：**
- 从 `.allforai/game-design/art-tokens.json` 读取完整token（颜色/字体/间距），所有UI颜色按此规范
- 从 `.allforai/game-design/art-direction.md` 读取按钮/弹窗/字体风格规范

**可选：**
- 从 `game-client/assets/resources/sprites/ui/ui-asset-manifest.json` 读取UI图标命名

## Guidance

### MainMenuScene.ts
- 按钮：开始游戏（→关卡选择）/ 继续（最近关卡）/ 排行榜（→LeaderboardScene）/ 设置
- 版本号显示、云存档状态图标（已同步/同步中/离线）
- 背景：第1章码头场景（模糊后作为背景）

### GameHUD.ts（挂载在GameScene）
- 连击倍率：数字+发光效果，combo升级时播放 combo-popup.anim
- 目标进度条（消除数/步数剩余）
- 暂停按钮
- 实时更新：监听 ComboTracker 的 `comboChanged` 事件 和 GameSession 的状态变化

### LevelCompletePopup.ts
- 星级显示（3星判定：无续命+步数剩余≥3 / 无续命 / 完成）
- 材料奖励展示（飞入动画）
- 按钮：下一关 / 回到地图 / 分享（WebGL端用Web Share API，iOS端用系统分享）
- 完成后调用 ProgressionManager.syncToCloud()

### LeaderboardScene.ts
- 调用后端 GET /leaderboard?limit=50
- 显示Top50列表（排名/昵称/分数/到达章节）
- 高亮显示当前玩家行
- 底部显示当前玩家排名（即使不在Top50）

### SettingsPanel.ts
- BGM音量滑块（0-100%）、SFX音量滑块
- 云存档状态（已登录/离线模式）+ 强制同步按钮
- 关于/隐私政策/用户协议（WebView弹窗）

## Exit Artifacts

5个 TypeScript 文件

## Downstream Contract

→ `stitch-game-client` 读取：MainMenuScene的场景跳转目标（验证全部已接线）、LeaderboardScene的API调用方式（验证与/leaderboard路由一致）
