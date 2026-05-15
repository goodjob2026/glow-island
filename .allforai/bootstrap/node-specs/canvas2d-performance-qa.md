---
node_id: canvas2d-performance-qa
node: canvas2d-performance-qa
goal: "性能基线验收：帧率≥30fps、内存不泄漏、Canvas2D绘制延迟、多关卡连续游玩压力测试"
capability: canvas2d-engineer
human_gate: false
hard_blocked_by:
  - canvas2d-gameplay-scene
  - canvas2d-vfx-effects
exit_artifacts:
  - "canvas2d-client/www/qa/performance-report.json"
---

# canvas2d-performance-qa

## Mission

量化 Canvas2D 游戏的运行时性能。连连看的性能危险点是：粒子爆炸帧、大棋盘重绘、
多关卡连续游玩后的内存堆积。不达标的帧率和内存泄漏必须在 browser-qa 之前修复。

## 工具

Playwright + Chrome（使用 `--enable-precise-memory-info` flag 开启 `performance.memory`）：

```bash
cd canvas2d-client
npx playwright test performance.spec.js \
  --browser=chromium \
  --headed=false \
  -- \
  --chromium-flags="--enable-precise-memory-info"
```

## 1. 帧率基线测试（FPS Baseline）

### 测试场景

| 场景 | 触发方式 | 目标帧率 |
|------|---------|---------|
| 空闲棋盘（无动画）| 进入 GameplayScene，不操作 | ≥ 55 fps |
| 消除动画（showTileVanish）| 触发1对消除 | ≥ 45 fps |
| 炸弹爆炸（showBomb + 粒子）| 触发 Bomb 消除 | ≥ 30 fps |
| FEVER 全屏效果 | 注入 Combo=4 | ≥ 30 fps |
| 章节解锁粒子（60粒子）| 触发 showChapterUnlock | ≥ 25 fps（允许短暂抖动）|

### 测量方法

```js
// performance.spec.js 中
async function measureFPS(page, durationMs = 2000) {
  return await page.evaluate(async (dur) => {
    return new Promise(resolve => {
      const frames = [];
      let start = null;
      function tick(ts) {
        if (!start) start = ts;
        frames.push(ts);
        if (ts - start < dur) requestAnimationFrame(tick);
        else {
          const totalSecs = (frames[frames.length-1] - frames[0]) / 1000;
          const avgFPS = (frames.length - 1) / totalSecs;
          const minFPS = frames.slice(1).reduce((min, ts, i) => {
            const fps = 1000 / (ts - frames[i]);
            return Math.min(min, fps);
          }, Infinity);
          resolve({ avgFPS: Math.round(avgFPS), minFPS: Math.round(minFPS), frameCount: frames.length });
        }
      }
      requestAnimationFrame(tick);
    });
  }, durationMs);
}
```

### 通过标准

| 指标 | 最低要求 |
|------|---------|
| 空闲 avgFPS | ≥ 55 |
| 消除动画 avgFPS | ≥ 45 |
| 炸弹爆炸 minFPS | ≥ 30（P0 阻塞项） |
| FEVER avgFPS | ≥ 30（P0 阻塞项） |

## 2. 内存泄漏测试

### 测试流程

```
进入 GameplayScene(1-1) → 完成关卡 → 回到岛图 → 再进 GameplayScene(1-2) → ...
重复 5 次完整关卡循环
```

每次循环前后记录 `performance.memory.usedJSHeapSize`：

```js
async function getHeapMB(page) {
  return await page.evaluate(() =>
    (performance.memory?.usedJSHeapSize || 0) / 1024 / 1024
  );
}

const heaps = [];
for (let i = 0; i < 5; i++) {
  await playOneLevel(page);
  heaps.push(await getHeapMB(page));
}

// 线性回归斜率：每关卡堆增量
const growthPerLevel = linearSlope(heaps);
```

### 通过标准

| 指标 | 要求 |
|------|------|
| 5关循环后堆增量/关 | < 5 MB（P0：<10 MB） |
| 堆总量（5关后）| < 150 MB |
| 粒子数组在关卡结束后 | = 0（VFXSystem._particles.length） |

粒子数组检查（最容易泄漏的地方）：

```js
// 关卡结束、场景 destroy() 后检查
const particleCount = await page.evaluate(() =>
  window._vfxSystem?._particles?.length ?? 0
);
expect(particleCount).toBe(0); // destroy() 必须清空粒子
```

## 3. Canvas2D 绘制延迟（Draw Call Timing）

测量每帧 `draw()` 函数耗时：

```js
// 注入计时 hook（通过 page.addInitScript）
window._drawTimes = [];
const origDraw = renderer.draw.bind(renderer);
renderer.draw = function() {
  const t0 = performance.now();
  origDraw();
  window._drawTimes.push(performance.now() - t0);
};
```

运行 100 帧后取 P95 耗时：

| 棋盘大小 | P95 draw() 耗时目标 |
|---------|-------------------|
| Ch1 6×6 | < 3ms |
| Ch6 10×10 + FEVER效果 | < 8ms |

## 4. 多棋盘尺寸压力

对每章棋盘（6×6 到 10×10）各跑 30 秒稳定帧率，确保大棋盘不退化：

```
Ch1 6×6  → avgFPS ≥ 55
Ch3 8×8  → avgFPS ≥ 50
Ch5 9×9  → avgFPS ≥ 40
Ch6 10×10→ avgFPS ≥ 35
```

## 报告格式

```json
{
  "run_at": "...",
  "browser": "chromium",
  "sections": {
    "fps_baseline": {
      "idle":        { "avgFPS": 58, "minFPS": 54, "pass": true },
      "vanish_anim": { "avgFPS": 47, "minFPS": 38, "pass": true },
      "bomb_explode":{ "avgFPS": 32, "minFPS": 28, "pass": false, "blocker": true },
      "fever_effect":{ "avgFPS": 31, "minFPS": 27, "pass": true },
      "chapter_unlock":{ "avgFPS": 26, "minFPS": 18, "pass": true }
    },
    "memory_leak": {
      "heap_per_level_mb": 2.1,
      "final_heap_mb": 82,
      "particle_leak": false,
      "pass": true
    },
    "draw_timing": {
      "ch1_p95_ms": 1.8,
      "ch6_fever_p95_ms": 6.2,
      "pass": true
    },
    "board_scale": {
      "6x6_avgFPS": 58, "8x8_avgFPS": 51,
      "9x9_avgFPS": 42, "10x10_avgFPS": 36,
      "pass": true
    }
  },
  "blockers": [],
  "overall": "pass|fail"
}
```

## 验收标准

1. `performance-report.json` overall = "pass"
2. 炸弹爆炸 minFPS ≥ 30（P0，低于此值用户明显感到卡顿）
3. FEVER 效果 avgFPS ≥ 30（P0）
4. 5关循环内存增量 < 5MB/关
5. 关卡结束后 VFXSystem 粒子数组 = 0（无泄漏）
6. Ch6 10×10 棋盘 avgFPS ≥ 35
