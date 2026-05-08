# Node Spec: retention-hook-design

## Role
Design Glow Island's session re-engagement system. Define D1/D7/D30 retention hooks grounded in the game's healing aesthetic — no aggressive notifications, no stamina walls. Hooks must feel organic to the island restoration narrative and ひなた's story beats.

**discipline_owner:** systems-designer  
**discipline_reviewers:** lead-designer  
**capability:** game-design  
**human_gate:** true

## Context Pull

Read these files before generating output:
- `.allforai/product-concept/concept-baseline.json` — ERRC highlights (eliminate stamina/energy systems, reduce time-limited event density, reduce intrusive popups)
- `.allforai/game-design/game-design-document.md` — overall game loop and economy overview
- `.allforai/game-design/systems/monetization-design.json` (if exists) or `.allforai/game-design/monetization-design.json`
- `.allforai/game-design/approval-records.json` — confirm monetization-design is approved
- Backend schema context: `PlayerDailyReward` model exists in `backend/prisma/schema.prisma`

## Content Requirements

### Design Constraints (from ERRC)

The retention system MUST NOT:
- Gate gameplay behind stamina/energy refills
- Use countdown timers that block progress
- Send aggressive push notification sequences
- Create artificial FOMO through expiring content

The retention system MUST:
- Use intrinsic motivation (narrative curiosity, aesthetic progress)
- Make returning feel like a reward, not an obligation
- Tie every hook to the island restoration narrative

### Daily Visit Reward

The `PlayerDailyReward` backend model already exists. Design the reward structure:

- **Theme:** 律 finds something on the island each morning (a note, a material, a seasonal change)
- **Day 1-6:** Gradual reward escalation (materials → coins → special material → rare material)
- **Day 7:** Chapter-appropriate reward + a brief ひなた moment ("she left something at the dock")
- Streak reset: soft reset only — losing streak gives a "welcome back" gift, not punishment
- No login-gate on gameplay: reward is available but never required to play

Design the reward calendar for:
- Week 1 (D1-D7): onboarding rewards, focused on restoration materials
- Week 2-4 (D8-D30): maintenance rewards, introducing rare materials and memory fragment hints
- D30+: seasonal variation (island seasons, weather changes)

### Chapter Restoration as Intrinsic Hook

The primary retention driver is visual progress. Design:
- **Progress cliff-hangers:** Each chapter ends with the next area partially visible but locked (teaser visual)
- **Restoration milestones:** Within a chapter, 3-4 visual milestones (not just level completion)
- **The lighthouse meta-goal:** Visible but unreachable until Ch6 — always present on the map horizon

### ひなた's Story Beats as Session Hooks

Design 12 ひなた micro-events (approximately 2 per chapter) that:
- Trigger after a player session (not during)
- Are story-adjacent, not gameplay-blocking
- Build relationship tension without romantic declaration

Examples:
- Ch1: After restoring the dock, ひなた leaves a fishing rod at 律's guesthouse door
- Ch2: A pottery shard arrives with a handwritten note
- Ch3: She waits at the forest trail entrance at dusk
- Ch6: She walks to the lighthouse with him in silence

For each event: specify trigger condition, delivery method, content, and emotional resonance goal.

### D1 / D7 / D30 Hook Matrix

For each retention milestone, define:

**D1 (returning the next day):**
- Hook: "What happened to the harbor overnight? Did my materials contribute?"
- Visual: Restoration animation plays when player returns (even 1% progress)
- Reward: Daily gift waiting at dock

**D7 (one week in):**
- Hook: 律 has a dream sequence (brief, atmospheric) referencing ひなた
- Mechanical: New chapter unlocking (Ch2 area visible)
- Social: Friend comparison (soft, opt-in leaderboard — not competitive)

**D30 (one month in):**
- Hook: Memory fragment system fully engaged — player is actively collecting 渉's diary
- Emotional: ひなた reveals something personal about her grandfather
- Mechanical: Island fully through Ch3, lighthouse visible from new angle

### Push Notification Strategy

Design a minimal, opt-in notification strategy:
- Max 1 notification per day
- No notifications after D30 unless player has been absent 3+ days
- Copy tone: gentle, island-voice (written as if from ひなた or the island itself)
- Example: "律さん、潮が引いています。島が待っています。" (The tide is out. The island is waiting.)
- Opt-out must be 1 tap, no penalty

### Competitor Hook Analysis

Include a brief comparison table: Gardenscapes / Township / Fishdom vs. Glow Island on hook strategy (daily gift / energy refill / story events / push notification cadence).

## Output Format

**Primary output:** `.allforai/game-design/retention-hook.html`
- Above fold: Hook loop diagram SVG — trigger → action → reward → investment cycle
- Expanded: Daily/weekly/monthly hook schedule grid (day × hook type × reward)
- Expanded: ひなた story beat schedule (trigger → content → emotional goal)
- Expanded: Push notification strategy with copy examples
- Collapsed: Competitor hook analysis table

**Secondary output:** `.allforai/game-design/systems/retention-hook.json`

```json
{
  "schema": "retention-hook-v1",
  "generated_at": "<ISO>",
  "design_constraints": {
    "no_stamina_gate": true,
    "no_countdown_timers": true,
    "max_daily_notifications": 1,
    "intrinsic_motivation_primary": true
  },
  "daily_reward_calendar": {
    "week_1": [],
    "week_2_to_4": [],
    "d30_plus": "seasonal_variation"
  },
  "hinata_story_beats": [
    {
      "beat_id": "<string>",
      "chapter": "<number>",
      "trigger_condition": "<string>",
      "delivery_method": "<string>",
      "content_summary": "<string>",
      "emotional_goal": "<string>"
    }
  ],
  "retention_milestones": {
    "d1": { "hook": "<string>", "visual": "<string>", "reward": "<string>" },
    "d7": { "hook": "<string>", "mechanical": "<string>", "social": "<string>" },
    "d30": { "hook": "<string>", "emotional": "<string>", "mechanical": "<string>" }
  },
  "push_notification_strategy": {
    "max_per_day": 1,
    "silence_after_days": 30,
    "absence_re-engage_days": 3,
    "examples": []
  }
}
```

## Human Gate Instructions

After generating both output files, update `.allforai/game-design/approval-records.json`:
- Set `gate_status` to `"in-review"` for the `retention-hook-design` record
- Set `updated_at` to current ISO timestamp

Do NOT proceed to `meta-game-design` until `gate_status == "approved"`.
