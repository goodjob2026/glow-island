---
node_id: canvas2d-level-data
node: canvas2d-level-data
goal: "生成6章×30关=180关关卡配置：步数、异形棋盘layoutPool随机选取、特殊图块随机落点"
capability: canvas2d-engineer
human_gate: false
hard_blocked_by: []
exit_artifacts:
  - "canvas2d-client/www/src/data/level-data.js"
  - "canvas2d-client/www/src/data/layouts.js"
---

# canvas2d-level-data

## Mission

生成全量180关关卡配置。每关有一个 `layoutPool`（同主题形状池），进关时随机选取一个，
特殊图块位置在活跃格中随机落点，保证每次游玩体验不同。

## 随机策略

| 元素 | 是否随机 | 说明 |
|------|---------|------|
| 棋盘形状变体 | ✅ 每次进关随机 | 从 layoutPool 随机选1个，重试=新形状 |
| 形状镜像/旋转 | ✅ 对称形状自动变换 | 花/水滴/树形4方向随机，等效形状数×4 |
| 特殊图块位置 | ✅ 随机落点 | count 指定数量，位置在活跃格中随机 |
| 图块排列 | ✅ 已有shuffle | 每次进关重新随机 |
| 步数上限 | ❌ 固定 | 影响三星判定，不可变 |
| 图块类型数 | ❌ 固定 | 决定难度基线 |

## 文件结构

- `layouts.js` — 棋盘形状库 + 随机选取/变换函数
- `level-data.js` — 180关配置，使用 layoutPool

## 关卡数据结构

```js
// level-data.js
import { LAYOUTS, pickLayout } from './layouts.js';

export const LEVELS = {
  "1-1": {
    steps: 80,
    layoutPool: [                          // 同主题多变体，进关时随机选1个
      LAYOUTS.harbor_boat_simple_v1,
      LAYOUTS.harbor_boat_simple_v2,
    ],
    types: 3,
    specials: []                           // count+type，位置在TileGrid._init()中随机
  },
  "1-15": {
    steps: 60,
    layoutPool: [
      LAYOUTS.harbor_boat_full_v1,
      LAYOUTS.harbor_boat_full_v2,
      LAYOUTS.harbor_boat_full_v3,
    ],
    types: 4,
    specials: [{ type: 6, count: 1 }]
  },
  // ... 全部180关
};

export function getLevel(chapter, level) {
  const lvl = LEVELS[`${chapter}-${level}`];
  if (!lvl) return null;
  return {
    ...lvl,
    layout: pickLayout(lvl.layoutPool),    // 调用时随机选取+随机变换
  };
}
```

## layouts.js — 形状库与随机函数

```js
// 随机选取 + 随机镜像/旋转（对称形状4方向）
export function pickLayout(pool) {
  const base = pool[Math.floor(Math.random() * pool.length)];
  return randomTransform(base);
}

// 对行列对称的形状应用随机翻转
function randomTransform(layout) {
  const flipH = Math.random() < 0.5;  // 水平翻转
  const flipV = Math.random() < 0.5;  // 垂直翻转
  let rows = [...layout];
  if (flipV) rows = rows.reverse();
  if (flipH) rows = rows.map(r => r.split('').reverse().join(''));
  return rows;
}
```

每章 3 个基础形状变体，加上随机翻转，等效形状数 = 3×4 = 12种/章。

## layouts.js — 六章棋盘形状

`'X'` = 活跃格（放图块），`'_'` = 非活跃格（空洞，路径不可穿越）
每章提供 3 个变体，进关时随机选一个再随机镜像/旋转。

**严格约束：**
- 每行字符数 = 该章棋盘列数（Ch1=6, Ch2=7, Ch3=8, Ch4=8, Ch5=9, Ch6=10）
- 行数 = 该章棋盘行数（Ch1=6, Ch2=7, Ch3=8, Ch4=8, Ch5=9, Ch6=10）
- 每个 layout 活跃格总数必须为偶数（图块成对消除）
- 每行等长，禁止补齐后不等

### Ch1 码头 — 渔船（3变体，6行×6列）

**harbor_boat_v1**（船壳形，船头船尾收窄）
```js
// 活跃格: 4+6+6+4+2+2 = 24 ✓
"_XXXX_",
"XXXXXX",
"XXXXXX",
"_XXXX_",
"__XX__",
"__XX__",
```

**harbor_boat_v2**（收尖船头，侧翼渐宽）
```js
// 活跃格: 2+3+5+6+4+2 = 22 ✓
"__XX__",
"__XXX_",
"_XXXXX",
"XXXXXX",
"_XXXX_",
"__XX__",
```

