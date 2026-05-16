// ProgressManager — persistent save data via localStorage
// Key: 'glow-island-save'

const STORAGE_KEY = 'glow-island-save';

export class ProgressManager {
  constructor() {
    this._data = null;
  }

  // ── Persistence ──────────────────────────────────────────────────────────

  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        this._data = Object.assign(this._defaultData(), JSON.parse(raw));
      } else {
        this._data = this._defaultData();
      }
    } catch (_) {
      this._data = this._defaultData();
    }
    return this;
  }

  save() {
    if (!this._data) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this._data));
    } catch (_) {
      // quota exceeded or private-browsing — silently skip
    }
  }

  // ── Default shape ─────────────────────────────────────────────────────────

  _defaultData() {
    return {
      coins: 200,
      glowstone: 0,
      hourglassLastClaim: 0,
      zenBestCombo: 0,
      lastSynced: null,
      stars: {},          // key: "${chapter}-${level}", value: 0-3
      maxChapter: 1,
      maxLevel: 1,
    };
  }

  // ── Level unlock ──────────────────────────────────────────────────────────

  getMaxUnlocked() {
    this._ensure();
    return { chapter: this._data.maxChapter, level: this._data.maxLevel };
  }

  isLevelUnlocked(ch, lv) {
    this._ensure();
    if (ch < this._data.maxChapter) return true;
    if (ch === this._data.maxChapter && lv <= this._data.maxLevel) return true;
    return false;
  }

  /** Unlock the next level after (ch, lv). Call after a level is beaten. */
  unlockNext(ch, lv) {
    this._ensure();
    // Simple: just store the max reached
    const currentMax = this._data.maxChapter * 10000 + this._data.maxLevel;
    const nextMax = ch * 10000 + (lv + 1);
    if (nextMax > currentMax) {
      this._data.maxChapter = ch;
      this._data.maxLevel = lv + 1;
    }
    this.save();
  }

  // ── Stars ─────────────────────────────────────────────────────────────────

  setStars(ch, lv, n) {
    this._ensure();
    const key = `${ch}-${lv}`;
    const current = this._data.stars[key] || 0;
    if (n > current) {
      this._data.stars[key] = Math.min(3, Math.max(0, n));
      this.save();
    }
  }

  getStars(ch, lv) {
    this._ensure();
    return this._data.stars[`${ch}-${lv}`] || 0;
  }

  getChapterClearedCount(chapter) {
    this._ensure();
    const prefix = `${chapter}-`;
    let count = 0;
    for (const key of Object.keys(this._data.stars)) {
      if (key.startsWith(prefix) && this._data.stars[key] > 0) {
        count++;
      }
    }
    return count;
  }

  // ── Currency ──────────────────────────────────────────────────────────────

  addCoins(n) {
    this._ensure();
    this._data.coins = Math.max(0, (this._data.coins || 0) + n);
    this.save();
  }

  getCoins() {
    this._ensure();
    return this._data.coins || 0;
  }

  addGlowstone(n) {
    this._ensure();
    this._data.glowstone = Math.max(0, (this._data.glowstone || 0) + n);
    this.save();
  }

  getGlowstone() {
    this._ensure();
    return this._data.glowstone || 0;
  }

  // ── Hourglass ─────────────────────────────────────────────────────────────

  getHourglassLastClaim() {
    this._ensure();
    return this._data.hourglassLastClaim || 0;
  }

  setHourglassLastClaim(ts) {
    this._ensure();
    this._data.hourglassLastClaim = ts;
    this.save();
  }

  // ── Zen mode ──────────────────────────────────────────────────────────────

  updateZenBestCombo(n) {
    this._ensure();
    if (n > (this._data.zenBestCombo || 0)) {
      this._data.zenBestCombo = n;
      this.save();
    }
  }

  getZenBestCombo() {
    this._ensure();
    return this._data.zenBestCombo || 0;
  }

  // ── Sync ──────────────────────────────────────────────────────────────────

  markSynced() {
    this._ensure();
    this._data.lastSynced = Date.now();
    this.save();
  }

  getLastSynced() {
    this._ensure();
    return this._data.lastSynced;
  }

  // ── Internal ──────────────────────────────────────────────────────────────

  _ensure() {
    if (!this._data) this.load();
  }
}
