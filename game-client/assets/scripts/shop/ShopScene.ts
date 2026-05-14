// ShopScene.ts — Main shop / IAP scene component.
// Dual-currency model: glowstone packs grant 丹青石 (glowstone), starter pack grants 沙滩币.
// Renders IAP product cards, the 沙漏奖励 widget, and delegates
// purchases to PurchaseConfirmPopup → IAPManager.

import { Component, _decorator, Label, Button, Node, Prefab, instantiate, director } from 'cc'
import { CurrencyDisplay } from './CurrencyDisplay'
import { IAPManager, IAPSku } from './IAPManager'
import { PurchaseConfirmPopup } from './PurchaseConfirmPopup'

const { ccclass, property } = _decorator

// ---------------------------------------------------------------------------
// Static SKU catalog (mirrors economy-model.json iap_skus[], single-currency)
// ---------------------------------------------------------------------------
const IAP_SKUS: IAPSku[] = [
  {
    sku_id: 'small_pack',
    name: '一抔沙',
    name_en: 'A Handful of Sand',
    beach_coins: 0,
    glowstone: 60,
    price_cny: 6,
    price_usd: 0.99,
    bonus_items: null,
    purchase_limit: null,
    platform_product_ids: {
      ios_appstore: 'com.glowisland.iap.small_pack',
      google_play: 'com.glowisland.iap.small_pack',
      taptap: 'glowisland_small_pack',
    },
  },
  {
    sku_id: 'medium_pack',
    name: '一把贝壳',
    name_en: 'A Handful of Shells',
    beach_coins: 0,
    glowstone: 200,
    price_cny: 25,
    price_usd: 3.99,
    bonus_items: ['专属图块皮肤×1（随机季节款）'],
    purchase_limit: null,
    platform_product_ids: {
      ios_appstore: 'com.glowisland.iap.medium_pack',
      google_play: 'com.glowisland.iap.medium_pack',
      taptap: 'glowisland_medium_pack',
    },
  },
  {
    sku_id: 'large_pack',
    name: '一篮珊瑚',
    name_en: 'A Basket of Coral',
    beach_coins: 0,
    glowstone: 600,
    price_cny: 68,
    price_usd: 9.99,
    bonus_items: ['限定岛屿装饰件×1', '专属图块皮肤×2'],
    purchase_limit: null,
    platform_product_ids: {
      ios_appstore: 'com.glowisland.iap.large_pack',
      google_play: 'com.glowisland.iap.large_pack',
      taptap: 'glowisland_large_pack',
    },
  },
  {
    sku_id: 'mega_pack',
    name: '满篮礼',
    name_en: 'Lighthouse Bundle',
    beach_coins: 0,
    glowstone: 1400,
    price_cny: 128,
    price_usd: 19.99,
    bonus_items: ['限定岛屿装饰件×2', '专属图块皮肤×3', '限定NPC互动道具×1'],
    purchase_limit: null,
    platform_product_ids: {
      ios_appstore: 'com.glowisland.iap.mega_pack',
      google_play: 'com.glowisland.iap.mega_pack',
      taptap: 'glowisland_mega_pack',
    },
  },
  {
    sku_id: 'monthly_card',
    name: '月卡',
    name_en: 'Moonlight Pass',
    beach_coins: 0,  // monthly card grants 2× hourglass, not a lump sum
    glowstone: 10,   // small glowstone bonus on purchase (matches backend SKU_CONFIG)
    price_cny: 30,
    price_usd: 4.99,
    bonus_items: ['每日沙漏奖励×2（30沙滩币/次）', '专属月光卡图块皮肤×1'],
    purchase_limit: null,
    is_subscription: true,
    subscription_duration_days: 30,
    platform_product_ids: {
      ios_appstore: 'com.glowisland.iap.monthly_card',
      google_play: 'com.glowisland.iap.monthly_card',
      taptap: 'glowisland_monthly_card',
    },
  },
  {
    sku_id: 'starter_pack',
    name: '新玩家礼包',
    name_en: 'New Islander Bundle',
    beach_coins: 500,  // matches backend SKU_CONFIG items: beach_coins quantity 500
    glowstone: 100,    // matches backend SKU_CONFIG glowstone: 100
    price_cny: 18,
    price_usd: 2.99,
    bonus_items: ['专属新玩家装饰件（灯塔小摆件）×1'],
    purchase_limit: 1,
    platform_product_ids: {
      ios_appstore: 'com.glowisland.iap.starter_pack',
      google_play: 'com.glowisland.iap.starter_pack',
      taptap: 'glowisland_starter_pack',
    },
  },
]

// ---------------------------------------------------------------------------
// ProductCard — lightweight view struct wired to Prefab instance children
// ---------------------------------------------------------------------------
interface ProductCardView {
  rootNode: Node
  nameLabel: Label | null
  coinsLabel: Label | null
  priceLabel: Label | null
  bonusLabel: Label | null
  buyButton: Button | null
  /** Hint label for monthly card ("每日x2沙漏 • 剩余 X 天") */
  hintLabel: Label | null
  /** Overlay shown when starter pack is already purchased */
  soldOutNode: Node | null
}