**harbor_boat_v3**（双体船，中间有水道）
```js
// 活跃格: 4+6+6+4+4+4 = 28 ✓
"XX__XX",
"XXXXXX",
"XXXXXX",
"XX__XX",
"XX__XX",
"_XXXX_",
```

---

### Ch2 陶艺 — 陶罐（3变体，7行×7列）

**pottery_vase_v1**（高颈罐，颈部细腰）
```js
// 活跃格: 3+5+2+5+5+7+7 = 34 ✓
"__XXX__",
"_XXXXX_",
"_X___X_",
"_XXXXX_",
"_XXXXX_",
"XXXXXXX",
"XXXXXXX",
```

**pottery_vase_v2**（圆肚矮罐，罐口镂空）
```js
// 活跃格: 3+2+5+7+7+5+3 = 32 ✓
"__XXX__",
"_X___X_",
"_XXXXX_",
"XXXXXXX",
"XXXXXXX",
"_XXXXX_",
"__XXX__",
```

**pottery_vase_v3**（双耳陶瓶，上窄下宽）
```js
// 活跃格: 4+7+7+5+3+3+1 = 30 ✓
"XX___XX",
"XXXXXXX",
"XXXXXXX",
"_XXXXX_",
"__XXX__",
"__XXX__",
"___X___",
```

---

### Ch3 花田 — 花朵（3变体，8行×8列）

**flower_v1**（椭圆花形，上下收窄）
```js
// 活跃格: 2+6+6+8+8+6+6+2 = 44 ✓
"___XX___",
"_XXXXXX_",
"_XXXXXX_",
"XXXXXXXX",
"XXXXXXXX",
"_XXXXXX_",
"_XXXXXX_",
"___XX___",
```

**flower_v2**（六瓣花，花瓣间缝隙）
```js
// 活跃格: 4+4+6+8+8+6+4+4 = 44 ✓
"__XXXX__",
"_XX__XX_",
"XX_XX_XX",
"XXXXXXXX",
"XXXXXXXX",
"XX_XX_XX",
"_XX__XX_",
"__XXXX__",
```

**flower_v3**（花心空洞，内外两圈）
```js
// 活跃格: 2+4+4+6+6+4+4+2 = 32 ✓
"___XX___",
"__XXXX__",
"_XX__XX_",
"_XXXXXX_",
"_XXXXXX_",
"_XX__XX_",
"__XXXX__",
"___XX___",
```

---

### Ch4 森林 — 树形（3变体，8行×8列）

**forest_v1**（等腰三角松，树干居中）
```js
// 活跃格: 2+4+6+8+8+6+2+2 = 38 ✓
"___XX___",
"__XXXX__",
"_XXXXXX_",
"XXXXXXXX",
"XXXXXXXX",
"_XXXXXX_",
"___XX___",
"___XX___",
```

**forest_v2**（双峰山脊，中间谷地）
```js
// 活跃格: 6+8+8+8+4+2+2+2 = 40 ✓
"_XXX_XXX",
"XXXXXXXX",
"XXXXXXXX",
"XXXXXXXX",
"__XXXX__",
"___XX___",
"___XX___",
"___XX___",
```

**forest_v3**（松树+树根分叉）
```js
// 活跃格: 2+4+6+8+8+6+4+4 = 42 ✓
"___XX___",
"__XXXX__",
"_XXXXXX_",
"XXXXXXXX",
"XXXXXXXX",
"_XXXXXX_",
"_XX__XX_",
"_XX__XX_",
```

---

### Ch5 温泉 — 水滴/泡泡（3变体，9行×9列）

**hotspring_v1**（水滴形，中心空洞）
```js
// 活跃格: 1+3+5+7+6+7+5+3+1 = 38 ✓
"____X____",
"___XXX___",
"__XXXXX__",
"_XXXXXXX_",
"_XXX_XXX_",
"_XXXXXXX_",
"__XXXXX__",
"___XXX___",
"____X____",
```

**hotspring_v2**（双泡泡，两区域对角分布）
```js
// 活跃格: 5+7+7+6+7+7+7+5+3 = 54 ✓
"_XXXXX___",
"XXXXXXX__",
"XXXXXXX__",
"_XXXXXX__",
"__XXXXXXX",
"__XXXXXXX",
"__XXXXXXX",
"___XXXXX_",
"____XXX__",
```

**hotspring_v3**（三层嵌套环，中心可达）
```js
// 活跃格: 3+5+4+4+4+5+5+7+5 = 42 ✓
"___XXX___",
"__XXXXX__",
"_XX___XX_",
"_XX___XX_",
"_XX___XX_",
"__XXXXX__",
"__XXXXX__",
"_XXXXXXX_",
"__XXXXX__",
```

---

### Ch6 灯塔 — 灯塔剪影（3变体，10行×10列）

