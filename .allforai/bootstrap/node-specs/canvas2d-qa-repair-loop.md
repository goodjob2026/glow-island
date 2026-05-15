---
node_id: canvas2d-qa-repair-loop
node: canvas2d-qa-repair-loop
goal: "读取全部QA报告→分类失败→定点修复→仅重跑受影响QA→收敛判定，最多3轮迭代"
capability: canvas2d-engineer
human_gate: false
hard_blocked_by:
  - canvas2d-browser-qa
  - canvas2d-performance-qa
  - canvas2d-audio-qa
exit_artifacts:
  - "canvas2d-client/www/qa/repair-loop-report.json"
---

# canvas2d-qa-repair-loop

## Mission

所有 QA 节点运行完毕（无论 pass/fail）后，进入修复循环：
读取全部失败报告 → 按子系统分类 → 定点修复源码 → 直接执行受影响 QA 脚本（覆写 artifact）→
判断是否收敛 → 最多3轮。

**修复循环不通过 workflow orchestrator 触发重跑**，而是直接调用 QA 脚本命令，
确保每次修复后立即验证，不依赖 artifact 存在性判断。

## 输入（全部 QA 报告）

```
canvas2d-client/www/qa/gameplay-quality-report.json
canvas2d-client/www/qa/visual/screenshots/index.json
canvas2d-client/www/qa/art-quality-report.json
canvas2d-client/www/qa/browser-qa-report.json
canvas2d-client/www/qa/performance-report.json
canvas2d-client/www/qa/audio-qa-report.json
```

## 收敛日志（每轮维护）

```json
// canvas2d-client/www/qa/repair-convergence-log.json
{
  "iterations": [
    {
      "iteration": 1,
      "failures_found": ["bfs_s_path", "fps_bomb_low", "sfx_connect_missing"],
      "fixes_applied": [
        { "failure_id": "bfs_s_path",       "file": "src/game/TileGrid.js",    "desc": "修正转弯计数逻辑" },
        { "failure_id": "fps_bomb_low",     "file": "src/game/VFXSystem.js",   "desc": "减少炸弹粒子数60→30" },
        { "failure_id": "sfx_connect_missing", "file": "src/scenes/GameplayScene.js", "desc": "在_onMatch后加audio.playSFX" }
      ],
      "qa_rerun": ["gameplay-quality-qa", "performance-qa", "audio-qa"],
      "resolved": ["sfx_connect_missing"],
      "still_failing": ["bfs_s_path", "fps_bomb_low"]
    }
  ],
  "unresolved": [],
  "status": "in_progress|converged|halted"
}
```

## 收敛规则

- **同一 failure_id 出现 3 次** → 标记 UNRESOLVED，不再尝试修复，跳过
- **单次迭代修改文件数 > 5** → 警告，继续但在报告中标注风险
- **最多 3 轮迭代** → 第3轮后无论状态都输出最终报告，未解决项进入 UNRESOLVED

## 第一步：聚合失败清单

```python
# scripts/aggregate_qa_failures.py
import json, glob, sys

REPORT_MAP = {
    'gameplay': 'canvas2d-client/www/qa/gameplay-quality-report.json',
    'visual':   'canvas2d-client/www/qa/visual/screenshots/index.json',
    'art':      'canvas2d-client/www/qa/art-quality-report.json',
    'browser':  'canvas2d-client/www/qa/browser-qa-report.json',
    'perf':     'canvas2d-client/www/qa/performance-report.json',
    'audio':    'canvas2d-client/www/qa/audio-qa-report.json',
}

failures = []
for domain, path in REPORT_MAP.items():
    try:
        with open(path) as f:
            report = json.load(f)
        # 提取 overall = "fail" 的 domain
        if report.get('overall') == 'fail' or not report.get('overall_pass', True):
            # 提取 blockers 和 fail section
            for sec_name, sec in report.get('sections', {}).items():
                if isinstance(sec, dict) and not sec.get('pass', True):
                    failures.append({
                        'domain': domain,
                        'section': sec_name,
                        'failure_id': f'{domain}_{sec_name}',
                        'detail': sec
                    })
            # browser-qa 格式不同
            for tc in report.get('tests', []):
                if tc.get('status') != 'pass':
                    failures.append({
                        'domain': 'browser',
                        'section': tc['id'],
                        'failure_id': f"browser_{tc['id']}",
                        'detail': tc
                    })
    except FileNotFoundError:
        pass

print(json.dumps(failures, indent=2, ensure_ascii=False))
```

## 第二步：按子系统分类 → 确定修复文件

| failure_id 模式 | 子系统 | 首要修复文件 |
|----------------|--------|------------|
| `gameplay_bfs_*` | BFS路径 | `src/game/TileGrid.js` |
| `gameplay_special_*` | 特殊图块 | `src/game/SpecialTiles.js`, `src/game/TileGrid.js` |
| `gameplay_combo_*` | Combo系统 | `src/game/ComboSystem.js` |
| `gameplay_star_rating` | 星评计算 | `src/scenes/GameplayScene.js` |
| `gameplay_obstacle_*` | 障碍物 | `src/game/ObstacleSystem.js` |
| `perf_fps_*` | 帧率 | `src/game/VFXSystem.js`（粒子数量） |
| `perf_memory_*` | 内存泄漏 | `src/game/VFXSystem.js`（_particles清理），`src/scenes/GameplayScene.js`（destroy）|
| `audio_sfx_*` | SFX触发 | `src/scenes/GameplayScene.js` |
| `audio_bgm_*` | BGM切换 | `src/AudioManager.js` |
| `audio_combo_pitch` | 音高偏移 | `src/AudioManager.js` |
| `browser_TC-02` | 消除逻辑 | `src/game/TileGrid.js` |
| `browser_TC-05` | 胜利结算 | `src/scenes/GameplayScene.js` |
| `browser_TC-09` | 禅模式 | `src/scenes/ZenGameplayScene.js`, `src/scenes/GameplayScene.js` |
| `browser_TC-10` | 经济流程 | `src/scenes/GameplayScene.js`, `src/ProgressManager.js` |
| `browser_TC-11` | 商店/沙漏 | `src/scenes/ShopScene.js`, `src/ProgressManager.js` |
| `visual_*` | 渲染/截图 | `src/scenes/*.js`（对应 scene） |
| `art_animation_*` | 动画 | `src/game/VFXSystem.js` |

