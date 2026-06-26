# Authentication system behavior contract

This document defines how auth and onboarding must behave in production. Code and tests should enforce these rules.

## Single source of truth

| Rule | Implementation |
|------|----------------|
| Auth state authority | `GET /api/auth/me` only |
| State interpretation | `getAuthState()` in `shared/authStateMachine.mjs` — **the only** way to derive auth status |
| Route decisions | `resolveAuthRouteDecision()` + `useAuthRouteGuard()` — no scattered boolean checks |
| Frontend context | Mirrors `/auth/me` via `authStatus` / `authMachine` from `getAuthState()` |
| Post-auth redirect | Backend `redirectPath` from login/register/verify responses |
| Onboarding completion | `users.onboarding_completed_at` — set when wizard is submitted |

The frontend `AuthContext` calls `/auth/me` on:

- Initial app load
- Every client-side route change (`RouteChangeAuthSync`)
- Tab focus (`visibilitychange`)
- Cross-tab sync (`storage` + `BroadcastChannel` via `auth:revision`)
- After login, logout, verify, token refresh, onboarding submit

`localStorage.userData` is a display cache only. It is **not** used for auth decisions.

The client must **not** infer onboarding state from profile APIs or completion percentage.

## Canonical auth states

| Status | Meaning | Default route |
|--------|---------|---------------|
| `UNAUTHENTICATED` | No session | Public routes only |
| `EMAIL_UNVERIFIED` | Session exists, email not verified | `/verify-email?email=...` |
| `ONBOARDING_REQUIRED` | Verified, wizard not completed (`onboarding_completed_at` is null) | `/onboarding` or `/investor-onboarding` |
| `AUTHENTICATED_READY` | Verified and onboarding completed | `/dashboard` and app routes |

`authState.onboardingComplete` is derived from `authState.onboardingCompletedAt` (boolean convenience). API route gating (`requireProfileComplete`) also uses `onboarding_completed_at` — **not** profile field completion %.

## Auth session shape (`/auth/me`)

```json
{
  "success": true,
  "user": {
    "id", "email", "fullName", "userType", "emailVerified",
    "onboardingCompletedAt", "isAdmin"
  },
  "redirectPath": "/onboarding | /investor-onboarding | /dashboard | /verify-email?email=...",
  "authState": {
    "status": "EMAIL_UNVERIFIED | ONBOARDING_REQUIRED | AUTHENTICATED_READY",
    "emailVerified": true,
    "onboardingComplete": false,
    "onboardingCompletedAt": null,
    "requiredRoute": "/onboarding | /verify-email?email=... | null"
  }
}
```

`buildAuthSession()` validates the contract via `validateAuthSessionContract()` before returning.

## Profile completeness (separate from auth)

Used only for feature gating, analytics, and API restrictions — **never** for routing:

```json
{
  "completionPercent": 59,
  "isFullyComplete": false
}
```

## Route gating (state machine)

All guards use `useAuthRouteGuard(guardMode)` — no independent `isVerified` / `isOnboarded` checks.

| Guard mode | Used for |
|------------|----------|
| `PUBLIC_AUTH` | `/login`, `/signup`, password reset |
| `VERIFY_EMAIL` | `/verify-email` |
| `PROTECTED` | Onboarding routes (auth required) |
| `APP` | Dashboard, connections, messages, etc. |

Guards show a full-screen spinner until initial `/auth/me` resolves (`isLoading`).

## Session endpoints

| Endpoint | Middleware | Notes |
|----------|------------|-------|
| `GET /auth/me` | `protectSession` | Allows unverified users (returns `EMAIL_UNVERIFIED`) |
| Other protected APIs | `protect` | Blocks unverified users (403) |

Register and login issue sessions for unverified users so `/auth/me` can return `EMAIL_UNVERIFIED`.

## Database

| Column | Table | Purpose |
|--------|-------|---------|
| `onboarding_completed_at` | `users` | Set once when onboarding wizard is submitted |

Legacy users with existing profiles are backfilled via migration (`20260628_add_onboarding_completed_at.sql`).

## Cookies (production)

| Attribute | Value |
|-----------|--------|
| `HttpOnly` | `true` |
| `Secure` | `true` when deployed (`VERCEL=1` or `NODE_ENV=production`) |
| `SameSite` | `lax` (override via `AUTH_COOKIE_SAME_SITE`) |
| `Path` | `/` |
| `Domain` | unset (same-origin Vercel deploy) |

Tokens are never exposed in JSON responses or `localStorage`.

## Multi-tab synchronization

When auth changes in one tab (login, logout, verify, register), `notifyAuthChanged()` bumps `localStorage.auth:revision` and broadcasts on `BroadcastChannel`. Other tabs revalidate via `/auth/me` and update `authStatus`.

## CI validation

| Check | Script / test |
|-------|----------------|
| Auth contract | `scripts/validate-auth-state-contract.mjs` |
| State machine unit tests | `server/tests/authStateMachine.test.js` |
| Auth flow integration | `server/tests/authStateFlow.test.js` |
| Onboarding routing | `server/tests/authOnboardingRouting.test.js` |
| E2E state transitions | `e2e/auth-state-machine.spec.js` |
| Startup smoke | `e2e/production-smoke.spec.js` |

## E2E coverage

See `e2e/auth-state-machine.spec.js`, `e2e/auth-hardening.spec.js`, `e2e/auth.spec.js`:

- Signup → `EMAIL_UNVERIFIED`
- Email verification → `ONBOARDING_REQUIRED`
- Onboarding wizard submit → `AUTHENTICATED_READY`
- Refresh persistence
- Multi-tab sync
- Token refresh / revalidation
