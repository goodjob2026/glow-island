---
node_id: canvas2d-level-data
node: canvas2d-level-data
goal: "生成6章×30关=180关关卡配置：步数、异形棋盘layout、特殊图块、难度曲线"
capability: canvas2d-engineer
human_gate: false
hard_blocked_by: []
exit_artifacts:
  - "canvas2d-client/www/src/data/level-data.js"
  - "canvas2d-client/www/src/data/layouts.js"
---

# canvas2d-level-data

## Mission

生成全量180关关卡配置，每章有专属棋盘形状，30关内形状随难度逐步演变。

## 文件结构

- `layouts.js` — 棋盘形状库（字符串掩码）
- `level-data.js` — 180关配置，引用 layouts.js 中的形状

## 关卡数据结构

```js
// level-data.js
import { LAYOUTS } from './layouts.js';

export const LEVELS = {
  "1-1":  {
    steps: 80,
    layout: LAYOUTS.harbor_boat_simple,   // 字符串数组
    types: 3,
    specials: []
  },
  "1-15": {
    steps: 60,
    layout: LAYOUTS.harbor_boat_full,
    types: 4,
    specials: [{ type: 6, count: 1 }]     // 光波×1
  },
  // ... 全部180关
};

export function getLevel(chapter, level) {
  return LEVELS[`${chapter}-${level}`] || null;
}
```

## layouts.js — 六章棋盘形状

`'X'` = 活跃格（放图块），`'_'` = 非活跃格（空洞，路径不可穿越）

### Ch1 码头 — 渔船

**harbor_boat_simple**（关1-10，入门，偏矩形）
```
"_XXXXXXXX_",
"_XXXXXXXXX",
"XXXXXXXXXXX",
"XXXXXXXXXXX",
"_XXXXXXXXX_",
"__XXXXXXX__",
```

**harbor_boat_full**（关11-30，完整船形）
```
"____XXX____",
"___XXXXX___",
"__XXXXXXX__",
"XXXXXXXXXXX",
"XXXXXXXXXXX",
"__XXXXXXX__",
"____XXX____",
```
船头尖锐，中段最宽，两侧空格迫使路径沿船体轮廓或走边框。

---

### Ch2 陶艺 — 陶罐

**pottery_vase_wide**（关1-15）
```
"___XXXXX___",
"__XXXXXXX__",
"_XXXXXXXXX_",
"_XXXXXXXXX_",
"___XXXXX___",  ← 罐颈（最窄处，路径瓶颈）
"__XXXXXXX__",
"_XXXXXXXXX_",
"XXXXXXXXXXX",
```

**pottery_vase_hollow**（关16-30，中心空洞增压）
```
"___XXXXX___",
"__XXXXXXX__",
"_XXX___XXX_",  ← 罐身中部镂空
"_XXX___XXX_",
"___XXXXX___",  ← 罐颈
"__XXXXXXX__",
"XXXXXXXXXXX",
"XXXXXXXXXXX",
```
罐身中部空洞把棋盘分成左右两侧，连线必须绕颈部或走边框。

---

### Ch3 花田 — 五瓣花

**flower_simple**（关1-10）
```
"___XXXXX___",
"__XXXXXXX__",
"_XXXXXXXXX_",
"XXXXXXXXXXX",
"_XXXXXXXXX_",
"__XXXXXXX__",
"___XXXXX___",
```

**flower_petals**（关11-30，五瓣分区）
```
"__XX___XX__",
"_XXXX_XXXX_",
"_XXXXXXXXX_",
"XXXXXXXXXXX",
"XXXXXXXXXXX",
"_XXXXXXXXX_",
"_XXXX_XXXX_",
"__XX___XX__",
```
花瓣间的 `_` 空隙将棋盘切分为5个松散连通区，连线必须在花瓣内绕行或借助边框，
难度来自空间约束而非图块数量。

---

### Ch4 森林 — 圣诞树

**forest_tree_simple**（关1-15）
```
"____XXX____",
"___XXXXX___",
"__XXXXXXX__",
"_XXXXXXXXX_",
"XXXXXXXXXXX",
"____XXX____",
"____XXX____",
```

**forest_tree_dense**（关16-30，多层树 + 树干瓶颈）
```
"_____X_____",
"____XXX____",
"___XXXXX___",
"__XXXXXXX__",
"_XXXXXXXXX_",
"XXXXXXXXXXX",
"XXXXXXXXXXX",
"____XXX____",
"____XXX____",
```
树干仅3格宽，是全图路径的必经瓶颈区，上下区域图块必须绕过树干连接。

