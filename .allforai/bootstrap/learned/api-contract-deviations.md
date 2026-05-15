## [2026-05-14] glow-island implement round

### Discovery — Backend API contract differs from node-spec assumptions

Node-specs were written with assumed API shapes that differed from the actual implementation:

- **Auth endpoint** (`POST /v1/auth/anonymous`) requires `platform` field (`ios` | `android` | `taptap`) — omitting it returns 400
- **Cloud save** uses `PUT /v1/save/:playerId` (not `POST /v1/save`); requires `client_updated_at` timestamp; body uses structured fields (`currency`, `materials`, `chapter_progress`) not a flat `save_data` blob
- **IAP SKUs** are named `small_pack`, `medium_pack`, `large_pack`, `mega_pack`, `monthly_card`, `starter_pack` — not `glowstone_50` style product IDs

### Source
- Discovered during: runtime-smoke-verify, demo-forge
- Severity: low (backend is correct, node-specs had wrong assumptions)

### Fix for future node-specs
When writing node-specs for runtime-smoke or demo-forge, grep actual route files first:
```bash
grep -rn "router\.\|fastify\.\|app\." backend/src/routes/ | head -30
```

## [2026-05-15] glow-island code-repair-loop round

### Discovery — SKU catalog drift between client catalog and backend config

- **monthly_card SKU**: Client ShopScene catalog listed `sku_id='monthly_card'` with platform product IDs, but backend SKU_CONFIG had replaced it with `glowstone_chest` (a non-subscription direct consumable). Result: any purchase attempt returned INVALID_SKU 400.
- **Analytics routes**: Client AnalyticsService POSTs to `/analytics/events` and CrashService POSTs to `/analytics/crashes`, but these routes were never added to the backend. Both are fire-and-forget; absence causes silent 404s in production.

### Source
- Discovered during: quality-checks (deadhunt + fieldcheck)
- Severity: high (monthly_card purchase completely broken)

### Fix pattern
When a new SKU type is planned (subscription vs consumable), always update BOTH client catalog and backend SKU_CONFIG atomically. When adding a client analytics/crash service, add a corresponding backend stub route simultaneously.
