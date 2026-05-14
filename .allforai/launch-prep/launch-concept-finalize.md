# Glow Island — Launch Concept Finalize
_Generated: 2026-05-15_

---

## IAP Pricing Rationale

Glow Island uses a **single-currency (Beach Coins) IAP-only model** with four price tiers derived from cross-competitor analysis. The pricing philosophy: be the most transparent economy in the casual tile-connect category.

| Tier ID | Name (EN) | Name (ZH) | Coins | USD | Apple Tier |
|---------|-----------|-----------|-------|-----|------------|
| `com.glowisland.coins_small` | A Handful of Sand | 一抔沙 | 50 | $0.99 | Tier 1 |
| `com.glowisland.coins_medium` | A Handful of Shells | 一把贝壳 | 150 | $2.99 | Tier 3 |
| `com.glowisland.coins_large` | A Basket of Coral | 一篮珊瑚 | 350 | $4.99 | Tier 5 |
| `com.glowisland.coins_xl` | Lighthouse Treasure | 灯塔宝藏 | 800 | $9.99 | Tier 10 |

**Why these price points:**

- **$0.99 (entry)** — Market floor anchored at the entry tier used by Lily's Garden, Onet Connect, and Triple Tile. Covers approximately one continue (+5 steps at 30-coin cost). Low enough for impulse spend; removes the friction of "is this worth it?" for curious players.

- **$2.99 (mid)** — The sweet spot confirmed by Tile Match Sweet ($2.99 ad-block) and Zen Match's Piggy Bank tier. "Best value" perception for committed casual players; covers 2–3 continues. Notable: this is also the price at which players expect a meaningful value jump from the entry tier.

- **$4.99 (large)** — The most common "committed casual" price point across Lily's Garden, June's Journey, and Zen Match. Includes a ~17% bonus over linear $4.99-equivalent scaling from the mid tier to create visible upgrade value. This tier is expected to be the volume seller.

- **$9.99 (XL)** — Universal whale-entry price across all surveyed competitors (Zen Match $9.99 bundle, June's Journey $9.99 pack, Lily's Garden $9.99 pack). Offers a ~30% bonus over linear $4.99 rate. Deliberately stops at $9.99 to avoid the price-sensitivity cliff observed in casual puzzle IAP above this level. No $14.99+ at launch.

**Economy note:** Continue cost is 30 Beach Coins. Post-launch, adjust continue cost in range 25–35 via server config based on conversion data. The hourglass reward (15 coins / 4 hours, or 30 coins with Monthly Card) provides a meaningful free coin drip that reinforces session return without a stamina wall.

---

## Keyword Strategy

**Target keyword string (100 chars):**
```
puzzle,tile,connect,healing,cozy,island,relaxing,onet,mahjong,calm,zen,match,offline,no ads
```

**Rationale by keyword group:**

| Group | Keywords | Source |
|-------|----------|--------|
| Genre core | puzzle, tile, connect, match | Baseline discoverability for the tile-connect category |
| Differentiators | healing, cozy, zen, calm, relaxing | Top positive sentiment across Zen Match, Lily's Garden, Triple Tile reviews; Glow Island's brand promise |
| Intent variants | island, onet, mahjong | "island restore puzzle", "relaxing onet", "mahjong connect story" from keyword_opportunities |
| Value signals | offline, no ads | "tile connect no ads", "calm puzzle offline" — directly addresses top negative complaints across all competitors |

**Notes:**
- "mahjong" captures tile-connect genre searchers who use it loosely as a tile-matching synonym; adds search surface area
- "no ads" as a keyword is high-intent: players actively searching this are pre-qualified for the no-stamina, IAP-only model
- Avoid "lives" or "energy" in keywords — these are brand-negative signals that would attract wrong-fit users

---

## App Store Description Drafts

### English (App Store — up to 4000 chars)

> **Glow Island** is a healing tile-connect puzzle game where you match glowing tiles to restore a sleeping island back to life — no timers, no lives, no pressure, just pure satisfying rhythm.
>
> • NO stamina, NO lives, NO countdown timers — play freely at your own pace, retry any level without penalty
> • 180 hand-crafted puzzles across 6 chapters, each tied to a seasonal island zone that visually transforms as you progress
> • 5 tactical special tiles (Wave, Light Chain, Pierce, Swap, Cascade) create satisfying combo moments and strategic depth
> • Meet warm island residents — a seasoned fisherman, a pottery artisan, a nature guide, and a lighthouse keeper — through an unfolding healing story
> • Zen Mode levels let you relax completely with no step limits — ideal for winding down after a long day
>
> Glow Island is made for the moments when you need to breathe. Whether you have two minutes or two hours, the island is always there — calm, beautiful, and waiting. Connect tiles, feel the rhythm, and watch a forgotten island bloom again. For anyone who has ever wanted a game that truly keeps its promise of relaxation.

