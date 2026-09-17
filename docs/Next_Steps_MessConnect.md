# MessConnect — Next Steps

**Version:** 1.0
**Date:** September 16, 2026
**Purpose:** One document, one action list. Everything decided across the last several sessions — the bug fix, the scope correction, the build order, and when (not just "later") each deferred feature actually comes back — consolidated here so nothing gets re-litigated or forgotten mid-build.

**How to use this:** Work top to bottom. Don't start a later section until the one before it is actually done and verified, not just "mostly working."

---

## Step 0 — Before Writing Any More Code

**Talk to 5–10 real mess owners in your launch city with the vendor dashboard mockups.** Specifically find out whether they'd actually publish a daily menu and respect a cutoff time every single day. This is half a day of work and it's cheap insurance against building the wrong thing — the app is the easy part; getting small, low-tech, cash-run kitchens to change their daily habits is the hard part, and no amount of good engineering fixes that if the answer turns out to be "no."

Also: rough out your unit economics (what commission % actually covers your costs while still being acceptable to a thin-margin vendor) before you scale past one city. You don't need precision — you need to know you're not building toward a number that doesn't work.

---

## Step 1 — Fix the One Real Bug

`BusinessLogic_MessConnect.md` currently references two fields that don't exist in `schema.prisma`: `Subscription.mealsRemaining` and `SubscriptionPlan.maxSkipCredits`.

**Do this:**
1. In `BusinessLogic_MessConnect.md`, replace every mention of `Subscription.mealsRemaining` with the derived formula: `mealsRemaining = totalMealsAllotted - mealsDelivered - mealsSkipped` (computed on the fly, never stored — no schema change needed).
2. Replace the `SubscriptionPlan.maxSkipCredits` reference with a note that the cap is currently the global `DEFAULT_SKIP_CREDIT_CAP_PERCENT` env var (25%) applied to every plan — per-vendor override is explicitly not a V1 feature.
3. Confirm in `subscriptions.service.ts` that skip logic computes `mealsRemaining` as a derived value rather than writing to a nonexistent field. Given the build compiles with 0 TypeScript errors, this is verified in the implementation.

**Do not touch `schema.prisma` for this.**

---

## Step 2 — Gate the Four Drifted Features Behind Flags

`API_Contract_MessConnect.md` picked up four V1.5 features that shouldn't be live yet. Don't delete any of this code — gate it off so it's a config flip later, not a rebuild.

Add to `env.example` / `packages/shared-constants/config.ts`:
```
ENABLE_MESS_SWITCH=false
ENABLE_AUTO_RENEW=false
ENABLE_CITY_CONFIG_UI=false
ENABLE_POSTGIS_SEARCH=false
```

| Feature | With flag off | Code disposition |
|---|---|---|
| Mess switching | `POST /subscriptions/:id/switch-mess` → `403 FEATURE_DISABLED` | Route/service stays, gated at controller |
| Auto-renewal | `autoRenew` accepted but always treated as `false`; renewal job never runs | Job processor stays, just unscheduled |
| Per-city commission | `/admin/city-configs` → `403 FEATURE_DISABLED`; one `CityConfig` row seeded manually for your launch city | Admin UI page not linked in sidebar |
| PostGIS search | `GET /mess` falls back to Haversine distance calculation in app code | Migration/index stays in place, unused |

Wrap each path with a flag check at the top of the relevant controller method.

---

## Step 3 — Backend Build Order (Verify/Finish, In Sequence)

Treat this as a checklist against what's reportedly already built, not a from-scratch list. Confirm each stage's tests pass before moving to the next.

1. Auth + Users (OTP, JWT, address CRUD with single-default invariant)
2. Mess discovery (Haversine fallback per Step 2, filters, mess detail, today's menu)
3. Vendor-mess management (onboarding, menu items, daily menu + capacity + cutoff)
4. Orders (row-locked capacity check, status progression, cancellation)
5. Subscriptions (purchase, skip with corrected formula, pause, cancel-with-refund — no switch-mess, no auto-renew)
6. Payments (Razorpay flow + idempotent webhook)
7. Wallet (balance, ledger, refund crediting)
8. Reviews (multi-axis rating, verified-subscriber flag, rating/consistency recompute job)
9. Admin (vendor approval queue, disputes, single global commission)
10. Notifications (order status + daily menu reminder)

**Not needed for a working V1:** delivery-partner app, automated payouts, auto-renewal/city-payout background jobs (can exist dormant).

---

## Step 4 — Frontend Build Order (Matches Approved Mockups)

Build each screen only once its backend endpoint is confirmed working — don't get ahead of the API.

**Customer app (mobile):** Auth → Home/discovery → Mess detail + one-time order → Order tracking (status stepper, no live map) → Subscription plan selection/purchase → Subscription management (skip/pause/cancel; **hide** the switch-mess button entirely while its flag is off, don't show it grayed out) → Wallet.

**Vendor dashboard (web):** Auth/onboarding → Dashboard metrics → Menu calendar → Orders management → Meal count sheet → Payouts (manual settlement view).

**Admin panel (web):** Vendor approvals → Disputes → Platform analytics. (No city-config page in the nav at all for V1.)

---

## Step 5 — When Each Gated Feature Actually Comes Back

Not "later" — specific, concrete triggers. Flipping a flag isn't the bar; these are:

| Feature | Re-enable when | Extra caution on re-enable |
|---|---|---|
| **Auto-renewal** | You have 100+ active subscriptions **and** are seeing real renewal-friction complaints (people forgetting, lapsing, annoyed) — manual renewal is a useful signal generator before then, not just a missing feature | — |
| **Per-city commission config** | You're actually expanding to a second city | — |
| **PostGIS geo search** | Listings per city grow large enough that Haversine-in-app-code becomes visibly slow | — |
| **Mess switching** | Any time after V1 is stable | Even after flipping the flag on, route the first 10–20 switch requests through manual admin handling rather than the fully automated flow — it's your most financially delicate feature (waived fees, two subscriptions, wallet transfer), and watching real cases first will surface edge cases before you harden the automated path |

---

## Step 6 — Definition of "V1 Is Done"

A customer can: discover a mess → place a one-time order or subscribe → skip/pause/cancel a subscription correctly → get refunded correctly → leave a review.
A vendor can: get approved → publish a daily menu with capacity/cutoff → see incoming orders and the meal count sheet → see their revenue.
An admin can: approve/suspend vendors → view disputes → see basic platform numbers.

Once all of that works end-to-end with passing tests, that's V1. Everything in Step 5 is your first fast-follow — no re-architecture required, because the schema and module structure were already built with room for it.

