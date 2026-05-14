import {
  Component,
  _decorator,
  Label,
  Button,
  Slider,
  Node,
  sys,
  tween,
  UIOpacity,
  Vec3,
} from 'cc'
import { ProgressionManager } from '../meta/ProgressionManager'
import { AudioManager } from '../audio/AudioManager'
import { RatingService } from '../services/RatingService'

const { ccclass, property } = _decorator

// Publicly accessible URLs (injected by build or hard-coded for now)
const URL_ABOUT   = 'https://glow-island.vercel.app/about'
const URL_PRIVACY = 'https://glow-island.vercel.app/privacy'
const URL_TERMS   = 'https://glow-island.vercel.app/terms'
/** Customer support mailto – P0 launch requirement */
const URL_SUPPORT = 'mailto:support@glowisland.game?subject=Glow%20Island%20Support'

export const enum CloudSyncStatus {
  Idle    = 'idle',
  Syncing = 'syncing',
  Success = 'success',
  Failed  = 'failed',
}

@ccclass('SettingsPanel')
export class SettingsPanel extends Component {
  // -------------------------------------------------------------------------
  // Inspector properties
  // -------------------------------------------------------------------------

  @property(Slider)
  bgmSlider: Slider | null = null

  @property(Slider)
  sfxSlider: Slider | null = null

  /** Label that shows sync status text */
  @property(Label)
  cloudStatusLabel: Label | null = null

  @property(Button)
  syncButton: Button | null = null

  @property(Button)
  aboutButton: Button | null = null

  @property(Button)
  privacyButton: Button | null = null

  @property(Button)
  termsButton: Button | null = null

  /** Customer support button (mailto link) – P0 launch requirement */
  @property(Button)
  supportButton: Button | null = null

  /** "Rate Us" button – triggers SKStoreReviewRequest manually */
  @property(Button)
  rateUsButton: Button | null = null

  /** Close / back button for the panel */
  @property(Button)
  closeButton: Button | null = null

  /** Optional label showing current BGM volume percentage */
  @property(Label)
  bgmValueLabel: Label | null = null

  /** Optional label showing current SFX volume percentage */
  @property(Label)
  sfxValueLabel: Label | null = null

  // -------------------------------------------------------------------------
  // Private state
  // -------------------------------------------------------------------------

  private _syncStatus: CloudSyncStatus = CloudSyncStatus.Idle

  // -------------------------------------------------------------------------
  // Lifecycle
  // -------------------------------------------------------------------------

  onLoad(): void {
    // Initialize sliders from persisted volumes
    const audio = AudioManager.getInstance()
    if (audio) {
      if (this.bgmSlider) {
        this.bgmSlider.progress = audio.getBGMVolume()
      }
      if (this.sfxSlider) {
        this.sfxSlider.progress = audio.getSFXVolume()
      }
    }

    this._updateVolumeLabels()

    // Register slider events
    this.bgmSlider?.node.on('slide', this._onBGMSlide, this)
    this.sfxSlider?.node.on('slide', this._onSFXSlide, this)

    // Register button events
    this.syncButton?.node.on(Button.EventType.CLICK, this._onSync, this)
    this.aboutButton?.node.on(Button.EventType.CLICK, this._onAbout, this)
    this.privacyButton?.node.on(Button.EventType.CLICK, this._onPrivacy, this)
    this.termsButton?.node.on(Button.EventType.CLICK, this._onTerms, this)
    this.supportButton?.node.on(Button.EventType.CLICK, this._onSupport, this)
    this.rateUsButton?.node.on(Button.EventType.CLICK, this._onRateUs, this)
    this.closeButton?.node.on(Button.EventType.CLICK, this._onClose, this)

    this._updateCloudStatusLabel()
  }

  onDestroy(): void {
    this.bgmSlider?.node.off('slide', this._onBGMSlide, this)
    this.sfxSlider?.node.off('slide', this._onSFXSlide, this)
    this.syncButton?.node.off(Button.EventType.CLICK, this._onSync, this)
    this.aboutButton?.node.off(Button.EventType.CLICK, this._onAbout, this)
    this.privacyButton?.node.off(Button.EventType.CLICK, this._onPrivacy, this)
    this.termsButton?.node.off(Button.EventType.CLICK, this._onTerms, this)
    this.supportButton?.node.off(Button.EventType.CLICK, this._onSupport, this)
    this.rateUsButton?.node.off(Button.EventType.CLICK, this._onRateUs, this)
    this.closeButton?.node.off(Button.EventType.CLICK, this._onClose, this)
  }

  // -------------------------------------------------------------------------
  // Volume sliders
  // -------------------------------------------------------------------------

  private _onBGMSlide(slider: Slider): void {
    const vol = slider.progress
    AudioManager.getInstance()?.setBGMVolume(vol)
    this._updateVolumeLabels()
  }

  private _onSFXSlide(slider: Slider): void {
    const vol = slider.progress
    AudioManager.getInstance()?.setSFXVolume(vol)
    this._updateVolumeLabels()
  }

  private _updateVolumeLabels(): void {
    const audio = AudioManager.getInstance()
    if (!audio) return

    if (this.bgmValueLabel) {
      this.bgmValueLabel.string = `${Math.round(audio.getBGMVolume() * 100)}%`
    }
    if (this.sfxValueLabel) {
      this.sfxValueLabel.string = `${Math.round(audio.getSFXVolume() * 100)}%`
    }
  }