**Character count (approx):** ~860 characters. Intentionally lean — the first 255 characters (before "more" truncation on App Store) lead with the core promise and differentiator.

---

### Chinese (App Store — up to 4000 chars)

> **光辉岛**是一款治愈系连连看手游——连接同色图块，积累光能，唤醒那座沉睡的小岛，让它重新发光。
>
> • 无体力、无生命值、无倒计时——想玩就玩，失败无惩罚，随时重试，随时退出
> • 6章×30关，共180个精心设计的关卡，每章对应一个岛屿区域，随进度动态焕新视觉
> • 5种战术特殊图块（光波·光链·穿透·置换·连锁），制造爽快连击时刻与策略深度
> • 遇见温暖的岛屿居民——老渔夫、陶艺工匠、自然向导、灯塔守——在无声叙事中感受温度
> • 禅境模式关卡无步数限制，适合需要彻底放松的你
>
> 光辉岛，为那些需要喘口气的时刻而生。无论你有两分钟还是两小时，小岛永远在那里——安静、美好、等你。连接图块，感受节奏，看着一座被遗忘的小岛重新绽放。献给每一位真正需要放松的你。

**Notes:** The Chinese description mirrors the English structure exactly: hook → 5 bullet features → emotional CTA. "无体力·无生命值·无倒计时" front-loaded because it directly addresses the #1 pain point across Chinese casual puzzle reviews (体力系统 complaints are consistent across Chinese app store reviews of Zen Match equivalents). "在无声叙事中感受温度" positions the narrative as ambient/non-intrusive — the Japanese island aesthetic (輝島, 磯部健三, etc.) resonates strongly with the target 25–40 urban professional demographic outside mainland China.

---

## Screenshot Plan

| # | Scene | EN Headline | ZH Headline | Visual Direction |
|---|-------|-------------|-------------|-----------------|
| 1 | `core-loop-combo` | Connect tiles, feel the rhythm | 连接图块，感受节奏 | Active combo chain in progress, glowing tile path lit up, warm spring beach-dock setting (Ch1). Combo multiplier visible. First impression = satisfying core loop. |
| 2 | `island-restoration` | Restore the glowing island | 唤醒光辉岛 | Before/after visual transformation — left gray/desaturated, right fully blooming. Shows the emotional meta-game payoff that differentiates Glow Island from pure puzzle games. |
| 3 | `npc-dialogue` | Meet warm island residents | 遇见温暖的岛屿居民 | NPC moment: fisherman on dock or artisan in town. Hand-drawn watercolor style, warm color palette. Conveys narrative depth and personality. |
| 4 | `special-tiles` | 5 tactical special tiles | 5种战术特殊图块 | Light Chain or Wave triggering — full-board glow cascade effect. Labels for each special tile type. Signals strategic depth beyond simple matching. |
| 5 | `island-overview` | Your peaceful escape | 你的治愈角落 | Full island map, partially or fully restored zones glowing warmly. Lighthouse lit. Lifestyle feel. The "this is the world you're building" moment. |

**Screenshot production notes:**
- All screenshots should use 6.7-inch iPhone 15 Pro Max resolution (1290×2796px) as primary
- Overlay headline text should use a clean sans-serif (e.g. SF Pro Display or equivalent) at 80–100pt, left-aligned or centered
- Screenshots 1 and 4 are gameplay-focused; screenshots 2, 3, 5 are lifestyle/narrative-focused — this balance reflects the dual-promise positioning (fun puzzle mechanics + emotional restoration story)
- Consider a Preview video as screenshot slot 0: 15–30s showing FTUE opening animation → first combo → small island visual change. This single clip outperforms static screenshots in casual puzzle category conversion.

---

## Positioning Statement (Final)

**EN:** No timers. No lives. On Glow Island, connect tiles and restore a sleeping world at your own pace.

**ZH:** 无倒计时、无体力限制，在光辉小岛上，用连线消除感受治愈节奏。

---

## Inherited Gap Warnings (P0/P1 — must resolve before launch)

| Priority | Gap | Action Required |
|----------|-----|-----------------|
| **P0** | Crash analytics not confirmed (Firebase Crashlytics or equivalent) | Integrate before soft-launch; all top competitors treat crash-free launch as table stakes |
| **P0** | SKStoreReviewRequestAPI (in-app rating prompt) not confirmed | Implement; trigger after level clear + positive outcome, not after failure. Target: 30-day rating volume |
| **P1** | No ad-removal IAP option (competitors: Flow Free $0.99–$2.99 ad-block) | If rewarded ads are introduced post-launch, add a "No Ads" IAP simultaneously |
| **P1** | No daily challenge / streak mechanic | Zen Mode partially addresses this; consider a lightweight daily login reward + daily-unlocked Zen level as Day 1 retention hook |
