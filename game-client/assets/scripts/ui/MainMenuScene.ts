import {
  Component,
  _decorator,
  Label,
  Button,
  Node,
  director,
  Sprite,
  Color,
  tween,
  UIOpacity,
} from 'cc'
import { ProgressionManager } from '../meta/ProgressionManager'
import { AudioManager } from '../audio/AudioManager'
import { BGMKey } from '../audio/AudioConfig'
import { ZenModeManager } from '../puzzle/ZenModeManager'
import { GameSession } from '../game/GameSession'

const { ccclass, property } = _decorator

/** Cloud sync visual states */
export const enum CloudStatus {
  Synced = 'synced',
  Syncing = 'syncing',
  Offline = 'offline',
}

@ccclass('MainMenuScene')
export class MainMenuScene extends Component {
  // -------------------------------------------------------------------------
  // Inspector properties
  // -------------------------------------------------------------------------

  @property(Button)
  startButton: Button | null = null

  @property(Button)
  continueButton: Button | null = null

  @property(Button)
  leaderboardButton: Button | null = null

  @property(Button)
  settingsButton: Button | null = null

  @property(Button)
  shopButton: Button | null = null

  @property(Button)
  zenModeButton: Button | null = null

  /** Label that shows the app version string (e.g. v1.0.3) */
  @property(Label)
  versionLabel: Label | null = null

  /** Small icon Node that reflects cloud-save status */
  @property(Node)
  cloudStatusIcon: Node | null = null

  /** Child sprite of cloudStatusIcon – tinted to match current status */
  @property(Sprite)
  cloudStatusSprite: Sprite | null = null

  /** Optional label next to the cloud icon ("已同步" / "同步中…" / "离线") */
  @property(Label)
  cloudStatusLabel: Label | null = null

  // -------------------------------------------------------------------------
  // Private state
  // -------------------------------------------------------------------------

  private _cloudStatus: CloudStatus = CloudStatus.Offline
  private _syncPulse: boolean = false
  private _appVersion: string = '1.0.0'

  // -------------------------------------------------------------------------
  // Lifecycle
  // -------------------------------------------------------------------------

  onLoad(): void {
    // Try to read version from global (injected by build pipeline) or fall back
    if (typeof (globalThis as Record<string, unknown>)['APP_VERSION'] === 'string') {
      this._appVersion = (globalThis as Record<string, unknown>)['APP_VERSION'] as string
    }
  }

  async start(): Promise<void> {
    // Render version immediately
    this._updateVersionLabel()

    // Show offline status while we attempt cloud load
    this._setCloudStatus(CloudStatus.Syncing)

    // Register button callbacks
    this.startButton?.node.on(Button.EventType.CLICK, this._onStartGame, this)
    this.continueButton?.node.on(Button.EventType.CLICK, this._onContinue, this)
    this.leaderboardButton?.node.on(Button.EventType.CLICK, this._onLeaderboard, this)
    this.settingsButton?.node.on(Button.EventType.CLICK, this._onSettings, this)
    this.shopButton?.node.on(Button.EventType.CLICK, this._onShop, this)
    this.zenModeButton?.node.on(Button.EventType.CLICK, this._onZenMode, this)

    // Load cloud progress (falls back to localStorage on failure)
    try {
      await ProgressionManager.getInstance().loadFromCloud()
      this._setCloudStatus(CloudStatus.Synced)
    } catch {
      this._setCloudStatus(CloudStatus.Offline)
    }

    // Play menu BGM
    const audio = AudioManager.getInstance()
    if (audio) {
      audio.playBGM(BGMKey.MAIN_MENU)
    }

    // Update continue button availability
    this._updateContinueButton()
  }

  onDestroy(): void {
    this.startButton?.node.off(Button.EventType.CLICK, this._onStartGame, this)
    this.continueButton?.node.off(Button.EventType.CLICK, this._onContinue, this)
    this.leaderboardButton?.node.off(Button.EventType.CLICK, this._onLeaderboard, this)
    this.settingsButton?.node.off(Button.EventType.CLICK, this._onSettings, this)
    this.shopButton?.node.off(Button.EventType.CLICK, this._onShop, this)
    this.zenModeButton?.node.off(Button.EventType.CLICK, this._onZenMode, this)
  }

  // -------------------------------------------------------------------------
  // Button handlers
  // -------------------------------------------------------------------------

  private _onStartGame(): void {
    // Navigate to level select scene
    director.loadScene('LevelSelectScene')
  }

