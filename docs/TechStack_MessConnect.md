# MessConnect — Technology Stack Specification

**Version:** 1.0
**Date:** September 15, 2026
**Purpose:** This is the single source of truth for every technology used in building MessConnect, ensuring consistent technology choices across all services.

**Assumptions baked into this stack** (stated so nothing is ambiguous):
- Primary launch market: India (hence India-first choices for payments/SMS).
- Team size: small (1–5 engineers) at MVP stage — stack favors speed and one-language-everywhere (TypeScript) over maximum scalability.
- Cross-platform mobile (one codebase for Android + iOS) rather than separate native apps.
- Cloud provider: AWS (chosen for maturity, India region availability via Mumbai/Hyderabad, and broad documentation depth).

If any of these assumptions are wrong for your situation (e.g., you want native iOS/Android, or a different cloud/payment region), this document should be revised accordingly.

---

## 1. Master Stack Table (Quick Reference)

| Layer | Technology | Version/Notes |
|---|---|---|
| Mobile app (customer) | React Native + Expo | TypeScript |
| Web dashboard (vendor + admin) | Next.js (React) | TypeScript, App Router |
| UI component library | Tailwind CSS + shadcn/ui | Web only; React Native Paper for mobile |
| Backend API framework | NestJS (Node.js) | TypeScript, REST API |
| Primary database | PostgreSQL | via Amazon RDS |
| Geo-search extension | PostGIS | Postgres extension, for mess discovery by location |
| Caching / sessions | Redis | via Amazon ElastiCache |
| ORM | Prisma | Type-safe DB access from NestJS |
| Background jobs / queues | BullMQ + Redis | Subscription renewals, payouts, notifications |
| Authentication | Firebase Authentication | Phone OTP + Google/Apple sign-in |
| File/image storage | Amazon S3 | Menu photos, meal photos, KYC docs |
| CDN | Amazon CloudFront | Serve images/static assets |
| Payments | Razorpay | UPI, cards, wallets, payouts (India-focused) |
| Maps & geolocation | Google Maps Platform | Places, Geocoding, Directions APIs |
| Push notifications | Firebase Cloud Messaging (FCM) | Android + iOS push |
| SMS / WhatsApp | MSG91 (or Twilio as fallback) | OTP, order/subscription alerts |
| API documentation | Swagger/OpenAPI (via NestJS) | Auto-generated from code |
| Containerization | Docker | All backend services |
| Hosting/compute | AWS ECS (Fargate) | Backend containers |
| Infrastructure as code | Terraform | Optional but recommended once past MVP |
| CI/CD | GitHub Actions | Build, test, deploy pipelines |
| Version control | Git + GitHub | Monorepo (see §9) |
| Error tracking | Sentry | Mobile, web, and backend |
| Logs & metrics | Amazon CloudWatch | Backend observability |
| Product analytics | Firebase Analytics / Mixpanel | User behavior tracking |
| Testing (backend) | Jest + Supertest | Unit + integration tests |
| Testing (web) | Jest + Playwright | Unit + E2E tests |
| Testing (mobile) | Jest + Detox | Unit + E2E tests |
| State management (frontend) | React Query (TanStack Query) + Zustand | Server state + local UI state |

---

## 2. High-Level Architecture (Text Diagram)

```
[React Native App]        [Next.js Web Dashboard]
  (Customers)              (Vendors + Admin)
        |                          |
        +----------+   +-----------+
                   |   |
              [NestJS REST API]
                   |
      +------------+------------+---------------+
      |            |            |                |
 [PostgreSQL]   [Redis]    [S3 Storage]    [BullMQ Workers]
 (+ PostGIS)   (cache/     (images/docs)   (jobs: renewals,
               queues)                     payouts, notifs)
      |
      +---> External services: Razorpay, Google Maps,
            Firebase (Auth + FCM), MSG91 (SMS/WhatsApp)
```

All client apps talk **only** to the NestJS REST API — no client ever talks directly to the database or third-party services (payments, SMS) directly, for security and auditability.

---

## 3. Mobile App (Customer-Facing)

| Technology | Use in MessConnect |
|---|---|
| **React Native + Expo** | Core framework for the customer mobile app (Android + iOS from one codebase). Expo is used specifically (not "bare" React Native) to simplify build/deployment and OTA updates for an MVP team. |
| **TypeScript** | All app code, for type safety shared with backend types. |
| **React Navigation** | Screen navigation/routing within the app. |
| **React Query (TanStack Query)** | Fetching/caching API data (mess listings, menus, order status). |
| **Zustand** | Local UI state (cart, filters, active subscription view) — kept separate from server state. |
| **React Native Paper** | Pre-built UI components (buttons, cards, ratings) for consistent design without building from scratch. |
| **Expo Notifications** | Wrapper for receiving FCM push notifications on the device. |
| **Expo Location** | Getting user's current location for "mess near me" discovery. |

