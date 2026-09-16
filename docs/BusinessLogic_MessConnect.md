# MessConnect — Business Logic Rules

**Version:** 1.0
**Date:** September 15, 2026
**Companion files:** `schema.prisma`, `DB_Schema_Reference.md`

**Purpose of this document:** Section 4 of `DB_Schema_Reference.md` listed the business rules the database schema cannot enforce by itself. This document expands each of those into a precise, numeric formula with worked examples and edge cases, so an AI coding assistant (or a human developer) implements the exact same behavior every time — not a plausible-sounding guess.

**How to use this with an AI coding assistant:** Paste the relevant rule block (formula + worked example + edge cases) directly above the prompt asking it to implement that feature. Tell it: "Implement exactly this logic, including the edge cases listed. Do not invent alternate behavior."

---

## 1. Master Invariants (must hold true at all times)

These are the non-negotiable truths of the system. Any code change that would violate one of these is a bug, no matter how "reasonable" it looks locally.

| # | Invariant |
|---|---|
| I1 | `Subscription.totalMealsAllotted = Subscription.mealsDelivered + Subscription.mealsSkipped + Subscription.mealsRemaining` — always, for every subscription, at every point in time. |
| I2 | `DailyMenu.ordersPlaced` never exceeds `DailyMenu.capacity`. |
| I3 | No `Order` of `orderType = SUBSCRIPTION_MEAL` is created for a date before that subscription's `startDate` or after its (possibly pause-extended) `endDate`. |
| I4 | `Payment` rows are append-only. A refund is a *new* `Payment` row with `type = REFUND`, never an edit to the original payment. |
| I5 | Every money value stored or computed uses `Decimal(10,2)` arithmetic — never native floating point — and every formula below rounds to 2 decimal places only at the final step, not at intermediate steps. |
| I6 | `Mess.avgRating` and `Mess.consistencyScore` are always derivable by recomputing from `Review` rows — if a recompute job produced a different number than what's stored, the stored value is wrong and must be corrected, not the recompute logic. |
| I7 | A subscription's `skipCreditsRemaining` never goes negative, and never exceeds the vendor's configured cap (see Rule 3). |

---

## 2. Subscription Meal Allotment (at purchase time)

**Formula:**
```
totalMealsAllotted = numberOfDaysInPlan × mealsPerDay
```
Where `mealsPerDay` = count of meal types selected (e.g., lunch only = 1, lunch+dinner = 2).

**Worked example:** A 30-day monthly plan, lunch + dinner selected → `totalMealsAllotted = 30 × 2 = 60`.

**On creation, set:**
- `mealsDelivered = 0`
- `mealsSkipped = 0`
- `mealsRemaining = totalMealsAllotted`
- `skipCreditsRemaining = 0`
- `endDate = startDate + numberOfDaysInPlan` (calendar-date arithmetic, not 24h-increments — see Rule 8 on timezone handling)

**Edge case:** If a plan covers only specific days of the week (e.g., "weekdays only"), `numberOfDaysInPlan` must be counted as actual qualifying calendar days in the date range, not the raw span length. Do not silently assume 7-day weeks.

---

## 3. Skip Credit Logic

**Rule:** A customer may skip a specific day's scheduled meal *before* that day's `DailyMenu.cutoffTime`. A skip after cutoff is not permitted (the mess has already committed to cooking).

**On a valid pre-cutoff skip:**
```
Order.status = SKIPPED
Subscription.mealsSkipped += 1
Subscription.mealsRemaining -= 1        (the meal is "used" — it becomes a banked credit, not extra free meals)
Subscription.skipCreditsRemaining += 1   (capped — see below)
```

