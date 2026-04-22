# Deployment guide

This monorepo uses **pnpm** workspaces. Vercel projects that use `apps/web`, `apps/dashboard`, or `apps/admin` as the root directory must install dependencies from the **repository root** so `workspace:*` packages resolve. The storefront `vercel.json` includes an `installCommand` for that; the Next.js apps ship a minimal `vercel.json`—set the **Install Command** in the Vercel project (see [§3](#3-vercel--storefront-appsweb)).

Shorter UI-focused notes: [docs/deploy/VERCEL_AND_RAILWAY.md](./docs/deploy/VERCEL_AND_RAILWAY.md).

---

## 1) Neon / Railway Postgres

1. Create a project in [Neon](https://neon.tech/) (or add a Postgres plugin on Railway).
2. Create a database and copy **`DATABASE_URL`** (use a role with DDL rights for migrations). Prefer `sslmode=require` where supported.
3. You will set the same `DATABASE_URL` on the **API** service and use it locally when running migrations.

---

## 2) Railway — API (recommended: Docker from repo root)

1. New Railway project → **Deploy from GitHub** → select this repository.
2. **Service → Settings → Root Directory**: leave **empty** or `.` (repository root).
3. Railway reads the root [`railway.toml`](./railway.toml) and builds with [`Dockerfile.api`](./Dockerfile.api) (full `pnpm install` + workspace build).
4. Set **Variables** (see [Environment variables](#environment-variables)).
5. Deploy and copy the public URL (e.g. `https://<service>.up.railway.app`). Your frontends need the **API base including `/api`** (Express mounts the router at `/api`), e.g. `https://<service>.up.railway.app/api`.

**Alternate (Railpack, service root `apps/api`):** set **Root Directory** to `apps/api` and use [`apps/api/railway.toml`](./apps/api/railway.toml) (monorepo `cd ../.. && pnpm install && pnpm --filter …`).

**Multiple Railway services (same repo):** add one service per app and set **Root Directory** to `apps/api`, `apps/web`, `apps/dashboard`, or `apps/admin`. Each app has a `railway.toml` with `cd ../..` so **pnpm workspace** resolves from the repo root. Set env vars per service (only the API needs `DATABASE_URL`, etc.).

---

## 3) Vercel — storefront (`apps/web`)

1. New Vercel project → same GitHub repo.
2. **Root Directory:** `apps/web`.
3. Framework is detected from [`apps/web/vercel.json`](./apps/web/vercel.json) (Vite). Build output is **`dist/public`** (see `vite.config.ts`).
4. **Domains (wildcard tenants):** in the Vercel project, add **`storepk.com`** (apex) and **`*.storepk.com`** (wildcard). Tenant routing is **client-side** (see [`use-store-slug.ts`](./apps/web/src/hooks/use-store-slug.ts)).
5. **SPA fallback:** [`apps/web/vercel.json`](./apps/web/vercel.json) rewrites unknown paths to `index.html`. [`apps/web/public/_redirects`](./apps/web/public/_redirects) (`/* /index.html 200`) is shipped for Netlify-style deploys or static mirrors; Vercel does not require it when rewrites are set.
6. **Environment variables:** see [Storefront (Vite)](#storefront-vite-appsweb) in the table below.
7. Deploy.

---

## 4) Vercel — dashboard (`apps/dashboard`)

1. New Vercel project → same repo.
2. **Root Directory:** `apps/dashboard`.
3. **Settings → General → Build & Development Settings**
   - **Install Command:** `cd ../.. && corepack enable && corepack prepare pnpm@9.15.4 --activate && pnpm install --frozen-lockfile`
   - **Build Command:** `pnpm run build` (or leave default if Vercel infers `next build` correctly after install).
4. **Environment variables:** [Dashboard](#dashboard-appsdashboard).
5. Deploy.

---

## 5) Vercel — platform admin (`apps/admin`)

Same as dashboard: **Root Directory** `apps/admin`, same **Install Command** as above, then [Admin](#admin-appsadmin) env vars.

---

## 6) Wildcard domain `*.storepk.com`

Use the wildcard on the **storefront** Vercel project (multi-tenant subdomains).

1. Vercel → storefront project → **Settings → Domains**.
2. Add apex `storepk.com` (and `www` if needed), then add **`*.storepk.com`**.
3. At your DNS provider:
   - Point the apex per Vercel’s instructions (often `A` / `ALIAS`).
   - Add a **`CNAME`** for `*` (or the exact wildcard record Vercel shows) to Vercel’s target (e.g. `cname.vercel-dns.com` or the value shown in the UI).
4. Wait for DNS + certificate provisioning.
5. On the **API**, set optional **`STORE_PUBLIC_ROOT_DOMAIN=storepk.com`** so subdomain detection ignores non-production hosts (see `storeFromHost` middleware). Set **`FRONTEND_ORIGINS`** to the real storefront origins (apex, `www`, wildcard app URL, preview URLs if needed).

---

## Environment variables

Copy from [`.env.example`](./.env.example) and adjust for production URLs.

### API (`apps/api` / Railway)

| Variable | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | Yes | Postgres connection string |
| `JWT_SECRET` | Yes | Long random string (32+ chars) |
| `ADMIN_EMAIL` | Yes | Used by seed / bootstrap flows |
| `ADMIN_PASSWORD` | Yes | Change after first deploy in production |
| `PORT` | Usually | Railway often injects `PORT`; default in code if unset |
| `NODE_ENV` | Yes | `production` |
| `FRONTEND_ORIGINS` | Recommended | CORS-related configuration in templates; list production storefront origins |
| `STORE_PUBLIC_ROOT_DOMAIN` | Optional | e.g. `storepk.com` — API subdomain parsing (`storeFromHost`) and **CORS** allow apex + `*.storepk.com` |
| `ULTRAMSG_INSTANCE_ID` | If using WhatsApp | |
| `ULTRAMSG_TOKEN` | If using WhatsApp | |
| `POSTEX_API_KEY` | If using PostEx | |
| `GEMINI_API_KEY` | If using AI features | |
| `WHATSAPP_ENABLED` | Optional | Feature flags where used |
| `WHATSAPP_WEBHOOK_SECRET` | Optional | Webhook verification |
| `LOG_LEVEL` | Optional | Default `info` |

### Storefront (Vite, `apps/web`)

| Variable | Required | Notes |
| --- | --- | --- |
| `VITE_API_URL` | Yes | Must end with **`/api`**, e.g. `https://xxx.up.railway.app/api` |
| `VITE_DEFAULT_STORE` | Yes | Default tenant slug on apex / localhost |
| `VITE_APP_NAME` | No | Brand fallback |
| `VITE_REF_BASE_URL` | Optional | Referral / influencer base URL |

### Dashboard (`apps/dashboard`)

| Variable | Required |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | Yes — same as `VITE_API_URL` (includes `/api`) |

### Admin (`apps/admin`)

| Variable | Required |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | Yes |
| `NEXT_PUBLIC_ADMIN_EMAIL` | Optional UX default |

After changing URLs, **redeploy** all Vercel projects and the API.

---

## Run migrations

From the **repository root**, with `DATABASE_URL` pointing at the same database the API uses:

```bash
export DATABASE_URL="postgresql://..."
pnpm db:migrate
```

Optional seed (development / first tenant):

```bash
pnpm db:seed
```

Platform admin seed (separate script, if you use it):

```bash
cd apps/api && pnpm seed:admin
```

---

## Test checklist

Run against production (or staging) URLs with HTTPS.

1. **API health** — `GET https://<api-host>/api/healthz` (router is mounted at `/api`).
2. **CORS / cookies** — Open storefront origin in browser; network tab shows API calls succeeding (no blocked CORS).
3. **Storefront** — Home loads; product list/detail; cart; checkout / order create; order tracking.
4. **Subdomain / tenant** — Visit `https://<slug>.storepk.com` (if wildcard configured); products resolve for that store.
5. **Auth** — Register / login (dashboard); admin login (platform admin).
6. **Dashboard** — Orders, products, settings, theme save.
7. **Admin** — Stats, stores, users, settings.
8. **Integrations** — WhatsApp / shipping / AI only if keys are set; smoke-test one endpoint each.
9. **Migrations** — Confirm latest migration applied (`pnpm db:migrate` exits 0; no schema drift errors in API logs).

---

## Turbo build pipeline

Root [`turbo.json`](./turbo.json) defines:

- **`build`:** `dependsOn: ["^build"]` so workspace dependencies build before dependents (packages with a `build` script; many packages are TypeScript source-only and have no `build`).
- **`outputs`:** `.next/**` and `dist/**` for caching artifacts from Next.js and bundled Node/Vite outputs.

Root `package.json` **`build`** runs `typecheck` then `pnpm -r --if-present run build` across the repo. Per-app shortcuts: `pnpm build:web`, `pnpm build:dashboard`, `pnpm build:admin`, `pnpm build:api`.
