---
node: implement-shop-iap
exit_artifacts:
  - game-client/assets/scripts/shop/ShopScene.ts
  - game-client/assets/scripts/shop/CurrencyDisplay.ts
  - game-client/assets/scripts/shop/IAPManager.ts
  - game-client/assets/scripts/shop/PurchaseConfirmPopup.ts
---

# Task: 商店UI和内购系统实现

## Context Pull

**必需：**
- 从 `.allforai/game-design/economy-model.json` 读取 `iap_skus[]`（商店商品数据：SKU/名称/丹青石数量/价格）
- 从后端 `/iap/verify` 接口规格（在 `.allforai/game-design/api-spec.json` 中）了解验证流程

## Guidance

### ShopScene.ts
- 按 `economy-model.json.iap_skus[]` 渲染商品卡片（6个SKU）
- 月卡显示"每日领取"提示（如已购买则显示剩余天数）
- 新玩家礼包：检查是否已购买，已购买则隐藏
- 点击商品：弹出 PurchaseConfirmPopup

### CurrencyDisplay.ts（可复用组件）
- 显示沙滩币和丹青石余额
- 监听 ProgressionManager 的货币变化事件，实时更新
- 余额减少时播放动画（从旧值滚动到新值）

### IAPManager.ts（平台适配）
```typescript
class IAPManager {
  // iOS：使用Cocos IAP插件（ccf.purchaseInApp）
  // WebGL：降级为模拟沙箱购买（自动成功，仅开发/测试用）
  purchase(productId: string): Promise<PurchaseResult>
  // 购买成功后调用后端 /iap/verify
  private verifyWithBackend(receipt: string, productId: string): Promise<boolean>
}
```

iOS收据获取：
- Cocos IAP插件回调返回 `receipt` 字符串（Base64 AppStore收据）
- 直接传给后端 /iap/verify

WebGL降级逻辑：
- `NODE_ENV !== 'production'` 时：模拟购买成功，跳过收据验证，直接增加货币
- 生产环境WebGL可接入第三方支付（如支付宝/微信）— 留为TODO

### PurchaseConfirmPopup.ts
- 显示：商品名称/丹青石数量/价格
- 按钮：确认购买 / 取消
- 购买中：禁用按钮，显示Loading
- 购买成功：更新CurrencyDisplay + Toast "购买成功，X丹青石已到账"
- 购买失败：Toast "购买失败，请重试" + 错误码（方便排查）

## Exit Artifacts

4个 TypeScript 文件

## Downstream Contract

→ `stitch-game-client` 读取：IAPManager.purchase() 调用路径（验证ShopScene正确调用）、货币更新事件（验证CurrencyDisplay正确响应）