**Skip credit cap:** Read `SubscriptionPlan.maxSkipCredits` (vendor-configured; if unset, default cap = `totalMealsAllotted × 0.25`, rounded down). If `skipCreditsRemaining` is already at the cap, the skip is still allowed (the customer just won't be cooked for that day) but **do not increment `skipCreditsRemaining` further** — the meal is forfeited, not banked. Surface this clearly to the user before they confirm the skip ("You've reached your skip-credit limit; this skip will not be redeemable").

**Redeeming a skip credit:** A skip credit is consumed by scheduling an extra meal delivery on a day outside the original plan calendar (or by extending `endDate` by one day, vendor's choice, stored in `SubscriptionPlan.refundPolicyText`). Redeeming decrements `skipCreditsRemaining` by 1 and creates a new `Order` (`orderType = SUBSCRIPTION_MEAL`) for the chosen date, subject to that date's `DailyMenu.capacity` and `cutoffTime` like any other order.

**Worked example:** Plan = 60 meals, cap = 15 (25% of 60). Customer has skipped 15 times and banked all 15 credits. On the 16th skip request: allowed, but `skipCreditsRemaining` stays at 15 and that meal is simply not delivered/not billed-back — no credit is added.

**Edge case — skip after cutoff:** Reject the request with a clear error ("Cutoff for today's [mealType] has passed"). Do not silently convert it to a no-show. A no-show (customer never skipped, meal was prepared, never collected) is *not* a skip — it still counts as `mealsDelivered` for allotment purposes, since the mess incurred the cost.

---

## 4. Subscription Pause

**Rule:** Pausing **freezes billing and meal consumption** but must **extend `endDate`** by exactly the paused duration, so the customer never loses meals they already paid for.

**Formula:**
```
pauseDurationDays = pauseEndDate - pauseStartDate   (inclusive of both boundary dates, per Rule 8)
Subscription.endDate = Subscription.endDate + pauseDurationDays
```
Also insert a `SubscriptionPause` row logging `pauseStartDate`, `pauseEndDate`, and `pauseDurationDays`.

**Worked example:** A 30-day plan starting Sep 1 (endDate = Oct 1). Customer pauses Sep 10–Sep 16 (7 days inclusive). New `endDate = Oct 1 + 7 = Oct 8`. No `Order` rows of type `SUBSCRIPTION_MEAL` are generated for Sep 10–16; `mealsRemaining` is untouched during the pause.

**Edge cases:**
- **Multiple pauses in one subscription:** Each pause is its own `SubscriptionPause` row; `endDate` accumulates the sum of all pause durations. Do not overwrite previous pause records.
- **Overlapping pause requests:** Reject a new pause request if its date range overlaps an existing active/future `SubscriptionPause` for the same subscription.
- **Pause requested for a date that already has a placed `Order`:** If the order hasn't passed its cutoff yet, cancel/skip that order as part of processing the pause (apply Rule 3's skip logic) rather than leaving an orphaned order inside a paused window.
- **Vendor-side minimum/maximum pause length:** Read from `SubscriptionPlan.refundPolicyText` if the vendor sets one; if unset, no additional restriction beyond `pauseEndDate >= pauseStartDate`.

---

## 5. Cancellation & Pro-Rated Refund

**Formula:**
```
perMealValue = SubscriptionPlan.price / totalMealsAllotted
unusedMeals  = totalMealsAllotted - mealsDelivered - mealsSkipped
grossRefund  = perMealValue × unusedMeals
cancellationDeduction = grossRefund × (vendorCancellationFeePercent / 100)   (from refundPolicyText; default 0 if unset)
netRefund = round(grossRefund - cancellationDeduction, 2)
```

**Worked example:** Plan price ₹2,500 for 60 meals → `perMealValue = 2500 / 60 = 41.666...`. Customer cancels on day 12, with `mealsDelivered = 22`, `mealsSkipped = 3` → `unusedMeals = 60 - 22 - 3 = 35`. `grossRefund = 41.666... × 35 = 1458.33` (rounded to 2dp only at this final step, using the unrounded per-meal value in the multiplication). If vendor's cancellation fee is 10%: `cancellationDeduction = 145.83`, `netRefund = 1312.50`.

**On cancellation:**
```
Subscription.status = CANCELLED
Subscription.mealsRemaining = 0
Payment row created: type = REFUND, amount = netRefund, linked to original Subscription
```
Skip credits already banked (`skipCreditsRemaining`) are **forfeited on cancellation** unless the vendor's policy explicitly states otherwise — state this plainly to the user before they confirm cancellation.

**Edge case — refund exceeds what's left to refund:** `netRefund` must never be computed as negative; if `cancellationDeduction > grossRefund`, clamp `netRefund` to 0, don't produce a negative Payment amount.

---

## 6. Order Placement & Capacity Race Condition

**Rule:** Two customers must never be able to both place the last available slot for a `DailyMenu`.

**Required implementation pattern (pseudocode, inside a single DB transaction with row-level locking):**
```
BEGIN TRANSACTION
  SELECT capacity, ordersPlaced FROM DailyMenu WHERE id = :dailyMenuId FOR UPDATE
  IF now() > cutoffTime: ROLLBACK, return "cutoff passed"
  IF ordersPlaced >= capacity: ROLLBACK, return "sold out"
  INSERT INTO Order (...)
  UPDATE DailyMenu SET ordersPlaced = ordersPlaced + 1 WHERE id = :dailyMenuId
COMMIT
```
`SELECT ... FOR UPDATE` (or the Prisma-equivalent interactive transaction) is mandatory — without the row lock, two concurrent requests can both read `ordersPlaced = capacity - 1`, both pass the check, and both insert, breaching Invariant I2.

**Edge case — subscription meal auto-generation:** The same capacity check applies when the system auto-generates a subscription's daily `Order` rows (e.g., via a nightly job that creates tomorrow's subscription orders). If a `DailyMenu` fills up from one-time orders before the subscription-order generation job runs, the job must either reserve capacity for subscribers in advance (recommended: subscription orders are generated and counted against capacity *before* one-time ordering opens for that date) or flag the shortfall to the vendor — never silently drop a paying subscriber's meal.

