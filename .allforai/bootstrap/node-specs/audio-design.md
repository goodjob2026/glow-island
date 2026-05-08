# Node Spec: audio-design

## Role
Design the complete audio system for Glow Island — BGM per chapter/scene, SFX catalogue, and UI sound design. The audio identity should reinforce the healing aesthetic: gentle, Japanese-inflected, ambient. Verify and document the 12 SFX keys already implemented in AudioManager.ts.

**discipline_owner:** audio-director  
**discipline_reviewers:** lead-designer  
**capability:** game-design  
**human_gate:** true

## Context Pull

Read these files before generating output:
- `.allforai/product-concept/concept-baseline.json` — art style (Animal Crossing), gameplay feel (天天爱消除), chapter emotional arc
- `.allforai/game-design/game-design-document.md` — 6-chapter narrative, NPC roster
- `game-client/assets/scripts/audio/AudioManager.ts` — existing implementation; extract SFX enum keys
- `game-client/assets/scripts/audio/AudioConfig.ts` — existing BGM/SFX config; extract channel definitions
- `.allforai/game-design/approval-records.json` — confirm core-loop-design is approved

## Content Requirements

### Audio Identity Statement

Write a 2-3 sentence audio identity statement covering:
- Genre: acoustic + ambient + light electronic
- Mood: healing, unhurried, quietly joyful
- Key instruments: acoustic guitar, koto (琴), soft piano, ambient field recordings (ocean, wind, birds)
- Forbidden sounds: aggressive percussion, distorted bass, high-BPM electronic, triumphant brass fanfares

### Existing SFX Verification

Read `AudioManager.ts` and `AudioConfig.ts`. Extract all SFX enum keys currently defined. Verify that the following 12 core SFX are covered:

| # | Key | Event | Expected feel |
|---|-----|-------|--------------|
| 1 | `tile_connect` | Two tiles connected | Soft chime, resonant |
| 2 | `tile_clear` | Tiles cleared from board | Light sparkle burst |
| 3 | `combo_x2` | 2-combo triggered | Two ascending notes |
| 4 | `combo_x3` | 3-combo triggered | Three ascending notes, brighter |
| 5 | `combo_x4_plus` | 4+ combo triggered | Cascade of notes, celebratory |
| 6 | `special_bomb` | Bomb block explodes | Muffled pop + chime |
| 7 | `special_line_clear` | Line-clear block fires | Swoosh + clear tone |
| 8 | `special_auto_connect` | Auto-connect block activates | Shimmer + connection chain |
| 9 | `special_reshuffle` | Reshuffle block fires | Swirl + rearrange whoosh |
| 10 | `level_complete` | Level completed | Ascending arpeggio, warm |
| 11 | `area_restore` | Island area restoration | Multi-layer swell, emotional peak |
| 12 | `lighthouse_final` | Lighthouse lights up | Full ambient swell + distant bell |

For each: confirm it exists in the enum, specify the target feel if it needs update, and note if any is missing.

### Chapter BGM Design

Design BGM for each chapter that matches the emotional arc:

| Chapter | Area | Emotional Tone | Instruments | BPM Range | Notes |
|---------|------|----------------|-------------|-----------|-------|
| Ch1 | Harbor | Curious, slightly melancholic | Acoustic guitar + ocean ambience | 60-70 | Morning light feel |
| Ch2 | Pottery studio | Focused, rhythmic | Koto + soft percussion | 70-80 | Repetitive but never boring |
| Ch3 | Forest path | Wonder, expansive | Piano + wind ambience + birdsong | 55-65 | Spacious, reverb-heavy |
| Ch4 | Stone path | Introspective, quiet | Solo piano or guitar | 50-60 | Minimal, meditative |
| Ch5 | Cliff lookout | Awe, slightly tense | Layered ambient + koto | 65-75 | Build over time in-session |
| Ch6 | Lighthouse | Emotional climax | Full ensemble swell | 60-70 | Dynamic: quiet start → radiant finish |

