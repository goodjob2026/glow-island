#!/usr/bin/env python3
"""
gen_levels.py — Generates level-design.json and updates progression-curve.json
for Glow Island (136 levels across 6 chapters).
"""

import json
import random
import os

random.seed(42)

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GAME_DESIGN_DIR = os.path.join(BASE, ".allforai", "game-design")
LEVEL_DESIGN_PATH = os.path.join(GAME_DESIGN_DIR, "level-design.json")
PROGRESSION_PATH = os.path.join(GAME_DESIGN_DIR, "progression-curve.json")

# ---------------------------------------------------------------------------
# Chapter configuration
# ---------------------------------------------------------------------------

CHAPTER_CONFIG = {
    1: {
        "count": 22,
        "grid_start": [4, 4],
        "grid_end":   [6, 6],
        "tile_pool": ["T01", "T02", "T03", "T04"],
        "obstacles": [],
        "board_events_pool": [],
        "material_reward": "shell_fragment",
        "coin_range": (10, 28),
        "objectives": ["clear_tiles"],
        "special_block_start_level": 10,
    },
    2: {
        "count": 23,
        "grid_start": [6, 6],
        "grid_end":   [7, 7],
        "tile_pool": ["T01", "T02", "T03", "T04", "T05", "T06", "T07", "T08"],
        "obstacles": ["ice_block", "weed"],
        "board_events_pool": [],
        "material_reward": "clay_shard",
        "coin_range": (15, 35),
        "objectives": ["clear_tiles", "clear_ice"],
        "special_block_start_level": 5,
    },
    3: {
        "count": 23,
        "grid_start": [6, 6],
        "grid_end":   [7, 7],
        "tile_pool": ["T01", "T02", "T03", "T04", "T05", "T06", "T07", "T08",
                      "T09", "T10", "T11", "T12"],
        "obstacles": ["ice_block", "chain_lock", "portal", "weed"],
        "board_events_pool": [],
        "material_reward": "pine_needle",
        "coin_range": (20, 40),
        "objectives": ["clear_tiles", "clear_ice", "free_chains"],
        "special_block_start_level": 3,
    },
    4: {
        "count": 22,
        "grid_start": [7, 7],
        "grid_end":   [8, 8],
        "tile_pool": ["T01", "T02", "T03", "T04", "T05", "T06", "T07", "T08",
                      "T09", "T10", "T11", "T12", "T13", "T14", "T15", "T16"],
        "obstacles": ["ice_block", "chain_lock", "portal", "single_path_corridor", "wooden_crate"],
        "board_events_pool": [],
        "material_reward": "torii_fragment",
        "coin_range": (25, 45),
        "objectives": ["clear_tiles", "clear_ice", "free_chains", "traverse_path"],
        "special_block_start_level": 1,
    },
    5: {
        "count": 23,
        "grid_start": [8, 8],
        "grid_end":   [9, 9],
        "tile_pool": ["T01", "T02", "T03", "T04", "T05", "T06", "T07", "T08",
                      "T09", "T10", "T11", "T12", "T13", "T14", "T15", "T16",
                      "T17", "T18"],
        "obstacles": ["ice_block", "chain_lock", "portal", "single_path_corridor",
                      "wooden_crate", "water_current"],
        "board_events_pool": ["tile_fall", "tile_slide", "board_rotate"],
        "material_reward": "rope_fiber",
        "coin_range": (30, 48),
        "objectives": ["clear_tiles", "clear_ice", "free_chains", "traverse_path"],
        "special_block_start_level": 1,
    },
    6: {
        "count": 23,
        "grid_start": [8, 8],
        "grid_end":   [10, 10],
        "tile_pool": ["T01", "T02", "T03", "T04", "T05", "T06", "T07", "T08",
                      "T09", "T10", "T11", "T12", "T13", "T14", "T15", "T16",
                      "T17", "T18", "T19", "T20"],
        "obstacles": ["ice_block", "chain_lock", "portal", "single_path_corridor",
                      "wooden_crate", "water_current", "spreading_obstacle"],
        "board_events_pool": ["tile_fall", "tile_slide", "board_rotate", "vine_spread"],
        "material_reward": "lantern_glass",
        "coin_range": (35, 50),
        "objectives": ["clear_tiles", "clear_ice", "free_chains", "traverse_path", "survive_spread"],
        "special_block_start_level": 1,
    },
}

