/**
 * Centralized URL configuration for auth redirects and email links.
 *
 * Production: FRONTEND_URL (preferred) → CLIENT_URL / APP_URL / BASE_URL →
 * Vercel deployment metadata. Never falls back to localhost.
 * Development: explicit env vars, then localhost defaults.
 */

const LOCAL_FRONTEND = "http://localhost:3000";
const LOCAL_BACKEND = "http://localhost:5001";

const isProduction = () => process.env.NODE_ENV === "production";

function normalizeBaseUrl(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return null;
  const withScheme =
    trimmed.startsWith("http://") || trimmed.startsWith("https://")
      ? trimmed
      : `https://${trimmed}`;
  return withScheme.replace(/\/+$/, "");
}

function firstNormalizedUrl(keys) {
  for (const key of keys) {
    const url = normalizeBaseUrl(process.env[key]);
    if (url) return { url, source: key };
  }
  return null;
}

const FRONTEND_ENV_KEYS = [
  "FRONTEND_URL",
  "CLIENT_URL",
  "APP_URL",
  "BASE_URL",
];

const BACKEND_ENV_KEYS = ["BASE_URL", "FRONTEND_URL", "CLIENT_URL", "APP_URL"];

const VERCEL_ENV_KEYS = [
  "VERCEL_PROJECT_PRODUCTION_URL",
  "VERCEL_URL",
  "VERCEL_BRANCH_URL",
];

function resolveFrontendUrl() {
  const explicit = firstNormalizedUrl(FRONTEND_ENV_KEYS);
  if (explicit) return explicit;

  if (isProduction()) {
    const vercel = firstNormalizedUrl(VERCEL_ENV_KEYS);
    if (vercel) return vercel;
    throw new Error(
      "App URL not configured for production. Set FRONTEND_URL (recommended) or BASE_URL in Vercel environment variables.",
    );
  }

  return { url: LOCAL_FRONTEND, source: "default" };
}

function resolveBackendUrl() {
  const explicit = firstNormalizedUrl(BACKEND_ENV_KEYS);
  if (explicit) return explicit;

  if (isProduction()) {
    const vercel = firstNormalizedUrl(VERCEL_ENV_KEYS);
    if (vercel) return vercel;
    throw new Error(
      "App URL not configured for production. Set BASE_URL or FRONTEND_URL in Vercel environment variables.",
    );
  }

  return { url: LOCAL_BACKEND, source: "default" };
}

/** @returns {string} Public frontend origin (no trailing slash). */
export const getFrontendBaseUrl = () => resolveFrontendUrl().url;

/** @returns {string} Public API origin for same-origin links (no trailing slash). */
export const getBackendBaseUrl = () => resolveBackendUrl().url;

export const getAppUrlConfig = () => {
  const frontend = resolveFrontendUrl();
  const backend = resolveBackendUrl();
  const usesLocalhost =
    frontend.url.includes("localhost") || frontend.url.includes("127.0.0.1");

  return {
    frontend: frontend.url,
    backend: backend.url,
    frontendSource: frontend.source,
    backendSource: backend.source,
    productionSafe: isProduction() ? !usesLocalhost : true,
  };
};

export const buildVerifyEmailCallbackUrl = (token) =>
  `${getFrontendBaseUrl()}/verify-email?token=${encodeURIComponent(token)}`;