  private _onContinue(): void {
    const progress = ProgressionManager.getInstance().getCurrentProgress()
    // Find the last active chapter / level
    let lastChapter = 1
    let lastLevel = ''
    for (let ch = 6; ch >= 1; ch--) {
      const cp = progress.chapterProgress[ch]
      if (cp && cp.completedLevels > 0) {
        lastChapter = ch
        lastLevel = cp.currentLevel
        break
      }
    }

    // SC-004 fix: fall back to the mid-session resume key when there is no
    // completed chapter progress (e.g. player quit on their first ever level).
    if (!lastLevel) {
      const resumeLevel = GameSession.getPendingResumeLevel()
      if (resumeLevel) {
        lastLevel = resumeLevel
      }
    }

    // Pass context via director globals then load scene
    ;(director as unknown as Record<string, unknown>)['_lastChapter'] = lastChapter
    ;(director as unknown as Record<string, unknown>)['_lastLevel'] = lastLevel
    director.loadScene('GameScene')
  }

  private _onLeaderboard(): void {
    director.loadScene('LeaderboardScene')
  }

  private _onShop(): void {
    director.loadScene('ShopScene')
  }

  private _onZenMode(): void {
    const mgr = ZenModeManager.getInstance();
    if (!mgr || !mgr.consumeSlot()) {
      this.node.emit('showToast', '今日禅境次数已用完，明天再来');
      return;
    }
    mgr.enterZenMode();
    director.loadScene('GameScene');
  }

  // Public alias for Inspector button binding
  onZenModeButtonClick(): void {
    this._onZenMode();
  }

  private _onSettings(): void {
    // Settings is a popup overlay; fire a custom global event so the
    // SettingsPanel (which may already be in the scene hierarchy) activates.
    const settingsNode = director.getScene()?.getChildByName('SettingsPanel')
    if (settingsNode) {
      settingsNode.active = true
    } else {
      director.loadScene('SettingsScene')
    }
  }

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  private _updateVersionLabel(): void {
    if (this.versionLabel) {
      this.versionLabel.string = `v${this._appVersion}`
    }
  }

  private _updateContinueButton(): void {
    if (!this.continueButton) return
    const progress = ProgressionManager.getInstance().getCurrentProgress()
    let hasProgress = false
    for (let ch = 1; ch <= 6; ch++) {
      if (progress.chapterProgress[ch]?.completedLevels > 0) {
        hasProgress = true
        break
      }
    }
    // SC-004 fix: also enable the button when a mid-session resume key exists
    // (covers players who quit on their very first level, completedLevels still 0)
    if (!hasProgress && GameSession.getPendingResumeLevel() !== null) {
      hasProgress = true
    }
    // Dim the button if there's no saved progress to continue
    this.continueButton.interactable = hasProgress
    const opacity = this.continueButton.node.getComponent(UIOpacity)
    if (opacity) {
      opacity.opacity = hasProgress ? 255 : 100
    }
  }

  private _setCloudStatus(status: CloudStatus): void {
    this._cloudStatus = status

    // Stop any running pulse tweens
    if (this.cloudStatusIcon) {
      tween(this.cloudStatusIcon).stop()
    }

    // Color codes:
    //   Synced  → system_success green  (#7DBD7A)
    //   Syncing → brand_primary blue    (#7EC8E3)  + pulse
    //   Offline → system_error red      (#E05A4A)
    const colorMap: Record<CloudStatus, [number, number, number]> = {
      [CloudStatus.Synced]: [125, 189, 122],
      [CloudStatus.Syncing]: [126, 200, 227],
      [CloudStatus.Offline]: [224, 90, 74],
    }

    const [r, g, b] = colorMap[status]
    const col = new Color(r, g, b, 255)

    if (this.cloudStatusSprite) {
      this.cloudStatusSprite.color = col
    }

    const labelMap: Record<CloudStatus, string> = {
      [CloudStatus.Synced]: '已同步',
      [CloudStatus.Syncing]: '同步中…',
      [CloudStatus.Offline]: '离线',
    }
    if (this.cloudStatusLabel) {
      this.cloudStatusLabel.string = labelMap[status]
    }

    // Pulse animation during syncing
    if (status === CloudStatus.Syncing && this.cloudStatusIcon) {
      this._syncPulse = true
      const icon = this.cloudStatusIcon
      const opacity = icon.getComponent(UIOpacity) ?? icon.addComponent(UIOpacity)
      const loop = () => {
        if (!this._syncPulse) return
        tween(opacity)
          .to(0.5, { opacity: 80 })
          .to(0.5, { opacity: 255 })
          .call(loop)
          .start()
      }
      loop()
    } else {
      this._syncPulse = false
      const opacity = this.cloudStatusIcon?.getComponent(UIOpacity)
      if (opacity) {
        opacity.opacity = 255
      }
    }
  }
}
