// PurchaseConfirmPopup.ts — Modal popup for purchase confirmation.
// Single-currency: shows beach_coins amount, no hard currency.
// Success toast: "购买成功，X枚沙滩币已到账"
// Failure toast: "购买失败，请重试（ERROR_CODE）"

import { Component, _decorator, Label, Button, Node, tween, UIOpacity } from 'cc'
import { IAPManager, IAPSku } from './IAPManager'
import { CurrencyDisplay } from './CurrencyDisplay'

const { ccclass, property } = _decorator

const TOAST_VISIBLE_SECONDS = 2.5

@ccclass('PurchaseConfirmPopup')
export class PurchaseConfirmPopup extends Component {
  // -------------------------------------------------------------------------
  // Inspector properties
  // -------------------------------------------------------------------------

  @property(Label)
  productNameLabel: Label | null = null

  /** Shows the beach_coins amount granted by this purchase */
  @property(Label)
  coinsAmountLabel: Label | null = null

  @property(Label)
  priceLabel: Label | null = null

  @property(Button)
  confirmBtn: Button | null = null

  @property(Button)
  cancelBtn: Button | null = null

  /** Spinner / loading indicator — toggled during async purchase */
  @property(Node)
  loadingNode: Node | null = null

  @property(Node)
  toastNode: Node | null = null

  @property(Label)
  toastLabel: Label | null = null

  /**
   * Optional reference to CurrencyDisplay so it refreshes immediately
   * after a successful purchase.
   */
  @property(CurrencyDisplay)
  currencyDisplay: CurrencyDisplay | null = null

  // -------------------------------------------------------------------------
  // Private state
  // -------------------------------------------------------------------------

  private _currentSku: IAPSku | null = null
  private _purchasing: boolean = false

  // -------------------------------------------------------------------------
  // Lifecycle
  // -------------------------------------------------------------------------

  onLoad(): void {
    this.node.active = false

    this.confirmBtn?.node.on(Button.EventType.CLICK, this._onConfirm, this)
    this.cancelBtn?.node.on(Button.EventType.CLICK, this._onCancel, this)

    if (this.loadingNode) this.loadingNode.active = false
    if (this.toastNode) this.toastNode.active = false
  }

  onDestroy(): void {
    this.confirmBtn?.node.off(Button.EventType.CLICK, this._onConfirm, this)
    this.cancelBtn?.node.off(Button.EventType.CLICK, this._onCancel, this)
  }

  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------

  /** Display the popup pre-filled with the given SKU's details. */
  show(sku: IAPSku): void {
    this._currentSku = sku
    this._purchasing = false

    if (this.productNameLabel) {
      this.productNameLabel.string = sku.name
    }

    if (this.coinsAmountLabel) {
      if (sku.sku_id === 'monthly_card') {
        // Monthly card grants ongoing benefit, not a lump sum
        this.coinsAmountLabel.string = '每日沙漏奖励×2（30沙滩币/次）'
      } else {
        this.coinsAmountLabel.string = `${sku.beach_coins} 枚沙滩币`
      }
    }

    if (this.priceLabel) {
      this.priceLabel.string = `¥${sku.price_cny}  ($${sku.price_usd.toFixed(2)})`
    }

    this._setLoading(false)
    if (this.toastNode) this.toastNode.active = false

    this.node.active = true
  }

  hide(): void {
    this.node.active = false
    this._currentSku = null
    this._purchasing = false
  }

  // -------------------------------------------------------------------------
  // Button handlers
  // -------------------------------------------------------------------------

  private async _onConfirm(): Promise<void> {
    if (this._purchasing || !this._currentSku) return
    this._purchasing = true
    this._setLoading(true)

    const sku = this._currentSku
    const platformProductId = this._resolvePlatformProductId(sku)
    const result = await IAPManager.getInstance().purchase(platformProductId, sku)

    this._setLoading(false)
    this._purchasing = false

    if (result.success) {
      this.currencyDisplay?.refresh()

      const coinsText = sku.sku_id === 'monthly_card'
        ? '月卡已激活，每日沙漏奖励翻倍'
        : `购买成功，${result.beachCoins}枚沙滩币已到账`
      this._showToast(coinsText, true)

      this.scheduleOnce(() => { this.hide() }, TOAST_VISIBLE_SECONDS)
    } else {
      const code = result.error ?? 'UNKNOWN'
      this._showToast(`购买失败，请重试（${code}）`, false)
    }
  }

  private _onCancel(): void {
    if (this._purchasing) return
    this.hide()
  }

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  private _setLoading(loading: boolean): void {
    if (this.loadingNode) this.loadingNode.active = loading
    if (this.confirmBtn) this.confirmBtn.interactable = !loading
    if (this.cancelBtn) this.cancelBtn.interactable = !loading
  }

  private _showToast(message: string, success: boolean): void {
    if (this.toastLabel) {
      this.toastLabel.string = message
    }

    const toastNode = this.toastNode
    if (!toastNode) {
      if (success) {
        console.log(`[PurchaseConfirmPopup] ${message}`)
      } else {
        console.warn(`[PurchaseConfirmPopup] ${message}`)
      }
      return
    }

    toastNode.active = true

    const opacity = toastNode.getComponent(UIOpacity) ?? toastNode.addComponent(UIOpacity)
    opacity.opacity = 0

    tween(opacity)
      .to(0.2, { opacity: 255 })
      .delay(TOAST_VISIBLE_SECONDS - 0.4)
      .to(0.2, { opacity: 0 })
      .call(() => { toastNode.active = false })
      .start()
  }

  private _resolvePlatformProductId(sku: IAPSku): string {
    try {
      const { sys } = require('cc') as { sys: { isNative: boolean } }
      if (sys.isNative) return sku.platform_product_ids.ios_appstore
    } catch {
      // no-op
    }
    return sku.platform_product_ids.taptap
  }
}
