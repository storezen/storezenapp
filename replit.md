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
- **Key components**: `Navbar.tsx`, `ProductCard.tsx`, `CountdownTimer.tsx`, `WhatsAppButton.tsx`, `SizeGuideModal.tsx`, `CODForm.tsx`, `InstallPrompt.tsx`, `SkeletonCard.tsx`
- **Pages**: Home, Catalog, Contact, ProductDetail, Cart (all lazy-loaded via React.lazy + Suspense)
- **Hooks**: `useSeo.ts` (dynamic meta/OG/Twitter/JSON-LD per page), `use-cart.ts`
- **PWA**: `public/manifest.json`, `public/sw.js` (cache-first images, network-first app), `public/icon-192.svg`, `public/icon-512.svg`
- **SEO**: `public/robots.txt`, `public/sitemap.xml`, JSON-LD Product schema on ProductDetail
- **COD Checkout** (`CODForm.tsx`): 20-city dropdown, phone auto-format (03XX-XXXXXXX), localStorage returning-customer pre-fill, free delivery >Rs. 2000, order ID generation
- **TikTok Pixel** (`lib/tiktok-pixel.ts`): PageView, ViewContent, AddToCart, InitiateCheckout, CompletePayment, Contact (WhatsApp), ClickButton; dev-mode pink console logs
- **Size Guide Modal** (`SizeGuideModal.tsx`): S-3XL chart with chest/length/shoulder, bottom-sheet mobile, centered desktop
- **Performance**: `prefers-reduced-motion` CSS rules, `animate-slide-up` animation
