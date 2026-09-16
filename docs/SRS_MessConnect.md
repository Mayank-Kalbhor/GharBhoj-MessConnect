# Software Requirements Specification (SRS)

## Project: MessConnect — A Food Ordering & Subscription Platform for Local Mess Services

**Version:** 1.0
**Date:** September 15, 2026
**Prepared for:** MessConnect Founding Team

---

## 1. Introduction

### 1.1 Purpose
This document specifies the functional and non-functional requirements for **MessConnect**, a platform that connects students and working professionals with local "mess" (home-style meal) providers in a city. Unlike restaurant-aggregator apps (Zomato, Swiggy), MessConnect is built around **recurring, subscription-based meal consumption** rather than one-off restaurant orders, and is designed specifically around the needs of students and mess vendors.

### 1.2 Scope
MessConnect will allow:
- Customers to discover, rate, order from, and subscribe to mess providers.
- Mess owners to list their mess, manage menus, capacity, and subscriptions, and receive analytics.
- Delivery partners (optional, mess-arranged, or platform-arranged) to fulfill orders.
- Admins to manage vendor onboarding, quality control, disputes, and payments.

The system will be delivered as a mobile app (Android/iOS) with a companion web dashboard for mess owners and admins.

### 1.3 Definitions, Acronyms, and Abbreviations
| Term | Meaning |
|---|---|
| Mess | A local home-style meal service/kitchen, typically serving fixed thali/menu meals |
| Subscriber | A customer with an active monthly/weekly meal plan |
| Mess Owner / Vendor | The person/entity operating a mess and listed on the platform |
| Skip Credit | A credit issued to a subscriber for a meal they chose not to consume |
| SRS | Software Requirements Specification |

### 1.4 References
- IEEE 830 SRS format (structural reference only)
- Competitor analysis: Zomato, Swiggy, Mess153, HomeFoodi (for gap analysis)

### 1.5 Overview
Section 2 gives an overall description of the product. Section 3 lists detailed functional requirements by user role. Section 4 covers non-functional requirements. Section 5 details the differentiator features that separate MessConnect from generic food-delivery apps. Section 6 covers data and interface requirements.

---

## 2. Overall Description

### 2.1 Product Perspective
MessConnect is a new, independent system (not an extension of an existing product). It will have three client-facing surfaces:
1. **Customer App** (Android/iOS) — discovery, ordering, subscriptions, tracking.
2. **Mess Owner Dashboard** (Web + mobile-responsive) — menu, orders, subscriptions, analytics.
3. **Admin Panel** (Web) — vendor approval, quality monitoring, payouts, dispute resolution.

### 2.2 Product Functions (Summary)
- Mess discovery with location, ratings, price, and dietary filters.
- Single-meal ordering (like a normal food delivery order).
- Monthly/weekly subscription plans with flexible skip/pause/refund logic.
- Ratings & reviews specific to mess consistency (not one-time restaurant visits).
- Mess owner tools: menu calendar, demand forecasting, capacity management.
- Wallet, payments, and automated payouts to vendors.
- Delivery tracking (mess self-delivery or platform delivery partner network).
- Admin moderation, vendor KYC, and dispute handling.

### 2.3 User Classes and Characteristics
| User Class | Description |
|---|---|
| Student/Customer | Primary user; price-sensitive, values consistency, hygiene, and flexibility |
| Working Professional | Secondary user; values convenience and monthly billing |
| Mess Owner | Small business operator, may have limited tech literacy — needs a simple dashboard |
| Delivery Partner | Optional role; may be mess-employed or platform-onboarded |
| Admin/Ops Team | Manages vendor quality, disputes, and platform health |

### 2.4 Operating Environment
- Customer app: Android 9+, iOS 15+.
- Mess owner dashboard: any modern browser, mobile-responsive.
- Backend: cloud-hosted (AWS/GCP/Azure), REST/GraphQL APIs.
- Payment gateway integration (Razorpay/Stripe/PayU for India).
- Push notification service (FCM/APNS), SMS/WhatsApp API for order/subscription alerts.

### 2.5 Design and Implementation Constraints
- Must support low-bandwidth conditions (many mess owners operate in areas with weak connectivity).
- Must comply with local food safety display norms (FSSAI license number display, in India).
- Payment flows must comply with PCI-DSS via the gateway provider (no raw card storage).

### 2.6 Assumptions and Dependencies
- Mess owners are willing to digitize menus and daily availability.
- A delivery partner network exists or will be built city-by-city (phased rollout).
- Third-party payment gateway and maps API (Google Maps/Mapbox) are available.

---

## 3. Specific Requirements (Functional)

### 3.1 Customer-Facing Requirements