# ---------------------------------------------------------------------------
# Emotional notes per chapter (cycled)
# ---------------------------------------------------------------------------

EMOTIONAL_NOTES = {
    1: [
        "First steps on the shore — the sea greets you gently.",
        "Warm sand under your feet, a simple puzzle to start.",
        "The dock creaks; a good omen for matching.",
        "Sunlight sparkles on the tiles — easy does it.",
        "Breather: sit on the pier and enjoy the view.",
        "The fisherman waves hello from his boat.",
        "Salt air and coral colours — pure joy.",
        "A calm morning puzzle before the tide comes in.",
        "Things are picking up — the waves grow a little faster.",
        "First special blocks wash ashore like treasure.",
        "The lighthouse blinks in the distance.",
        "Steady rhythm, steady hands.",
        "Mid-chapter challenge: the sea is no longer sleepy.",
        "Even the seagulls are watching.",
        "A little harder now, but still within reach.",
        "High tide — more tiles on the board.",
        "Breather: a coconut and a moment of rest.",
        "The harbour master nods approvingly.",
        "Almost there — the dock is nearly repaired.",
        "Sprint to the finish line of Chapter 1.",
        "Grand finale of the shore — clear the last tiles!",
        "The dock lamp flickers on. Chapter 1 complete.",
    ],
    2: [
        "Welcome to the little town — new tiles, new colours.",
        "Ice has crept in overnight; chip it away carefully.",
        "The fountain is frozen solid — time to thaw it.",
        "Breather: a hot bowl of noodles at the market stall.",
        "Weeds tangle the cobblestones — clear them out.",
        "Lanterns sway above; the path is icy but pretty.",
        "Combo streaks echo off the town walls.",
        "The baker watches from her window — match faster!",
        "Ice layers deepen; patience is your friend.",
        "Windmill power unlocked — sweep the street.",
        "Breather: the flower vendor smiles at your progress.",
        "Mid-chapter push — the whole square needs clearing.",
        "Ice and weeds together: a delicate dance.",
        "The mayor's office window is still frosted.",
        "A crisp winter challenge.",
        "Weeds are retreating, but ice holds firm.",
        "Breather: warm chestnuts from a street vendor.",
        "Almost all the frost is gone.",
        "Final ice blockade before the chapter ends.",
        "The street lamps flicker to life.",
        "One last sweep of the icy square.",
        "The town square sparkles clean.",
        "Chapter 2 done — the fountain flows again!",
    ],
    3: [
        "Flower fields in bloom — and chain locks on the tiles.",
        "A gentle portal appears; discover zero-turn traversal.",
        "Locked tiles rattle their chains as you approach.",
        "Breather: butterflies settle on the clover patch.",
        "Two portals now — the path folds through space.",
        "Chain locks demand direct matches — no shortcuts.",
        "Ice and chains together for the first time.",
        "The cherry blossoms distract, but focus wins.",
        "Breather: the shepherd hums a folk tune.",
        "Lantern tiles glow like fireflies in the field.",
        "Portals shortcut the longest paths.",
        "Deep into the flower maze — chains everywhere.",
        "Ice layers thicken as the altitude rises.",
        "Breather: a wildflower to pick for the journey.",
        "Three-ring chains: persistence required.",
        "Portals and chains interlock — plan ahead.",
        "The hilltop is almost clear.",
        "Final push through lavender and locked tiles.",
        "Ice, chains, and portals all at once.",
        "Only a handful of stubborn locks remain.",
        "The wind carries petal confetti across the board.",
        "Last chain shatters — the flowers are free.",
        "Chapter 3 complete — the hillside blooms fully.",
    ],
    4: [
        "Forest paths narrow; a single corridor guides the way.",
        "Wooden crates block the shortcuts — plan your route.",
        "The campfire flickers in the distance.",
        "Breather: fireflies blink in the dusky forest.",
        "Corridors and portals weave a forest labyrinth.",
        "Chain locks in the undergrowth — three rings each.",
        "Crates force a different path — adapt.",
        "The owls hoot encouragement from the treetops.",
        "Ice in the forest is tougher than coastal frost.",
        "Breather: a warm tent and starlight above.",
        "Corridor-guided matches feel like forest trails.",
        "The campfire needs kindling — clear those tiles.",
        "Wooden crates and chain locks: a puzzle fortress.",
        "Night falls; the board grows with the darkness.",
        "Breather: roasting chestnuts by the fire.",
        "The forest path twists and narrows again.",
        "All mechanics converge in the deep woods.",
        "The forest guardian watches your every move.",
        "Final corridor — one precise route to victory.",
        "Crates, chains, and corridors — the grand test.",
        "The campfire blazes as you near the end.",
        "One last wilderness challenge.",
        "Chapter 4 complete — the campfire roars!",
    ],
    5: [
        "Hot springs rise from the valley — gravity pulls tiles down.",
        "Tiles fall after each match; new patterns emerge.",
        "Sliding surfaces shift the board sideways.",
        "Breather: soak your feet in a warm pool.",
        "The board rotates — orient yourself quickly.",
        "Water currents resist your path calculations.",
        "Gravity stacks tiles in unexpected corners.",
        "A slide surface funnels tiles toward the hot spring.",
        "Board rotation every four moves — stay nimble.",
        "Breather: the mist clears to reveal a calm pool.",
        "Water and gravity intertwine.",
        "Ice in a thermal valley melts faster — but not fast enough.",
        "The valley floor shifts; corridors re-route mid-game.",
        "Tile cascade after a big combo — satisfying.",
        "Breather: a bamboo ladle of spring water.",
        "Board rotate + tile fall = controlled chaos.",
        "The hot spring is almost clear.",
        "Chain locks underwater require extra effort.",
        "Final gravity challenge — tiles rain from the top.",
        "The valley resonates with the last big cascade.",
        "Water currents make the last few tiles tricky.",
        "Gravity carries you to the finish.",
        "Chapter 5 done — the hot spring is pristine.",
    ],
    6: [
        "Night falls on the lighthouse; vines creep across the board.",
        "The spreading obstacle moves faster than the tide.",
        "Lantern light reveals hidden tile paths.",
        "Breather: a single candle in the lighthouse window.",
        "Vines reach the center — time is running out.",
        "All 20 tile types shimmer in the lighthouse beam.",
        "Spreading moss and chain locks: a final reckoning.",
        "The lighthouse keeper shouts encouragement.",
        "Board rotation under vine pressure — breathe.",
        "Breather: moonlight softens the challenge briefly.",
        "Ice at the top of the lighthouse is centuries old.",
        "Corridors wind around the lighthouse spiral.",
        "Vines spread every move — no time to hesitate.",
        "Gravity, vines, and portals in concert.",
        "The light prism scatters colour across the board.",
        "Breather: a break before the final ascent.",
        "The beacon flickers — clear the vines to save it.",
        "All obstacles converge at the lantern room.",
        "Final vine wave sweeps the board.",
        "The lighthouse shakes; keep matching.",
        "One step from glory — the beam almost steady.",
        "Last tiles; last vines; last chance.",
        "Chapter 6 complete — the lighthouse blazes across the island!",
    ],
}

