// IAPManager.ts — Singleton service for in-app purchases
// Platform strategy:
//   iOS (sys.isNative): mock IAP flow (TODO: integrate Cocos IAP plugin)
//   WebGL/browser sandbox (NODE_ENV !== 'production'): auto-succeed, skip receipt verification
//   Both paths call verifyWithBackend after obtaining receipt

import { sys } from 'cc'
import { ProgressionManager } from '../meta/ProgressionManager'

const API_BASE_URL: string =
  (typeof process !== 'undefined' && process.env && process.env.GLOW_API_BASE_URL) ||
  'http://localhost:3000/v1'

/** Matches the iap_skus[] schema in economy-model.json */
export interface IAPSku {
  sku_id: string
  name: string
  name_en: string
  glowstone_total: number
  price_cny: number
  price_usd: number
  bonus_items: string[] | null
  purchase_limit: number | null
  is_subscription?: boolean
  subscription_duration_days?: number
  platform_product_ids: {
    ios_appstore: string
    google_play: string
    taptap: string
  }
}

export interface PurchaseResult {
  success: boolean
  glowstonesGranted: number
  newBalance: number
  error?: string
}

// -----------------------------------------------------------------
// Backend /iap/verify response shape (from api-spec.json)
// -----------------------------------------------------------------
interface VerifyResponse {
  transaction_id: string
  sku_id: string
  status: 'verified'
  glowstone_granted: number
  items_granted: Array<{ type: string; item_id: string; quantity: number }>
  updated_currency: { beach_coins: number; glowstone: number }
  monthly_card?: { active: boolean; expires_at: string }
}

interface MonthlyCardStatus {
  active: boolean
  daysRemaining: number
}

// Local-storage keys for purchase state
const LS_STARTER_PURCHASED = 'glow_starter_pack_purchased'
const LS_MONTHLY_CARD = 'glow_monthly_card'

interface MonthlyCardRecord {
  active: boolean
  expiresAt: string // ISO date string
}

export class IAPManager {
  private static _instance: IAPManager | null = null

  private constructor() {}

  static getInstance(): IAPManager {
    if (!IAPManager._instance) {
      IAPManager._instance = new IAPManager()
    }
    return IAPManager._instance
  }

  // -----------------------------------------------------------------------
  // Public API
  // -----------------------------------------------------------------------

