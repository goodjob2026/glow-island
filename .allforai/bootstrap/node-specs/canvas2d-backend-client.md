---
node_id: canvas2d-backend-client
node: canvas2d-backend-client
goal: "实现 ApiClient.js：匿名登录、云存档同步、IAP 收据提交，离线优先"
capability: canvas2d-engineer
human_gate: false
hard_blocked_by: []
exit_artifacts:
  - "canvas2d-client/www/src/ApiClient.js"
  - "canvas2d-client/www/src/config.js"
---

# canvas2d-backend-client

## Mission

实现离线优先的后端客户端。玩家可在无网络时正常游戏，联网时自动同步。
不依赖任何外部库，纯 fetch + localStorage。

## 后端路由（已存在于 backend/）

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /auth/anonymous | 获取 JWT token |
| PUT  | /save | 上传存档 |
| GET  | /save | 下载存档 |
| POST | /iap | 提交 IAP 收据 |
| POST | /analytics | 上报事件 |

此节点同时创建 `canvas2d-client/www/src/config.js`：
```js
// canvas2d-client/www/src/config.js
export const CONFIG = {
  API_BASE: 'http://localhost:3000',  // 开发环境；生产环境替换为实际域名
  ENV: 'development',                  // 'development' | 'production'
};
```

ApiClient.js import config：
```js
import { CONFIG } from './config.js';
```

## ApiClient.js 接口

```js
export class ApiClient {
  constructor(progressManager)
  
  // 匿名登录：POST /auth/anonymous → 存 JWT 到 localStorage
  // 若已有 token 则跳过
  async init()
  
  // 云存档同步（离线优先）
  // 规则：本地有更新（lastSaved更新）时 push；网络错误时静默失败
  async syncSave()
  
  // 从云端拉取存档（合并策略：取 lastSaved 较新的一份）
  async pullSave()
  
  // IAP 收据提交
  // receipt: Capacitor IAP 插件返回的原始收据字符串
  // 成功后后端返回 { glowstone: N }，写入 progressManager
  async submitIAP(receipt, productId)
  
  // 事件上报（非阻塞，fire-and-forget）
  track(eventName, params = {})
  
  // 内部：带重试的 fetch（最多2次，指数退避）
  async _fetch(method, path, body)
}
```

## 离线优先策略

```js
// syncSave() 实现逻辑
async syncSave() {
  try {
    if (!navigator.onLine) return;       // 离线：直接返回
    const token = this._getToken();
    if (!token) await this.init();       // 还没登录则先登录
    
    const local = this._pm.load();
    const res = await this._fetch('PUT', '/save', local);
    if (res.ok) this._pm.markSynced();
  } catch (e) {
    console.warn('[ApiClient] syncSave failed silently:', e.message);
    // 不向上抛出，不影响游戏
  }
}
```

## JWT 管理

```js
// 存储在 localStorage['glow-island-token']
_getToken()  { return localStorage.getItem('glow-island-token'); }
_setToken(t) { localStorage.setItem('glow-island-token', t); }
```

## ProgressManager 配合修改

ProgressManager 需新增：
```js
// 存档结构新增字段
{
  glowstone: 0,        // 丹青石（硬货币，IAP获取）
  lastSynced: null,    // ISO 时间，上次成功云同步时间
}

markSynced() { this._data.lastSynced = new Date().toISOString(); this.save(); }
addGlowstone(n) { this._data.glowstone += n; this.save(); }
getGlowstone() { return this._data.glowstone || 0; }
```

## 触发时机

| 时机 | 操作 |
|------|------|
| 游戏启动（SceneManager 初始化后） | `apiClient.init()` |
| 关卡完成（ProgressManager.setStars 后）| `apiClient.syncSave()` |
| IAP 购买完成 | `apiClient.submitIAP(receipt, productId)` |
| 返回岛图（GameplayScene.destroy 后）| `apiClient.syncSave()` |

## 验收标准

1. `ApiClient.js` 可 import，构造时不报错
2. 无网络时 `syncSave()` 静默失败，不抛异常，不阻塞游戏
3. `init()` 调用成功后 localStorage 中存在 `glow-island-token`
4. `submitIAP()` 返回的 glowstone 量正确写入 ProgressManager
5. `track()` 调用后 POST /analytics（fire-and-forget，不等响应）
