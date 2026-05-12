// CurrencyDisplay.ts — HUD component showing 沙滩币 balance (single currency).
// Polls ProgressionManager for changes and animates balance transitions
// with a 0.4s count-up roll effect.
// Optionally renders hourglass fill state via updateHourglassFill().

import { Component, _decorator, Label, Node, ProgressBar, tween, Tween } from 'cc'
import { ProgressionManager } from '../meta/ProgressionManager'

const { ccclass, property } = _decorator

const POLL_INTERVAL_FRAMES = 6  // re-check every 6 frames (~0.1 s at 60 fps)
const ROLL_DURATION = 0.4       // seconds for the count-up animation

@ccclass('CurrencyDisplay')
export class CurrencyDisplay extends Component {
  // -------------------------------------------------------------------------
  // Inspector properties
  // -------------------------------------------------------------------------

  @property(Label)
  beachCoinLabel: Label | null = null

  /**
   * Optional hourglass fill bar.
   * If assigned, updateHourglassFill() drives its progress property (0–1).
   */
  @property(ProgressBar)
  hourglassFillBar: ProgressBar | null = null

  /**
   * Optional node shown/hidden based on hourglass ready state.
   * E.g. a glowing ring or "领取" indicator.
   */
  @property(Node)
  hourglassReadyIndicator: Node | null = null

  // -------------------------------------------------------------------------
  // Private state
  // -------------------------------------------------------------------------

  private _displayedCoins: number = 0
  private _targetCoins: number = 0
  private _coinTween: Tween<{ v: number }> | null = null
  private _frameCounter: number = 0

  // -------------------------------------------------------------------------
  // Lifecycle
  // -------------------------------------------------------------------------

  onLoad(): void {
    const coins = ProgressionManager.getInstance().getCurrentProgress().currency.beachCoins
    this._displayedCoins = coins
    this._targetCoins = coins
    this._renderLabel()
  }

  update(_dt: number): void {
    this._frameCounter++
    if (this._frameCounter < POLL_INTERVAL_FRAMES) return
    this._frameCounter = 0

    const coins = ProgressionManager.getInstance().getCurrentProgress().currency.beachCoins
    if (coins !== this._targetCoins) {
      this._animateCoinChange(this._displayedCoins, coins)
      this._targetCoins = coins
    }
  }

  onDestroy(): void {
    this._coinTween?.stop()
  }

  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------

  /** Force an immediate refresh — call after a purchase or reward grant. */
  refresh(): void {
    const coins = ProgressionManager.getInstance().getCurrentProgress().currency.beachCoins
    if (coins !== this._targetCoins) {
      this._animateCoinChange(this._displayedCoins, coins)
      this._targetCoins = coins
    }
  }

  /**
   * Update the hourglass fill indicator.
   * @param fillPercent 0.0–1.0 fill fraction
   * @param isReady     true when hourglass is full and reward is claimable
   */
  updateHourglassFill(fillPercent: number, isReady: boolean): void {
    if (this.hourglassFillBar) {
      this.hourglassFillBar.progress = Math.max(0, Math.min(1, fillPercent))
    }
    if (this.hourglassReadyIndicator) {
      this.hourglassReadyIndicator.active = isReady
    }
  }

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  private _animateCoinChange(from: number, to: number): void {
    this._coinTween?.stop()
    const obj = { v: from }
    this._coinTween = tween(obj)
      .to(ROLL_DURATION, { v: to }, {
        easing: 'cubicOut',
        onUpdate: () => {
          this._displayedCoins = Math.round(obj.v)
          if (this.beachCoinLabel) {
            this.beachCoinLabel.string = this._formatNumber(this._displayedCoins)
          }
        },
      })
      .call(() => {
        this._displayedCoins = to
        if (this.beachCoinLabel) {
          this.beachCoinLabel.string = this._formatNumber(to)
        }
      })
      .start()
  }

  private _renderLabel(): void {
    if (this.beachCoinLabel) {
      this.beachCoinLabel.string = this._formatNumber(this._displayedCoins)
    }
  }

  /** Format large numbers with commas: 1234 → "1,234" */
  private _formatNumber(n: number): string {
    return n.toLocaleString('en-US')
  }
}
