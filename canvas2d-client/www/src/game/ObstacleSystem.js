// canvas2d-client/www/src/game/ObstacleSystem.js

export const OBSTACLE = {
  ICE_BLOCK:    'ice_block',
  CHAIN_LOCK:   'chain_lock',
  PORTAL:       'portal',
  SINGLE_PATH:  'single_path_corridor',
  WOODEN_CRATE: 'wooden_crate',
  WEED:         'weed',
  WATER_CURRENT:'water_current',
  SPREADING:    'spreading_obstacle',
};

export class ObstacleSystem {
  constructor(rows, cols) {
    this._rows = rows;
    this._cols = cols;
    this._obstacles = Array.from({length: rows}, () => Array(cols).fill(null));
    this._weedCells = new Set();  // "r,c" strings
    this._portals = {};           // "r,c" → {r,c} exit map
    this._waterCurrents = [];     // {row/col, dir, interval, timer}
    this._spreadingCells = new Set(); // "r,c"
  }

  init(levelData) {
    // Reset
    this._obstacles = Array.from({length: this._rows}, () => Array(this._cols).fill(null));
    this._weedCells = new Set();
    this._portals = {};
    this._waterCurrents = [];
    this._spreadingCells = new Set();

    if (!levelData?.obstacles) return;

    // Group portals by pair_id
    const portalsByPair = {};
    for (const obs of levelData.obstacles) {
      const {type, r, c} = obs;
      switch (type) {
        case OBSTACLE.ICE_BLOCK:
          this._obstacles[r][c] = {type, layers: obs.layers ?? 2};
          break;
        case OBSTACLE.CHAIN_LOCK:
          this._obstacles[r][c] = {type, rings: obs.rings ?? 1};
          break;
        case OBSTACLE.PORTAL:
          this._obstacles[r][c] = {type, pair_id: obs.pair_id};
          portalsByPair[obs.pair_id] = portalsByPair[obs.pair_id] || [];
          portalsByPair[obs.pair_id].push({r, c});
          break;
        case OBSTACLE.SINGLE_PATH:
          this._obstacles[r][c] = {type, wall: true};
          break;
        case OBSTACLE.WOODEN_CRATE:
          this._obstacles[r][c] = {type, hp: obs.hp ?? 3};
          break;
        case OBSTACLE.WEED:
          this._obstacles[r][c] = {type, spread_interval: obs.spread_interval ?? 5};
          this._weedCells.add(`${r},${c}`);
          break;
        case OBSTACLE.WATER_CURRENT:
          this._obstacles[r][c] = {type, direction: obs.direction ?? 'right'};
          this._waterCurrents.push({r, c, direction: obs.direction ?? 'right', timer: 0, interval: 5000});
          break;
        case OBSTACLE.SPREADING:
          this._obstacles[r][c] = {type, hp: 3};
          this._spreadingCells.add(`${r},${c}`);
          break;
      }
    }

    // Build portal bidirectional map
    for (const cells of Object.values(portalsByPair)) {
      if (cells.length === 2) {
        const [a, b] = cells;
        this._portals[`${a.r},${a.c}`] = {r: b.r, c: b.c};
        this._portals[`${b.r},${b.c}`] = {r: a.r, c: a.c};
      }
    }
  }

  // BFS: can path pass through (r,c)?
  isPassable(r, c) {
    const obs = this._obstacles[r]?.[c];
    if (!obs) return true;
    switch (obs.type) {
      case OBSTACLE.ICE_BLOCK:    return false; // blocks path (not as match target either)
      case OBSTACLE.WOODEN_CRATE: return false;
      case OBSTACLE.SPREADING:    return false;
      case OBSTACLE.SINGLE_PATH:  return obs.wall ? false : true;
      // chain_lock, portal, weed, water_current: passable (chain can be matched, portal teleports)
      default: return true;
    }
  }

  // BFS: portal exit
  getPortalExit(r, c) {
    return this._portals[`${r},${c}`] ?? null;
  }

  isPortal(r, c) {
    return this._obstacles[r]?.[c]?.type === OBSTACLE.PORTAL;
  }

