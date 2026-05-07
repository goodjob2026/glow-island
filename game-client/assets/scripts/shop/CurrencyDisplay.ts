// CurrencyDisplay.ts — Reusable HUD component showing beach coins + glowstones.
// Listens to ProgressionManager for currency changes and animates value transitions
// with a 0.4s count-up roll effect.

import { Component, _decorator, Label, tween, Tween } from 'cc'
import { ProgressionManager } from '../meta/ProgressionManager'

const { ccclass, property } = _decorator

// ProgressionManager does not yet emit events, so we poll each frame.
// When an event bus is added, swap the update() polling for an event listener.
const POLL_INTERVAL_FRAMES = 6   // re-check every 6 frames (~0.1 s at 60 fps)
const ROLL_DURATION = 0.4         // seconds for the count-up animation

@ccclass('CurrencyDisplay')
export class CurrencyDisplay extends Component {
  // -------------------------------------------------------------------------
  // Inspector properties
  // -------------------------------------------------------------------------

  @property(Label)
  beachCoinLabel: Label | null = null

  @property(Label)
  glowstoneLabel: Label | null = null

  // -------------------------------------------------------------------------
  // Private state
  // -------------------------------------------------------------------------

  private _displayedCoins: number = 0
  private _displayedGlowstones: number = 0

  private _targetCoins: number = 0
  private _targetGlowstones: number = 0

  private _coinTween: Tween<{ v: number }> | null = null
  private _glowstoneTween: Tween<{ v: number }> | null = null

  private _frameCounter: number = 0

  // -------------------------------------------------------------------------
  // Lifecycle
  // -------------------------------------------------------------------------

  onLoad(): void {
    // Snapshot current values immediately so the first frame shows real data
    const currency = ProgressionManager.getInstance().getCurrentProgress().currency
    this._displayedCoins = currency.beachCoins
    this._displayedGlowstones = currency.glowstones
    this._targetCoins = currency.beachCoins
    this._targetGlowstones = currency.glowstones
    this._renderLabels()
  }

  update(_dt: number): void {
    this._frameCounter++
    if (this._frameCounter < POLL_INTERVAL_FRAMES) return
    this._frameCounter = 0

    const currency = ProgressionManager.getInstance().getCurrentProgress().currency

    if (currency.beachCoins !== this._targetCoins) {
      this._animateCoinChange(this._displayedCoins, currency.beachCoins)
      this._targetCoins = currency.beachCoins
    }

    if (currency.glowstones !== this._targetGlowstones) {
      this._animateGlowstoneChange(this._displayedGlowstones, currency.glowstones)
      this._targetGlowstones = currency.glowstones
    }
  }

  onDestroy(): void {
    this._coinTween?.stop()
    this._glowstoneTween?.stop()
  }

  // -------------------------------------------------------------------------
  // Public — force an immediate refresh (call after a purchase)
  // -------------------------------------------------------------------------

  refresh(): void {
    const currency = ProgressionManager.getInstance().getCurrentProgress().currency
    if (currency.beachCoins !== this._targetCoins) {
      this._animateCoinChange(this._displayedCoins, currency.beachCoins)
      this._targetCoins = currency.beachCoins
    }
    if (currency.glowstones !== this._targetGlowstones) {
      this._animateGlowstoneChange(this._displayedGlowstones, currency.glowstones)
      this._targetGlowstones = currency.glowstones
    }
  }

  // -------------------------------------------------------------------------
  // Animation helpers
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

  private _animateGlowstoneChange(from: number, to: number): void {
    this._glowstoneTween?.stop()
    const obj = { v: from }
    this._glowstoneTween = tween(obj)
      .to(ROLL_DURATION, { v: to }, {
        easing: 'cubicOut',
        onUpdate: () => {
          this._displayedGlowstones = Math.round(obj.v)
          if (this.glowstoneLabel) {
            this.glowstoneLabel.string = this._formatNumber(this._displayedGlowstones)
          }
        },
      })
      .call(() => {
        this._displayedGlowstones = to
        if (this.glowstoneLabel) {
          this.glowstoneLabel.string = this._formatNumber(to)
        }
      })
      .start()
  }

  private _renderLabels(): void {
    if (this.beachCoinLabel) {
      this.beachCoinLabel.string = this._formatNumber(this._displayedCoins)
    }
    if (this.glowstoneLabel) {
      this.glowstoneLabel.string = this._formatNumber(this._displayedGlowstones)
    }
  }

  /** Format large numbers with commas: 1234 → "1,234" */
  private _formatNumber(n: number): string {
    return n.toLocaleString('en-US')
  }
}
