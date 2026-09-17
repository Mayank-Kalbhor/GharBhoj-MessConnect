# MessConnect — API Contract

**Version:** 1.0
**Date:** September 15, 2026
**Base URL (example):** `https://api.messconnect.in/v1`
**Style:** REST, JSON request/response bodies, per `TechStack_MessConnect.md` §5 (NestJS + class-validator).
**Companion files:** `schema.prisma`, `DB_Schema_Reference.md`, `BusinessLogic_MessConnect.md`, `FolderStructure_MessConnect.md`, `.env.example`

**Usage:** This is the single source of truth for every route, its inputs, and its outputs. All implementations must use these exact endpoints, field names, and types without additions or renames unless this document is updated first. Field names here match `schema.prisma` field names exactly.

---

## 0. Conventions Used Throughout This Document

- All IDs are UUID strings.
- All money fields are strings representing a `Decimal(10,2)` value, e.g. `"2500.00"` — never a JS `number`, to avoid float precision issues crossing the API boundary. Client code must parse with a decimal-safe library, not `parseFloat`.
- All dates-only fields (e.g. `scheduledDate`, `startDate`) are `"YYYY-MM-DD"` strings. All timestamps are ISO-8601 `"YYYY-MM-DDTHH:mm:ss.sssZ"`.
- Every authenticated request sends `Authorization: Bearer <JWT>` (issued by the backend after Firebase token verification — see `TechStack_MessConnect.md` §7).
- Every list endpoint supports `?page=1&limit=20` and returns the pagination envelope shown in §1.
- Every error response uses the shape in §2. HTTP status codes are meaningful (400 validation, 401 unauthenticated, 403 wrong role, 404 not found, 409 conflict/race-lost, 422 business-rule violation).
- Role gate is stated as **Auth:** on every endpoint. `Auth: none` means public (no token required).

---

## 1. Pagination Envelope (all list endpoints)

```json
{
  "data": [ /* array of resource objects */ ],
  "meta": {
    "page": 1,
    "limit": 20,
    "totalItems": 143,
    "totalPages": 8
  }
}
```

## 2. Error Envelope (all non-2xx responses)

```json
{
  "error": {
    "code": "CAPACITY_EXCEEDED",
    "message": "This meal slot is sold out.",
    "details": null
  }
}
```
`code` is a stable machine-readable string (SCREAMING_SNAKE_CASE) the client can branch on — never make the client parse `message` text to decide behavior. Maintain a fixed enum of `code` values in the backend (`/api/src/common/error-codes.ts`, see `FolderStructure_MessConnect.md`).

---

## 3. Auth Module — `/auth`

### POST /auth/verify
Exchanges a verified Firebase ID token for a MessConnect session JWT. Called right after Firebase phone-OTP / Google / Apple sign-in succeeds on the client.

**Auth:** none (but requires a valid Firebase ID token)
```json
// Request
{ "firebaseIdToken": "string" }

// Response 200 (existing user)
{
  "accessToken": "jwt-string",
  "user": { "id": "uuid", "role": "CUSTOMER", "fullName": "string", "phone": "string", "isStudentVerified": false }
}

// Response 200 (first-time login — no User row yet)
{
  "accessToken": null,
  "requiresSignup": true,
  "firebaseUid": "string",
  "phone": "string"
}
```
**Validation:** Backend verifies the Firebase ID token server-side via Firebase Admin SDK — never trust a client-supplied `firebaseUid` on this route without verifying the token it came with.

### POST /auth/signup
Completes signup for a first-time Firebase-verified user.
**Auth:** none (requires valid Firebase ID token)
```json
// Request
{ "firebaseIdToken": "string", "role": "CUSTOMER", "fullName": "string", "email": "string|null" }

// Response 201
{ "accessToken": "jwt-string", "user": { "id": "uuid", "role": "CUSTOMER", "fullName": "string", "phone": "string" } }
```
**Validation:** `role = VENDOR` or `role = DELIVERY_PARTNER` signups additionally require the onboarding flow in §4/§10 before `Mess`/`DeliveryPartner` records exist — creating the `User` row alone does not activate a vendor. Per business-logic Rule 10, a `Wallet` row is created in the same transaction as this `User` row.

---

## 4. Users & Addresses Module — `/users`

### GET /users/me
**Auth:** any authenticated role
Response mirrors the `User` model minus `firebaseUid`.

### PATCH /users/me
**Auth:** any authenticated role
```json
// Request (all fields optional)
{ "fullName": "string", "email": "string" }
```
`phone` is never editable via this route — phone changes require re-verification through `/auth`.

