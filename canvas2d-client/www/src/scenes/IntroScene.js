import { IslandMapScene } from './IslandMapScene.js';

export class IntroScene {
  constructor(sm, renderer, assets, audio, progress) {
    this._sm = sm; this._r = renderer; this._assets = assets;
    this._audio = audio; this._pm = progress;
    this._act = 1;
    this._t = 0; // time in current act
    this._bgImg = null;
  }

  init(params = {}) {
    // Skip intro if already seen
    const data = this._pm.load();
    if (data.introSeen) {
      this._sm.go(IslandMapScene);
      return;
    }
    this._act = 1;
    this._t = 0;
    this._bgImg = this._assets?.backgrounds?.ch01_harbor_before || null;
    this._audio?.playBGM?.('bgm_menu');
  }

  update(dt) {
    this._t += dt;
    // Auto-advance act 1 and 2 after 4 seconds each (act 3 requires click)
    if (this._act < 3 && this._t > 4) {
      this._act++;
      this._t = 0;
    }
  }

  draw() {
    const { ctx, lw, lh } = this._r;
    ctx.save();

    if (this._act === 1) {
      // Act 1: Ferry deck - gradient sky
      const grad = ctx.createLinearGradient(0, 0, 0, lh);
      grad.addColorStop(0, '#0A1628');
      grad.addColorStop(0.6, '#1A4A7A');
      grad.addColorStop(1, '#2A7AB5');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, lw, lh);

      // Railing silhouette
      ctx.fillStyle = '#0A0A15';
      ctx.fillRect(0, lh * 0.75, lw, lh * 0.25);
      for (let i = 0; i < lw; i += 40) {
        ctx.fillRect(i, lh * 0.65, 6, lh * 0.1);
      }
      ctx.fillRect(0, lh * 0.63, lw, 8);

      // Japanese subtitle
      const alpha = Math.min(1, this._t / 0.8);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#FFFFFF';
      ctx.font = `${lw * 0.05}px serif`;
      ctx.textAlign = 'center';
      ctx.fillText('「あの島に何かが残っているはずだ」', lw/2, lh * 0.35);
      ctx.font = `${lw * 0.035}px sans-serif`;
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.fillText('那座岛上，一定还留着什么', lw/2, lh * 0.35 + lw * 0.06);

    } else if (this._act === 2) {
      // Act 2: Arriving at dock - harbor background
      const scale = 1.0 + (this._t / 3) * 0.05;
      if (this._bgImg) {
        ctx.save();
        ctx.translate(lw/2, lh/2);
        ctx.scale(scale, scale);
        ctx.drawImage(this._bgImg, -lw/2, -lh/2, lw, lh);
        ctx.restore();
      } else {
        const grad = ctx.createLinearGradient(0, 0, 0, lh);
        grad.addColorStop(0, '#87CEEB');
        grad.addColorStop(1, '#4A8FA8');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, lw, lh);
      }
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(0, 0, lw, lh);

      const alpha = Math.min(1, this._t / 0.8);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#FFFFFF';
      ctx.font = `bold ${lw * 0.08}px serif`;
      ctx.textAlign = 'center';
      ctx.fillText('輝島', lw/2, lh * 0.4);
      ctx.font = `${lw * 0.04}px sans-serif`;
      ctx.fillText('（かがやきじま）', lw/2, lh * 0.4 + lw * 0.1);

    } else {
      // Act 3: Stepping onto boardwalk
      const scale = 1.05 + (this._t / 4) * 0.03;
      if (this._bgImg) {
        ctx.save();
        ctx.translate(lw/2, lh * 0.55);
        ctx.scale(scale, scale);
        ctx.drawImage(this._bgImg, -lw/2, -lh * 0.55, lw, lh);
        ctx.restore();
      } else {
        ctx.fillStyle = '#3A7A5A';
        ctx.fillRect(0, 0, lw, lh);
      }
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.fillRect(0, 0, lw, lh);

      // Speech bubble
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.beginPath();
      ctx.roundRect?.(lw*0.1, lh*0.3, lw*0.8, lh*0.15, 12) ||
        ctx.rect(lw*0.1, lh*0.3, lw*0.8, lh*0.15);
      ctx.fill();
      ctx.fillStyle = '#222';
      ctx.font = `${lw * 0.04}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('「ようこそ、輝島へ。」', lw/2, lh * 0.36);
      ctx.font = `${lw * 0.033}px sans-serif`;
      ctx.fillText('欢迎来到輝岛。', lw/2, lh * 0.36 + lw * 0.055);

      // Pulse tap indicator
      const pulse = 0.5 + 0.5 * Math.sin(Date.now() / 400);
      ctx.globalAlpha = pulse;
      ctx.fillStyle = '#FFFFFF';
      ctx.font = `${lw * 0.04}px sans-serif`;
      ctx.fillText('点击继续', lw/2, lh * 0.88);
    }

    ctx.restore();
  }

  onTap(x, y) {
    if (this._act < 3) {
      this._act++;
      this._t = 0;
    } else {
      // Mark intro seen and go to island map
      const data = this._pm.load();
      data.introSeen = true;
      this._pm._data = data;
      this._pm.save();
      // Fade to IslandMapScene
      this._sm.go(IslandMapScene);
    }
  }

  destroy() {}
  onBack() {}
  resize(w, h) {}
}
