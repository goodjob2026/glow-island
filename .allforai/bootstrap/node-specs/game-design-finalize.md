# Node Spec: game-design-finalize

## Role
Aggregate all approved game-design system JSONs into the canonical `game-design-doc.json` and produce the `gdd-dashboard.html` status overview. This node is the gate between design and implementation — nothing in the implementation pipeline runs until `game-design-finalize` reaches `gate_status == "approved"`.

**discipline_owner:** lead-designer  
**discipline_reviewers:** producer  
**capability:** game-design  
**human_gate:** true

## Context Pull

Read ALL of the following files before generating output. Only include a section in `game-design-doc.json` if its source file exists:

- `.allforai/product-concept/concept-baseline.json` — project metadata
- `.allforai/game-design/approval-records.json` — CRITICAL: verify ALL upstream nodes are `gate_status == "approved"` before proceeding
- `.allforai/game-design/systems/core-mechanics.json`
- `.allforai/game-design/systems/worldbuilding.json`
- `.allforai/game-design/systems/character-arc.json`
- `.allforai/game-design/systems/ftue.json`
- `.allforai/game-design/systems/monetization-design.json`
- `.allforai/game-design/systems/retention-hook.json`
- `.allforai/game-design/systems/meta-game.json`
- `.allforai/game-design/systems/level-design.json`
- `.allforai/game-design/systems/puzzle-design.json`
- `.allforai/game-design/systems/progression-curve.json`
- `.allforai/game-design/systems/audio-design.json`
- `.allforai/game-design/systems/art-asset-inventory.json`
- `.allforai/game-design/systems/ai-art-manifest.json`

## Precondition Check

Before generating output, verify in `approval-records.json` that ALL of these nodes have `gate_status == "approved"`:
- `ftue-design`
- `meta-game-design`
- `puzzle-design`
- `progression-curve-design`
- `audio-design`
- `character-arc-design`
- `ai-art-generation`

If any are not approved, output: `BLOCKED: <node_id> is not yet approved. game-design-finalize cannot run.` and stop.

## Content Requirements

### game-design-doc.json

Aggregate all system JSONs into the canonical schema. Include Glow Island-specific values:

```json
{
  "game_title": "Glow Island — 輝島の光",
  "scenario": "casual-mobile",
  "design_version": "1.0.0",
  "generated_at": "<ISO>",
  "player_roles": [
    {
      "role_id": "healer",
      "archetype": "治愈型玩家",
      "motivation": "放松减压，视觉美感奖励",
      "pain_points": ["不喜欢体力限制", "讨厌倒计时压力", "抗拒P2W排行"]
    },
    {
      "role_id": "story-seeker",
      "archetype": "故事型玩家",
      "motivation": "追寻律与ひなた的情感线，解锁渉的记忆碎片",
      "pain_points": ["害怕错过叙事内容", "希望有存档", "不喜欢强制社交"]
    },
    {
      "role_id": "completionist",
      "archetype": "完成型玩家",
      "motivation": "全岛修复，全收集，全关卡三星",
      "pain_points": ["难度不公平感", "收集内容太多太碎", "无进度可视化"]
    }
  ],
  "core_loop": { "$ref": "systems/core-mechanics.json" },
  "systems": [],
  "economy": {
    "currencies": ["沙滩币 (beach_coin)", "丹青石 (danqing_stone)"],
    "balance_targets": {
      "daily_coin_earn": "200-400",
      "iap_value_perception": "fair — cosmetic/convenience only"
    },
    "sink_source_summary": "beach_coin earned via level completion, spent on island restoration; danqing_stone via IAP, spent on hints and cosmetic boosts"
  },
  "progression": {
    "max_level": 135,
    "curve_type": "sigmoid",
    "meta_unlocks": [
      "chapter_2_unlock", "chapter_3_unlock", "chapter_4_unlock",
      "chapter_5_unlock", "chapter_6_unlock", "lighthouse_finale"
    ]
  },
  "narrative": {
    "story_acts": 6,
    "branching_depth": 0,
    "endings_count": 1
  },
  "worldbuilding": {
    "setting": "輝島 (Kagayaki-jima) — abandoned Japanese island, lighthouse keeper legacy",
    "factions_count": 0,
    "key_locations_count": 6,
    "lore_file": "game-design/worldbuilding-bible.md"
  },
  "art": {
    "style_id": "animal-crossing-jp-island",
    "asset_count": 0,
    "placeholder_count": 0,
    "temp_count": 0,
    "alpha_count": 0,
    "final_count": 0
  },
  "audio": {
    "music_tracks": 9,
    "sfx_events": 12
  },
  "approval_summary": {
    "total_nodes": 15,
    "approved": 0,
    "pending": 0,
    "revision_requested": 0
  }
}
```

Populate `systems[]` from all verified system JSONs. Populate `art.*` counts from `art-asset-inventory.json.summary`. Populate `approval_summary` counts from `approval-records.json`.

### gdd-dashboard.html

The GDD dashboard provides a 5-second status overview for producer and lead-designer.

**Layout: Tab navigation (Design / Art / Engineering / Audio)**

**Above fold:**
- Overall completion gauge: (approved nodes / total nodes) as a percentage ring
- Alert strip: list any nodes with `gate_status == "revision-requested"` (red badges) or `in-review` (yellow badges)
- Glow Island header with island silhouette banner

**Design tab:**
- Node status card grid (one card per game-design node):
  - Node name, discipline_owner, gate_status badge (color-coded), last updated timestamp
  - Expand to show revision notes if any

**Art tab:**
- Art progress heatmap: rows = asset types, columns = states (placeholder/temp/alpha/final), cells = count
- Highlight rows with 0 final assets that have `milestone_gate = "alpha"`

**Engineering tab:**
- Implementation node status (setup-runtime-env through concept-acceptance)
- Shows blocked_by status

**Audio tab:**
- SFX coverage: 12 core SFX keys, checkmark for each that is verified
- BGM chapter coverage: 6 chapters + menu + ceremony

**Collapsed (all tabs):**
- Per-node revision notes (click card to expand)
- Full artifact path list

## Output Format

**Primary outputs:**
1. `.allforai/game-design/gdd-dashboard.html` — status dashboard
2. `.allforai/game-design/game-design-doc.json` — aggregated GDD

## Human Gate Instructions

After generating both output files, update `.allforai/game-design/approval-records.json`:
- Set `gate_status` to `"in-review"` for the `game-design-finalize` record
- Set `updated_at` to current ISO timestamp

When `gate_status` reaches `"approved"`, the orchestrator will unlock all implementation nodes:
`setup-runtime-env`, `implement-puzzle-core`, `implement-special-mechanics`, `implement-game-session`,
`implement-island-map`, `implement-ui-systems`, `implement-backend-api`, `implement-shop-iap`,
`implement-audio`, `level-editor-tool`.

This is the single gate between design and code. The lead-designer must approve before any implementation begins.
