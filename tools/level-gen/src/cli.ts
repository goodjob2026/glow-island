#!/usr/bin/env ts-node
/**
 * cli.ts — CLI entry point for the Glow Island level generation pipeline.
 *
 * Usage:
 *   npm run gen -- --chapter 1 --count 5
 *   npm run gen -- --all
 *   npm run validate -- --file path/to/level.json
 */

import * as fs from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';
import { runChapterPipeline, runLevelPipeline, getDifficultyBand } from './pipeline';
import { solveLevel } from './solver';
import { Level } from './types';

// ── Tiny argument parser ───────────────────────────────────────────────────────

function parseArgs(argv: string[]): Record<string, string | boolean> {
  const args: Record<string, string | boolean> = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith('--')) {
        args[key] = next;
        i++;
      } else {
        args[key] = true;
      }
    }
  }
  return args;
}

// ── Progress formatting ────────────────────────────────────────────────────────

function statusIcon(accepted: boolean, bfsExhausted: boolean): string {
  if (!accepted) return '⚠ WARN';
  if (bfsExhausted) return '~ LIKELY';
  return '✓ OK';
}

function formatRow(
  chapter: number,
  levelIndex: number,
  difficulty: string,
  accepted: boolean,
  attempts: number,
  min_moves: number | null,
  bfs_exhausted: boolean,
  outPath: string,
): string {
  const icon = statusIcon(accepted, bfs_exhausted);
  const moves = min_moves !== null ? `min_moves=${min_moves}` : 'zen/unlimited';
  const file = path.basename(outPath);
  return `  ${icon.padEnd(10)} ch${chapter}-${String(levelIndex).padStart(2,'0')} [${difficulty.padEnd(9)}] ${moves.padEnd(20)} attempts=${attempts} → ${file}`;
}

// ── gen command ────────────────────────────────────────────────────────────────

async function cmdGen(args: Record<string, string | boolean>): Promise<void> {
  const isAll = args['all'] === true;
  const verbose = args['verbose'] === true;

  if (isAll) {
    console.log('Generating all 180 levels (6 chapters × 30 levels) — 6 parallel processes...\n');
    const startMs = Date.now();

    // Spawn one child process per chapter in parallel
    const cliScript = path.resolve(__dirname, 'cli.ts');
    const tsNodeBin = path.resolve(__dirname, '../node_modules/.bin/ts-node');
    const cwd = path.resolve(__dirname, '..');

    const procs = [1, 2, 3, 4, 5, 6].map(ch =>
      new Promise<string>((resolve, reject) => {
        const chunks: string[] = [];
        const errChunks: string[] = [];
        const proc = spawn(tsNodeBin, [cliScript, 'gen', '--chapter', String(ch), '--count', '30'], { cwd });
        proc.stdout.on('data', (d: Buffer) => chunks.push(d.toString()));
        proc.stderr.on('data', (d: Buffer) => errChunks.push(d.toString()));
        proc.on('close', code => {
          if (code !== 0) reject(new Error(`ch${ch} exited ${code}: ${errChunks.join('')}`));
          else resolve(chunks.join('') + errChunks.join(''));
        });
        proc.on('error', reject);
      })
    );

    const outputs = await Promise.all(procs);
    outputs.forEach(out => process.stdout.write(out));

    const elapsed = ((Date.now() - startMs) / 1000).toFixed(1);
    const total = fs.readdirSync(path.resolve(__dirname, '../../../game-client/assets/resources/levels'), { recursive: true })
      .filter((f: unknown) => String(f).endsWith('.json')).length;
    console.log(`\nAll done in ${elapsed}s. ${total} level files written.`);
    return;
  }

  const chapter = parseInt(String(args['chapter'] ?? '1'));
  const count   = parseInt(String(args['count']   ?? '30'));

  if (isNaN(chapter) || chapter < 1 || chapter > 6) {
    console.error('Error: --chapter must be 1-6');
    process.exit(1);
  }
  if (isNaN(count) || count < 1 || count > 30) {
    console.error('Error: --count must be 1-30');
    process.exit(1);
  }

  console.log(`Generating ${count} level(s) for chapter ${chapter}...\n`);

  const startMs = Date.now();
  const results = runChapterPipeline(chapter, count, verbose);
  const elapsedMs = Date.now() - startMs;

  let accepted = 0;
  let warnings = 0;

  for (const r of results) {
    const diff = getDifficultyBand(r.chapter, r.levelIndex);
    console.log(formatRow(r.chapter, r.levelIndex, diff, r.accepted, r.attempts, r.min_moves, r.bfs_exhausted, r.outPath));
    if (r.accepted) accepted++; else warnings++;
  }

  console.log(`\nDone in ${elapsedMs}ms. ${accepted} accepted, ${warnings} warnings.`);
}

