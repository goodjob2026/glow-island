---
node_id: canvas2d-client-scaffold
node: canvas2d-client-scaffold
goal: "搭建 Canvas2D 游戏客户端：纯 HTML5 Canvas2D + ES Modules，无框架依赖，Capacitor 移动端打包"
capability: canvas2d-frontend-engineer
human_gate: false
hard_blocked_by: []
exit_artifacts:
  - "canvas2d-client/www/index.html"
  - "canvas2d-client/www/src/main.js"
  - "canvas2d-client/www/src/game/TileGrid.js"
  - "canvas2d-client/www/src/scenes/GameScene.js"
  - "canvas2d-client/capacitor.config.json"
  - "canvas2d-client/android/gradlew"
---

# canvas2d-client-scaffold

## Mission

建立 Glow Island 的第二套游戏客户端（保留 Cocos Creator 客户端不动）。
使用纯 Canvas2D + ES Modules，零构建依赖，通过 Capacitor 打包为 iOS/Android 原生 App。

## 技术选型理由

- **零框架黑盒**：所有渲染代码完全透明，LLM 可直接推理
- **零构建**：ES Modules 在浏览器直接运行，热重载无需 IDE
- **Capacitor**：一条命令把 web app 变成 iOS/Android 原生 App，不依赖 Cocos Creator 的 prebuilt native libs
- **上架可行**：Capacitor + WebView 方案已有大量 App Store 上架案例

## 目录结构

```
canvas2d-client/
├── www/                  # webDir — Capacitor 打包的 web 内容
│   ├── index.html
│   ├── assets/
│   │   ├── tiles/        # 5种图块 PNG
│   │   ├── backgrounds/  # 场景背景
│   │   └── audio/        # 音效
│   └── src/
│       ├── main.js       # 入口：resize / 资源加载 / game loop
│       ├── engine/
│       │   ├── Renderer.js    # Canvas2D draw call 封装
│       │   └── AssetLoader.js # 图片加载缓存
│       ├── game/
│       │   └── TileGrid.js    # Match-3 核心逻辑（无渲染依赖）
│       └── scenes/
│           └── GameScene.js   # 主游戏场景渲染
├── capacitor.config.json
├── package.json          # Capacitor CLI + TypeScript
├── ios/                  # Xcode 工程（cap add ios 生成）
└── android/              # Gradle 工程（cap add android 生成）
```

## 验收标准

- `www/index.html` 存在且可被静态服务器直接访问
- TileGrid 逻辑可 import 运行（8×8网格，5种图块，Match-3 规则）
- GameScene 渲染 HUD + 棋盘，无 JS 错误
- `capacitor.config.json` 存在，appId = `com.glowisland.app`，webDir = `www`
- Android Gradle 工程已生成（`android/gradlew` 可执行）
