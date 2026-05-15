---
node_id: canvas2d-gameplay-quality-qa
node: canvas2d-gameplay-quality-qa
goal: "连连看玩法质量深度评估：边界用例、手感、难度曲线、反馈闭环"
capability: canvas2d-engineer
human_gate: false
hard_blocked_by:
  - canvas2d-gameplay-scene
  - canvas2d-level-data
  - canvas2d-ftue
  - canvas2d-obstacles
  - canvas2d-vfx-effects
exit_artifacts:
  - "canvas2d-client/www/qa/gameplay-quality-report.json"
---

# canvas2d-gameplay-quality-qa

## Mission

不只验证"能运行"，而是深度评估连连看玩法实现质量：规则正确性、手感、难度曲线、反馈闭环。

## 1. BFS 路径规则正确性测试（自动化）

用Node.js直接import TileGrid.js跑单元测试，不依赖浏览器：

```js
// 标准棋盘测试用例（矩形布局）
const cases = [
  { name: "直线消除（0转弯）", expect: true },
  { name: "L形路径（1转弯）", expect: true },
  { name: "Z形路径（2转弯）", expect: true },
  { name: "S形路径（3转弯，超限）", expect: false },
  { name: "边框绕行（棋盘外1格）", expect: true },
  { name: "路径穿过未消除图块", expect: false },
  { name: "两图块类型不同", expect: false },
  { name: "选中位置=空格（已消除）", expect: false },
  { name: "棋盘清空时isCleared()=true", expect: true },
  { name: "hasMoves()无合法对时=false", expect: true },
];

// 异形棋盘测试用例（layout mask）
const shapedCases = [
  {
    name: "非活跃格阻断路径：两图块隔着空洞，直线不可达",
    layout: ["XXXXX", "XX_XX", "XXXXX"],  // 中间行中央为空洞
    // 将同类图块放在空洞两侧，验证路径只能绕外圈
    expect: true  // 通过边框绕行仍然可达（≤2转弯）
  },
  {
    name: "非活跃格无法穿越：空洞隔绝导致>2转弯，路径不存在",
    layout: [
      "XXX_XXX",
      "XXX_XXX",
      "XXX_XXX",
    ],  // 完整竖列空洞，同类图块分列两侧（非角落）
    // 图块在行中间，绕行需要>2转弯
    expect: false
  },
  {
    name: "花瓣形棋盘：同瓣内图块可直连",
    layout: LAYOUTS.flower_petals,
    // 同一花瓣内的两个同类图块，路径验证pass
    expect: true
  },
  {
    name: "花瓣形棋盘：跨瓣连接需走边框",
    layout: LAYOUTS.flower_petals,
    // 左上瓣 vs 右下瓣，路径必须绕整个边框，验证≤2转弯是否可达
    expect: true  // 通过外边框（2次转弯：上→右 or 类似）
  },
  {
    name: "陶罐镂空：左侧图块连右侧图块，必须绕罐颈",
    layout: LAYOUTS.pottery_vase_hollow,
    expect: true
  },
  {
    name: "非活跃格不计入isCleared()：只有活跃格全消才算通关",
    layout: ["X_X", "XXX"],  // 3个非活跃格不影响判断
    expect: true  // 活跃格全消后isCleared()=true
  },
];
```

每个用例构造特定棋盘状态，调用 `_bfsPath()` 验证返回值。

## 2. 步数扣减精度测试

- 每次成功消除：`steps` 精确扣1，不多不少
- 失败点击（路径不通）：`steps` 不变
- 特殊图块消除（如Bomb消3×3、Windmill消整行列）：`steps` 仍只扣1（额外消除不额外扣步）

## 3. Combo 计时器精度测试

```
消除A对 → 等待1.8秒 → 消除B对 → 验证combo=2（未超时）
消除A对 → 等待2.1秒 → 消除B对 → 验证combo=1（已超时重置）
```

Combo倍率验证：
- combo=1 → multiplier=1.0
- combo=2 → multiplier=1.5
- combo=3 → multiplier=2.0
- combo=4+ → multiplier=3.0

## 4. 特殊图块效果验证

按设计文档正确的4种特殊图块：

| 特殊类型 | 测试验证点 |
|----------|-----------|
| Bomb (type=6) | 消除后以炸弹格为中心3×3范围内所有图块清除（无视类型）；爆炸粒子VFX触发 |
| Windmill (type=7) | 消除后整行+整列图块全部清除（十字形）；光柱VFX触发 |
| Lantern (type=8) | 消除后自动寻找最近同类图块连线消除；若无可达同类则持续脉冲等待 |
| Wave (type=9) | 消除后棋盘所有图块随机重排（类型数量不变）；最多重排3次直到有合法对 |

Combo生成验证：
- combo=3时棋盘随机活跃空格生成1个Bomb（type=6）
- combo=4时棋盘随机活跃空格生成1个Windmill（type=7）
- combo=5+时不额外生成，仅累加倍率

## 4b. 障碍物系统正确性测试（ObstacleSystem 单元测试）

用 Node.js 直接 import ObstacleSystem.js 跑单元测试：

