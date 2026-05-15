---
node_id: ios-simulator-acceptance
node: ios-simulator-acceptance
capability: product-verify
human_gate: false
hard_blocked_by: [compile-verify]
unlocks: [code-repair-loop]
exit_artifacts:
  - .allforai/bootstrap/ios-sim-report.json---

# Task: iOS Simulator 移动端验收

## 环境信息

- **活跃 Simulator**: iPhone 17 (D9F5F3CA-CC37-4FCA-BCA2-EE268882AF37) — Booted
- **Bundle ID**: com.glowisland.app
- **现有构建**: `game-client/build/ios/proj/Release-iphonesimulator/glow-island-game-client-mobile.app`
- **测试工具**: `xcrun simctl`（系统内置，无需 Maestro）

## 步骤 1：判断是否需要重新构建

检查代码修改时间 vs 构建产物时间：

```bash
# 最近代码修改时间
LAST_CODE=$(find game-client/assets/scripts -name "*.ts" -newer game-client/build/ios/proj/Release-iphonesimulator/glow-island-game-client-mobile.app/main.js 2>/dev/null | wc -l)
echo "Changed scripts since iOS build: $LAST_CODE"
```

若 `$LAST_CODE > 0`，说明代码已改动，需要重新构建 iOS。

### 重新构建（仅当代码有变更时）

**Step 1a: Cocos 生成 iOS Xcode 项目**
```bash
COCOS_BIN="${COCOS_CREATOR_APP:-/Applications/CocosCreator.app}/Contents/MacOS/CocosCreator"
if [ -f "$COCOS_BIN" ]; then
    "$COCOS_BIN" --project "$(pwd)/game-client" --build "platform=ios" 2>&1 | tail -10
else
    echo "WARN: Cocos Creator not found at $COCOS_BIN — using existing build"
fi
```

**Step 1b: Xcode 为 Simulator 构建**
```bash
cd game-client/build/ios/proj
xcodebuild \
    -project glow-island-game-client.xcodeproj \
    -scheme glow-island-game-client \
    -destination "platform=iOS Simulator,id=D9F5F3CA-CC37-4FCA-BCA2-EE268882AF37" \
    -configuration Release \
    -derivedDataPath ./DerivedData \
    build 2>&1 | grep -E "error:|warning:|BUILD SUCCEEDED|BUILD FAILED" | tail -20
```

若构建失败，记录错误为 `code_gaps` 并跳过后续步骤（报告 `status: blocked`）。

## 步骤 2：确认 Simulator 运行中

```bash
SIMULATOR_ID="D9F5F3CA-CC37-4FCA-BCA2-EE268882AF37"
xcrun simctl list devices | grep "$SIMULATOR_ID"

# 若未启动，先启动
xcrun simctl bootstatus "$SIMULATOR_ID" -b 2>/dev/null || \
    open -a Simulator --args -CurrentDeviceUDID "$SIMULATOR_ID" && sleep 8
```

## 步骤 3：安装 App

```bash
APP_PATH="$(pwd)/game-client/build/ios/proj/Release-iphonesimulator/glow-island-game-client-mobile.app"

# 若 DerivedData 构建成功则优先使用新构建
DERIVED_APP=$(find game-client/build/ios/proj/DerivedData -name "glow-island-game-client-mobile.app" -path "*/iphonesimulator/*" 2>/dev/null | head -1)
[ -n "$DERIVED_APP" ] && APP_PATH="$DERIVED_APP"

echo "Installing from: $APP_PATH"
xcrun simctl install "$SIMULATOR_ID" "$APP_PATH"
echo "Install exit code: $?"
```

## 步骤 4：启动 App + 截图

```bash
mkdir -p .allforai/bootstrap/ios-screenshots

# 终止已有实例
xcrun simctl terminate "$SIMULATOR_ID" com.glowisland.app 2>/dev/null || true

# 启动 App
xcrun simctl launch --console-pty "$SIMULATOR_ID" com.glowisland.app 2>&1 &
LAUNCH_PID=$!
sleep 5

# 截图（初始状态）
xcrun simctl io "$SIMULATOR_ID" screenshot .allforai/bootstrap/ios-screenshots/ios-01-launch.png
echo "Launch screenshot saved"

# 等待游戏场景加载（Cocos 需要时间初始化）
sleep 5
xcrun simctl io "$SIMULATOR_ID" screenshot .allforai/bootstrap/ios-screenshots/ios-02-game-scene.png
echo "Game scene screenshot saved"
```

## 步骤 5：模拟触控交互