Also design BGM for:
- **Main menu / island map:** Gentle, ambient, island atmosphere
- **Level complete:** Short 4-8 second sting (not looping)
- **Restoration ceremony:** 8-12 second emotional swell (not looping)
- **Lighthouse finale:** 20-30 second special sequence (one-time play)

### UI Sound Design

Design micro-sounds for UI interactions:
- Button tap: soft, non-intrusive click (no harsh click sounds)
- Menu open/close: paper slide or gentle whoosh
- Shop item select: coin shimmer
- Dialogue advance: subtle text-reveal tick
- Error/cannot-do: gentle low tone (not harsh buzzer)
- Notification/badge: soft chime (1 note)

### Voice / Narration Style

Glow Island uses **no full voice acting**. Design the voice/narration approach:
- Japanese murmur: characters occasionally emit wordless sounds (humming, sighs, short syllables like "うん" or "ああ")
- 律's internal monologue: delivered as on-screen text with slight delay typing effect; no audio reading
- ひなた's moments: optional 1-2 syllable audio (e.g., a soft "律さん…") — never full sentences
- NPCs: single atmospheric vocal (fisherman's gruff laugh, potter's contented hum)

This approach preserves intimacy without full localization cost.

### Adaptive Music System

Design the adaptive layer structure:
- **Base layer:** Always playing (ambient/atmosphere)
- **Melody layer:** Fades in after 10+ seconds of active play
- **Intensity layer:** Activates during combo chains; fades after 3 seconds
- **Transition rules:** 2-second crossfade between chapters; no hard cuts

## Output Format

**Primary output:** `.allforai/game-design/audio-design.html`
- Above fold: Audio identity statement (2-3 sentences: genre, mood, instruments, forbidden sounds)
- Below: Adaptive music system diagram SVG — layers, triggers, crossfade rules
- Below: SFX catalogue table (event → key → loop? → 3D spatial? → priority) — sortable; highlight any missing/unverified keys in red
- Below: BGM chapter table with emotional tone and instrument breakdown
- Below: UI sound design catalogue
- Below: Voice/narration style spec
- Collapsed: Full audio asset list with milestone gates

**Secondary output:** `.allforai/game-design/systems/audio-design.json`

```json
{
  "schema": "audio-design-v1",
  "generated_at": "<ISO>",
  "audio_identity": {
    "genre": "<string>",
    "mood": "<string>",
    "key_instruments": [],
    "forbidden_sounds": []
  },
  "sfx_catalogue": [
    {
      "key": "tile_connect",
      "event": "<string>",
      "feel": "<string>",
      "loop": false,
      "spatial_3d": false,
      "priority": "high",
      "verified_in_audio_manager": true,
      "milestone_gate": "alpha"
    }
  ],
  "bgm_chapters": [
    {
      "chapter": 1,
      "area": "harbor",
      "emotional_tone": "<string>",
      "instruments": [],
      "bpm_range": "<string>",
      "looping": true,
      "milestone_gate": "alpha"
    }
  ],
  "bgm_scenes": [],
  "ui_sounds": [],
  "voice_style": {
    "full_voice_acting": false,
    "murmur_style": "japanese_wordless",
    "hinata_audio": "1-2_syllables_optional",
    "narration_mode": "text_only"
  },
  "adaptive_system": {
    "layers": ["base", "melody", "intensity"],
    "crossfade_seconds": 2,
    "intensity_trigger": "combo_chain",
    "intensity_fade_seconds": 3
  }
}
```

## Human Gate Instructions

After generating both output files, update `.allforai/game-design/approval-records.json`:
- Set `gate_status` to `"in-review"` for the `audio-design` record
- Set `updated_at` to current ISO timestamp

Do NOT proceed to `game-design-finalize` until `gate_status == "approved"`.