### POST /users/me/student-verification
**Auth:** CUSTOMER
```json
// Request
{ "studentIdDocUrl": "string" }
// Response 200
{ "isStudentVerified": false, "status": "PENDING_REVIEW" }
```
**Validation:** Sets `isStudentVerified = true` only after admin review (see §11), never immediately on upload.

### GET /users/me/addresses
**Auth:** CUSTOMER — returns `Address[]`

### POST /users/me/addresses
**Auth:** CUSTOMER
```json
// Request
{ "label": "Hostel", "addressLine": "string", "city": "string", "state": "string", "pincode": "string", "latitude": 22.7196, "longitude": 75.8577, "isDefault": true }
// Response 201: full Address object
```
**Validation:** If `isDefault: true`, backend must unset `isDefault` on this user's other addresses in the same transaction — never allow two default addresses.

### PATCH /users/me/addresses/:id — same body shape, partial
### DELETE /users/me/addresses/:id — 204 No Content

---

## 5. Mess Discovery Module — `/mess`

### GET /mess
Discovery/search listing.
**Auth:** none
**Query params:** `lat`, `lng`, `radiusMeters` (default 5000), `city`, `cuisine`, `isVeg`, `minRating`, `sortBy` (`distance` | `rating` | `price`), plus pagination.
```json
// Response 200 (paginated envelope, data items:)
{
  "id": "uuid", "name": "string", "avgRating": 4.3, "consistencyScore": 88,
  "isVeg": true, "cuisineTypes": ["North Indian"], "distanceMeters": 1240,
  "city": "string", "status": "ACTIVE"
}
```
**Validation:** Only `status = ACTIVE` mess are returned to customers. Distance search uses the PostGIS raw query from `DB_Schema_Reference.md` §5 — never approximate with plain lat/lng Euclidean distance for the `distanceMeters` field.

### GET /mess/:id
**Auth:** none — full `Mess` profile including `fssaiLicenseNumber`, denormalized ratings, and today's `DailyMenu` summary per meal type.

### GET /mess/:id/menu
Today's (or a specified date's) menu.
**Auth:** none
**Query:** `date` (default = today, mess-local timezone per business-logic Rule 8), `mealType` (optional filter)
```json
// Response 200
[
  {
    "dailyMenuId": "uuid", "mealType": "LUNCH", "date": "2026-09-15",
    "capacity": 40, "ordersPlaced": 31, "slotsRemaining": 9,
    "cutoffTime": "2026-09-15T11:30:00.000Z",
    "isCutoffPassed": false,
    "items": [ { "id": "uuid", "name": "string", "isVeg": true, "price": "120.00", "imageUrl": "string|null" } ]
  }
]
```
**Validation:** `slotsRemaining` and `isCutoffPassed` are server-computed at read time — never cached stale for more than a few seconds (Redis TTL ≤ 15s on this endpoint per `TechStack_MessConnect.md` §6), since it directly gates order placement in §7.

### GET /mess/:id/reviews — paginated `Review[]`, `Auth: none`

---

## 6. Menu Management Module (Vendor) — `/vendor/mess`

### POST /vendor/mess
Vendor onboarding — creates the `Mess` profile.
**Auth:** VENDOR (User row must already exist with `role = VENDOR`)
```json
// Request
{
  "name": "string", "description": "string|null", "fssaiLicenseNumber": "string",
  "licenseDocUrl": "string", "addressLine": "string", "city": "string",
  "latitude": 22.7, "longitude": 75.8, "isVeg": false, "cuisineTypes": ["string"],
  "bankAccountNumber": "string", "bankIfscCode": "string", "bankAccountHolder": "string"
}
// Response 201: Mess object with status = "PENDING_APPROVAL"
```
**Validation:** `ownerId` is taken from the authenticated JWT, never from the request body. `status` always starts `PENDING_APPROVAL` — the client cannot set it directly (see admin approval, §11).

### PATCH /vendor/mess/me — update own Mess profile. **Auth:** VENDOR. `status` field is read-only here.

### GET /vendor/mess/me/menu-items — **Auth:** VENDOR — list own `MenuItem[]`

### POST /vendor/mess/me/menu-items
```json
// Request
{ "name": "string", "description": "string|null", "mealType": "LUNCH", "isVeg": true, "price": "120.00", "imageUrl": "string|null" }
```
### PATCH /vendor/mess/me/menu-items/:id — partial update, including `isAvailable` toggle
### DELETE /vendor/mess/me/menu-items/:id

