function normalizeOrigin(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed.replace(/\/$/, "");
  }
  return `https://${trimmed.replace(/\/$/, "")}`;
}

function addOrigin(set, value) {
  const origin = normalizeOrigin(value);
  if (origin) set.add(origin);
}

/**
 * Build the CORS allowlist from env vars and Vercel deployment metadata.
 * Vercel sets VERCEL_URL / VERCEL_BRANCH_URL automatically per deployment.
 */
export function getCorsOrigins() {
  const origins = new Set();

  for (const key of ["FRONTEND_URL", "BASE_URL"]) {
    const raw = process.env[key];
    if (!raw) continue;
    for (const part of raw.split(",")) {
      addOrigin(origins, part);
    }
  }

  for (const key of [
    "VERCEL_URL",
    "VERCEL_BRANCH_URL",
    "VERCEL_PROJECT_PRODUCTION_URL",
  ]) {
    addOrigin(origins, process.env[key]);
  }

  return [...origins];
}
