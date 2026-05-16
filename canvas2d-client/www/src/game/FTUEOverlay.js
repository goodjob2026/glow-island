export class FTUEOverlay {
  constructor(renderer) {
    // renderer = {ctx, lw:390, lh:844}
    this._r = renderer;

    this._hintActive = false;
    this._hintCells = null; // {r1,c1,r2,c2,cellSize,offsetX,offsetY}

    this._textActive = false;
    this._textMsg = '';
    this._textPosition = 'top';
    this._textTimer = 0;

    this._arrowActive = false;
    this._arrowX = 0;
    this._arrowY = 0;
    this._arrowDirection = 'right';

    this._pulseTime = 0;
  }

  // Show pulse-highlight around a pair of tiles for FTUE guidance
  // cellSize, offsetX, offsetY come from GameplayScene._cell
  showHint(r1, c1, r2, c2, cellSize, offsetX, offsetY) {
    this._hintActive = true;
    this._hintCells = { r1, c1, r2, c2, cellSize, offsetX, offsetY };
  }

  // Show floating text message: position = 'top' | 'bottom', auto-hides after 2s
  showText(msg, position) {
    this._textActive = true;
    this._textMsg = msg;
    this._textPosition = (position === 'bottom') ? 'bottom' : 'top';
    this._textTimer = 2.0;
  }

  // Show directional arrow at (x,y): direction = 'right'|'left'|'up'|'down'
  showArrow(x, y, direction) {
    this._arrowActive = true;
    this._arrowX = x;
    this._arrowY = y;
    this._arrowDirection = direction;
  }

  // Hide all FTUE elements immediately
  hide() {
    this._hintActive = false;
    this._hintCells = null;
    this._textActive = false;
    this._textMsg = '';
    this._textTimer = 0;
    this._arrowActive = false;
  }

  update(dt) {
    // Advance pulse animation
    this._pulseTime += dt;

    // Advance text timer and auto-hide when expired
    if (this._textActive && this._textTimer > 0) {
      this._textTimer -= dt;
      if (this._textTimer <= 0) {
        this._textTimer = 0;
        this._textActive = false;
      }
    }
  }

  draw() {
    const ctx = this._r.ctx;
    ctx.save();

    this._drawHint(ctx);
    this._drawText(ctx);
    this._drawArrow(ctx);

    ctx.restore();
  }

  _drawHint(ctx) {
    if (!this._hintActive || !this._hintCells) return;

    const { r1, c1, r2, c2, cellSize, offsetX, offsetY } = this._hintCells;

    // Pulse alpha: sin oscillates -1..1, remap to 0.4..1.0
    const sinVal = Math.sin(this._pulseTime * 4); // 0.4 to 1.0
    const alpha = 0.4 + (sinVal + 1) * 0.5 * 0.6; // 0.4 + (0..1)*0.6

    ctx.save();
    ctx.strokeStyle = `rgba(0, 230, 118, ${alpha})`;
    ctx.lineWidth = 3;
    ctx.lineJoin = 'round';

    const cells = [
      { r: r1, c: c1 },
      { r: r2, c: c2 },
    ];

    for (const cell of cells) {
      const x = offsetX + cell.c * cellSize;
      const y = offsetY + cell.r * cellSize;
      ctx.strokeRect(x + 2, y + 2, cellSize - 4, cellSize - 4);
    }

    ctx.restore();
  }

  _drawText(ctx) {
    if (!this._textActive || !this._textMsg) return;

    const lw = this._r.lw;
    const lh = this._r.lh;

    const fontSize = 16;
    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const msg = this._textMsg;
    const textWidth = ctx.measureText(msg).width;
    const paddingH = 20;
    const paddingV = 12;
    const pillW = textWidth + paddingH * 2;
    const pillH = fontSize + paddingV * 2;
    const pillX = lw / 2 - pillW / 2;
    const textY = this._textPosition === 'bottom' ? lh - 100 : 120;
    const pillY = textY - pillH / 2;
    const radius = pillH / 2;

    // Draw pill background
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.beginPath();
    ctx.moveTo(pillX + radius, pillY);
    ctx.lineTo(pillX + pillW - radius, pillY);
    ctx.arcTo(pillX + pillW, pillY, pillX + pillW, pillY + radius, radius);
    ctx.lineTo(pillX + pillW, pillY + pillH - radius);
    ctx.arcTo(pillX + pillW, pillY + pillH, pillX + pillW - radius, pillY + pillH, radius);
    ctx.lineTo(pillX + radius, pillY + pillH);
    ctx.arcTo(pillX, pillY + pillH, pillX, pillY + pillH - radius, radius);
    ctx.lineTo(pillX, pillY + radius);
    ctx.arcTo(pillX, pillY, pillX + radius, pillY, radius);
    ctx.closePath();
    ctx.fill();

    // Draw text
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(msg, lw / 2, textY);
    ctx.restore();
  }

  _drawArrow(ctx) {
    if (!this._arrowActive) return;

    const x = this._arrowX;
    const y = this._arrowY;
    const dir = this._arrowDirection;
    const size = 24;

    ctx.save();
    ctx.fillStyle = '#FFE566';
    ctx.beginPath();

    switch (dir) {
      case 'right':
        // Triangle pointing right
        ctx.moveTo(x + size, y);
        ctx.lineTo(x - size / 2, y - size / 2);
        ctx.lineTo(x - size / 2, y + size / 2);
        break;
      case 'left':
        // Triangle pointing left
        ctx.moveTo(x - size, y);
        ctx.lineTo(x + size / 2, y - size / 2);
        ctx.lineTo(x + size / 2, y + size / 2);
        break;
      case 'up':
        // Triangle pointing up
        ctx.moveTo(x, y - size);
        ctx.lineTo(x - size / 2, y + size / 2);
        ctx.lineTo(x + size / 2, y + size / 2);
        break;
      case 'down':
        // Triangle pointing down
        ctx.moveTo(x, y + size);
        ctx.lineTo(x - size / 2, y - size / 2);
        ctx.lineTo(x + size / 2, y - size / 2);
        break;
      default:
        ctx.restore();
        return;
    }

    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // Whether FTUE should be shown for this chapter/level
  static shouldShowFTUE(chapter, level, progress) {
    if (progress?._data?.ftueCompleted) return false;
    return chapter === 1 && level <= 3;
  }
}
