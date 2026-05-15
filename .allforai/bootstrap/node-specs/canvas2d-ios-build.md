---
node_id: canvas2d-ios-build
node: canvas2d-ios-build
goal: "构建 canvas2d iOS 包：Capacitor 生成 Xcode 项目、xcodebuild 编译、iPhone 模拟器安装验收"
capability: canvas2d-engineer
human_gate: false
hard_blocked_by:
  - canvas2d-capacitor-plugins
  - canvas2d-qa-repair-loop
exit_artifacts:
  - "canvas2d-client/ios/build/canvas2d-sim-test-report.json"
---

# canvas2d-ios-build

## Mission

将 canvas2d-client/www 打包进 Capacitor iOS 容器，用 xcodebuild 编译
simulator 版本，在 iPhone 16 模拟器上完整运行并截图验证。

## 前置条件检查

```bash
# Xcode 命令行工具
xcode-select --version          # 必须存在
xcrun simctl list devices       # 必须有可用 iPhone 模拟器
```

若 Xcode CLI 未安装，记录 UPSTREAM_DEFECT 并停止。

## 构建步骤

### Step 1: 同步 Web 资产到 iOS 容器

```bash
cd canvas2d-client
npx cap sync ios
```

此命令将 `www/` 内容复制到 `ios/App/App/public/`，并同步 Capacitor 插件。

### Step 2: 选择 iOS 模拟器

```bash
# 优先选 iPhone 16，其次 iPhone 15，其次最新可用
SIM_ID=$(xcrun simctl list devices available -j | python3 -c "
import json, sys
d = json.load(sys.stdin)
for runtime, devices in d['devices'].items():
    for dev in devices:
        if dev['isAvailable'] and 'iPhone' in dev['name']:
            print(dev['udid'])
            exit()
")
echo "Using simulator: $SIM_ID"
```

### Step 3: 启动模拟器

```bash
xcrun simctl boot "$SIM_ID" 2>/dev/null || true
open -a Simulator --args -CurrentDeviceUDID "$SIM_ID"
# 等待模拟器就绪
sleep 10
```

### Step 4: 编译 & 安装

```bash
cd canvas2d-client/ios

# 编译（simulator target，不签名）
xcodebuild \
  -workspace App/App.xcworkspace \
  -scheme App \
  -configuration Debug \
  -destination "id=$SIM_ID" \
  -derivedDataPath build/DerivedData \
  CODE_SIGN_IDENTITY="" CODE_SIGNING_REQUIRED=NO \
  build 2>&1 | tail -30

# 找到 .app
APP_PATH=$(find build/DerivedData -name "*.app" -not -path "*/Tests/*" | head -1)
echo "App path: $APP_PATH"

# 安装到模拟器
xcrun simctl install "$SIM_ID" "$APP_PATH"
```

### Step 5: 启动并截图验证

```bash
BUNDLE_ID="com.glowisland.canvas2d"

# 启动 App
xcrun simctl launch "$SIM_ID" "$BUNDLE_ID"
sleep 5  # 等待加载

# 截图：启动画面
xcrun simctl io "$SIM_ID" screenshot build/screenshot_01_launch.png

sleep 3  # 等待 IntroScene

# 截图：IntroScene（过场动画第1幕）
xcrun simctl io "$SIM_ID" screenshot build/screenshot_02_intro.png

# 模拟点击（IntroScene 继续）
xcrun simctl io "$SIM_ID" sendkey 1    # 使用 Simulator 点击事件注入

sleep 3
xcrun simctl io "$SIM_ID" screenshot build/screenshot_03_island_map.png

# 卸载（清理）
xcrun simctl uninstall "$SIM_ID" "$BUNDLE_ID"
```

## 截图验收（视觉检查）

对 3 张截图逐一检查：

| 截图 | 验收条件 |
|------|---------|
| screenshot_01_launch.png | 非纯黑屏（像素均值 > 20），有内容渲染 |
| screenshot_02_intro.png | 出现过场动画画面（非空白） |
| screenshot_03_island_map.png | 岛屿地图渲染正确（存在彩色像素） |

