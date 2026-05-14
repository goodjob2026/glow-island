/**
 * PrivacyConsentPopup – first-launch GDPR/CCPA privacy notice (P1 launch requirement).
 *
 * Shown once on first launch before any analytics or crash reporting begins.
 * Stores the user's decision in localStorage.  If the player accepts, subsequent
 * services (AnalyticsService, CrashService) are configured normally.  If the
 * player declines, those services are configured with an empty player_id so no
 * PII-adjacent data leaves the device.
 *
 * Integration:
 *   - Attach this component to a full-screen overlay Node in the Loading / Boot
 *     scene.
 *   - In your boot sequence (e.g. GameScene.onLoad or MainMenuScene.onLoad):
 *
 *       const popup = node.getComponent(PrivacyConsentPopup)
 *       const accepted = await popup.showIfNeeded()
 *       // then configure AnalyticsService / CrashService based on `accepted`
 *
 * Copy references:
 *   - bodyLabel: display the privacy blurb (see PRIVACY_BODY_TEXT constant)
 *   - acceptButton: "Accept & Play"
 *   - declineButton: "Decline" (play with no analytics)
 *   - privacyLinkButton: opens the privacy policy URL
 */

import {
  Component,
  _decorator,
  Label,
  Button,
  Node,
  tween,
  Vec3,
  UIOpacity,
  sys,
} from 'cc'

const { ccclass, property } = _decorator

const LS_CONSENT_KEY = 'glow_privacy_consent'
const PRIVACY_POLICY_URL = 'https://glow-island.vercel.app/privacy'

const PRIVACY_BODY_TEXT_EN = [
  'Welcome to Glow Island!\n',
  'Before you start, we want to be transparent about how we handle your data.\n',
  'We collect an anonymous random ID for your device (no name, email, or personal info).',
  'This helps us fix crashes and improve the game.\n',
  'You can change this preference in Settings at any time.',
].join('\n')

const PRIVACY_BODY_TEXT_ZH = [
  '欢迎来到光辉岛！\n',
  '在开始游戏前，我们希望透明地告知您我们如何处理您的数据。\n',
  '我们仅收集您设备的随机匿名 ID（不收集姓名、邮箱或任何个人信息）。',
  '这有助于我们修复崩溃并改善游戏体验。\n',
  '您可以随时在设置中更改此偏好。',
].join('\n')

// ---------------------------------------------------------------------------
// PrivacyConsentPopup component
// ---------------------------------------------------------------------------

@ccclass('PrivacyConsentPopup')
export class PrivacyConsentPopup extends Component {
  // -------------------------------------------------------------------------
  // Inspector properties
  // -------------------------------------------------------------------------

  @property(Label)
  bodyLabel: Label | null = null

  @property(Button)
  acceptButton: Button | null = null

  @property(Button)
  declineButton: Button | null = null

  @property(Button)
  privacyLinkButton: Button | null = null

  // -------------------------------------------------------------------------
  // Private state
  // -------------------------------------------------------------------------

  private _resolvePromise: ((accepted: boolean) => void) | null = null

  // -------------------------------------------------------------------------
  // Lifecycle
  // -------------------------------------------------------------------------

  onLoad(): void {
    this.node.active = false

    if (this.bodyLabel) {
      // Use system locale to pick language
      const isZh = (sys.languageCode ?? '').startsWith('zh')
      this.bodyLabel.string = isZh ? PRIVACY_BODY_TEXT_ZH : PRIVACY_BODY_TEXT_EN
    }

    this.acceptButton?.node.on(Button.EventType.CLICK, this._onAccept, this)
    this.declineButton?.node.on(Button.EventType.CLICK, this._onDecline, this)
    this.privacyLinkButton?.node.on(Button.EventType.CLICK, this._onPrivacyLink, this)
  }

  onDestroy(): void {
    this.acceptButton?.node.off(Button.EventType.CLICK, this._onAccept, this)
    this.declineButton?.node.off(Button.EventType.CLICK, this._onDecline, this)
    this.privacyLinkButton?.node.off(Button.EventType.CLICK, this._onPrivacyLink, this)
  }

  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------

  /**
   * Show the consent popup if the player has not yet responded.
   * Returns a Promise that resolves to:
   *   true  – player accepted (analytics / crash services may run)
   *   false – player declined (no analytics / crash reporting)
   *
   * If the player has already responded (persisted flag present), resolves
   * immediately without showing the popup.
   */
  showIfNeeded(): Promise<boolean> {
    const stored = this._getStoredConsent()
    if (stored !== null) {
      return Promise.resolve(stored)
    }

    return new Promise<boolean>((resolve) => {
      this._resolvePromise = resolve
      this._show()
    })
  }

  /** Check whether consent has already been given (for conditional setup). */
  static hasConsent(): boolean | null {
    try {
      const raw = localStorage.getItem(LS_CONSENT_KEY)
      if (raw === null) return null
      return raw === '1'
    } catch {
      return null
    }
  }

  // -------------------------------------------------------------------------
  // Internal
  // -------------------------------------------------------------------------

  private _show(): void {
    this.node.active = true
    this.node.setScale(0.9, 0.9, 1)
    const opacity = this.node.getComponent(UIOpacity) ?? this.node.addComponent(UIOpacity)
    opacity.opacity = 0

    tween(this.node)
      .to(0.3, { scale: new Vec3(1, 1, 1) }, { easing: 'backOut' })
      .start()
    tween(opacity)
      .to(0.2, { opacity: 255 })
      .start()
  }

  private _dismiss(): void {
    const opacity = this.node.getComponent(UIOpacity) ?? this.node.addComponent(UIOpacity)
    tween(opacity)
      .to(0.2, { opacity: 0 })
      .call(() => { this.node.active = false })
      .start()
  }

  private _onAccept(): void {
    this._persistConsent(true)
    this._dismiss()
    this._resolvePromise?.(true)
    this._resolvePromise = null
  }

  private _onDecline(): void {
    this._persistConsent(false)
    this._dismiss()
    this._resolvePromise?.(false)
    this._resolvePromise = null
  }

  private _onPrivacyLink(): void {
    if (sys.isNative) {
      try {
        const cc = (globalThis as Record<string, unknown>)['cc'] as {
          native?: { bridge?: { sendToNative?: (cmd: string, data: string) => void } }
        } | undefined
        cc?.native?.bridge?.sendToNative?.('openURL', PRIVACY_POLICY_URL)
      } catch {
        // ignore
      }
    } else {
      window.open(PRIVACY_POLICY_URL, '_blank', 'noopener,noreferrer')
    }
  }

  private _getStoredConsent(): boolean | null {
    return PrivacyConsentPopup.hasConsent()
  }

  private _persistConsent(accepted: boolean): void {
    try {
      localStorage.setItem(LS_CONSENT_KEY, accepted ? '1' : '0')
    } catch {
      // Storage unavailable – proceed as if accepted to not block gameplay
    }
  }
}