```bash
# 获取屏幕尺寸（iPhone 17: 393×852 pt）
# 点击屏幕中心（棋盘区域）
xcrun simctl io "$SIMULATOR_ID" sendEvent touchBegin 196 426
sleep 0.1
xcrun simctl io "$SIMULATOR_ID" sendEvent touchEnd 196 426
sleep 1

xcrun simctl io "$SIMULATOR_ID" screenshot .allforai/bootstrap/ios-screenshots/ios-03-after-tap.png
echo "After-tap screenshot saved"

# 再点击一个不同位置（测试第二个图块选择）
xcrun simctl io "$SIMULATOR_ID" sendEvent touchBegin 250 380
sleep 0.1
xcrun simctl io "$SIMULATOR_ID" sendEvent touchEnd 250 380
sleep 1

xcrun simctl io "$SIMULATOR_ID" screenshot .allforai/bootstrap/ios-screenshots/ios-04-second-tap.png
```

## 步骤 6：检查崩溃日志

```bash
# 收集启动后的崩溃报告
CRASH_DIR=~/Library/Logs/DiagnosticReports
CRASH_COUNT=$(ls "$CRASH_DIR"/glow-island* 2>/dev/null | wc -l)
echo "Crash reports found: $CRASH_COUNT"

# 若有崩溃，读取最新一条
if [ "$CRASH_COUNT" -gt 0 ]; then
    LATEST_CRASH=$(ls -t "$CRASH_DIR"/glow-island* | head -1)
    echo "Latest crash: $LATEST_CRASH"
    head -30 "$LATEST_CRASH"
fi
```

## 步骤 7：清理

```bash
xcrun simctl terminate "$SIMULATOR_ID" com.glowisland.app 2>/dev/null || true
kill $LAUNCH_PID 2>/dev/null || true
```

## 验收维度

| TC | 描述 | 通过条件 |
|----|------|---------|
| TC-iOS-01 | App 安装成功 | `xcrun simctl install` 返回 exit 0 |
| TC-iOS-02 | App 启动不崩溃 | 无崩溃日志 + 截图非全黑 |
| TC-iOS-03 | 游戏场景加载 | 5秒后截图存在颜色内容（非全黑/全白） |
| TC-iOS-04 | 触控响应 | tap 后截图与 tap 前不同（有视觉变化） |
| TC-iOS-05 | 分辨率适配 | 截图显示内容填满屏幕，无明显错位 |

## 截图评估（自动）

```bash
python3 - <<'EOF'
from PIL import Image
import os, json, sys

screenshots = [
    ".allforai/bootstrap/ios-screenshots/ios-02-game-scene.png",
    ".allforai/bootstrap/ios-screenshots/ios-03-after-tap.png",
]

results = {}
for path in screenshots:
    if not os.path.exists(path):
        results[path] = {"error": "not found"}
        continue
    img = Image.open(path)
    pixels = list(img.getdata())
    unique_colors = len(set(pixels))
    is_black = all(sum(p[:3]) < 30 for p in pixels[:100])
    results[path] = {
        "size": img.size,
        "unique_colors": unique_colors,
        "is_all_black": is_black,
        "has_content": unique_colors > 100 and not is_black
    }

print(json.dumps(results, indent=2))
EOF
```

## 完成标准

```json
{
  "completed_at": "<ISO>",
  "simulator_id": "D9F5F3CA-CC37-4FCA-BCA2-EE268882AF37",
  "simulator_name": "iPhone 17",
  "bundle_id": "com.glowisland.app",
  "build_rebuilt": false,
  "test_cases": {
    "install": "pass|fail",
    "launch_no_crash": "pass|fail",
    "game_scene_loaded": "pass|fail",
    "touch_response": "pass|fail",
    "resolution_fit": "pass|fail"
  },
  "screenshots": [
    ".allforai/bootstrap/ios-screenshots/ios-01-launch.png",
    ".allforai/bootstrap/ios-screenshots/ios-02-game-scene.png",
    ".allforai/bootstrap/ios-screenshots/ios-03-after-tap.png",
    ".allforai/bootstrap/ios-screenshots/ios-04-second-tap.png"
  ],
  "crash_count": 0,
  "code_gaps": [],
  "overall": "pass|partial|fail"
}
```

- `overall == "pass"`: 5/5 TC 通过
- `overall == "partial"`: 安装/启动通过，触控/内容细节有 minor 问题 → 进入 code-repair-loop 修复
- `overall == "fail"`: 安装或启动失败 → code_gaps 列明原因 → code-repair-loop 修复
