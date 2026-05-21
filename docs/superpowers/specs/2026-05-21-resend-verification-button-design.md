# Resend Verification Email Button — Design

**Date:** 2026-05-21
**Status:** Approved (design); awaiting spec review
**Scope:** Frontend only

## Problem

After signup, users land on `/verify-email?email=<their-email>` which currently shows a static "check your inbox" message and a "Login" button. There is no way to request a new verification email from the UI, even though the backend endpoint, the `authService` method, and the `AuthContext` action are all already implemented. Users who lose the email or whose token expires (24h TTL) have no recovery path inside the app.

## Goal

Add a working "Resend verification email" button to the `EmailVerification` component, with cooldown handling to prevent accidental double-sends and abuse of the SMTP account.

## Non-Goals

- No backend changes. The endpoint `POST /api/auth/resend-verification` already exists and works.
- No new API methods. `authService.resendVerification(email)` and `AuthContext.resendVerification(email)` already exist.
- No rate limiting on the server (separate concern; the route is currently unthrottled, but client-side cooldown is the scope here).
- No surfacing of resend on Login page — that's a possible follow-up, not part of this work.
- No persistence of cooldown across reloads — the in-memory cooldown is sufficient for the accidental-double-click case.

## Existing Pipeline (unchanged)

- Backend: `server/controllers/authController.js:175` `resendVerification`, mounted at `POST /api/auth/resend-verification` in `server/routes/auth.js:23`. Returns `{ success: true, message: "..." }` for unknown emails (anti-enumeration), already-verified accounts, and successful sends; returns `{ success: false, error }` for `400` / `500`.
- Service: `client/src/services/authService.js:179` `resendVerification(email)` → normalizes response to `{ success, message }` or `{ success: false, error }`.
- Context: `client/src/context/AuthContext.jsx:365` exposes `resendVerification` via `useAuth()`.

## Component Changes

**File:** `client/src/components/auth/EmailVerification.jsx` (sole file touched)

### State

Three pieces of local state, all `useState`:

- `cooldown: number` — seconds remaining. `0` means clickable.
- `status: 'idle' | 'sending' | 'success' | 'error'`
- `feedback: string` — message to display under the button.

### Pull from context

`const { resendVerification, error: authError } = useAuth();` — replace the current `useAuth()` destructure.

### Email source

Already in scope: `const email = searchParams.get("email") || "yourmail@gmail.com";`

Detect the fallback explicitly:

```js
const hasRealEmail = Boolean(searchParams.get("email"));
```

### Handler

```js
const handleResend = async () => {
  if (cooldown > 0 || status === 'sending' || !hasRealEmail) return;
  setStatus('sending');
  setFeedback('');
  const result = await resendVerification(email);
  if (result?.success === false) {
    setStatus('error');
    setFeedback(result.error || 'Failed to resend verification email.');
    return;
  }
  setStatus('success');
  setFeedback(result?.message || 'A new verification link has been sent.');
  setCooldown(60);
};
```

### Cooldown effect

```js
useEffect(() => {
  if (cooldown <= 0) return;
  const id = setInterval(() => setCooldown((s) => s - 1), 1000);
  return () => clearInterval(id);
}, [cooldown]);
```

### Render

Add a button **above** the existing "Login" button. Use the existing `Button` component, `variant="white-border"` to visually distinguish it from the primary gradient Login button.

- Label: `cooldown > 0 ? \`Resend in ${cooldown}s\` : status === 'sending' ? 'Sending…' : 'Resend verification email'`
- `disabled`: `cooldown > 0 || status === 'sending' || !hasRealEmail`
- `onClick`: `handleResend`

Below the button, render the feedback box only when there is content:

- `status === 'success'` → green background/border (`bg-green-500/10 border-green-500/30 text-green-300`)
- `status === 'error'` → red background/border (matches the existing `authError` style)
- When `!hasRealEmail`, render a muted helper line: "Email address not available — open this page from your signup confirmation link."

The existing `authError` block stays as-is.

## Edge Cases

| Case | Behavior |
| --- | --- |
| No `?email=` query param | Button disabled; helper text explains why. Avoids hitting the anti-enumeration 200-OK path with a fake address. |
| Click while sending | Guarded by `status === 'sending'` check in handler. |
| Click during cooldown | Guarded by `cooldown > 0` check; button is also `disabled`. |
| Network error | `authService` returns `{ success: false, error }`; we show it red and do **not** start the cooldown so the user can retry. |
| Already-verified email | Backend returns `{ success: true, message: "This account is already verified." }` — we show it as a green success and start the 60s cooldown (consistent with success). |
| Component unmounts mid-cooldown | `useEffect` cleanup clears the interval. |

## Testing Plan

Manual verification (no automated tests are in place for this component):

1. Sign up → land on `/verify-email?email=real@example.com` → click "Resend verification email". Expect success message and 60s countdown on button label.
2. While countdown active, attempt to click again — button is disabled.
3. Wait for countdown to hit 0 — label resets to "Resend verification email" and button is enabled.
4. Visit `/verify-email` directly (no query) — button disabled, helper text shown.
5. Disconnect network, click resend on a valid `?email=` URL — expect red error, button re-enables immediately (no cooldown).
6. Use an already-verified email's URL — expect green "already verified" message and cooldown.

## Out of Scope / Follow-ups

- Server-side rate limiting on `/api/auth/resend-verification` (currently unthrottled — see `server/middleware/rateLimiter.js` placeholder noted in CLAUDE.md).
- Resend link on the Login page when login fails with "email not verified".
- Persisting cooldown across page reloads (would require `sessionStorage` and isn't justified for the accidental-double-click case).
