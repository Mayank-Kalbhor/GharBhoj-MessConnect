# MessConnect — Folder & Project Structure Convention

**Version:** 1.0
**Date:** September 15, 2026
**Purpose:** Defines exactly where every file lives in the repository structure.
**Companion files:** `TechStack_MessConnect.md` (§16 named this a Turborepo monorepo — this document is the detailed version of that), `API_Contract_MessConnect.md`, `schema.prisma`

**Architecture Rule:** Never create a new top-level folder, never rename an existing folder, and never move a module's files to a different module without explicit architecture review. If a new feature doesn't obviously fit an existing folder below, determine the appropriate location before adding code.

---

## 1. Top-Level Monorepo Layout

```
messconnect/
├── apps/
│   ├── mobile/            # React Native (Expo) — customer app
│   ├── web/                # Next.js — vendor dashboard + admin panel
│   └── api/                 # NestJS — backend REST API
├── packages/
│   ├── shared-types/        # TypeScript types/interfaces shared by all three apps
│   ├── shared-constants/     # Enum mirrors of schema.prisma enums, error codes, config constants
│   └── eslint-config/         # Shared lint/formatting config
├── infra/
│   ├── terraform/            # AWS infra as code (RDS, ECS, ElastiCache, S3, CloudFront) — optional, post-MVP
│   └── docker/                 # Dockerfiles, docker-compose.yml for local dev
├── .github/
│   └── workflows/              # GitHub Actions CI/CD pipelines
├── docs/                        # This document, API contract, business logic, tech stack, SRS — kept in-repo, not just in chat
├── .env.example                  # See companion .env.example file
├── turbo.json
├── package.json                   # Root workspace config
└── README.md
```

**Why `apps/` + `packages/` (Turborepo convention):** `apps/` holds deployable things; `packages/` holds shared code nothing deploys on its own. Shared types must never live inside `apps/api/src` or be imported cross-app with a relative `../../` path — always import through `packages/shared-types`.

---

## 2. Backend — `apps/api/` (NestJS)

```
apps/api/
├── src/
│   ├── main.ts                      # App bootstrap, global pipes/filters, Swagger setup
│   ├── app.module.ts                # Root module — imports every feature module below
│   ├── common/
│   │   ├── error-codes.ts           # The fixed enum of error `code` strings used in API_Contract §2
│   │   ├── filters/                 # Global exception filter → maps to the error envelope
│   │   ├── guards/                  # JWT auth guard, role guard (reads `role` from JWT)
│   │   ├── decorators/              # @CurrentUser(), @Roles(...) custom decorators
│   │   ├── interceptors/            # Logging, response-shaping interceptors
│   │   └── pipes/                   # Shared class-validator pipes (e.g. decimal-string validator)
│   ├── prisma/
│   │   ├── prisma.module.ts
│   │   └── prisma.service.ts        # Injectable PrismaClient wrapper
│   ├── modules/
│   │   ├── auth/                    # POST /auth/* — Firebase token verification, JWT issuance
│   │   ├── users/                   # /users/* — profile, addresses, student verification
│   │   ├── mess/                    # /mess/* — public discovery, menu browsing
│   │   ├── vendor-mess/             # /vendor/mess/* — vendor's own profile, menu-items, daily-menus, meal-count-sheet
│   │   ├── orders/                  # /orders/* — one-time order placement, status transitions, cancellation
│   │   ├── subscriptions/           # /subscriptions/* — purchase, skip, pause, cancel, switch-mess
│   │   ├── payments/                # /payments/* — Razorpay webhook handler, payment queries
│   │   ├── wallet/                  # /wallet/* — balance, topup
│   │   ├── reviews/                 # /reviews/*
│   │   ├── delivery/                # /delivery/* — partner profile, assignments, pickup/deliver
│   │   ├── payouts/                 # /vendor/payouts/*, /admin/payouts/*
│   │   ├── admin/                   # /admin/* — vendor approval, student verification review, city config, analytics
│   │   └── notifications/           # /notifications/* — in-app notification list/read status
│   ├── jobs/                        # BullMQ processors (not HTTP routes)
│   │   ├── subscription-renewal.processor.ts
│   │   ├── daily-order-generation.processor.ts   # generates tomorrow's SUBSCRIPTION_MEAL orders
│   │   ├── payout-batch.processor.ts
│   │   └── notification-dispatch.processor.ts
│   └── integrations/                # Thin wrapper clients for third-party services — nothing else touches these SDKs directly
│       ├── razorpay/
│       ├── firebase-admin/
│       ├── s3/
│       ├── google-maps/
│       └── msg91/
├── prisma/
│   ├── schema.prisma                # The actual schema file
│   └── migrations/
├── test/                            # Supertest integration tests, mirrors modules/ structure
└── package.json
```

