// Content-Security-Policy directive builder (NFR 17.2 — Security).
//
// helmet ships a sensible default CSP, but it doesn't know about this app's
// specific external dependencies (Supabase Storage, Google Fonts) or the
// runtime needs of the SPA (PDF.js WASM + blob workers, blob/data preview
// images). This builds an explicit policy that covers those, derived from env
// so it stays correct across deployments.
//
// Extra origins can be appended without code changes via:
//   CSP_CONNECT_SRC / CSP_IMG_SRC / CSP_SCRIPT_SRC  (space- or comma-separated)

const GOOGLE_FONTS_STYLE = "https://fonts.googleapis.com";
const GOOGLE_FONTS_FONT = "https://fonts.gstatic.com";

function originFromUrl(value) {
  try {
    return new URL(String(value)).origin;
  } catch {
    return null;
  }
}

function splitEnvList(value) {
  return String(value || "")
    .split(/[\s,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Collect external origins the SPA must be allowed to talk to / load from.
 * Currently just Supabase (storage + REST), plus any CSP_* env overrides.
 */
function supabaseOrigins() {
  const origins = new Set();
  const supabaseOrigin = originFromUrl(process.env.SUPABASE_URL);
  if (supabaseOrigin) origins.add(supabaseOrigin);

  const endpointOrigin = originFromUrl(process.env.SUPABASE_STORAGE_ENDPOINT);
  if (endpointOrigin) origins.add(endpointOrigin);

  return [...origins];
}

/**
 * Build the helmet contentSecurityPolicy `directives` object.
 */
export function buildCspDirectives() {
  const supabase = supabaseOrigins();

  const connectSrc = [
    "'self'",
    ...supabase,
    ...splitEnvList(process.env.CSP_CONNECT_SRC),
  ];

  const imgSrc = [
    "'self'",
    "data:",
    "blob:",
    ...supabase,
    ...splitEnvList(process.env.CSP_IMG_SRC),
  ];

  const scriptSrc = [
    "'self'",
    // PDF.js renders via WebAssembly, which requires wasm-unsafe-eval.
    "'wasm-unsafe-eval'",
    ...splitEnvList(process.env.CSP_SCRIPT_SRC),
  ];

  const directives = {
    defaultSrc: ["'self'"],
    baseUri: ["'self'"],
    objectSrc: ["'none'"],
    frameAncestors: ["'self'"],
    formAction: ["'self'"],
    scriptSrc,
    // Tailwind output is static, but a handful of components set inline styles,
    // so 'unsafe-inline' is required for style only (not script).
    styleSrc: ["'self'", "'unsafe-inline'", GOOGLE_FONTS_STYLE],
    fontSrc: ["'self'", GOOGLE_FONTS_FONT, "data:"],
    imgSrc,
    connectSrc,
    // PDF.js spins up its worker; blob: covers worker bundles created at runtime.
    workerSrc: ["'self'", "blob:"],
    mediaSrc: ["'self'", "blob:", "data:", ...supabase],
  };

  // Only force HTTPS upgrades in production (over plain http in dev this
  // directive would block local asset loads).
  if (process.env.NODE_ENV === "production") {
    directives.upgradeInsecureRequests = [];
  }

  return directives;
}
