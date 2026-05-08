# Node Spec: meta-game-design

## Role
Design the meta-game layer of Glow Island — everything that exists outside the core puzzle loop. The island map is the meta layer: visual restoration per chapter, memory fragment collection, and material loops. Make progress feel like healing the island, not grinding levels.

**discipline_owner:** systems-designer  
**discipline_reviewers:** lead-designer  
**capability:** game-design  
**human_gate:** true

## Context Pull

Read these files before generating output:
- `.allforai/product-concept/concept-baseline.json` — island name (輝島), chapter mechanics, ERRC create items
- `.allforai/game-design/game-design-document.md` — meta loop overview (island restoration, material collection)
- `.allforai/game-design/systems/retention-hook.json` (if exists) — ひなた beats and restoration milestones
- `.allforai/game-design/approval-records.json` — confirm retention-hook-design is approved
- `.allforai/game-design/economy-model.json` — material types, currency sinks

## Content Requirements

### Island Map as Meta Layer

The island map is the primary meta-game screen. Design:

**Visual State System (4 states per area):**
- `desolate` — desaturated, withered, empty
- `stirring` — first signs of life (a sprout, a light in a window)
- `blooming` — colorful, active, NPCs visible
- `radiant` — fully restored, unique visual flourish per chapter

Per chapter, define: area name, visual theme, restoration trigger (materials required), and the one visual moment that marks full restoration.

| Chapter | Area | Theme | Full Restoration Visual |
|---------|------|-------|------------------------|
| Ch1 | 漁港 (Harbor) | Seaside village | Fishing lanterns light up at dusk |
| Ch2 | 陶芸工房 (Pottery studio) | Craft workshop | Kiln fires up, warm orange glow |
| Ch3 | 海辺の森 (Coastal forest) | Nature trail | Cherry blossoms bloom along the path |
| Ch4 | 石畳の小道 (Stone path) | Quiet lane | Stone lanterns flicker on |
| Ch5 | 崖の展望台 (Cliff lookout) | Coastal heights | Stars appear in time-lapse at chapter end |
| Ch6 | 輝く灯台 (Lighthouse) | Beacon | Lighthouse beam sweeps across the sea |

**Map Interaction:**
- Player can tap any area to see restoration progress (% and materials remaining)
- Locked areas show "foggy" state with silhouette of what's inside
- Chapter unlock reveals new area with reveal animation
- The lighthouse is always visible on the horizon from Ch1 — never locked from view, just unreachable

### Chapter Unlock = New Area Revealed

Design the chapter unlock ceremony:
1. Final level of chapter N completes
2. Area N restoration animation plays (3-4 second sequence)
3. Camera pans to adjacent locked area — fog lifts just enough to show a silhouette
4. ひなた appears with a 1-line hint about what's ahead
5. New chapter's first 3 levels unlock
6. Memory fragment for chapter N unlocks

### Memory Fragment System (丸山渉's Journal)

渉 (Wataru Maruyama, the lighthouse keeper) left behind 6 journal entries — one per chapter.

Design the collection system:
- **Trigger:** Complete a chapter's restoration (all areas in chapter restored)
- **Presentation:** Animated journal page turn; 渉's handwriting style; black ink on aged paper
- **Content:** One journal entry per chapter, 100-150 characters in Japanese. Themes:
  - Ch1: Why 渉 loved the harbor mornings
  - Ch2: The patience required for craft (indirect message to 律)
  - Ch3: A memory of young ひなた running through the forest
  - Ch4: A quiet walk he took alone before the island declined
  - Ch5: Looking at stars and feeling small in a good way
  - Ch6: The letter he wrote to 律 — why he chose him

- **Access:** Journal fragments are stored in a "Memory Room" accessible from island map
- **Completionist hook:** All 6 collected = special illustration unlocked

### Material Collection Loop

Materials are earned by completing levels and used to restore island areas. Design:

**Material Types (one per chapter theme):**
- Ch1: 浮木 (Driftwood) — harbor repair
- Ch2: 陶土 (Clay) — kiln and pottery restoration
- Ch3: 苔と種 (Moss & Seeds) — forest replanting
- Ch4: 石畳石 (Paving stones) — path restoration
- Ch5: 崖の石英 (Cliff quartz) — lookout repair
- Ch6: 灯油と硝子 (Lamp oil & glass) — lighthouse restoration

**Collection mechanics:**
- Materials drop from level completion (type determined by chapter)
- Rare materials drop from combo chains (4+ combo)
- Material cap: 99 per type (soft cap — can exceed briefly during active play)
- No material decay, no expiry

**Restoration costs:** Define material costs per chapter area as a 3-stage restoration:
- Stage 1 (stirring): cheap, accessible in first 5 levels of chapter
- Stage 2 (blooming): moderate, requires completing ~half the chapter
- Stage 3 (radiant): chapter completion + all materials from chapter levels

### No Battle Pass / No Season

Glow Island deliberately omits battle pass and seasonal events. The meta-game must feel timeless:
- No expiring content
- No season pass track
- Long-term engagement comes from narrative completion, not FOMO
- Document this as a design decision with rationale (from ERRC: eliminate PvP/ranking pressure)

## Output Format

**Primary output:** `.allforai/game-design/meta-game.html`
- Above fold: Meta-game layer map SVG — island map states per chapter (6 areas, 4 states each)
- Expanded: Visual restoration states (desolate → stirring → blooming → radiant) with description per chapter
- Expanded: Memory fragment system (渉's journal trigger + content themes)
- Expanded: Material collection loop (types, drop rates, restoration costs, material cap)
- Collapsed: Long-term engagement curve (X: chapters completed, Y: % of meta content unlocked)

**Secondary output:** `.allforai/game-design/systems/meta-game.json`

```json
{
  "schema": "meta-game-v1",
  "generated_at": "<ISO>",
  "island_map": {
    "total_areas": 6,
    "visual_states": ["desolate", "stirring", "blooming", "radiant"],
    "areas": [
      {
        "chapter": 1,
        "area_id": "harbor",
        "area_name_jp": "漁港",
        "theme": "<string>",
        "full_restoration_visual": "<string>",
        "restoration_stages": [
          {
            "stage": 1,
            "state": "stirring",
            "materials_required": [],
            "levels_required": "<number>"
          }
        ]
      }
    ]
  },
  "memory_fragment_system": {
    "total_fragments": 6,
    "trigger": "chapter_restoration_complete",
    "collection_location": "memory_room",
    "all_collected_reward": "special_illustration",
    "fragments": []
  },
  "material_system": {
    "types": [],
    "drop_source": "level_completion",
    "rare_drop_trigger": "combo_chain_4_plus",
    "soft_cap_per_type": 99,
    "no_decay": true
  },
  "no_battle_pass": true,
  "no_seasonal_events": true,
  "design_rationale": "Timeless meta-game; engagement from narrative completion not FOMO"
}
```

## Human Gate Instructions

After generating both output files, update `.allforai/game-design/approval-records.json`:
- Set `gate_status` to `"in-review"` for the `meta-game-design` record
- Set `updated_at` to current ISO timestamp

Do NOT proceed to `game-design-finalize` until `gate_status == "approved"`.
