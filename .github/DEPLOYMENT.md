# Vercel deployment

Production hosting for **StartHub Capital** — React SPA + Express API + Supabase Realtime.

## Architecture

```text
https://your-app.vercel.app
├── /              → React SPA (client/dist)
├── /api/*         → Express serverless (api/index.js → server/app.js)
├── /api/cron/*    → Scheduled cleanup
└── Realtime       → Browser → Supabase (messages)
```

**Root config:** `vercel.json` at repository root. Do not deploy `client/` or `server/` as separate projects.

## 1. Create the Vercel project

1. [vercel.com/new](https://vercel.com/new) → import GitHub repo
2. **Root Directory:** `.` (repository root — **not** `client/`)
3. **Framework:** Other (uses `vercel.json`)
4. **Node.js:** 20

### Critical dashboard settings

Confirm these in **Vercel → Project → Settings → General**:

| Setting | Must be |
|---------|---------|
| Root Directory | `.` |
| Output Directory | `client/dist` |
| Install Command | `npm ci` |
| Build Command | `npm run vercel-build` |

Wrong **Output Directory** (`dist` instead of `client/dist`) is the most common cause of a **white screen**.

## 2. Environment variables

Set in **Vercel → Settings → Environment Variables** for **Production** and **Preview**.

### Server (runtime)

| Variable | Required | Notes |
|----------|----------|--------|
| `NODE_ENV` | Yes | `production` |
| `DATABASE_URL` | Yes | Supabase pooler URL |
| `SUPABASE_URL` | Yes | |
| `SUPABASE_ANON_KEY` | Yes | Or `SUPABASE_SERVICE_KEY` for uploads |
| `SUPABASE_JWT_SECRET` | Yes | Supabase → Settings → API → JWT Secret |
| `JWT_SECRET` | Yes | App auth |
| `JWT_VERIFY_SECRET` | Yes | Email verification |
| `BASE_URL` | Yes | `https://your-app.vercel.app` (same as `FRONTEND_URL` on Vercel) |
| `FRONTEND_URL` | Yes | `https://your-app.vercel.app` — **single source of truth** for auth email links |
| `CRON_SECRET` | Yes | Random string for `/api/cron/cleanup` |
| `ADMIN_EMAILS` | Yes | Comma-separated |
| `EMAIL_SMTP_*` / `EMAIL_FROM` | Recommended | Auth emails |

### Frontend (build-time)

| Variable | Required | Value |
|----------|----------|--------|
| `VITE_API_URL` | Yes | `/api` |
| `VITE_SUPABASE_URL` | Yes | `https://xxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Yes | Anon key |

`VITE_API_URL` is also set in `vercel.json`; Supabase vars must be in the Vercel dashboard.

## 3. Supabase setup

1. Run `supabase/migrations/20260623_messages_realtime_presence.sql` in the SQL editor
2. Confirm `messages` is in the `supabase_realtime` publication
3. Copy **JWT Secret** → `SUPABASE_JWT_SECRET` on Vercel

## 4. CI/CD

Workflow: `.github/workflows/ci-cd.yml`

| Trigger | Action |
|---------|--------|
| Push / PR | Build, test, validate `vercel.json` |
| Push to `main` | Deploy production + `/api/health` smoke test |
| Pull request | Preview deploy + PR comment |

**GitHub secrets:** `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`

## 5. Local commands

```bash
npm run ci          # install, build, test
npm run dev:client  # Vite on :3000 (proxies /api)
npm run dev:server  # Express on :5001
```

Production smoke test locally:

```bash
npm run build:production
NODE_ENV=production npm run dev:server
```

## 6. Troubleshooting white screen / API errors

### `FUNCTION_INVOCATION_FAILED` on `/api/health`

The serverless function is crashing at startup — almost always **missing environment variables on Vercel**.

1. Open **Vercel → Project → Settings → Environment Variables**
2. Copy values from your local `server/.env` (at minimum):
   - `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_JWT_SECRET`
   - `JWT_SECRET`, `JWT_VERIFY_SECRET`, `BASE_URL`, `FRONTEND_URL`
   - `ADMIN_EMAILS`, `CRON_SECRET`
3. Set build-time vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_URL=/api`
4. **Redeploy** (env changes do not apply to past deployments)

After redeploy, `/api/health` should return JSON (503 with a clear message if something is still missing, or 200 when connected).

### White screen (frontend)

1. **Output Directory** must be `client/dist` (not `dist`)
2. **Build logs** should end with `Vercel build verified`
3. **DevTools → Network** — `/assets/*.js` must return `200` + `application/javascript` (not HTML)
4. **DevTools → Console** — check for chunk load or env errors
5. **API check:** `curl https://your-app.vercel.app/api/health`

## 7. Verify after deploy

```bash
curl https://your-app.vercel.app/api/health
```

Test: login, messaging (instant via Realtime), file uploads (Supabase storage).

## 8. Notes

- **File uploads** use in-memory multer → Supabase (Vercel-compatible)
- **Messaging** uses Supabase Realtime, not Socket.io
- **`server/server.js`** is for local dev only; Vercel uses `api/index.js`
- **Cron** runs via Vercel cron + `CRON_SECRET`, not `node-cron`
