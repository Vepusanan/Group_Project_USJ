import { lazy } from "react";

const CHUNK_RELOAD_KEY = "app:chunk-reload-attempted";

function isChunkLoadError(error) {
  const message = error?.message || String(error);
  return (
    /Failed to fetch dynamically imported module/i.test(message) ||
    /ChunkLoadError/i.test(message) ||
    /Loading chunk [\d]+ failed/i.test(message)
  );
}

/**
 * Lazy-load a route module with a one-time full reload on chunk/HMR failures.
 * Common after Vite dev server restarts or production deploys.
 */
export function lazyWithRetry(importFn) {
  return lazy(async () => {
    try {
      const module = await importFn();
      sessionStorage.removeItem(CHUNK_RELOAD_KEY);
      return module;
    } catch (error) {
      if (isChunkLoadError(error) && !sessionStorage.getItem(CHUNK_RELOAD_KEY)) {
        sessionStorage.setItem(CHUNK_RELOAD_KEY, "1");
        window.location.reload();
        return new Promise(() => {});
      }
      throw error;
    }
  });
}