// ── validate command ───────────────────────────────────────────────────────────

function cmdValidate(args: Record<string, string | boolean>): void {
  const filePath = String(args['file'] ?? '');
  if (!filePath) {
    console.error('Error: --file <path> required');
    process.exit(1);
  }
  const absPath = path.resolve(process.cwd(), filePath);
  if (!fs.existsSync(absPath)) {
    console.error(`Error: file not found: ${absPath}`);
    process.exit(1);
  }

  let level: Level;
  try {
    level = JSON.parse(fs.readFileSync(absPath, 'utf-8')) as Level;
  } catch (e) {
    console.error(`Error parsing JSON: ${e}`);
    process.exit(1);
  }

  console.log(`Validating: ${path.basename(absPath)}`);
  console.log(`  Level: ${level.id}  Role: ${level.level_role}  Grid: ${level.grid_size[0]}×${level.grid_size[1]}`);
  console.log(`  Objectives: ${level.objectives.map(o => `${o.type}(${o.count ?? o.corridor_count ?? '?'})`).join(', ')}`);
  console.log(`  max_moves: ${level.max_moves ?? 'unlimited'}`);

  if (level.max_moves === null) {
    console.log('\n  Result: ZEN/UNLIMITED — skipping solver');
    return;
  }

  console.log('\n  Running BFS solver...');
  const startMs = Date.now();
  const result = solveLevel(level);
  const elapsed = Date.now() - startMs;

  console.log(`  Elapsed: ${elapsed}ms`);
  console.log(`  solvable:     ${result.solvable}`);
  console.log(`  min_moves:    ${result.min_moves}`);
  console.log(`  bfs_exhausted:${result.bfs_exhausted}`);
  if (result.solution_path.length > 0) {
    console.log(`  solution (first 5 moves): ${result.solution_path.slice(0,5).join(' | ')}${result.solution_path.length > 5 ? ' ...' : ''}`);
  }

  if (!result.solvable && !result.bfs_exhausted) {
    console.log('\n  ❌ INVALID: Level is not solvable within max_moves');
    process.exit(1);
  } else {
    console.log('\n  ✓ VALID');
  }
}

// ── Entry ──────────────────────────────────────────────────────────────────────

const [,, command, ...rest] = process.argv;
const args = parseArgs(rest);

if (command === 'gen') {
  cmdGen(args).catch(e => { console.error(e); process.exit(1); });
} else if (command === 'validate') {
  cmdValidate(args);
} else {
  console.log(`Glow Island Level Generator

Commands:
  gen        Generate level JSON files
  validate   Validate a single level JSON file

Options (gen):
  --chapter N    Chapter number 1-6 (default: 1)
  --count N      Number of levels to generate 1-30 (default: 30)
  --all          Generate all 180 levels (6 chapters × 30 each)
  --verbose      Show rejection reasons per attempt

Options (validate):
  --file <path>  Path to level JSON file

Examples:
  npm run gen -- --chapter 1 --count 5
  npm run gen -- --all
  npm run validate -- --file game-client/assets/resources/levels/ch1/level_1_1.json
`);
  process.exit(0);
}