**Each folder under `modules/` follows the same internal shape** (standard NestJS convention — all new modules must replicate this exact shape):
```
modules/<name>/
├── <name>.module.ts
├── <name>.controller.ts       # Route handlers only — no business logic here
├── <name>.service.ts          # Business logic lives here (this is where BusinessLogic_MessConnect.md rules get implemented)
├── dto/
│   ├── create-<name>.dto.ts   # class-validator request shape
│   └── update-<name>.dto.ts
└── <name>.controller.spec.ts / <name>.service.spec.ts
```
**Rule:** a controller method should be a thin translation from HTTP request → service call → HTTP response. Transaction logic, capacity checks, refund math, etc. belong in the `.service.ts` file, never inline in the controller — this keeps business logic testable independent of HTTP and matches where `BusinessLogic_MessConnect.md` rules are cited in `API_Contract_MessConnect.md`.

**Module ↔ route-prefix mapping (must stay in sync with `API_Contract_MessConnect.md` §16):**

| Module folder | Route prefix(es) |
|---|---|
| `auth` | `/auth` |
| `users` | `/users` |
| `mess` | `/mess` (public) |
| `vendor-mess` | `/vendor/mess` |
| `orders` | `/orders` |
| `subscriptions` | `/subscriptions` |
| `payments` | `/payments` |
| `wallet` | `/wallet` |
| `reviews` | `/reviews` |
| `delivery` | `/delivery` |
| `payouts` | `/vendor/payouts`, `/admin/payouts` |
| `admin` | `/admin` |
| `notifications` | `/notifications` |

---

## 3. Web Dashboard — `apps/web/` (Next.js App Router)

```
apps/web/
├── app/
│   ├── (vendor)/                    # Route group — vendor-only pages, gated by role in layout
│   │   ├── dashboard/page.tsx
│   │   ├── menu-calendar/page.tsx
│   │   ├── orders/page.tsx
│   │   ├── subscriptions/page.tsx
│   │   ├── meal-count-sheet/page.tsx
│   │   ├── analytics/page.tsx
│   │   ├── payouts/page.tsx
│   │   └── layout.tsx                # Role guard: redirect if role !== VENDOR
│   ├── (admin)/                     # Route group — admin-only pages
│   │   ├── vendor-approvals/page.tsx
│   │   ├── disputes/page.tsx
│   │   ├── analytics/page.tsx
│   │   ├── city-config/page.tsx
│   │   └── layout.tsx                # Role guard: redirect if role !== ADMIN
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── layout.tsx                     # Root layout
│   └── globals.css
├── components/
│   ├── ui/                            # shadcn/ui components (generated, don't hand-edit)
│   └── shared/                        # Custom composed components (e.g. MenuCalendar, MealCountTable)
├── lib/
│   ├── api-client.ts                  # Typed fetch wrapper using packages/shared-types, calls apps/api
│   └── auth.ts                        # Firebase client SDK init + session handling
├── hooks/                             # React Query hooks, one per API resource (useSubscriptions, useOrders, ...)
└── package.json
```
**Rule:** one Next.js route group per role (`(vendor)`, `(admin)`) as shown — this is the "one app with role-based routing" option `TechStack_MessConnect.md` §4 flagged as simplest for MVP team size. Do not split into two separate Next.js apps unless the team explicitly decides to revisit that.

