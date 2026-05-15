---
node_id: canvas2d-shop-scene
node: canvas2d-shop-scene
goal: "实现商店场景：双货币展示、沙滩币包、Glowstone IAP、Capacitor 支付集成"
capability: canvas2d-engineer
human_gate: false
hard_blocked_by:
  - canvas2d-scene-manager
  - canvas2d-backend-client
  - canvas2d-capacitor-plugins
exit_artifacts:
  - "canvas2d-client/www/src/scenes/ShopScene.js"
---

# canvas2d-shop-scene

## Mission

实现玩家获取更多资源的商店，支持沙滩币（软货币）和丹青石（硬货币/IAP）。
Capacitor 6.x `@capacitor-community/in-app-purchases` 插件处理真实支付，
浏览器端降级为模拟购买（开发调试用）。

## 双货币说明

| 货币 | 名称 | 获取方式 | 用途 |
|------|------|---------|------|
| 沙滩币 | Beach Coins | 通关奖励、沙漏奖励、丹青石兑换 | 续关/重排/预判 |
| 丹青石 | Glowstone | IAP 购买 | 兑换沙滩币（1:5），解锁装饰 |

## IAP 商品（productId）

| productId | 价格 | 内容 |
|-----------|------|------|
| glowstone_pack_small | $0.99 | 60 丹青石 |
| glowstone_pack_medium | $4.99 | 360 丹青石（+60 bonus） |
| glowstone_pack_large | $9.99 | 800 丹青石（+200 bonus） |

## 沙滩币兑换

1 丹青石 = 5 沙滩币（固定汇率）
兑换按钮：`[兑换 50 沙滩币] 消耗 10 丹青石`

## 布局

```
[← 返回]      [商店]
               [沙滩币: 200  丹青石: 0]

┌─────── 丹青石充值 ─────────┐
│  [60石 $0.99]  [420石 $4.99]  [1000石 $9.99]  │
└──────────────────────────────┘

┌─────── 沙滩币兑换 ─────────┐
│  [50币 / 10石]  [150币 / 25石]  [500币 / 80石]  │
└──────────────────────────────┘

┌─────── 沙漏奖励 ──────────┐
│  距下次奖励：3h 22min        │
│  [立即领取]（需已到时间）     │
└──────────────────────────────┘
```

## ShopScene 接口

```js
export class ShopScene {
  constructor(sceneManager, renderer, assets, audio, progress, apiClient)
  
  init(params = {})
  update(dt)
  draw()
  onTap(x, y)
  destroy()
  
  // IAP 购买流程
  async _purchase(productId)
  
  // 沙漏奖励领取
  _claimHourglass()
  
  // 沙滩币兑换
  _exchangeCoins(glowstoneCost, coinReward)
}
```

## IAP 集成（Capacitor）

```js
import { InAppPurchase2 } from '@capacitor-community/in-app-purchases';

async _purchase(productId) {
  try {
    // 浏览器环境降级：直接给 60 stone 用于测试
    if (!window.Capacitor?.isNativePlatform()) {
      this._pm.addGlowstone(60);
      this._showSuccess('测试模式：已获得60丹青石');
      return;
    }
    
    const order = await InAppPurchase2.purchase({ productId });
    // 提交收据到后端验证
    await this._api.submitIAP(order.receipt, productId);
    // 后端验证成功后 addGlowstone 由 submitIAP 内部调用
    this._showSuccess('购买成功！');
  } catch (e) {
    this._showError(e.message || '购买失败，请重试');
  }
}
```

## 沙漏被动奖励

- 每 4 小时可领取一次：10-20 沙滩币（随机）
- 存储在 progress 中：`hourglassLastClaim: "<ISO>"`
- 规则：`Date.now() - lastClaim > 4 * 3600 * 1000` 时可领取
- ShopScene 打开时自动检查并显示"可领取"状态
- 领取动画：沙漏倒转 + 金币飞入 HUD

```js
_claimHourglass() {
  const last = this._pm.getHourglassLastClaim();
  const now = Date.now();
  if (now - last < 4 * 3600 * 1000) return;
  
  const reward = 10 + Math.floor(Math.random() * 11); // 10-20
  this._pm.addCoins(reward);
  this._pm.setHourglassLastClaim(now);
  this._showSuccess(`获得 ${reward} 沙滩币！`);
}
```

ProgressManager 需新增字段：
```js
{
  hourglassLastClaim: 0,  // timestamp ms
}
// 方法：
getHourglassLastClaim() { return this._data.hourglassLastClaim || 0; }
setHourglassLastClaim(ts) { this._data.hourglassLastClaim = ts; this.save(); }
```

## 从岛图打开商店

岛屿地图右上角有"商店"按钮（购物袋图标），点击：
```js
SceneManager.push(ShopScene)
```

## 验收标准

1. `ShopScene.js` 可实例化，显示双货币余额
2. 浏览器模式下购买按钮给出 60 丹青石（测试模式），不崩溃
3. 沙漏奖励：距上次领取 < 4h 时按钮灰色（不可点），≥4h 时可点
4. 沙滩币兑换：扣除正确丹青石，增加正确沙滩币，余额即时更新
5. `destroy()` 清理所有事件监听
