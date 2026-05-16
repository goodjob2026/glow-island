// DialogScene — typewriter-style dialog overlay with diary fragment support
//
// Usage (via SceneManager.push):
//   sceneManager.push(DialogScene, {
//     dialogKey: 'ch1_intro',
//     onComplete: () => { /* called after last line */ }
//   });
//
// Scene interface: constructor(sceneManager, renderer, assets, audio, progress)

import { DIALOGS } from '../data/dialog-data.js';

const CHAR_INTERVAL  = 0.05;  // seconds per character
const DIARY_HOLD     = 3.0;   // seconds to display a diary fragment before auto-advance

export class DialogScene {
  constructor(sceneManager, renderer, assets, audio, progress) {
    this._sm    = sceneManager;
    this._r     = renderer;
    this._audio = audio;
    this._pm    = progress;

    this._lines      = [];
    this._lineIndex  = 0;
    this._charIndex  = 0;
    this._typing     = false;
    this._onComplete = null;
    this._typeTimer  = 0;

    // Diary fragment state
    this._showDiary  = false;
    this._diaryTimer = 0;
    this._diaryText  = '';
  }

  // ── Scene lifecycle ─────────────────────────────────────────────────────────

  init({ dialogKey = '', onComplete = null } = {}) {
    this._lines      = DIALOGS[dialogKey] || [];
    this._lineIndex  = 0;
    this._charIndex  = 0;
    this._typing     = true;
    this._typeTimer  = 0;
    this._onComplete = onComplete;
    this._showDiary  = false;
    this._diaryTimer = 0;
    this._diaryText  = '';

    // If first line is a diary entry, start in diary mode immediately
    this._checkDiaryLine();
  }

  update(dt) {
    if (this._showDiary) {
      this._diaryTimer += dt;
      if (this._diaryTimer >= DIARY_HOLD) {
        this._showDiary  = false;
        this._diaryTimer = 0;
        this._lineIndex++;
        this._checkDiaryLine();
        this._startNextLine();
      }
      return;
    }

    if (!this._typing) return;

    const line = this._lines[this._lineIndex];
    if (!line) return;

    const text = line.text || '';
    this._typeTimer += dt;
    while (this._typeTimer >= CHAR_INTERVAL && this._charIndex < text.length) {
      this._charIndex++;
      this._typeTimer -= CHAR_INTERVAL;
    }
    if (this._charIndex >= text.length) {
      this._typing = false;
    }
  }

  draw() {
    const { ctx, lw, lh } = this._r;

    const boxH = Math.round(lh * 0.33);
    const boxY = lh - boxH - 20;
    const boxX = 16;
    const boxW = lw - 32;
    const pad  = 20;

    ctx.save();

    // Dialog box background
    ctx.fillStyle = 'rgba(0,0,0,0.78)';
    this._roundRect(ctx, boxX, boxY, boxW, boxH, 14);
    ctx.fill();

    // Subtle top border accent
    ctx.strokeStyle = 'rgba(255,229,102,0.35)';
    ctx.lineWidth = 1.5;
    this._roundRect(ctx, boxX, boxY, boxW, boxH, 14);
    ctx.stroke();

    if (this._showDiary) {
      this._drawDiary(ctx, lw, lh, boxX, boxY, boxW, boxH, pad);
    } else {
      this._drawDialog(ctx, lw, lh, boxX, boxY, boxW, boxH, pad);
    }

    ctx.restore();
  }

  onTap(x, y) {
    if (this._showDiary) {
      // Allow tapping to skip the diary hold timer
      this._showDiary  = false;
      this._diaryTimer = 0;
      this._lineIndex++;
      this._checkDiaryLine();
      this._startNextLine();
      return;
    }

    const line = this._lines[this._lineIndex];
    if (!line) return;

    if (this._typing) {
      // Skip typewriter — reveal full text immediately
      this._charIndex = (line.text || '').length;
      this._typing    = false;
    } else {
      this._advance();
    }
  }

  destroy() {}
  onBack() {}
  resize(w, h) {}

  // ── Drawing helpers ─────────────────────────────────────────────────────────

  _drawDiary(ctx, lw, lh, boxX, boxY, boxW, boxH, pad) {
    // Warm parchment tint overlay inside box
    ctx.fillStyle = 'rgba(160,120,60,0.18)';
    this._roundRect(ctx, boxX, boxY, boxW, boxH, 14);
    ctx.fill();

    // Decorative top rule
    ctx.strokeStyle = 'rgba(245,230,200,0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(boxX + pad, boxY + 44);
    ctx.lineTo(boxX + boxW - pad, boxY + 44);
    ctx.stroke();

    // "日记" label
    ctx.fillStyle = '#D4A857';
    ctx.font      = `bold ${Math.round(lw * 0.035)}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('— 日记 —', lw / 2, boxY + 14);

    // Diary text (wrapped, italic)
    ctx.fillStyle = '#F5E6C8';
    ctx.font      = `italic ${Math.round(lw * 0.042)}px serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    this._wrapText(ctx, this._diaryText, boxX + pad, boxY + 56, boxW - pad * 2, Math.round(lw * 0.055));

    // Auto-progress hint (fade in after 1.5 s)
    if (this._diaryTimer > 1.5) {
      const alpha = Math.min(1, (this._diaryTimer - 1.5) / 0.5);
      ctx.globalAlpha = alpha * 0.6;
      ctx.fillStyle   = '#F5E6C8';
      ctx.font        = `${Math.round(lw * 0.03)}px sans-serif`;
      ctx.textAlign   = 'right';
      ctx.textBaseline = 'bottom';
      ctx.fillText('点击跳过', boxX + boxW - pad, boxY + boxH - 10);
      ctx.globalAlpha = 1;
    }
  }

