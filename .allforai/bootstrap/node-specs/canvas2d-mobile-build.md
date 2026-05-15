---
node_id: canvas2d-mobile-build
node: canvas2d-mobile-build
goal: "用 Capacitor + Gradle 构建 Android debug APK，验证安装成功"
capability: mobile-build-engineer
human_gate: false
hard_blocked_by:
  - canvas2d-browser-qa
exit_artifacts:
  - ".allforai/canvas2d/build/mobile-build-report.json"
  - "canvas2d-client/android/app/build/outputs/apk/debug/app-debug.apk"
---

# canvas2d-mobile-build

## Mission

用 Capacitor sync + Gradle 构建 Android APK，安装到模拟器。

## 步骤

### 1. Sync web assets to native

```bash
cd canvas2d-client
npx cap sync android 2>&1
```

验收：`✔ copy android` + `✔ update android` 均出现。

### 2. Build APK

```bash
ANDROID_HOME=~/Library/Android/sdk \
ANDROID_NDK_HOME=~/Library/Android/sdk/ndk/28.2.13676358 \
canvas2d-client/android/gradlew \
  -p canvas2d-client/android \
  assembleDebug 2>&1 | tail -5
```

验收：最后一行包含 `BUILD SUCCESSFUL`。

### 3. 确认 APK 存在

```bash
APK=canvas2d-client/android/app/build/outputs/apk/debug/app-debug.apk
ls -lh "$APK"
```

APK 大小应在 3–15 MB 之间（web assets + Capacitor runtime）。

### 4. 安装到模拟器（如果在线）

```bash
adb devices | grep -q "device$" && adb install -r "$APK" && echo "installed"
```

### 5. 输出报告

```json
{
  "completed_at": "<ISO>",
  "platform": "android",
  "apk_path": "canvas2d-client/android/app/build/outputs/apk/debug/app-debug.apk",
  "apk_size_mb": "<float>",
  "build_result": "success|fail",
  "install_result": "success|skipped|fail",
  "build_log_tail": "<last 5 lines>"
}
```

写入 `.allforai/canvas2d/build/mobile-build-report.json`

## iOS 构建（可选，需要 Xcode + Apple 账号）

```bash
cd canvas2d-client
npx cap sync ios
npx cap build ios
```

注意：Capacitor 的 iOS build 不依赖 Cocos Creator prebuilt libs，
不会遇到 LC_VERSION_MIN_IPHONEOS / LC_BUILD_VERSION 问题。
