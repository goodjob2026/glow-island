// Singleton that owns all persistent game-progress state and cloud sync.

const API_BASE_URL: string =
  (typeof process !== 'undefined' && process.env && process.env.GLOW_API_BASE_URL) ||
  'http://localhost:3000/v1';

const LOCAL_STORAGE_KEY = 'glow_island_progress';
const LS_AUTH_TOKEN = 'glow_auth_token';
const LS_PLAYER_ID = 'glow_player_id';

export interface ChapterProgress {
  completedLevels: number;
  currentLevel: string;
  restorationStage: number; // 0 = untouched, 1-4 restoration stages
}

export interface GameProgress {
  chapterProgress: Record<number, ChapterProgress>;
  materials: Record<string, number>;
  currency: { beachCoins: number; glowstones: number };
  lastUpdatedAt: string;
}

function makeDefaultProgress(): GameProgress {
  const chapterProgress: Record<number, ChapterProgress> = {};
  for (let i = 1; i <= 6; i++) {
    chapterProgress[i] = { completedLevels: 0, currentLevel: '', restorationStage: 0 };
  }
  return {
    chapterProgress,
    materials: {},
    currency: { beachCoins: 0, glowstones: 0 },
    lastUpdatedAt: new Date().toISOString(),
  };
}

export class ProgressionManager {
  private static _instance: ProgressionManager | null = null;

  private _progress: GameProgress = makeDefaultProgress();
  private _syncRetryCount = 0;
  private readonly MAX_RETRY = 3;
  private readonly RETRY_DELAY_MS = 2000;

  private constructor() {}

  static getInstance(): ProgressionManager {
    if (!ProgressionManager._instance) {
      ProgressionManager._instance = new ProgressionManager();
    }
    return ProgressionManager._instance;
  }

  // -----------------------------------------------------------------------
  // Auth
  // -----------------------------------------------------------------------

  /**
   * Authenticate anonymously with the backend using the device ID.
   * Stores the JWT token and player_id in localStorage.
   * Must be called on app init before any cloud sync.
   */
  async initAuth(): Promise<void> {
    try {
      const deviceId = this._getOrCreateDeviceId();
      const platform = this._detectPlatform();

      const res = await fetch(`${API_BASE_URL}/auth/anonymous`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ device_id: deviceId, platform }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = (await res.json()) as {
        token: string;
        player_id: string;
        is_new_player: boolean;
        expires_at: string;
        initial_save?: { beach_coins: number; glowstone: number };
      };

      localStorage.setItem(LS_AUTH_TOKEN, data.token);
      localStorage.setItem(LS_PLAYER_ID, data.player_id);

      // Seed initial currency for brand-new players
      if (data.is_new_player && data.initial_save) {
        this._progress.currency.beachCoins = data.initial_save.beach_coins;
        this._progress.currency.glowstones = data.initial_save.glowstone;
        this.saveLocal();
      }
    } catch (e) {
      console.warn('[ProgressionManager] initAuth failed:', e);
    }
  }

  /** Returns the stored JWT token, or empty string if not authenticated. */
  getAuthToken(): string {
    try {
      return localStorage.getItem(LS_AUTH_TOKEN) ?? '';
    } catch {
      return '';
    }
  }

  /** Returns the stored player_id, or empty string if not authenticated. */
  getPlayerId(): string {
    try {
      return localStorage.getItem(LS_PLAYER_ID) ?? '';
    } catch {
      return '';
    }
  }

  // -----------------------------------------------------------------------
  // Persistence
  // -----------------------------------------------------------------------

  getCurrentProgress(): GameProgress {
    return this._progress;
  }