# ---------------------------------------------------------------------------
# Helper utilities
# ---------------------------------------------------------------------------

def lerp_grid(start, end, level_idx, total_levels):
    """Linearly interpolate grid size, snap to integer steps."""
    t = level_idx / max(total_levels - 1, 1)
    cols = round(start[0] + (end[0] - start[0]) * t)
    rows = round(start[1] + (end[1] - start[1]) * t)
    # ensure even increment only (keep symmetric)
    return [cols, rows]

def random_positions(grid, count):
    """Return `count` unique [row, col] positions within grid."""
    all_cells = [[r, c] for r in range(grid[0]) for c in range(grid[1])]
    random.shuffle(all_cells)
    return all_cells[:count]

def pick_tile_types(pool, level_idx, total_levels):
    """Gradually expand available tile types across a chapter."""
    # start with 2 types, grow to full pool
    max_types = len(pool)
    min_types = min(2, max_types)
    t = level_idx / max(total_levels - 1, 1)
    n = round(min_types + (max_types - min_types) * t)
    n = max(min_types, min(n, max_types))
    return pool[:n]

def max_moves_for(chapter, level_idx, total_levels, grid):
    """Return max_moves (None early, 20-40 later)."""
    progress = level_idx / max(total_levels - 1, 1)
    if chapter == 1 and progress < 0.5:
        return None
    if chapter == 2 and progress < 0.3:
        return None
    board_cells = grid[0] * grid[1]
    # scale moves with board size and chapter
    base = 20 + (chapter - 1) * 3
    size_bonus = (board_cells - 16) // 4
    jitter = random.randint(-3, 3)
    moves = base + size_bonus + jitter
    # breather levels (every 4th) get a few extra moves
    if (level_idx + 1) % 4 == 0:
        moves += 5
    return max(20, min(40, moves))

