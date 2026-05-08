# Node Spec: character-arc-design

## Role
Design the emotional arcs and character development trajectories for all named characters across Glow Island's 6 chapters. Establish 山田律's transformation from burnout to healing, ひなた's subtle romantic thread, and each NPC's narrative function.

**discipline_owner:** narrative-designer  
**discipline_reviewers:** lead-designer  
**capability:** game-design  
**human_gate:** true

## Context Pull

Read these files before generating output:
- `.allforai/product-concept/concept-baseline.json` — protagonist/romantic interest specs, NPC roster, chapter structure
- `.allforai/game-design/worldbuilding-bible.md` (if approved) or `.allforai/game-design/worldbuilding-bible.html`
- `.allforai/game-design/game-design-document.md` — overall narrative framing
- `.allforai/game-design/approval-records.json` — confirm worldbuilding is approved before proceeding

## Content Requirements

### 山田律 (Yamada Ritsu) — 6-Chapter Arc

Design a complete positive transformation arc (Wound → Lie → Truth):

- **Wound:** 5-year burnout as creative director; lost connection to meaning and beauty
- **Ch1 (磯部健三 / harbor):** Resistance and awkwardness on the island; discovers manual work is calming
- **Ch2 (桐島梅子 / pottery):** Confronts perfectionism; learns craft has value without audience
- **Ch3 (海野夏帆 / forest path):** First moment of genuine wonder at natural beauty; starts sketching again
- **Ch4 (isolated trail):** Solo introspection; letter to self he never sends; sits with silence comfortably
- **Ch5 (gravity/cliff area):** Physical challenge echoes internal resilience; chooses to stay longer than planned
- **Ch6 (灯台 / lighthouse):** Completes the island restoration; the lighthouse lights up — 律 understands what 渉's letter meant

For each chapter: specify the **emotional state at entry**, **turning point moment**, **emotional state at exit**, and the **one dialogue line** that captures the chapter beat.

### 丸山ひなた (Maruyama Hinata) — Relationship Progression

The romantic thread is **implicit, never stated**. No confession, no kiss. Design the arc as:
- Presence escalation (Ch1: brief appearance, Ch6: walks to lighthouse together)
- Micro-interactions (a shared glance, a returned umbrella, a chapter-end scene)
- Per chapter: specify **ひなた's emotional state**, **one shared moment with 律**, and **what she reveals about 渉's past**

### NPC Character Moments

For each NPC provide: role in chapter, single defining character beat, what they teach 律, and their relationship to 丸山渉 (grandfather).

| NPC | Chapter | Character Moment |
|-----|---------|-----------------|
| 磯部健三 (Isobe Kenzo) | Ch1 | Old fisherman; shows 律 how to tie nets; says "the island was livelier before" |
| 桐島梅子 (Kirishima Umeko) | Ch2 | Potter; lets 律 fail at throwing clay; refuses to give advice until asked twice |
| 海野夏帆 (Umino Naho) | Ch3 | Nature guide; knows every plant name; hints 渉 used to walk here with her |
| 丸山冬子 (Maruyama Fuyuko) | Ch6 | 渉's wife; final scene gatekeeper; gives 律 渉's last journal entry |

### 丸山渉 (Maruyama Wataru) — Absent Character Arc

渉 is dead before the story starts. Design his arc as revealed through:
- Memory fragments (journal entries unlocked per chapter)
- NPC anecdotes
- The letter that brought 律 to the island
Specify: what 渉 wanted 律 to discover, and the 6 journal entry themes (one per chapter).

## Output Format

**Primary output:** `.allforai/game-design/character-arc.html`
- Above fold: Per-character arc timeline (horizontal, one row per character; X: chapter 1-6, annotate turning points)
- Expanded: Character sheet per character — motivation / wound / lie / truth / arc type
- Expanded: Relationship web SVG — nodes = characters, edges = relationship type + tension at start/end
- Collapsed: Scene-by-scene character presence matrix

**Secondary output:** `.allforai/game-design/systems/character-arc.json`

```json
{
  "schema": "character-arc-v1",
  "generated_at": "<ISO>",
  "characters": [
    {
      "character_id": "yamada-ritsu",
      "name_jp": "山田律",
      "arc_type": "positive",
      "wound": "<string>",
      "lie": "<string>",
      "truth": "<string>",
      "chapter_beats": [
        {
          "chapter": 1,
          "emotional_state_entry": "<string>",
          "turning_point": "<string>",
          "emotional_state_exit": "<string>",
          "key_dialogue": "<string>"
        }
      ]
    }
  ],
  "relationship_edges": [
    {
      "from": "<character_id>",
      "to": "<character_id>",
      "relationship_type": "<string>",
      "tension_start": "<string>",
      "tension_end": "<string>"
    }
  ],
  "memory_fragments": [
    {
      "chapter": 1,
      "theme": "<string>",
      "unlock_trigger": "<string>",
      "prose_excerpt": "<string>"
    }
  ]
}
```

## Human Gate Instructions

After generating both output files, update `.allforai/game-design/approval-records.json`:
- Set `gate_status` to `"in-review"` for the `character-arc-design` record
- Set `updated_at` to current ISO timestamp

Do NOT proceed to `game-design-finalize` until `gate_status == "approved"`.
