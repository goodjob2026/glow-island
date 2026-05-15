---
node_id: launch-checklist
node: launch-checklist
capability: launch-prep
human_gate: false
hard_blocked_by: [runtime-smoke-verify]
unlocks: []
exit_artifacts:
  - .allforai/launch-prep/launch-checklist.json
---

# Task: 上架清单最终验收

## 背景

上次运行已完成：competitive-research、launch-concept-finalize、launch-gap-implementation、compliance-check。
本节点在本轮修复（音频 + 资产 + 代码绑定）完成后，执行最终上架就绪验证。

## Phase 1: 自动化验收项

### 1.1 资产完整性检查

```bash
# 验证音频文件不再是空占位符
find game-client/assets/resources/audio -name "*.mp3" -size -1k | wc -l
# 应为 0（所有文件 > 1KB）

# 验证章节图块存在
for ch in 1 2 3 4 5 6; do
  count=$(ls game-client/assets/resources/sprites/tiles/chapter${ch}/ 2>/dev/null | wc -l)
  echo "chapter${ch}: ${count} files"
done
# 每章至少 1 个 PNG

# 验证特殊图块完整
ls game-client/assets/resources/sprites/tiles/special/
# 必须包含 special_pierce.png 和 special_cascade.png

# 验证 VFX 帧序列
ls game-client/assets/resources/effects/frames/ 2>/dev/null | head -5
# 至少一个帧目录
```

### 1.2 合规内容检查

```bash
# 隐私政策 URL 一致性
grep -rn "privacy\|terms" game-client/assets/scripts/ --include="*.ts" | grep "http" | head -10
# 应全部指向 https://glow-island.vercel.app/privacy 和 /terms

# COPPA/数据采集说明
grep -rn "COPPA\|data_collection\|privacy_policy" game-client/assets/scripts/ --include="*.ts" | head -5

# 无测试/占位符内容残留
grep -rn "TODO\|FIXME\|placeholder\|test-only\|sandbox" game-client/assets/scripts/ --include="*.ts" | grep -v "sandbox.*iap\|sandbox.*receipt" | head -10
```

### 1.3 App Store 截图生成（自动化）

使用 Playwright 生成 5 张 App Store 截图（6.7"，1290×2796px）：

```typescript
// 场景列表（优先级排序）
const scenes = [
  { name: "core-loop-combo", description: "核心连线+Combo演示" },
  { name: "island-restoration", description: "岛屿修复Meta进度" },
  { name: "npc-dialogue", description: "NPC对话治愈场景" },
  { name: "special-tiles", description: "5种特殊图块展示" },
  { name: "island-overview", description: "灯塔与小岛全景" }
];
```

截图保存至 `.allforai/launch-prep/screenshots/` 并在清单中记录路径。

### 1.4 SKU ID 格式验证

```bash
# 从代码中提取实际 SKU ID
grep -rn "small_pack\|medium_pack\|large_pack\|mega_pack\|monthly_card\|starter_pack" \
  game-client/assets/scripts/ --include="*.ts" | head -10

# 验证格式一致性（应为 com.glowisland.iap.* 或简短格式 small_pack）
grep -rn "iap\." game-client/assets/scripts/ --include="*.ts" | head -10
```

## Phase 2: 读取已完成的 launch-prep 产物

```bash
cat .allforai/launch-prep/launch-concept-finalize.json | python3 -c "
import json,sys; d=json.load(sys.stdin)
print('tier_structure:', json.dumps(d.get('tier_structure',{}), ensure_ascii=False)[:200])
print('app_name:', d.get('app_name_localized',{}))
"

cat .allforai/launch-prep/compliance-checklist.json | python3 -c "
import json,sys; d=json.load(sys.stdin)
items=d.get('items',[])
blockers=[i for i in items if i.get('severity')=='P0' and i.get('status')!='resolved']
print('P0 blockers remaining:', len(blockers))
for b in blockers[:5]: print(' -', b.get('description','')[:80])
" 2>/dev/null || echo "compliance-checklist.json format differs — reading raw"
```

## Phase 3: 生成最终上架清单

输出更新后的 `.allforai/launch-prep/launch-checklist.json`：

```json
{
  "schema_version": "1.1",
  "generated_at": "<ISO>",
  "overall_launch_status": "ready|blocked",
  "blocking_reasons": [],
  "automated_checks": {
    "audio_stubs_cleared": true,
    "chapter_tiles_present": true,
    "special_badges_complete": true,
    "vfx_frames_present": true,
    "compliance_urls_clean": true,
    "no_placeholder_content": true,
    "sku_format_consistent": true
  },
  "screenshots_generated": {
    "count": 5,
    "paths": [".allforai/launch-prep/screenshots/core-loop-combo.png", "..."]
  },
  "manual_actions_required": [
    {
      "action": "Deploy privacy/terms pages",
      "url": "https://glow-island.vercel.app/privacy",
      "priority": "P0",
      "owner": "developer"
    },
    {
      "action": "Add Firebase iOS SDK (CocoaPods + GoogleService-Info.plist)",
      "priority": "P1",
      "owner": "developer"
    },
    {
      "action": "Create App Store Connect app record (bundle ID: com.glowisland.game)",
      "priority": "P0",
      "owner": "developer"
    },
    {
      "action": "Register 6 IAP products in App Store Connect (com.glowisland.iap.*)",
      "priority": "P0",
      "owner": "developer"
    },
    {
      "action": "Upload generated screenshots to App Store Connect",
      "priority": "P1",
      "owner": "developer"
    },
    {
      "action": "Fill Privacy Nutrition Label (UUID, game progress, purchase history)",
      "priority": "P0",
      "owner": "developer"
    },
    {
      "action": "Archive iOS build in Xcode (Release scheme) and upload to TestFlight",
      "priority": "P0",
      "owner": "developer"
    }
  ],
  "app_store_metadata": {
    "app_name_ja": "光輝島",
    "app_name_en": "Glow Island",
    "subtitle_en": "Healing Tile Connect",
    "category": "Games > Puzzle",
    "age_rating": "4+",
    "bundle_id": "com.glowisland.game"
  }
}
```

## 完成标准

- `overall_launch_status == "ready"` 时：所有自动化检查通过，manual_actions 列表完整
- `overall_launch_status == "blocked"` 时：`blocking_reasons` 必须具体列明自动化检查失败项
- **不因 manual_actions 阻塞**：人工动作不在自动化验证范围内，不触发 run_halted
- 截图至少生成 1 张（Playwright 可用时生成 5 张，不可用时记录为 skipped）
