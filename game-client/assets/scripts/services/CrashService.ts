/**
 * CrashService – stability monitoring for Glow Island (P0 launch requirement).
 *
 * Architecture:
 *  - Wraps Firebase Crashlytics via the Cocos Creator JSB native bridge on iOS.
 *  - On WebGL / browser, falls back to a lightweight window.onerror handler
 *    that POSTs crash reports to the backend `/analytics/crashes` endpoint.
 *  - Gracefully no-ops when neither bridge nor network is available.
 *
 * Firebase Crashlytics iOS integration notes:
 *  1. Add the Firebase iOS SDK (via CocoaPods) to `game-client/ios/`:
 *       pod 'Firebase/Crashlytics'
 *       pod 'Firebase/Analytics'
 *  2. Add GoogleService-Info.plist to the Xcode project root.
 *  3. In AppDelegate.m / AppController.mm, call [FIRApp configure] before
 *     [super application:didFinishLaunchingWithOptions:].
 *  4. Crashlytics auto-captures uncaught Obj-C / Swift exceptions.
 *  5. For JS-side custom logs, this service calls the native bridge below.
 *
 * Usage:
 *   import { CrashService } from '../services/CrashService';
 *   CrashService.getInstance().init(playerId, apiBase);
 *   CrashService.getInstance().setUserId(playerId);
 *   CrashService.getInstance().log('GameScene loaded');
 *   CrashService.getInstance().recordError('NullTile', 'tile at (2,3) was null');
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CrashReport {
  /** Short error class, e.g. "UnhandledPromiseRejection" */
  error_type: string;
  /** Human-readable message */
  message: string;
  /** Stack trace string, if available */
  stack?: string;
  /** ISO timestamp */
  ts: string;
  /** Anonymous player UUID */
  player_id: string;
  /** Arbitrary context key-value pairs */
  context: Record<string, string | number>;
}

// ---------------------------------------------------------------------------
// CrashService singleton
// ---------------------------------------------------------------------------

export class CrashService {
  private static _instance: CrashService | null = null;

  private _playerId = '';
  private _apiBase = '';
  private _initialized = false;

  private constructor() {}

  static getInstance(): CrashService {
    if (!CrashService._instance) {
      CrashService._instance = new CrashService();
    }
    return CrashService._instance;
  }

  // -------------------------------------------------------------------------
  // Initialization
  // -------------------------------------------------------------------------

  /**
   * Initialize crash monitoring.  Call once at app start, after auth resolves.
   *
   * @param playerId  Anonymous UUID for Crashlytics user identifier.
   * @param apiBase   Backend base URL for WebGL fallback reporting.
   */
  init(playerId: string, apiBase: string): void {
    if (this._initialized) return;
    this._playerId = playerId;
    this._apiBase = apiBase;
    this._initialized = true;

    this._setNativeUserId(playerId);
    this._installWebGLFallback();
  }

  /** Update the user identifier (call again after login/account-link). */
  setUserId(playerId: string): void {
    this._playerId = playerId;
    this._setNativeUserId(playerId);
  }

  // -------------------------------------------------------------------------
  // Manual logging helpers
  // -------------------------------------------------------------------------

  /**
   * Write a breadcrumb log to Crashlytics (iOS) or the in-memory buffer (WebGL).
   * Breadcrumbs appear in the Crashlytics dashboard next to crash reports.
   */
  log(message: string): void {
    // iOS native bridge
    const bridge = this._getNativeBridge();
    if (bridge) {
      try {
        bridge.sendToNative?.('crashlytics_log', message);
      } catch {
        // ignore
      }
      return;
    }
    // WebGL / development: console trace only
    console.debug(`[CrashService] ${message}`);
  }

  /**
   * Record a non-fatal error event.
   * On iOS this maps to recordError() in Crashlytics.
   * On WebGL it POSTs to the backend crash endpoint.
   *
   * @param errorType  Short classifier, e.g. "NetworkTimeout"
   * @param message    Full message
   * @param stack      Optional stack trace
   */
  recordError(
    errorType: string,
    message: string,
    stack?: string,
    context: Record<string, string | number> = {}
  ): void {
    const report: CrashReport = {
      error_type: errorType,
      message,
      stack,
      ts: new Date().toISOString(),
      player_id: this._playerId,
      context,
    };

    console.warn(`[CrashService] Non-fatal: ${errorType}: ${message}`);

    // iOS: forward to native Crashlytics
    const bridge = this._getNativeBridge();
    if (bridge) {
      try {
        bridge.sendToNative?.('crashlytics_record_error', JSON.stringify(report));
      } catch {
        // ignore – Crashlytics auto-captures crashes anyway
      }
      return;
    }

    // WebGL / browser: report to backend
    this._postReport(report).catch(() => {
      // Fire-and-forget – never let crash reporting itself cause a crash
    });
  }

  // -------------------------------------------------------------------------
  // Native bridge helpers
  // -------------------------------------------------------------------------

  private _setNativeUserId(playerId: string): void {
    const bridge = this._getNativeBridge();
    if (bridge) {
      try {
        bridge.sendToNative?.('crashlytics_set_user_id', playerId);
      } catch {
        // ignore
      }
    }
  }

  /**
   * Returns the Cocos Creator native bridge object if running on a native
   * platform (iOS/Android), otherwise returns null.
   *
   * The bridge is exposed by the Cocos JSB runtime as:
   *   cc.native.bridge  (Cocos Creator 3.x)
   */
  private _getNativeBridge(): { sendToNative?: (cmd: string, data: string) => void } | null {
    try {
      const cc = (globalThis as Record<string, unknown>)['cc'] as {
        native?: { bridge?: { sendToNative?: (cmd: string, data: string) => void } };
        sys?: { isNative?: boolean };
      } | undefined;

      if (cc?.sys?.isNative && cc?.native?.bridge) {
        return cc.native.bridge;
      }
    } catch {
      // globalThis access failed – not a native environment
    }
    return null;
  }

  // -------------------------------------------------------------------------
  // WebGL fallback – window.onerror handler
  // -------------------------------------------------------------------------

  private _installWebGLFallback(): void {
    if (typeof window === 'undefined') return;

    // Only install on non-native (WebGL / browser) environments
    const bridge = this._getNativeBridge();
    if (bridge) return;

    const self = this;

    const prevOnError = window.onerror;
    window.onerror = function (
      message: Event | string,
      source?: string,
      lineno?: number,
      colno?: number,
      error?: Error
    ): boolean {
      self.recordError(
        'window.onerror',
        String(message),
        error?.stack,
        { source: source ?? '', lineno: lineno ?? 0, colno: colno ?? 0 }
      );
      if (typeof prevOnError === 'function') {
        return prevOnError.call(window, message, source, lineno, colno, error);
      }
      return false;
    };

    const prevOnUnhandledRejection = window.onunhandledrejection;
    window.addEventListener('unhandledrejection', (evt: PromiseRejectionEvent) => {
      const reason = evt.reason as Error | string | undefined;
      const message = reason instanceof Error ? reason.message : String(reason ?? 'unknown');
      const stack = reason instanceof Error ? reason.stack : undefined;
      self.recordError('UnhandledPromiseRejection', message, stack);
    });
  }

  // -------------------------------------------------------------------------
  // Backend reporting (WebGL fallback)
  // -------------------------------------------------------------------------

  private async _postReport(report: CrashReport): Promise<void> {
    if (!this._apiBase) return;
    try {
      await fetch(`${this._apiBase}/analytics/crashes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(report),
      });
    } catch {
      // Network unavailable – discard silently
    }
  }
}
