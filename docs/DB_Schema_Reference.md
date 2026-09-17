# MessConnect — Database Schema Reference

**Version:** 1.0
**Date:** September 15, 2026
**Companion file:** `schema.prisma` (the actual, working schema — validated with zero errors using Prisma's schema parser: 20 models, 12 enums, all relations resolved correctly)

**Document Overview:** Use `schema.prisma` as the canonical schema definition, and use this markdown document as the explanation layer: what each table is for, how tables connect, and — most importantly — the business rules that the schema *cannot* enforce by itself and that must be written into the application code correctly.

---

## 1. Design Principles Behind This Schema

1. **One unified `Order` table** covers both one-time orders *and* individual subscription meal deliveries (distinguished by `orderType`). This avoids duplicating payment, delivery, and review logic across two separate tables — a common source of bugs when subscription meals and one-time orders are modeled separately.
2. **Every ID is a UUID string**, not an auto-incrementing integer — safer for a public-facing API (no sequential ID guessing) and simpler for distributed systems later.
3. **Money fields use `Decimal(10,2)`**, never `Float` — floating point must never be used for currency, as it introduces rounding errors that compound over thousands of transactions.
4. **Dates vs. Timestamps are distinguished deliberately**: fields like `Subscription.startDate` use `@db.Date` (calendar date only, no time), while `createdAt`/`updatedAt` use full `DateTime` — this avoids timezone-related off-by-one-day bugs in subscription/menu logic.
5. **Geolocation uses plain `Float` lat/lng columns** in the core schema (not a PostGIS geography type) so that Prisma Client can read/write them with zero friction. A **separate, optional PostGIS supplement** (Section 5 below) adds fast radius-search capability without complicating the main schema or basic ORM queries.

---

## 2. Entity Overview (What Each Table Is For)

| Table | Purpose |
|---|---|
| `User` | Every person on the platform — customer, vendor, delivery partner, or admin — distinguished by `role`. |
| `Address` | Saved delivery addresses for a customer (home, hostel, PG, office). |
| `Mess` | A vendor's mess profile — one per vendor `User` (enforced by `ownerId` being unique). |
| `MenuItem` | A single dish/thali a mess offers, tagged by `mealType`. |
| `DailyMenu` | What a specific mess is serving on a specific date + meal type, with a `capacity` limit and `cutoffTime`. |
| `DailyMenuItem` | Join table linking a `DailyMenu` to the specific `MenuItem`s available that day. |
| `SubscriptionPlan` | A vendor-defined plan template (e.g., "Monthly Dinner Only — ₹2,500"). |
| `Subscription` | A customer's actual purchased instance of a plan, tracking meals allotted/delivered/skipped and remaining balance. |
| `SubscriptionPause` | Logs each pause period a customer takes on an active subscription. |
| `Order` | A single meal transaction — either a one-time order or one day's subscription meal. |
| `OrderItem` | Line items for a one-time order (which `MenuItem`s and quantities were ordered). Not used for subscription meals — those are implied by that day's `DailyMenu`. |
| `Review` | A rating/review left by a customer, optionally linked to a specific `Order` and/or `Subscription`. |
| `Payment` | A financial transaction record (order payment, subscription payment, refund, or wallet top-up), linked to Razorpay. |
| `Wallet` / `WalletTransaction` | In-app wallet balance and its transaction history per user. |
| `Payout` | Aggregated vendor payout for a period (gross revenue minus platform commission). |
| `DeliveryPartner` | Profile extension for a `User` with role `DELIVERY_PARTNER`. |
| `DeliveryAssignment` | Which delivery partner is assigned to which `Order`, with pickup/delivery timestamps and OTP confirmation. |
| `CityConfig` | Per-city platform settings, currently commission percentage (supports FR-14.3 from the SRS). |
| `Notification` | Log of notifications sent to a user (for support/debugging and an in-app notification inbox). |

---

## 3. Key Relationships (Plain-English ERD)

- A **User** (role=VENDOR) owns exactly **one Mess** (one-to-one).
- A **Mess** has many **MenuItems**, many **DailyMenus** (one per date+mealType), and many **SubscriptionPlans**.
- A **DailyMenu** has many **MenuItems** through the **DailyMenuItem** join table (many-to-many).
- A **User** (role=CUSTOMER) can have many **Subscriptions**, each tied to one **Mess** and one **SubscriptionPlan**.
- A **Subscription** generates many **Orders** over its lifetime (`orderType = SUBSCRIPTION_MEAL`), one per scheduled meal.
- An **Order** optionally has: one **OrderItem** set (one-time orders only), one **Payment**, one **DeliveryAssignment**, and one **Review**.
- A **Review** always belongs to a **User** and a **Mess**, and optionally references the specific **Order** or **Subscription** it's about.
- A **Mess** accumulates **Payouts** over time, each covering a date range and referencing Razorpay's payout ID.

---

## 4. Business Rules the Schema Cannot Enforce (Must Be in Application Code)

Enforce these critical business rules explicitly within the NestJS service layer:

1. **`Order.orderItems` should only be populated when `orderType = ONE_TIME`.** For `SUBSCRIPTION_MEAL` orders, the meal contents are implied by that date's `DailyMenu` — do not create `OrderItem` rows for subscription meals.
2. **`DailyMenu.ordersPlaced` must be incremented inside the same database transaction as order creation**, and the order must be rejected if `ordersPlaced >= capacity` at that moment. Without a transaction, concurrent orders can race past the vendor's stated capacity.
3. **Order placement must check `DailyMenu.cutoffTime`** — reject new orders (and skip requests) placed after the cutoff for that date, with a clear error message the client can display.
4. **Skip credit logic**: when a customer skips a scheduled subscription meal *before* cutoff, set that day's `Order.status = SKIPPED`, increment `Subscription.mealsSkipped`, and increment `Subscription.skipCreditsRemaining` by 1 (per the vendor's `SubscriptionPlan.refundPolicyText` — some vendors may cap how many skip credits can accumulate; enforce that cap in code, not schema).
5. **Subscription balance/refund calculation on cancellation**: `refundAmount = (SubscriptionPlan.price / totalMealsAllotted) * (totalMealsAllotted - mealsDelivered - mealsSkipped)`, then apply any vendor-specific cancellation policy deductions described in `refundPolicyText`. Store the resulting `Payment` row with `type = REFUND`.
6. **Pausing a subscription** should insert a `SubscriptionPause` row and **extend `Subscription.endDate`** by the paused duration — it must not simply freeze without adjusting the end date, or the customer loses meals they paid for.
7. **`Review.isVerifiedSubscriber`** should be set to `true` only if the reviewing `User` has (or had) an `ACTIVE`/`COMPLETED` `Subscription` with that `Mess` — check this server-side before saving, never trust a client-supplied flag.
8. **`Review.overallRating`** should be computed server-side as the average of `tasteRating`, `hygieneRating`, `quantityRating`, and `punctualityRating` — never accepted directly from the client, to keep the four sub-ratings and the overall score consistent.
9. **`Mess.avgRating` and `Mess.consistencyScore`** are denormalized aggregate fields — recompute them (e.g., via a scheduled job or on each new review) rather than letting them drift out of sync with the underlying `Review` rows.
10. **Payout calculation**: `netAmount = grossAmount - commissionAmount`, where `commissionAmount = grossAmount * (CityConfig.commissionPercentage / 100)` for the mess's city. Generate one `Payout` row per settlement period (e.g., weekly) per mess.
11. **One `Wallet` per `User`** — create it automatically when the user account is created (e.g., in the same transaction as user signup), so code never has to handle a "missing wallet" case.
12. **Mess subscription plan portability** (switching mid-cycle, mentioned in the SRS as a differentiator): implement as *cancel old subscription with pro-rated refund calculated per rule #5, then create a new `Subscription` at the new mess crediting that refund amount* — do not attempt to "move" a `Subscription` row between two different `Mess` records, since a subscription's plan and pricing are mess-specific.