  // Called when two tiles at (r1,c1)↔(r2,c2) are matched
  // Returns list of extra cells to clear: [{r,c}]
  onMatch(r1, c1, r2, c2) {
    const extra = [];
    // Process both matched cells
    for (const [r, c] of [[r1,c1],[r2,c2]]) {
      const obs = this._obstacles[r]?.[c];
      if (!obs) continue;
      if (obs.type === OBSTACLE.CHAIN_LOCK) {
        obs.rings--;
        if (obs.rings <= 0) {
          this._obstacles[r][c] = null;
          extra.push({r, c});
        }
      }
      if (obs.type === OBSTACLE.WEED) {
        this._obstacles[r][c] = null;
        this._weedCells.delete(`${r},${c}`);
      }
    }
    // Check adjacency for ice_block and wooden_crate
    const adjacent = this._getAdjacent(r1, c1, r2, c2);
    for (const {r, c} of adjacent) {
      const obs = this._obstacles[r]?.[c];
      if (!obs) continue;
      if (obs.type === OBSTACLE.ICE_BLOCK) {
        obs.layers--;
        if (obs.layers <= 0) this._obstacles[r][c] = null;
      }
      if (obs.type === OBSTACLE.WOODEN_CRATE) {
        obs.hp--;
        if (obs.hp <= 0) { this._obstacles[r][c] = null; extra.push({r, c}); }
      }
    }
    return extra;
  }