@ccclass('ShopScene')
export class ShopScene extends Component {
  // -------------------------------------------------------------------------
  // Inspector properties
  // -------------------------------------------------------------------------

  @property(CurrencyDisplay)
  currencyDisplay: CurrencyDisplay | null = null

  @property(PurchaseConfirmPopup)
  purchaseConfirmPopup: PurchaseConfirmPopup | null = null

  @property(Button)
  backButton: Button | null = null

  /**
   * Container node for product card children.
   * Attach a Layout component in the editor for grid/list arrangement.
   */
  @property(Node)
  productContainer: Node | null = null

  /**
   * Prefab for a single product card.
   * Expected children by name:
   *   NameLabel     → Label
   *   CoinsLabel    → Label    (beach_coins amount)
   *   PriceLabel    → Label
   *   BonusLabel    → Label
   *   BuyButton     → Button
   *   HintLabel     → Label   (monthly card status hint)
   *   SoldOutNode   → Node    (sold-out overlay for starter pack)
   */
  @property(Prefab)
  productCardPrefab: Prefab | null = null

  // ---------------------------------------------------------------------------
  // Hourglass widget nodes (wire in editor)
  // ---------------------------------------------------------------------------

  /** Root node of the hourglass reward widget */
  @property(Node)
  hourglassWidget: Node | null = null

  /** Label showing time remaining until full, e.g. "3:42:15" */
  @property(Label)
  hourglassTimerLabel: Label | null = null

  /** Claim button — enabled only when hourglass is full */
  @property(Button)
  hourglassClaimButton: Button | null = null

  /** Label on the claim button showing reward amount */
  @property(Label)
  hourglassRewardLabel: Label | null = null

  // -------------------------------------------------------------------------
  // Private state
  // -------------------------------------------------------------------------

  private _cardViews: ProductCardView[] = []
  private _hourglassUpdateInterval: number = 0

  // -------------------------------------------------------------------------
  // Lifecycle
  // -------------------------------------------------------------------------

  onLoad(): void {
    this.backButton?.node.on(Button.EventType.CLICK, this._onBack, this)
    this.hourglassClaimButton?.node.on(Button.EventType.CLICK, this._onHourglassClaim, this)
  }

  start(): void {
    this._buildProductCards()
    this._startHourglassUpdater()
  }

  onDestroy(): void {
    this.backButton?.node.off(Button.EventType.CLICK, this._onBack, this)
    this.hourglassClaimButton?.node.off(Button.EventType.CLICK, this._onHourglassClaim, this)
    clearInterval(this._hourglassUpdateInterval)
  }

  // -------------------------------------------------------------------------
  // Product card construction
  // -------------------------------------------------------------------------

  private _buildProductCards(): void {
    if (!this.productContainer) {
      console.warn('[ShopScene] productContainer not assigned.')
      return
    }

    const iapManager = IAPManager.getInstance()

    for (const sku of IAP_SKUS) {
      // Starter pack: hide entirely if already purchased
      if (sku.sku_id === 'starter_pack' && iapManager.isStarterPackPurchased()) {
        continue
      }
      const cardNode = this._createCardNode(sku)
      this.productContainer.addChild(cardNode)
    }
  }

  private _createCardNode(sku: IAPSku): Node {
    const rootNode: Node = this.productCardPrefab
      ? instantiate(this.productCardPrefab)
      : new Node(`ProductCard_${sku.sku_id}`)

    const view: ProductCardView = {
      rootNode,
      nameLabel: rootNode.getChildByName('NameLabel')?.getComponent(Label) ?? null,
      coinsLabel: rootNode.getChildByName('CoinsLabel')?.getComponent(Label) ?? null,
      priceLabel: rootNode.getChildByName('PriceLabel')?.getComponent(Label) ?? null,
      bonusLabel: rootNode.getChildByName('BonusLabel')?.getComponent(Label) ?? null,
      buyButton: rootNode.getChildByName('BuyButton')?.getComponent(Button) ?? null,
      hintLabel: rootNode.getChildByName('HintLabel')?.getComponent(Label) ?? null,
      soldOutNode: rootNode.getChildByName('SoldOutNode') ?? null,
    }

    this._populateCard(view, sku)
    this._cardViews.push(view)
    return rootNode
  }

