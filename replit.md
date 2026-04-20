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
- **Admin Dashboard** (`pages/Admin.tsx`): `/admin` route; password gate (config.ts `adminPassword: "smartwear2024"`, `sw_admin_auth` localStorage); 3 tabs — Orders, Products, Templates; **Orders tab**: overview cards (Total Orders, Revenue, Today, Pending), orders table with sort-by-date, search (ID/name/phone), status filter dropdown, StatusBadge colors, actions (StatusDropdown, **Send Update** dropdown with 5 WA templates auto-filling customer data, Mark as Shipped/Deliver, Copy phone), Export Orders CSV, mobile card view; **Products tab** (`components/admin/AdminProducts.tsx`): product list table (thumbnail, name, category, price, compare-at, stock, status badge), Add Product modal (all fields), Edit Product modal, Delete with confirmation, Toggle Active/Draft, search + status filter, Import CSV (Shopify format, preview table, confirm), Export Products CSV; **Templates tab** (`components/admin/AdminTemplates.tsx`): 5 pre-built WA templates (Order Confirmed, Shipped, OFD, Delivered+Review, Abandoned Cart), editable textarea, variable pills, live preview with sample data, Copy to Clipboard, Open in WhatsApp (with phone input), Reset to Defaults, localStorage persistence; `lib/wa-templates.ts`: fillTemplate(), orderToVars(), getTemplates(), saveTemplates(); darker `#0a0a0f` bg; `updateOrderStatus()` + 'cancelled' in orders.ts
- **Products Store** (`lib/products-store.ts`): localStorage key `sw_products`; `getProducts()` falls back to default products; `addProduct/updateProduct/deleteProduct/importProducts/exportProductsCSV/parseShopifyCSV/resetToDefaults`; dispatches `sw-products-updated` custom event on every save
- **useProducts hook** (`hooks/use-products.tsx`): reactive hook listening to `sw-products-updated` and `storage` events; replaces static `products` import in: Home, Catalog, ProductDetail, Wishlist, RecentlyViewed, RelatedProducts
- **Recommendations** (`components/Recommendations.tsx`): `YouMightAlsoLike` (ProductDetail — 4 same-category-first picks, horizontal scroll, mini card with Quick Add), `CompleteYourLook` (Cart — different category from cart items, 4 picks), `CustomersAlsoBought` (OrderConfirmation — 3 cross-sell picks + COMEBACK10 promo banner + Shop More CTA); shared `MiniProductCard` (portrait image, 2-line name, Rs price + sale badge, Quick Add/View button, sold-out state); `ScrollRow` horizontal snap scroll; stable-deterministic shuffle using excludeId seed; all use `useProducts()` hook + `useCart()` for Quick Add
- **Return & Exchange Policy** (`pages/ReturnPolicy.tsx`): `/return-policy` route; 4 policy cards (Easy Returns, Exchange Process, Refund Policy, Non-Returnable Items) with colored bordered sections; quick trust badges; WhatsApp CTA button at bottom; linked from footer Quick Links + "Easy Returns" trust badge on ProductDetail (4th item in trust row, grid-cols-2 sm:grid-cols-4, "Learn more →" navigates to /return-policy)
- **PWA**: `public/manifest.json`, `public/sw.js` (cache-first images, network-first app), `public/icon-192.svg`, `public/icon-512.svg`
- **SEO**: `public/robots.txt`, `public/sitemap.xml`, JSON-LD Product schema on ProductDetail
- **Checkout + Payment** (`CODForm.tsx`): 20-city dropdown, phone auto-format, localStorage returning-customer pre-fill, free delivery >Rs. 2000, saves full order + navigates to `/order-confirmation`; **Payment method selection**: COD (default) or Online Payment (JazzCash/Easypaisa/Bank Transfer); JC/EP shows account number+title+copy button+"Send Rs.X" instruction; Bank Transfer shows all bank details; Transaction ID input + screenshot upload (filename-only, no actual upload); order summary shows live payment method + transaction ID; WhatsApp message includes payment method, transaction ID, screenshot note; footer note + button text change based on method; "⚡ Online payment orders ship within 24 hours" note; payment config in `config.ts` under `payment` key
- **Order Tracking** (`lib/orders.ts`): StoredOrder type, localStorage helpers (saveOrder, searchOrders, getOrderById), WhatsApp templates per status, 5-step status tracker
- **Order Confirmation** (`pages/OrderConfirmation.tsx`): animated checkmark, Order ID + copy button, delivery estimate, vertical+horizontal status tracker (5 steps), order items, delivery details, "Track Your Order" (passes `?id=` in URL), "Need Help?" WhatsApp
- **Track Order** (`pages/TrackOrder.tsx`): search by Order ID or phone, order card with status tracker + items + delivery info, "Need Help?" WhatsApp, collapsible "WhatsApp Message Templates" for store owner (4 status tabs: Confirmed/Shipped/Out for Delivery/Delivered, copy + send on WhatsApp)
- **TikTok Pixel** (`lib/tiktok-pixel.ts`): PageView, ViewContent, AddToCart, InitiateCheckout, CompletePayment, Contact (WhatsApp), ClickButton
- **Collections Architecture** (Postgres-backed): `collectionsTable`, `productsTable`, `productCollectionsTable` schemas in `lib/db/src/schema/`; full CRUD REST API in `artifacts/api-server/src/routes/collections.ts` + `products.ts`; OpenAPI spec in `lib/api-spec/openapi.yaml`; React Query hooks auto-generated via Orval; Collections tab in admin dashboard
- **Admin: Collections Tab** (`components/admin/AdminCollections.tsx`): Create/Edit/Delete collections with slug auto-gen; product listing per collection (expandable row); inline CSV import modal (Shopify + SmartWear formats); "New Collection" + "Import CSV" buttons
- **Admin: TikTok Pixel Tab** (`components/admin/AdminTikTokPixel.tsx`): Pixel ID input, master enable toggle, per-event toggles (PageView/ViewContent/AddToCart/InitiateCheckout/CompletePayment/Search), status grid, event debug log panel (auto-refresh every 2s from localStorage), settings saved to `sw_tiktok_pixel_settings`
- **CSV Import API** (`artifacts/api-server/src/lib/csv-parser.ts`): Shopify multi-row format (grouped by Handle) + simple SmartWear format; POST /api/products/import with optional collectionId assignment, replaceExisting flag, error reporting per row
- **Reviews** (`data/reviews.ts`, `components/ReviewsSection.tsx`): 5 reviews per product with Pakistani names, star distribution bars, photo lightbox, Write-a-Review form (WhatsApp submit), dynamic getProductRating()
- **Size Guide Modal** (`SizeGuideModal.tsx`): S-3XL chart with chest/length/shoulder
- **LocalStorage keys**: `sw_customer_info` (COD prefill), `sw_orders` (all orders), `sw_last_order_id` (confirmation page lookup), `sw_install_dismissed_at` (PWA)
