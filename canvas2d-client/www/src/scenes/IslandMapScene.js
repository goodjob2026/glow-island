import { LevelSelectScene } from './LevelSelectScene.js';
import { ShopScene } from './ShopScene.js';

const CHAPTER_NAMES = ['码头', '陶艺', '花田', '森林', '温泉', '灯塔'];
const CHAPTER_COLORS = ['#4A90D9','#E8A87C','#F0B4D4','#5BAD6F','#C4A0D0','#F5D76E'];
const NODE_POSITIONS = [
  {x: 0.5, y: 0.85}, // ch1
  {x: 0.35, y: 0.7},  // ch2
  {x: 0.6, y: 0.55},  // ch3
  {x: 0.3, y: 0.42},  // ch4
  {x: 0.65, y: 0.28}, // ch5
  {x: 0.45, y: 0.15}, // ch6
];

export class IslandMapScene {
  constructor(sm, renderer, assets, audio, progress) {
    this._sm = sm; this._r = renderer; this._assets = assets;
    this._audio = audio; this._pm = progress;
    this._pulseT = 0;
  }

  init(params = {}) {
    this._audio?.playBGM?.('bgm_menu');
  }

  update(dt) {
    this._pulseT += dt;
  }

  draw() {
    const { ctx, lw, lh } = this._r;
    const data = this._pm.load();
    const maxCh = data.chapter || 1;
    const maxLv = data.level || 1;

    ctx.save();

    // Background
    ctx.fillStyle = '#1A3A5C';
    ctx.fillRect(0, 0, lw, lh);

    // Ocean texture
    ctx.fillStyle = 'rgba(30,80,140,0.5)';
    for (let y = 0; y < lh; y += 60) {
      ctx.fillRect(0, y, lw, 30);
    }

    // Top HUD
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, lw, 56);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold ${lw*0.045}px sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillText('GLOW ISLAND', 16, 36);

    ctx.textAlign = 'right';
    ctx.font = `${lw*0.04}px sans-serif`;
    const coins = data.coins ?? 200;
    const glowstone = data.glowstone ?? 0;
    ctx.fillText(`🪙 ${coins}  💎 ${glowstone}`, lw - 16, 36);

    // Chapter nodes + connections
    for (let ch = 1; ch <= 6; ch++) {
      const pos = NODE_POSITIONS[ch-1];
      const nx = pos.x * lw;
      const ny = pos.y * lh;

      // Draw connection line to next chapter
      if (ch < 6) {
        const next = NODE_POSITIONS[ch];
        ctx.beginPath();
        ctx.moveTo(nx, ny);
        ctx.lineTo(next.x * lw, next.y * lh);
        ctx.strokeStyle = ch < maxCh ? CHAPTER_COLORS[ch-1] : 'rgba(255,255,255,0.2)';
        ctx.lineWidth = 3;
        ctx.setLineDash(ch < maxCh ? [] : [8, 6]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      const r = 36;
      const cleared = this._pm.getChapterClearedCount?.(ch) ?? 0;
      const unlocked = ch < maxCh || (ch === maxCh);
      const completed = ch < maxCh;

      // Node circle
      ctx.beginPath();
      ctx.arc(nx, ny, r, 0, Math.PI*2);

      if (!unlocked) {
        ctx.fillStyle = '#333';
        ctx.filter = 'grayscale(100%)';
      } else if (completed) {
        ctx.fillStyle = CHAPTER_COLORS[ch-1];
      } else {
        // Current chapter — pulse glow
        const pulse = 0.7 + 0.3 * Math.sin(this._pulseT * 3);
        ctx.fillStyle = CHAPTER_COLORS[ch-1];
        ctx.shadowColor = CHAPTER_COLORS[ch-1];
        ctx.shadowBlur = 20 * pulse;
      }
      ctx.fill();
      ctx.filter = 'none';
      ctx.shadowBlur = 0;

      // Border
      ctx.strokeStyle = unlocked ? '#FFFFFF' : '#555';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Chapter name
      ctx.fillStyle = unlocked ? '#FFFFFF' : '#888';
      ctx.font = `bold ${lw*0.038}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(CHAPTER_NAMES[ch-1], nx, ny + 5);

      // Progress below node
      if (unlocked) {
        ctx.font = `${lw*0.032}px sans-serif`;
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.fillText(`${cleared}/30`, nx, ny + r + 18);
      }

      // Lock icon for locked chapters
      if (!unlocked) {
        ctx.font = `${lw*0.05}px sans-serif`;
        ctx.fillText('🔒', nx, ny + 8);
      }
    }

    // Hourglass (bottom right)
    this._drawHourglass(ctx, lw, lh, data);

    // Zen mode button (bottom center)
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.beginPath();
    ctx.roundRect?.(lw/2-50, lh-60, 100, 40, 20) || ctx.rect(lw/2-50, lh-60, 100, 40);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `${lw*0.035}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('🌿 禅模式', lw/2, lh - 34);

    ctx.restore();
  }

  _drawHourglass(ctx, lw, lh, data) {
    const last = data.hourglassLastClaim || 0;
    const ready = Date.now() - last >= 4 * 3600 * 1000;
    const x = lw - 56, y = lh - 80;

    ctx.save();
    if (ready) {
      const pulse = 0.7 + 0.3 * Math.sin(Date.now() / 400);
      ctx.shadowColor = '#FFD700';
      ctx.shadowBlur = 15 * pulse;
    }
    ctx.font = '36px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('⏳', x, y);
    ctx.shadowBlur = 0;

    if (!ready) {
      const elapsed = Date.now() - last;
      const remaining = 4 * 3600 * 1000 - elapsed;
      const h = Math.floor(remaining / 3600000);
      const m = Math.floor((remaining % 3600000) / 60000);
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.font = `${lw*0.028}px sans-serif`;
      ctx.fillText(`${h}h${m}m`, x, y + 22);
    }
    ctx.restore();
  }

  onTap(x, y) {
    const { lw, lh } = this._r;
    const data = this._pm.load();
    const maxCh = data.chapter || 1;

    // Check chapter nodes
    for (let ch = 1; ch <= 6; ch++) {
      const pos = NODE_POSITIONS[ch-1];
      const nx = pos.x * lw, ny = pos.y * lh;
      const dist = Math.hypot(x - nx, y - ny);
      if (dist < 40) {
        if (ch <= maxCh) {
          this._sm.go(LevelSelectScene, { chapter: ch });
        }
        return;
      }
    }

    // Hourglass tap
    if (Math.hypot(x - (lw-56), y - (lh-80)) < 36) {
      const last = data.hourglassLastClaim || 0;
      if (Date.now() - last >= 4 * 3600 * 1000) {
        const reward = 10 + Math.floor(Math.random() * 11);
        this._pm.addCoins(reward);
        this._pm.setHourglassLastClaim(Date.now());
      } else {
        this._sm.push(ShopScene);
      }
      return;
    }

    // Shop button (top right area)
    if (x > lw - 100 && y < 56) {
      try { this._sm.push(ShopScene); } catch(e) {}
      return;
    }

    // Zen mode button
    if (y > lh - 65 && y < lh - 20 && x > lw/2 - 55 && x < lw/2 + 55) {
      this._sm.go(LevelSelectScene, { chapter: data.chapter || 1, zenMode: true });
    }
  }

  destroy() {}
  onBack() {}
  resize(w, h) {}
}
