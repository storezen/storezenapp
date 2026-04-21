# Deployment Guide

Step-by-step UI settings (Vercel monorepo roots, Railway Docker) live in **[docs/deploy/VERCEL_AND_RAILWAY.md](./docs/deploy/VERCEL_AND_RAILWAY.md)**.

## 1) Neon DB setup + connection string

1. Create a new project in [Neon](https://neon.tech/).
2. Create a database and copy the connection string.
3. Set `DATABASE_URL` in your deployment environments.
4. Ensure SSL is enabled in the connection string.

## 2) Vercel deploy web app + env vars

1. In Vercel, create a new project from this repository.
2. Set Root Directory to `apps/web`.
3. Vercel reads `apps/web/vercel.json` (Vite) and runs a monorepo-aware `installCommand` from the repo root.
4. Add environment variables:
   - `VITE_API_URL=https://api.storepk.com`
   - `VITE_DEFAULT_STORE=demo` (or your store slug)
5. Deploy.

## 3) Vercel deploy dashboard + env vars

1. Create another Vercel project.
2. Set Root Directory to `apps/dashboard`.
3. Vercel will use Next.js framework.
4. Add environment variable:
   - `NEXT_PUBLIC_API_URL=https://api.storepk.com`
5. Deploy.

## 4) Vercel deploy admin + env vars

1. Create another Vercel project.
2. Set Root Directory to `apps/admin`.
3. Vercel will use Next.js framework.
4. Add environment variable:
   - `NEXT_PUBLIC_API_URL=https://api.storepk.com`
5. Deploy.

## 5) Railway deploy API + env vars

**Recommended (Docker, full workspace):**

1. Create a new Railway project from this repository.
2. Set the service **Root Directory** to the **repository root** (`.` / empty), not `apps/api`, so `Dockerfile.api` can copy the whole monorepo.
3. Railway uses the root [`railway.toml`](./railway.toml) → [`Dockerfile.api`](./Dockerfile.api) build.
4. Add all required API env vars:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `ADMIN_EMAIL`
   - `ADMIN_PASSWORD`
   - `ULTRAMSG_INSTANCE_ID`
   - `ULTRAMSG_TOKEN`
   - `POSTEX_API_KEY`
   - `LEOPARDS_USERNAME`
   - `LEOPARDS_API_KEY`
   - `GEMINI_API_KEY`
   - `PORT=3000`
5. Deploy.

**Alternate:** set Root Directory to `apps/api` and use [`apps/api/railway.toml`](./apps/api/railway.toml) (Railpack + monorepo `buildCommand`) if you do not want a Docker build.

## 6) Run migrations

From repository root:

```bash
pnpm db:migrate
```

## 7) Run seed

From repository root:

```bash
pnpm db:seed
```

## 8) Test all endpoints

1. Health: `GET /health`
2. Auth: login/register/admin login
3. Products: public and admin CRUD
4. Orders: create, track, status updates
5. Shipping: book/sync/settings
6. Influencers: CRUD + referral route
7. AI: generate product description
8. Admin APIs: stats/stores/users/settings

## 9) Setup wildcard domain on Vercel

1. Add your root domain in Vercel Project Settings.
2. Add wildcard domain, e.g. `*.storepk.com`.
3. Configure DNS:
   - `A`/`ALIAS` for apex
   - `CNAME` for wildcard to Vercel target
4. Verify wildcard resolves to the correct Vercel project.

## 10) Custom domain configuration

1. Connect custom domains for:
   - Web app (storefront)
   - Dashboard app
   - Admin app
   - API domain (Railway/custom proxy)
2. Update env vars to final production URLs.
3. Enable HTTPS certificates.
4. Re-deploy all projects.
