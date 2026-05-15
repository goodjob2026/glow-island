---
node_id: canvas2d-obstacles
node: canvas2d-obstacles
goal: "实现8种障碍物系统：冰封/锁链/传送门/单行通道/木箱/杂草/水流/蔓延，按章节解锁"
capability: canvas2d-engineer
human_gate: false
hard_blocked_by:
  - canvas2d-scene-manager
exit_artifacts:
  - "canvas2d-client/www/src/game/ObstacleSystem.js"
---

# canvas2d-obstacles

## Mission

实现全部8种障碍物，每种障碍物有独立的渲染、BFS影响和消除逻辑。
障碍物是图块的覆盖层，不替换图块类型，而是叠加在图块之上。

## 数据模型

```js
// 障碍物存储在独立数组，与 grid 对齐
this.obstacles = [];  // obstacles[r][c] = { type, layers, ... } | null

// 障碍物类型常量
export const OBSTACLE = {
  ICE_BLOCK:         'ice_block',
  CHAIN_LOCK:        'chain_lock',
  PORTAL:            'portal',
  SINGLE_PATH:       'single_path_corridor',
  WOODEN_CRATE:      'wooden_crate',
  WEED:              'weed',
  WATER_CURRENT:     'water_current',
  SPREADING:         'spreading_obstacle',
};
```

## 8种障碍物规格（来自 puzzle-mechanics-spec.json）

### 1. 冰封块（ice_block） — Ch2解锁

- **描述**：图块被冰封，最多2层冰。每次消除相邻图块削一层冰；消至0层后图块正常可选
- **BFS影响**：冰封图块不可连接（除非作为路径终点且冰已消完）
- **渲染**：图块上方覆盖蓝白色冰晶纹理，2层时较厚，1层时半透明裂纹
- **消除**：相邻消除触发削层，SFX: `sfx_ice_crack`

### 2. 锁链（chain_lock） — Ch3解锁

- **描述**：图块被链条锁住（1-3环），需消除该图块本身N次才能解锁
- **BFS影响**：锁链图块可作为消除终点，每次成功消除减一环；0环后图块消失
- **渲染**：图块上方覆盖金属链条纹理，环数越多链越粗
- **消除**：每次配对消除一环，SFX: `sfx_chain_break`

### 3. 传送门（portal） — Ch3解锁

- **描述**：成对出现（A→B），BFS路径进入A时从B继续延伸，不消耗转弯次数
- **BFS影响**：零转弯代价空间折叠（见 gameplay-scene 规格）
- **渲染**：A/B两格各一个蓝紫色漩涡图案，同色代表同组
- **关卡数据**：`portalMap: { "2,3": {r:5,c:7}, "5,7": {r:2,c:3} }`（双向映射）

### 4. 单行通道（single_path_corridor） — Ch4解锁

- **描述**：整行或整列被标记为通道，该行/列只有一条格子可走（中间有墙格阻断）
- **BFS影响**：通道行/列中的墙格（wall_cells）视为非活跃格，路径只能沿通道走
- **渲染**：墙格渲染为深色石墙纹理，通道格正常显示
- **关卡数据**：`corridors: [{ row: 3, wall_cols: [1,2,4,5] }]`

### 5. 木箱（wooden_crate） — Ch4解锁

- **描述**：占据一格，不含图块，需被炸弹或相邻消除破坏（3次打击）
- **BFS影响**：木箱格视为已占用（不可穿越）
- **渲染**：木板箱纹理，每次打击出现裂纹
- **消除**：炸弹直接销毁；相邻图块消除打击一次，SFX: `sfx_crate_hit`

### 6. 杂草（weed） — Ch2解锁

- **描述**：每N步蔓延至相邻空格（N由关卡指定，典型值5步）；蔓延的格子图块无法被选中直到杂草被清除；清除方式：连接杂草覆盖的图块（正常消除）
- **BFS影响**：杂草覆盖格可正常参与BFS，但视觉上高亮提醒
- **渲染**：绿色草叶纹理叠加，蔓延时有生长动画
- **蔓延**：每N步检查 `weed.spread()`，向上下左右随机扩展1格

### 7. 水流（water_current） — Ch5解锁

- **描述**：指定行/列每5秒向指定方向移动1格（溢出从对侧进入）
- **BFS影响**：移动后需重新计算全盘可达性；BFS在稳定状态下计算
- **渲染**：水流方向箭头 + 蓝色波纹动画
- **触发**：定时器，独立于步数，SFX: `sfx_water_flow`

### 8. 蔓延障碍（spreading_obstacle） — Ch6解锁

- **描述**：每隔3步扩散至相邻活跃格；被覆盖的图块无法消除，需用炸弹清除或连接相邻未覆盖图块触发范围消除
- **BFS影响**：蔓延格视为已占用
- **渲染**：深紫色腐蚀纹理，扩散时有侵蚀动画
- **清除**：炸弹3×3范围消除；相邻消除打击一次（需3次清除一格）

## ObstacleSystem.js 接口

```js
export class ObstacleSystem {
  constructor(grid, layout)
  
  // 从关卡数据初始化障碍物
  init(levelData)
  
  // BFS 调用：判断 (r,c) 是否对路径可穿越
  isPassable(r, c)           // 非活跃格/木箱/蔓延障碍 → false
  
  // BFS 调用：Portal 查询
  getPortalExit(r, c)        // 返回 {r,c} 或 null
  
  // 消除触发：检查并处理障碍物
  onMatch(r1, c1, r2, c2)   // 返回额外消除的格子列表
  
  // 炸弹触发：3×3范围处理障碍物
  onBomb(centerR, centerC)
  
  // 步数触发：杂草蔓延/水流移动
  onStep(stepCount)
  
  // 渲染
  draw(renderer, cellSize, offsetX, offsetY)
  
  // 检查关卡目标
  isObstacleGoalMet(goalConfig)
}
```

## 章节解锁顺序

```js
const CHAPTER_OBSTACLES = {
  1: [],
  2: ['ice_block', 'weed'],
  3: ['ice_block', 'weed', 'chain_lock', 'portal'],
  4: ['ice_block', 'weed', 'chain_lock', 'portal', 'single_path_corridor', 'wooden_crate'],
  5: ['ice_block', 'weed', 'chain_lock', 'portal', 'single_path_corridor', 'wooden_crate', 'water_current'],
  6: ['ice_block', 'weed', 'chain_lock', 'portal', 'single_path_corridor', 'wooden_crate', 'water_current', 'spreading_obstacle'],
};
```

## 关卡数据中障碍物格式

```js
{
  obstacles: [
    { type: 'ice_block',  r: 2, c: 3, layers: 2 },
    { type: 'chain_lock', r: 4, c: 1, rings: 2 },
    { type: 'portal',     r: 1, c: 0, pair_id: 'A' },
    { type: 'portal',     r: 5, c: 5, pair_id: 'A' },
    { type: 'weed',       r: 3, c: 3, spread_interval: 5 },
    { type: 'wooden_crate', r: 2, c: 2, hp: 3 },
  ]
}
```

## 验收标准

1. `ObstacleSystem.js` 可实例化，`init()` 正确解析关卡障碍物数据
2. `isPassable()` 正确处理8种障碍物的可穿越性
3. `getPortalExit()` 返回正确出口坐标
4. 冰封块：相邻消除削层，0层后图块可正常操作
5. 锁链：每次消除该格减环，0环后格子消除
6. 杂草：每N步蔓延逻辑正确，蔓延覆盖格不可消除
7. 木箱：被炸弹一次销毁，相邻消除3次后销毁
8. 水流：定时器触发行/列移动，溢出从对侧进入
