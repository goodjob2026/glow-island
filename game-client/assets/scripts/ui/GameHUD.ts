import {
  Component,
  _decorator,
  Label,
  Button,
  ProgressBar,
  Animation,
  Node,
  director,
  Color,
  tween,
  UIOpacity,
  UITransform,
  Vec3,
} from 'cc'
import { COMBO_EVENT, ComboTracker } from '../puzzle/ComboTracker'
import { AudioManager } from '../audio/AudioManager'
import { SFXKey } from '../audio/AudioConfig'

const { ccclass, property } = _decorator

// ---------------------------------------------------------------------------
// Minimal type stubs for GameSession – the concrete class lives in game/
// ---------------------------------------------------------------------------

export interface GameSessionState {
  tilesCleared: number
  objectiveTarget: number
  movesRemaining: number
  maxMoves: number
  isPaused: boolean
  isComplete: boolean
}

export const GAME_SESSION_EVENT = {
  STATE_CHANGED: 'stateChanged',
  PAUSED: 'paused',
  RESUMED: 'resumed',
} as const

// Glow colors per combo level (matches brand tokens)
const COMBO_GLOW_COLORS: Color[] = [
  new Color(126, 200, 227, 255),  // lv1 – brand_primary
  new Color(244, 201, 93, 255),   // lv2 – brand_secondary
  new Color(255, 140, 66, 255),   // lv3 – brand_warm
  new Color(255, 215, 0, 255),    // lv4 – gold
]

@ccclass('GameHUD')
export class GameHUD extends Component {
  // -------------------------------------------------------------------------
  // Inspector properties
  // -------------------------------------------------------------------------

  @property(Label)
  comboLabel: Label | null = null

  @property(ProgressBar)
  objectiveProgressBar: ProgressBar | null = null

  @property(Label)
  movesLabel: Label | null = null

  @property(Animation)
  comboAnimation: Animation | null = null

  @property(Button)
  pauseButton: Button | null = null

  @property(Button)
  shopButton: Button | null = null

  /** Optional Node for the combo glow ring / background highlight */
  @property(Node)
  comboGlowNode: Node | null = null

  /** Optional label showing objective fraction e.g. "24 / 40" */
  @property(Label)
  objectiveCountLabel: Label | null = null

  // -------------------------------------------------------------------------
  // Private state
  // -------------------------------------------------------------------------

  private _comboTracker: ComboTracker | null = null
  private _sessionEventTarget: { on: Function; off: Function } | null = null
  private _currentCombo: number = 0

  // -------------------------------------------------------------------------
  // Lifecycle
  // -------------------------------------------------------------------------

  onLoad(): void {
    this.pauseButton?.node.on(Button.EventType.CLICK, this._onPause, this)
    this.shopButton?.node.on(Button.EventType.CLICK, this._onShop, this)
  }

  /** Call this from GameScene after it has created the ComboTracker and GameSession. */
  init(comboTracker: ComboTracker, sessionEventTarget: { on: Function; off: Function }): void {
    // Detach from any previous references
    this._detachListeners()

    this._comboTracker = comboTracker
    this._sessionEventTarget = sessionEventTarget

    // Listen for combo changes
    this._comboTracker.on(COMBO_EVENT.COMBO_CHANGED, this._onComboChanged, this)

    // Listen for game session state changes
    this._sessionEventTarget.on(GAME_SESSION_EVENT.STATE_CHANGED, this._onSessionStateChanged, this)
  }

  onDestroy(): void {
    this._detachListeners()
    this.pauseButton?.node.off(Button.EventType.CLICK, this._onPause, this)
    this.shopButton?.node.off(Button.EventType.CLICK, this._onShop, this)
  }

  // -------------------------------------------------------------------------
  // Event handlers
  // -------------------------------------------------------------------------

  private _onComboChanged(count: number, multiplier: number): void {
    this._currentCombo = count
    this._updateComboDisplay(count, multiplier)
  }

  private _onSessionStateChanged(state: GameSessionState): void {
    this._updateObjectiveBar(state.tilesCleared, state.objectiveTarget)
    this._updateMovesLabel(state.movesRemaining)
  }

  // -------------------------------------------------------------------------
  // UI updates
  // -------------------------------------------------------------------------