**FR-1 Account Management**
- FR-1.1: User can sign up/login via mobile OTP, email, or Google/Apple sign-in.
- FR-1.2: User can optionally verify a student ID (college email/ID card) to unlock student-only discounts.
- FR-1.3: User can manage delivery addresses (hostel room, PG, home, office).

**FR-2 Mess Discovery**
- FR-2.1: System shall list nearby mess providers sorted by distance, rating, or price.
- FR-2.2: User can filter by cuisine type, veg/non-veg/vegan/Jain, price range, and rating.
- FR-2.3: User can view a mess's weekly rotating menu, photos, FSSAI license, and hygiene rating.
- FR-2.4: User can view real-time "today's menu" and cutoff time for ordering.

**FR-3 One-Time Ordering**
- FR-3.1: User can place a single-meal order for immediate or scheduled delivery.
- FR-3.2: User can track order status (accepted, preparing, out for delivery, delivered).
- FR-3.3: User can pay via UPI, card, wallet, or cash-on-delivery (if enabled by vendor).

**FR-4 Subscription Management**
- FR-4.1: User can subscribe to a mess for a defined duration (weekly, monthly, or custom N-day pack).
- FR-4.2: User can choose meal type(s) included (breakfast/lunch/dinner or combinations).
- FR-4.3: User can pause a subscription for a defined number of days (e.g., going home for a break) without losing the remaining balance.
- FR-4.4: User can skip a specific day's meal in advance of a cutoff time and receive a "skip credit" (extra day added / partial refund per vendor policy).
- FR-4.5: User can request a partial refund or plan cancellation, governed by a transparent, vendor-set refund policy shown before purchase.
- FR-4.6: User can switch from one subscribed mess to another mid-cycle, with pro-rated balance transfer (if both vendors support portability).
- FR-4.7: System shall send a daily notification/reminder of the day's subscribed menu with an option to skip.

**FR-5 Ratings & Reviews**
- FR-5.1: Users can rate on multiple axes: taste, quantity, hygiene, punctuality, and consistency — not just an overall star rating.
- FR-5.2: Subscribers' reviews shall be tagged as "Verified Subscriber" (higher trust weight than one-time order reviews).
- FR-5.3: Users can upload photos of meals received.
- FR-5.4: System shall compute a rolling "Consistency Score" per mess, based on variance in ratings over time (a key trust signal different from a simple average).

**FR-6 Payments & Wallet**
- FR-6.1: In-app wallet for faster checkout and refund credit storage.
- FR-6.2: Auto-renewal option for subscriptions with reminder before renewal charge.
- FR-6.3: Split-payment/group billing for hostel-mates sharing a group subscription order.

**FR-7 Notifications**
- FR-7.1: Order status, subscription renewal, low-balance, and menu-change alerts via push/SMS/WhatsApp.

### 3.2 Mess Owner (Vendor) Requirements

**FR-8 Onboarding & KYC**
- FR-8.1: Vendor registers with business details, FSSAI license, address, and bank account for payouts.
- FR-8.2: Admin approval required before the mess goes live.

**FR-9 Menu & Capacity Management**
- FR-9.1: Vendor can set a rotating weekly menu calendar.
- FR-9.2: Vendor can set a maximum daily order capacity/slot limit to avoid overcommitting the kitchen.
- FR-9.3: Vendor can mark items/days as sold out or unavailable in real time.
- FR-9.4: Vendor can set differentiated pricing for subscription vs. one-time orders.

**FR-10 Subscription & Order Handling**
- FR-10.1: Vendor dashboard shows a daily "meal count sheet" — an aggregated view of how many meals of each type must be prepared, based on active subscriptions + one-time orders (demand forecasting).
- FR-10.2: Vendor can view/approve skip/pause/refund requests according to their configured policy.
- FR-10.3: Vendor receives new-order and cutoff-time alerts.

**FR-11 Analytics**
- FR-11.1: Vendor dashboard shows revenue trends, subscriber retention rate, churn reasons, and rating trends over time.
- FR-11.2: Vendor receives suggestions (e.g., "your dinner ratings dropped this week") based on review sentiment analysis.

**FR-12 Payouts**
- FR-12.1: Automated weekly/bi-weekly payouts to vendor bank accounts minus platform commission.
- FR-12.2: Payout statement with order/subscription-level breakdown.

### 3.3 Delivery Partner Requirements (if platform-run delivery is used)
- FR-13.1: Delivery partner app shows assigned pickups/drops with route optimization.
- FR-13.2: Partner can mark order picked up/delivered with OTP or photo confirmation.
- FR-13.3: Partner earnings dashboard with per-delivery and incentive payout tracking.

### 3.4 Admin Requirements
- FR-14.1: Admin can approve/reject/suspend mess vendors.
- FR-14.2: Admin can monitor flagged reviews, hygiene complaints, and refund disputes.
- FR-14.3: Admin can configure city-wise commission rates and promotional campaigns.
- FR-14.4: Admin can view platform-wide analytics (GMV, active subscriptions, churn, city-wise growth).

