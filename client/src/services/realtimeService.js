import api from "./apiClient";
import { isSupabaseRealtimeConfigured, supabase } from "../lib/supabaseClient";

const PRESENCE_INTERVAL_MS = 45_000;
const TOKEN_REFRESH_BUFFER_MS = 60_000;

let channel = null;
let presenceTimer = null;
let tokenExpiresAt = 0;
let statusCallback = null;

const mapRealtimeRow = (row) => ({
  id: row.id,
  sender_id: row.sender_id,
  receiver_id: row.receiver_id,
  text: row.text,
  attachment_url: row.attachment_url,
  created_at: row.created_at,
  conversation_id: row.conversation_id,
  conversationId: row.conversation_id,
});

const notifyStatus = (connected) => {
  statusCallback?.(connected);
};

const fetchRealtimeToken = async () => {
  const response = await api.get("/realtime/token");
  const { token, expiresIn } = response.data;
  tokenExpiresAt = Date.now() + expiresIn * 1000;
  return token;
};

const ensureRealtimeAuth = async () => {
  if (!supabase) {
    throw new Error("Supabase Realtime is not configured.");
  }

  if (Date.now() > tokenExpiresAt - TOKEN_REFRESH_BUFFER_MS) {
    const token = await fetchRealtimeToken();
    await supabase.realtime.setAuth(token);
  }
};

const sendPresenceHeartbeat = async () => {
  try {
    await api.post("/realtime/presence", null, { _silentAuth: true });
  } catch {
    // Presence is best-effort; polling still works if this fails.
  }
};

const startPresenceHeartbeat = () => {
  stopPresenceHeartbeat();
  sendPresenceHeartbeat();
  presenceTimer = setInterval(sendPresenceHeartbeat, PRESENCE_INTERVAL_MS);
};

const stopPresenceHeartbeat = () => {
  if (presenceTimer) {
    clearInterval(presenceTimer);
    presenceTimer = null;
  }
};

const handleInsert = (onMessage) => (payload) => {
  if (!payload?.new) return;
  onMessage(mapRealtimeRow(payload.new));
};

export const subscribeToMessages = async (userId, { onMessage, onStatusChange }) => {
  if (!isSupabaseRealtimeConfigured || !userId) {
    notifyStatus(false);
    return;
  }

  statusCallback = onStatusChange;
  await unsubscribeFromMessages();

  try {
    await ensureRealtimeAuth();

    channel = supabase
      .channel(`messages:user:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `receiver_id=eq.${userId}`,
        },
        handleInsert(onMessage),
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `sender_id=eq.${userId}`,
        },
        handleInsert(onMessage),
      )
      .subscribe((status) => {
        const connected = status === "SUBSCRIBED";
        notifyStatus(connected);
        if (connected) {
          startPresenceHeartbeat();
        } else {
          stopPresenceHeartbeat();
        }
      });
  } catch (error) {
    console.error("Realtime subscription failed:", error.message);
    notifyStatus(false);
  }
};

export const unsubscribeFromMessages = async () => {
  stopPresenceHeartbeat();
  statusCallback = null;

  if (channel && supabase) {
    await supabase.removeChannel(channel);
    channel = null;
  }
};

export const isRealtimeAvailable = () => isSupabaseRealtimeConfigured;