  _drawDialog(ctx, lw, lh, boxX, boxY, boxW, boxH, pad) {
    const line = this._lines[this._lineIndex];
    if (!line) return;

    // Speaker name badge
    if (line.speaker) {
      const nameSize = Math.round(lw * 0.042);
      ctx.font      = `bold ${nameSize}px sans-serif`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';

      // Measure for background badge
      const nameW = ctx.measureText(line.speaker).width;
      const badgePad = 8;
      const badgeH   = nameSize + badgePad * 2;
      const badgeY   = boxY - badgeH + 2;

      ctx.fillStyle = 'rgba(0,0,0,0.72)';
      this._roundRect(ctx, boxX + pad - badgePad, badgeY, nameW + badgePad * 2, badgeH, 6);
      ctx.fill();

      ctx.fillStyle = '#FFE566';
      ctx.fillText(line.speaker, boxX + pad, badgeY + badgePad);
    }

    // Typewriter text
    const visibleText = (line.text || '').slice(0, this._charIndex);
    const fontSize    = Math.round(lw * 0.042);
    ctx.fillStyle    = '#FFFFFF';
    ctx.font         = `${fontSize}px sans-serif`;
    ctx.textAlign    = 'left';
    ctx.textBaseline = 'top';
    this._wrapText(ctx, visibleText, boxX + pad, boxY + pad + 4, boxW - pad * 2, Math.round(fontSize * 1.45));

    // "Next" arrow — pulsing, shown only when typewriter is done
    if (!this._typing) {
      const pulse = 0.65 + 0.35 * Math.sin(Date.now() / 280);
      ctx.globalAlpha  = pulse;
      ctx.fillStyle    = '#FFE566';
      ctx.font         = `${Math.round(lw * 0.034)}px sans-serif`;
      ctx.textAlign    = 'right';
      ctx.textBaseline = 'bottom';
      ctx.fillText('▶ 点击继续', boxX + boxW - pad, boxY + boxH - 10);
      ctx.globalAlpha = 1;
    }
  }

  // ── Internal state machine ──────────────────────────────────────────────────

  /** Check if the current line index points to a diary entry and enter diary mode. */
  _checkDiaryLine() {
    const line = this._lines[this._lineIndex];
    if (line && line.diary) {
      this._showDiary  = true;
      this._diaryTimer = 0;
      this._diaryText  = line.diary;
      this._typing     = false;

      // Persist diary fragment to ProgressManager
      if (this._pm) {
        this._pm._data = this._pm._data || {};
        this._pm._data.diaries = this._pm._data.diaries || {};
        // Derive chapter key from dialog line (e.g. ch3_outro → ch3)
        // Use a simple sequential diary index keyed by content hash fallback
        const idx = this._lineIndex;
        const chKey = `diary_${idx}`;
        this._pm._data.diaries[chKey] = line.diary;
        if (typeof this._pm.save === 'function') this._pm.save();
      }
    }
  }

  _startNextLine() {
    if (this._lineIndex >= this._lines.length) {
      // All lines consumed — notify caller
      if (this._onComplete) this._onComplete();
      return;
    }
    const line = this._lines[this._lineIndex];
    // Diary lines are handled by _checkDiaryLine; skip re-entering typing mode for them
    if (line && !line.diary) {
      this._charIndex = 0;
      this._typing    = true;
      this._typeTimer = 0;
    }
  }

  _advance() {
    this._lineIndex++;
    this._checkDiaryLine();
    if (this._showDiary) {
      // Diary mode started — update() / draw() will handle it
      return;
    }
    if (this._lineIndex >= this._lines.length) {
      if (this._onComplete) this._onComplete();
      return;
    }
    this._charIndex = 0;
    this._typing    = true;
    this._typeTimer = 0;
  }

  // ── Canvas utilities ────────────────────────────────────────────────────────

  /**
   * Wrap CJK + Latin text by character width within maxWidth.
   * Each character is measured individually — accurate for mixed scripts.
   */
  _wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    let line    = '';
    let currentY = y;
    for (const char of text) {
      const testLine = line + char;
      if (ctx.measureText(testLine).width > maxWidth && line.length > 0) {
        ctx.fillText(line, x, currentY);
        currentY += lineHeight;
        line = char;
      } else {
        line = testLine;
      }
    }
    if (line) ctx.fillText(line, x, currentY);
  }

  _roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
}
