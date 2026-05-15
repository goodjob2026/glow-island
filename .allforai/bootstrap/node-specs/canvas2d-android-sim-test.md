---
node_id: canvas2d-android-sim-test
node: canvas2d-android-sim-test
goal: "在 Pixel9a 模拟器上自动化测试 Canvas2D APK：启动、渲染、触控交互"
capability: mobile-qa-engineer
human_gate: false
hard_blocked_by:
  - canvas2d-mobile-build
exit_artifacts:
  - ".allforai/canvas2d/qa/android-sim-report.json"
  - ".allforai/canvas2d/qa/screenshots/android-launch.png"
  - ".allforai/canvas2d/qa/screenshots/android-after-tap.png"
---

# canvas2d-android-sim-test

## Mission

在 Pixel9a Android 模拟器上对 Capacitor APK 做自动化功能测试。

## 环境要求

- `adb devices` 返回 `emulator-XXXX device`
- APK 已安装（来自 canvas2d-mobile-build）

## 步骤

### 1. 确认模拟器在线

```bash
EMULATOR=$(adb devices | grep "emulator.*device" | head -1 | cut -f1)
if [ -z "$EMULATOR" ]; then
  ~/Library/Android/sdk/emulator/emulator -avd Pixel9a -no-snapshot-load &
  adb wait-for-device
fi
echo "Device: $EMULATOR"
```

### 2. 安装/更新 APK

```bash
APK=canvas2d-client/android/app/build/outputs/apk/debug/app-debug.apk
adb install -r "$APK"
```

### 3. TC-A1: 启动不崩溃

```bash
adb shell am start -n com.glowisland.app/.MainActivity
sleep 6
adb exec-out screencap -p > .allforai/canvas2d/qa/screenshots/android-launch.png
```

截图分析：
- 非全黑（unique colors > 100）
- 可见棋盘区域

```bash
python3 -c "
from PIL import Image
img = Image.open('.allforai/canvas2d/qa/screenshots/android-launch.png')
px = list(img.getdata())
unique = len(set(px[:2000]))
print('unique_colors:', unique)
print('pass:', unique > 100)
"
```

### 4. TC-A2: 触控交互

使用 UI automator dump 精确获取棋盘边界，然后点击相邻图块：

```bash
adb shell uiautomator dump /sdcard/ui.xml
adb pull /sdcard/ui.xml /tmp/ui.xml
# 获取屏幕尺寸
SIZE=$(adb shell wm size | grep -o '[0-9]*x[0-9]*')
W=$(echo $SIZE | cut -dx -f1)
H=$(echo $SIZE | cut -dx -f2)

# 点击棋盘中心偏上 (约1/4高度)
TAP1_X=$((W / 2))
TAP1_Y=$((H / 4))
adb shell input tap $TAP1_X $TAP1_Y
sleep 1

# 点击相邻格子（右移一格，约等于 tileSize ≈ W/8）
TAP2_X=$((W / 2 + W / 8))
TAP2_Y=$((H / 4))
adb shell input tap $TAP2_X $TAP2_Y
sleep 2

adb exec-out screencap -p > .allforai/canvas2d/qa/screenshots/android-after-tap.png
```

截图对比：after-tap 与 launch 的像素差异 > 1%（说明棋盘有变化）。

### 5. TC-A3: 崩溃检查

```bash
CRASH_COUNT=$(ls ~/Library/Logs/DiagnosticReports/com.glowisland* 2>/dev/null | wc -l)
echo "Crashes: $CRASH_COUNT"
```

### 6. 输出报告

```json
{
  "completed_at": "<ISO>",
  "simulator": "Pixel9a",
  "bundle_id": "com.glowisland.app",
  "test_cases": {
    "install": "pass|fail",
    "launch_no_crash": "pass|fail",
    "renders_game": "pass|fail",
    "touch_interaction": "pass|fail"
  },
  "unique_colors_at_launch": <int>,
  "crash_count": 0,
  "screenshots": [
    ".allforai/canvas2d/qa/screenshots/android-launch.png",
    ".allforai/canvas2d/qa/screenshots/android-after-tap.png"
  ],
  "overall": "pass|partial|fail"
}
```

写入 `.allforai/canvas2d/qa/android-sim-report.json`