### POST /vendor/mess/me/daily-menus
Publishes/updates a specific date+mealType menu.
**Auth:** VENDOR
```json
// Request
{ "date": "2026-09-16", "mealType": "LUNCH", "capacity": 40, "cutoffTime": "2026-09-16T11:30:00.000Z", "menuItemIds": ["uuid", "uuid"] }
// Response 200/201: DailyMenu object with nested items
```
**Validation:** Enforces the `@@unique([messId, date, mealType])` constraint from `schema.prisma` — a second POST for the same date+mealType updates the existing `DailyMenu` (upsert), it does not create a duplicate. Reducing `capacity` below current `ordersPlaced` is rejected with `422 CAPACITY_BELOW_PLACED_ORDERS`.

### GET /vendor/mess/me/meal-count-sheet
Vendor's daily demand-forecast view (SRS FR-10.1).
**Auth:** VENDOR
**Query:** `date` (default today)
```json
// Response 200
{
  "date": "2026-09-16",
  "byMealType": [
    { "mealType": "LUNCH", "subscriptionOrders": 28, "oneTimeOrders": 9, "total": 37, "capacity": 40 }
  ]
}
```

---

## 7. Orders Module — `/orders`

### POST /orders
Places a one-time order.
**Auth:** CUSTOMER
```json
// Request
{
  "messId": "uuid", "addressId": "uuid", "mealType": "LUNCH", "scheduledDate": "2026-09-16",
  "items": [ { "menuItemId": "uuid", "quantity": 2 } ],
  "paymentMethod": "UPI"
}
// Response 201
{
  "id": "uuid", "orderType": "ONE_TIME", "status": "PLACED", "amount": "240.00",
  "razorpayOrderId": "order_xxx"
}
```
**Validation (implements business-logic Rule 6 — read that rule before implementing this route):**
1. Runs inside a single DB transaction with `SELECT ... FOR UPDATE` on the target `DailyMenu` row.
2. Rejects with `422 CUTOFF_PASSED` if `now() > cutoffTime`.
3. Rejects with `409 CAPACITY_EXCEEDED` if `ordersPlaced >= capacity` at lock time.
4. On success: creates `Order` + `OrderItem[]`, increments `DailyMenu.ordersPlaced`, creates a `Payment` row (`status = PENDING`) with a Razorpay order, all in the same transaction. `Order.status` only moves to a confirmed state after the Razorpay webhook (§9) fires.

### GET /orders/:id — **Auth:** owning CUSTOMER, or the owning VENDOR, or ADMIN
### GET /orders — **Auth:** CUSTOMER (own orders) or VENDOR (own mess's orders), paginated, filterable by `status`, `scheduledDate`, `mealType`

