# Vercel + Railway (monorepo) — step by step

This repo is a **pnpm workspace**. Vercel must install from the **repository root** so `workspace:*` packages resolve. Each app’s `vercel.json` already sets `installCommand` to `cd ../.. && pnpm install …` when the Vercel **Root Directory** is that app folder.

## What you will create

| Platform | Projects | Root Directory in UI | Purpose |
| --- | --- | --- | --- |
| Vercel | Storefront | `apps/web` | Public shop (Vite) |
| Vercel | Dashboard | `apps/dashboard` | Store owner dashboard (Next.js) |
| Vercel | Admin | `apps/admin` | Platform admin (Next.js) |
| Railway | API (one service) | **`.` (repo root)** | Backend (`apps/api`) via `Dockerfile.api` |

## 1) Database (Neon or any Postgres)

1. Create a database and copy `DATABASE_URL` (SSL on).
2. You will paste it into **Railway** (API) and use it locally for migrations.

## 2) Railway — API (recommended: Docker from repo root)

1. New project → **Deploy from GitHub** → select this repo.
2. **Service → Settings → Root Directory**: leave **empty** or `.` (repository root).  
   Do **not** set Root Directory to `apps/api` unless you switch to the alternate build in `apps/api/railway.toml`.
3. **Build**: Railway should pick up root [`railway.toml`](../../railway.toml) and [`Dockerfile.api`](../../Dockerfile.api).
4. **Variables** (minimum — add the rest from [DEPLOYMENT.md](../../DEPLOYMENT.md)):

| Variable | Example |
| --- | --- |
| `DATABASE_URL` | `postgresql://…` |
| `JWT_SECRET` | long random string |
| `PORT` | `3000` |
| `NODE_ENV` | `production` |

5. Deploy, then open the **public URL** Railway gives you (e.g. `https://xxx.up.railway.app`). That is your **API base** for Vercel env vars.

### Migrations (from your laptop)

```bash
export DATABASE_URL="postgresql://…"
pnpm db:migrate
pnpm db:seed
```

## 3) Vercel — Web (`apps/web`)

1. New project → same GitHub repo.
2. **Root Directory**: `apps/web`.
3. Framework: Vite (from `vercel.json`).
4. **Environment variables**:

| Name | Value |
| --- | --- |
| `VITE_API_URL` | `https://<your-railway-api-host>` |
| `VITE_DEFAULT_STORE_SLUG` | your store slug, e.g. `zorvik` |

5. Deploy.

## 4) Vercel — Dashboard (`apps/dashboard`)

1. New project → same repo.
2. **Root Directory**: `apps/dashboard`.
3. **Environment variables**:

| Name | Value |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | `https://<your-railway-api-host>` |

4. Deploy.

## 5) Vercel — Admin (`apps/admin`)

1. New project → same repo.
2. **Root Directory**: `apps/admin`.
3. **Environment variables**:

| Name | Value |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | `https://<your-railway-api-host>` |

4. Deploy.

## 6) Custom domains + CORS

1. Attach domains in Vercel (web / dashboard / admin) and in Railway (API) if you use a custom hostname.
2. Point DNS (CNAME / ALIAS) as each provider instructs.
3. After URLs are final, **update** `VITE_API_URL` and `NEXT_PUBLIC_API_URL` to the production API URL and redeploy all Vercel projects.
4. If the API blocks unknown origins, add your Vercel domains to the API CORS allowlist in code or env (whatever this project uses).

## 7) Quick verification

- API: health route (see [DEPLOYMENT.md](../../DEPLOYMENT.md) for paths you use in production).
- Web: homepage loads and product/API calls hit the Railway URL (browser Network tab).
- Dashboard / Admin: login page loads; API calls use `NEXT_PUBLIC_API_URL`.

## Repo layout (for deploy)

```text
zorvik/
  apps/
    web/           ← Vercel project 1 (Root: apps/web)
    dashboard/     ← Vercel project 2 (Root: apps/dashboard)
    admin/           ← Vercel project 3 (Root: apps/admin)
    api/             ← Built inside Docker (Railway root: .)
  packages/        ← shared workspace packages (installed from root)
  Dockerfile.api   ← API production image (build context = repo root)
  railway.toml     ← Railway build = Dockerfile.api (repo root)
```

## Alternate: Railway Root Directory = `apps/api`

Only if you prefer a smaller service scope: set Root Directory to `apps/api` and rely on [`apps/api/railway.toml`](../../apps/api/railway.toml) (Railpack + `buildCommand` that runs `pnpm` from the monorepo root). The Docker path above is usually easier to reason about.