---

## 4. Mobile App — `apps/mobile/` (React Native + Expo)

```
apps/mobile/
├── app/                                # Expo Router — file-based navigation
│   ├── (tabs)/
│   │   ├── home.tsx                    # Mess discovery
│   │   ├── orders.tsx
│   │   ├── subscriptions.tsx
│   │   └── profile.tsx
│   ├── mess/[id].tsx                    # Mess detail page
│   ├── order/[id].tsx                    # Order tracking
│   ├── subscription/[id].tsx
│   ├── checkout.tsx
│   └── _layout.tsx
├── components/
├── hooks/                                # Same React Query pattern as web
├── lib/
│   ├── api-client.ts                     # Same shape as web's, using shared-types
│   └── auth.ts                            # Firebase client SDK (RN variant) + Expo SecureStore for token
└── package.json
```

---

## 5. Shared Packages

```
packages/shared-types/
├── src/
│   ├── models/                # TS interfaces mirroring schema.prisma models (User, Mess, Subscription, Order, ...)
│   ├── api/                   # Request/response DTO types, one file per module, matching API_Contract_MessConnect.md exactly
│   └── enums.ts               # Mirrors of every schema.prisma enum (UserRole, OrderStatus, ...) — single source of truth
└── package.json

packages/shared-constants/
├── src/
│   ├── error-codes.ts         # Must be the same values as apps/api/src/common/error-codes.ts (re-exported, not duplicated by hand)
│   └── config.ts              # Non-secret shared config (default pagination limit, skip-credit cap default %, etc.)
```
**Rule:** whenever a Prisma model or enum changes, `packages/shared-types` is updated in the same PR — this prevents contract drift between the mobile app, web dashboard, and backend.

---

## 6. Naming Conventions (apply everywhere)

| Item | Convention | Example |
|---|---|---|
| Files (components) | PascalCase | `MenuCalendar.tsx` |
| Files (everything else: services, modules, hooks) | kebab-case | `subscriptions.service.ts`, `use-orders.ts` |
| NestJS module/route folder names | kebab-case, matches route prefix segment | `vendor-mess/` → `/vendor/mess` |
| React components | PascalCase | `export function MenuCalendar() {}` |
| Database fields / DTO fields | camelCase, matches `schema.prisma` exactly | `mealsSkipped`, never `meals_skipped` |
| Enum values | SCREAMING_SNAKE_CASE, matches `schema.prisma` exactly | `SUBSCRIPTION_MEAL` |
| Environment variables | SCREAMING_SNAKE_CASE | `DATABASE_URL` |
| Git branches | `feature/<module>-<short-desc>`, `fix/<module>-<short-desc>` | `feature/subscriptions-pause-endpoint` |

---

## 7. Validation Checklist (re-check when adding anything new)

- [ ] New backend feature → does it go in an **existing** `modules/<name>/` folder per the mapping table in §2? Only create a new module folder if it truly doesn't fit any existing route prefix in `API_Contract_MessConnect.md`.
- [ ] New shared type or enum → added to `packages/shared-types`, not duplicated inline in `apps/mobile` or `apps/web`.
- [ ] New scheduled/background task → goes in `apps/api/src/jobs/`, not inline inside a controller or service triggered by a request.
- [ ] New third-party SDK usage → wrapped inside `apps/api/src/integrations/<service>/`, never imported directly inside a `modules/*/*.service.ts` file — this keeps third-party quirks isolated and swappable.
- [ ] New page → placed inside the correct role's route group (`(vendor)`, `(admin)`, `(auth)`) on web, or the correct tab/stack screen on mobile — never a top-level loose page outside these groups.