---

### Ch5 温泉 — 水滴（中心空洞）

**hotspring_drop**（关1-10）
```
"___XXXXX___",
"__XXXXXXX__",
"_XXXXXXXXX_",
"XXXXXXXXXXX",
"_XXXXXXXXX_",
"__XXXXXXX__",
"___XXXXX___",
```

**hotspring_hollow**（关11-30，核心空洞）
```
"___XXXXX___",
"__XXXXXXX__",
"_XXXXXXXXX_",
"_XXX___XXX_",  ← 中心空洞（3×2格）
"_XXX___XXX_",
"_XXXXXXXXX_",
"__XXXXXXX__",
"___XXXXX___",
```
中心空洞把棋盘分为内环+外环两层，内层图块连接必须走外圈，大幅增加转弯约束。

---

### Ch6 灯塔 — 灯塔剪影（最高难度）

**lighthouse_simple**（关1-15）
```
"____XXX____",
"____XXX____",
"___XXXXX___",
"__XXXXXXX__",
"_XXXXXXXXX_",
"XXXXXXXXXXX",
```

**lighthouse_complex**（关16-30，灯室+镂空底座）
```
"____XXX____",  ← 灯室（3格宽，最受限）
"____XXX____",
"___XXXXX___",  ← 塔身渐宽
"___XXXXX___",
"__XXXXXXX__",
"_X_XXXXX_X_",  ← 底座拱门（中部镂空）
"XXXXX_XXXXX",
"XXXXXXXXXXX",
```
灯室仅3格，是全游戏最窄的路径区域。底座拱门空洞将底部分割为左右两翼，
配合最多图块类型（5种）和最少步数（28步），是全游戏最高压力关卡形态。

---

## 难度曲线

| 章节 | 关卡段 | 形状 | 步数范围 | 类型数 | 特殊图块 |
|------|-------|------|---------|-------|---------|
| Ch1 | 1-10 | 船形（偏矩形） | 80-68 | 3 | 无 |
| Ch1 | 11-20 | 船形（完整） | 65-55 | 4 | 光波 |
| Ch1 | 21-30 | 船形（完整） | 55-45 | 4 | 光波+光链 |
| Ch2 | 1-15 | 陶罐（实心） | 62-50 | 4 | 光波+光链 |
| Ch2 | 16-30 | 陶罐（镂空） | 50-40 | 5 | +穿透+置换 |
| Ch3 | 1-10 | 花形（整体） | 52-46 | 5 | 光波+光链+穿透 |
| Ch3 | 11-30 | 花形（五瓣） | 46-38 | 5 | +连锁 |
| Ch4 | 1-15 | 树形（简单） | 46-40 | 5 | 2种特殊 |
| Ch4 | 16-30 | 树形（密集） | 40-34 | 5 | 3种特殊 |
| Ch5 | 1-10 | 水滴（实心） | 42-38 | 5 | 3种特殊 |
| Ch5 | 11-30 | 水滴（镂空） | 38-30 | 5 | 3-4种特殊 |
| Ch6 | 1-15 | 灯塔（简单） | 36-30 | 5 | 3种特殊 |
| Ch6 | 16-29 | 灯塔（复杂） | 30-28 | 5 | 4种特殊 |
| Ch6 | 30 | 灯塔（复杂） | 25 | 5 | 全部5种 |

## 三星判定标准

| 章节 | ★★★ | ★★☆ | ★☆☆ |
|------|-----|-----|-----|
| Ch1 | 剩余步数≥40% | 10%-40% | 消清即得 |
| Ch2-3 | ≥35% | 10%-35% | 消清即得 |
| Ch4-5 | ≥30% | 10%-30% | 消清即得 |
| Ch6 | ≥25% | 10%-25% | 消清即得 |

## 验收标准

1. `layouts.js` 包含所有6章至少2种变体共≥12个形状定义
2. 每个 layout 中活跃格总数为偶数（保证图块成对）
3. `level-data.js` 包含全部180关数据（LEVELS对象有180个key）
4. 第6章第30关：steps=25，layout=lighthouse_complex，types=5，specials含全部5种
5. 所有 layout 字符串行等长（用 `_` 补齐）
6. `getLevel(chapter, level)` 不存在时返回null，不报错
