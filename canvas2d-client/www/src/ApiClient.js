import { CONFIG } from './config.js';

export class ApiClient {
  constructor(progressManager) {
    this._pm = progressManager;
  }

  _getToken() { return localStorage.getItem('glow-island-token'); }
  _setToken(t) { localStorage.setItem('glow-island-token', t); }

  async init() {
    if (this._getToken()) return; // already logged in
    try {
      const res = await this._fetch('POST', '/auth/anonymous', {});
      if (res.ok) {
        const data = await res.json();
        this._setToken(data.token);
      }
    } catch (e) {
      console.warn('[ApiClient] init failed silently:', e.message);
    }
  }

  async syncSave() {
    try {
      if (!navigator.onLine) return;
      if (!this._getToken()) await this.init();
      const local = this._pm.load();
      const res = await this._fetch('PUT', '/save', local);
      if (res && res.ok) this._pm.markSynced();
    } catch (e) {
      console.warn('[ApiClient] syncSave failed silently:', e.message);
    }
  }

  async pullSave() {
    try {
      if (!navigator.onLine) return;
      if (!this._getToken()) await this.init();
      const res = await this._fetch('GET', '/save', null);
      if (res && res.ok) {
        const remote = await res.json();
        const local = this._pm.load();
        // Merge: keep whichever lastSaved is newer
        if (remote.lastSaved && (!local.lastSaved || remote.lastSaved > local.lastSaved)) {
          this._pm._data = remote;
          this._pm.save();
        }
      }
    } catch (e) {
      console.warn('[ApiClient] pullSave failed silently:', e.message);
    }
  }

  async submitIAP(receipt, productId) {
    try {
      const res = await this._fetch('POST', '/iap', { receipt, productId });
      if (res && res.ok) {
        const data = await res.json();
        if (data.glowstone) this._pm.addGlowstone(data.glowstone);
      }
    } catch (e) {
      console.warn('[ApiClient] submitIAP failed:', e.message);
    }
  }

  track(eventName, params = {}) {
    // fire-and-forget
    this._fetch('POST', '/analytics', { event: eventName, ...params }).catch(() => {});
  }

  async _fetch(method, path, body) {
    const url = CONFIG.API_BASE + path;
    const token = this._getToken();
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const opts = { method, headers };
    if (body !== null && method !== 'GET') opts.body = JSON.stringify(body);

    // up to 2 retries with exponential backoff
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await fetch(url, opts);
        return res;
      } catch (e) {
        if (attempt === 1) throw e;
        await new Promise(r => setTimeout(r, 200 * (attempt + 1)));
      }
    }
  }
}