## 第三步：读取 node-spec + 修复

对每个待修复的 failure_id：

1. 读取对应子系统的 node-spec（如 `canvas2d-gameplay-scene.md`）
2. 读取失败报告的详情（具体错误信息）
3. 读取当前源码文件
4. 按 node-spec 规格修复（**不超出 node-spec 定义的范围**）
5. 记录修改到 convergence-log

```python
# 修复前检查：同一 failure_id 是否已失败 ≥3 次
def check_convergence(failure_id, conv_log):
    for it in conv_log.get('iterations', []):
        count = sum(1 for f in it['still_failing'] if f == failure_id)
    total = sum(
        1 for it in conv_log.get('iterations', [])
        for f in it.get('still_failing', []) if f == failure_id
    )
    return total >= 3  # True = 已收敛上限，跳过
```

## 第四步：重跑受影响的 QA 脚本

修复完成后，按修复文件映射确定需要重跑的 QA，直接调用脚本：

| 修复文件 | 重跑 QA 命令 |
|---------|------------|
| `src/game/TileGrid.js` | `node canvas2d-client/tests/gameplay-quality.test.js` |
| `src/game/VFXSystem.js` | `npx playwright test performance.spec.js` (perf); `npx playwright test visual.spec.js` (visual) |
| `src/AudioManager.js` | `npx playwright test audio.spec.js --headed` |
| `src/scenes/GameplayScene.js` | `node gameplay-quality.test.js`; `npx playwright test browser-qa.spec.js` |
| `src/scenes/ZenGameplayScene.js` | `npx playwright test browser-qa.spec.js` |
| `src/scenes/ShopScene.js` | `npx playwright test browser-qa.spec.js` |
| `src/ProgressManager.js` | `npx playwright test browser-qa.spec.js` |
| `src/game/ObstacleSystem.js` | `node gameplay-quality.test.js` |
| `src/game/ComboSystem.js` | `node gameplay-quality.test.js`; `npx playwright test audio.spec.js --headed` |

重跑命令执行后覆写对应的 QA artifact JSON。

## 第五步：检查收敛

```python
# 读取重跑后的新报告
all_pass = True
for domain, path in REPORT_MAP.items():
    with open(path) as f:
        report = json.load(f)
    if report.get('overall') == 'fail' or not report.get('overall_pass', True):
        all_pass = False
        
if all_pass:
    print("CONVERGED: all QA pass")
    # 更新 convergence-log status = 'converged'
else:
    if current_iteration >= 3:
        print("HALTED: max iterations reached")
        # 输出 UNRESOLVED 清单，终止
    else:
        print(f"Next iteration: {current_iteration + 1}")
        # 回到第一步
```

## UNRESOLVED 处理

收敛失败（超过3轮仍存在的 failure）输出到报告中：

```json
"unresolved": [
  {
    "failure_id": "perf_fps_bomb_low",
    "description": "炸弹爆炸帧率持续低于30fps",
    "iterations_tried": 3,
    "last_fix_applied": "减少粒子数60→30→15，仍低于标准",
    "recommended_action": "MANUAL: 考虑将炸弹爆炸拆为多帧异步渲染（requestAnimationFrame分帧）",
    "blocker_for_release": true
  }
]
```

`blocker_for_release: true` 的项会阻止 canvas2d-concept-acceptance 通过。

## 最终报告格式

```json
{
  "run_at": "...",
  "total_iterations": 2,
  "failures_found_initial": 5,
  "failures_resolved": 4,
  "unresolved": [],
  "iterations_summary": [
    { "iteration": 1, "fixed": 3, "still_failing": 2, "qa_rerun": ["gameplay-quality-qa", "audio-qa"] },
    { "iteration": 2, "fixed": 2, "still_failing": 0, "qa_rerun": ["browser-qa", "performance-qa"] }
  ],
  "final_qa_status": {
    "gameplay-quality": "pass",
    "visual": "pass",
    "art-quality": "pass",
    "browser": "pass",
    "performance": "pass",
    "audio": "pass"
  },
  "overall": "pass|halted"
}
```

写入 `canvas2d-client/www/qa/repair-loop-report.json`

## 验收标准

1. `repair-loop-report.json` 存在，`overall` 不为空
2. 若 `overall = "pass"`：所有6个 QA 报告均 overall=pass/overall_pass=true
3. 若 `overall = "halted"`：unresolved 清单非空，每项都有 recommended_action
4. 迭代次数 ≤ 3（不超限）
5. 每个被修复的 failure_id 都有对应的修复记录（file + desc）
6. `canvas2d-concept-acceptance` 只能在此节点 overall=pass 后通过
