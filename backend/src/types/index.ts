// ============================================================
// Glow Island — Shared TypeScript Types
// ============================================================

export interface JwtPayload {
  player_id: string
  device_id: string
  platform: string
  iat?: number
  exp?: number
}

export interface CurrencyData {
  beach_coins: number
  glowstone: number
}

export interface MaterialsData {
  driftwood: number
  tropical_flower: number
  coral_fragment: number
  starfish: number
  ancient_tile: number
  moonlight_crystal: number
}

export interface MonthlyCardData {
  active: boolean
  expires_at: string | null
  last_claimed_date: string | null
  purchased_at?: string
  days_claimed?: number
  transaction_id?: string
}

export interface SettingsData {
  sfx: boolean
  music: boolean
  notifications: boolean
}

export interface ChapterProgressEntry {
  status: 'locked' | 'in_progress' | 'completed'
  stars_earned?: number[]
  highest_level?: number
  materials_earned?: number
  repair_progress?: Record<string, unknown>
}

export type ChapterProgressData = Record<string, ChapterProgressEntry>

export interface SaveData {
  player_id: string
  chapter_progress: ChapterProgressData
  currency: CurrencyData
  materials: MaterialsData
  boosters: Record<string, unknown>
  decorations: Record<string, unknown>
  monthly_card: MonthlyCardData
  settings: SettingsData
  updated_at: string
}

export interface LeaderboardEntryRow {
  rank: number
  player_id: string
  display_name: string
  total_score: number
  chapter_reached: number
  highest_level: number
  updated_at: string
}

export interface IapSkuConfig {
  product_id: string
  amount_cents: number
  glowstone: number
  items: Array<{ type: string; item_id: string; quantity: number }>
  is_monthly_card: boolean
  is_starter_pack: boolean
}

export type Platform = 'ios' | 'android' | 'taptap'

export const SKU_CONFIG: Record<string, IapSkuConfig> = {
  small_pack: {
    product_id: 'com.glowisland.iap.small_pack',
    amount_cents: 600,
    glowstone: 60,
    items: [],
    is_monthly_card: false,
    is_starter_pack: false,
  },
  medium_pack: {
    product_id: 'com.glowisland.iap.medium_pack',
    amount_cents: 1800,
    glowstone: 200,
    items: [],
    is_monthly_card: false,
    is_starter_pack: false,
  },
  large_pack: {
    product_id: 'com.glowisland.iap.large_pack',
    amount_cents: 4800,
    glowstone: 600,
    items: [],
    is_monthly_card: false,
    is_starter_pack: false,
  },
  mega_pack: {
    product_id: 'com.glowisland.iap.mega_pack',
    amount_cents: 9800,
    glowstone: 1400,
    items: [],
    is_monthly_card: false,
    is_starter_pack: false,
  },
  monthly_card: {
    product_id: 'com.glowisland.iap.monthly_card',
    amount_cents: 3000,
    glowstone: 10,
    items: [{ type: 'monthly_card', item_id: 'monthly_card', quantity: 1 }],
    is_monthly_card: true,
    is_starter_pack: false,
  },
  starter_pack: {
    product_id: 'com.glowisland.iap.starter_pack',
    amount_cents: 1200,
    glowstone: 100,
    items: [
      { type: 'currency', item_id: 'beach_coins', quantity: 500 },
      { type: 'booster', item_id: 'rainbow_block', quantity: 2 },
    ],
    is_monthly_card: false,
    is_starter_pack: true,
  },
}
