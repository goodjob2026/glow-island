// BFS path-finding engine: finds a valid ≤2-turn connection path between two same-type tiles.

import { TileCell, TileType, ObstacleType, Point } from './TileGrid';

const DIR_NONE = 0;
const DIR_HORIZONTAL = 1;
const DIR_VERTICAL = 2;

interface BFSState {
  row: number;
  col: number;
  direction: number;
  turns: number;
  path: Point[];
}

export class TileMatcher {
  findPath(
    grid: TileCell[][],
    r1: number,
    c1: number,
    r2: number,
    c2: number,
  ): Point[] | null {
    const rows = grid.length;
    if (rows === 0) return null;
    const cols = grid[0].length;

    const src = grid[r1]?.[c1];
    const dst = grid[r2]?.[c2];
    if (!src || !dst) return null;
    if (src.type === TileType.NONE || dst.type === TileType.NONE) return null;
    if (src.type !== dst.type) return null;
    if (r1 === r2 && c1 === c2) return null;

    const visited: boolean[][][][] = [];
    for (let r = -1; r <= rows; r++) {
      visited[r + 1] = [];
      for (let c = -1; c <= cols; c++) {
        visited[r + 1][c + 1] = [];
        for (let d = 0; d <= 2; d++) {
          visited[r + 1][c + 1][d] = [];
          for (let t = 0; t <= 2; t++) {
            visited[r + 1][c + 1][d][t] = false;
          }
        }
      }
    }

    const isPassable = (r: number, c: number): boolean => {
      if (r === r2 && c === c2) return true;
      if (r < 0 || r >= rows || c < 0 || c >= cols) return true;
      const cell = grid[r][c];
      if (cell.type === TileType.NONE && !cell.isObstacle) return true;
      if (cell.isObstacle && cell.obstacleType === ObstacleType.WOODEN_CRATE) return false;
      if (cell.isObstacle && cell.obstacleType === ObstacleType.WATER_CURRENT) return false;
      return cell.type === TileType.NONE;
    };

    const queue: BFSState[] = [];
    const initState: BFSState = {
      row: r1,
      col: c1,
      direction: DIR_NONE,
      turns: 0,
      path: [{ row: r1, col: c1 }],
    };
    queue.push(initState);
    visited[r1 + 1][c1 + 1][DIR_NONE][0] = true;

    const deltas: [number, number, number][] = [
      [-1, 0, DIR_VERTICAL],
      [1, 0, DIR_VERTICAL],
      [0, -1, DIR_HORIZONTAL],
      [0, 1, DIR_HORIZONTAL],
    ];

    let head = 0;
    while (head < queue.length) {
      const cur = queue[head++];

      for (const [dr, dc, newDir] of deltas) {
        const nr = cur.row + dr;
        const nc = cur.col + dc;

        const outOfBounds = nr < -1 || nr > rows || nc < -1 || nc > cols;
        if (outOfBounds) continue;

        const turned = cur.direction !== DIR_NONE && newDir !== cur.direction;
        const newTurns = cur.turns + (turned ? 1 : 0);
        if (newTurns > 2) continue;

        if (!isPassable(nr, nc)) continue;

        const vr = nr + 1;
        const vc = nc + 1;
        if (visited[vr][vc][newDir][newTurns]) continue;
        visited[vr][vc][newDir][newTurns] = true;

        const newPath = [...cur.path, { row: nr, col: nc }];

        if (nr === r2 && nc === c2) {
          return newPath;
        }

        queue.push({ row: nr, col: nc, direction: newDir, turns: newTurns, path: newPath });
      }
    }

    return null;
  }
}