---

## 7. Review Rules

**Verified Subscriber flag:**
```
Review.isVerifiedSubscriber = true  IFF the reviewing User has (or had) a Subscription
  with status IN (ACTIVE, COMPLETED) for that Mess
```
Always computed server-side at review-creation time from the `Subscription` table — never accept a client-supplied boolean for this field.

**Overall rating:**
```
Review.overallRating = round(
  (tasteRating + hygieneRating + quantityRating + punctualityRating) / 4,
  1
)
```
Never accept `overallRating` directly from the client; always derive it server-side from the four sub-ratings on write.

**Mess.avgRating (recomputed, not incrementally patched):**
```
Mess.avgRating = round( AVG(overallRating) over all Reviews for that Mess, 2 )
```
Weight `isVerifiedSubscriber = true` reviews more heavily per the SRS (FR-5.2). Concrete weighting:
```
weightedAvg = ( Σ(overallRating × weight) ) / ( Σ(weight) )
  where weight = 1.5 if isVerifiedSubscriber else 1.0
```

**Consistency Score (FR-5.4) — measures reliability, not just average quality:**
```
consistencyScore = round( 100 - (stdDev(overallRating over last N=50 reviews, or all if fewer) × 20), 0 )
  clamped to range [0, 100]
```
A mess with tightly clustered ratings (low variance) scores near 100; wildly inconsistent ratings pull the score down even if the average is decent. Recompute on a scheduled job (e.g., nightly) rather than on every single new review, to avoid write-amplification on high-traffic mess pages.

---

## 8. Timezone & Date-Boundary Handling

