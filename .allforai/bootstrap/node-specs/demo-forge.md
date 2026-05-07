---
node: demo-forge
exit_artifacts:
  - .allforai/bootstrap/demo-data-report.json
---

# Task: 测试数据创建（3个玩家账户 + 排行榜）

## Context Pull

**必需：**
- 从 `.allforai/game-design/economy-model.json` 读取货币初始值和材料类型
- 从 `.allforai/game-design/level-design.json` 选取代表性关卡数据

## Guidance

### 1. 启动后端服务
```bash
cd backend && npm run dev
```
确认服务正常：`curl http://localhost:3000/health`

### 2. 创建3个测试账户

**账户1：新玩家"小岛旅人"**
- 设备ID：`device_test_001`
- POST /auth/anonymous
- 存档：chapter_1_level: 3，沙滩币: 80，丹青石: 0，浮木×5

**账户2：中期玩家"海风寻梦"**
- 设备ID：`device_test_002`
- 存档：chapter_1完成，chapter_2完成，chapter_3进行中（level 8/20）
- 沙滩币: 350，丹青石: 15，花田区域已修复
- 排行榜分数：1850

**账户3：后期玩家"灯塔守望者"**
- 设备ID：`device_test_003`
- 存档：chapter_1-5全部完成，chapter_6进行中（level 5/25）
- 沙滩币: 1200，丹青石: 88，温泉区域已修复，灯塔区域部分恢复
- 排行榜分数：8400（Top3）

### 3. 填充排行榜（15条）
POST /leaderboard/submit 创建分布合理的15条记录（100-10000分区间，各章节都有）

### 4. 验证关卡编辑器
打开 tools/level-editor（`npm run dev`），导入 level-design.json，确认关卡列表显示，随机打开一关检查格子渲染。

## Exit Artifacts

**demo-data-report.json** — 包含3个账户的player_id和创建状态，排行榜记录数，编辑器验证结果
