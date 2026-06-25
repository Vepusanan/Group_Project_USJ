/**
 * Centralized URL configuration for auth redirects and email links.
 * Prefer FRONTEND_URL in production; fall back to BASE_URL for same-origin Vercel deploys.
 */
export const getFrontendBaseUrl = () => {
  const url =
    process.env.FRONTEND_URL ||
    process.env.CLIENT_URL ||
    process.env.APP_URL ||
    process.env.BASE_URL ||
    "http://localhost:3000";
  return url.replace(/\/+$/, "");
};

export const getBackendBaseUrl = () => {
  const url =
    process.env.BASE_URL ||
    process.env.FRONTEND_URL ||
    "http://localhost:5001";
  return url.replace(/\/+$/, "");
};

export const buildVerifyEmailCallbackUrl = (token) =>
  `${getFrontendBaseUrl()}/verify-email?token=${encodeURIComponent(token)}`;
