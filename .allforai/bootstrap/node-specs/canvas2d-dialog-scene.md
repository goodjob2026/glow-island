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
  ch2_intro: [
    { speaker: "ひなた", text: "陶艺工坊……是岛上的老奶奶留下来的。她说，手里有泥土，心就定下来了。" },
    { speaker: "律", text: "那些破损的陶罐，还能修吗？" },
    { speaker: "ひなた", text: "当然。金缮，就是用金子填补裂缝。缺口也可以变成最美的部分。" },
    { speaker: "律", text: "（她说的，好像不只是陶罐。）" },
  ],
  ch2_outro: [
    { speaker: "ひなた", text: "你看，窑里的火……它能把泥土变成不一样的东西。" },
    { speaker: "律", text: "有点像修复这座岛——原来的样子找不回来了，但新的也很好。" },
    { speaker: "ひなた", text: "（她怔了一下，然后笑了。）对，新的也很好。" },
    { diary: "日记碎片②：陶艺课，她的手上全是泥。我不知道为什么，觉得那一刻很美。" },
  ],
  ch3_intro: [
    { speaker: "ひなた", text: "花田是最难修复的……因为你得等。种下去，等春天，等它自己开。" },
    { speaker: "律", text: "我这个人……不太会等。" },
    { speaker: "ひなた", text: "我知道。城市里的人都不会等。所以你来这里，是件好事。" },
    { speaker: "律", text: "（这是什么逻辑……但我没有反驳。）" },
  ],
  ch3_outro: [
    { speaker: "ひなた", text: "开了！你看，薰衣草开了！" },
    { speaker: "律", text: "等了这么久……" },
    { speaker: "ひなた", text: "值得的事情都要等。你还没发现吗？" },
    { speaker: "律", text: "（发现什么？她转过头来，风把她的头发吹乱了。我什么都没说。）" },
    { diary: "日记碎片③：花田里，她说值得的事情都要等。我把这句话写下来，怕忘掉。" },
  ],
  ch4_intro: [
    { speaker: "ひなた", text: "森林里有一棵老松树，爷爷说，它比岛上任何人活得都久。" },
    { speaker: "律", text: "那棵树见证了岛上所有的事？" },
    { speaker: "ひなた", text: "我觉得是的。所以我们修路的时候绕开它，宁愿多走一圈。" },
    { speaker: "律", text: "……我们东京有人为了修路砍掉百年树龄的樟树。" },
    { speaker: "ひなた", text: "我知道。所以你来这里了。" },
  ],
  ch4_outro: [
    { speaker: "ひなた", text: "你种的那棵小树苗……活了。" },
    { speaker: "律", text: "真的吗？我以为我浇水太多了。" },
    { speaker: "ひなた", text: "（笑）所以说嘛，太用力有时候也没关系的。" },
    { speaker: "律", text: "（她说话越来越让我不知道怎么接。）" },
    { diary: "日记碎片④：森林的早晨有鸟叫。我睡到自然醒，已经忘了这是什么感觉。" },
  ],
  ch5_intro: [
    { speaker: "ひなた", text: "温泉……爷爷说当年岛上来过很多人泡温泉，然后就再也没有了。" },
    { speaker: "律", text: "为什么没有了？" },
    { speaker: "ひなた", text: "因为没有人维护。好的东西，需要有人在意它。" },
    { speaker: "律", text: "（她低头看水，我突然不知道她在想什么。）" },
  ],
  ch5_outro: [
    { speaker: "律", text: "水烫，但……很舒服。" },
    { speaker: "ひなた", text: "对吧。这就是温泉的意思——你什么都不用做，只是泡在里面。" },
    { speaker: "律", text: "我上一次什么都不做是什么时候……想不起来了。" },
    { speaker: "ひなた", text: "那说明你该留下来再待一段时间。" },
    { speaker: "律", text: "（留下来。她说得好像很自然。）" },
    { diary: "日记碎片⑤：温泉很热，星星很亮，她不说话的时候，沉默也不让人不安。" },
  ],
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