def coin_reward(chapter, level_idx, total_levels, coin_range):
    lo, hi = coin_range
    t = level_idx / max(total_levels - 1, 1)
    base = lo + round((hi - lo) * t)
    jitter = random.randint(-3, 3)
    return max(lo, min(hi, base + jitter))

def material_amount(chapter, level_idx, total_levels):
    """3-8 materials, growing with chapter and progress."""
    t = level_idx / max(total_levels - 1, 1)
    base = 3 + chapter
    extra = round(t * 3)
    jitter = random.randint(-1, 1)
    return max(2, base + extra + jitter)

# ---------------------------------------------------------------------------
# Obstacle generators
# ---------------------------------------------------------------------------

def gen_ice_blocks(grid, chapter, level_idx, total_levels):
    if chapter < 2:
        return []
    progress = level_idx / max(total_levels - 1, 1)
    count = random.randint(1, max(1, round(progress * 4) + 1))
    count = min(count, (grid[0] * grid[1]) // 6)
    # layer range grows with chapter
    if chapter == 2:
        max_layer = 1
    elif chapter == 3:
        max_layer = 2
    else:
        max_layer = 3
    positions = random_positions(grid, count)
    return [
        {"type": "ice_block", "position": pos, "layers": random.randint(1, max_layer)}
        for pos in positions
    ]

def gen_weed(grid, chapter, level_idx, total_levels):
    if chapter < 2:
        return []
    progress = level_idx / max(total_levels - 1, 1)
    if progress < 0.2:
        return []
    count = random.randint(0, max(0, round(progress * 3)))
    count = min(count, (grid[0] * grid[1]) // 8)
    positions = random_positions(grid, count)
    return [{"type": "weed", "position": pos} for pos in positions]

def gen_chain_locks(grid, chapter, level_idx, total_levels):
    if chapter < 3:
        return []
    progress = level_idx / max(total_levels - 1, 1)
    count = random.randint(1, max(1, round(progress * 3) + 1))
    count = min(count, (grid[0] * grid[1]) // 8)
    if chapter == 3:
        max_rings = 2
    else:
        max_rings = 3
    positions = random_positions(grid, count)
    return [
        {"type": "chain_lock", "position": pos, "required_matches": random.randint(1, max_rings)}
        for pos in positions
    ]

def gen_portals(grid, chapter, level_idx, total_levels):
    if chapter < 3:
        return []
    progress = level_idx / max(total_levels - 1, 1)
    num_pairs = 1 if chapter == 3 else (1 if progress < 0.5 else 2)
    obstacles = []
    for pair_id in range(num_pairs):
        pair_positions = random_positions(grid, 2)
        if len(pair_positions) < 2:
            continue
        obstacles.append({"type": "portal", "position": pair_positions[0],
                          "pair_id": pair_id, "role": "entry"})
        obstacles.append({"type": "portal", "position": pair_positions[1],
                          "pair_id": pair_id, "role": "exit"})
    return obstacles

def gen_single_path_corridor(grid, chapter, level_idx, total_levels):
    if chapter < 4:
        return []
    progress = level_idx / max(total_levels - 1, 1)
    if progress < 0.1:
        return []
    # pick a horizontal corridor mid-board
    mid_row = grid[0] // 2
    corridor_len = random.randint(2, max(2, grid[1] - 2))
    start_col = random.randint(0, grid[1] - corridor_len)
    cells = [[mid_row, start_col + i] for i in range(corridor_len)]
    return [{"type": "single_path_corridor", "cells": cells,
             "direction": random.choice(["horizontal", "vertical"])}]

def gen_wooden_crates(grid, chapter, level_idx, total_levels):
    if chapter < 4:
        return []
    progress = level_idx / max(total_levels - 1, 1)
    if progress < 0.2:
        return []
    count = random.randint(1, max(1, round(progress * 2)))
    count = min(count, (grid[0] * grid[1]) // 10)
    positions = random_positions(grid, count)
    return [{"type": "wooden_crate", "position": pos} for pos in positions]

def gen_water_current(grid, chapter, level_idx, total_levels):
    if chapter < 5:
        return []
    progress = level_idx / max(total_levels - 1, 1)
    if progress < 0.15:
        return []
    count = random.randint(1, 2)
    positions = random_positions(grid, count)
    dirs = ["up", "down", "left", "right"]
    return [
        {"type": "water_current", "position": pos,
         "initial_direction": random.choice(dirs),
         "change_interval_s": 5}
        for pos in positions
    ]

def gen_spreading_obstacle(grid, chapter, level_idx, total_levels):
    if chapter < 6:
        return []
    progress = level_idx / max(total_levels - 1, 1)
    count = random.randint(2, min(4, max(2, round(progress * 4))))
    positions = random_positions(grid, count)
    variant = random.choice(["vine", "moss"])
    return [
        {"type": "spreading_obstacle", "position": pos, "variant": variant,
         "spread_interval_moves": random.choice([1, 2])}
        for pos in positions
    ]

# ---------------------------------------------------------------------------
# Obstacle orchestration
# ---------------------------------------------------------------------------

def build_obstacles(chapter, level_idx, total_levels, grid, cfg):
    obstacles = []
    active = cfg["obstacles"]
    # collect used positions to avoid stacking on same cell
    used = set()

    def dedup(obs_list):
        result = []
        for o in obs_list:
            pos = o.get("position") or (o.get("cells") or [[]])[0]
            key = tuple(pos)
            if key not in used:
                used.add(key)
                result.append(o)
        return result

    if "ice_block" in active:
        obstacles += dedup(gen_ice_blocks(grid, chapter, level_idx, total_levels))
    if "weed" in active:
        obstacles += dedup(gen_weed(grid, chapter, level_idx, total_levels))
    if "chain_lock" in active:
        obstacles += dedup(gen_chain_locks(grid, chapter, level_idx, total_levels))
    if "portal" in active:
        obstacles += dedup(gen_portals(grid, chapter, level_idx, total_levels))
    if "single_path_corridor" in active:
        obstacles += dedup(gen_single_path_corridor(grid, chapter, level_idx, total_levels))
    if "wooden_crate" in active:
        obstacles += dedup(gen_wooden_crates(grid, chapter, level_idx, total_levels))
    if "water_current" in active:
        obstacles += dedup(gen_water_current(grid, chapter, level_idx, total_levels))
    if "spreading_obstacle" in active:
        obstacles += dedup(gen_spreading_obstacle(grid, chapter, level_idx, total_levels))
    return obstacles

# ---------------------------------------------------------------------------
# Special block generator
# ---------------------------------------------------------------------------

SPECIAL_BLOCK_TYPES = ["bomb", "windmill", "lantern", "wave"]
CH_SPECIAL_UNLOCK = {1: ["bomb"], 2: ["bomb", "windmill"],
                     3: ["bomb", "windmill", "lantern"],
                     4: ["bomb", "windmill", "lantern", "wave"],
                     5: ["bomb", "windmill", "lantern", "wave"],
                     6: ["bomb", "windmill", "lantern", "wave"]}

def build_special_blocks(chapter, level_idx, total_levels, grid, cfg):
    if level_idx + 1 < cfg["special_block_start_level"]:
        return []
    available = CH_SPECIAL_UNLOCK[chapter]
    count = random.randint(0, min(2, len(available)))
    if count == 0:
        return []
    chosen_types = random.sample(available, count)
    positions = random_positions(grid, count)
    return [
        {"type": t, "position": positions[i]}
        for i, t in enumerate(chosen_types)
    ]

# ---------------------------------------------------------------------------
# Board events
# ---------------------------------------------------------------------------

def build_board_events(chapter, level_idx, total_levels, cfg):
    pool = cfg["board_events_pool"]
    if not pool:
        return []
    progress = level_idx / max(total_levels - 1, 1)
    # Ch5: tile_fall starts early, others mid/late
    # Ch6: vine_spread always present
    events = []
    if chapter == 5:
        if progress >= 0.05:
            events.append({"type": "tile_fall", "enabled": True})
        if progress >= 0.35 and "tile_slide" in pool:
            events.append({"type": "tile_slide", "enabled": True,
                           "direction": random.choice(["left", "right"])})
        if progress >= 0.65 and "board_rotate" in pool:
            events.append({"type": "board_rotate", "enabled": True,
                           "trigger_every_n_moves": random.choice([3, 4, 5])})
    elif chapter == 6:
        events.append({"type": "tile_fall", "enabled": True})
        if progress >= 0.1 and "vine_spread" in pool:
            events.append({"type": "vine_spread", "enabled": True,
                           "spread_interval_moves": 2})
        if progress >= 0.4 and "tile_slide" in pool:
            events.append({"type": "tile_slide", "enabled": True,
                           "direction": random.choice(["left", "right"])})
        if progress >= 0.7 and "board_rotate" in pool:
            events.append({"type": "board_rotate", "enabled": True,
                           "trigger_every_n_moves": random.choice([3, 4])})
    return events

# ---------------------------------------------------------------------------
# Objective generator
# ---------------------------------------------------------------------------

def build_objectives(chapter, level_idx, total_levels, grid, obstacles):
    grid_cells = grid[0] * grid[1]
    # Determine which objective types are usable this level
    ice_blocks = [o for o in obstacles if o.get("type") == "ice_block"]
    chain_locks = [o for o in obstacles if o.get("type") == "chain_lock"]
    corridors   = [o for o in obstacles if o.get("type") == "single_path_corridor"]
    spreading   = [o for o in obstacles if o.get("type") == "spreading_obstacle"]

    objectives = []

    # Primary: always clear_tiles
    tile_count = random.randint(max(4, grid_cells // 4), max(8, grid_cells // 2))
    objectives.append({"type": "clear_tiles", "tile_type": "any", "count": tile_count})

    # Secondary objectives based on chapter / obstacles present
    if ice_blocks and chapter >= 2:
        objectives.append({"type": "clear_ice", "count": len(ice_blocks)})

    if chain_locks and chapter >= 3:
        objectives.append({"type": "free_chains", "count": len(chain_locks)})

    if corridors and chapter >= 4:
        objectives.append({"type": "traverse_path", "corridor_count": len(corridors)})

    if spreading and chapter == 6:
        objectives.append({"type": "survive_spread",
                           "tile_count": tile_count,
                           "spreading_obstacle_type": "spreading_obstacle"})

    return objectives

# ---------------------------------------------------------------------------
# Main level generator
# ---------------------------------------------------------------------------

def generate_level(chapter, level_number, level_idx, cfg):
    total = cfg["count"]
    grid = lerp_grid(cfg["grid_start"], cfg["grid_end"], level_idx, total)

    tile_pool = cfg["tile_pool"]
    tile_types = pick_tile_types(tile_pool, level_idx, total)

    obstacles = build_obstacles(chapter, level_idx, total, grid, cfg)
    special_blocks = build_special_blocks(chapter, level_idx, total, grid, cfg)
    board_events = build_board_events(chapter, level_idx, total, cfg)
    objectives = build_objectives(chapter, level_idx, total, grid, obstacles)
    moves = max_moves_for(chapter, level_idx, total, grid)
    coins = coin_reward(chapter, level_idx, total, cfg["coin_range"])
    mat_amount = material_amount(chapter, level_idx, total)

    notes = EMOTIONAL_NOTES[chapter]
    note = notes[level_idx % len(notes)]

    return {
        "id": f"{chapter}-{level_number}",
        "chapter": chapter,
        "level": level_number,
        "grid_size": grid,
        "tile_types": tile_types,
        "objectives": objectives,
        "max_moves": moves,
        "obstacles": obstacles,
        "special_blocks": special_blocks,
        "board_events": board_events,
        "material_reward": {
            "type": cfg["material_reward"],
            "amount": mat_amount,
        },
        "coin_reward": coins,
        "emotional_note": note,
    }

# ---------------------------------------------------------------------------
# Build all levels
# ---------------------------------------------------------------------------

all_levels = []
for ch in range(1, 7):
    cfg = CHAPTER_CONFIG[ch]
    for lv in range(1, cfg["count"] + 1):
        level = generate_level(ch, lv, lv - 1, cfg)
        all_levels.append(level)

output = {
    "version": "2.0",
    "generated_at": "2026-05-08",
    "total_levels": len(all_levels),
    "levels": all_levels,
}

with open(LEVEL_DESIGN_PATH, "w", encoding="utf-8") as f:
    json.dump(output, f, ensure_ascii=False, indent=2)

print(f"Written {len(all_levels)} levels to {LEVEL_DESIGN_PATH}")

# ---------------------------------------------------------------------------
# Update progression-curve.json
# ---------------------------------------------------------------------------

with open(PROGRESSION_PATH, "r", encoding="utf-8") as f:
    progression = json.load(f)

progression["_meta"]["version"] = "2.0"
progression["_meta"]["date"] = "2026-05-08"
progression["_meta"]["changelog"] = "v2: synced with level-design.json — added chapter_mechanics_unlock field"

progression["chapter_mechanics_unlock"] = [
    {
        "chapter": 1,
        "theme": "海边码头",
        "level_count": 22,
        "grid_range": "4×4 → 6×6",
        "new_mechanics": ["基础连连看", "连击系统(combo)", "特殊块: 炸弹(3连击)"],
        "obstacles_introduced": [],
        "board_events_introduced": [],
        "special_blocks_available": ["bomb"],
        "tile_types_introduced": ["T01", "T02", "T03", "T04"],
        "objectives_available": ["clear_tiles"],
        "material_reward": "shell_fragment",
    },
    {
        "chapter": 2,
        "theme": "中央小镇",
        "level_count": 23,
        "grid_range": "6×6 → 7×7",
        "new_mechanics": ["冰封块(1层)", "杂草障碍", "风车(4连击)"],
        "obstacles_introduced": ["ice_block", "weed"],
        "board_events_introduced": [],
        "special_blocks_available": ["bomb", "windmill"],
        "tile_types_introduced": ["T05", "T06", "T07", "T08"],
        "objectives_available": ["clear_tiles", "clear_ice"],
        "material_reward": "clay_shard",
    },
    {
        "chapter": 3,
        "theme": "花田山坡",
        "level_count": 23,
        "grid_range": "6×6 → 7×7",
        "new_mechanics": ["锁链(1~2环)", "传送门(零转弯代价)", "冰封块升级至2层", "灯光块(关卡预置)"],
        "obstacles_introduced": ["chain_lock", "portal"],
        "board_events_introduced": [],
        "special_blocks_available": ["bomb", "windmill", "lantern"],
        "tile_types_introduced": ["T09", "T10", "T11", "T12"],
        "objectives_available": ["clear_tiles", "clear_ice", "free_chains"],
        "material_reward": "pine_needle",
    },
    {
        "chapter": 4,
        "theme": "森林露营地",
        "level_count": 22,
        "grid_range": "7×7 → 8×8",
        "new_mechanics": ["单路径通道", "木箱障碍(永久)", "冰封块升级至3层", "锁链升级至3环", "海浪块(关卡预置)"],
        "obstacles_introduced": ["single_path_corridor", "wooden_crate"],
        "board_events_introduced": [],
        "special_blocks_available": ["bomb", "windmill", "lantern", "wave"],
        "tile_types_introduced": ["T13", "T14", "T15", "T16"],
        "objectives_available": ["clear_tiles", "clear_ice", "free_chains", "traverse_path"],
        "material_reward": "torii_fragment",
    },
    {
        "chapter": 5,
        "theme": "温泉山谷",
        "level_count": 23,
        "grid_range": "8×8 → 9×9",
        "new_mechanics": ["重力下落(tile_fall)", "方块滑落(tile_slide)", "棋盘旋转(board_rotate)", "水流障碍"],
        "obstacles_introduced": ["water_current"],
        "board_events_introduced": ["tile_fall", "tile_slide", "board_rotate", "water_flow"],
        "special_blocks_available": ["bomb", "windmill", "lantern", "wave"],
        "tile_types_introduced": ["T17", "T18"],
        "objectives_available": ["clear_tiles", "clear_ice", "free_chains", "traverse_path"],
        "material_reward": "rope_fiber",
    },
    {
        "chapter": 6,
        "theme": "夜晚灯塔",
        "level_count": 23,
        "grid_range": "8×8 → 10×10",
        "new_mechanics": ["扩散障碍(藤蔓/苔藓)", "所有20种图块全部启用", "全机制组合挑战"],
        "obstacles_introduced": ["spreading_obstacle"],
        "board_events_introduced": ["vine_spread"],
        "special_blocks_available": ["bomb", "windmill", "lantern", "wave"],
        "tile_types_introduced": ["T19", "T20"],
        "objectives_available": ["clear_tiles", "clear_ice", "free_chains", "traverse_path", "survive_spread"],
        "material_reward": "lantern_glass",
    },
]

with open(PROGRESSION_PATH, "w", encoding="utf-8") as f:
    json.dump(progression, f, ensure_ascii=False, indent=2)

print(f"Updated progression-curve.json at {PROGRESSION_PATH}")
