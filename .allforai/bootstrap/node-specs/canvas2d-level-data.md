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

### Ch1 码头 — 渔船（3变体）

**harbor_boat_v1**（宽体渔船）
```
"_XXXXXXXXX_",
"XXXXXXXXXXX",
"XXXXXXXXXXX",
"_XXXXXXXXX_",
"__XXXXXXX__",
"____XXX____",
```

**harbor_boat_v2**（尖头船）
```
"_____X_____",
"____XXX____",
"__XXXXXXX__",
"XXXXXXXXXXX",
"XXXXXXXXXXX",
"__XXXXXXX__",
```

**harbor_boat_v3**（双桅船，中间细腰）
```
"__XX___XX__",
"_XXXXXXXXX_",
"XXXXXXXXXXX",
"XXXXXXXXXXX",
"_XXXXXXXXX_",
"__XX___XX__",
```

---

### Ch2 陶艺 — 陶罐（3变体）

**pottery_vase_v1**（高颈罐）
```
"____XXX____",
"___XXXXX___",
"___XXXXX___",
"_XXXXXXXXX_",
"_XXXXXXXXX_",
"XXXXXXXXXXX",
"XXXXXXXXXXX",
```

**pottery_vase_v2**（矮宽罐 + 镂空）
```
"___XXXXX___",
"__XXXXXXX__",
"_XXX___XXX_",
"_XXX___XXX_",
"___XXXXX___",
"__XXXXXXX__",
"XXXXXXXXXXX",
```

**pottery_vase_v3**（双耳陶瓶）
```
"XX_XXXXX_XX",
"XX_XXXXX_XX",
"_XXXXXXXXX_",
"_XXXXXXXXX_",
"__XXXXXXX__",
"___XXXXX___",
"____XXX____",
```

---

### Ch3 花田 — 花朵（3变体）

**flower_v1**（四瓣对称，大间距）
```
"___XX_XX___",
"__XXXXXXX__",
"_XXXXXXXXX_",
"XX_XXXXX_XX",
"_XXXXXXXXX_",
"__XXXXXXX__",
"___XX_XX___",
```

**flower_v2**（六瓣放射）
```
"__XXX_XXX__",
"_XXXXXXXXX_",
"XXXXXXXXXXX",
"XXX_____XXX",
"XXXXXXXXXXX",
"_XXXXXXXXX_",
"__XXX_XXX__",
```

**flower_v3**（花心空洞）
```
"__XXXXXXX__",
"_XXX___XXX_",
"_XX_____XX_",
"_XXX___XXX_",
"__XXXXXXX__",
"_XXXXXXXXX_",
"XXXXXXXXXXX",
```

---

### Ch4 森林 — 树形（3变体）

**forest_v1**（等腰三角树）
```
"_____X_____",
"____XXX____",
"___XXXXX___",
"__XXXXXXX__",
"_XXXXXXXXX_",
"XXXXXXXXXXX",
"____XXX____",
```

**forest_v2**（双峰山脊）
```
"_XXX___XXX_",
"XXXXX_XXXXX",
"XXXXXXXXXXX",
"XXXXXXXXXXX",
"__XXXXXXX__",
"____XXX____",
```

**forest_v3**（松树 + 树根分叉）
```
"____XXX____",
"___XXXXX___",
"__XXXXXXX__",
"_XXXXXXXXX_",
"XXXXXXXXXXX",
"_XX_____XX_",
"_XX_____XX_",
```

---

### Ch5 温泉 — 水滴/泡泡（3变体）

**hotspring_v1**（单水滴，中心空洞）
```
"___XXXXX___",
"__XXXXXXX__",
"_XXX___XXX_",
"_XXX___XXX_",
"_XXXXXXXXX_",
"__XXXXXXX__",
"___XXXXX___",
```

**hotspring_v2**（双泡泡，两区域）
```
"_XXXXX_____",
"XXXXXXX____",
"XXXXXXX____",
"_XXXXXXX___",
"___XXXXXXX_",
"____XXXXXXX",
"_____XXXXX_",
```

**hotspring_v3**（三环嵌套）
```
"__XXXXXXX__",
"_XX_____XX_",
"_X_XXXXX_X_",
"_X_X___X_X_",
"_X_XXXXX_X_",
"_XX_____XX_",
"__XXXXXXX__",
```

---

### Ch6 灯塔 — 灯塔剪影（3变体）

**lighthouse_v1**（标准灯塔）
```
"____XXX____",
"____XXX____",
"___XXXXX___",
"__XXXXXXX__",
"_XXXXXXXXX_",
"XXXXXXXXXXX",
"XXXXXXXXXXX",
```

**lighthouse_v2**（灯塔 + 镂空底座）
```
"____XXX____",
"____XXX____",
"___XXXXX___",
"__XXXXXXX__",
"_X_XXXXX_X_",
"XXXXX_XXXXX",
"XXXXXXXXXXX",
```

**lighthouse_v3**（螺旋塔，每层偏移）
```
"_____XXX___",
"____XXXXX__",
"___XXXXXXX_",
"__XXXXXXXXX",
"_XXXXXXXXX_",
"XXXXXXXXX__",
"XXXXXXXXXXX",
```

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

1. `layouts.js` 包含所有6章各3种变体共≥18个形状定义 + `pickLayout` + `randomTransform` 函数
2. 每个 layout 中活跃格总数为偶数（保证图块成对）
3. 所有 layout 字符串行等长（用 `_` 补齐至最长行）
4. `randomTransform` 对非对称形状（船/灯塔v3）flipH仍然能等长返回
5. `level-data.js` 包含全部180关数据（LEVELS对象有180个key）
6. 每关使用 `layoutPool` 数组（≥1个变体），`getLevel()` 调用时随机选取并变换
7. 第6章第30关：steps=25，layoutPool含lighthouse_v2/v3，types=5，specials含全部5种
8. `getLevel(chapter, level)` 不存在时返回null，不报错
9. 特殊图块只指定 `{ type, count }`，不指定位置（位置由 TileGrid 在活跃格中随机分配）
