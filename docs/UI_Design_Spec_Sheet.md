# MessConnect — UI Design Spec Sheet

**Version:** 1.0
**Date:** September 16, 2026
**Purpose:** This is the exact visual system used across every MessConnect surface (customer app, vendor dashboard, admin panel) to ensure screens stay visually consistent across frontend implementations.

---

## 1. Brand Identity

**Positioning:** Warm, home-cooked, trustworthy — deliberately not the red/orange energy of Zomato/Swiggy. Teal signals freshness and reliability; mustard signals warmth and home-style food.

## 2. Color Palette

| Token | Hex | Use |
|---|---|---|
| `brand-primary` | `#0F6E56` | Primary buttons, active nav, headers, progress bars, brand mark |
| `brand-primary-tint` | `#0F6E5622` (14% opacity) | Icon backgrounds, subtle highlight fills |
| `brand-accent` | `#BA7517` | Subscription badges, star ratings, "most popular" highlight border |
| `brand-accent-bg` | `#FAEEDA` | Badge/pill backgrounds paired with accent text |
| `brand-accent-text` | `#854F0B` | Text on `brand-accent-bg` |
| `bg-screen` | `#FFFBF3` | Screen/page background (warm cream, not stark white) |
| `bg-card` | `#FFFFFF` | Card surfaces |
| `border-default` | `#EDE7D8` | Card borders, dividers |
| `border-muted` | `#D8D2C4` | Chip/filter borders, secondary buttons |
| `text-primary` | `#22302B` | Headings, primary body text |
| `text-secondary` | `#6B7770` | Metadata, timestamps, helper text |
| `success-bg` | `#EAF3DE` | "Active", "Pure veg" status pills |
| `success-text` | `#3B6D11` | Text on `success-bg` |
| `danger-bg` | `#FCEBEB` | Error/dispute status pills |
| `danger-text` | `#791F1F` | Text on `danger-bg`, destructive action text |
| `danger-border` | `#E5B4A2` | Destructive/reject button border |
| `sidebar-dark` | `#22302B` | Admin panel sidebar (visually distinct from vendor dashboard) |

**Rule:** text on any colored background always uses the darkest paired shade from that same family (e.g., `brand-accent-text` on `brand-accent-bg`) — never plain black or gray on a tinted background.

## 3. Typography

| Style | Size | Weight | Use |
|---|---|---|---|
| Screen title | 15–16px | 500 | "Choose a plan", "Your order" |
| Card heading | 12–13px | 500 | Mess names, plan names |
| Body/metadata | 11px | 400 | Distance, timestamps, descriptions |
| Small label/pill | 10px | 500 | Badges ("Subscribe", "Active") |
| Metric number (dashboard) | 16–22px | 500 | Revenue, order count, wallet balance |

Only two weights are used anywhere in the system: **400 (regular)** and **500 (medium)** — never bold (700). Sentence case throughout; no ALL CAPS, no Title Case except proper nouns.

## 4. Spacing & Layout

| Token | Value | Use |
|---|---|---|
| Card padding | 10–14px | Standard card internal padding |
| Card gap | 8–12px | Vertical spacing between stacked cards |
| Card corner radius | 12–14px | All cards |
| Pill/badge radius | 6–8px | Status badges |
| Chip radius | 16px (full pill) | Filter chips |
| Phone frame radius | 32–36px | Outer device bezel in mockups |
| Section padding (mobile) | 16px horizontal | Screen edge margins |
| Icon size (inline) | 13–16px | Metadata icons |
| Icon size (feature) | 24–26px | Card leading icons |

## 5. Iconography

**Tabler Icons (outline style only)** — consistent icon language across every screen:
`ti-map-pin`, `ti-search`, `ti-bell`, `ti-star`, `ti-leaf` (veg), `ti-tools-kitchen-2` (mess/kitchen), `ti-soup`, `ti-sun` (lunch), `ti-moon` (dinner), `ti-truck-delivery`, `ti-home`, `ti-check`, `ti-player-pause`, `ti-x`, `ti-arrows-exchange`, `ti-arrow-down-left` / `ti-arrow-up-right` (wallet credit/debit), `ti-shield-check` (admin), `ti-building-store`, `ti-alert-triangle`, `ti-users`, `ti-clipboard-list`, `ti-calendar`, `ti-layout-dashboard`.

Never mix in a different icon set (e.g., Material Icons or Font Awesome) — visual weight and stroke width would mismatch.

## 6. Component Inventory

| Component | Where used | Key states |
|---|---|---|
| **Mess card** | Home/discovery feed | Default; with "Subscribe" or "Pure veg" badge |
| **Filter chip** | Home/discovery | Active (filled teal) / inactive (outlined) |
| **Tab bar** | Mess detail | Active tab (teal underline) / inactive (gray text) |
| **Plan card** | Subscription selection | Default / featured (2px accent border + "Most popular" badge) |
| **Status stepper** | Order tracking | Completed (filled teal + check) / current (accent color) / upcoming (gray, muted icon) |
| **Metric tile** | Vendor dashboard, wallet | Label (11px muted) + number (16–22px, 500 weight) |
| **Meal count tile** | Vendor dashboard | Tinted background matching meal type (amber=lunch, green=dinner, teal=signups) |
| **Approval row** | Admin panel | Pending (with Approve/Reject buttons) |
| **Dispute row** | Admin panel | Tagged with a status pill (e.g., "Needs review") |
| **Wallet transaction row** | Wallet screen | Credit (green, down-left arrow) / debit (red-brown, up-right arrow) |
| **Subscription progress bar** | Wallet screen | Filled proportional to meals consumed |
| **Primary button** | Throughout | Filled teal, white text, 500 weight |
| **Secondary button** | Throughout | White background, outlined border, dark text |
| **Destructive button** | Admin (reject), wallet (cancel) | White background, red-brown border and text |

## 7. Layout Patterns by Surface

- **Customer mobile app:** phone-frame mockup, 340px max-width, 32–36px bezel radius, cream screen background, cards on white.
- **Vendor/Admin web:** fixed-width sidebar (150px) + fluid main content area; sidebar background is teal for vendor, dark charcoal (`#22302B`) for admin — this color difference is intentional so the two panels are never visually confused mid-development.
- **Dashboards:** metric tiles in a 4-column grid at the top, followed by a detail panel (meal count sheet, tables) below — consistent across vendor and admin.

## 8. What NOT to Do

- Don't introduce a second accent color beyond teal + mustard — extra colors dilute the brand identity established here.
- Don't use drop shadows, gradients, or glow effects — this system is deliberately flat.
- Don't mix border-radius values arbitrarily — stick to the values in §4.
- Don't use red for anything other than destructive actions/disputes — it's reserved semantically, not decorative.
- Don't bold text with font-weight 700 anywhere — the system uses only 400/500.

