// GameplayScene.js — main gameplay scene for Glow Island (连连看 / match-2)

import { TileGrid }       from '../game/TileGrid.js';
import { ComboSystem }    from '../game/ComboSystem.js';
import { SpecialTiles }   from '../game/SpecialTiles.js';
import { ObstacleSystem } from '../game/ObstacleSystem.js';
import { VFXSystem }      from '../game/VFXSystem.js';
import { getLevel }       from '../data/level-data.js';

// Tile palette: index 0 unused, indices 1-5 map to these colours
const TILE_COLORS = [
  null,        // 0 — empty, no tile
  '#e74c3c',   // 1 — red
  '#3498db',   // 2 — blue
  '#2ecc71',   // 3 — green
  '#f39c12',   // 4 — orange
  '#9b59b6',   // 5 — purple
];

// Special tile display colours
const SPECIAL_COLORS = {
  6: '#8B0000',  // Bomb   — dark red
  7: '#00CED1',  // Windmill — cyan
  8: '#FFD700',  // Lantern  — gold
  9: '#20B2AA',  // Wave     — teal
};

const SPECIAL_LABELS = {
  6: '💣',
  7: '🌀',
  8: '🏮',
  9: '🌊',
};

export class GameplayScene {
  /**
   * @param {import('../SceneManager.js').SceneManager} sceneManager
   * @param {object} renderer  - { ctx, lw, lh, dpr, canvas }
   * @param {object} assets
   * @param {object} audio
   * @param {import('../ProgressManager.js').ProgressManager} progress
   */
  constructor(sceneManager, renderer, assets, audio, progress) {
    this._sm       = sceneManager;
    this._r        = renderer;
    this._assets   = assets;
    this._audio    = audio;
    this._progress = progress;
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  /**
   * @param {{ chapter?: number, level?: number, zenMode?: boolean }} params
   */
  init(params = {}) {
    const { chapter = 1, level = 1, zenMode = false } = params;
    this._chapter  = chapter;
    this._level    = level;
    this._zenMode  = zenMode;

    const ld = getLevel(chapter, level);
    this._levelData = ld;
    this._steps     = zenMode ? Infinity : ld.steps;
    this._maxSteps  = ld.steps;
    this._score     = 0;
    this._firstReshuffle = true;
    this._stepCount = 0;  // for onStep tracking

    // Subsystems
    this._obstacles = new ObstacleSystem(ld.gridRows, ld.gridCols);
    this._obstacles.init(ld);
    this._tileGrid  = new TileGrid(ld, this._obstacles);
    this._combo     = new ComboSystem();
    this._specials  = new SpecialTiles(this._tileGrid, this._audio);
    this._vfx       = new VFXSystem(this._r);

    // Wire callbacks
    this._tileGrid.onMatch  = (ev) => this._onMatch(ev);
    this._tileGrid.onNoPath = (ev) => this._onNoPath(ev);

    // UI state
    this._selected        = null;
    this._animQueue       = [];
    this._floatingTexts   = [];
    this._shakeTargets    = [];
    this._gameOver        = false;
    this._win             = false;
    this._showWinPanel    = false;
    this._showFailPanel   = false;
    this._showReshufflePrompt = false;
    this._stars           = 0;
    this._hintPair        = null;
    this._hintTimer       = 0;
    this._muted           = false;
    this._pathAnim        = null; // {path, timer, duration}

    this._calcLayout();
  }

  destroy() {
    this._combo.reset();
    this._hintPair  = null;
    this._hintTimer = 0;
  }

  resize(_w, _h) {
    this._calcLayout();
  }

  onBack() {
    this._sm.pop();
  }

  // ── Layout calculation ─────────────────────────────────────────────────────

  _calcLayout() {
    const { lw, lh } = this._r;
    const HUD_H   = 80;
    const BOTTOM_H = 60;
    const PAD     = 16;
    const ROWS    = this._tileGrid.ROWS;
    const COLS    = this._tileGrid.COLS;
    const playW   = lw - PAD * 2;
    const playH   = lh - HUD_H - BOTTOM_H;
    const cellSize = Math.floor(Math.min(playW / COLS, playH / ROWS));
    const boardW  = cellSize * COLS;
    const boardH  = cellSize * ROWS;
    const offsetX = Math.round((lw - boardW) / 2);
    const offsetY = HUD_H + Math.round((playH - boardH) / 2);
    this._cell = { cellSize, offsetX, offsetY, ROWS, COLS };
  }

  // ── Input ─────────────────────────────────────────────────────────────────

  onTap(x, y) {
    if (typeof window !== 'undefined') window._lastTap = { x, y }; // test hook — MUST BE FIRST LINE

    if (this._gameOver) {
      this._handlePanelTap(x, y);
      return;
    }

    // Reshuffle prompt taps
    if (this._showReshufflePrompt) {
      this._handleReshufflePromptTap(x, y);
      return;
    }

    const { lw } = this._r;

    // Mute toggle (top-right ~360,20)
    if (x > lw - 50 && y < 50) {
      this._muted = !this._muted;
      if (this._audio) this._audio.setMuted?.(this._muted);
      return;
    }

    // Back button (top-left 30,20)
    if (x < 50 && y < 50) {
      this.onBack();
      return;
    }

    // Hint button (bottom area)
    if (y > this._r.lh - 60 && x > 80 && x < 200) {
      this._onHint();
      return;
    }

    // Reshuffle button (bottom area)
    if (y > this._r.lh - 60 && x > 210 && x < 330) {
      this._onReshuffle();
      return;
    }

    // Convert to grid coords
    const { cellSize, offsetX, offsetY, ROWS, COLS } = this._cell;
    const c = Math.floor((x - offsetX) / cellSize);
    const r = Math.floor((y - offsetY) / cellSize);

    if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return;

    const cellVal = this._tileGrid.grid[r][c];

    // Tap on special tile
    if (cellVal >= 6 && cellVal <= 9) {
      const cleared = this._specials.trigger(r, c);
      if (cleared && cleared.length > 0) {
        if (!this._zenMode) this._steps--;
        this._stepCount++;
        this._checkStepExhausted();
        this._checkWin();
        if (!this._tileGrid.hasMoves() && !this._tileGrid.isCleared()) {
          this._autoReshufflePrompt();
        }
      }
      return;
    }

    // Normal tile select / match
    const result = this._tileGrid.select(r, c);

    if (result?.matched) {
      if (!this._zenMode) this._steps--;
      this._stepCount++;

      const { combo, multiplier } = this._combo.onMatch();
      const pts = Math.round(100 * multiplier);
      this._score += pts;

      // Floating text above matched pair midpoint
      const mx = offsetX + ((result.c1 + result.c2) / 2 + 0.5) * cellSize;
      const my = offsetY + ((result.r1 + result.r2) / 2 + 0.5) * cellSize;
      this._addFloat(`+${pts}`, mx, my);

      this._audio?.playSFX?.('sfx_connect');

      // Path animation + VFX path line
      if (result.path) {
        this._pathAnim = { path: result.path, timer: 0, duration: 0.35 };
        const pts2d = result.path.map(p => ({
          x: offsetX + (p.c + 0.5) * cellSize,
          y: offsetY + (p.r + 0.5) * cellSize,
        }));
        this._vfx?.showPath?.(pts2d);
      }

      // Tile vanish VFX
      this._vfx?.showTileVanish?.(result.r1, result.c1, cellSize, offsetX, offsetY);
      this._vfx?.showTileVanish?.(result.r2, result.c2, cellSize, offsetX, offsetY);

      // Combo SFX + VFX + special spawn
      if (combo >= 4) {
        this._audio?.playSFX?.('sfx_combo3');
        this._spawnComboSpecial(7); // Windmill at combo 4+
        this._vfx?.showComboText?.(combo, multiplier, mx, my);
        this._vfx?.showFEVER?.(lw, lh);
      } else if (combo === 3) {
        this._audio?.playSFX?.('sfx_combo2');
        this._spawnComboSpecial(6); // Bomb at combo 3
        this._vfx?.showComboText?.(combo, multiplier, mx, my);
      } else if (combo === 2) {
        this._audio?.playSFX?.('sfx_combo1');
        this._vfx?.showComboText?.(combo, multiplier, mx, my);
      }

      this._obstacles?.onMatch?.(result.r1, result.c1, result.r2, result.c2);
      this._checkStepExhausted();
      this._checkWin();

      if (!this._win && !this._gameOver && !this._tileGrid.hasMoves() && !this._tileGrid.isCleared()) {
        this._autoReshufflePrompt();
      }
    } else if (result?.matched === false) {
      // Invalid path — shake tiles
      this._combo.onMiss();
      this._shakeTargets.push({ r: result.r1, c: result.c1, t: 0.4 });
      this._vfx?.showTileShake?.(result.r1, result.c1, cellSize, offsetX, offsetY);
    }
  }

  // ── Callbacks from TileGrid ────────────────────────────────────────────────

  _onMatch(_ev) {
    // Additional match-side-effects can go here
  }

  _onNoPath(_ev) {
    // Additional no-path-side-effects can go here
  }

  // ── Special spawn on combo ─────────────────────────────────────────────────

  _spawnComboSpecial(type) {
    const { ROWS, COLS } = this._tileGrid;
    const empties = [];
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++)
        if (this._tileGrid.grid[r][c] === 0) empties.push({ r, c });
    if (empties.length === 0) return;
    const { r, c } = empties[Math.floor(Math.random() * empties.length)];
    this._tileGrid.grid[r][c] = type;
  }