  private _populateCard(view: ProductCardView, sku: IAPSku): void {
    const iapManager = IAPManager.getInstance()

    if (view.nameLabel) {
      view.nameLabel.string = sku.name
    }

    // Currency amount display: show glowstone for glowstone packs, beach_coins for others
    if (view.coinsLabel) {
      if (sku.sku_id === 'monthly_card') {
        view.coinsLabel.string = '每日×2沙漏奖励'
      } else if (sku.glowstone > 0 && sku.beach_coins === 0) {
        view.coinsLabel.string = `${sku.glowstone} 丹青石`
      } else if (sku.beach_coins > 0 && sku.glowstone > 0) {
        view.coinsLabel.string = `${sku.beach_coins} 沙滩币 + ${sku.glowstone} 丹青石`
      } else {
        view.coinsLabel.string = `${sku.beach_coins} 沙滩币`
      }
    }

    if (view.priceLabel) {
      view.priceLabel.string = `¥${sku.price_cny}`
    }

    if (view.bonusLabel) {
      if (sku.bonus_items && sku.bonus_items.length > 0) {
        view.bonusLabel.string = sku.bonus_items.join('\n')
        view.bonusLabel.node.active = true
      } else {
        view.bonusLabel.node.active = false
      }
    }

    // Monthly card: show status hint
    if (sku.sku_id === 'monthly_card') {
      const status = iapManager.getMonthlyCardStatus()
      if (view.hintLabel) {
        if (status.active) {
          view.hintLabel.string = `每日×2沙漏 已激活 • 剩余 ${status.daysRemaining} 天`
          view.hintLabel.node.active = true
        } else {
          view.hintLabel.node.active = false
        }
      }
    } else {
      if (view.hintLabel) view.hintLabel.node.active = false
    }

    // Starter pack sold-out overlay
    if (view.soldOutNode) {
      view.soldOutNode.active =
        sku.sku_id === 'starter_pack' && iapManager.isStarterPackPurchased()
    }

    // Buy button
    if (view.buyButton) {
      const isSoldOut =
        sku.sku_id === 'starter_pack' && iapManager.isStarterPackPurchased()
      view.buyButton.interactable = !isSoldOut
      view.buyButton.node.on(Button.EventType.CLICK, () => this._onProductCardClick(sku), this)
    }
  }

  // -------------------------------------------------------------------------
  // Hourglass widget
  // -------------------------------------------------------------------------

  private _startHourglassUpdater(): void {
    this._updateHourglass()
    // Update every second for the countdown timer
    this._hourglassUpdateInterval = setInterval(() => this._updateHourglass(), 1000) as unknown as number
  }

  private _updateHourglass(): void {
    const iapManager = IAPManager.getInstance()
    const state = iapManager.getHourglassState()
    const monthlyCard = iapManager.getMonthlyCardStatus()

    // Update CurrencyDisplay hourglass fill (if it embeds the widget)
    this.currencyDisplay?.updateHourglassFill(state.fillPercent, state.isReady)

    // Update claim button interactability
    if (this.hourglassClaimButton) {
      this.hourglassClaimButton.interactable = state.isReady
    }

    // Update reward label
    if (this.hourglassRewardLabel) {
      const coins = monthlyCard.active ? 30 : 15
      this.hourglassRewardLabel.string = state.isReady
        ? `领取 ${coins} 沙滩币`
        : `${coins} 沙滩币`
    }

    // Update countdown timer label
    if (this.hourglassTimerLabel) {
      if (state.isReady) {
        this.hourglassTimerLabel.string = '已满，可领取！'
      } else {
        this.hourglassTimerLabel.string = this._formatMs(state.msUntilFull)
      }
    }
  }

  private async _onHourglassClaim(): Promise<void> {
    const iapManager = IAPManager.getInstance()
    const monthlyCard = iapManager.getMonthlyCardStatus()

    if (this.hourglassClaimButton) this.hourglassClaimButton.interactable = false

    try {
      const { coins } = await iapManager.claimHourglassReward(monthlyCard.active)
      this.currencyDisplay?.refresh()
      console.log(`[ShopScene] 沙漏领取成功：${coins} 沙滩币`)
    } catch (err) {
      console.warn('[ShopScene] 沙漏领取失败:', err)
    }

    this._updateHourglass()
  }

  /** Format milliseconds as H:MM:SS */
  private _formatMs(ms: number): string {
    const totalSeconds = Math.ceil(ms / 1000)
    const h = Math.floor(totalSeconds / 3600)
    const m = Math.floor((totalSeconds % 3600) / 60)
    const s = totalSeconds % 60
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  // -------------------------------------------------------------------------
  // Product card interaction
  // -------------------------------------------------------------------------

  private _onProductCardClick(sku: IAPSku): void {
    if (!this.purchaseConfirmPopup) {
      console.warn('[ShopScene] purchaseConfirmPopup not assigned.')
      return
    }
    if (this.currencyDisplay && !this.purchaseConfirmPopup.currencyDisplay) {
      this.purchaseConfirmPopup.currencyDisplay = this.currencyDisplay
    }
    this.purchaseConfirmPopup.show(sku)
  }

  private _onBack(): void {
    director.loadScene('IslandMapScene')
  }
}
