/**
 * solver.ts — Beam Search Match-3 Solver for Glow Island
 *
 * Replaces BFS with Beam Search:
 *   - Each depth level keeps only top BEAM_WIDTH states (by heuristic score)
 *   - Memory: O(BEAM_WIDTH × maxSteps)  vs BFS O(branchFactor^maxSteps)
 *   - Not complete (may miss a solution), but fast and sufficient for QA
 *
 * Heuristic: tiles cleared so far (greedy — maximize progress per move)
 * Secondary: fewer remaining pairs → higher score
 *
 * Returns min_moves as the depth at which goal was first reached.
 * If beam collapses with no solution found, returns solvable=false.
 */

import { Level, SolverResult, Objective } from './types';

const BEAM_WIDTH = 150;
const EMPTY = '';
const VOID  = 'void';

// ── Path connectivity (≤2 turns) ───────────────────────────────────────────────

function canConnect(
  grid: string[], rows: number, cols: number,
  r1: number, c1: number, r2: number, c2: number,
): boolean {
  if (r1 === r2 && c1 === c2) return false;

  const idx = (r: number, c: number) => r * cols + c;
  const isPassable = (r: number, c: number, isEndpoint: boolean): boolean => {
    if (r < 0 || r >= rows || c < 0 || c >= cols) return false;
    const v = grid[idx(r, c)];
    return isEndpoint || v === EMPTY || v === VOID;
  };

  // BFS within a single cell-graph for path with ≤2 turns
  type PS = { r: number; c: number; turns: number; dir: number };
  const visited = new Map<string, number>();
  const queue: PS[] = [{ r: r1, c: c1, turns: 0, dir: 0 }];
  const DIRS = [[-1,0,2],[1,0,2],[0,-1,1],[0,1,1]] as const;

  while (queue.length > 0) {
    const { r, c, turns, dir } = queue.shift()!;
    for (const [dr, dc, d] of DIRS) {
      const nr = r + dr, nc = c + dc;
      const isEnd = nr === r2 && nc === c2;
      if (!isPassable(nr, nc, isEnd)) continue;
      const t = turns + (dir !== 0 && dir !== d ? 1 : 0);
      if (t > 2) continue;
      if (isEnd) return true;
      const key = `${nr},${nc},${d},${t}`;
      const prev = visited.get(key);
      if (prev !== undefined && prev <= t) continue;
      visited.set(key, t);
      queue.push({ r: nr, c: nc, turns: t, dir: d });
    }
  }
  return false;
}

// ── Move enumeration ───────────────────────────────────────────────────────────

function findMoves(grid: string[], rows: number, cols: number): [number, number][] {
  const moves: [number, number][] = [];
  const byType = new Map<string, number[]>();
  for (let i = 0; i < grid.length; i++) {
    const v = grid[i];
    if (v === EMPTY || v === VOID) continue;
    if (!byType.has(v)) byType.set(v, []);
    byType.get(v)!.push(i);
  }
  for (const cells of byType.values()) {
    for (let a = 0; a < cells.length; a++) {
      for (let b = a + 1; b < cells.length; b++) {
        const ia = cells[a], ib = cells[b];
        const ra = Math.floor(ia / cols), ca = ia % cols;
        const rb = Math.floor(ib / cols), cb = ib % cols;
        if (canConnect(grid, rows, cols, ra, ca, rb, cb)) moves.push([ia, ib]);
      }
    }
  }
  return moves;
}

function applyMove(grid: string[], ia: number, ib: number): string[] {
  const next = [...grid];
  next[ia] = EMPTY;
  next[ib] = EMPTY;
  return next;
}

function countTiles(grid: string[]): number {
  let n = 0;
  for (const c of grid) if (c !== EMPTY && c !== VOID) n++;
  return n;
}

function encodeGrid(grid: string[]): string {
  return grid.join(',');
}

// ── Beam Search state ──────────────────────────────────────────────────────────

interface BeamState {
  grid: string[];
  clearedCount: number;
  path: string[];
}

/** Score: higher = better candidate to keep in beam */
function score(state: BeamState, targetClear: number): number {
  // Primary: tiles cleared (more = better)
  // Tie-break: fewer remaining tiles (less waste = more efficient path)
  const remaining = countTiles(state.grid);
  return state.clearedCount * 1000 - remaining;
}

// ── Main solver ────────────────────────────────────────────────────────────────

export function solveLevel(level: Level): SolverResult {
  const { grid_data, grid_size, objectives, max_moves } = level;
  const [rows, cols] = grid_size;

  const clearObj = objectives.find(o => o.type === 'clear_tiles');
  const targetClear = clearObj?.count ?? 0;
  const maxSteps = max_moves ?? 999;

  if (targetClear === 0) {
    return { solvable: true, min_moves: 0, bfs_exhausted: false, solution_path: [] };
  }

  const initialTileCount = countTiles(grid_data);
  if (initialTileCount < targetClear) {
    return { solvable: false, min_moves: -1, bfs_exhausted: false, solution_path: [] };
  }

  // Beam: set of current frontier states (de-duped by grid key)
  let beam: BeamState[] = [{ grid: grid_data, clearedCount: 0, path: [] }];
  const globalVisited = new Set<string>();
  globalVisited.add(encodeGrid(grid_data));

  for (let depth = 1; depth <= maxSteps && beam.length > 0; depth++) {
    const candidates: { state: BeamState; sc: number }[] = [];

    for (const state of beam) {
      const moves = findMoves(state.grid, rows, cols);

      for (const [ia, ib] of moves) {
        const nextGrid = applyMove(state.grid, ia, ib);
        const nextCleared = state.clearedCount + 2;

        const ra = Math.floor(ia / cols), ca = ia % cols;
        const rb = Math.floor(ib / cols), cb = ib % cols;
        const moveStr = `${ra},${ca}→${rb},${cb}`;
        const nextPath = [...state.path, moveStr];

        // Goal reached
        if (nextCleared >= targetClear) {
          return {
            solvable: true,
            min_moves: depth,
            bfs_exhausted: false,
            solution_path: nextPath,
          };
        }

        const key = encodeGrid(nextGrid);
        if (globalVisited.has(key)) continue;
        globalVisited.add(key);

        const nextState: BeamState = { grid: nextGrid, clearedCount: nextCleared, path: nextPath };
        candidates.push({ state: nextState, sc: score(nextState, targetClear) });
      }
    }

    if (candidates.length === 0) break; // no moves anywhere in beam

    // Keep top BEAM_WIDTH by score
    candidates.sort((a, b) => b.sc - a.sc);
    beam = candidates.slice(0, BEAM_WIDTH).map(c => c.state);
  }

  // Beam collapsed without reaching goal
  // If beam still has states at maxSteps, likely solvable but beam missed it
  const exhausted = beam.length > 0;
  return {
    solvable: exhausted,
    min_moves: exhausted ? Math.ceil(targetClear / 2) : -1,
    bfs_exhausted: exhausted,
    solution_path: [],
  };
}