  saveLocal(): void {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(this._progress));
    } catch (e) {
      console.warn('[ProgressionManager] saveLocal failed:', e);
    }
  }

  loadLocal(): void {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as GameProgress;
        this._progress = this._mergeWithDefaults(parsed);
      }
    } catch (e) {
      console.warn('[ProgressionManager] loadLocal failed, using defaults:', e);
      this._progress = makeDefaultProgress();
    }
  }

  async syncToCloud(): Promise<void> {
    this._progress.lastUpdatedAt = new Date().toISOString();
    await this._putWithRetry(this._progress);
  }

  async loadFromCloud(): Promise<void> {
    const playerId = this.getPlayerId();
    const token = this.getAuthToken();
    if (!playerId || !token) {
      console.warn('[ProgressionManager] loadFromCloud: not authenticated, falling back to localStorage');
      this.loadLocal();
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/save/${playerId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as {
        player_id: string;
        chapter_progress: Record<string, unknown>;
        currency: { beach_coins: number; glowstone: number };
        materials: Record<string, number>;
        updated_at: string;
      };
      // Map server field names to local GameProgress shape
      const mapped: Partial<GameProgress> = {
        materials: data.materials ?? {},
        currency: {
          beachCoins: data.currency?.beach_coins ?? 0,
          glowstones: data.currency?.glowstone ?? 0,
        },
        lastUpdatedAt: data.updated_at ?? new Date().toISOString(),
      };
      if (data.chapter_progress) {
        mapped.chapterProgress = {} as Record<number, ChapterProgress>;
        for (const [key, val] of Object.entries(data.chapter_progress)) {
          const num = Number(key);
          const cp = val as Partial<ChapterProgress>;
          mapped.chapterProgress[num] = {
            completedLevels: (cp as { completedLevels?: number }).completedLevels ?? 0,
            currentLevel: (cp as { currentLevel?: string }).currentLevel ?? '',
            restorationStage: (cp as { restorationStage?: number }).restorationStage ?? 0,
          };
        }
      }
      this._progress = this._mergeWithDefaults(mapped);
      this.saveLocal();
    } catch (e) {
      console.warn('[ProgressionManager] loadFromCloud failed, falling back to localStorage:', e);
      this.loadLocal();
    }
  }

  // -----------------------------------------------------------------------
  // Progress mutations
  // -----------------------------------------------------------------------

  updateChapterProgress(chapterId: number, levelId: string): void {
    const cp = this._ensureChapter(chapterId);
    cp.completedLevels += 1;
    cp.currentLevel = levelId;
    this._progress.lastUpdatedAt = new Date().toISOString();
    this.saveLocal();
  }

  /**
   * Add currency amounts (beach coins and/or glowstones) to the current progress.
   * Called after IAP verification or reward grants.
   */
  addCurrency(beachCoins: number = 0, glowstones: number = 0): void {
    this._progress.currency.beachCoins += beachCoins;
    this._progress.currency.glowstones += glowstones;
    this._progress.lastUpdatedAt = new Date().toISOString();
    this.saveLocal();
  }

  addMaterials(materials: Record<string, number>): void {
    for (const [key, amount] of Object.entries(materials)) {
      this._progress.materials[key] = (this._progress.materials[key] ?? 0) + amount;
    }
    this._progress.lastUpdatedAt = new Date().toISOString();
    this.saveLocal();
  }

  /**
   * Advance a chapter's restoration stage by 1 (max 4).
   * Returns the new stage, or the existing stage if already at max.
   */
  advanceRestorationStage(chapterId: number): number {
    const cp = this._ensureChapter(chapterId);
    if (cp.restorationStage < 4) {
      cp.restorationStage += 1;
      this._progress.lastUpdatedAt = new Date().toISOString();
      this.saveLocal();
    }
    return cp.restorationStage;
  }

  canRepairChapter(chapterId: number, recipe: Record<string, number>): boolean {
    for (const [material, required] of Object.entries(recipe)) {
      if ((this._progress.materials[material] ?? 0) < required) return false;
    }
    return true;
  }

  consumeMaterials(recipe: Record<string, number>): void {
    for (const [material, amount] of Object.entries(recipe)) {
      const current = this._progress.materials[material] ?? 0;
      if (current < amount) {
        throw new Error(`[ProgressionManager] Insufficient material: ${material} (have ${current}, need ${amount})`);
      }
      this._progress.materials[material] = current - amount;
    }
    this._progress.lastUpdatedAt = new Date().toISOString();
    this.saveLocal();
  }

  // -----------------------------------------------------------------------
  // Private helpers
  // -----------------------------------------------------------------------

  private _ensureChapter(chapterId: number): ChapterProgress {
    if (!this._progress.chapterProgress[chapterId]) {
      this._progress.chapterProgress[chapterId] = {
        completedLevels: 0,
        currentLevel: '',
        restorationStage: 0,
      };
    }
    return this._progress.chapterProgress[chapterId];
  }

  private _mergeWithDefaults(incoming: Partial<GameProgress>): GameProgress {
    const defaults = makeDefaultProgress();
    const merged: GameProgress = {
      chapterProgress: { ...defaults.chapterProgress },
      materials: { ...(incoming.materials ?? {}) },
      currency: { ...defaults.currency, ...(incoming.currency ?? {}) },
      lastUpdatedAt: incoming.lastUpdatedAt ?? defaults.lastUpdatedAt,
    };
    if (incoming.chapterProgress) {
      for (const [key, val] of Object.entries(incoming.chapterProgress)) {
        merged.chapterProgress[Number(key)] = { ...defaults.chapterProgress[Number(key)], ...val };
      }
    }
    return merged;
  }

  private async _putWithRetry(body: GameProgress, attempt = 0): Promise<void> {
    const playerId = this.getPlayerId();
    const token = this.getAuthToken();
    if (!playerId || !token) {
      console.warn('[ProgressionManager] _putWithRetry: not authenticated, skipping cloud sync');
      return;
    }
    // Map local GameProgress field names to backend API contract field names
    const apiBody: Record<string, unknown> = {
      client_updated_at: body.lastUpdatedAt,
      currency: {
        beach_coins: body.currency.beachCoins,
        glowstone: body.currency.glowstones,
      },
      materials: body.materials,
      chapter_progress: body.chapterProgress,
    };
    try {
      const res = await fetch(`${API_BASE_URL}/save/${playerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(apiBody),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      this._syncRetryCount = 0;
    } catch (e) {
      if (attempt < this.MAX_RETRY) {
        console.warn(`[ProgressionManager] syncToCloud attempt ${attempt + 1} failed, retrying in ${this.RETRY_DELAY_MS}ms:`, e);
        await new Promise<void>(resolve => setTimeout(resolve, this.RETRY_DELAY_MS));
        return this._putWithRetry(body, attempt + 1);
      }
      console.error('[ProgressionManager] syncToCloud failed after max retries:', e);
    }
  }

  // -----------------------------------------------------------------------
  // Device / platform helpers
  // -----------------------------------------------------------------------

  private _getOrCreateDeviceId(): string {
    try {
      let id = localStorage.getItem('glow_device_id');
      if (!id) {
        // Generate a UUID-like random identifier
        id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
          const r = (Math.random() * 16) | 0;
          const v = c === 'x' ? r : (r & 0x3) | 0x8;
          return v.toString(16);
        });
        localStorage.setItem('glow_device_id', id);
      }
      return id;
    } catch {
      return `tmp_${Date.now()}`;
    }
  }

  private _detectPlatform(): 'ios' | 'android' | 'taptap' {
    if (typeof navigator !== 'undefined') {
      const ua = navigator.userAgent || '';
      if (/iPhone|iPad|iPod/.test(ua)) return 'ios';
      if (/Android/.test(ua)) return 'android';
    }
    return 'taptap';
  }
}