  // -------------------------------------------------------------------------
  // Cloud sync
  // -------------------------------------------------------------------------

  private async _onSync(): Promise<void> {
    if (this._syncStatus === CloudSyncStatus.Syncing) return

    this._setSyncStatus(CloudSyncStatus.Syncing)

    try {
      await ProgressionManager.getInstance().syncToCloud()
      this._setSyncStatus(CloudSyncStatus.Success)
      // Auto-reset to Idle after 2 seconds
      this.scheduleOnce(() => {
        this._setSyncStatus(CloudSyncStatus.Idle)
      }, 2)
    } catch (e) {
      console.warn('[SettingsPanel] Force sync failed:', e)
      this._setSyncStatus(CloudSyncStatus.Failed)
      this.scheduleOnce(() => {
        this._setSyncStatus(CloudSyncStatus.Idle)
      }, 3)
    }
  }

  private _setSyncStatus(status: CloudSyncStatus): void {
    this._syncStatus = status
    this._updateCloudStatusLabel()

    if (this.syncButton) {
      this.syncButton.interactable = status !== CloudSyncStatus.Syncing
      const opacity = this.syncButton.node.getComponent(UIOpacity) ??
        this.syncButton.node.addComponent(UIOpacity)
      opacity.opacity = status === CloudSyncStatus.Syncing ? 140 : 255
    }
  }

  private _updateCloudStatusLabel(): void {
    if (!this.cloudStatusLabel) return

    const labelMap: Record<CloudSyncStatus, string> = {
      [CloudSyncStatus.Idle]:    '云存档已就绪',
      [CloudSyncStatus.Syncing]: '正在同步…',
      [CloudSyncStatus.Success]: '同步成功 ✓',
      [CloudSyncStatus.Failed]:  '同步失败，请重试',
    }

    this.cloudStatusLabel.string = labelMap[this._syncStatus]
  }

  // -------------------------------------------------------------------------
  // URL buttons (About / Privacy / Terms)
  // -------------------------------------------------------------------------

  private _onAbout(): void {
    this._openURL(URL_ABOUT)
  }

  private _onPrivacy(): void {
    this._openURL(URL_PRIVACY)
  }

  private _onTerms(): void {
    this._openURL(URL_TERMS)
  }

  /** Open customer support email – P0 launch requirement */
  private _onSupport(): void {
    this._openURL(URL_SUPPORT)
  }

  /** Manually trigger the SKStoreReviewRequest via RatingService */
  private _onRateUs(): void {
    RatingService.getInstance().requestReviewManually()
  }

  private _openURL(url: string): void {
    if (sys.isNative) {
      // Open in an in-app WebView via JSB bridge
      try {
        const jsb = (globalThis as Record<string, unknown>)['jsb'] as {
          openURL?: (u: string) => void
        } | undefined
        if (jsb?.openURL) {
          jsb.openURL(url)
          return
        }

        // Fallback: cc.native.bridge
        const ccGlobal = (globalThis as Record<string, unknown>)['cc'] as {
          native?: { bridge?: { sendToNative?: Function } }
        } | undefined
        ccGlobal?.native?.bridge?.sendToNative?.('openURL', url)
      } catch (e) {
        console.warn('[SettingsPanel] openURL native failed:', e)
      }
    } else {
      // Browser / WebGL
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  }

  // -------------------------------------------------------------------------
  // Close panel
  // -------------------------------------------------------------------------

  private _onClose(): void {
    // Animate out: scale down + fade
    const opacity = this.node.getComponent(UIOpacity) ?? this.node.addComponent(UIOpacity)

    tween(this.node)
      .to(0.2, { scale: new Vec3(0.9, 0.9, 1) }, { easing: 'sineIn' })
      .call(() => {
        this.node.active = false
        // Restore scale for next open
        this.node.setScale(1, 1, 1)
        opacity.opacity = 255
      })
      .start()

    tween(opacity)
      .to(0.2, { opacity: 0 })
      .start()
  }

  // -------------------------------------------------------------------------
  // Public API – called when the panel is made active from outside
  // -------------------------------------------------------------------------

  openPanel(): void {
    this.node.active = true

    // Enter animation (ui_modal_enter: 0.30s, cubic-bezier(0.34,1.20,0.64,1))
    this.node.setScale(0.85, 0.85, 1)
    const opacity = this.node.getComponent(UIOpacity) ?? this.node.addComponent(UIOpacity)
    opacity.opacity = 0

    tween(this.node)
      .to(0.3, { scale: new Vec3(1, 1, 1) }, { easing: 'backOut' })
      .start()

    tween(opacity)
      .to(0.2, { opacity: 255 })
      .start()

    // Refresh slider positions in case AudioManager volume changed externally
    const audio = AudioManager.getInstance()
    if (audio) {
      if (this.bgmSlider) this.bgmSlider.progress = audio.getBGMVolume()
      if (this.sfxSlider) this.sfxSlider.progress = audio.getSFXVolume()
    }
    this._updateVolumeLabels()
    this._updateCloudStatusLabel()
  }
}
