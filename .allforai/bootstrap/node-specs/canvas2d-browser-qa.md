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
  "summary": { "total": 8, "pass": 8, "fail": 0 },
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
