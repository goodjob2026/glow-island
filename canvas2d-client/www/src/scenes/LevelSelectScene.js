import { GameplayScene } from './GameplayScene.js';

const CHAPTER_NAMES = ['码头', '陶艺', '花田', '森林', '温泉', '灯塔'];
const CHAPTER_COLORS = ['#4A90D9','#E8A87C','#F0B4D4','#5BAD6F','#C4A0D0','#F5D76E'];

export class LevelSelectScene {
  constructor(sm, renderer, assets, audio, progress) {
    this._sm = sm; this._r = renderer; this._assets = assets;
    this._audio = audio; this._pm = progress;
    this._chapter = 1;
    this._zenMode = false;
    this._scrollY = 0;
    this._pulseT = 0;
  }

  init({ chapter = 1, zenMode = false } = {}) {
    this._chapter = chapter;
    this._zenMode = zenMode;
    this._scrollY = 0;
  }

  update(dt) {
    this._pulseT += dt;
  }

  draw() {
    const { ctx, lw, lh } = this._r;
    const data = this._pm.load();
    const maxCh = data.chapter || 1;
    const maxLv = ch => ch < maxCh ? 30 : (data.level || 1);
    const color = CHAPTER_COLORS[this._chapter - 1];

    ctx.save();
    ctx.fillStyle = '#0D1B2A';
    ctx.fillRect(0, 0, lw, lh);

    // Header
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, lw, 64);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold ${lw*0.05}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(`第${this._chapter}章：${CHAPTER_NAMES[this._chapter-1]}`, lw/2, 42);
    if (this._zenMode) {
      ctx.font = `${lw*0.035}px sans-serif`;
      ctx.fillText('🌿 禅模式', lw/2, 58);
    }

    // Back button
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `${lw*0.045}px sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillText('←', 16, 42);

    // Level grid: 5 per row, 6 rows
    const cellW = (lw - 32) / 5;
    const cellH = cellW * 1.1;
    const startY = 80 - this._scrollY;

    const unlockedCount = maxLv(this._chapter);

    for (let lv = 1; lv <= 30; lv++) {
      const col = (lv - 1) % 5;
      const row = Math.floor((lv - 1) / 5);
      const cx = 16 + col * cellW + cellW/2;
      const cy = startY + row * cellH + cellH/2;

      if (cy + cellH < 64 || cy - cellH > lh) continue; // clip

      const stars = data.stars?.[`${this._chapter}-${lv}`] || 0;
      const unlocked = lv <= unlockedCount;
      const isCurrent = lv === unlockedCount && stars === 0;

      // Cell background
      ctx.save();
      if (!unlocked) {
        ctx.fillStyle = '#2A2A3A';
      } else if (stars > 0) {
        ctx.fillStyle = color + 'CC';
      } else {
        ctx.fillStyle = color + '66';
      }

      // Pulse for current level
      if (isCurrent) {
        const pulse = 0.7 + 0.3 * Math.sin(this._pulseT * 3);
        ctx.shadowColor = color;
        ctx.shadowBlur = 12 * pulse;
      }

      const pad = 4;
      ctx.beginPath();
      ctx.roundRect?.(cx - cellW/2 + pad, cy - cellH/2 + pad, cellW - pad*2, cellH - pad*2, 10) ||
        ctx.rect(cx - cellW/2 + pad, cy - cellH/2 + pad, cellW - pad*2, cellH - pad*2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Level number
      ctx.fillStyle = unlocked ? '#FFFFFF' : '#555';
      ctx.font = `bold ${lw*0.04}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(String(lv), cx, cy + lw*0.014);

      // Stars
      if (stars > 0) {
        ctx.font = `${lw*0.028}px sans-serif`;
        ctx.fillText('★'.repeat(stars) + '☆'.repeat(3-stars), cx, cy + cellH/2 - 8);
      } else if (!unlocked) {
        ctx.font = `${lw*0.04}px sans-serif`;
        ctx.fillText('🔒', cx, cy + lw*0.014);
      }
      ctx.restore();
    }

    ctx.restore();
  }

  onTap(x, y) {
    const { lw, lh } = this._r;
    const data = this._pm.load();
    const maxCh = data.chapter || 1;
    const unlockedCount = this._chapter < maxCh ? 30 : (data.level || 1);

    // Back button
    if (x < 60 && y < 64) {
      this._sm.pop();
      return;
    }

    const cellW = (lw - 32) / 5;
    const cellH = cellW * 1.1;
    const startY = 80 - this._scrollY;

    for (let lv = 1; lv <= 30; lv++) {
      const col = (lv - 1) % 5;
      const row = Math.floor((lv - 1) / 5);
      const cx = 16 + col * cellW;
      const cy = startY + row * cellH;
      if (x >= cx && x < cx + cellW && y >= cy && y < cy + cellH) {
        if (lv <= unlockedCount) {
          this._sm.go(GameplayScene, {
            chapter: this._chapter,
            level: lv,
            zenMode: this._zenMode
          });
        }
        return;
      }
    }
  }

  destroy() {}
  onBack() { this._sm.pop(); }
  resize(w, h) {}
}
