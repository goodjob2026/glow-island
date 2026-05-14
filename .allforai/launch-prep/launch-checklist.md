# Glow Island — App Store Connect Launch Checklist

**Generated:** 2026-05-15  
**Platform:** iOS App Store

---

## Status Summary

| Field | Value |
|---|---|
| **Overall Launch Status** | **READY** |
| Code P0 Blockers | None — all implemented |
| Compliance Status | manual_review_required (no hard failures) |
| Remaining Work | Manual pre-submission tasks only |

> All P0 code gaps (crash analytics, rating prompt, analytics events, privacy consent) are **already implemented** in the codebase. No new source files are required. The path to submission is entirely manual setup and configuration.

---

## App Store Metadata Summary

| Field | Value |
|---|---|
| App Name (EN) | Glow Island |
| App Name (ZH) | 光辉岛 |
| Subtitle (EN) | Healing Tile Connect |
| Subtitle (ZH) | 治愈系连连看 |
| Category | Games > Puzzle |
| Age Rating | 4+ |
| Contains IAP | Yes |
| ATT Required | No |
| Privacy Policy URL | https://glow-island.vercel.app/privacy |
| Description | Ready (EN + ZH in launch-concept-finalize.json) |
| Keywords | Ready |
| Screenshots | Not yet captured — 5 scenes required |

**Keywords string (EN):**
```
puzzle,tile,connect,healing,cozy,island,relaxing,onet,mahjong,calm,zen,match,offline,no ads
```

---

## IAP Tiers

| SKU (canonical — code format) | Coins | Price | Apple Tier | Name EN | Name ZH |
|---|---|---|---|---|---|
| com.glowisland.iap.small_pack | 50 | $0.99 | Tier 1 | A Handful of Sand | 一抔沙 |
| com.glowisland.iap.medium_pack | 150 | $2.99 | Tier 3 | A Handful of Shells | 一把贝壳 |
| com.glowisland.iap.large_pack | 350 | $4.99 | Tier 5 | A Basket of Coral | 一篮珊瑚 |
| com.glowisland.iap.mega_pack | 800 | $9.99 | Tier 10 | Lighthouse Treasure | 灯塔宝藏 |
| com.glowisland.iap.monthly_card | — | — | — | Monthly Card | — |
| com.glowisland.iap.starter_pack | — | — | — | Starter Pack | — |

> **SKU Reconciliation required:** planning doc (`launch-concept-finalize.json`) uses `com.glowisland.coins_*` format. Code (`ShopScene.ts`, `IAPManager.ts`) uses `com.glowisland.iap.*` format. **Adopt code IDs as canonical** (no code change needed). Update `launch-concept-finalize.json` tier_ids before registering products in App Store Connect.

---

## Screenshot Scene Plan (6.7" iPhone required)

| # | Scene Key | Headline EN | Headline ZH |
|---|---|---|---|
| 1 | core-loop-combo | Connect tiles, feel the rhythm | 连接图块，感受节奏 |
| 2 | island-restoration | Restore the glowing island | 唤醒光辉岛 |
| 3 | npc-dialogue | Meet warm island residents | 遇见温暖的岛屿居民 |
| 4 | special-tiles | 5 tactical special tiles | 5种战术特殊图块 |
| 5 | island-overview | Your peaceful escape | 你的治愈角落 |

---

## Checklist

### Phase 1 — Preparation

