/**
 * Centralized URL configuration for auth redirects and email links.
 *
 * Production requires FRONTEND_URL — no fallbacks, no localhost, no guessing.
 * Local development uses explicit env vars or localhost defaults.
 */

const LOCAL_FRONTEND = "http://localhost:3000";
const LOCAL_BACKEND = "http://localhost:5001";

const isLocalDev = () =>
  process.env.NODE_ENV !== "production" && process.env.VERCEL !== "1";

const isLocalhostUrl = (url) =>
  /:\/\/(localhost|127\.0\.0\.1)(:\d+)?(?:\/|$)/i.test(url);

function normalizeBaseUrl(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return null;
  const withScheme =
    trimmed.startsWith("http://") || trimmed.startsWith("https://")
      ? trimmed
      : `https://${trimmed}`;
  return withScheme.replace(/\/+$/, "");
}

function requireProductionUrl(envKey) {
  const url = normalizeBaseUrl(process.env[envKey]);
  if (!url) {
    throw new Error(
      `${envKey} is required in production. Set it in Vercel environment variables and redeploy.`,
    );
  }
  if (isLocalhostUrl(url)) {
    throw new Error(
      `${envKey} cannot be localhost in production (got ${url}).`,
    );
  }
  return { url, source: envKey };
}

function resolveFrontendUrl() {
  if (isLocalDev()) {
    const url =
      normalizeBaseUrl(process.env.FRONTEND_URL) ||
      normalizeBaseUrl(process.env.BASE_URL) ||
      LOCAL_FRONTEND;
    return { url, source: process.env.FRONTEND_URL ? "FRONTEND_URL" : "default" };
  }
  return requireProductionUrl("FRONTEND_URL");
}

/** @returns {string} Public frontend origin (no trailing slash). */
export const getFrontendBaseUrl = () => resolveFrontendUrl().url;

/** Same-origin API base on Vercel — identical to frontend URL. */
export const getBackendBaseUrl = () => getFrontendBaseUrl();

export const getAppUrlConfig = () => {
  const frontend = resolveFrontendUrl();
  const usesLocalhost =
    frontend.url.includes("localhost") || frontend.url.includes("127.0.0.1");

  return {
    frontend: frontend.url,
    backend: frontend.url,
    frontendSource: frontend.source,
    backendSource: frontend.source,
    productionSafe: isLocalDev() ? true : !usesLocalhost,
  };
};

export const buildVerifyEmailCallbackUrl = (token) =>
  `${getFrontendBaseUrl()}/verify-email?token=${encodeURIComponent(token)}`;
