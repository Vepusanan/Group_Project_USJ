const STARTUP_ERRORS_KEY = "app:startup-errors";
const MAX_STORED = 10;

export function recordStartupError(error, context = {}) {
  const message =
    error?.message || (typeof error === "string" ? error : "Unknown error");
  const entry = {
    message,
    stack: error?.stack || null,
    context,
    at: new Date().toISOString(),
  };

  console.error("[app:startup-error]", entry);

  try {
    const prev = JSON.parse(sessionStorage.getItem(STARTUP_ERRORS_KEY) || "[]");
    prev.push(entry);
    sessionStorage.setItem(
      STARTUP_ERRORS_KEY,
      JSON.stringify(prev.slice(-MAX_STORED)),
    );
  } catch {
    // sessionStorage unavailable
  }

  try {
    window.dispatchEvent(
      new CustomEvent("app:startup-error", { detail: entry }),
    );
  } catch {
    // non-browser
  }

  return entry;
}

export function getStartupErrors() {
  try {
    return JSON.parse(sessionStorage.getItem(STARTUP_ERRORS_KEY) || "[]");
  } catch {
    return [];
  }
}

/** Install global handlers before React mounts (catches import/ReferenceError). */
export function installStartupMonitoring() {
  if (typeof window === "undefined") return;

  window.addEventListener("error", (event) => {
    recordStartupError(event.error || event.message, {
      type: "window.error",
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    recordStartupError(event.reason, { type: "unhandledrejection" });
  });
}
