// ShopScene.ts — Main shop / IAP scene component.
// Renders 6 product cards from economy-model.json iap_skus[], handles
// monthly-card and starter-pack special cases, and delegates purchases
// to PurchaseConfirmPopup → IAPManager.

import { Component, _decorator, Label, Button, Node, director, Prefab, instantiate } from 'cc'
import { CurrencyDisplay } from './CurrencyDisplay'
import { IAPManager, IAPSku } from './IAPManager'
import { PurchaseConfirmPopup } from './PurchaseConfirmPopup'

const { ccclass, property } = _decorator

// ---------------------------------------------------------------------------
// Static SKU catalog (mirrors economy-model.json iap_skus[])
// ---------------------------------------------------------------------------
const IAP_SKUS: IAPSku[] = [
  {
    sku_id: 'small_pack',
    name: '一抔沙',
    name_en: 'A Handful of Sand',
    glowstone_total: 6,
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
    glowstone_total: 33,
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
    glowstone_total: 100,
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
    name: '灯塔礼包',
    name_en: 'Lighthouse Bundle',
    glowstone_total: 240,
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
    glowstone_total: 300,
    price_cny: 30,
    price_usd: 4.99,
    bonus_items: ['专属月光卡图块皮肤×1', '月卡持有者专属岛屿装饰品×1'],
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
    glowstone_total: 50,
    price_cny: 18,
    price_usd: 2.99,
    bonus_items: ['专属新玩家装饰件（灯塔小摆件）×1', '沙滩币×300'],
    purchase_limit: 1,
    platform_product_ids: {
      ios_appstore: 'com.glowisland.iap.starter_pack',
      google_play: 'com.glowisland.iap.starter_pack',
      taptap: 'glowisland_starter_pack',
    },
  },
]

// ---------------------------------------------------------------------------
// ProductCard — lightweight view struct wired to the Prefab instance
// ---------------------------------------------------------------------------
interface ProductCardView {
  rootNode: Node
  nameLabel: Label | null
  glowstoneLabel: Label | null
  priceLabel: Label | null
  bonusLabel: Label | null
  buyButton: Button | null
  /** Hint label shown for monthly card ("Daily claim • X days left") */
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
   * Container node that will hold the product card children.
   * In the Cocos scene, add a Layout component to this node for automatic
   * grid/list arrangement.
   */
  @property(Node)
  productContainer: Node | null = null

  /**
   * Prefab for a single product card.
   * Expected child structure (by name):
   *   NameLabel       → Label
   *   GlowstoneLabel  → Label
   *   PriceLabel      → Label
   *   BonusLabel      → Label
   *   BuyButton       → Button
   *   HintLabel       → Label   (monthly card hint)
   *   SoldOutNode     → Node    (overlay for sold-out state)
   */
  @property(Prefab)
  productCardPrefab: Prefab | null = null

  // -------------------------------------------------------------------------
  // Private state
  // -------------------------------------------------------------------------

  private _cardViews: ProductCardView[] = []

  // -------------------------------------------------------------------------
  // Lifecycle
  // -------------------------------------------------------------------------

  onLoad(): void {
    this.backButton?.node.on(Button.EventType.CLICK, this._onBack, this)
  }

  start(): void {
    this._buildProductCards()
  }

  onDestroy(): void {
    this.backButton?.node.off(Button.EventType.CLICK, this._onBack, this)
  }

  // -------------------------------------------------------------------------
  // Card construction
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

  /**
   * Instantiate (or build procedurally) a product card node for the given SKU.
   * If a prefab is assigned use it; otherwise fall back to a bare Node so the
   * component works without a prefab wired in the editor.
   */
  private _createCardNode(sku: IAPSku): Node {
    let rootNode: Node

    if (this.productCardPrefab) {
      rootNode = instantiate(this.productCardPrefab)
    } else {
      rootNode = new Node(`ProductCard_${sku.sku_id}`)
    }

    const view: ProductCardView = {
      rootNode,
      nameLabel: rootNode.getChildByName('NameLabel')?.getComponent(Label) ?? null,
      glowstoneLabel: rootNode.getChildByName('GlowstoneLabel')?.getComponent(Label) ?? null,
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

    // Product name
    if (view.nameLabel) {
      view.nameLabel.string = sku.name
    }

    // Glowstone amount
    if (view.glowstoneLabel) {
      if (sku.sku_id === 'monthly_card') {
        view.glowstoneLabel.string = `${sku.glowstone_total} 丹青石（30天）`
      } else {
        view.glowstoneLabel.string = `${sku.glowstone_total} 丹青石`
      }
    }

    // Price
    if (view.priceLabel) {
      view.priceLabel.string = `¥${sku.price_cny}`
    }

    // Bonus items
    if (view.bonusLabel) {
      if (sku.bonus_items && sku.bonus_items.length > 0) {
        view.bonusLabel.string = sku.bonus_items.join('\n')
        view.bonusLabel.node.active = true
      } else {
        view.bonusLabel.node.active = false
      }
    }

    // Monthly card: show daily-claim hint if already active
    if (sku.sku_id === 'monthly_card') {
      const status = iapManager.getMonthlyCardStatus()
      if (view.hintLabel) {
        if (status.active) {
          view.hintLabel.string = `每日可领取 • 剩余 ${status.daysRemaining} 天`
          view.hintLabel.node.active = true
        } else {
          view.hintLabel.node.active = false
        }
      }
    } else {
      if (view.hintLabel) view.hintLabel.node.active = false
    }

    // Starter pack sold-out overlay (should already be hidden by caller, but guard here)
    if (view.soldOutNode) {
      view.soldOutNode.active =
        sku.sku_id === 'starter_pack' && iapManager.isStarterPackPurchased()
    }

    // Buy button
    if (view.buyButton) {
      const isSoldOut =
        sku.sku_id === 'starter_pack' && iapManager.isStarterPackPurchased()
      view.buyButton.interactable = !isSoldOut

      view.buyButton.node.on(
        Button.EventType.CLICK,
        () => this._onProductCardClick(sku),
        this,
      )
    }
  }

  // -------------------------------------------------------------------------
  // Interaction handlers
  // -------------------------------------------------------------------------

  private _onProductCardClick(sku: IAPSku): void {
    if (!this.purchaseConfirmPopup) {
      console.warn('[ShopScene] purchaseConfirmPopup not assigned.')
      return
    }
    // Wire the popup's currency display if not already set
    if (this.currencyDisplay && !this.purchaseConfirmPopup.currencyDisplay) {
      this.purchaseConfirmPopup.currencyDisplay = this.currencyDisplay
    }
    this.purchaseConfirmPopup.show(sku)
  }

  private _onBack(): void {
    director.loadScene('IslandMapScene')
  }
}
