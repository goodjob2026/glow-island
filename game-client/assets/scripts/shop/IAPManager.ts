// IAPManager.ts — Singleton service for in-app purchases.
// Single-currency model: all IAP products grant beach_coins only.
// Platform strategy:
//   iOS (sys.isNative): Cocos IAP plugin (ccf.purchaseInApp)
//   WebGL/dev sandbox (NODE_ENV !== 'production'): auto-succeed, grant coins locally
//   Both paths call backend /iap/verify on success

import { sys } from 'cc'
import { ProgressionManager } from '../meta/ProgressionManager'

const API_BASE_URL: string =
  (typeof process !== 'undefined' && process.env && process.env.GLOW_API_BASE_URL) ||
  'http://localhost:3000/v1'

// 沙漏奖励 constants
const HOURGLASS_BASE_COINS = 15          // base reward on claim
const HOURGLASS_MONTHLY_CARD_COINS = 30  // 2× for monthly card holders
const HOURGLASS_FILL_DURATION_MS = 4 * 60 * 60 * 1000  // 4 hours in ms
const LS_HOURGLASS_KEY = 'glow_hourglass_start_ts'

/** Matches the iap_skus[] schema in economy-model.json (single-currency) */
export interface IAPSku {
  sku_id: string
  name: string
  name_en: string
  beach_coins: number
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
  beachCoins: number
  newBalance: number
  error?: string
}

// Backend /iap/verify response
interface VerifyResponse {
  transaction_id: string
  sku_id: string
  status: 'verified'
  beach_coins_granted: number
  items_granted: Array<{ type: string; item_id: string; quantity: number }>
  updated_currency: { beach_coins: number }
  monthly_card?: { active: boolean; expires_at: string }
}

export interface MonthlyCardStatus {
  active: boolean
  daysRemaining: number
}

export interface HourglassState {
  /** 0.0–1.0 fill fraction */
  fillPercent: number
  /** ms until full (0 when already full) */
  msUntilFull: number
  isReady: boolean
}

