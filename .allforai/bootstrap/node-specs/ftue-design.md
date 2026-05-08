# Node Spec: ftue-design

## Role
Design the First-Time User Experience (FTUE) for Glow Island — from the moment a new player opens the app through completing level 1-3. The FTUE must teach through level design, not tutorial popups. Establish the emotional hook within the first 5 minutes.

**discipline_owner:** ux-designer  
**discipline_reviewers:** lead-designer  
**capability:** game-design  
**human_gate:** true

## Context Pull

Read these files before generating output:
- `.allforai/product-concept/concept-baseline.json` — protagonist, setting, ERRC highlights (no popup-heavy tutorials)
- `.allforai/game-design/core-loop.html` or `.allforai/game-design/game-design-document.md` — core mechanics
- `.allforai/game-design/level-design.json` — existing tutorial levels 1-1, 1-2, 1-3 (verify and document these)
- `.allforai/game-design/systems/core-mechanics.json` (if exists)
- `.allforai/game-design/approval-records.json` — confirm core-loop-design is approved

## Content Requirements

### Narrative Framing (First 60 Seconds)

Design the soft onboarding sequence:
1. **Opening scene:** 山田律 arrives at the dock — brief cutscene (max 3 panels, minimal text)
2. **First encounter with ひなた:** She hands him a note from 渉's estate; tone is warm but not overly welcoming
3. **Island introduction:** 律 sees the rundown harbor area; motivation established without exposition dump
4. **Level 1-1 entry:** Natural transition into first puzzle — no tutorial popup, no forced dialogue

All text must be in Japanese with a gentle, non-urgent tone. No exclamation marks in tutorial copy.

### No-Popup Teaching Philosophy

The FTUE must teach entirely through:
- **Level design** (first 2 tiles obvious, path visually clear)
- **Visual affordance** (connectable tiles glow softly when touched)
- **Immediate feedback** (satisfying connect SFX + particle trail on first match)
- **Scaffolding** (Ch1 mechanics only; no special blocks in levels 1-1 through 1-3)

Explicitly prohibited in FTUE:
- Tutorial overlay popups
- Forced tap targets with arrows
- Skip/close buttons on mandatory screens
- Timer pressure

### Level 1-1 Design (Verify Against level-design.json)

Verify and document the following from existing level-design.json:
- Grid size
- Number of tile pairs
- Tile types present
- Expected time to complete for first-time player (target: 60-90 seconds)
- Step count (no step limit in tutorial levels)

If level-design.json specifies differently from this spec, document the discrepancy.

**Intended teaching goal:** Establish that tiles connect if the path has ≤2 turns. Nothing else.

### Level 1-2 Design

**Teaching goal:** Introduce the concept that not all tiles can connect — some paths are blocked.
- Add 1 obstacle (wall or gap)
- Slightly larger grid than 1-1
- Still no step limit; still no special blocks
- End with a small combo (≥2 matches in quick succession) to trigger first combo feedback

### Level 1-3 Design

**Teaching goal:** First material reward → first island restoration moment.
- Completing 1-3 triggers the "harbor dock restored" cutscene (even if partial)
- ひなた appears briefly, acknowledges progress with 1 line
- Material reward UI appears for the first time
- This is the emotional payoff that makes players want to continue

### FTUE Flow Diagram

For each step specify: step name / goal / UI screen / skip-able? / estimated duration

| Step | Name | Goal | Screen | Skip? | Duration |
|------|------|------|--------|-------|----------|
| 1 | Opening cutscene | Establish 律's arrival | Cutscene panel | No | 15s |
| 2 | First ひなた encounter | Warm emotional hook | Dialogue screen | No | 10s |
| 3 | Island overview | Show restoration potential | Island map (locked) | No | 5s |
| 4 | Level 1-1 | Teach basic connect mechanic | Puzzle scene | No | 75s |
| 5 | Level 1-2 | Introduce obstacles | Puzzle scene | No | 90s |
| 6 | Level 1-3 | First restoration payoff | Puzzle → Island map | No | 120s |
| 7 | Material reward | Teach material loop | Reward screen | No | 10s |
| 8 | Harbor restored | Emotional reward | Island map animation | No | 15s |

### Drop-off Risk Table

For each step: expected completion %, red-flag threshold, mitigation design.

### D1 Retention Hook Setup

By end of FTUE, player must have:
- Completed their first island restoration area
- Seen ひなた at least twice
- Received their first material reward
- Unlocked the island map with one restored area visible

This setup ensures the D1 hook (return to continue restoration + see what happens next with ひなた) is primed.

## Output Format

**Primary output:** `.allforai/game-design/ftue.html`
- Above fold: FTUE flow diagram (step-by-step first session)
- Expanded: Drop-off risk table with red-flag thresholds
- Expanded: Tutorial level specs (1-1, 1-2, 1-3) verified against level-design.json
- Expanded: No-popup teaching methodology with visual affordance inventory
- Collapsed: Full copy spec (all tutorial-adjacent text verbatim, in Japanese, with tone notes)

**Secondary output:** `.allforai/game-design/systems/ftue.json`

```json
{
  "schema": "ftue-v1",
  "generated_at": "<ISO>",
  "philosophy": "teach-through-level-design",
  "no_popup_rule": true,
  "opening_sequence": {
    "duration_seconds": 40,
    "panels": [],
    "first_hinata_appearance": "step_2"
  },
  "tutorial_levels": [
    {
      "level_id": "1-1",
      "teaching_goal": "<string>",
      "grid_size": "<WxH>",
      "tile_pair_count": "<number>",
      "step_limit": null,
      "special_blocks": [],
      "expected_duration_seconds": 75,
      "verified_against_level_design_json": true
    }
  ],
  "flow_steps": [],
  "dropoff_risks": [],
  "d1_retention_setup": {
    "restoration_areas_completed": 1,
    "hinata_appearances": 2,
    "material_rewards_received": 1
  }
}
```

## Human Gate Instructions

After generating both output files, update `.allforai/game-design/approval-records.json`:
- Set `gate_status` to `"in-review"` for the `ftue-design` record
- Set `updated_at` to current ISO timestamp

Do NOT proceed to `game-design-finalize` until `gate_status == "approved"`.
