/**
 * pipeline.ts
 *
 * Orchestrates: generate → solve → accept/retry → write
 *
 * Acceptance criteria:
 *   - solvable === true OR bfs_exhausted === true
 *   - min_moves >= difficulty_floor (not trivial)
 *   - max_moves === null OR min_moves <= max_moves - 2 (room to breathe)
 */

import * as fs from 'fs';
import * as path from 'path';
import { generateLevel } from './generator';
import { solveLevel } from './solver';
import {
  Level,
  DifficultyBand,
  PipelineResult,
  GeneratorParams,
} from './types';

const MAX_RETRIES = 25;
const OUTPUT_BASE = path.resolve(__dirname, '../../../game-client/assets/resources/levels');

// ── Difficulty floor (min acceptable min_moves) ────────────────────────────────

const DIFFICULTY_FLOOR: Record<DifficultyBand, number> = {
  zen:       1,
  easy:      3,
  standard:  5,
  challenge: 8,
  boss:      10,
};

// Upper bound per band — prevents easy levels bleeding into standard range, etc.
const DIFFICULTY_CEILING: Record<DifficultyBand, number> = {
  zen:       999,
  easy:      8,
  standard:  14,
  challenge: 22,
  boss:      999,
};

// ── Difficulty → band mapping ──────────────────────────────────────────────────

export function getDifficultyBand(chapter: number, levelIndex: number): DifficultyBand {
  if (levelIndex === 30) return 'boss';

  // Zen levels per chapter
  const zenLevels: Record<number, number[]> = {
    1: [10, 20], 2: [12, 24], 3: [11, 22], 4: [13, 25], 5: [15, 27], 6: [17, 28],
  };
  if (zenLevels[chapter]?.includes(levelIndex)) return 'zen';

  // Per-chapter difficulty curve from progression-curve.json
  // Each chapter: first 25% = easy, middle 50% = standard, last 25% = challenge
  const pct = levelIndex / 29;  // normalize 1-29 → 0-1
  if (pct <= 0.25) return 'easy';
  if (pct <= 0.75) return 'standard';
  return 'challenge';
}

// ── File output ────────────────────────────────────────────────────────────────

export function getLevelOutputPath(chapter: number, levelIndex: number): string {
  const dir = path.join(OUTPUT_BASE, `ch${chapter}`);
  return path.join(dir, `level_${chapter}_${levelIndex}.json`);
}

function writeLevel(level: Level): string {
  const outPath = getLevelOutputPath(level.chapter, level.level);
  const dir = path.dirname(outPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(level, null, 2), 'utf-8');
  return outPath;
}

// ── Single level pipeline ──────────────────────────────────────────────────────

export function runLevelPipeline(
  chapter: number,
  levelIndex: number,
  verbose = false,
  prevBandMinMoves = 0,  // min_moves of previous accepted level in the same difficulty band
): PipelineResult {
  const difficulty = getDifficultyBand(chapter, levelIndex);
  const floor = Math.max(DIFFICULTY_FLOOR[difficulty], prevBandMinMoves);
  const ceiling = DIFFICULTY_CEILING[difficulty];

  let lastLevel: Level | null = null;
  let lastSolver = null;
  let lastRejection = '';

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    // Use a deterministic but varied seed: chapter*10000 + level*100 + attempt
    const seed = chapter * 10000 + levelIndex * 100 + attempt * 7;
    const params: GeneratorParams = { chapter, level_index: levelIndex, difficulty, seed };

    const level = generateLevel(params);
    lastLevel = level;

    // Zen levels skip solver (no move limit, any outcome acceptable)
    if (difficulty === 'zen' || level.max_moves === null) {
      const outPath = writeLevel(level);
      if (verbose) console.log(`  ✓ [zen/tutorial] ch${chapter}-${levelIndex} → ${path.basename(outPath)}`);
      return { level, solver: null, accepted: true, attempts: attempt };
    }

    const solver = solveLevel(level);
    lastSolver = solver;

    // Acceptance checks
    if (!solver.solvable && !solver.bfs_exhausted) {
      lastRejection = `impossible (no solution found in BFS)`;
      if (verbose) console.log(`  ✗ attempt ${attempt}: ${lastRejection}`);
      continue;
    }

    if (!solver.bfs_exhausted && solver.min_moves < floor) {
      lastRejection = `too easy (min_moves=${solver.min_moves} < floor=${floor})`;
      if (verbose) console.log(`  ✗ attempt ${attempt}: ${lastRejection}`);
      continue;
    }

    if (!solver.bfs_exhausted && solver.min_moves > ceiling) {
      lastRejection = `too hard (min_moves=${solver.min_moves} > ceiling=${ceiling} for ${difficulty})`;
      if (verbose) console.log(`  ✗ attempt ${attempt}: ${lastRejection}`);
      continue;
    }

    if (level.max_moves !== null && !solver.bfs_exhausted && solver.min_moves > level.max_moves - 2) {
      lastRejection = `too tight (min_moves=${solver.min_moves}, max_moves=${level.max_moves})`;
      if (verbose) console.log(`  ✗ attempt ${attempt}: ${lastRejection}`);
      continue;
    }

    // Accepted
    const outPath = writeLevel(level);
    return { level, solver, accepted: true, attempts: attempt };
  }

  // All retries exhausted — write best candidate with warning
  if (lastLevel) {
    const outPath = writeLevel(lastLevel);
    console.warn(`  ⚠ ch${chapter}-${levelIndex}: accepted after ${MAX_RETRIES} retries (${lastRejection}) — written anyway`);
    return {
      level: lastLevel,
      solver: lastSolver,
      accepted: false,
      attempts: MAX_RETRIES,
      rejection_reason: lastRejection,
    };
  }

  return { level: null, solver: null, accepted: false, attempts: MAX_RETRIES, rejection_reason: 'no candidate generated' };
}

// ── Batch runner ───────────────────────────────────────────────────────────────

export interface BatchResult {
  chapter: number;
  levelIndex: number;
  accepted: boolean;
  attempts: number;
  min_moves: number | null;
  bfs_exhausted: boolean;
  outPath: string;
}

export function runChapterPipeline(
  chapter: number,
  count: number,
  verbose = false,
): BatchResult[] {
  const results: BatchResult[] = [];
  const total = Math.min(count, 30);

  // Track last accepted min_moves per difficulty band for monotonicity enforcement
  const lastMinMoves: Partial<Record<DifficultyBand, number>> = {};

  for (let i = 1; i <= total; i++) {
    const band = getDifficultyBand(chapter, i);
    // Allow -1 tolerance to reduce retry pressure while keeping the overall trend upward
    const prev = Math.max(0, (lastMinMoves[band] ?? 0) - 1);
    const result = runLevelPipeline(chapter, i, verbose, prev);

    if (result.solver?.min_moves != null && result.accepted) {
      lastMinMoves[band] = result.solver.min_moves;
    }

    const outPath = result.level ? getLevelOutputPath(chapter, i) : '';
    results.push({
      chapter,
      levelIndex: i,
      accepted: result.accepted,
      attempts: result.attempts,
      min_moves: result.solver?.min_moves ?? null,
      bfs_exhausted: result.solver?.bfs_exhausted ?? false,
      outPath,
    });
  }
  return results;
}
