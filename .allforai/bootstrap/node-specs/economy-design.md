---
node: economy-design
exit_artifacts:
  - .allforai/game-design/economy-model.json
  - .allforai/game-design/backend-schema.json
  - .allforai/game-design/api-spec.json
---

# Task: 双货币经济系统设计 + 后端数据库Schema

设计沙滩币/丹青石双货币体系、IAP产品目录、材料经济，并输出PostgreSQL数据库Schema和API规格。

## Context Pull

**必需：**
- 从 `.allforai/game-design/monetization-design.json` 读取IAP产品目录设想
- 从 `.allforai/game-design/progression-curve.json` 读取材料消耗曲线（如果已生成，否则基于关卡设计推算）

## Theory Anchors

- **Sink-Source Model**: 货币产出(Source)必须约等于消耗(Sink)，否则通胀或通缩
- **Dual Currency System**: 软货币（免费获取）和硬货币（付费获取）分离，保护核心体验不被货币化
- **Whale Management**: 80%收入来自20%付费用户，设计高价值商品留住鲸鱼玩家
- **No P2W Commitment**: 付费只买便利和外观，不影响内容访问权

## Guidance

### 双货币设计

**沙滩币（Soft Currency，免费）**
- 产出Source：通关奖励（每关15-50枚，连击/完美通关加成）
- 消耗Sink：材料合成消耗、额外连击动画效果、普通道具购买
- 初始赠送：200枚（新玩家引导）

**丹青石（Hard Currency，付费）**
- 产出：IAP购买、特殊关卡奖励（稀有，每章1-2颗）、签到奖励
- 消耗Sink：续命（+5步 = 10丹青石）、跳过关卡（30丹青石）、特殊装饰、月卡购买
- 原则：核心内容（关卡/章节）不锁付费墙

### IAP产品目录（6个SKU）
| SKU | 名称 | 丹青石数量 | 建议价格 |
|-----|------|-----------|--------|
| small_pack | 一抔沙 | 6颗 | ¥6 |
| medium_pack | 一把贝壳 | 30颗（+3赠送） | ¥25 |
| large_pack | 一篮珊瑚 | 88颗（+12赠送） | ¥68 |
| mega_pack | 灯塔礼包 | 198颗（+42赠送） | ¥128 |
| monthly_card | 月卡 | 每日10颗×30天 | ¥30/月 |
| starter_pack | 新玩家礼包 | 50颗+特殊装饰 | ¥18（限购一次）|

### 材料经济（6章节材料）
| 章节 | 材料名称 | 主要来源关卡 | 修复消耗 |
|------|---------|------------|--------|
| 1 海边 | 浮木/绳索 | 关卡1-X | 浮木×20, 绳索×10 |
| 2 小镇 | 砖块/颜料 | 关卡2-X | 砖块×30, 颜料×15 |
| ... | ... | ... | ... |

### PostgreSQL Schema（backend-schema.json）
核心表设计：
- `players`: id, device_id, created_at, updated_at
- `player_saves`: player_id, chapter_progress (JSONB), currency (JSONB), materials (JSONB), updated_at
- `leaderboard_entries`: player_id, display_name, total_score, chapter_reached, updated_at
- `iap_transactions`: id, player_id, product_id, receipt_data, verified_at, status, amount_cents

### API规格（api-spec.json）
完整的REST API规格，含：
- Endpoint路径和HTTP方法
- 请求体和响应体JSON Schema
- 认证要求（Bearer JWT）
- 错误码规范（4xx/5xx）

## Exit Artifacts

**economy-model.json** — 完整经济模型（货币/IAP/材料/消耗曲线）
**backend-schema.json** — PostgreSQL Schema（含Prisma格式）
**api-spec.json** — REST API规格文档

## Downstream Contract

→ `implement-backend-api` 读取：`backend-schema.json`（Prisma模型定义）和 `api-spec.json`（路由规格）
→ `implement-shop-iap` 读取：`economy-model.json` 的 `iap_skus[]`（商店商品显示数据）
→ `demo-forge` 读取：`economy-model.json` 的 `initial_currency` 和材料初始值，创建测试账户