- [ ] Unify SKU IDs: adopt `com.glowisland.iap.*` as canonical; update `launch-concept-finalize.json` tier_ids to match; 6 products total (small_pack, medium_pack, large_pack, mega_pack, monthly_card, starter_pack)
- [ ] Deploy Vercel static pages: `/privacy`, `/terms`, `/about` at https://glow-island.vercel.app
- [ ] Add Firebase iOS SDK via CocoaPods: `pod 'Firebase/Crashlytics'` → `pod install` → drop `GoogleService-Info.plist` into Xcode project → call `[FIRApp configure]` in `AppController.mm`
- [ ] Implement Obj-C JSB bridge handler for `request_store_review` command in `AppController.mm` (contract documented in `RatingService.ts` file header)
- [ ] Verify `Info.plist` has no extraneous `NSPrivacyUsageDescription` entries after first iOS Cocos Creator build (Glow Island uses no camera / mic / location)
- [ ] Create App Store Connect app record with correct bundle ID
- [ ] Register all 6 IAP products in App Store Connect under canonical `com.glowisland.iap.*` IDs
- [ ] Fill app name (`光辉岛 / Glow Island`) and subtitle (`治愈系连连看 / Healing Tile Connect`) in App Store Connect
- [ ] Enter keywords string: `puzzle,tile,connect,healing,cozy,island,relaxing,onet,mahjong,calm,zen,match,offline,no ads`
- [ ] Copy EN + ZH app description text from `launch-concept-finalize.json → app_store_metadata.description_en / description_zh`
- [ ] Capture and upload 6.7" iPhone screenshots (5 scenes per screenshot plan above)
- [ ] Fill Privacy Nutrition Label: UUID (device identifier), game progress, purchase history — no ATT popup required
- [ ] Complete age rating questionnaire (4+, no violence / adult content / horror / gambling)
- [ ] Archive iOS build in Xcode (Release scheme)
- [ ] Upload IPA to App Store Connect via Transporter or Xcode Organizer

### Phase 2 — TestFlight

- [ ] Publish build to TestFlight Internal Testing
- [ ] Complete at least 1 full playthrough: Ch1, levels 1-5 (verify core loop, NPC dialogue, island restore animation)
- [ ] Verify all 6 IAP products in Sandbox environment using StoreKit sandbox account
- [ ] Confirm Firebase Crashlytics receives a test crash event from the TestFlight build
- [ ] Confirm `SKStoreReviewRequest` fires after the 5th completed level (RatingService.ts guard: once-per-session + `glow_rating_prompted` localStorage flag)

### Phase 3 — Submit

- [ ] Confirm all P0 code items active: CrashService native Crashlytics path, RatingService Obj-C bridge
- [ ] Confirm all P1 manual items complete: Vercel pages live, SKUs unified, App Store Connect metadata filled, screenshots uploaded
- [ ] Prepare demo account credentials and feature notes for App Store reviewer
- [ ] Submit for App Store review (estimated **1-3 business days**)

### Phase 4 — Go Live

- [ ] Set release date in App Store Connect (manual release or auto-release after approval)
- [ ] Configure App Analytics tracking in App Store Connect
- [ ] Monitor crash-free rate in Firebase Crashlytics dashboard within first 48 hours post-launch
- [ ] Monitor day-1 IAP funnel: `iap_triggered` vs `iap_completed` in AnalyticsService backend

---

## Key Data Reference

### Backend IAP Receipt Validation
- Endpoint: `POST /iap/verify` in `backend/src/routes/iap.ts`
- Includes Apple receipt validation with sandbox auto-fallback and replay attack prevention

### Implemented Code Services (no changes needed)
| Service | File |
|---|---|
| Crash analytics | `game-client/assets/scripts/services/CrashService.ts` |
| Analytics events | `game-client/assets/scripts/services/AnalyticsService.ts` |
| Rating prompt | `game-client/assets/scripts/services/RatingService.ts` |
| Privacy consent gate | `game-client/assets/scripts/ui/PrivacyConsentPopup.ts` |
| App icon (all iOS sizes) | `game-client/native/engine/ios/Images.xcassets/AppIcon.appiconset/` |

---

## Next Immediate Actions (Prioritized)

1. **Reconcile SKU IDs** — decide canonical format (`com.glowisland.iap.*` recommended), update planning doc. Unblocks App Store Connect product registration.
2. **Deploy Vercel pages** (`/privacy`, `/terms`, `/about`) — required by App Store submission. 30-minute task.
3. **Firebase CocoaPods integration** — `pod 'Firebase/Crashlytics'` + `GoogleService-Info.plist` + `[FIRApp configure]` in `AppController.mm`. Activates the already-written `CrashService.ts` native path.
4. **Obj-C bridge for `request_store_review`** — Wire the JSB command in `AppController.mm` per `RatingService.ts` header contract. Activates the already-written rating prompt.
5. **Capture screenshots** — 5 scenes at 6.7" resolution with headline overlays per screenshot plan.
6. **Archive + Upload** — Xcode Release archive → Transporter/Organizer → TestFlight.
7. **Sandbox IAP test + Crashlytics smoke test** — before final submission.
8. **Submit for review.**