  // ── Win / fail logic ───────────────────────────────────────────────────────

  _checkWin() {
    if (this._tileGrid.isCleared()) {
      this._win      = true;
      this._gameOver = true;
      this._stars    = this._calcStars();
      this._progress.setStars(this._chapter, this._level, this._stars);
      this._progress.unlockNext?.(this._chapter, this._level);
      if (this._zenMode) {
        this._progress.updateZenBestCombo(this._combo.getCombo());
      }
      this._showWinPanel = true;
      this._audio?.playBGM?.('bgm_menu');
    }
  }

  _checkStepExhausted() {
    if (this._checkFailure()) {
      this._gameOver     = true;
      this._showFailPanel = true;
    }
  }

  _checkFailure() {
    if (this._zenMode) return false;
    return this._steps <= 0 && !this._tileGrid.isCleared();
  }

  _calcStars() {
    const pct = this._steps / this._maxSteps;
    if (pct >= 0.4) return 3;
    if (pct >= 0.2) return 2;
    return 1;
  }

  // ── Economy actions ────────────────────────────────────────────────────────

  _onContinue() {
    const cost = 30;
    if (this._progress.getCoins() < cost) return;
    this._progress.addCoins(-cost);
    this._steps    += 5;
    this._gameOver  = false;
    this._showFailPanel = false;
  }

