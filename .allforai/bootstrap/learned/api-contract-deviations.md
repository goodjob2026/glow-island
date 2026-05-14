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