### PATCH /orders/:id/status
Vendor/delivery-side status transitions.
**Auth:** VENDOR (for own mess's orders) or DELIVERY_PARTNER (assigned only)
```json
{ "status": "PREPARING" }
```
**Validation:** Only forward transitions on the enum sequence `PLACED → ACCEPTED → PREPARING → OUT_FOR_DELIVERY → DELIVERED` are allowed; reject any other transition with `422 INVALID_STATUS_TRANSITION`. `CANCELLED`/`SKIPPED` are set only via the dedicated cancel/skip routes below, never through this generic route.

### POST /orders/:id/cancel
**Auth:** owning CUSTOMER (before mess accepts) or VENDOR (any time, with reason)
```json
{ "reason": "string" }
```
**Validation:** For a one-time order, only allowed while `status IN (PLACED, ACCEPTED)`. Triggers a `Payment` `REFUND` row per business-logic Rule 5's spirit (full refund for one-time orders, since no partial-consumption concept applies).

---

## 8. Subscriptions Module — `/subscriptions`

### GET /mess/:id/subscription-plans — **Auth:** none — list active `SubscriptionPlan[]` for a mess

### POST /subscriptions
Purchases a new subscription (implements business-logic Rule 2).
**Auth:** CUSTOMER
```json
// Request
{ "messId": "uuid", "planId": "uuid", "startDate": "2026-09-16", "addressId": "uuid", "autoRenew": false, "walletCreditToApply": "0.00" }
// Response 201
{
  "id": "uuid", "status": "ACTIVE", "startDate": "2026-09-16", "endDate": "2026-10-16",
  "totalMealsAllotted": 60, "mealsDelivered": 0, "mealsSkipped": 0, "skipCreditsRemaining": 0,
  "balanceAmount": "2500.00", "razorpayOrderId": "order_xxx"
}
```
**Validation:** `totalMealsAllotted = durationDays × mealTypesIncluded.length` (business-logic Rule 2). `endDate = startDate + durationDays` using mess-local calendar-date arithmetic (Rule 8). Auto-generates that subscription's future daily `Order` rows only after payment success (webhook, §9) — never eagerly on this POST before payment confirms.

### GET /subscriptions/:id — **Auth:** owning CUSTOMER, owning VENDOR, or ADMIN
### GET /subscriptions — **Auth:** CUSTOMER (own) or VENDOR (own mess's), filterable by `status`

### POST /subscriptions/:id/skip
Skips one day's scheduled meal (business-logic Rule 3).
**Auth:** owning CUSTOMER
```json
// Request
{ "date": "2026-09-20" }
// Response 200
{ "orderId": "uuid", "orderStatus": "SKIPPED", "skipCreditsRemaining": 4, "creditBanked": true }
```
**Validation:** `422 CUTOFF_PASSED` if that date's `DailyMenu.cutoffTime` has passed. `creditBanked: false` (still 200, not an error) if `skipCreditsRemaining` is already at the plan's cap — see Rule 3 for the exact cap formula.

### POST /subscriptions/:id/redeem-skip-credit
```json
// Request
{ "date": "2026-09-25", "mealType": "DINNER" }
// Response 201: new Order object, skipCreditsRemaining decremented by 1
```
**Validation:** Subject to the same capacity/cutoff transaction as §7 Rule 1–3. `422 NO_SKIP_CREDITS` if `skipCreditsRemaining = 0`.

### POST /subscriptions/:id/pause
Business-logic Rule 4.
**Auth:** owning CUSTOMER
```json
// Request
{ "pauseStart": "2026-09-22", "pauseEnd": "2026-09-28", "reason": "string|null" }
// Response 201
{ "subscriptionPauseId": "uuid", "newEndDate": "2026-10-23" }
```
**Validation:** `422 OVERLAPPING_PAUSE` if the range overlaps an existing pause for this subscription. `endDate` extension formula must match Rule 4 exactly (inclusive day count).

### POST /subscriptions/:id/cancel
Business-logic Rule 5.
**Auth:** owning CUSTOMER
```json
// Request
{ "reason": "string|null" }
// Response 200
{ "status": "CANCELLED", "netRefundAmount": "1312.50", "refundPaymentId": "uuid" }
```
**Validation:** Refund math must match Rule 5's formula exactly, including the vendor's `refundPolicyText`-derived deduction percentage. `netRefundAmount` is clamped at `"0.00"` minimum, never negative (Rule 5 edge case).

### POST /subscriptions/:id/switch-mess
Business-logic Rule 11 (portability).
**Auth:** owning CUSTOMER
```json
// Request
{ "newMessId": "uuid", "newPlanId": "uuid", "startDate": "2026-09-16" }
// Response 201
{ "oldSubscription": { "id": "uuid", "status": "CANCELLED" }, "walletCreditApplied": "1312.50", "newSubscription": { /* Subscription object */ } }
```
**Validation:** Internally calls the cancel logic (Rule 5) then credits `Wallet` (never a direct `Payment` refund) then the create-subscription logic (§8 POST /subscriptions) — implement as one orchestrated service method, not three separate client calls, so it's atomic from the user's perspective.

---

## 9. Payments Module — `/payments`

### POST /payments/razorpay-webhook
**Auth:** none (but HMAC-signature-verified — see below)
```json
// Request: Razorpay's standard webhook payload (payment.captured, payment.failed, refund.processed events)
```
**Validation:** Verify `X-Razorpay-Signature` header against `RAZORPAY_WEBHOOK_SECRET` before processing anything — reject with 400 on mismatch, and never trust payload contents pre-verification. This is the **only** place `Payment.status` moves from `PENDING` to `SUCCESS`/`FAILED` — never mark a payment successful directly from a client-facing route, since that would let a client fake payment confirmation.

### GET /payments/:id — **Auth:** owning user or ADMIN
### GET /payments — **Auth:** owning user (own), or ADMIN (all, filterable by `messId`, `type`, `status`, date range)

---

## 10. Wallet Module — `/wallet`

### GET /wallet/me — **Auth:** any authenticated role — returns `Wallet` + recent `WalletTransaction[]`

### POST /wallet/me/topup
```json
// Request: { "amount": "500.00" }
// Response 201: { "razorpayOrderId": "order_xxx" }
```
**Validation:** `Wallet.balance` only increments after the corresponding Razorpay webhook confirms success (§9), same pattern as order payments — never optimistically credit before confirmation.

---

## 11. Admin Module — `/admin`

**Auth on every route in this section:** ADMIN

### GET /admin/mess?status=PENDING_APPROVAL — paginated vendor approval queue
### PATCH /admin/mess/:id/status — `{ "status": "ACTIVE" }` or `{ "status": "SUSPENDED", "reason": "string" }`
### GET /admin/users/student-verifications?status=PENDING_REVIEW
### PATCH /admin/users/:id/student-verification — `{ "isStudentVerified": true }`
### GET /admin/reviews/flagged — moderation queue
### GET /admin/city-configs — list `CityConfig[]`
### POST /admin/city-configs — `{ "cityName": "string", "commissionPercentage": "12.00" }`
### PATCH /admin/city-configs/:id — `{ "commissionPercentage": "10.00" }` — used in Payout math (business-logic Rule 9)
### GET /admin/analytics — platform-wide GMV, active subscriptions, churn, city-wise growth (SRS FR-14.4)

---

## 12. Payouts Module — `/vendor/payouts` and `/admin/payouts`

### GET /vendor/payouts/me — **Auth:** VENDOR — own `Payout[]` history
### POST /admin/payouts/run — **Auth:** ADMIN — triggers the payout batch job (normally run by BullMQ on schedule, this route is for manual/on-demand runs)
```json
// Request: { "messId": "uuid|null", "periodStart": "2026-09-08", "periodEnd": "2026-09-14" }
```
**Validation:** Formula must match business-logic Rule 9 exactly (`netAmount = grossAmount - commissionAmount`, refunds netted out of the period they were issued in).

---

## 13. Delivery Module — `/delivery`

### POST /delivery/partners — vendor or delivery-partner-self onboarding, **Auth:** DELIVERY_PARTNER
### PATCH /delivery/partners/me/availability — `{ "isAvailable": true, "currentLatitude": 22.7, "currentLongitude": 75.8 }`
### GET /delivery/assignments/me — **Auth:** DELIVERY_PARTNER — own active `DeliveryAssignment[]`
### POST /delivery/assignments/:id/pickup — marks `PICKED_UP`, sets `pickedUpAt`
### POST /delivery/assignments/:id/deliver — `{ "otp": "1234" }` — **Validation:** must match `DeliveryAssignment.otp` exactly, else `422 INVALID_OTP`; on success sets `status = DELIVERED`, `deliveredAt = now()`, and cascades `Order.status = DELIVERED`.

---

## 14. Reviews Module — `/reviews`

### POST /reviews
**Auth:** CUSTOMER
```json
// Request
{ "messId": "uuid", "orderId": "uuid|null", "subscriptionId": "uuid|null", "tasteRating": 4, "hygieneRating": 5, "quantityRating": 4, "punctualityRating": 5, "comment": "string|null", "photoUrls": ["string"] }
// Response 201: full Review object including server-computed overallRating and isVerifiedSubscriber
```
**Validation:** Implements business-logic Rule 7 exactly — `overallRating` and `isVerifiedSubscriber` are always computed server-side from the four sub-ratings and the user's subscription history respectively; any such fields sent in the request body are ignored, not merely validated.

### GET /reviews/:id, PATCH /reviews/:id (own, within an edit window), DELETE /reviews/:id (own or ADMIN)

---

## 15. Notifications Module — `/notifications`

### GET /notifications/me — **Auth:** any authenticated role — paginated own `Notification[]`
### PATCH /notifications/:id/read — `{ "isRead": true }`
### PATCH /notifications/me/read-all

---

## 16. Cross-Document Consistency Checklist (validate before/while building)

Use this to catch drift between this contract and the other MessConnect documents:

- [ ] Every field name in every request/response body above matches a `schema.prisma` field name exactly (checked against the schema dump in this document's generation — re-diff after any schema change).
- [ ] Every module prefix above (`/auth`, `/users`, `/mess`, `/vendor/mess`, `/orders`, `/subscriptions`, `/payments`, `/wallet`, `/admin`, `/vendor/payouts`, `/delivery`, `/reviews`, `/notifications`) has a matching NestJS module folder of the same name in `FolderStructure_MessConnect.md` §2 — no endpoint should live in a module folder with a different name than its route prefix.
- [ ] Every external credential referenced implicitly above (`RAZORPAY_WEBHOOK_SECRET`, Firebase Admin credentials, etc.) has a corresponding entry in `.env.example` — no endpoint should be built against a key that isn't documented there.
- [ ] Every money field is a string, never a number, on both request and response — re-check this whenever a new endpoint is added.
- [ ] Every write endpoint that touches `Subscription`, `Order`, or `DailyMenu` state cites which `BusinessLogic_MessConnect.md` rule it implements (as done above) — if a new endpoint doesn't cite one, check whether a business-logic rule is missing and needs to be written first, rather than improvised inline.
