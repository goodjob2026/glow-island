/**
 * RatingService – in-app rating prompt for Glow Island (P0 launch requirement).
 *
 * Platform behaviour:
 *   iOS (native):  Calls SKStoreReviewRequest.requestReview() via the Cocos
 *                  Creator JSB bridge.  Apple rate-limits this to ≤3 times/year
 *                  per app version – always safe to call; iOS silently drops
 *                  excess requests.
 *   Android native: Calls Google Play In-App Review API via the bridge.
 *   WebGL / browser: No-op (review prompts are not applicable).
 *
 * Trigger policy (as per design spec):
 *   - Show the prompt after the player completes their 5th level for the
 *     first time only.
 *   - Never show more than once per app session.
 *   - Never show if the player has already been prompted (persisted flag).
 *
 * Usage:
 *   import { RatingService } from '../services/RatingService';
 *   // In LevelCompletePopup.show() or GameScene after level completion:
 *   RatingService.getInstance().onLevelCompleted(totalCompletedLevels);
 *
 * Native bridge contract (implement in Objective-C / Swift AppController):
 *   Command: "request_store_review"
 *   Data:    "" (empty string)
 *   iOS implementation:
 *     if (@available(iOS 14.0, *)) {
 *       UIWindowScene *scene = ...;
 *       [SKStoreReviewController requestReviewInScene:scene];
 *     }
 */

const LS_RATING_PROMPTED = 'glow_rating_prompted';
/** Level threshold at which the rating prompt fires for the first time. */
const PROMPT_LEVEL_THRESHOLD = 5;

// ---------------------------------------------------------------------------
// RatingService singleton
// ---------------------------------------------------------------------------

export class RatingService {
  private static _instance: RatingService | null = null;

  /** True if we've already shown the prompt in the current app session. */
  private _shownThisSession = false;

  private constructor() {}

  static getInstance(): RatingService {
    if (!RatingService._instance) {
      RatingService._instance = new RatingService();
    }
    return RatingService._instance;
  }

  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------

  /**
   * Call this every time a level completes successfully.
   *
   * @param totalCompletedLevels  Cumulative count of levels completed by the
   *                               player across all chapters (1-indexed).
   */
  onLevelCompleted(totalCompletedLevels: number): void {
    if (totalCompletedLevels < PROMPT_LEVEL_THRESHOLD) return;
    if (this._shownThisSession) return;
    if (this._hasBeenPromptedBefore()) return;

    // Only trigger exactly at the threshold to avoid repeated calls
    if (totalCompletedLevels === PROMPT_LEVEL_THRESHOLD) {
      this._requestReview();
    }
  }

  /**
   * Force a review request (e.g. if the player taps "Rate us" in Settings).
   * Ignores the "already prompted" flag.
   */
  requestReviewManually(): void {
    if (this._shownThisSession) return;
    this._requestReview();
  }

  // -------------------------------------------------------------------------
  // Internal helpers
  // -------------------------------------------------------------------------

  private _requestReview(): void {
    this._shownThisSession = true;
    this._markPrompted();

    const bridge = this._getNativeBridge();
    const isNative = this._isNative();

    if (isNative && bridge) {
      // iOS: SKStoreReviewRequest.requestReview()
      // Android: Google Play In-App Review API
      try {
        bridge.sendToNative?.('request_store_review', '');
        console.log('[RatingService] Native review request sent');
      } catch (e) {
        console.warn('[RatingService] Native bridge call failed:', e);
      }
    } else {
      // WebGL / development: log only, no prompt
      console.log('[RatingService] WebGL environment – review prompt skipped');
    }
  }

  private _hasBeenPromptedBefore(): boolean {
    try {
      return localStorage.getItem(LS_RATING_PROMPTED) === '1';
    } catch {
      return false;
    }
  }

  private _markPrompted(): void {
    try {
      localStorage.setItem(LS_RATING_PROMPTED, '1');
    } catch {
      // Storage unavailable – in-memory _shownThisSession still guards this session
    }
  }

  private _isNative(): boolean {
    try {
      const cc = (globalThis as Record<string, unknown>)['cc'] as {
        sys?: { isNative?: boolean };
      } | undefined;
      return cc?.sys?.isNative === true;
    } catch {
      return false;
    }
  }

  private _getNativeBridge(): { sendToNative?: (cmd: string, data: string) => void } | null {
    try {
      const cc = (globalThis as Record<string, unknown>)['cc'] as {
        native?: { bridge?: { sendToNative?: (cmd: string, data: string) => void } };
      } | undefined;
      return cc?.native?.bridge ?? null;
    } catch {
      return null;
    }
  }
}
