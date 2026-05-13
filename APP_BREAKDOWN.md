# Vendrix Platform — App Breakdown

## Overview

Vendrix is a full-stack multi-tenant e-commerce SaaS platform built for selling accessories (smartwatches, audio, cases, straps) in Pakistan. It supports COD, WhatsApp-first customer support, and a self-serve store dashboard for merchants.

---

## Architecture

```
vendrix.pk/
├── apps/
│   ├── api/          # Express.js backend (Port 3000)
│   └── web/          # Next.js 14 frontend (Port 3001)
├── packages/
│   └── db/           # Drizzle ORM + migrations
└── infra/
    └── vercel.json   # Deployment config
```

**API** → PostgreSQL + Drizzle ORM on Railway
**Web** → Next.js 14 App Router on Vercel
**Auth** → JWT tokens (access + refresh via HTTP-only cookies)

---

## Frontend (Next.js)

### Pages

| Route | Type | Description |
|-------|------|-------------|
| `/` | Storefront | Homepage — hero, featured products, collections, testimonials |
| `/products` | Storefront | Product grid with filters, search, category, collection |
| `/products/[slug]` | Storefront | Product detail — images, variants, stock, add-to-cart |
| `/checkout` | Storefront | Order placement form — name, phone, city, address, payment, coupon |
| `/order-confirmation/[id]` | Storefront | Thank you page + order details |
| `/track` | Storefront | Order tracking by ID or phone |
| `/deals` | Storefront | Active bundles and discounts |
| `/contact` | Storefront | Contact form + WhatsApp |
| `/login` | Auth | Email + password login |
| `/register` | Auth | New merchant signup |
| `/admin/*` | Dashboard | Admin panel (users, stats) |
| `/dashboard/*` | Dashboard | Merchant dashboard (products, orders, coupons, bundles, analytics, inventory, collections, content, influencers, settings) |

### Key Components

| Component | Purpose |
|-----------|---------|
| `Navbar` | Sticky header, language toggle (EN/UR), search, cart icon |
| `MobileNav` | Bottom tab bar — Home, Products, Cart, Track, Account |
| `CartDrawer` | Slide-in cart with items, qty controls, delivery summary |
| `Footer` | Store info, links, categories, contact, payment badges, social |
| `ProductCard` | Product tile with image, price, sale badge, wishlist, add-to-cart |
| `CartItem` | Cart line item with qty controls, image, line total |
| `SiteChrome` | App shell — wraps all store pages with Navbar, Footer, CartDrawer |
| `PublicStoreContext` | Provides current store data to all store pages |
| `AdminUIContext` | Toast notifications, modals, bulk action state for admin |

### Design System

- **Colors**: Zinc palette (zinc-50 to zinc-950), emerald accent, red for sale
- **Typography**: Poppins (headings), Inter (body), Noto Nastaliq Urdu (UR translations)
- **Spacing**: 4px base unit scale — 4/8/12/16/20/24/32/40/48/64/80
- **Radius**: 8/12/16/24/9999px scale
- **Shadows**: sm/md/lg/xl/card/hover — subtle, layered
- **Animations**: shimmer skeleton, fade-in/out, slide-in, pulse

---

## Backend (Express)

### Routes

| Route | Description |
|-------|-------------|
| `GET /stores/:slug` | Public store info (name, logo, settings) |
| `GET /products/public` | Public product catalog (live, by store) |
| `GET /products/public/:slug` | Single public product |
| `POST /orders` | Place order (no auth) |
| `POST /auth/register` | Create merchant account |
| `POST /auth/login` | Login → JWT + refresh cookie |
| `POST /auth/logout` | Clear refresh cookie |
| `POST /auth/refresh` | Refresh access token |
| `GET /products` | Authenticated product list |
| `POST /products` | Create product |
| `PUT /products/:id` | Update product |
| `DELETE /products/:id` | Delete product |
| `GET /orders` | Store orders (paginated, filterable) |
| `GET /orders/:id` | Single order details |
| `PUT /orders/:id/status` | Update order status |
| `POST /orders/:id/cancel` | Cancel order |
| `POST /coupons/validate` | Validate + apply coupon |
| `POST /bundles` | Create bundle |
| `POST /shipping/rates` | Shipping rate calculation |
| `POST /admin/stats` | Platform-wide stats |
| `POST /admin/users` | List all users |
| `POST /influencers/referral` | Track referral |
| `POST /webhooks/whatsapp` | WhatsApp incoming webhook |
| `POST /ai/*` | AI-powered features |
| `POST /reviews/*` | Product reviews |

