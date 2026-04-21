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

## Production (Vercel + Postgres SQL)

### 1) Provision a Postgres database

Use either:
- **Vercel Postgres** (recommended if you want everything inside Vercel), or
- **Neon/Supabase** (also works perfectly)

You will get a `DATABASE_URL`.

### 2) Set environment variables (Vercel)

Set these **in the Vercel dashboard** (don’t commit them):
- **API** (`apps/api`)
  - `DATABASE_URL`
- **Web** (`apps/web`)
  - `API_URL` (optional for dev proxy; production web can call your API domain directly if needed)

There is a template at `.env.example`.

### 3) Run migrations

From local machine (or CI), using the API app schema:
- Generate SQL migrations:
  - `DATABASE_URL="postgresql://..." pnpm --filter @workspace/api-server run db:generate`
- Apply migrations:
  - `DATABASE_URL="postgresql://..." pnpm --filter @workspace/api-server run db:migrate`

### 3.1) Verify DB setup (recommended)

- Check API health (no DB dependency):
  - `curl http://localhost:8080/api/healthz`
- Check DB-backed endpoint (requires valid `DATABASE_URL`):
  - `curl http://localhost:8080/api/products`
- Expected behavior:
  - with DB configured: endpoint responds with JSON data
  - without DB configured: endpoint returns `500` with clear DB env error

### 3.2) Shortcut commands (Makefile + db script)

- Generate migration:
  - `make db-generate`
- Apply migration:
  - `make db-migrate`
- Recreate migration folder from current schema:
  - `make db-reset`

These commands call `scripts/db.sh`, which automatically reads `.env` and validates `DATABASE_URL`.

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

### 4) Deploy

Create **two Vercel projects**:
- **Web project**
  - Root Directory: `apps/web`
  - Output: `dist/public` (already configured via `apps/web/vercel.json`)
- **API project**
  - Root Directory: `apps/api`
  - Routes: handled via `apps/api/vercel.json` (serverless Express handler)