```js
// 冰封块削层
const obs = new ObstacleSystem(grid, layout);
obs.init({ obstacles: [{ type: 'ice_block', r: 2, c: 2, layers: 2 }] });
assert(obs.isPassable(2, 2) === false, '冰封格不可穿越');
obs.onMatch(2, 1, 2, 3); // 相邻消除 → 削一层
const layers = obs._obstacles[2][2].layers;
assert(layers === 1, '第一次削层后剩1层');
obs.onMatch(2, 1, 2, 3); // 再次消除
assert(obs._obstacles[2][2] === null, '削至0层后移除障碍物');
assert(obs.isPassable(2, 2) === true, '障碍物移除后可通行');

// Portal 传送
obs.init({ obstacles: [
  { type: 'portal', r: 0, c: 0, pair_id: 'A' },
  { type: 'portal', r: 5, c: 5, pair_id: 'A' },
]});
const exit = obs.getPortalExit(0, 0);
assert(exit.r === 5 && exit.c === 5, 'Portal A (0,0) → (5,5)');
const exitRev = obs.getPortalExit(5, 5);
assert(exitRev.r === 0 && exitRev.c === 0, 'Portal 双向映射');

// 锁链环数递减
obs.init({ obstacles: [{ type: 'chain_lock', r: 3, c: 3, rings: 2 }] });
obs.onMatch(3, 3, 0, 0); // 直接消除锁链格
assert(obs._obstacles[3][3].rings === 1, '第一次消除后剩1环');
obs.onMatch(3, 3, 0, 0);
assert(obs._obstacles[3][3] === null, '环数归零后格子消除');

// 木箱 hp=3，相邻消除打击一次
obs.init({ obstacles: [{ type: 'wooden_crate', r: 2, c: 2, hp: 3 }] });
assert(obs.isPassable(2, 2) === false, '木箱不可通行');
obs.onMatch(2, 1, 2, 3); // 相邻消除 → 打击一次
assert(obs._obstacles[2][2].hp === 2, 'hp: 3→2');

// 杂草N步蔓延
obs.init({ obstacles: [{ type: 'weed', r: 3, c: 3, spread_interval: 5 }] });
for (let i = 0; i < 4; i++) obs.onStep(i);
// 未蔓延（步数<5）
assert(obs._weedCells.size === 1, '4步内未蔓延');
obs.onStep(5);
// 第5步触发蔓延
assert(obs._weedCells.size > 1, '第5步蔓延至相邻格');
```

## 4c. VFX 触发验证（Playwright 截图帧分析）

```js
// 触发 Bomb 消除，截连续10帧（50ms间隔）
const frames = [];
for (let i = 0; i < 10; i++) {
  await page.waitForTimeout(50);
  frames.push(await page.screenshot());
}

// 验证爆炸中间帧存在白色冲击波像素
const hasShockwave = frames.some(buf => hasWhitePixels(buf, threshold=50));
expect(hasShockwave).toBe(true);

// 验证路径连线帧存在 #FFE566 黄色虚线像素
await tapTile(page, 0, 0); // 选中
await tapTile(page, 0, 3); // 消除（触发 showPath 动画）
const pathFrame = await page.screenshot();
expect(hasYellowPixels(pathFrame)).toBe(true); // #FFE566 ± 10
```

## 5. 难度曲线合理性评估

读取level-data.js并分析：
- 第1章步数范围：应在80-45之间，线性下降
- 第6章步数范围：应在38-25之间
- 各章节棋盘尺寸应随章节递增（cols×rows）
- 特殊图块count不超过棋盘面积的5%

输出分析表格：
```
章节 | 平均步数 | 平均格数 | 特殊图块占比
Ch1  | 67.5     | 48       | 0%→3.1%
...
```

## 6. 手感指标评估（Playwright）

- 点击图块到高亮显示 < 100ms（帧延迟）
- 消除动画持续时间：300-500ms（不能太快/太慢）
- 无效点击反馈（震动）：立即出现，持续<400ms
- Combo文字动画：出现<200ms，停留1.5s后消失

## 7. 结算正确性验证

对10个不同步数剩余比例，验证星评计算（所有章节统一标准）：
- 剩余步数≥40% → 3星
- 剩余步数≥20%（<40%）→ 2星
- 剩余步数>0（<20%）→ 1星
- 步数归零时仍有图块 → 失败（0星，触发失败面板）

## 报告格式

```json
{
  "run_at": "...",
  "sections": {
    "bfs_rules": { "total": 10, "pass": 10, "fail": 0 },
    "step_precision": { "pass": true },
    "combo_timer": { "pass": true, "details": {...} },
    "special_tiles": { "total": 5, "pass": 5, "fail": 0 },
    "difficulty_curve": { "pass": true, "analysis": [...] },
    "feel_metrics": { "click_latency_ms": 45, "vanish_anim_ms": 350, "shake_ms": 280 },
    "star_rating": { "total": 10, "pass": 10, "fail": 0 }
  },
  "overall": "pass|fail",
  "blockers": []
}
```

## 验收标准

1. `gameplay-quality-report.json` overall = "pass"
2. BFS规则10个测试用例全部通过
3. 步数扣减精度：0误差
4. Combo计时器：2秒边界误差<50ms
5. 4种特殊图块效果全部验证通过（Bomb/Windmill/Lantern/Wave）
6. 难度曲线：Ch1平均步数>Ch6平均步数，每章单调递减