### Services

| Service | Description |
|---------|-------------|
| `auth.service` | JWT verify/generate, password hashing with bcrypt |
| `orders.service` | Order creation, status transitions, WhatsApp notification triggers |
| `products.service` | CRUD, CSV import/export, Shopify import, stock management |
| `stores.service` | Store setup, subdomain routing |
| `scheduler.service` | Cron jobs — abandoned cart follow-up, order status reminders |
| `coupons.service` | Validation, discount calculation |
| `bundles.service` | Bundle creation, pricing rules |

### Repositories

| Repository | Description |
|------------|-------------|
| `orders.repository` | Order queries, stats aggregation, customer aggregates |
| `products.repository` | Product queries, stock reduction, variant management |
| `stores.repository` | Store CRUD, settings update |

### Middlewares

| Middleware | Purpose |
|------------|---------|
| `authenticate` | Verify JWT, attach `req.user` |
| `storeFromHost` | Resolve store from `X-Store-ID` header or host |
| `cors` | Allow localhost in dev, configured origins in prod |

---

## Database Schema (Drizzle)

**Core tables**: `users`, `stores`, `products`, `orders`, `order_items`, `coupons`, `bundles`, `cart_items`

**Meta tables**: `categories`, `collections`, `variants`, `images`, `addresses`, `reviews`, `influencers`, `referral_codes`

**Auth tables**: `sessions`, `refresh_tokens`

**Log tables**: `orders_status_log`, `abandoned_carts`, `analytics_events`

---

## Key Flows

### Order Placement (Public)
1. Customer browses `/products` → clicks product → `/products/[slug]`
2. Clicks "Add to Cart" → cart stored in `localStorage` via `useCart` hook
3. Opens `CartDrawer` → clicks "Checkout" → navigates to `/checkout`
4. Fills form → submits → `placeOrderRequest()` → `POST /api/orders`
5. API validates products, checks stock, calculates total + coupon discount
6. Order saved to DB → stock reduced → WhatsApp trigger queued
7. Success → redirect to `/order-confirmation/[id]`

### Merchant Onboarding
1. Register at `/register` → `POST /auth/register`
2. Store auto-created with subdomain
3. Login → redirect to `/dashboard`
4. Add products via CSV import or manual entry
5. Set up coupons, bundles, collections
6. Configure WhatsApp API, Meta Pixel in settings

### Admin Oversight
1. Admin login → `/admin`
2. View platform-wide stats, all users, all stores
3. Can access any store's dashboard for support

---

## Environment Variables

### Web (.env)
```
NEXT_PUBLIC_API_URL       # API base URL
NEXT_PUBLIC_STORE_NAME    # Display name
NEXT_PUBLIC_STORE_SLUG    # Store identifier
NEXT_PUBLIC_WHATSAPP      # WhatsApp number
NEXT_PUBLIC_PHONE         # Contact phone
NEXT_PUBLIC_META_PIXEL_ID # Facebook pixel
NEXT_PUBLIC_TIKTOK_PIXEL_ID
NEXT_PUBLIC_SITE_URL
```

### API (.env)
```
DATABASE_URL              # PostgreSQL connection
JWT_SECRET
JWT_REFRESH_SECRET
WHATSAPP_API_TOKEN
WHATSAPP_PHONE_NUMBER_ID
```

---

## Deployment

| Environment | Platform | URL |
|-------------|----------|-----|
| API (production) | Railway | `vendrix.up.railway.app` |
| Web (production) | Vercel | `vendrix.pk` |
| Web (staging) | Vercel | `vendrix-staging.vercel.app` |
| Local API | localhost:3000 | — |
| Local Web | localhost:3001 | — |

---

## TODO / Known Gaps

- [ ] `/dashboard` pages need admin layout wrapper (currently rendered standalone)
- [ ] Bundle & Deals store page (`/deals`) reads from `bundles` table — needs controller
- [ ] Influencer referral tracking needs front-end integration
- [ ] Product reviews need API + UI
- [ ] AI features (`/ai/*`) need OpenAI integration
- [ ] Meta Pixel + TikTok Pixel events for full funnel (ViewContent, AddToCart, InitiateCheckout, Purchase)
- [ ] Order status WhatsApp notification triggers need a queue/worker
- [ ] Inventory page UI needs to be built out
- [ ] Analytics dashboard needs real charts
- [ ] Settings page needs store settings form wired to API