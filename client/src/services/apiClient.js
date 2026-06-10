import axios from "axios";

const API_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? "/api" : "http://localhost:5001/api");

// Shared axios instance. Auth is cookie-based (TC-SEC-006): tokens are
// HttpOnly cookies set by the backend, automatically attached by the
// browser. JS in this SPA cannot read or write them. See
// docs/superpowers/specs/2026-05-22-httponly-cookie-auth-design.md.
const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 30000,
  // Tell the browser to include cookies on cross-origin requests. The
  // backend must reply with `Access-Control-Allow-Credentials: true` and
  // an explicit Origin (not *).
  withCredentials: true,
});

// Module-level deduplication. When N requests 401 in parallel, the first
// one populates this promise; the rest await the same refresh instead of
// stampeding /auth/token.
let inFlightRefresh = null;

const terminalLogout = () => {
  // Tokens live in HttpOnly cookies and we cannot delete them from JS;
  // the backend clears them on /auth/logout. After a failed refresh the
  // cookies are effectively dead — we just drop the userData cache and
  // notify AuthContext so its in-memory state matches.
  localStorage.removeItem("userData");
  window.dispatchEvent(new Event("auth:force-logout"));
  if (window.location.pathname !== "/login") {
    window.location.href = "/login";
  }
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const url = original?.url || "";

    // Guard against a refresh-token call itself 401ing — refreshing again
    // would loop forever.
    if (error.response?.status === 401 && url.includes("/auth/token")) {
      terminalLogout();
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !original?._retry) {
      original._retry = true;
      try {
        if (!inFlightRefresh) {
          // No body — the browser sends the refresh_token cookie and the
          // backend sets a new access_token cookie on success.
          inFlightRefresh = api.post("/auth/token").finally(() => {
            inFlightRefresh = null;
          });
        }
        await inFlightRefresh;
        return api(original);
      } catch {
        terminalLogout();
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  },
);

export default api;
