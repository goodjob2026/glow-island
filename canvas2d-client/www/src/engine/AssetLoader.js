// Simple image asset loader

export class AssetLoader {
  constructor() {
    this.cache = new Map();
    this.pending = 0;
    this.onProgress = null;
  }

  load(key, url) {
    if (this.cache.has(key)) return Promise.resolve(this.cache.get(key));
    this.pending++;
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        this.cache.set(key, img);
        this.pending--;
        if (this.onProgress) this.onProgress(key, img);
        resolve(img);
      };
      img.onerror = () => {
        this.pending--;
        resolve(null);
      };
      img.src = url;
    });
  }

  get(key) {
    return this.cache.get(key) || null;
  }

  loadAll(entries) {
    return Promise.all(entries.map(([key, url]) => this.load(key, url)));
  }
}
