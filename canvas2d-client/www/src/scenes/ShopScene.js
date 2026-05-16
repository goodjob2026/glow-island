export class ShopScene {
  constructor(sm, renderer, assets, audio, progress, apiClient) {
    this._sm = sm;
    this._r = renderer;
    this._audio = audio;
    this._pm = progress;
    this._api = apiClient;
    this._message = '';
    this._messageTimer = 0;
    this._buttons = [];
  }

  init(params = {}) {
    this._buildButtons();
    this._audio?.playSFX?.('sfx_ui_button');
  }

  _buildButtons() {
    const { lw } = this._r;
    this._buttons = [
      // IAP packs
      { id: 'iap_small',  label: '60石 $0.99',   sub: 'glowstone_pack_small',  x: lw*0.17, y: 180, w: lw*0.28, h: 70, color: '#4A90D9' },
      { id: 'iap_medium', label: '420石 $4.99',  sub: 'glowstone_pack_medium', x: lw*0.5,  y: 180, w: lw*0.28, h: 70, color: '#7B68EE' },
      { id: 'iap_large',  label: '1000石 $9.99', sub: 'glowstone_pack_large',  x: lw*0.83, y: 180, w: lw*0.28, h: 70, color: '#9B59B6' },
      // Coin exchange
      { id: 'coins_50',  label: '50币',  sub: '消耗10石', x: lw*0.17, y: 310, w: lw*0.28, h: 60, color: '#F5A623', cost: 10,  reward: 50  },
      { id: 'coins_150', label: '150币', sub: '消耗25石', x: lw*0.5,  y: 310, w: lw*0.28, h: 60, color: '#F5A623', cost: 25,  reward: 150 },
      { id: 'coins_500', label: '500币', sub: '消耗80石', x: lw*0.83, y: 310, w: lw*0.28, h: 60, color: '#F5A623', cost: 80,  reward: 500 },
      // Hourglass
      { id: 'hourglass', label: '⏳ 领取奖励', sub: '', x: lw*0.5, y: 430, w: lw*0.7, h: 70, color: '#2ECC71' },
    ];
  }

  update(dt) {
    if (this._messageTimer > 0) {
      this._messageTimer -= dt;
    }
    // Update hourglass button state
    const data = this._pm.load();
    const last = data.hourglassLastClaim || 0;
    const ready = Date.now() - last >= 4 * 3600 * 1000;
    const hg = this._buttons.find(b => b.id === 'hourglass');
    if (hg) {
      if (ready) {
        hg.label = '⏳ 领取奖励';
        hg.sub = '10-20 沙滩币';
        hg.disabled = false;
        hg.color = '#2ECC71';
      } else {
        const rem = 4*3600*1000 - (Date.now() - last);
        const h = Math.floor(rem / 3600000);
        const m = Math.floor((rem % 3600000) / 60000);
        hg.label = '⏳ 冷却中';
        hg.sub = `还需 ${h}h ${m}m`;
        hg.disabled = true;
        hg.color = '#666';
      }
    }
  }

  draw() {
    const { ctx, lw, lh } = this._r;
    const data = this._pm.load();

    ctx.save();
    ctx.fillStyle = '#0D1B2A';
    ctx.fillRect(0, 0, lw, lh);

    // Header
    ctx.fillStyle = '#1A3A6A';
    ctx.fillRect(0, 0, lw, 64);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold ${lw*0.05}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('商店', lw/2, 42);

    // Back button
    ctx.textAlign = 'left';
    ctx.fillText('←', 16, 42);

    // Currency display
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.fillRect(16, 72, lw-32, 48);
    ctx.fillStyle = '#FFD700';
    ctx.font = `${lw*0.042}px sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillText(`🪙 ${data.coins ?? 200}`, 32, 102);
    ctx.fillStyle = '#A78BFA';
    ctx.textAlign = 'right';
    ctx.fillText(`💎 ${data.glowstone ?? 0}`, lw-32, 102);

    // Section labels
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = `${lw*0.035}px sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillText('─── 丹青石充值 ───', 16, 155);
    ctx.fillText('─── 沙滩币兑换 ───', 16, 283);
    ctx.fillText('─── 沙漏奖励 ───', 16, 398);

    // Buttons
    for (const btn of this._buttons) {
      this._drawButton(ctx, btn, lw);
    }

    // Feedback message
    if (this._messageTimer > 0) {
      ctx.globalAlpha = Math.min(1, this._messageTimer / 0.5);
      ctx.fillStyle = '#2ECC71';
      ctx.font = `bold ${lw*0.045}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(this._message, lw/2, lh * 0.7);
    }

    ctx.restore();
  }

  _drawButton(ctx, btn, lw) {
    ctx.save();
    if (btn.disabled) {
      ctx.globalAlpha = 0.4;
    }
    ctx.fillStyle = btn.color;
    ctx.beginPath();
    const bx = btn.x - btn.w/2, by = btn.y - btn.h/2;
    ctx.roundRect?.(bx, by, btn.w, btn.h, 10) || ctx.rect(bx, by, btn.w, btn.h);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold ${lw*0.037}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(btn.label, btn.x, btn.y + (btn.sub ? -4 : 6));
    if (btn.sub) {
      ctx.font = `${lw*0.028}px sans-serif`;
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.fillText(btn.sub, btn.x, btn.y + lw*0.032);
    }
    ctx.restore();
  }

  onTap(x, y) {
    // Back button
    if (x < 60 && y < 64) {
      this._sm.pop();
      return;
    }

    for (const btn of this._buttons) {
      const bx = btn.x - btn.w/2, by = btn.y - btn.h/2;
      if (x >= bx && x <= bx + btn.w && y >= by && y <= by + btn.h) {
        if (btn.disabled) return;
        this._audio?.playSFX?.('sfx_ui_button');
        this._handleButton(btn);
        return;
      }
    }
  }

  _handleButton(btn) {
    if (btn.id.startsWith('iap_')) {
      this._purchase(btn.sub);
    } else if (btn.id.startsWith('coins_')) {
      this._exchangeCoins(btn.cost, btn.reward);
    } else if (btn.id === 'hourglass') {
      this._claimHourglass();
    }
  }

  async _purchase(productId) {
    try {
      if (!window.Capacitor?.isNativePlatform()) {
        // Browser test mode
        this._pm.addGlowstone(60);
        this._showMsg('测试模式：获得60丹青石！');
        return;
      }
      const { InAppPurchase2 } = await import('@capacitor-community/in-app-purchases');
      const order = await InAppPurchase2.purchase({ productId });
      if (this._api) await this._api.submitIAP(order.receipt, productId);
      this._showMsg('购买成功！');
    } catch(e) {
      this._showMsg('购买失败，请重试');
    }
  }

  _exchangeCoins(cost, reward) {
    const g = this._pm.getGlowstone();
    if (g < cost) {
      this._showMsg('丹青石不足');
      return;
    }
    this._pm.addGlowstone(-cost);
    this._pm.addCoins(reward);
    this._showMsg(`获得 ${reward} 沙滩币！`);
  }

  _claimHourglass() {
    const last = this._pm.getHourglassLastClaim();
    if (Date.now() - last < 4 * 3600 * 1000) return;
    const reward = 10 + Math.floor(Math.random() * 11);
    this._pm.addCoins(reward);
    this._pm.setHourglassLastClaim(Date.now());
    this._showMsg(`获得 ${reward} 沙滩币！`);
  }

  _showMsg(text) {
    this._message = text;
    this._messageTimer = 2.5;
  }

  destroy() {}
  onBack() { this._sm.pop(); }
  resize(w, h) {}
}
