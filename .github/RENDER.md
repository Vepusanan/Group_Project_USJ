# Render deployment (free tier)

Deploy **frontend + backend + Socket.io** as a single Render **Web Service** from the repository root.

## Architecture

```text
https://your-app.onrender.com
├── /              → React SPA (client/dist)
├── /api/*         → Express REST API
├── /uploads/*     → local uploads (dev; use Supabase in prod)
└── socket.io      → real-time messaging
```

Config: [`render.yaml`](../render.yaml) at repo root.

## Free tier notes

| Limit | Detail |
|-------|--------|
| Cost | $0 on the **Free** plan |
| Sleep | Service **spins down after ~15 min** with no traffic |
| Cold start | First request after sleep can take **30–60 seconds** |
| Hours | 750 instance hours/month (enough for one always-used service) |
| RAM | 512 MB |

Fine for demos and uni projects; upgrade to a paid plan for always-on production.

## Option A — Blueprint (recommended)

1. [dashboard.render.com](https://dashboard.render.com) → **New** → **Blueprint**
2. Connect your GitHub repo
3. Render reads `render.yaml` and creates the web service
4. Enter secret env vars when prompted (`DATABASE_URL`, `SUPABASE_*`, email, etc.)
5. After the first deploy, set:
   - `BASE_URL=https://<your-service>.onrender.com`
   - `FRONTEND_URL=https://<your-service>.onrender.com`
6. **Manual Deploy** → redeploy so cookies/CORS use the correct URL

## Option B — Manual web service

1. **New** → **Web Service** → connect GitHub repo
2. Settings:

| Field | Value |
|-------|--------|
| **Root Directory** | `.` |
| **Runtime** | Node |
| **Build Command** | `npm ci --prefix client && npm ci --prefix server && VITE_API_URL=/api npm run build --prefix client` |
| **Start Command** | `npm start` |
| **Health Check Path** | `/api/health` |
| **Plan** | Free |
| **Region** | Singapore (closest to Sri Lanka) |

3. Add environment variables (see below)
4. Deploy

## Environment variables

Copy from `server/.env` into **Render → Service → Environment**:

### Required

| Variable | Example |
|----------|---------|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | Supabase pooler URL |
| `SUPABASE_URL` | `https://xxx.supabase.co` |
| `SUPABASE_ANON_KEY` | or `SUPABASE_SERVICE_KEY` |
| `JWT_SECRET` | long random string |
| `JWT_VERIFY_SECRET` | long random string |
| `BASE_URL` | `https://starthub-capital.onrender.com` |
| `FRONTEND_URL` | `https://starthub-capital.onrender.com` |
| `ADMIN_EMAILS` | `you@example.com` |
| `VITE_API_URL` | `/api` |

### Email

| Variable | Notes |
|----------|--------|
| `EMAIL_SMTP_HOST` | e.g. `smtp-relay.brevo.com` |
| `EMAIL_SMTP_PORT` | `587` |
| `EMAIL_SMTP_USER` | |
| `EMAIL_PASS` | |
| `EMAIL_FROM` | verified sender |

### Optional

`GEMINI_API_KEY`, `CRON_TIMEZONE`, `SUPABASE_SERVICE_KEY`, etc. — see `server/.env.example`.

**Do not set** `VITE_SOCKET_URL` — same-origin deploy; Socket.io uses the current host.

`PORT` is set automatically by Render — do not override.

## Build and start

| Phase | Command |
|-------|---------|
| **Build** | install client + server deps → `vite build` |
| **Start** | `node server/server.js` |
| **Health** | `GET /api/health` |

Local production smoke test:

```bash
npm run build:production
NODE_ENV=production PORT=5001 npm start
```

## Verify after deploy

```bash
curl https://your-app.onrender.com/api/health
```

Open the URL in a browser — login and messaging should work. Socket.io reconnects after cold starts.

## Cron jobs

Nightly cleanup runs via `node-cron` in `server/server.js` (02:00, `CRON_TIMEZONE` or `Asia/Colombo`). On the free tier the service may be asleep at cron time unless something keeps it warm — for a student project this is usually acceptable.

## Keep the service warm (optional)

Free services sleep when idle. Options:

- Use a free uptime monitor (e.g. UptimeRobot) to ping `/api/health` every 14 minutes
- Accept cold starts for demos
- Upgrade to Render **Starter** ($7/mo) for always-on

## Custom domain

Render → **Settings → Custom Domains** → add domain → update `BASE_URL` and `FRONTEND_URL` → redeploy.

## Unused on Render

`vercel.json`, `api/index.js`, and `railway.toml` are not used on Render — safe to ignore.
