---
node_id: canvas2d-dialog-scene
node: canvas2d-dialog-scene
goal: "实现NPC对话场景：章节故事对话、日记碎片、律×ひなた情感线"
capability: canvas2d-engineer
human_gate: false
hard_blocked_by:
  - canvas2d-scene-manager
exit_artifacts:
  - "canvas2d-client/www/src/scenes/DialogScene.js"
  - "canvas2d-client/www/src/data/dialog-data.js"
---

# canvas2d-dialog-scene

## Mission

实现 NPC 对话系统，承载6章叙事情感线（律×ひなた）和日记碎片收集。

## 参考世界观

- 主角：山田律（東京来的建筑师，精疲力竭逃来岛上）
- NPC：丸山ひなた（灯台守的孙女，负责守护荒废的輝島）
- 叙事核心：律帮助修复小岛废弃家园，与ひなた慢慢产生情感

## 场景触发时机

1. 章节首次进入时（关卡1之前）：开场对话
2. 章节最后一关通关后：结尾对话 + 日记碎片解锁
3. 岛屿地图点击NPC标志：日记翻阅

## 布局

```
┌─────────────────────────────────────┐
│                                     │
│         [背景图：章节场景]            │
│                                     │
│  [NPC立绘占位：左/右交替]             │
│                                     │
├─────────────────────────────────────┤
│ [ひなた]                             │  ← 说话者姓名
│ 「欢迎来到码头。你就是要来修缮          │  ← 对话文字逐字显示
│   废弃旅馆的建筑师吗？」               │
│                              [下一句]│
└─────────────────────────────────────┘
```

## 渲染规则

- 对话框：底部占屏幕1/3，半透明黑色圆角矩形
- 说话者姓名：左上角，章节主题色
- 文字逐字显示（打字机效果，每字间隔50ms）
- 点击屏幕：加速显示（跳过打字机）→ 再点击进入下一句
- NPC立绘：左右交替站位，纯色方块占位（无美术时用文字代替）

## dialog-data.js 结构

```js
export const DIALOGS = {
  ch1_intro: [
    { speaker: "ひなた", text: "欢迎来到码头。你就是要来修缮废弃旅馆的建筑师吗？" },
    { speaker: "律", text: "是的……我是山田律。这里……比想象中更安静。" },
    { speaker: "ひなた", text: "安静？大家都说太荒废了。但我觉得，它只是在等待。" }
  ],
  ch1_outro: [
    { speaker: "ひなた", text: "码头的木桩都换新了……真的很厉害。" },
    { speaker: "律", text: "（她笑起来，海风吹过……这种感觉，东京没有。）" },
    { diary: "日记碎片①：第一天的码头，日落时分，海浪声像城市噪音的反面。" }
  ],
  ch2_intro: [ /* 陶艺章节 */ ],
  ch2_outro: [ /* ... */ ],
  ch3_intro: [], ch3_outro: [],
  ch4_intro: [], ch4_outro: [],
  ch5_intro: [], ch5_outro: [],
  ch6_intro: [], ch6_outro: [
    { speaker: "ひなた", text: "灯塔亮了……爷爷说，灯塔亮着，迷路的船就能回家。" },
    { speaker: "律", text: "（这座岛，也让我找到了回家的路。）" },
    { diary: "日记碎片⑥：最后一页空白，我想留着，万一还想再来。" }
  ]
};
```

## 日记碎片

- 6章各1篇，通关章节最后一关后解锁
- 可在岛屿地图角落的"日记本"图标查阅
- 样式：泛黄纸张纹理 + 手写风格字体（仿用Canvas斜体渲染）

## DialogScene 接口

```js
export class DialogScene {
  constructor(sceneManager, renderer, assets, audio, progress)
  init({ dialogKey, onComplete })
  // 播放完对话后调用 onComplete()
  update(dt)
  draw()
  onTap(x, y)
}
```

## 验收标准

1. `DialogScene.js` 可实例化，接受 dialogKey 参数播放对话序列
2. 打字机效果正确，点击加速/跳过
3. 含 diary 字段时显示日记碎片弹出动画，写入 progress
4. 所有6章 intro/outro 对话数据在 dialog-data.js 中定义
