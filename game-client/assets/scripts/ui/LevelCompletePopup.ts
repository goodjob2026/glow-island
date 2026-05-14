import {
  Component,
  _decorator,
  Label,
  Button,
  Node,
  director,
  tween,
  Vec3,
  UIOpacity,
  sys,
} from 'cc'
import { ProgressionManager } from '../meta/ProgressionManager'
import { AreaRestorationEffect } from '../meta/AreaRestorationEffect'
import { AudioManager } from '../audio/AudioManager'
import { SFXKey } from '../audio/AudioConfig'
import { RatingService } from '../services/RatingService'

const { ccclass, property } = _decorator

// ---------------------------------------------------------------------------
// SessionResult – mirrors the shape produced by GameSession
// ---------------------------------------------------------------------------

export interface SessionResult {
  /** 1, 2, or 3 */
  stars: number
  score: number
  /** Map of materialId → quantity earned */
  materialRewards: Record<string, number>
  levelId: string
  chapterId: number
  tilesCleared: number
  movesUsed: number
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

@ccclass('LevelCompletePopup')
export class LevelCompletePopup extends Component {
  // -------------------------------------------------------------------------
  // Inspector properties
  // -------------------------------------------------------------------------

  @property(Node)
  star1: Node | null = null

  @property(Node)
  star2: Node | null = null

  @property(Node)
  star3: Node | null = null

  @property(Node)
  rewardContainer: Node | null = null

  @property(Button)
  nextLevelBtn: Button | null = null

  @property(Button)
  mapBtn: Button | null = null

  @property(Button)
  shareBtn: Button | null = null

  /** Optional score label */
  @property(Label)
  scoreLabel: Label | null = null

  /**
   * Optional AreaRestorationEffect component.
   * When assigned, LevelCompletePopup will trigger restoration playback
   * after advancing the chapter's restoration stage.
   */
  @property(AreaRestorationEffect)
  areaRestorationEffect: AreaRestorationEffect | null = null

  /** Inventory icon destination node – reward items "fly" toward it */
  @property(Node)
  inventoryIcon: Node | null = null

  // -------------------------------------------------------------------------
  // Lifecycle
  // -------------------------------------------------------------------------

  onLoad(): void {
    // Hide by default; activated by show()
    this.node.active = false

    this.nextLevelBtn?.node.on(Button.EventType.CLICK, this._onNextLevel, this)
    this.mapBtn?.node.on(Button.EventType.CLICK, this._onBackToMap, this)
    this.shareBtn?.node.on(Button.EventType.CLICK, this._onShare, this)
  }

  onDestroy(): void {
    this.nextLevelBtn?.node.off(Button.EventType.CLICK, this._onNextLevel, this)
    this.mapBtn?.node.off(Button.EventType.CLICK, this._onBackToMap, this)
    this.shareBtn?.node.off(Button.EventType.CLICK, this._onShare, this)
  }

  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------

  show(result: SessionResult): void {
    this.node.active = true

    // Start from transparent / scaled down (popup enter animation)
    const popupOpacity = this.node.getComponent(UIOpacity) ?? this.node.addComponent(UIOpacity)
    popupOpacity.opacity = 0
    this.node.setScale(0.8, 0.8, 1)

    tween(this.node)
      .to(0.3, { scale: new Vec3(1, 1, 1) }, { easing: 'backOut' })
      .start()

    tween(popupOpacity)
      .to(0.2, { opacity: 255 })
      .start()

    // Sequence: score → stars → rewards
    if (this.scoreLabel) {
      this.scoreLabel.string = String(result.score)
    }

    this._animateStars(result.stars, () => {
      this._animateRewards(result.materialRewards)
    })

    // Persist rewards and trigger cloud sync
    const pm = ProgressionManager.getInstance()
    pm.addMaterials(result.materialRewards)
    pm.updateChapterProgress(result.chapterId, result.levelId)
    pm.syncToCloud().catch((e) => {
      console.warn('[LevelCompletePopup] syncToCloud failed:', e)
    })

    // Rating prompt: fire SKStoreReviewRequest after the 5th completed level (first time only)
    const totalCompleted = Object.values(pm.getCurrentProgress().chapterProgress)
      .reduce((sum, cp) => sum + cp.completedLevels, 0)
    RatingService.getInstance().onLevelCompleted(totalCompleted)

    // Advance restoration stage and play AreaRestorationEffect if assigned
    this._tryAdvanceRestoration(result.chapterId)

    // SFX
    AudioManager.getInstance()?.playSFX(SFXKey.LEVEL_COMPLETE)
  }

  // -------------------------------------------------------------------------
  // Restoration advancement
  // -------------------------------------------------------------------------

  /**
   * Advance the chapter's restoration stage by 1.
   * If an AreaRestorationEffect component is wired, play the new stage.
   */
  private _tryAdvanceRestoration(chapterId: number): void {
    const pm = ProgressionManager.getInstance()
    const newStage = pm.advanceRestorationStage(chapterId)
    if (newStage >= 1 && newStage <= 4 && this.areaRestorationEffect) {
      const stage = newStage as 1 | 2 | 3 | 4
      this.areaRestorationEffect.playStage(chapterId, stage).catch((e) => {
        console.warn('[LevelCompletePopup] AreaRestorationEffect.playStage failed:', e)
      })
    }
  }

  // -------------------------------------------------------------------------
  // Star animation
  // -------------------------------------------------------------------------

