import axios from "axios";
import { notifyAuthChanged } from "../utils/authSync";

const API_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? "/api" : "/api");

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  if (config.data === null || config.data === undefined) {
    delete config.data;
  }

  const method = (config.method || "get").toLowerCase();
  const hasJsonBody = config.data !== undefined;

  if (hasJsonBody && method !== "get" && method !== "head") {
    config.headers = config.headers || {};
    if (!config.headers["Content-Type"]) {
      config.headers["Content-Type"] = "application/json";
    }
  } else if (config.headers) {
    delete config.headers["Content-Type"];
  }

  return config;
});

let inFlightRefresh = null;

const shouldSkipTerminalLogout = (config) => Boolean(config?._silentAuth);

const terminalLogout = () => {
  localStorage.removeItem("userData");
  notifyAuthChanged();
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

    if (error.response?.status === 401 && url.includes("/auth/token")) {
      if (!shouldSkipTerminalLogout(original)) {
        terminalLogout();
      }
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !original?._retry) {
      original._retry = true;
      try {
        if (!inFlightRefresh) {
          inFlightRefresh = api
            .post("/auth/token", undefined, {
              _silentAuth: shouldSkipTerminalLogout(original),
            })
            .finally(() => {
              inFlightRefresh = null;
            });
        }
        await inFlightRefresh;
        return api(original);
      } catch {
        if (!shouldSkipTerminalLogout(original)) {
          terminalLogout();
        }
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  },
);

export default api;
