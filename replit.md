# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Artifacts

### PK Store (artifacts/pk-store)
- **Type**: React + Vite frontend-only storefront
- **Preview path**: `/`
- **Purpose**: Pakistani e-commerce storefront for TikTok-driven traffic
- **Features**:
  - Multi-page navigation: Home, Catalog, Contact (Shopify-style)
  - Shared Navbar with announcement bar, logo, nav links, search, cart icon
  - Home page: hero banner, trust badges, Shop by Category cards, Trending Now products
  - Catalog page: all products with sort dropdown + product count + category filter pills
  - Contact page: WhatsApp-linked contact form with Pakistani phone validation
  - Product detail page with variant selection, reviews, stock badge, related products
  - WhatsApp order button (floating + per-product)
  - COD (Cash on Delivery) order form with Pakistani phone validation
  - TikTok Pixel tracking (PageView, ViewContent, InitiateCheckout, CompletePayment)
  - Cart with localStorage persistence
  - Countdown timer (Flash Sale) component
- **Config file**: `artifacts/pk-store/src/config.ts`
  - `storeName`, `whatsappNumber`, `tikTokPixelId`, `deliveryCharge`, `currency`
- **Products data**: `artifacts/pk-store/src/data/products.ts`
- **Product images**: `artifacts/pk-store/public/` (tshirt.png, ebook.png, perfume.png, hero.png)
- **Key components**: `Navbar.tsx`, `ProductCard.tsx`, `CountdownTimer.tsx`, `WhatsAppButton.tsx`, `SizeGuideModal.tsx`, `CODForm.tsx`, `InstallPrompt.tsx`, `SkeletonCard.tsx`, `CouponInput.tsx`
- **Pages**: Home, Catalog, Contact, ProductDetail, Cart, OrderConfirmation, TrackOrder, Wishlist, ReturnPolicy, Admin (all lazy-loaded)
- **Hooks**: `useSeo.ts`, `use-cart.ts`, `use-wishlist.tsx` (React Context — WishlistProvider wraps App)
- **Wishlist** (`hooks/use-wishlist.tsx`, `pages/Wishlist.tsx`): WishlistProvider Context; heart icon on each ProductCard (top-right), heart toggle in ProductDetail header + "Save to Wishlist" desktop button + mobile heart; Navbar heart icon with rose badge; wishlist page grid with remove/add-to-cart/share-via-WhatsApp; 🔥 Low Stock + 💰 Price Dropped indicators; `pk-wishlist` localStorage key
- **Recently Viewed** (`hooks/use-recently-viewed.tsx`, `components/RecentlyViewed.tsx`): RecentlyViewedProvider Context; trackView() called on ProductDetail mount; max 10 IDs, most recent first, no duplicates; shown on ProductDetail (excludes current product, "You Recently Viewed"), Home page (before footer), Cart page (both empty + with items states, "Continue Shopping"); horizontal scroll with snap + scrollbar-hide; "Clear History" button; `pk-recently-viewed` localStorage key
- **Coupon System** (`data/coupons.ts`, `components/CouponInput.tsx`): 4 coupons (FIRST10 10%, SAVE200 fixed, FREEDELIVERY, WELCOME15 15% first-order); Cart shows collapsible CouponInput with hint chips; discount row in order summary; appliedCoupon flows into CODForm (WhatsApp msg + discount row); `sw_coupon_uses` localStorage tracking
- **Admin Dashboard** (`pages/Admin.tsx`): `/admin` route; password gate (config.ts `adminPassword: "smartwear2024"`, `sw_admin_auth` localStorage); overview cards (Total Orders, Revenue, Today, Pending); orders table with sort-by-date, search (ID/name/phone), status filter dropdown; StatusBadge colors (placed=gray, confirmed=amber, shipped=blue, out_for_delivery=violet, delivered=green, cancelled=red); actions: StatusDropdown (all statuses), WhatsApp update (getWhatsAppTemplate), Mark as Shipped / Deliver quick buttons, Copy phone; Export CSV (filtered orders); mobile card view; darker `#0a0a0f` bg theme; `updateOrderStatus()` helper in orders.ts; 'cancelled' added to OrderStatus type
- **Return & Exchange Policy** (`pages/ReturnPolicy.tsx`): `/return-policy` route; 4 policy cards (Easy Returns, Exchange Process, Refund Policy, Non-Returnable Items) with colored bordered sections; quick trust badges; WhatsApp CTA button at bottom; linked from footer Quick Links + "Easy Returns" trust badge on ProductDetail (4th item in trust row, grid-cols-2 sm:grid-cols-4, "Learn more →" navigates to /return-policy)
- **PWA**: `public/manifest.json`, `public/sw.js` (cache-first images, network-first app), `public/icon-192.svg`, `public/icon-512.svg`
- **SEO**: `public/robots.txt`, `public/sitemap.xml`, JSON-LD Product schema on ProductDetail
- **COD Checkout** (`CODForm.tsx`): 20-city dropdown, phone auto-format, localStorage returning-customer pre-fill, free delivery >Rs. 2000, saves full order + navigates to `/order-confirmation`
- **Order Tracking** (`lib/orders.ts`): StoredOrder type, localStorage helpers (saveOrder, searchOrders, getOrderById), WhatsApp templates per status, 5-step status tracker
- **Order Confirmation** (`pages/OrderConfirmation.tsx`): animated checkmark, Order ID + copy button, delivery estimate, vertical+horizontal status tracker (5 steps), order items, delivery details, "Track Your Order" (passes `?id=` in URL), "Need Help?" WhatsApp
- **Track Order** (`pages/TrackOrder.tsx`): search by Order ID or phone, order card with status tracker + items + delivery info, "Need Help?" WhatsApp, collapsible "WhatsApp Message Templates" for store owner (4 status tabs: Confirmed/Shipped/Out for Delivery/Delivered, copy + send on WhatsApp)
- **TikTok Pixel** (`lib/tiktok-pixel.ts`): PageView, ViewContent, AddToCart, InitiateCheckout, CompletePayment, Contact (WhatsApp), ClickButton
- **Reviews** (`data/reviews.ts`, `components/ReviewsSection.tsx`): 5 reviews per product with Pakistani names, star distribution bars, photo lightbox, Write-a-Review form (WhatsApp submit), dynamic getProductRating()
- **Size Guide Modal** (`SizeGuideModal.tsx`): S-3XL chart with chest/length/shoulder
- **LocalStorage keys**: `sw_customer_info` (COD prefill), `sw_orders` (all orders), `sw_last_order_id` (confirmation page lookup), `sw_install_dismissed_at` (PWA)