  private _animateStars(count: number, onComplete: () => void): void {
    const stars = [this.star1, this.star2, this.star3]

    // Hide all stars initially
    stars.forEach((s) => {
      if (s) {
        s.active = false
        s.setScale(0, 0, 1)
      }
    })

    let delay = 0.25
    for (let i = 0; i < 3; i++) {
      const starNode = stars[i]
      if (!starNode) continue

      const shouldLight = i < count
      const capturedDelay = delay

      this.scheduleOnce(() => {
        starNode.active = true
        if (shouldLight) {
          // Pop-in spring bounce: art-tokens combo_popup_easing equivalent
          tween(starNode)
            .to(0.15, { scale: new Vec3(1.3, 1.3, 1) }, { easing: 'backOut' })
            .to(0.1, { scale: new Vec3(1.0, 1.0, 1) })
            .start()
        } else {
          // Unlit star appears at reduced opacity
          const op = starNode.getComponent(UIOpacity) ?? starNode.addComponent(UIOpacity)
          op.opacity = 80
          tween(starNode)
            .to(0.2, { scale: new Vec3(1, 1, 1) })
            .start()
        }

        // Fire onComplete after last star
        if (i === 2) {
          this.scheduleOnce(onComplete, 0.35)
        }
      }, capturedDelay)

      delay += 0.25
    }
  }

  // -------------------------------------------------------------------------
  // Reward fly-in animation
  // -------------------------------------------------------------------------

  private _animateRewards(rewards: Record<string, number>): void {
    if (!this.rewardContainer) return

    const entries = Object.entries(rewards)
    if (entries.length === 0) return

    const inventoryWorldPos = this.inventoryIcon
      ? this.inventoryIcon.worldPosition.clone()
      : null

    entries.forEach(([materialId, qty], idx) => {
      this.scheduleOnce(() => {
        this._spawnRewardItem(materialId, qty, inventoryWorldPos)
      }, idx * 0.12)
    })
  }

  private _spawnRewardItem(materialId: string, qty: number, targetWorldPos: Vec3 | null): void {
    if (!this.rewardContainer) return

    // Create a label node as a stand-in reward badge.
    // In production, replace with a Prefab instantiation.
    const itemNode = new Node(`reward_${materialId}`)
    const label = itemNode.addComponent(Label)
    label.string = `${materialId} ×${qty}`
    label.fontSize = 14

    const opacity = itemNode.addComponent(UIOpacity)
    opacity.opacity = 0

    this.rewardContainer.addChild(itemNode)

    // Fly from bottom (start below the container)
    itemNode.setPosition(0, -80, 0)
    itemNode.setScale(0.5, 0.5, 1)

    // Rise into view
    tween(itemNode)
      .to(0.35, { scale: new Vec3(1, 1, 1) }, { easing: 'backOut' })
      .start()

    tween(opacity)
      .to(0.2, { opacity: 255 })
      .delay(0.8)
      .to(0.2, { opacity: 0 })
      .call(() => {
        // After fade, optionally fly toward inventory icon
        if (targetWorldPos) {
          const localTarget = this.rewardContainer!.inverseTransformPoint(
            new Vec3(),
            targetWorldPos
          )
          tween(itemNode)
            .to(0.3, { position: localTarget }, { easing: 'sineIn' })
            .call(() => itemNode.destroy())
            .start()
        } else {
          itemNode.destroy()
        }
      })
      .start()
  }

  // -------------------------------------------------------------------------
  // Button handlers
  // -------------------------------------------------------------------------

  private _onNextLevel(): void {
    this.node.active = false
    // GameScene will listen for this event and advance to the next level
    director.emit('levelComplete_nextLevel')
  }

  private _onBackToMap(): void {
    this.node.active = false
    director.loadScene('IslandMapScene')
  }

  private _onShare(): void {
    const shareText = `我在 Glow Island 通关了！✨`
    const shareUrl = 'https://glow-island.vercel.app'

    if (sys.isNative) {
      // iOS / Android native share sheet via JSB bridge
      try {
        const native = (globalThis as Record<string, unknown>)['jsb'] as {
          reflection?: { callStaticMethod?: Function }
        } | undefined

        if (native?.reflection?.callStaticMethod) {
          native.reflection.callStaticMethod(
            'com/glowisland/NativeShare',
            'share',
            '(Ljava/lang/String;Ljava/lang/String;)V',
            shareText,
            shareUrl
          )
        } else {
          // Fallback: cc.native.bridge
          const nativeBridge = (globalThis as Record<string, unknown>)['cc'] as {
            native?: { bridge?: { sendToNative?: Function } }
          } | undefined
          nativeBridge?.native?.bridge?.sendToNative?.('share', JSON.stringify({ text: shareText, url: shareUrl }))
        }
      } catch (e) {
        console.warn('[LevelCompletePopup] Native share failed:', e)
      }
    } else {
      // WebGL / browser: use Web Share API if available
      const nav = navigator as Navigator & { share?: Function }
      if (nav.share) {
        nav
          .share({ title: 'Glow Island', text: shareText, url: shareUrl })
          .catch((e: unknown) => console.warn('[LevelCompletePopup] navigator.share failed:', e))
      } else {
        // Fallback: copy URL to clipboard
        navigator.clipboard
          ?.writeText(`${shareText} ${shareUrl}`)
          .then(() => console.log('[LevelCompletePopup] Copied share text to clipboard'))
          .catch((e: unknown) => console.warn('[LevelCompletePopup] Clipboard write failed:', e))
      }
    }
  }
}