---

## 4. Web Dashboard (Vendor Dashboard + Admin Panel)

| Technology | Use in MessConnect |
|---|---|
| **Next.js (App Router)** | Framework for both the Vendor Dashboard and Admin Panel (two separate route groups or two separate Next.js apps in the monorepo — decide based on team size; one app with role-based routing is simplest for MVP). |
| **TypeScript** | All dashboard code. |
| **Tailwind CSS** | Styling. |
| **shadcn/ui** | Pre-built accessible components (tables, forms, dialogs) for the menu calendar, order tables, analytics views. |
| **Recharts** | Charts for vendor analytics (revenue trends, subscriber retention) and admin platform analytics. |
| **React Query** | Data fetching from the same NestJS API used by mobile. |

---

## 5. Backend API

| Technology | Use in MessConnect |
|---|---|
| **Node.js (LTS)** | JavaScript runtime for the backend. |
| **NestJS** | Backend framework — chosen over plain Express because its modular, decorator-based structure (controllers/services/modules) keeps a growing codebase organized and maintainable. |
| **TypeScript** | Backend language — same language as both frontends, reducing context-switching and duplicated type definitions. |
| **REST API** | API style for all client-server communication (not GraphQL) — chosen for simplicity, wide tooling support, and easier caching/CDN behavior for an MVP. |
| **Prisma** | ORM for all PostgreSQL access — type-safe queries, migrations, and schema management. |
| **class-validator / class-transformer** | Request payload validation in NestJS. |
| **Passport.js** | Auth strategy integration inside NestJS (works alongside Firebase Auth token verification). |
| **Swagger (via @nestjs/swagger)** | Auto-generated API documentation from controller decorators. |

---

## 6. Database & Data Layer

| Technology | Use in MessConnect |
|---|---|
| **PostgreSQL** (Amazon RDS) | Primary relational database — stores users, mess profiles, menus, orders, subscriptions, reviews, transactions, payouts. |
| **PostGIS** (Postgres extension) | Enables geo-radius queries for "mess near me" discovery and delivery-distance calculations, without needing a separate search engine at MVP scale. |
| **Redis** (Amazon ElastiCache) | Two uses: (1) caching frequently-read data like today's menu and mess listings; (2) backing store for BullMQ job queues. |
| **Prisma Migrate** | Schema migration tool, versioned alongside the codebase. |

> **Future scale-up note:** If search needs grow beyond geo + basic filters (e.g., full-text search across menus/reviews at large scale), introduce **Elasticsearch/OpenSearch** as a dedicated search layer. Do not introduce it at MVP — it adds operational complexity not needed yet.

---

## 7. Authentication & Security

| Technology | Use in MessConnect |
|---|---|
| **Firebase Authentication** | Handles phone-number OTP login and Google/Apple social login for customers, vendors, and delivery partners. The backend verifies Firebase ID tokens rather than reinventing OTP infrastructure. |
| **JWT (issued by NestJS after Firebase verification)** | Session tokens used for subsequent API calls, containing role (customer/vendor/admin/delivery) and permissions. |
| **bcrypt** | Password hashing, only used for admin-panel accounts that use email/password (customers/vendors use OTP, not passwords). |
| **HTTPS/TLS everywhere** | Enforced at the load balancer level (AWS ALB) for all traffic. |
| **AWS Secrets Manager** | Stores API keys (Razorpay, Google Maps, MSG91) — never hardcoded or committed to the repo. |

---

## 8. Payments

| Technology | Use in MessConnect |
|---|---|
| **Razorpay** | Primary payment gateway — handles UPI, cards, netbanking, and wallet payments for one-time orders and subscriptions. Also used for **Razorpay Route** to automate vendor payouts (splitting platform commission from vendor earnings). |
| **Razorpay Webhooks** | Received by a dedicated NestJS controller to confirm payment success/failure asynchronously and update order/subscription status. |

*(If you plan to expand outside India, Stripe would need to be added as an additional gateway for those regions — not needed for the India-only MVP.)*

---

## 9. Maps & Geolocation

| Technology | Use in MessConnect |
|---|---|
| **Google Maps Platform — Places API** | Address autocomplete for delivery locations, mess location search. |
| **Google Maps Platform — Geocoding API** | Converting addresses to lat/long for storage and PostGIS queries. |
| **Google Maps Platform — Directions API** | Delivery route display and ETA calculation (used by delivery partner app, if platform-run delivery is enabled). |

---

