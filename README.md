# Shopify Pixel Tool Monorepo

This repository is organized as a `pnpm` workspace with clear separation between apps, shared libraries, and automation scripts.

## Quick Start

- Use Node.js `24.x`
- Install dependencies: `pnpm install`
- Run storefront locally: `pnpm --filter @workspace/pk-store run dev`
- Run full typecheck: `pnpm run typecheck`
- Optional command shortcuts: `make help`

## Workspace Layout

- `apps/` -> runnable apps (`web`, `api`)
- `packages/` -> shared packages (`db`, API spec/zod/client)
- `scripts/` -> workspace automation scripts
- `docs/` -> architecture and development conventions

See `docs/FOLDER_STRUCTURE.md` for the standard folder blueprint to follow in future work.

## Production (Vercel + Railway)

Follow **`docs/deploy/VERCEL_AND_RAILWAY.md`** for creating four deployments (web, dashboard, admin on Vercel; API on Railway) with the correct monorepo **Root Directory** and env vars. Variable reference and smoke tests stay in **`DEPLOYMENT.md`**.

## Database and migrations

Provision Postgres (Neon, Supabase, or Vercel Postgres), set `DATABASE_URL` on the API host (Railway), then run migrations from your machine. Copy **`DEPLOYMENT.md`** for the full variable list and verification steps.

- Generate SQL: `DATABASE_URL="postgresql://..." pnpm --filter @workspace/api-server run db:generate`
- Apply migrations: `DATABASE_URL="postgresql://..." pnpm --filter @workspace/api-server run db:migrate`
- Shortcuts: `make db-generate`, `make db-migrate`, `make db-reset` (see `scripts/db.sh`)

Templates: `.env.example` and per-app `apps/*/.env.example`.

## Branch Protection (recommended)

For `main` branch in GitHub settings:
- Require pull request before merging
- Require status checks to pass before merging:
  - `typecheck`
  - `build`
  - `test`
  - `db-migration-check`
- Require branches to be up to date before merging
- Restrict force pushes
- Restrict deletions