  _onReshuffle() {
    const cost = this._firstReshuffle ? 0 : 30;
    if (cost > 0 && this._progress.getCoins() < cost) return;
    if (cost > 0) this._progress.addCoins(-cost);
    this._firstReshuffle = false;
    this._tileGrid.shuffle();
    this._showReshufflePrompt = false;
    this._addFloat('重排！', this._r.lw / 2, this._r.lh / 2);
  }

  _onHint() {
    const cost = 10;
    if (this._progress.getCoins() < cost) return;
    this._progress.addCoins(-cost);
    this._findAndShowHint();
  }

  _findAndShowHint() {
    const { ROWS, COLS } = this._tileGrid;
    const byType = {};
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const v = this._tileGrid.grid[r][c];
        if (v === null || v === 0) continue;
        if (!byType[v]) byType[v] = [];
        byType[v].push({ r, c });
      }
    }
    for (const cells of Object.values(byType)) {
      for (let i = 0; i < cells.length; i++) {
        for (let j = i + 1; j < cells.length; j++) {
          const path = this._tileGrid._findPath(cells[i].r, cells[i].c, cells[j].r, cells[j].c);
          if (path) {
            this._hintPair  = { r1: cells[i].r, c1: cells[i].c, r2: cells[j].r, c2: cells[j].c };
            this._hintTimer = 3.0;
            return;
          }
        }
      }
    }
  }

  // ── Auto-reshuffle prompt ──────────────────────────────────────────────────

  _autoReshufflePrompt() {
    if (this._firstReshuffle) {
      this._onReshuffle(); // free first reshuffle
    } else {
      this._showReshufflePrompt = true;
    }
  }

  // ── Floating text ──────────────────────────────────────────────────────────

  _addFloat(text, x, y) {
    this._floatingTexts.push({ text, x, y, alpha: 1.0, vy: -60 });
  }

  // ── Update ─────────────────────────────────────────────────────────────────

  update(dt) {
    this._combo.update(dt);
    this._vfx?.update?.(dt);

    // Floating texts
    for (const ft of this._floatingTexts) {
      ft.y    += ft.vy * dt;
      ft.alpha -= dt * 0.8;
    }
    this._floatingTexts = this._floatingTexts.filter(ft => ft.alpha > 0);

    // Shake targets
    for (const st of this._shakeTargets) {
      st.t -= dt;
    }
    this._shakeTargets = this._shakeTargets.filter(st => st.t > 0);

    // Hint timer
    if (this._hintTimer > 0) {
      this._hintTimer -= dt;
      if (this._hintTimer <= 0) this._hintPair = null;
    }

    // Path animation
    if (this._pathAnim) {
      this._pathAnim.timer += dt;
      if (this._pathAnim.timer >= this._pathAnim.duration) {
        this._pathAnim = null;
      }
    }

    // Obstacles (step-based, not time-based — pass stepCount)
    // Only drive time-based obstacle updates with dt
    this._obstacles?.update?.(dt * 1000); // ObstacleSystem.update expects ms
  }

  // ── Draw ───────────────────────────────────────────────────────────────────

  draw() {
    const { ctx, lw, lh } = this._r;

    // 1. Background
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, lw, lh);

    // 2. Board
    this._drawBoard(ctx);

    // 3. Path animation
    if (this._pathAnim) {
      this._drawPathAnim(ctx);
    }

    // 4. Obstacles (drawn over tiles)
    const { cellSize, offsetX, offsetY } = this._cell;
    this._obstacles?.draw?.(ctx, cellSize, offsetX, offsetY);

    // 4b. VFX layer (particles, path line, combo text, effects)
    this._vfx?.draw?.();

    // 5. HUD
    this._drawHUD(ctx);

    // 6. Bottom bar (hint / reshuffle buttons)
    this._drawBottomBar(ctx);

    // 7. Floating texts
    for (const ft of this._floatingTexts) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, ft.alpha);
      ctx.fillStyle   = '#FFE04B';
      ctx.font        = 'bold 22px sans-serif';
      ctx.textAlign   = 'center';
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    }

    // 8. Panels (win / fail / reshuffle)
    if (this._showWinPanel)       this._drawWinPanel(ctx);
    else if (this._showFailPanel) this._drawFailPanel(ctx);
    else if (this._showReshufflePrompt) this._drawReshufflePrompt(ctx);
  }

  // ── Board rendering ────────────────────────────────────────────────────────

  _drawBoard(ctx) {
    const { cellSize, offsetX, offsetY, ROWS, COLS } = this._cell;
    const grid = this._tileGrid.grid;
    const sel  = this._tileGrid.selected;
    const rad  = Math.max(4, Math.floor(cellSize * 0.12));
    const boardW = cellSize * COLS;
    const boardH = cellSize * ROWS;

    // Board panel background — semi-transparent surface behind all cells
    ctx.save();
    const pad = Math.round(cellSize * 0.08);
    const panelRad = Math.max(10, Math.floor(cellSize * 0.22));
    ctx.fillStyle = 'rgba(20,30,50,0.45)';
    this._roundRect(ctx, offsetX - pad, offsetY - pad, boardW + pad * 2, boardH + pad * 2, panelRad);
    ctx.fill();
    // Gold accent border
    ctx.strokeStyle = 'rgba(220,180,80,0.55)';
    ctx.lineWidth   = 2.5;
    ctx.stroke();
    ctx.restore();

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const v = grid[r][c];
        const x = offsetX + c * cellSize;
        const y = offsetY + r * cellSize;

        if (v === null) {
          // Inactive cell — subtle recessed slot so players see the full grid
          ctx.save();
          ctx.fillStyle = 'rgba(0,0,0,0.22)';
          this._roundRect(ctx, x + 3, y + 3, cellSize - 6, cellSize - 6, rad);
          ctx.fill();
          ctx.strokeStyle = 'rgba(255,255,255,0.06)';
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.restore();
          continue;
        }

        // Shake offset
        let sx = 0, sy = 0;
        const shake = this._shakeTargets.find(s => s.r === r && s.c === c);
        if (shake && shake.t > 0) {
          sx = Math.sin(shake.t * 40) * 4;
        }

        // Cell background
        ctx.save();
        ctx.fillStyle = v === 0 ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.12)';
        this._roundRect(ctx, x + sx + 2, y + sy + 2, cellSize - 4, cellSize - 4, rad);
        ctx.fill();

        if (v !== 0) {
          // Tile fill
          const isSpecial = v >= 6;
          ctx.fillStyle = isSpecial ? (SPECIAL_COLORS[v] ?? '#888') : (TILE_COLORS[v] ?? '#888');
          this._roundRect(ctx, x + sx + 3, y + sy + 3, cellSize - 6, cellSize - 6, rad - 1);
          ctx.fill();

          // Label
          if (isSpecial) {
            ctx.font      = `${Math.floor(cellSize * 0.42)}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(SPECIAL_LABELS[v] ?? '?', x + sx + cellSize / 2, y + sy + cellSize / 2);
          } else {
            // Simple shape indicator
            ctx.fillStyle = 'rgba(255,255,255,0.35)';
            ctx.font      = `bold ${Math.floor(cellSize * 0.36)}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(String(v), x + sx + cellSize / 2, y + sy + cellSize / 2);
          }

          // Selected highlight ring
          const isSelected = sel && sel.r === r && sel.c === c;
          const isHint = this._hintPair &&
            ((this._hintPair.r1 === r && this._hintPair.c1 === c) ||
             (this._hintPair.r2 === r && this._hintPair.c2 === c));

          if (isSelected) {
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth   = 3;
            this._roundRect(ctx, x + sx + 2, y + sy + 2, cellSize - 4, cellSize - 4, rad);
            ctx.stroke();
          } else if (isHint) {
            const pulse = 0.5 + 0.5 * Math.sin(Date.now() / 200);
            ctx.strokeStyle = `rgba(255,230,0,${0.6 + 0.4 * pulse})`;
            ctx.lineWidth   = 3;
            this._roundRect(ctx, x + sx + 2, y + sy + 2, cellSize - 4, cellSize - 4, rad);
            ctx.stroke();
          }
        }

        ctx.restore();
      }
    }
  }

  // Polyfill-safe rounded rect helper
  _roundRect(ctx, x, y, w, h, r) {
    if (typeof ctx.roundRect === 'function') {
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, r);
    } else {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.arcTo(x + w, y, x + w, y + r, r);
      ctx.lineTo(x + w, y + h - r);
      ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
      ctx.lineTo(x + r, y + h);
      ctx.arcTo(x, y + h, x, y + h - r, r);
      ctx.lineTo(x, y + r);
      ctx.arcTo(x, y, x + r, y, r);
      ctx.closePath();
    }
  }

  // ── Path animation rendering ───────────────────────────────────────────────

  _drawPathAnim(ctx) {
    if (!this._pathAnim || !this._pathAnim.path.length) return;
    const { cellSize, offsetX, offsetY } = this._cell;
    const progress = this._pathAnim.timer / this._pathAnim.duration;
    const alpha    = 1 - progress;

    ctx.save();
    ctx.strokeStyle = `rgba(255,230,80,${alpha})`;
    ctx.lineWidth   = 3;
    ctx.lineJoin    = 'round';
    ctx.lineCap     = 'round';
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    for (let i = 0; i < this._pathAnim.path.length; i++) {
      const { r, c } = this._pathAnim.path[i];
      const px = offsetX + c * cellSize + cellSize / 2;
      const py = offsetY + r * cellSize + cellSize / 2;
      if (i === 0) ctx.moveTo(px, py);
      else         ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  // ── HUD rendering ──────────────────────────────────────────────────────────

  _drawHUD(ctx) {
    const { lw } = this._r;

    // HUD background
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(0, 0, lw, 80);

    // Back button
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.beginPath();
    ctx.arc(26, 26, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('←', 26, 26);

    // Steps / moves
    const stepsText = this._zenMode ? '∞' : String(Math.max(0, this._steps));
    ctx.fillStyle = '#AADDFF';
    ctx.font = '13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('步数', lw / 2, 18);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText(stepsText, lw / 2, 52);

    // Score (left side)
    ctx.fillStyle = '#AADDFF';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('得分', 60, 20);
    ctx.fillStyle = '#FFE04B';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText(String(this._score), 60, 44);

    // Combo indicator (right side)
    const combo = this._combo.getCombo();
    if (combo >= 2) {
      ctx.fillStyle = '#FF8C00';
      ctx.font = 'bold 18px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`${combo}x连击!`, lw - 55, 36);
    }

    // Mute toggle button (top right)
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.beginPath();
    ctx.arc(lw - 26, 26, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this._muted ? '🔇' : '🔊', lw - 26, 26);

    ctx.restore();
  }

  // ── Bottom bar: hint + reshuffle buttons ───────────────────────────────────

  _drawBottomBar(ctx) {
    const { lw, lh } = this._r;
    const coins = this._progress?.getCoins?.() ?? 0;

    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(0, lh - 60, lw, 60);

    // Hint button (10 coins)
    ctx.fillStyle = this._hintPair ? '#FFD700' : 'rgba(255,255,255,0.15)';
    this._roundRect(ctx, 80, lh - 48, 110, 36, 8);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('💡 提示(10)', 135, lh - 30);

    // Reshuffle button (free / 30 coins)
    const reshuffleFree = this._firstReshuffle;
    ctx.fillStyle = reshuffleFree ? 'rgba(0,200,100,0.3)' : 'rgba(255,255,255,0.15)';
    this._roundRect(ctx, 210, lh - 48, 120, 36, 8);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(reshuffleFree ? '🔀 重排(免费)' : '🔀 重排(30)', 270, lh - 30);

    // Coins display
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(`🪙 ${coins}`, lw - 12, lh - 30);

    ctx.restore();
  }

  // ── Panel helpers ──────────────────────────────────────────────────────────

  _drawPanel(ctx, title, lines, buttons) {
    const { lw, lh } = this._r;
    const pw = 300, ph = 220;
    const px = (lw - pw) / 2, py = (lh - ph) / 2;

    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillRect(0, 0, lw, lh);

    ctx.fillStyle = '#1e2a4a';
    this._roundRect(ctx, px, py, pw, ph, 16);
    ctx.fill();

    ctx.strokeStyle = 'rgba(100,150,255,0.5)';
    ctx.lineWidth = 2;
    this._roundRect(ctx, px, py, pw, ph, 16);
    ctx.stroke();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(title, lw / 2, py + 20);

    ctx.font = '16px sans-serif';
    ctx.fillStyle = '#AADDFF';
    lines.forEach((line, i) => {
      ctx.fillText(line, lw / 2, py + 60 + i * 24);
    });

    buttons.forEach((btn, i) => {
      const bw = 120, bh = 40;
      const bx = lw / 2 - (buttons.length === 1 ? bw / 2 : bw + 10) + i * (bw + 20);
      const by = py + ph - 60;
      ctx.fillStyle = btn.color ?? '#3498db';
      this._roundRect(ctx, bx, by, bw, bh, 10);
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(btn.label, bx + bw / 2, by + bh / 2);
      // Store hit rect for tap detection
      btn._bx = bx; btn._by = by; btn._bw = bw; btn._bh = bh;
    });

    ctx.restore();
  }

  _drawWinPanel(ctx) {
    const starsText = this._zenMode ? '' : '⭐'.repeat(this._stars);
    const lines = this._zenMode
      ? [`得分: ${this._score}`, `最高连击: ${this._combo.getCombo()}`]
      : [`得分: ${this._score}`, starsText];
    const buttons = this._zenMode
      ? [{ label: '再来一局', color: '#27ae60', id: 'replay' }]
      : [
          { label: '再玩一次', color: '#3498db', id: 'replay' },
          { label: '下一关',  color: '#27ae60', id: 'next'   },
        ];
    this._drawPanel(ctx, '关卡完成！', lines, buttons);
    this._winPanelButtons = buttons;
  }

  _drawFailPanel(ctx) {
    const coins = this._progress?.getCoins?.() ?? 0;
    const canContinue = coins >= 30;
    const lines = [`剩余步数: 0`, `得分: ${this._score}`];
    const buttons = [
      { label: '重玩', color: '#e74c3c', id: 'retry' },
    ];
    if (canContinue) {
      buttons.push({ label: '续关(30)', color: '#f39c12', id: 'continue' });
    }
    this._drawPanel(ctx, '游戏结束', lines, buttons);
    this._failPanelButtons = buttons;
  }

  _drawReshufflePrompt(ctx) {
    const coins = this._progress?.getCoins?.() ?? 0;
    const canAfford = coins >= 30;
    const lines = [`棋盘无法继续`, `重排需要 30 金币（当前: ${coins}）`];
    const buttons = [{ label: '放弃', color: '#888', id: 'give_up' }];
    if (canAfford) {
      buttons.push({ label: '重排(30)', color: '#27ae60', id: 'reshuffle' });
    }
    this._drawPanel(ctx, '无法继续', lines, buttons);
    this._reshufflePromptButtons = buttons;
  }

  // ── Panel tap handling ─────────────────────────────────────────────────────

  _handlePanelTap(x, y) {
    if (this._showWinPanel) {
      for (const btn of (this._winPanelButtons ?? [])) {
        if (this._hitButton(btn, x, y)) {
          if (btn.id === 'replay') {
            this.init({ chapter: this._chapter, level: this._level, zenMode: this._zenMode });
          } else if (btn.id === 'next') {
            this.init({ chapter: this._chapter, level: this._level + 1 });
          }
          return;
        }
      }
    }

    if (this._showFailPanel) {
      for (const btn of (this._failPanelButtons ?? [])) {
        if (this._hitButton(btn, x, y)) {
          if (btn.id === 'retry') {
            this.init({ chapter: this._chapter, level: this._level, zenMode: this._zenMode });
          } else if (btn.id === 'continue') {
            this._onContinue();
          }
          return;
        }
      }
    }
  }

  _handleReshufflePromptTap(x, y) {
    for (const btn of (this._reshufflePromptButtons ?? [])) {
      if (this._hitButton(btn, x, y)) {
        if (btn.id === 'reshuffle') {
          this._onReshuffle();
        } else if (btn.id === 'give_up') {
          this._showReshufflePrompt = false;
          // Treat as failure
          this._gameOver      = true;
          this._showFailPanel = true;
        }
        return;
      }
    }
  }

  _hitButton(btn, x, y) {
    if (!btn._bx) return false;
    return x >= btn._bx && x <= btn._bx + btn._bw && y >= btn._by && y <= btn._by + btn._bh;
  }
}