---

## 4. Non-Functional Requirements

| Category | Requirement |
|---|---|
| Performance | App screens should load within 2 seconds on 4G; order placement confirmation within 3 seconds. |
| Scalability | Backend should support horizontal scaling to handle city-wise rollout (target: 100K concurrent users per city cluster). |
| Availability | 99.5% uptime target for core ordering/subscription services. |
| Security | OTP-based auth, encrypted data at rest/in transit (TLS 1.2+), no raw payment data stored on platform servers. |
| Usability | Mess owner dashboard must be usable by non-technical vendors — minimal steps, regional language support. |
| Localization | Multi-language support (English + regional languages) for both customer app and vendor dashboard. |
| Compliance | Display of FSSAI license, GST details (where applicable), and data privacy compliance (India's DPDP Act / applicable local law). |
| Reliability | Subscription balance and skip-credit calculations must be consistent and auditable (no silent balance loss). |

---

## 5. Key Differentiators from Zomato/Swiggy-style Apps

These are the features intended to make MessConnect distinct, based on your goal of differentiating from generic food-delivery apps:

1. **True subscription-first model** — not just "recurring orders" but a full plan lifecycle: pause, skip-with-credit, mid-cycle mess switching, and transparent refund policy — none of which exist in mainstream food apps.
2. **Multi-axis, role-weighted ratings** — separating taste/hygiene/quantity/consistency, with subscriber reviews weighted more heavily than one-off order reviews, since consistency matters more for a mess than a single dining experience.
3. **Demand forecasting for vendors** — a daily "meal count sheet" so mess owners can cook to actual demand and reduce food waste — a b2b value-add absent in Zomato/Swiggy's kitchen-facing tools.
4. **Trial meal before subscribing** — lets a student try one meal at a discounted rate before committing to a month, reducing subscription risk.
5. **Student verification layer** — ID-based verification unlocking student-specific pricing/hostel tie-ups, which positions the app specifically for the student segment rather than general dining.
6. **Group/hostel ordering** — shared subscriptions or split-billed group orders for hostel floors/PGs, a use case generic apps don't address.
7. **Capacity-aware ordering** — mess owners can cap daily orders so quality doesn't degrade under sudden demand spikes, unlike infinite-order restaurant models.
8. **Portability of subscription balance** — if a student is dissatisfied, they can move their remaining subscription balance to another mess on the platform (pro-rated), which builds trust that generic apps don't offer for one-off orders.

*(You mentioned you already have some ideas of your own for differentiation — happy to slot those into this section and adjust the corresponding functional requirements once you share them.)*

---

## 6. External Interface & Data Requirements

### 6.1 User Interfaces
- Customer app: Home (discovery), Mess Detail, Menu/Order, Subscription Management, Order Tracking, Profile/Wallet.
- Vendor dashboard: Menu Calendar, Orders/Subscriptions, Meal Count Sheet, Analytics, Payouts.
- Admin panel: Vendor Approvals, Disputes, Platform Analytics, Configuration.

### 6.2 Hardware Interfaces
- Standard smartphone (camera for photo uploads, GPS for location/delivery tracking).

### 6.3 Software Interfaces
- Payment gateway API (Razorpay/Stripe/PayU).
- Maps/geolocation API (Google Maps/Mapbox) for discovery and delivery routing.
- SMS/WhatsApp Business API and push notification service (FCM/APNS).

### 6.4 Core Data Entities (high level)
- **User** (customer, vendor, delivery partner, admin — role-based)
- **Mess** (profile, license info, location, ratings, hygiene score)
- **MenuItem / MenuCalendar**
- **Order** (one-time)
- **Subscription** (plan type, duration, meal types, balance, skip/pause history)
- **Review** (multi-axis rating, verified-subscriber flag, photos)
- **Payment/Transaction** (order-linked or subscription-linked)
- **Payout** (vendor-linked, period, amount, commission)
- **DeliveryAssignment** (order/subscription-meal linked, partner, status)

---

## 7. Future Scope (Out of Current Release, for Roadmap)
- AI-based menu recommendations based on past orders and health goals.
- Nutrition tracking/calorie estimation per meal.
- Loyalty/streak rewards for long-term subscribers.
- In-app community forum per hostel/area for shared mess reviews.
- Vendor-side inventory/raw-material planning integration.

---

## 8. Appendix

### 8.1 Open Questions for Stakeholders
- Will delivery be handled by mess owners themselves, a platform-owned fleet, or a hybrid model city-by-city?
- What is the target commission structure for vendors (flat % vs. tiered by volume)?
- Should the trial-meal feature be free or discounted, and how many trials per user per mess?
- Which city will be the pilot launch market?