// Local-storage keys
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
  // Public API — Purchase
  // -----------------------------------------------------------------------

  /**
   * Initiate purchase flow for a given SKU.
   * iOS: uses Cocos IAP plugin (ccf.purchaseInApp).
   * WebGL/sandbox: auto-succeeds and grants beach_coins directly.
   * On success: calls backend /iap/verify then grants beach_coins via ProgressionManager.
   */
  async purchase(productId: string, sku: IAPSku): Promise<PurchaseResult> {
    try {
      let receipt: string

      if (sys.isNative) {
        receipt = await this._nativeIAP(productId)
      } else {
        const isSandbox =
          typeof process === 'undefined' ||
          !process.env ||
          process.env.NODE_ENV !== 'production'

        if (isSandbox) {
          // Dev/sandbox: simulate success, grant directly
          const pm = ProgressionManager.getInstance()
          pm.addCurrency(sku.beach_coins, 0)
          if (sku.sku_id === 'starter_pack') {
            localStorage.setItem(LS_STARTER_PURCHASED, 'true')
          }
          if (sku.sku_id === 'monthly_card') {
            this._persistMonthlyCard(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString())
          }
          const newBalance = pm.getCurrentProgress().currency.beachCoins
          return { success: true, beachCoins: sku.beach_coins, newBalance }
        } else {
          receipt = `web_receipt_${productId}_${Date.now()}`
        }
      }

      const verified = await this._verifyWithBackend(receipt, productId, sku)
      if (!verified) {
        return { success: false, beachCoins: 0, newBalance: 0, error: 'RECEIPT_INVALID' }
      }

      const progress = ProgressionManager.getInstance().getCurrentProgress()
      return {
        success: true,
        beachCoins: sku.beach_coins,
        newBalance: progress.currency.beachCoins,
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      console.error('[IAPManager] purchase error:', message)
      return { success: false, beachCoins: 0, newBalance: 0, error: message }
    }
  }

  // -----------------------------------------------------------------------
  // Public API — Hourglass Reward
  // -----------------------------------------------------------------------

  /** Returns current hourglass fill state based on real-time elapsed since last claim. */
  getHourglassState(): HourglassState {
    const startTs = this._getHourglassStartTs()
    if (startTs === null) {
      // Never claimed / no timer running → treat as immediately full
      return { fillPercent: 1, msUntilFull: 0, isReady: true }
    }
    const elapsed = Date.now() - startTs
    if (elapsed >= HOURGLASS_FILL_DURATION_MS) {
      return { fillPercent: 1, msUntilFull: 0, isReady: true }
    }
    const fillPercent = elapsed / HOURGLASS_FILL_DURATION_MS
    const msUntilFull = HOURGLASS_FILL_DURATION_MS - elapsed
    return { fillPercent, msUntilFull, isReady: false }
  }

  /**
   * Claim the hourglass reward.
   * Validates server-side timestamp, grants 15 or 30 beach_coins, restarts timer.
   * Throws if hourglass is not yet full.
   */
  async claimHourglassReward(hasMonthlyCard: boolean): Promise<{ coins: number }> {
    const state = this.getHourglassState()
    if (!state.isReady) {
      throw new Error('HOURGLASS_NOT_READY')
    }

    const coins = hasMonthlyCard ? HOURGLASS_MONTHLY_CARD_COINS : HOURGLASS_BASE_COINS

    try {
      const token = this._getAuthToken()
      const authHeaders: Record<string, string> = token
        ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
        : { 'Content-Type': 'application/json' }

      const res = await fetch(`${API_BASE_URL}/hourglass/claim`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ has_monthly_card: hasMonthlyCard }),
      })

      if (!res.ok) {
        const errText = await res.text()
        console.error('[IAPManager] claimHourglassReward failed:', res.status, errText)
        // Fall through to local grant on network/server error in non-prod
        throw new Error(`SERVER_ERROR_${res.status}`)
      }

      const data = (await res.json()) as { beach_coins_granted: number }
      const granted = data.beach_coins_granted ?? coins
      ProgressionManager.getInstance().addCurrency(granted, 0)
    } catch (err) {
      // In sandbox/dev, fall back to local grant
      const isSandbox =
        typeof process === 'undefined' ||
        !process.env ||
        process.env.NODE_ENV !== 'production'

      if (isSandbox) {
        console.warn('[IAPManager] Sandbox: granting hourglass reward locally.')
        ProgressionManager.getInstance().addCurrency(coins, 0)
      } else {
        throw err
      }
    }

    // Restart timer regardless of path
    localStorage.setItem(LS_HOURGLASS_KEY, String(Date.now()))
    return { coins }
  }

  // -----------------------------------------------------------------------
  // Public API — State queries
  // -----------------------------------------------------------------------

  isStarterPackPurchased(): boolean {
    try {
      return localStorage.getItem(LS_STARTER_PURCHASED) === 'true'
    } catch {
      return false
    }
  }

  getMonthlyCardStatus(): MonthlyCardStatus {
    try {
      const raw = localStorage.getItem(LS_MONTHLY_CARD)
      if (!raw) return { active: false, daysRemaining: 0 }
      const record = JSON.parse(raw) as MonthlyCardRecord
      if (!record.active) return { active: false, daysRemaining: 0 }
      const now = Date.now()
      const expires = new Date(record.expiresAt).getTime()
      if (now >= expires) return { active: false, daysRemaining: 0 }
      const daysRemaining = Math.ceil((expires - now) / (24 * 60 * 60 * 1000))
      return { active: true, daysRemaining }
    } catch {
      return { active: false, daysRemaining: 0 }
    }
  }

  // -----------------------------------------------------------------------
  // Private helpers
  // -----------------------------------------------------------------------

  /**
   * Call backend /iap/verify.
   * On success, applies granted beach_coins to ProgressionManager.
   */
  private async _verifyWithBackend(
    receipt: string,
    productId: string,
    sku: IAPSku,
  ): Promise<boolean> {
    const platform = sys.isNative ? 'ios' : 'taptap'
    const body = { sku_id: sku.sku_id, platform, receipt_data: receipt, product_id: productId }

    const token = this._getAuthToken()
    const authHeaders: Record<string, string> = token
      ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
      : { 'Content-Type': 'application/json' }

    try {
      const res = await fetch(`${API_BASE_URL}/iap/verify`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(body),
      })

      // 409 = duplicate receipt — idempotent success
      if (res.status === 409) {
        console.warn('[IAPManager] Duplicate receipt, treating as success.')
        return true
      }

      if (!res.ok) {
        console.error(`[IAPManager] verifyWithBackend HTTP ${res.status}:`, await res.text())
        return false
      }

      const data = (await res.json()) as VerifyResponse

      // Apply verified beach_coins balance
      const pm = ProgressionManager.getInstance()
      const progress = pm.getCurrentProgress()
      const coinDelta = data.updated_currency.beach_coins - progress.currency.beachCoins
      pm.addCurrency(Math.max(0, coinDelta), 0)

      if (sku.sku_id === 'starter_pack') {
        localStorage.setItem(LS_STARTER_PURCHASED, 'true')
      }
      if (sku.sku_id === 'monthly_card' && data.monthly_card) {
        this._persistMonthlyCard(data.monthly_card.expires_at)
      }
      return true
    } catch (err) {
      console.error('[IAPManager] verifyWithBackend network error:', err)
      return false
    }
  }

  /**
   * Trigger native IAP via Cocos IAP plugin (ccf.purchaseInApp).
   * Resolves with the receipt string on user confirmation.
   */
  private _nativeIAP(productId: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      // ccf is injected by the Cocos IAP plugin at runtime
      const ccf = (globalThis as Record<string, unknown>)['ccf'] as
        | {
            purchaseInApp: (
              id: string,
              cb: (err: string | null, receipt: string) => void,
            ) => void
          }
        | undefined

      if (!ccf?.purchaseInApp) {
        console.warn('[IAPManager] ccf.purchaseInApp not available — using mock receipt.')
        // Fall back to mock receipt so verify path is still exercised in dev builds
        resolve(`mock_native_receipt_${productId}_${Date.now()}`)
        return
      }

      ccf.purchaseInApp(productId, (err, receipt) => {
        if (err) {
          reject(new Error(err))
        } else {
          resolve(receipt)
        }
      })
    })
  }

  private _persistMonthlyCard(expiresAt: string): void {
    const record: MonthlyCardRecord = { active: true, expiresAt }
    localStorage.setItem(LS_MONTHLY_CARD, JSON.stringify(record))
  }

  private _getHourglassStartTs(): number | null {
    try {
      const raw = localStorage.getItem(LS_HOURGLASS_KEY)
      if (!raw) return null
      const ts = Number(raw)
      return isNaN(ts) ? null : ts
    } catch {
      return null
    }
  }

  private _getAuthToken(): string {
    try {
      return localStorage.getItem('glow_auth_token') ?? ''
    } catch {
      return ''
    }
  }
}
