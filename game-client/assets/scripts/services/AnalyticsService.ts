/**
 * AnalyticsService – lightweight event analytics for Glow Island.
 *
 * Design goals:
 *  - Zero external SDK dependency at build time; fires events to the backend
 *    analytics endpoint when online, queues locally when offline.
 *  - Platform-safe: works on iOS native (jsb), WebGL, and Node test runner.
 *  - Tree-shaken singleton. No Cocos Component overhead.
 *
 * Required events (P0 launch requirements):
 *   level_start      – when a level session begins
 *   level_complete   – when the player finishes a level successfully
 *   level_abandon    – when the player exits a level mid-session
 *   iap_triggered    – when the shop purchase flow is initiated
 *   iap_completed    – when an IAP transaction succeeds
 *
 * Usage:
 *   import { AnalyticsService } from '../services/AnalyticsService';
 *   AnalyticsService.getInstance().levelStart('level_001');
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AnalyticsEventName =
  | 'level_start'
  | 'level_complete'
  | 'level_abandon'
  | 'iap_triggered'
  | 'iap_completed';

export interface AnalyticsEvent {
  event: AnalyticsEventName;
  /** ISO-8601 timestamp, set at log time */
  ts: string;
  /** Anonymous player UUID – injected after auth */
  player_id: string;
  /** Arbitrary key-value payload */
  params: Record<string, string | number | boolean>;
}

/** Persisted offline queue key */
const LS_QUEUE_KEY = 'glow_analytics_queue';
/** Maximum events to buffer before dropping oldest */
const MAX_QUEUE_SIZE = 200;

// ---------------------------------------------------------------------------
// AnalyticsService singleton
// ---------------------------------------------------------------------------

export class AnalyticsService {
  private static _instance: AnalyticsService | null = null;

  private _playerId = '';
  private _apiBase = '';
  private _queue: AnalyticsEvent[] = [];
  private _flushing = false;

  private constructor() {
    this._loadQueue();
  }

  static getInstance(): AnalyticsService {
    if (!AnalyticsService._instance) {
      AnalyticsService._instance = new AnalyticsService();
    }
    return AnalyticsService._instance;
  }

  // -------------------------------------------------------------------------
  // Configuration
  // -------------------------------------------------------------------------

  /**
   * Call once after ProgressionManager.initAuth() resolves.
   * @param playerId  Anonymous UUID from the backend auth response.
   * @param apiBase   Base URL, e.g. "https://api.glowisland.com/v1"
   */
  configure(playerId: string, apiBase: string): void {
    this._playerId = playerId;
    this._apiBase = apiBase;
    // Attempt to flush any previously queued events now that we have a player id.
    this._flush();
  }

  // -------------------------------------------------------------------------
  // P0 event helpers
  // -------------------------------------------------------------------------

  /** Called when a level session begins. */
  levelStart(levelId: string, chapterId?: number): void {
    this._log('level_start', { level_id: levelId, chapter_id: chapterId ?? 0 });
  }

  /** Called when the player successfully completes a level. */
  levelComplete(
    levelId: string,
    stars: number,
    movesUsed: number,
    continuesUsed: number
  ): void {
    this._log('level_complete', {
      level_id: levelId,
      stars,
      moves_used: movesUsed,
      continues_used: continuesUsed,
    });
  }

  /** Called when the player exits a level mid-session (backs out). */
  levelAbandon(levelId: string, movesUsed: number): void {
    this._log('level_abandon', { level_id: levelId, moves_used: movesUsed });
  }

  /**
   * Called when the in-app-purchase sheet is shown to the player.
   * @param productId  e.g. "com.glowisland.coins_small"
   * @param trigger    What caused the IAP dialog, e.g. "out_of_moves" | "shop_button"
   */
  iapTriggered(productId: string, trigger: string): void {
    this._log('iap_triggered', { product_id: productId, trigger });
  }

  /**
   * Called when the IAP transaction completes successfully.
   * @param productId  e.g. "com.glowisland.coins_medium"
   * @param priceUsd   Numeric price in USD for revenue tracking.
   */
  iapCompleted(productId: string, priceUsd: number): void {
    this._log('iap_completed', { product_id: productId, price_usd: priceUsd });
  }

  // -------------------------------------------------------------------------
  // Internal logging & flush
  // -------------------------------------------------------------------------

  private _log(
    event: AnalyticsEventName,
    params: Record<string, string | number | boolean> = {}
  ): void {
    const entry: AnalyticsEvent = {
      event,
      ts: new Date().toISOString(),
      player_id: this._playerId,
      params,
    };

    // Console trace in debug builds
    if (typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production') {
      console.log(`[Analytics] ${event}`, params);
    }

    this._enqueue(entry);
    this._flush();
  }

  private _enqueue(entry: AnalyticsEvent): void {
    this._queue.push(entry);
    // Evict oldest events if the buffer overflows
    if (this._queue.length > MAX_QUEUE_SIZE) {
      this._queue.splice(0, this._queue.length - MAX_QUEUE_SIZE);
    }
    this._saveQueue();
  }

  private async _flush(): Promise<void> {
    if (this._flushing) return;
    if (!this._apiBase || this._queue.length === 0) return;

    this._flushing = true;
    const batch = this._queue.slice();

    try {
      const res = await fetch(`${this._apiBase}/analytics/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: batch }),
      });

      if (res.ok) {
        // Remove successfully flushed events from the queue
        this._queue.splice(0, batch.length);
        this._saveQueue();
      }
      // Non-2xx: leave events in queue for next flush attempt
    } catch {
      // Network error or jsb environment without fetch – leave in queue
    } finally {
      this._flushing = false;
    }
  }

  // -------------------------------------------------------------------------
  // Local persistence (offline queue)
  // -------------------------------------------------------------------------

  private _saveQueue(): void {
    try {
      localStorage.setItem(LS_QUEUE_KEY, JSON.stringify(this._queue));
    } catch {
      // Storage unavailable – continue in-memory only
    }
  }

  private _loadQueue(): void {
    try {
      const raw = localStorage.getItem(LS_QUEUE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as AnalyticsEvent[];
        if (Array.isArray(parsed)) {
          this._queue = parsed.slice(-MAX_QUEUE_SIZE);
        }
      }
    } catch {
      this._queue = [];
    }
  }
}
