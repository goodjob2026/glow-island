// VFXSystem.js — Pure Canvas2D visual effects for Glow Island match-2
// No external dependencies. ES module named export.

class Particle {
  constructor(x, y, vx, vy, color, radius, lifetime) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.radius = radius;
    this.lifetime = lifetime;
    this.age = 0;
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.age += dt;
  }

  get alpha() {
    return Math.max(0, 1 - this.age / this.lifetime);
  }

  draw(ctx) {
    if (this.alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// Chapter unlock color palettes
const CHAPTER_PALETTES = [
  ['#FFE566', '#FFD700', '#FFA500', '#FF6B35', '#FF4500'],
  ['#4fc3f7', '#29b6f6', '#0288d1', '#80deea', '#00bcd4'],
  ['#ce93d8', '#ba68c8', '#9c27b0', '#f48fb1', '#e91e63'],
  ['#a5d6a7', '#81c784', '#4caf50', '#c5e1a5', '#cddc39'],
  ['#ffcc02', '#ff9800', '#f44336', '#9c27b0', '#3f51b5'],
];

function chapterPalette(chapter) {
  return CHAPTER_PALETTES[(chapter - 1) % CHAPTER_PALETTES.length];
}

export class VFXSystem {
  /**
   * @param {{ ctx: CanvasRenderingContext2D, lw: number, lh: number }} renderer
   */
  constructor(renderer) {
    this._renderer = renderer;
    this._effects = [];
    this._particles = [];
  }

  // ─── public API ───────────────────────────────────────────────────────────

  /** Advance all active effects by dt seconds */
  update(dt) {
    // Update particles
    for (const p of this._particles) {
      p.update(dt);
    }
    this._particles = this._particles.filter(p => p.age < p.lifetime);

    // Update effects — convert dt to ms internally for most effects
    const dtMs = dt * 1000;

    for (const eff of this._effects) {
      eff.t += dtMs;

      // Special: selectionGlow wraps instead of expiring
      if (eff.type === 'selectionGlow') {
        // t is used as seconds for sin wave — reset to avoid float bloat
        if (eff.t > 10000) eff.t -= 10000;
        continue;
      }
    }

    this._effects = this._effects.filter(
      eff => eff.type === 'selectionGlow' || eff.t < eff.duration
    );
  }

  /** Draw all active effects on top of game */
  draw() {
    const { ctx } = this._renderer;

    for (const eff of this._effects) {
      this._drawEffect(ctx, eff);
    }

    // Draw standalone particles (from bomb etc.)
    for (const p of this._particles) {
      p.draw(ctx);
    }
  }

  // ─── show* methods ────────────────────────────────────────────────────────

  /**
   * Animated dashed path connection line.
   * @param {Array<{x:number,y:number}>} points
   * @param {string} [color='#FFE566']
   */
  showPath(points, color = '#FFE566') {
    if (!points || points.length < 2) return;
    this._effects.push({ type: 'path', t: 0, duration: 300, points, color });
  }

  /** Tile disappear pop-and-fade animation */
  showTileVanish(r, c, cellSize, ox, oy) {
    const cx = ox + c * cellSize + cellSize / 2;
    const cy = oy + r * cellSize + cellSize / 2;

    // Spawn corner particles
    const offsets = [
      [-1, -1], [1, -1], [-1, 1], [1, 1],
    ];
    for (const [dx, dy] of offsets) {
      const speed = 80 + Math.random() * 60;
      const angle = Math.atan2(dy, dx);
      this._particles.push(new Particle(
        cx + dx * cellSize * 0.4,
        cy + dy * cellSize * 0.4,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        '#FFE566',
        4,
        0.35
      ));
    }

    this._effects.push({ type: 'tileVanish', t: 0, duration: 350, cx, cy, cellSize });
  }

  /** Bomb explosion at grid cell */
  showBomb(centerR, centerC, cellSize, ox, oy) {
    const cx = ox + centerC * cellSize + cellSize / 2;
    const cy = oy + centerR * cellSize + cellSize / 2;

    // 8 directional particles
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const speed = 200;
      this._particles.push(new Particle(
        cx, cy,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        '#ff6b35',
        5,
        0.5
      ));
    }

    this._effects.push({ type: 'bomb', t: 0, duration: 500, cx, cy, cellSize });
  }

  /** Cross sweep across entire row and column */
  showWindmill(row, col, cols, rows, cellSize, ox, oy) {
    this._effects.push({
      type: 'windmill', t: 0, duration: 400,
      row, col, cols, rows, cellSize, ox, oy
    });
  }

  /** Bezier light beam between two lantern tiles */
  showLanternConnect(r1, c1, r2, c2, cellSize, ox, oy) {
    const x1 = ox + c1 * cellSize + cellSize / 2;
    const y1 = oy + r1 * cellSize + cellSize / 2;
    const x2 = ox + c2 * cellSize + cellSize / 2;
    const y2 = oy + r2 * cellSize + cellSize / 2;
    this._effects.push({ type: 'lanternConnect', t: 0, duration: 300, x1, y1, x2, y2 });
  }

  /** Wave sweep for board reshuffle */
  showWaveReshuffle(cols, rows, cellSize, ox, oy) {
    this._effects.push({
      type: 'waveReshuffle', t: 0, duration: 600,
      cols, rows, cellSize, ox, oy
    });
  }

  /** Combo popup text at canvas position */
  showComboText(combo, multiplier, x, y) {
    this._effects.push({ type: 'comboText', t: 0, duration: 1200, combo, multiplier, x, y });
  }

  /** Full-screen FEVER overlay */
  showFEVER(canvasW, canvasH) {
    this._effects.push({ type: 'fever', t: 0, duration: 2000, canvasW, canvasH });
  }

  /** Chapter unlock particle celebration */
  showChapterUnlock(chapter) {
    const { lw, lh } = this._renderer;
    const cx = lw / 2;
    const cy = lh / 2;
    const palette = chapterPalette(chapter);

    for (let i = 0; i < 60; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 150 + Math.random() * 250;
      const color = palette[Math.floor(Math.random() * palette.length)];
      const radius = 4 + Math.random() * 4;
      const lifetime = 2 + Math.random() * 1;
      const p = new Particle(
        cx, cy,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        color,
        radius,
        lifetime
      );
      // Tag particle with gravity for chapterUnlock
      p._gravity = 80;
      this._particles.push(p);
    }

    this._effects.push({ type: 'chapterUnlock', t: 0, duration: 3000, chapter, cx, cy });
  }

  /** Invalid tap shake animation */
  showTileShake(r, c, cellSize, ox, oy) {
    this._effects.push({ type: 'tileShake', t: 0, duration: 300, r, c, cellSize, ox, oy });
  }

  /**
   * Continuous selection pulse glow (stays until removed externally via clearSelection).
   * Wraps t so it never expires naturally.
   */
  showSelectionGlow(r, c, cellSize, ox, oy) {
    // Remove any existing selectionGlow for the same cell
    this._effects = this._effects.filter(
      e => !(e.type === 'selectionGlow' && e.r === r && e.c === c)
    );
    this._effects.push({ type: 'selectionGlow', t: 0, duration: Infinity, r, c, cellSize, ox, oy });
  }

  /** Remove all selection glows (call when tile deselected) */
  clearSelectionGlow(r, c) {
    this._effects = this._effects.filter(
      e => !(e.type === 'selectionGlow' && e.r === r && e.c === c)
    );
  }

  // ─── internal draw dispatch ───────────────────────────────────────────────

  _drawEffect(ctx, eff) {
    switch (eff.type) {
      case 'path':            this._drawPath(ctx, eff); break;
      case 'tileVanish':      this._drawTileVanish(ctx, eff); break;
      case 'bomb':            this._drawBomb(ctx, eff); break;
      case 'windmill':        this._drawWindmill(ctx, eff); break;
      case 'lanternConnect':  this._drawLanternConnect(ctx, eff); break;
      case 'waveReshuffle':   this._drawWaveReshuffle(ctx, eff); break;
      case 'comboText':       this._drawComboText(ctx, eff); break;
      case 'fever':           this._drawFEVER(ctx, eff); break;
      case 'chapterUnlock':   this._drawChapterUnlock(ctx, eff); break;
      case 'tileShake':       this._drawTileShake(ctx, eff); break;
      case 'selectionGlow':   this._drawSelectionGlow(ctx, eff); break;
    }
  }

  // ─── individual effect renderers ─────────────────────────────────────────

  _drawPath(ctx, eff) {
    const { t, duration, points, color } = eff;
    const progress = t / duration;
    ctx.save();
    ctx.globalAlpha = 1 - progress;
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.setLineDash([8, 4]);
    ctx.lineDashOffset = -progress * 16;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  _drawTileVanish(ctx, eff) {
    const { t, duration, cx, cy, cellSize } = eff;
    const progress = t / duration;
    const scale = 1.0 + 0.3 * progress;
    const alpha = 1 - progress;
    const half = (cellSize * scale) / 2;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = '#FFE566';
    ctx.lineWidth = 2;
    ctx.strokeRect(cx - half, cy - half, cellSize * scale, cellSize * scale);
    ctx.restore();
  }

  _drawBomb(ctx, eff) {
    const { t, duration, cx, cy, cellSize } = eff;

    ctx.save();

    // Phase 1 (0-100ms): white flash circle expanding
    if (t < 100) {
      const p = t / 100;
      const radius = cellSize * 1.5 * p;
      ctx.globalAlpha = 1 - p * 0.5;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Phase 2 (100-400ms): orange shockwave ring
    if (t >= 100 && t < 400) {
      const p = (t - 100) / 300;
      const radius = cellSize * 1.5 + (cellSize * 1.5) * p;
      ctx.globalAlpha = 1 - p;
      ctx.strokeStyle = '#ff8c00';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }

  _drawWindmill(ctx, eff) {
    const { t, duration, row, col, cols, rows, cellSize, ox, oy } = eff;
    const alpha = 1 - t / duration;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#FFD700';

    // Horizontal beam (full row)
    ctx.fillRect(0, oy + row * cellSize, cols * cellSize + ox * 2, cellSize);

    // Vertical beam (full col)
    ctx.fillRect(ox + col * cellSize, 0, cellSize, rows * cellSize + oy * 2);

    ctx.restore();
  }

  _drawLanternConnect(ctx, eff) {
    const { t, duration, x1, y1, x2, y2 } = eff;
    const alpha = 1 - t / duration;

    // Bezier control points — arc upward
    const cpx = (x1 + x2) / 2;
    const cpy = Math.min(y1, y2) - Math.abs(x2 - x1) * 0.3;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = '#FFB347';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.quadraticCurveTo(cpx, cpy, x2, y2);
    ctx.stroke();
    ctx.restore();
  }

  _drawWaveReshuffle(ctx, eff) {
    const { t, duration, cols, rows, cellSize, ox, oy } = eff;
    const progress = t / duration; // 0→1

    const boardW = cols * cellSize;
    const boardH = rows * cellSize;
    const totalH = boardH + oy * 2;
    const waveColors = ['#4fc3f7', '#29b6f6', '#0288d1'];

    ctx.save();

    for (let wi = 0; wi < 3; wi++) {
      const offset = wi * 60; // px apart in x
      // Leading edge x position sweeps from -offset to boardW+ox+offset
      const leadX = (ox + boardW + offset * 2) * progress - offset;

      ctx.strokeStyle = waveColors[wi];
      ctx.lineWidth = 3;
      ctx.globalAlpha = 0.85 - wi * 0.2;
      ctx.beginPath();

      const amplitude = 10;
      const freq = 0.025 + wi * 0.008;

      for (let px = 0; px <= leadX; px += 3) {
        const yBase = totalH / 2;
        const yDev = Math.sin(px * freq * Math.PI + wi * 1.5) * amplitude;
        if (px === 0) {
          ctx.moveTo(px, yBase + yDev);
        } else {
          ctx.lineTo(px, yBase + yDev);
        }
      }
      ctx.stroke();
    }

    ctx.restore();
  }

  _drawComboText(ctx, eff) {
    const { t, duration, combo, x, y } = eff;

    // Size and color by combo level
    let fontSize = 24;
    let color = '#ffffff';
    if (combo >= 4) { fontSize = 48; color = '#ff6b35'; }
    else if (combo >= 3) { fontSize = 32; color = '#FFD700'; }

    const label = `COMBO ×${combo}`;

    let scale = 1;
    let alpha = 1;
    let yOffset = 0;

    if (t < 200) {
      // Bounce in: 0→1.2→1.0
      const p = t / 200;
      scale = p < 0.7 ? p / 0.7 * 1.2 : 1.2 - (p - 0.7) / 0.3 * 0.2;
    } else if (t < 900) {
      // Static + drift up
      scale = 1;
      const p = (t - 200) / 700;
      yOffset = -40 * p;
    } else {
      // Fade out
      const p = (t - 900) / 300;
      scale = 1;
      alpha = 1 - p;
      yOffset = -40;
    }

    ctx.save();
    ctx.globalAlpha = Math.max(0, alpha);
    ctx.translate(x, y + yOffset);
    ctx.scale(scale, scale);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.strokeStyle = 'rgba(0,0,0,0.6)';
    ctx.lineWidth = 3;
    ctx.strokeText(label, 0, 0);
    ctx.fillStyle = color;
    ctx.fillText(label, 0, 0);
    ctx.restore();
  }

  _drawFEVER(ctx, eff) {
    const { t, duration, canvasW, canvasH } = eff;

    let textAlpha = 1;
    let textScale = 1;
    if (t < 300) {
      // Scale in 1.5→1.0
      const p = t / 300;
      textScale = 1.5 - p * 0.5;
    } else if (t > duration - 500) {
      // Fade out
      textAlpha = 1 - (t - (duration - 500)) / 500;
    }

    ctx.save();

    // Overlay tint
    ctx.fillStyle = 'rgba(255,215,0,0.08)';
    ctx.fillRect(0, 0, canvasW, canvasH);

    // Corner radial glows
    const cornerRadius = canvasW * 0.4;
    const corners = [
      [0, 0], [canvasW, 0], [0, canvasH], [canvasW, canvasH],
    ];
    for (const [cx, cy] of corners) {
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, cornerRadius);
      grad.addColorStop(0, 'rgba(255,215,0,0.25)');
      grad.addColorStop(1, 'rgba(255,215,0,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvasW, canvasH);
    }

    // FEVER! text
    ctx.globalAlpha = Math.max(0, textAlpha);
    ctx.translate(canvasW / 2, canvasH / 2);
    ctx.scale(textScale, textScale);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 64px sans-serif';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.strokeText('FEVER!', 0, 0);
    ctx.fillStyle = '#FFD700';
    ctx.fillText('FEVER!', 0, 0);

    ctx.restore();
  }

  _drawChapterUnlock(ctx, eff) {
    const { t, duration, chapter, cx, cy } = eff;

    // Text: pop in then fade out
    let textAlpha;
    if (t < 400) {
      textAlpha = t / 400;
    } else if (t < duration - 600) {
      textAlpha = 1;
    } else {
      textAlpha = 1 - (t - (duration - 600)) / 600;
    }

    const chapterNames = [
      'Chapter I', 'Chapter II', 'Chapter III', 'Chapter IV', 'Chapter V',
    ];
    const name = chapterNames[(chapter - 1) % chapterNames.length] || `Chapter ${chapter}`;

    ctx.save();
    ctx.globalAlpha = Math.max(0, textAlpha);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 64px sans-serif';
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.lineWidth = 4;
    ctx.strokeText(name, cx, cy);
    ctx.fillStyle = '#FFD700';
    ctx.fillText(name, cx, cy);
    ctx.restore();
    // Particles are handled separately via this._particles
  }

  _drawTileShake(ctx, eff) {
    const { t, duration, r, c, cellSize, ox, oy } = eff;
    const progress = t / duration;
    const dx = Math.sin(progress * Math.PI * 5) * 4;

    const x = ox + c * cellSize + dx;
    const y = oy + r * cellSize;

    ctx.save();
    ctx.strokeStyle = '#ff4444';
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.7;
    ctx.strokeRect(x + 1, y + 1, cellSize - 2, cellSize - 2);
    ctx.restore();
  }

  _drawSelectionGlow(ctx, eff) {
    const { t, r, c, cellSize, ox, oy } = eff;
    // t in ms; convert to seconds for wave
    const tSec = t / 1000;
    const wave = Math.sin(tSec * Math.PI * 2);

    const lineWidth = 2 + wave * 1.5;
    const alpha = 0.6 + wave * 0.4;

    const x = ox + c * cellSize;
    const y = oy + r * cellSize;

    ctx.save();
    ctx.globalAlpha = Math.max(0.1, alpha);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = Math.max(0.5, lineWidth);
    ctx.strokeRect(x + 1, y + 1, cellSize - 2, cellSize - 2);
    ctx.restore();
  }
}