- All customer-facing "days" (subscription start/end, cutoff times, pause ranges) are calculated in the **mess's local city timezone** (stored per `CityConfig` or per `Mess`), not UTC and not the customer's device timezone. A cutoff of "10:00 PM" means 10 PM in the mess's city, always.
- Date-range durations (pause length, plan length) are **inclusive of both start and end dates** unless a rule above states otherwise — e.g., Sep 10 to Sep 16 pause = 7 days, not 6.
- `@db.Date` fields (calendar dates, no time component) must never be compared using full `DateTime` equality — compare using date-only truncation to avoid off-by-one bugs across timezones.

---

## 9. Payout & Commission Calculation

**Formula (per settlement period, per mess):**
```
grossAmount = SUM(Payment.amount) for that mess's completed Orders/Subscriptions in the period, type IN (ORDER_PAYMENT, SUBSCRIPTION_PAYMENT)
commissionAmount = round( grossAmount × (CityConfig.commissionPercentage / 100), 2 )
netAmount = grossAmount - commissionAmount
```

**Worked example:** A mess in a city with 12% commission does ₹1,18,400 gross in a week. `commissionAmount = 1,18,400 × 0.12 = 14,208.00`. `netAmount = 1,04,192.00`. One `Payout` row is created with these three figures plus the period's date range and Razorpay payout reference.

**Edge case — refunds issued within the same settlement period:** Refunds (`Payment.type = REFUND`) reduce `grossAmount` for that mess in the period they were issued in (not the period the original order was placed in), so a payout period's `grossAmount` should net out any refunds that fell inside it.

---

## 10. Wallet Rules

- One `Wallet` per `User`, created in the **same transaction** as user signup — application code must never handle a "wallet not found" case for an existing user; treat it as a data-integrity bug if it occurs.
- Every wallet balance change (top-up, refund credit, spend) creates a `WalletTransaction` row; `Wallet.balance` is the running total and must always equal `SUM(WalletTransaction.amount)` for that wallet (signed: credits positive, debits negative) — recompute and reconcile periodically (e.g., nightly job) to catch drift early.
- Wallet spend at checkout is deducted **only after** payment/order confirmation succeeds — never deduct-then-rollback-on-failure as the primary path; use a transaction that only commits the deduction alongside the successful order creation.

---

## 11. Subscription Portability (Mid-Cycle Mess Switch)

Per `DB_Schema_Reference.md` §4 rule 12: this is implemented as **cancel + recredit**, never as moving a `Subscription` row between messes.

**Sequence:**
1. Run the cancellation flow from Rule 5 above on the old subscription → produces `netRefund`.
2. Instead of transferring `netRefund` to a `Payment`/bank refund, **credit it to the customer's `Wallet`** as a `WalletTransaction`.
3. Customer purchases a new `Subscription` at the new mess; the wallet credit can be applied toward that purchase like any wallet balance.

**Edge case:** If `netRefund` is less than the new plan's price, the customer pays the difference via normal payment methods; if it's more, the surplus remains in the wallet for future use (it does not expire based on the switch itself).

---

## 12. Summary Checklist (for code review / AI-assistant self-check)

- [ ] Every money formula above rounds only at the final step, using `Decimal`, never `Float`.
- [ ] `ordersPlaced` increments happen inside a locked transaction with the capacity check (Rule 6).
- [ ] Skips before cutoff bank a credit (up to the cap); skips/no-shows after cutoff do not.
- [ ] Pausing always extends `endDate`; it never just freezes without adjusting it.
- [ ] Cancellation refunds are pro-rated by unused meals, never a flat percentage of the plan price.
- [ ] `isVerifiedSubscriber` and `overallRating` are always server-computed, never client-supplied.
- [ ] `avgRating` and `consistencyScore` are recomputed from source `Review` rows, never hand-edited.
- [ ] Portability = cancel-old + wallet-credit + purchase-new, never a direct row transfer.
- [ ] All day/date math uses the mess's local city timezone and inclusive date ranges.
- [ ] Every refund is a new append-only `Payment` row, never an edit to an existing one.
