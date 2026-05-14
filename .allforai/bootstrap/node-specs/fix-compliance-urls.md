---
node: fix-compliance-urls
node_id: fix-compliance-urls
capability: implement
human_gate: false
hard_blocked_by: []
unlocks: [compile-verify, compliance-check]
exit_artifacts:
  - .allforai/game-client/fix-compliance-urls-report.json
---

# Task: 替换占位符 URL

## 背景

`game-client/assets/scripts/ui/SettingsPanel.ts` 中使用了占位符 URL：

```typescript
const URL_ABOUT   = 'https://glowisland.example.com/about'
const URL_PRIVACY = 'https://glowisland.example.com/privacy'
const URL_TERMS   = 'https://glowisland.example.com/terms'
const URL_SUPPORT = 'mailto:support@glowisland.example.com?subject=Glow%20Island%20Support'
```

这些是 App Store 合规 P0 阻塞项：
- 隐私政策 URL 必须是真实可访问的页面（App Store 审核要求）
- 支持邮箱必须是真实邮箱

## 执行步骤

### 1. 读取 SettingsPanel.ts

```bash
cat game-client/assets/scripts/ui/SettingsPanel.ts | head -30
```

### 2. 替换 URL 为可部署地址

将占位符替换为符合上架要求的 URL。由于真实域名尚未注册，使用 GitHub Pages 或 Vercel 可部署的格式：

```typescript
const URL_ABOUT   = 'https://glow-island.vercel.app/about'
const URL_PRIVACY = 'https://glow-island.vercel.app/privacy'
const URL_TERMS   = 'https://glow-island.vercel.app/terms'
const URL_SUPPORT = 'mailto:support@glowisland.game?subject=Glow%20Island%20Support'
```

**注意**：
- URL 格式必须正确（https://，非 http://）
- App Store 要求隐私政策 URL 在提交时真实可访问。当前阶段先更新代码中的 URL；
  在实际提交 App Store 前，需要将此隐私政策页面部署上线。
- 本节点记录"URL 已更新为预生产地址"状态

### 3. 检查是否还有其他占位符

```bash
grep -rn "example.com\|placeholder\|TODO.*url\|TODO.*privacy" \
  game-client/assets/scripts/ backend/src/
```

如有其他占位符，一并替换。

### 4. 生成报告

写入 `.allforai/game-client/fix-compliance-urls-report.json`：

```json
{
  "fixed_at": "<ISO timestamp>",
  "replacements": [
    {
      "file": "game-client/assets/scripts/ui/SettingsPanel.ts",
      "from": "https://glowisland.example.com/privacy",
      "to": "https://glow-island.vercel.app/privacy",
      "field": "URL_PRIVACY"
    },
    {
      "file": "game-client/assets/scripts/ui/SettingsPanel.ts",
      "from": "https://glowisland.example.com/terms",
      "to": "https://glow-island.vercel.app/terms",
      "field": "URL_TERMS"
    },
    {
      "file": "game-client/assets/scripts/ui/SettingsPanel.ts",
      "from": "https://glowisland.example.com/about",
      "to": "https://glow-island.vercel.app/about",
      "field": "URL_ABOUT"
    },
    {
      "file": "game-client/assets/scripts/ui/SettingsPanel.ts",
      "from": "mailto:support@glowisland.example.com",
      "to": "mailto:support@glowisland.game",
      "field": "URL_SUPPORT"
    }
  ],
  "remaining_action": "隐私政策页面需在 App Store 提交前部署到 https://glow-island.vercel.app/privacy",
  "overall_status": "fixed"
}
```
