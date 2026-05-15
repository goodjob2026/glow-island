---
node_id: e2e-gameplay
node: e2e-gameplay
capability: product-verify
human_gate: false
hard_blocked_by: [compile-verify, ui-forge-game]
unlocks: [game-2d-code-repair-loop]
exit_artifacts:
  - .allforai/bootstrap/e2e-results.json
  - .allforai/bootstrap/e2e-report.json
---

# Task: E2E 游戏功能验收

## 测试环境准备

```bash
# 启动 Cocos Preview 服务
cd game-client
npx @cocos/cocos-cli preview --port 7456 &
sleep 5

# 确认服务启动
curl -s http://localhost:7456/ | head -3 || echo "preview not available, use built output"
```

若 Preview 不可用，使用 `build/` 目录的静态构建：
```bash
cd game-client && python3 -m http.server 7456 --directory build/web-mobile &
```

## Playwright 测试套件

配置文件：`game-client/playwright.config.ts`

运行测试：
```bash
cd game-client && npx playwright test e2e/ --reporter=json 2>&1 | tail -30
```

若 `e2e/` 目录不存在或测试稀少，编写关键路径测试：

### 测试用例清单（最低要求）

**TC-001: 游戏加载**
```typescript
test('游戏场景加载', async ({ page }) => {
    await page.goto('http://localhost:7456');
    await page.waitForLoadState('networkidle');
    // 验证 canvas 存在
    await expect(page.locator('canvas')).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: 'e2e-screenshots/01-loaded.png' });
});
```

**TC-002: 棋盘渲染（核心 QA）**
- 游戏加载后 3 秒，截图验证棋盘区域有颜色分布（非全黑/全白）
- 验证截图中存在多种颜色区块（通过像素采样）

**TC-003: 图块点击响应**
- 点击棋盘中心区域
- 截图前后对比，验证有视觉变化（选中高亮）

**TC-004: 游戏逻辑不崩溃**
- 打开浏览器控制台，收集 3 秒内的错误日志
- 断言无 `Uncaught Error` 或 `TypeError`

```typescript
test('无 JS 错误', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto('http://localhost:7456');
    await page.waitForTimeout(3000);
    expect(errors.filter(e => !e.includes('cc module'))).toHaveLength(0);
});
```

**TC-005: HUD 可见性**
- 截图验证步数/分数 HUD 区域有文字/数字（截图顶部区域）

## 截图输出

所有截图保存至 `game-client/test-results/screenshots/`

## 完成标准

所有 5 个 TC 通过，或不通过时：
- 记录失败 TC 和截图到 `e2e-report.json`
- 分类为 `code_gaps`（代码问题）vs `contract_gaps`（测试断言问题）
- contract_gaps 不阻塞（测试写法问题），code_gaps 进入 code-repair-loop

```json
{
  "run_at": "<ISO>",
  "total": 5,
  "passed": N,
  "failed": M,
  "code_gaps": [{ "tc": "TC-002", "description": "..." }],
  "contract_gaps": [],
  "screenshots": ["e2e-screenshots/01-loaded.png", ...]
}
```