## 10. Notifications

| Technology | Use in MessConnect |
|---|---|
| **Firebase Cloud Messaging (FCM)** | Push notifications to customer and vendor apps (order status, subscription reminders, low-balance alerts). |
| **MSG91** | SMS OTP and transactional SMS/WhatsApp messages (order confirmations, subscription renewal reminders) — chosen for strong India-market delivery rates and WhatsApp Business API support. |
| **BullMQ** (Redis-backed) | Schedules and queues notification jobs (e.g., "send tomorrow's menu reminder at 8 PM tonight") so the API layer isn't blocked by third-party notification calls. |

---

## 11. File & Media Storage

| Technology | Use in MessConnect |
|---|---|
| **Amazon S3** | Stores mess photos, meal photos uploaded by users in reviews, and vendor KYC documents (FSSAI license, ID proof). |
| **Amazon CloudFront** | CDN in front of S3 for fast image delivery to app users across the city/country. |
| **Sharp** (Node.js library, used in an upload-processing Lambda or NestJS service) | Resizes/compresses images on upload before storing in S3, to control storage cost and app load time. |

---

## 12. Background Jobs & Scheduling

| Technology | Use in MessConnect |
|---|---|
| **BullMQ** | Job queue library for Node.js, backed by Redis. Handles: subscription auto-renewal charges, skip/pause cutoff processing, vendor payout batching, and scheduled notifications. |
| **node-cron** (or BullMQ's repeatable jobs) | Triggers recurring jobs like "daily meal count sheet generation" for vendors at a fixed time each morning. |

---

## 13. DevOps & Infrastructure

| Technology | Use in MessConnect |
|---|---|
| **Docker** | Containerizes the NestJS backend and worker processes for consistent local/staging/production environments. |
| **Amazon ECS (Fargate)** | Runs backend containers without managing raw EC2 servers — good fit for a small team at MVP stage. |
| **Amazon RDS** | Managed PostgreSQL hosting (automated backups, patching). |
| **Amazon ElastiCache** | Managed Redis hosting. |
| **AWS Application Load Balancer** | Routes traffic to backend containers, terminates TLS. |
| **Terraform** | (Recommended once you move past a single-founder MVP) — defines all AWS infrastructure as code so environments (staging/production) are reproducible. |
| **GitHub Actions** | CI/CD pipelines: run tests on every PR, build Docker images, deploy to ECS on merge to main. |

> **MVP shortcut note:** If you want to launch faster and cheaper before committing to full AWS infrastructure, **Railway** or **Render** can host the same Dockerized NestJS + Postgres + Redis setup with far less DevOps overhead, and you migrate to AWS ECS/RDS once you have real usage. This is optional — pick one path and stick with it to maintain a unified deployment target.

---

## 14. Monitoring, Logging & Analytics

| Technology | Use in MessConnect |
|---|---|
| **Sentry** | Error tracking across the React Native app, Next.js dashboard, and NestJS backend — catches crashes and failed API calls in production. |
| **Amazon CloudWatch** | Centralized logs and infrastructure metrics (CPU, memory, request latency) for backend services. |
| **Firebase Analytics** | Mobile app user-behavior analytics (screen views, funnel drop-off in ordering/subscribing). |
| **Mixpanel** (optional, add once traction grows) | Deeper product analytics/cohort analysis on subscription retention — not required at MVP if Firebase Analytics is sufficient. |

---

## 15. Testing

| Technology | Use in MessConnect |
|---|---|
| **Jest** | Unit testing framework across all three codebases (mobile, web, backend). |
| **Supertest** | Integration testing of NestJS API endpoints. |
| **Playwright** | End-to-end testing of the Next.js web dashboard. |
| **Detox** | End-to-end testing of the React Native mobile app. |

---

## 16. Repository Structure

| Technology | Use in MessConnect |
|---|---|
| **Git + GitHub** | Version control and code hosting. |
| **Monorepo (Turborepo)** | Single repository containing `/mobile` (React Native), `/web` (Next.js), `/api` (NestJS), and `/packages/shared-types` (TypeScript types shared across all three) — avoids type drift between frontend and backend. |

---

## 17. Full List — Every Third-Party Service Requiring an Account/API Key

1. Firebase (Authentication + Cloud Messaging + Analytics)
2. Google Maps Platform (Places, Geocoding, Directions APIs)
3. Razorpay (Payments + Route for payouts)
4. MSG91 (SMS/WhatsApp)
5. AWS (RDS, ElastiCache, S3, CloudFront, ECS, Secrets Manager, CloudWatch) — or Railway/Render if using the MVP shortcut
6. Sentry (error tracking)
7. GitHub (repo + Actions CI/CD)



