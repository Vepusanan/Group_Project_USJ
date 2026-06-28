# Uptime Monitoring

Covers NFR 17.4 task **4.4 — 99.5% uptime target**. Uptime is a
hosting/monitoring concern (you can't "code" availability), so this documents
how to *measure and alert* on it using the health-check endpoint the app
already exposes.

## The health endpoint (already implemented)

`GET /api/health` — see [`server/app.js`](../server/app.js).

It returns `200` with `{ status: "ok", checks: {...} }` when healthy, and a
`503`/`500` with `status: "error"` when the database or critical config is
unavailable. The `checks` object reports the state of: `database`, `email`,
`gemini`, `storage`, `jwt`, and `appUrl`.

```bash
curl -s https://<your-app>.vercel.app/api/health | jq
```

Because it actually runs `SELECT NOW()` against the DB, a `200` here means the
full request path (Vercel function → Supabase pooler → Postgres) is working —
not just that the process is up. That makes it a meaningful target for an
external monitor.

## Recommended setup (free, external)

Use an external monitor so you detect outages **even when Vercel itself is
down** (an in-app monitor can't report that it's offline). Free options that fit
this stack:

| Service | Free tier | Notes |
| --- | --- | --- |
| **UptimeRobot** | 50 monitors, 5-min interval | Simplest. Keyword + status-code checks. |
| **Better Stack (Uptime)** | 10 monitors, 30s–3min | Nice status pages + incident timeline. |
| **Cron-job.org** | Free HTTP cron | Bare-bones; pair with email alerts. |

**Configure the monitor to:**

1. **URL:** `https://<your-app>.vercel.app/api/health`
2. **Method:** `GET`
3. **Healthy when:** HTTP `200` **and** response body contains `"status":"ok"`
   (keyword check) — this catches "process up but DB down", which a bare TCP/200
   check would miss.
4. **Interval:** 1–5 minutes.
5. **Alerts:** email (and/or Slack/SMS) to the team on 2 consecutive failures
   (avoids flapping on a single cold-start blip).

## Interpreting the 99.5% target

99.5% uptime allows roughly:

| Window | Allowed downtime |
| --- | --- |
| Per day | ~7.2 minutes |
| Per month | ~3.6 hours |
| Per year | ~1.83 days |

The monitor's dashboard reports the achieved percentage; review it against
99.5%. Most outages on this stack will be either Supabase Free (which can pause
on inactivity / hit connection limits) or a bad deploy — both visible as
`/api/health` failures.

## Caveats specific to this stack

- **Supabase Free can auto-pause** a project after a week of inactivity; the
  first request then fails until it wakes. The external monitor's periodic ping
  doubles as a keep-warm, reducing cold-pause incidents.
- **Vercel function cold starts** add latency but return `200`; they don't count
  as downtime.
- For a higher SLA you'd move the DB to Supabase Pro (no auto-pause, better
  connection limits) — see [`disaster-recovery.md`](./disaster-recovery.md).
