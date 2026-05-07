// PurchaseConfirmPopup.ts — Modal popup for purchase confirmation.
// Shows product details, handles the purchase flow, and displays result toasts.

import { Component, _decorator, Label, Button, Node, tween, UIOpacity } from 'cc'
import { IAPManager, IAPSku } from './IAPManager'
import { CurrencyDisplay } from './CurrencyDisplay'

const { ccclass, property } = _decorator

// Duration the success / failure toast is visible
const TOAST_VISIBLE_SECONDS = 2.5

@ccclass('PurchaseConfirmPopup')
export class PurchaseConfirmPopup extends Component {
  // -------------------------------------------------------------------------
  // Inspector properties
  // -------------------------------------------------------------------------

  @property(Label)
  productNameLabel: Label | null = null

  @property(Label)
  glowstoneAmountLabel: Label | null = null

  @property(Label)
  priceLabel: Label | null = null

  @property(Button)
  confirmBtn: Button | null = null

  @property(Button)
  cancelBtn: Button | null = null

  /** Spinner / loading indicator node — toggled during async purchase */
  @property(Node)
  loadingNode: Node | null = null

  /** Optional toast label node (shown briefly after result) */
  @property(Node)
  toastNode: Node | null = null

  @property(Label)
  toastLabel: Label | null = null

  /**
   * Optional reference to a CurrencyDisplay in the scene so it can be
   * refreshed immediately after a successful purchase.
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
    // Popup starts hidden
    this.node.active = false

    // Wire buttons
    this.confirmBtn?.node.on(Button.EventType.CLICK, this._onConfirm, this)
    this.cancelBtn?.node.on(Button.EventType.CLICK, this._onCancel, this)

    // Hide loading and toast states initially
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

    // Populate labels
    if (this.productNameLabel) {
      this.productNameLabel.string = sku.name
    }
    if (this.glowstoneAmountLabel) {
      this.glowstoneAmountLabel.string = `${sku.glowstone_total} 丹青石`
    }
    if (this.priceLabel) {
      // Show CNY with USD fallback
      this.priceLabel.string = `¥${sku.price_cny}  ($${sku.price_usd.toFixed(2)})`
    }

    // Reset interactive state
    this._setLoading(false)
    if (this.toastNode) this.toastNode.active = false

    this.node.active = true
  }

  /** Programmatically hide the popup (e.g., called by parent scene). */
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
      // Refresh the currency bar immediately
      this.currencyDisplay?.refresh()

      const msg = `购买成功，${result.glowstonesGranted}丹青石已到账`
      this._showToast(msg, true)

      // Close popup after the toast is read
      this.scheduleOnce(() => {
        this.hide()
      }, TOAST_VISIBLE_SECONDS)
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
      // Fallback to console if no toast node is wired up
      if (success) {
        console.log(`[PurchaseConfirmPopup] ${message}`)
      } else {
        console.warn(`[PurchaseConfirmPopup] ${message}`)
      }
      return
    }

    toastNode.active = true

    // Fade in → hold → fade out
    const opacity = toastNode.getComponent(UIOpacity) ?? toastNode.addComponent(UIOpacity)
    opacity.opacity = 0

    tween(opacity)
      .to(0.2, { opacity: 255 })
      .delay(TOAST_VISIBLE_SECONDS - 0.4)
      .to(0.2, { opacity: 0 })
      .call(() => {
        toastNode.active = false
      })
      .start()
  }

  /** Pick the right platform product ID from the SKU */
  private _resolvePlatformProductId(sku: IAPSku): string {
    // Cocos sys.isNative covers iOS; for web/TapTap fall through to taptap id
    try {
      // Dynamic import check — sys may be available at runtime
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { sys } = require('cc') as { sys: { isNative: boolean } }
      if (sys.isNative) return sku.platform_product_ids.ios_appstore
    } catch {
      // no-op
    }
    return sku.platform_product_ids.taptap
  }
}
