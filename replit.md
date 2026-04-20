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
  - Product listing with search + category filter
  - Product detail page with variant selection
  - WhatsApp order button (floating + per-product)
  - COD (Cash on Delivery) order form with Pakistani phone validation
  - TikTok Pixel tracking (PageView, ViewContent, InitiateCheckout, CompletePayment)
  - Cart with localStorage persistence
- **Config file**: `artifacts/pk-store/src/config.ts`
  - `storeName`, `whatsappNumber`, `tikTokPixelId`, `deliveryCharge`, `currency`
- **Products data**: `artifacts/pk-store/src/data/products.ts`
- **Product images**: `artifacts/pk-store/public/` (tshirt.png, ebook.png, perfume.png, hero.png)
