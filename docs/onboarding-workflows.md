# Registration and Onboarding Workflows

This document describes the **implemented** startup and investor registration and onboarding flows in the platform.

> See also:
> - [Startup Discovery Workflow (Investor Perspective)](./startup-discovery-workflow.md)
> - [Connection Process Workflow](./connection-workflow.md)

---

## Startup Registration and Onboarding Workflow

### 1. Account Creation

1. User visits the platform and selects **Sign up** (`/signup`).
2. User selects **Startup** from the **User Type** dropdown.
3. User provides:
   - **Full Name / Company Name** (stored as `full_name` on the user account)
   - **Email address**
   - **Password** (minimum 10 characters; must include uppercase, lowercase, number, and special character)
   - **Confirm password**
   - Agreement to **Terms and Conditions**
4. User submits the registration form.
5. On success, the user is redirected to `/verify-email?email=...` with instructions to check their inbox.

> **Note:** The formal company name is collected again in onboarding Step 1 (`company_name`). The signup name and profile company name may differ.

### 2. Email Verification

1. The platform sends a verification email containing a **time-limited link** (valid for **24 hours**).
2. The link opens `/verify-email?token=...` on the frontend, which calls the backend verification endpoint.
3. On success, the account status changes from **unverified** (`email_verified = false`) to **verified** (`email_verified = true`).
4. On success, the user is **automatically signed in** (session cookies set) and redirected to **`/onboarding`** (startup) or **`/investor-onboarding`** (investor). If a profile already exists, they go to `/dashboard`.
5. **Unverified users cannot log in** until email is confirmed.

**Path:** Sign up → verify email link → **auto-login** → onboarding wizard.

### 3. Multi-Step Onboarding

Users complete a **five-step startup onboarding wizard** at `/onboarding`. Onboarding must be completed before the main platform is accessible (`OnboardingGuard` blocks protected routes until a profile exists).

| Step | Title | Fields |
|------|-------|--------|
| **1 — Identity** | Company identity | Company name*, logo (optional), founders*, country*, city*, website (optional), LinkedIn (optional) |
| **2 — Business** | Business overview | Tagline*, description*, industry*, founded date*, current stage* (Idea / MVP / Early Revenue / Growth / Scaling) |
| **3 — Team** | Team & traction | Team size*; key team members (optional); key metrics, major achievements, customer testimonials (optional) |
| **4 — Funding** | Funding & documents | Funding stage*, amount seeking*, revenue status*, use of funds*; pitch deck PDF upload or URL (optional); business plan URL (optional); product demo URL (optional) |
| **5 — Contact** | Contact details | Primary contact name*, contact email*; phone (optional); social media links (optional) |

\*Required fields enforced by step validation before continuing.

- Users can navigate **Back** between steps and click completed step indicators to revisit earlier steps.
- Pitch deck (PDF) and **business plan (PDF or URL)** can be uploaded in Step 4.
- On final submit, the profile is created via `POST /api/startups/profile`.

### 4. Profile Activation

1. On completion of onboarding, the startup profile is created in the database.
2. The profile is **visible in the startup discovery feed** for investors (default `profile_visibility = public`).
3. **Profile completeness score** is shown on **My Profile** (`/profile`) and on **Analytics** (`/startup-analytics`).
4. **Verification tier** defaults to **Unverified** (`UNVERIFIED`).
5. The startup is redirected to **My Profile** (`/profile`).

### 5. Optional Verification Request

After onboarding, the startup navigates to **Settings → Verification** (`/settings`, Verification tab).

| Tier | Requirements | Outcome |
|------|--------------|---------|
| **Identity Verified** | Verified email + valid LinkedIn profile URL | Awarded **immediately** (auto-approved) |
| **Business Verified** | Valid LinkedIn URL + incorporation / registration document upload (PDF, DOC, DOCX) | Enters the **administrator review queue** (pending → approved or rejected) |

- Current verification status and any pending/rejected business request are shown on the Verification tab.
- Administrators can review the queue at `/admin/verification`.

---

## Investor Registration and Onboarding Workflow

### 1. Account Creation

1. User visits the platform and selects **Sign up** (`/signup`).
2. User selects **Investor** from the **User Type** dropdown.
3. User provides:
   - **Full Name / Company Name** (stored as `full_name` on the user account; formal name or firm is collected again in onboarding)
   - **Email address**
   - **Password** (same rules as startup registration)
   - **Confirm password**
   - Agreement to **Terms and Conditions**
4. User submits the registration form.
5. On success, the user is redirected to `/verify-email?email=...`.

### 2. Email Verification

1. The platform sends a verification email with a **24-hour** time-limited link.
2. User clicks the link; account status is set to verified (`email_verified = true`).
3. On success, the user is **automatically signed in** and redirected to **`/investor-onboarding`** (or `/dashboard` if a profile already exists).
4. **Unverified users cannot log in** until email is confirmed.

**Path:** Sign up → verify email link → **auto-login** → investor onboarding wizard.

### 3. Multi-Step Onboarding

Users complete a **five-step investor onboarding wizard** at `/investor-onboarding`. Onboarding must be completed before the main platform is accessible.

| Step | Title | Fields |
|------|-------|--------|
| **1 — Identity** | Investor identity | Name or firm*; photo or logo (optional); investor type*; years of experience*; country*, city*; website (optional); LinkedIn*; professional background* |
| **2 — Focus** | Investment focus | Investment thesis*; industries of interest*; geographic preference*; stage preference* |
| **3 — Details** | Investment details | Min / max investment size (USD)*; investment structure* (Equity, SAFE, Convertible Note, Debt, Grant, Other); investment timeline*; follow-on investment (optional toggle) |
| **4 — Portfolio** | Portfolio & criteria | Number of investments, successful exits, portfolio companies, notable achievements (optional); what you look for*; value add*; deal breakers, network & resources (optional) |
| **5 — Contact** | Contact details | Contact email*; phone (optional); preferred contact method* (Email / Phone / Either); social media — LinkedIn, Twitter (optional) |

\*Required fields enforced by step validation before continuing.

- **Photo / logo upload** is not part of onboarding; it can be added later when editing the profile. Discovery cards show an uploaded photo or a generated initial avatar.
- On final submit, the profile is created via `POST /api/investors/profile`.

### 4. Profile Activation

1. On completion of onboarding, the investor profile is created in the database.
2. The profile is **visible to startups** in the investor discovery feed (`/investors`) with default public visibility.
3. **Verification tier** defaults to **Unverified** (`UNVERIFIED`).
4. The investor is redirected to the **startup discovery feed** (`/startups`).

### 5. Optional Verification Request

Investors use the same **Settings → Verification** flow as startups (Identity Verified and Business Verified tiers). Verification is only available after onboarding is complete.

---

## Shared Platform Behaviour

| Behaviour | Detail |
|-----------|--------|
| **Route protection** | All main app routes (dashboard, discovery, settings, profile, etc.) require authentication and a completed profile via `OnboardingGuard`. |
| **Role-based home** | After login with an existing profile, users land on `/dashboard`. Role-specific discovery: startups → `/investors`; investors → `/startups`. |
| **Email resend** | Users on `/verify-email` can resend the verification email (rate-limited). |
| **Profile editing** | Both roles can update their profile after onboarding from **Edit Profile** (`/profile/edit`) and **Settings** (`/settings`). |