---

## 5. PostGIS Supplement (Geo Radius Search)

The core schema keeps `Mess.latitude`/`Mess.longitude` as plain `Float` fields so Prisma Client works with zero friction for normal reads/writes. For **"mess near me" radius search**, add this as a **separate raw SQL migration** run after your initial `prisma migrate dev` — do not put this inside `schema.prisma` itself, since Prisma Client cannot natively query geography columns directly.

```sql
-- Run once, after your first Prisma migration, as a custom SQL migration file
CREATE EXTENSION IF NOT EXISTS postgis;

-- Add a generated geography column derived from the existing lat/lng columns
ALTER TABLE "Mess" ADD COLUMN geo_location geography(Point, 4326)
  GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography) STORED;

CREATE INDEX mess_geo_idx ON "Mess" USING GIST (geo_location);
```

Query it from NestJS using Prisma's raw query escape hatch (never build this query with string concatenation — always use parameterized `$queryRaw`):

```typescript
const nearbyMess = await prisma.$queryRaw`
  SELECT id, name, latitude, longitude,
         ST_Distance(geo_location, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography) AS distance_meters
  FROM "Mess"
  WHERE status = 'ACTIVE'
    AND ST_DWithin(geo_location, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography, ${radiusMeters})
  ORDER BY distance_meters ASC
  LIMIT 20;
`;
```

Apply the identical pattern to `Address` if you later need "delivery distance from mess to customer" calculations.

---

## 6. Verification Note

This schema was validated (not just visually reviewed) using Prisma's own schema parser before being handed to you — it parses cleanly with **20 models and 12 enums, zero syntax or relation errors**. If you extend it later (new fields, new tables), re-run the same validation before building on top of it:

```bash
npm install prisma --legacy-peer-deps
npx prisma validate --schema=./schema.prisma
```

(If you hit a `binaries.prisma.sh` network error in a sandboxed environment, that's an engine-binary download issue, not a schema error — validate with `@prisma/internals`'s `getDMMF()` instead, which uses a bundled WASM parser and needs no network access.)

