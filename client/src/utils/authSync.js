const CHANNEL_NAME = "starthub-auth-sync";
const REVISION_KEY = "auth:revision";

let channel = null;

function getChannel() {
  if (typeof BroadcastChannel === "undefined") return null;
  if (!channel) channel = new BroadcastChannel(CHANNEL_NAME);
  return channel;
}

/** Notify other tabs that auth state may have changed. */
export function notifyAuthChanged() {
  try {
    localStorage.setItem(REVISION_KEY, String(Date.now()));
  } catch {
    // private browsing / quota — channel-only sync
  }
  getChannel()?.postMessage({ type: "auth-changed" });
}

/** Subscribe to cross-tab auth sync events. Returns unsubscribe. */
export function subscribeAuthSync(onSync) {
  const onStorage = (event) => {
    if (event.key === REVISION_KEY) onSync();
  };
  window.addEventListener("storage", onStorage);

  const bc = getChannel();
  const onMessage = (event) => {
    if (event?.data?.type === "auth-changed") onSync();
  };
  bc?.addEventListener("message", onMessage);

  const onVisibility = () => {
    if (document.visibilityState === "visible") onSync();
  };
  document.addEventListener("visibilitychange", onVisibility);

  return () => {
    window.removeEventListener("storage", onStorage);
    bc?.removeEventListener("message", onMessage);
    document.removeEventListener("visibilitychange", onVisibility);
  };
}
