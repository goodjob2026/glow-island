---
node_id: canvas2d-capacitor-plugins
node: canvas2d-capacitor-plugins
goal: "安装必需的 Capacitor 插件：IAP、状态栏、键盘、Haptic，生成 Android/iOS 原生配置"
capability: canvas2d-engineer
human_gate: false
hard_blocked_by:
  - canvas2d-client-scaffold
exit_artifacts:
  - "canvas2d-client/www/capacitor.config.json"
  - "canvas2d-client/android/app/src/main/res/values/strings.xml"
---

# canvas2d-capacitor-plugins

## Mission

安装并配置所有 Capacitor 插件，生成平台原生配置文件。
此节点必须在 canvas2d-mobile-build 和 canvas2d-ios-build 之前完成；
canvas2d-shop-scene 依赖 IAP 插件的 JS 接口。

## 所需插件

| 插件 | 用途 |
|------|------|
| `@capacitor-community/in-app-purchases` | IAP 商店购买（Glowstone） |
| `@capacitor/status-bar` | 隐藏状态栏（全屏沉浸） |
| `@capacitor/keyboard` | 防止键盘弹起时缩放 canvas |
| `@capacitor/haptics` | 触觉反馈（Combo 震动） |

## 安装步骤

```bash
cd canvas2d-client

# 安装插件
npm install \
  @capacitor-community/in-app-purchases \
  @capacitor/status-bar \
  @capacitor/keyboard \
  @capacitor/haptics

# 同步到 Android 和 iOS 原生项目
npx cap sync android
npx cap sync ios
```

## capacitor.config.json

写入 `canvas2d-client/www/capacitor.config.json`（如已存在则合并更新）：

```json
{
  "appId": "com.glowisland.canvas2d",
  "appName": "Glow Island",
  "webDir": "www",
  "plugins": {
    "StatusBar": {
      "style": "dark",
      "backgroundColor": "#1a1a2e",
      "overlaysWebView": true
    },
    "Keyboard": {
      "resize": "none",
      "resizeOnFullScreen": false
    }
  }
}
```

## Android 原生配置

### 全屏沉浸模式（MainActivity.java）

```java
// canvas2d-client/android/app/src/main/java/.../MainActivity.java
@Override
protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    // 全屏沉浸：隐藏系统 UI
    getWindow().getDecorView().setSystemUiVisibility(
        View.SYSTEM_UI_FLAG_FULLSCREEN |
        View.SYSTEM_UI_FLAG_HIDE_NAVIGATION |
        View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
    );
}
```

### strings.xml（应用名称）

```xml
<!-- canvas2d-client/android/app/src/main/res/values/strings.xml -->
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">Glow Island</string>
    <string name="title_activity_main">Glow Island</string>
    <string name="package_name">com.glowisland.canvas2d</string>
    <string name="custom_url_scheme">com.glowisland.canvas2d</string>
</resources>
```

## iOS 原生配置

### 状态栏设置（已通过 capacitor.config.json 处理）

确认 `ios/App/App/Info.plist` 包含：
```xml
<key>UIStatusBarHidden</key>
<true/>
<key>UIViewControllerBasedStatusBarAppearance</key>
<false/>
```

若缺失自动写入：
```bash
/usr/libexec/PlistBuddy -c "Add :UIStatusBarHidden bool true" \
  canvas2d-client/ios/App/App/Info.plist 2>/dev/null || \
/usr/libexec/PlistBuddy -c "Set :UIStatusBarHidden true" \
  canvas2d-client/ios/App/App/Info.plist
```

## GameplayScene 触觉反馈集成

```js
// 在 GameplayScene 中，Combo×4 触发震动
import { Haptics, ImpactStyle } from '@capacitor/haptics';

async _triggerHaptic(comboLevel) {
  if (!window.Capacitor?.isNativePlatform()) return; // 浏览器跳过
  if (comboLevel >= 4) {
    await Haptics.impact({ style: ImpactStyle.Heavy });
  } else if (comboLevel >= 2) {
    await Haptics.impact({ style: ImpactStyle.Light });
  }
}
```

## 验收标准

1. `npm install` 成功，`canvas2d-client/node_modules/@capacitor-community/in-app-purchases` 目录存在
2. `npx cap sync android` exit code = 0
3. `npx cap sync ios` exit code = 0（如 ios 目录存在）
4. `capacitor.config.json` 已写入，包含正确 appId
5. `android/app/src/main/res/values/strings.xml` 存在，app_name = "Glow Island"