  // Bomb 3×3 area
  onBomb(centerR, centerC) {
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const r = centerR + dr, c = centerC + dc;
        if (r < 0 || r >= this._rows || c < 0 || c >= this._cols) continue;
        this._obstacles[r][c] = null;
        this._weedCells.delete(`${r},${c}`);
        this._spreadingCells.delete(`${r},${c}`);
      }
    }
  }

  // Called each step
  onStep(stepCount) {
    // Weed spreading
    const toSpread = [];
    for (const key of this._weedCells) {
      const [r, c] = key.split(',').map(Number);
      const obs = this._obstacles[r][c];
      if (!obs) continue;
      if (stepCount > 0 && stepCount % obs.spread_interval === 0) {
        toSpread.push({r, c});
      }
    }
    for (const {r, c} of toSpread) {
      const dirs = [{dr:-1,dc:0},{dr:1,dc:0},{dr:0,dc:-1},{dr:0,dc:1}];
      const shuffled = dirs.sort(() => Math.random() - 0.5);
      for (const {dr, dc} of shuffled) {
        const nr = r + dr, nc = c + dc;
        if (nr < 0 || nr >= this._rows || nc < 0 || nc >= this._cols) continue;
        if (!this._obstacles[nr][nc]) {
          this._obstacles[nr][nc] = {type: OBSTACLE.WEED, spread_interval: this._obstacles[r][c].spread_interval};
          this._weedCells.add(`${nr},${nc}`);
          break;
        }
      }
    }

    // Spreading obstacle every 3 steps
    if (stepCount > 0 && stepCount % 3 === 0) {
      const toExpand = [...this._spreadingCells];
      for (const key of toExpand) {
        const [r, c] = key.split(',').map(Number);
        const dirs = [{dr:-1,dc:0},{dr:1,dc:0},{dr:0,dc:-1},{dr:0,dc:1}];
        const shuffled = dirs.sort(() => Math.random() - 0.5);
        for (const {dr, dc} of shuffled) {
          const nr = r + dr, nc = c + dc;
          if (nr < 0 || nr >= this._rows || nc < 0 || nc >= this._cols) continue;
          if (!this._obstacles[nr][nc]) {
            this._obstacles[nr][nc] = {type: OBSTACLE.SPREADING, hp: 3};
            this._spreadingCells.add(`${nr},${nc}`);
            break;
          }
        }
      }
    }
  }

  // dt in ms for water current
  update(dt) {
    for (const wc of this._waterCurrents) {
      wc.timer += dt;
      if (wc.timer >= wc.interval) {
        wc.timer = 0;
        // Water current shifts entire row or column - handled externally via event
        // Just emit that it's time to shift
        if (this._onWaterCurrentShift) this._onWaterCurrentShift(wc);
      }
    }
  }

  // Draw obstacles on canvas
  draw(ctx, cellSize, offsetX, offsetY) {
    for (let r = 0; r < this._rows; r++) {
      for (let c = 0; c < this._cols; c++) {
        const obs = this._obstacles[r]?.[c];
        if (!obs) continue;
        const x = offsetX + c * cellSize;
        const y = offsetY + r * cellSize;
        this._drawObstacle(ctx, obs, x, y, cellSize);
      }
    }
  }

  _drawObstacle(ctx, obs, x, y, size) {
    ctx.save();
    switch (obs.type) {
      case OBSTACLE.ICE_BLOCK:
        ctx.fillStyle = obs.layers === 2 ? 'rgba(100,200,255,0.7)' : 'rgba(150,220,255,0.4)';
        ctx.fillRect(x+2, y+2, size-4, size-4);
        ctx.strokeStyle = '#88DDFF';
        ctx.lineWidth = 2;
        ctx.strokeRect(x+2, y+2, size-4, size-4);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = `${size*0.3}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText('❄️', x+size/2, y+size/2+size*0.1);
        break;
      case OBSTACLE.CHAIN_LOCK:
        ctx.strokeStyle = '#C8A000';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x+size/2, y+size/2, size*0.35, 0, Math.PI*2);
        ctx.stroke();
        ctx.fillStyle = '#FFD700';
        ctx.font = `${size*0.3}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(`${obs.rings}🔗`, x+size/2, y+size/2+size*0.1);
        break;
      case OBSTACLE.PORTAL:
        ctx.fillStyle = 'rgba(120,0,200,0.6)';
        ctx.beginPath();
        ctx.arc(x+size/2, y+size/2, size*0.4, 0, Math.PI*2);
        ctx.fill();
        ctx.fillStyle = '#FFFFFF';
        ctx.font = `${size*0.35}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText('🌀', x+size/2, y+size/2+size*0.12);
        break;
      case OBSTACLE.WOODEN_CRATE:
        ctx.fillStyle = '#8B6914';
        ctx.fillRect(x+3, y+3, size-6, size-6);
        ctx.strokeStyle = '#5C4500';
        ctx.lineWidth = 2;
        ctx.strokeRect(x+3, y+3, size-6, size-6);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = `${size*0.3}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(`${obs.hp}`, x+size/2, y+size/2+size*0.1);
        break;
      case OBSTACLE.WEED:
        ctx.fillStyle = 'rgba(50,150,50,0.5)';
        ctx.fillRect(x, y, size, size);
        ctx.fillStyle = '#228B22';
        ctx.font = `${size*0.4}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText('🌿', x+size/2, y+size/2+size*0.15);
        break;
      case OBSTACLE.SPREADING:
        ctx.fillStyle = 'rgba(80,0,120,0.6)';
        ctx.fillRect(x, y, size, size);
        ctx.fillStyle = '#CC44FF';
        ctx.font = `${size*0.4}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText('🕸', x+size/2, y+size/2+size*0.15);
        break;
      case OBSTACLE.WATER_CURRENT:
        ctx.fillStyle = 'rgba(0,100,200,0.3)';
        ctx.fillRect(x, y, size, size);
        ctx.fillStyle = '#4488FF';
        ctx.font = `${size*0.4}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText('💧', x+size/2, y+size/2+size*0.15);
        break;
    }
    ctx.restore();
  }

  isObstacleGoalMet(goalConfig) {
    if (!goalConfig || goalConfig.type !== 'obstacle_clear') return true;
    const {obstacle_type, required_clear_count} = goalConfig;
    let remaining = 0;
    for (let r = 0; r < this._rows; r++) {
      for (let c = 0; c < this._cols; c++) {
        const obs = this._obstacles[r]?.[c];
        if (obs && obs.type === obstacle_type) remaining++;
      }
    }
    return remaining === 0 || (this._initialCounts?.[obstacle_type] ?? 0) - remaining >= required_clear_count;
  }

  _getAdjacent(r1, c1, r2, c2) {
    const seen = new Set([`${r1},${c1}`,`${r2},${c2}`]);
    const result = [];
    for (const [r, c] of [[r1,c1],[r2,c2]]) {
      for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
        const nr = r+dr, nc = c+dc;
        const key = `${nr},${nc}`;
        if (!seen.has(key) && nr >= 0 && nr < this._rows && nc >= 0 && nc < this._cols) {
          seen.add(key);
          result.push({r:nr, c:nc});
        }
      }
    }
    return result;
  }

  getObstacle(r, c) {
    return this._obstacles[r]?.[c] ?? null;
  }

  hasObstacle(r, c) {
    return this._obstacles[r]?.[c] !== null;
  }
}