  private _updateComboDisplay(count: number, multiplier: number): void {
    if (!this.comboLabel) return

    if (count <= 1) {
      this.comboLabel.string = ''
      this._hideComboGlow()
      return
    }

    // Format: "x3  2.0×"  (count + multiplier)
    this.comboLabel.string = `x${count}  ${multiplier.toFixed(1)}×`

    // Tint the label to match combo level
    const colorIdx = Math.min(count - 1, COMBO_GLOW_COLORS.length - 1)
    this.comboLabel.color = COMBO_GLOW_COLORS[colorIdx]

    // Trigger the named animation clip
    if (this.comboAnimation) {
      // combo-popup.anim is authored in Cocos Creator
      this.comboAnimation.play('combo-popup')
    } else {
      // Fallback: manual bounce tween on the label's node
      this._bounceComboLabel()
    }

    // Update glow ring color
    this._showComboGlow(colorIdx)

    // Play appropriate SFX
    const audio = AudioManager.getInstance()
    if (audio) {
      if (count >= 4) audio.playSFX(SFXKey.COMBO_LV3)
      else if (count >= 3) audio.playSFX(SFXKey.COMBO_LV2)
      else if (count >= 2) audio.playSFX(SFXKey.COMBO_LV1)
    }
  }

  private _bounceComboLabel(): void {
    if (!this.comboLabel) return
    const node = this.comboLabel.node
    // cubic-bezier(0.34, 1.56, 0.64, 1) spring curve — approximated via tween
    tween(node)
      .to(0.0, { scale: new Vec3(0.6, 0.6, 1) })
      .to(0.25, { scale: new Vec3(1.15, 1.15, 1) })
      .to(0.15, { scale: new Vec3(1.0, 1.0, 1) })
      .start()
  }

  private _showComboGlow(colorIdx: number): void {
    if (!this.comboGlowNode) return
    this.comboGlowNode.active = true
    const sprite = this.comboGlowNode.getComponent('Sprite') as { color: Color } | null
    if (sprite) {
      sprite.color = COMBO_GLOW_COLORS[colorIdx]
    }
    const opacity = this.comboGlowNode.getComponent(UIOpacity) ?? this.comboGlowNode.addComponent(UIOpacity)
    tween(opacity)
      .to(0.1, { opacity: 180 })
      .to(0.3, { opacity: 0 })
      .start()
  }

  private _hideComboGlow(): void {
    if (!this.comboGlowNode) return
    this.comboGlowNode.active = false
  }

  private _updateObjectiveBar(cleared: number, target: number): void {
    if (this.objectiveProgressBar) {
      const ratio = target > 0 ? Math.min(cleared / target, 1) : 0
      this.objectiveProgressBar.progress = ratio
    }
    if (this.objectiveCountLabel) {
      this.objectiveCountLabel.string = `${cleared} / ${target}`
    }
  }

  private _updateMovesLabel(movesRemaining: number): void {
    if (!this.movesLabel) return
    this.movesLabel.string = String(movesRemaining)

    // Warn player when running low on moves (≤ 5)
    if (movesRemaining <= 5 && movesRemaining > 0) {
      this.movesLabel.color = new Color(224, 90, 74, 255)  // system_error
    } else {
      this.movesLabel.color = new Color(61, 53, 48, 255)   // neutral_text
    }
  }

  // -------------------------------------------------------------------------
  // Pause / Shop
  // -------------------------------------------------------------------------

  private _onShop(): void {
    director.loadScene('ShopScene')
  }

  private _onPause(): void {
    const pauseMenuNode = director.getScene()?.getChildByName('PauseMenu')
    if (pauseMenuNode) {
      pauseMenuNode.active = true
    }
    this._sessionEventTarget?.on?.(GAME_SESSION_EVENT.PAUSED, () => {}, this)
  }

  // -------------------------------------------------------------------------
  // Listener management
  // -------------------------------------------------------------------------

  private _detachListeners(): void {
    this._comboTracker?.off(COMBO_EVENT.COMBO_CHANGED, this._onComboChanged, this)
    this._sessionEventTarget?.off(GAME_SESSION_EVENT.STATE_CHANGED, this._onSessionStateChanged, this)
  }
}
