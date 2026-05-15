---
node_id: canvas2d-browser-qa
node: canvas2d-browser-qa
goal: "Playwright E2E功能验收：完整游戏流程从IntroScene到关卡胜利"
capability: canvas2d-engineer
human_gate: false
hard_blocked_by:
  - canvas2d-visual-qa
  - canvas2d-art-quality-qa
  - canvas2d-gameplay-quality-qa
  - canvas2d-performance-qa
  - canvas2d-audio-qa
exit_artifacts:
  - "canvas2d-client/www/qa/browser-qa-report.json"
---

# canvas2d-browser-qa

## Mission

使用 Playwright 跑完整游戏流程E2E测试，验证各场景跳转和核心玩法正常。

## 测试用例

### TC-01：完整游戏主流程
```
IntroScene 幕1 → 点击(幕2) → 点击(幕3) → 点击 → IslandMapScene
→ 点击Ch1节点 → LevelSelectScene
→ 点击关卡1 → GameplayScene
→ 完成3对连接 → 检查步数减少、分数增加
→ 退出到岛图
```

### TC-02：连连看路径验证
```
GameplayScene 第1-1关
→ 点击图块A（记录位置）
→ 点击相同类型图块B（相邻，0转弯路径）
→ 验证：两图块消失（canvas像素变为背景色）
→ 验证：步数从N减为N-1
```

### TC-03：无效路径反馈
```
GameplayScene
→ 点击图块A
→ 点击被阻挡路径的同类图块B（>2转弯）
→ 验证：图块A震动动画发生（像素位置偏移）
→ 验证：步数不减少
```

### TC-04：Combo系统
```
GameplayScene
→ 快速连续消除3对（间隔<2秒）
→ 验证：Combo计数器显示≥2
→ 等待3秒无操作
→ 验证：Combo计数器归零
```

### TC-05：关卡胜利结算
```
GameplayScene（注入简化棋盘：仅2对图块）
→ 依次消除2对
→ 验证：出现结算面板
→ 验证：ProgressManager.stars 已写入localStorage
```

### TC-06：步数耗尽失败
```
GameplayScene（注入棋盘：步数=2，图块=4对）
→ 消除1对（步数→1）→ 再消除1对（步数→0）
→ 验证：出现失败面板（包含"重试"按钮区域）
```

### TC-07：进度持久化
```
通关1-1关（星评写入）→ 刷新页面 → 进入LevelSelectScene
→ 验证：关卡1格子显示星评（不为0）
→ 验证：关卡2已解锁（可点击）
```

### TC-08：静音切换
```
GameplayScene → 点击静音按钮
→ 验证：AudioManager.isMuted() === true（console.log注入）
→ 再次点击 → 验证：isMuted() === false
```

### TC-09：禅模式流程
```
IslandMapScene → 点击禅模式按钮 → LevelSelectScene（禅模式标签）
→ 点击关卡1 → ZenGameplayScene
→ 验证：HUD 显示 "∞" 符号，无步数进度条
→ 注入 JavaScript：将 _steps 设为 0
→ 验证：不出现失败面板（禅模式不触发失败）
→ 消除所有图块
→ 验证：出现完成面板（含"再来一局"按钮，无星评数字）
```

### TC-10：经济流程 E2E（沙滩币完整链路）
```
初始状态：ProgressManager.getCoins() === 200
→ 进入 GameplayScene（1-1，注入 steps=2，剩余图块=4对）
→ 消除1对（steps→1）→ 消除1对（steps→0）
→ 验证：失败面板出现，显示"30沙滩币续关+5步"按钮
→ 点击续关
→ 验证：getCoins() === 170（200-30=170）
→ 验证：当前步数 = 5（续关+5步）
→ 消除剩余2对
→ 验证：关卡通关（星评出现）
```

### TC-11：ShopScene 沙漏奖励
```
IslandMapScene → 点击商店按钮 → ShopScene
→ 验证：双货币余额显示正确（沙滩币≥170，丹青石=0）
→ 强制设置 hourglassLastClaim = 0（过期）
→ 验证：沙漏按钮可点击（不灰色）
→ 点击领取
→ 验证：沙滩币增加10-20（在合理范围内）
→ 验证：hourglassLastClaim 已更新（≈ Date.now()）
→ 再次点击：验证按钮灰色（冷却中）
```

### TC-12：DialogScene 对话推进
```
触发 ch1_intro 对话（chapter 1 首次进入）
→ 验证：对话框出现，说话者姓名显示
→ 验证：文字逐字显示（点击前不是全部文字立即显示）
→ 点击屏幕（加速）→ 点击屏幕（下一句）
→ 推进完所有对话
→ 验证：对话结束后调用 onComplete()，场景跳转
```

## 报告格式

```json
{
  "run_at": "2026-05-16T...",
  "browser": "chromium",
  "viewport": "414x896",
  "tests": [
    { "id": "TC-01", "name": "完整游戏主流程", "status": "pass", "duration_ms": 4200 },
    { "id": "TC-02", "name": "连连看路径验证", "status": "pass", "duration_ms": 1800 }
  ],
  "summary": { "total": 12, "pass": 12, "fail": 0 },
  "overall": "pass"
}
```

写入 `canvas2d-client/www/qa/browser-qa-report.json`

## 验收标准

1. `browser-qa-report.json` overall = "pass"
2. TC-01通过（场景跳转链完整）
3. TC-02通过（消除成功，步数减少）
4. TC-05通过（胜利结算面板出现）
5. TC-07通过（localStorage进度持久化）