  /**
   * Initiate purchase flow for a given SKU.
   * iOS: mock native IAP (TODO: integrate Cocos IAP plugin)
   * WebGL/sandbox: auto-succeed without a real store transaction
   */
  async purchase(productId: string, sku: IAPSku): Promise<PurchaseResult> {
    try {
      let receipt: string

      if (sys.isNative) {
        // TODO: Integrate Cocos IAP plugin when available.
        // For now, generate a mock receipt so the backend verify path is exercised.
        receipt = await this._mockNativeIAP(productId)
      } else {
        // WebGL / browser path
        const isSandbox =
          typeof process === 'undefined' ||
          !process.env ||
          process.env.NODE_ENV !== 'production'

        if (isSandbox) {
          receipt = `sandbox_receipt_${productId}_${Date.now()}`
        } else {
          // Production browser: not currently supported — treat as mock
          receipt = `web_receipt_${productId}_${Date.now()}`
        }
      }

      const verified = await this.verifyWithBackend(receipt, productId, sku)
      if (!verified) {
        return { success: false, glowstonesGranted: 0, newBalance: 0, error: 'RECEIPT_INVALID' }
      }

      // After successful verification, read up-to-date balance from ProgressionManager
      const progress = ProgressionManager.getInstance().getCurrentProgress()
      const newBalance = progress.currency.glowstones

      return {
        success: true,
        glowstonesGranted: sku.glowstone_total,
        newBalance,
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      console.error('[IAPManager] purchase error:', message)
      return { success: false, glowstonesGranted: 0, newBalance: 0, error: message }
    }
  }

  /** Returns true when starter pack has been purchased on this device */
  isStarterPackPurchased(): boolean {
    try {
      return localStorage.getItem(LS_STARTER_PURCHASED) === 'true'
    } catch {
      return false
    }
  }

  /** Returns current monthly card status and days remaining */
  getMonthlyCardStatus(): MonthlyCardStatus {
    try {
      const raw = localStorage.getItem(LS_MONTHLY_CARD)
      if (!raw) return { active: false, daysRemaining: 0 }

      const record = JSON.parse(raw) as MonthlyCardRecord
      if (!record.active) return { active: false, daysRemaining: 0 }

      const now = Date.now()
      const expires = new Date(record.expiresAt).getTime()
      if (now >= expires) return { active: false, daysRemaining: 0 }

      const msPerDay = 24 * 60 * 60 * 1000
      const daysRemaining = Math.ceil((expires - now) / msPerDay)
      return { active: true, daysRemaining }
    } catch {
      return { active: false, daysRemaining: 0 }
    }
  }

  // -----------------------------------------------------------------------
  // Private helpers
  // -----------------------------------------------------------------------

  /**
   * Call the backend /iap/verify endpoint.
   * On success, update local ProgressionManager state with granted glowstones.
   * Returns true if the transaction was accepted.
   */
  private async verifyWithBackend(
    receipt: string,
    productId: string,
    sku: IAPSku,
  ): Promise<boolean> {
    const platform = sys.isNative ? 'ios' : 'taptap'

    const body = {
      sku_id: sku.sku_id,
      platform,
      receipt_data: receipt,
      product_id: productId,
    }

    const token = this._getAuthToken()
    const authHeaders: Record<string, string> = token
      ? { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
      : { 'Content-Type': 'application/json' }

    try {
      const res = await fetch(`${API_BASE_URL}/iap/verify`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(body),
      })

      // 409 = duplicate receipt (idempotent — treat as success)
      if (res.status === 409) {
        console.warn('[IAPManager] Duplicate receipt (already processed).')
        return true
      }

      if (!res.ok) {
        const errText = await res.text()
        console.error(`[IAPManager] verifyWithBackend failed: HTTP ${res.status}`, errText)
        return false
      }

      const data = (await res.json()) as VerifyResponse

      // Apply granted currency to local ProgressionManager
      const pm = ProgressionManager.getInstance()
      const progress = pm.getCurrentProgress()
      // Update currency totals from verified backend response
      const glowstoneDelta = data.updated_currency.glowstone - progress.currency.glowstones
      const coinDelta = data.updated_currency.beach_coins - progress.currency.beachCoins
      pm.addCurrency(Math.max(0, coinDelta), Math.max(0, glowstoneDelta))

      // Persist starter pack / monthly card state locally
      if (sku.sku_id === 'starter_pack') {
        localStorage.setItem(LS_STARTER_PURCHASED, 'true')
      }
      if (sku.sku_id === 'monthly_card' && data.monthly_card) {
        const record: MonthlyCardRecord = {
          active: data.monthly_card.active,
          expiresAt: data.monthly_card.expires_at,
        }
        localStorage.setItem(LS_MONTHLY_CARD, JSON.stringify(record))
      }

      return true
    } catch (err) {
      console.error('[IAPManager] verifyWithBackend network error:', err)

      // In sandbox / offline mode, simulate success and apply glowstones locally
      const isSandbox =
        typeof process === 'undefined' ||
        !process.env ||
        process.env.NODE_ENV !== 'production'

      if (isSandbox) {
        console.warn('[IAPManager] Sandbox mode: granting glowstones locally without backend.')
        const pm = ProgressionManager.getInstance()
        pm.addCurrency(0, sku.glowstone_total)

        if (sku.sku_id === 'starter_pack') {
          localStorage.setItem(LS_STARTER_PURCHASED, 'true')
        }
        if (sku.sku_id === 'monthly_card') {
          const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          const record: MonthlyCardRecord = { active: true, expiresAt }
          localStorage.setItem(LS_MONTHLY_CARD, JSON.stringify(record))
        }
        return true
      }

      return false
    }
  }

  /**
   * Mock native IAP flow — returns a fake receipt string.
   * Replace this body with the real Cocos IAP plugin call once available.
   */
  private async _mockNativeIAP(productId: string): Promise<string> {
    // Simulate async store dialog
    await new Promise<void>(resolve => setTimeout(resolve, 500))
    return `mock_native_receipt_${productId}_${Date.now()}`
  }

  /** Read JWT from localStorage (written by ProgressionManager.initAuth) */
  private _getAuthToken(): string {
    try {
      return localStorage.getItem('glow_auth_token') ?? ''
    } catch {
      return ''
    }
  }
}
