# Storezen Deployment Guide - AUTOMATED

## Quick Deploy (No Manual Environment Setup)

---

### Railway (API + Database)

1. Go to [railway.app](https://railway.app)
2. Click **"New Project"** → **"Empty Project"**
3. Name: `storezen-api`
4. Add PostgreSQL: **"+ New"** → **"Database"** → **"PostgreSQL"**
5. Wait for green status

6. Go to **"Variables"** tab → Click **"Raw Editor"**

7. Copy-paste this entire block:

```env
DATABASE_URL=postgresql://postgres:wYkdoXskFDBkrNZvFLlNqTvSlSkPPyHG@postgres.railway.internal:5432/railway
JWT_SECRET=C7L3KQ2DJu1dGc7Iu7mUrsj8Klhpam3reLKy+8iJCHM=
ADMIN_EMAIL=admin@storepk.com
ADMIN_PASSWORD=strongpassword
NODE_ENV=production
PORT=3000
FRONTEND_ORIGINS=*
```

8. In **"Settings"** → **"Root Directory"** = `apps/api`
9. Click **"Deploy"**

10. Wait for deployment, copy the Railway URL (e.g., `https://storezen-api.up.railway.app`)

---

### Vercel (Frontend)

1. Go to [vercel.com](https://vercel.com)
2. Click **"Add New..."** → **"Project"**
3. Select `storezenapp` repository
4. **"Root Directory"** = `apps/web`

5. Go to **"Environment Variables"** section

6. Add these variables:

```
NEXT_PUBLIC_API_URL = https://YOUR-RAILWAY-URL.up.railway.app/api
NEXT_PUBLIC_WS_URL = https://YOUR-RAILWAY-URL.up.railway.app
NEXT_PUBLIC_STORE_NAME = Storezen
NEXT_PUBLIC_STORE_SLUG = demo
NEXT_PUBLIC_WHATSAPP = 923001234567
NEXT_PUBLIC_ADMIN_EMAIL = admin@storepk.com
```

7. Click **"Deploy"**

---

## After Deployment

Once both are deployed:

1. Railway URL: `https://[random]-[name].up.railway.app`
2. Vercel URL: `https://storezenapp.vercel.app`

Test health:
```
https://[railway-url]/health
```

Should return: `{"status":"ok"}`

---

## Database Setup (One-time)

After Railway deploys, run migrations:

1. Railway dashboard → API service
2. Click **"Shell"** (or use Railway CLI)
3. Run:
   ```bash
   pnpm db:migrate
   ```

Optional seed:
   ```bash
   pnpm db:seed
   ```

---

## Update Vercel (After Railway URL)

If Railway URL changes, update Vercel:
1. Vercel → Project → Settings → Environment Variables
2. Update `NEXT_PUBLIC_API_URL` with new Railway URL

---

## Files Created

| File | Purpose |
|------|---------|
| `apps/api/.env` | Local development config |
| `apps/api/.env.railway` | Railway env template |
| `apps/api/railway.toml` | Railway config with env vars |
| `apps/web/.env.vercel` | Vercel env template |

---

## Troubleshooting

### Railway Build Fails
- Check Root Directory is `apps/api`
- Check environment variables are set

### Vercel "No Next.js version"
- Root Directory must be `apps/web`

### API 500 Error
- DATABASE_URL might be wrong
- Check Railway PostgreSQL is green/connected

---

## URLs Format

| Service | URL Pattern |
|---------|------------|
| Railway API | `https://[project]-[random].up.railway.app` |
| Railway Health | `https://[project]-[random].up.railway.app/health` |
| Vercel Frontend | `https://storezenapp.vercel.app` |