**lighthouse_v1**（标准灯塔，塔身渐宽）
```js
// 活跃格: 2+2+4+6+8+8+10+10+10+10 = 70 ✓
"____XX____",
"____XX____",
"___XXXX___",
"__XXXXXX__",
"_XXXXXXXX_",
"_XXXXXXXX_",
"XXXXXXXXXX",
"XXXXXXXXXX",
"XXXXXXXXXX",
"XXXXXXXXXX",
```

**lighthouse_v2**（灯塔+镂空底座拱门）
```js
// 活跃格: 2+2+4+6+8+8+10+10+10+10 = 70 ✓
"____XX____",
"____XX____",
"___XXXX___",
"__XXXXXX__",
"_XXXXXXXX_",
"XX_XXXX_XX",
"XXXXXXXXXX",
"XXXXXXXXXX",
"XXXXXXXXXX",
"XXXXXXXXXX",
```

**lighthouse_v3**（螺旋塔，每层向右偏移）
```js
// 活跃格: 2+4+6+8+9+9+8+6+10+10 = 72 ✓
"_____XX___",
"____XXXX__",
"___XXXXXX_",
"__XXXXXXXX",
"_XXXXXXXXX",
"XXXXXXXXX_",
"XXXXXXXX__",
"XXXXXX____",
"XXXXXXXXXX",
"XXXXXXXXXX",
```

---

## 难度曲线

棋盘尺寸按章节固定（来自设计文档）：
Ch1=6×6，Ch2=7×7，Ch3=8×8，Ch4=8×8，Ch5=9×9，Ch6=10×10

特殊图块对应设计文档的4种：Bomb(type=6)、Windmill(type=7)、Lantern(type=8)、Wave(type=9)

| 章节 | 关卡段 | 形状 | 棋盘 | 步数范围 | 类型数 | 特殊图块 |
|------|-------|------|------|---------|-------|---------|
| Ch1 | 1-10 | 船形（偏矩形） | 6×6 | 80-68 | 3 | 无 |
| Ch1 | 11-20 | 船形（完整） | 6×6 | 65-55 | 4 | Wave |
| Ch1 | 21-30 | 船形（完整） | 6×6 | 55-45 | 4 | Wave+Lantern |
| Ch2 | 1-15 | 陶罐（实心） | 7×7 | 62-50 | 4 | Wave+Lantern |
| Ch2 | 16-30 | 陶罐（镂空） | 7×7 | 50-40 | 5 | +Bomb |
| Ch3 | 1-10 | 花形（整体） | 8×8 | 52-46 | 5 | Wave+Lantern+Bomb |
| Ch3 | 11-30 | 花形（五瓣） | 8×8 | 46-38 | 5 | +Windmill |
| Ch4 | 1-15 | 树形（简单） | 8×8 | 46-40 | 5 | Bomb+Windmill |
| Ch4 | 16-30 | 树形（密集） | 8×8 | 40-34 | 5 | Bomb+Windmill+Wave |
| Ch5 | 1-10 | 水滴（实心） | 9×9 | 42-38 | 5 | 3种特殊 |
| Ch5 | 11-30 | 水滴（镂空） | 9×9 | 38-30 | 5 | 3-4种特殊 |
| Ch6 | 1-15 | 灯塔（简单） | 10×10 | 36-30 | 5 | 3种特殊 |
| Ch6 | 16-29 | 灯塔（复杂） | 10×10 | 30-28 | 5 | 全部4种 |
| Ch6 | 30 | 灯塔（复杂） | 10×10 | 25 | 5 | 全部4种（多个） |

## 三星判定标准（所有章节统一）

| ★★★ | ★★☆ | ★☆☆ |
|-----|-----|-----|
| 剩余步数≥40% | 剩余步数≥20% | 清关即得（剩余步数>0）|

## 验收标准

1. `layouts.js` 包含所有6章各3种变体共≥18个形状定义 + `pickLayout` + `randomTransform` 函数
2. 每个 layout 中活跃格总数为偶数（保证图块成对）
3. 所有 layout 字符串行等长（用 `_` 补齐至最长行）
4. `randomTransform` 对非对称形状（船/灯塔v3）flipH仍然能等长返回
5. `level-data.js` 包含全部180关数据（LEVELS对象有180个key）
6. 每关使用 `layoutPool` 数组（≥1个变体），`getLevel()` 调用时随机选取并变换
7. 第6章第30关：steps=25，layoutPool含lighthouse_v2/v3，types=5，specials含全部5种
8. `getLevel(chapter, level)` 不存在时返回null，不报错
9. 特殊图块只指定 `{ type, count }`，不指定位置（位置由 TileGrid 在活跃格中随机分配）
