---
node: e2e-test
exit_artifacts:
  - .allforai/bootstrap/e2e-report.json
---

# Task: Playwright E2E 测试（WebGL构建）

## Guidance

### 前置条件
- 后端服务运行中（localhost:3000）
- WebGL构建已完成（game-client/dist/webgl/index.html 存在）
- 启动本地HTTP服务：`npx serve game-client/dist/webgl -p 8080`

### 测试用例

**TC-001: 新游戏启动 + 教学关卡**
1. 导航到 `http://localhost:8080`
2. 等待游戏加载完成（检测Canvas元素）
3. 点击"开始游戏"按钮
4. 验证：进入第1关（level-select或直接进入1-1）
5. 在游戏区域找到两个相邻同类图块并点击连接
6. 验证：连接成功（图块消失动画播放，连击计数出现）
7. 连续快速点击3次→验证combo显示
8. 验证API调用：Network拦截/save PUT请求（存档已触发）

**TC-002: 岛屿地图查看**
1. 完成教学关卡（或通过注入存档跳过）
2. 点击"回到地图"
3. 验证：岛屿地图场景加载，码头区域可见
4. 点击未解锁章节：验证显示锁定提示

**TC-003: 商店访问 + 商品显示**
1. 进入商店（通过MainMenu或岛屿地图入口）
2. 验证：商品列表显示（至少3种IAP商品）
3. 验证：货币余额显示（沙滩币/丹青石）
4. 点击一个商品：验证PurchaseConfirmPopup出现
5. 点击取消：验证弹窗关闭

**TC-004: 排行榜**
1. 进入排行榜场景
2. 验证：列表有记录（至少10条，来自demo-forge）
3. 验证：排名数字显示正确

### 测试执行
```typescript
// playwright.config.ts
{ use: { baseURL: 'http://localhost:8080', screenshot: 'only-on-failure' } }
```

截图保存到 `.allforai/bootstrap/e2e-screenshots/`

## Exit Artifacts

**e2e-report.json** — 4个用例的通过/失败状态，截图路径