```python
# 使用 Python PIL 检查截图像素均值
from PIL import Image
import sys

def check_screenshot(path, min_brightness=20):
    img = Image.open(path).convert('L')  # 灰度
    avg = sum(img.getdata()) / (img.width * img.height)
    passed = avg > min_brightness
    print(f'{path}: avg_brightness={avg:.1f} -> {"PASS" if passed else "FAIL"}')
    return passed

results = []
for p in ['screenshot_01_launch.png', 'screenshot_02_intro.png', 'screenshot_03_island_map.png']:
    results.append(check_screenshot(f'build/{p}'))
print('ALL PASS' if all(results) else 'FAIL')
```

## WebKit 触控坐标测试（DPR 映射验证）

Canvas2D 在 iOS WKWebView 中有 devicePixelRatio 坐标陷阱：
`canvas.width = logicalW * dpr`，点击逻辑坐标必须用 `e.offsetX`（非 `e.clientX / dpr`）。

用 Playwright WebKit 模拟 iPhone 14 Pro 验证坐标映射：

```bash
cd canvas2d-client
npx playwright test ios-touch.spec.js --browser=webkit
```

```js
// tests/ios-touch.spec.js
const { test, expect, devices } = require('@playwright/test');
const iPhone = devices['iPhone 14 Pro'];

test('canvas touch coordinate mapping', async ({ browser }) => {
  const ctx = await browser.newContext({ ...iPhone });
  const page = await ctx.newPage();
  await page.goto('http://localhost:8080');

  // 注入坐标记录钩子（在 GameplayScene.onTap 中需暴露）
  await page.evaluate(() => {
    window._lastTap = null;
    // GameplayScene 应在 onTap 时写入 window._lastTap = {x, y}
  });

  // 等待进入 GameplayScene
  await navigateToGameplay(page, { chapter: 1, level: 1 });
  await page.waitForTimeout(1000);

  // 点击 canvas 中央（逻辑坐标 195, 448 at 390×844）
  const canvas = page.locator('canvas');
  const box = await canvas.boundingBox();
  const tapX = box.x + box.width  * 0.5;
  const tapY = box.y + box.height * 0.5;
  await page.tap('canvas', { position: { x: box.width * 0.5, y: box.height * 0.5 } });
  await page.waitForTimeout(200);

  // 验证 game 收到的坐标在逻辑尺寸范围内（不是 physical pixel 坐标）
  const tap = await page.evaluate(() => window._lastTap);
  expect(tap).not.toBeNull();
  // 逻辑宽度 = 390，不应该收到 1170（390 * dpr=3）
  expect(tap.x).toBeLessThanOrEqual(400); // 逻辑坐标
  expect(tap.x).toBeGreaterThan(100);     // 确实是中央附近
  expect(tap.y).toBeLessThanOrEqual(850);

  await ctx.close();
});
```

GameplayScene 需要暴露钩子（测试模式）：
```js
// GameplayScene.onTap(x, y) 首行
if (typeof window !== 'undefined') window._lastTap = { x, y };
```

## Portrait 锁定验证

```bash
# 检查 Info.plist 中的方向设置
plutil -p canvas2d-client/ios/App/App/Info.plist | grep -A5 "UISupportedInterfaceOrientations"
```

验收：必须只含 `UIInterfaceOrientationPortrait`，不含 Landscape 值。

如果缺失，自动修补：
```bash
/usr/libexec/PlistBuddy -c "Delete :UISupportedInterfaceOrientations~ipad" \
  canvas2d-client/ios/App/App/Info.plist 2>/dev/null || true
/usr/libexec/PlistBuddy -c "Set :UISupportedInterfaceOrientations:0 UIInterfaceOrientationPortrait" \
  canvas2d-client/ios/App/App/Info.plist
```

## 输出报告

```json
{
  "run_at": "<ISO>",
  "simulator": { "name": "iPhone 16", "udid": "...", "os": "iOS 18.x" },
  "build": { "status": "success|fail", "duration_s": 45 },
  "screenshots": [
    { "file": "screenshot_01_launch.png", "avg_brightness": 87.3, "status": "pass" },
    { "file": "screenshot_02_intro.png",  "avg_brightness": 62.1, "status": "pass" },
    { "file": "screenshot_03_island_map.png", "avg_brightness": 91.5, "status": "pass" }
  ],
  "portrait_lock": "pass|fail",
  "overall": "pass|fail"
}
```

写入 `canvas2d-client/ios/build/canvas2d-sim-test-report.json`

## 验收标准

1. `xcodebuild` 编译 exit code = 0
2. 3 张截图均非纯黑（avg_brightness > 20）
3. portrait_lock = pass（Info.plist 只有竖屏方向）
4. overall = pass
