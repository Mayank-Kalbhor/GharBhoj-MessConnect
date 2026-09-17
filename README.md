<div align="center">

# 🍛 GharBhoj (MessConnect)

**Hyperlocal Daily Meal Subscription & Home-Cooked Mess Aggregator Platform**

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-10-ea2845?style=flat-square&logo=nestjs)](https://nestjs.com/)
[![Expo](https://img.shields.io/badge/Expo-52-000020?style=flat-square&logo=expo)](https://expo.dev/)
[![Prisma](https://img.shields.io/badge/Prisma-5-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791?style=flat-square&logo=postgresql)](https://www.postgresql.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](LICENSE)

*Connecting college students and working professionals with authentic, hygienic, and affordable home-style tiffin & mess services.*

[Explore Features](#-features) • [Architecture](#-architecture) • [Getting Started](#-getting-started) • [Environment Setup](#-environment-variables) • [Testing](#-testing-and-validation)

</div>

---

## 📖 Overview

**GharBhoj** is an end-to-end multi-surface platform designed to streamline the daily mess and tiffin ecosystem in Indian tier-1/tier-2 education hubs (launching in Indore). 

Unlike standard on-demand food delivery apps, GharBhoj solves the unique challenges of scheduled daily meal plans:
- **Meal Count Demand Forecasting**: Aggregates recurring subscriber allotments and on-demand one-time orders into real-time raw-material prep targets (e.g., phulkas to roll, dal in litres).
- **Flexible Skip-a-Meal Credits**: Allows students to skip meals before cut-off times (e.g., 7:00 AM for Lunch, 4:00 PM for Dinner) to earn redeemable wallet credits capped at 25% of plan cost.
- **Transparent Vendor Economics**: Automated daily batch payouts with a flat 14.00% platform commission via Razorpay Route.
- **Quality & Safety Assurance**: Strict FSSAI license compliance verification and student grievance dispute workflows.

---

## 🏛 Architecture & Monorepo Layout

This project is organized as a high-performance monorepo using **Turborepo** and **npm workspaces**:

```
GharBhoj/
├── apps/
│   ├── api/                    # NestJS production REST API with Swagger & Prisma
│   │   ├── src/
│   │   │   ├── modules/        # Auth, Mess, Orders, Subscriptions, Payouts, Admin, etc.
│   │   │   ├── integrations/   # Razorpay, Firebase Admin, AWS S3, MSG91, Google Maps
│   │   │   └── jobs/           # BullMQ scheduled workers (Renewals, Payouts, Reminders)
│   │   └── test/               # Unit, E2E, PostGIS spatial & concurrency test suites
│   ├── web/                    # Next.js 14 App Router portal (TailwindCSS + Tabler Icons)
│   │   ├── app/
│   │   │   ├── (customer)/     # 340px responsive phone-bezel preview for Customer App
│   │   │   ├── vendor/         # Vendor Kitchen Dashboard, Menu Publisher, Payouts
│   │   │   └── admin/          # Platform Admin Console (KYC, FSSAI, GMV Analytics)
│   │   └── components/         # Shared UI design system, steppers, and modals
│   └── mobile/                 # Expo React Native customer application
│       ├── app/                # Expo Router file-based mobile navigation
│       ├── lib/                # Zustand cart/auth stores, TanStack React Query
│       └── components/         # Mobile UI components and native SVG icons
├── packages/
│   ├── shared-types/           # Cross-platform TypeScript models, DTOs & enums
│   └── shared-constants/       # Business config, commission rates, and error codes
├── docs/                       # Architecture specs, API contracts, and business rules
├── migrations/                 # PostgreSQL Prisma database migrations
└── schema.prisma               # Prisma data models and relationships
```

---

## ✨ Key Features

### 1. 📱 Customer Experience (`apps/mobile` & `apps/web/discovery`)
- **Hyperlocal Discovery**: Filter Indore messes by radius (PostGIS spatial queries), diet (Pure Veg / Non-Veg), monthly pricing, and ratings.
- **Weekly & Monthly Subscriptions**: Subscribe to flexible lunch/dinner plans with single-click UPI checkout.
- **Skip Meal Management**: Easily skip meals before daily operational cut-offs to credit your GharBhoj wallet.
- **Live Order Progression**: Stepper tracking through `PLACED` ➔ `ACCEPTED` ➔ `PREPARING` ➔ `OUT_FOR_DELIVERY` ➔ `DELIVERED`.

### 2. 👨‍🍳 Vendor Kitchen Dashboard (`apps/web/vendor`)
- **Interactive Daily Meal Count Sheet**: Automatically computes how many base meals, extra thalis, phulkas, and litres of dal to cook.
- **Dynamic Menu Calendar**: Publish upcoming weekly lunch & dinner menus with one-click toggles.
- **Instant Order Workflow**: Accept incoming orders and progress status directly from the kitchen tablet view.
- **Payouts Ledger**: View gross GMV, platform fee deduction (14.00%), and net Razorpay Route settlement amounts.

### 3. 🛡 Platform Admin Console (`apps/web/admin`)
- **Vendor Onboarding & FSSAI Verification**: Approve kitchens, review documentation, and activate live listings.
- **Dispute Moderation**: Mediate meal quality or delivery issues between students and vendors.
- **City & Revenue Analytics**: Real-time tracking of active subscribers, daily meal deliveries, and platform commissions.

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: `v18.x` or `v20.x`+
- **PostgreSQL**: `v14+` with PostGIS extension (or Supabase / Neon DB)
- **Redis**: `v6+` (for BullMQ queues and menu caching)

### 1. Clone & Install
```bash
git clone https://github.com/<your-username>/GharBhoj.git
cd GharBhoj

# Install all dependencies across workspaces
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to the required local configuration files:
```bash
# Root and API config
cp .env.example .env
cp .env.example apps/api/.env

# Web frontend config
cp .env.example apps/web/.env.local
```
*(Update `DATABASE_URL`, `JWT_SECRET`, and `REDIS_URL` with your local or cloud credentials).*

### 3. Database Migration & Seed
```bash
# Push schema to database and generate client
npx prisma db push
# or run migrations:
npx prisma migrate dev

# Seed initial Indore mess data, plans, and vendor accounts
npm run prisma:generate --workspace=apps/api
npm run seed --workspace=apps/api
```

### 4. Running the Development Servers

Run services individually or simultaneously:

```bash
# Start NestJS API (Runs at http://localhost:4000)
npm run start:api

# Start Next.js Web Portal (Runs at http://localhost:3000)
npm run start:web

# Start Expo Mobile App (Runs Metro bundler)
npm run start:mobile
```

---

## 🌐 Endpoints & Portals

| Surface | URL | Description |
| :--- | :--- | :--- |
| **Interactive Multi-Surface Portal** | [http://localhost:3000](http://localhost:3000) | Switch between Customer, Vendor, and Admin views |
| **Customer Web Preview** | [http://localhost:3000/discovery](http://localhost:3000/discovery) | Mobile-framed interactive customer ordering |
| **Vendor Dashboard** | [http://localhost:3000/vendor/dashboard](http://localhost:3000/vendor/dashboard) | Kitchen meal count sheet & menu publisher |
| **Admin Console** | [http://localhost:3000/admin/dashboard](http://localhost:3000/admin/dashboard) | Vendor KYC, FSSAI verification & GMV analytics |
| **Backend REST API** | [http://localhost:4000/v1](http://localhost:4000/v1) | Core NestJS REST API |
| **Swagger API Docs** | [http://localhost:4000/docs](http://localhost:4000/docs) | Interactive OpenAPI contract & documentation |

---

## 🧪 Testing and Validation

The platform includes comprehensive test suites covering business rules, CSS token audits, and end-to-end integration scenarios:

```bash
# Run web business logic & design token audit
npm run test --workspace=apps/web

# Run backend unit tests
npm run test --workspace=apps/api

# Run live PostGIS spatial & concurrency tests
npm run test:e2e --workspace=apps/api

# Run mobile business logic suite
npm run test --workspace=apps/mobile
```

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
