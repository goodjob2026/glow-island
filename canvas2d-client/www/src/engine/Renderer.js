// Canvas2D renderer — stateless draw calls

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = canvas.width;
    this.height = canvas.height;
    this.dpr = 1;
    this.lw = canvas.width;
    this.lh = canvas.height;
  }

  resize(w, h, dpr = 1) {
    this.canvas.width = w;
    this.canvas.height = h;
    this.width = w;
    this.height = h;
    this.dpr = dpr;
    // Scale ctx so draw calls use logical (CSS) pixels
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // Expose logical dimensions for scene layout
    this.lw = Math.round(w / dpr);
    this.lh = Math.round(h / dpr);
  }

  clear(color = '#1a1a2e') {
    this.ctx.fillStyle = color;
    // Use logical dimensions — ctx has dpr scale applied via setTransform
    this.ctx.fillRect(0, 0, this.lw, this.lh);
  }

  roundRect(x, y, w, h, r, fill, stroke, lineWidth = 2) {
    const ctx = this.ctx;
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
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lineWidth; ctx.stroke(); }
  }

  image(img, x, y, w, h) {
    if (img?.complete && img.naturalWidth > 0) {
      this.ctx.drawImage(img, x, y, w, h);
    }
  }

  text(str, x, y, opts = {}) {
    const ctx = this.ctx;
    ctx.font = `${opts.weight || ''} ${opts.size || 16}px ${opts.font || 'system-ui, sans-serif'}`;
    ctx.fillStyle = opts.color || '#ffffff';
    ctx.textAlign = opts.align || 'left';
    ctx.textBaseline = opts.baseline || 'top';
    if (opts.shadow) {
      ctx.shadowColor = opts.shadow;
      ctx.shadowBlur = opts.shadowBlur || 4;
    }
    ctx.fillText(str, x, y);
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
  }

  circle(x, y, r, fill, stroke, lineWidth = 2) {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lineWidth; ctx.stroke(); }
  }

  alpha(a, fn) {
    this.ctx.globalAlpha = a;
    fn();
    this.ctx.globalAlpha = 1;
  }
}
