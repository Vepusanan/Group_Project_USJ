import { useCallback, useEffect, useRef, useState } from "react";
import { apiService } from "../services/apiService";
import { useAuth } from "./useAuth";
import { AUTH_STATUS } from "../utils/authStateMachine.js";

// Notification types that represent pending activity on a specific connection,
// grouped by which connection-card button they should flag.
export const CONNECTION_FLAG_TYPES = {
  meetings: ["meeting_request", "meeting_confirmed", "meeting_declined"],
  dd: ["dd_checklist_shared", "dd_checklist_response"],
  qa: ["qa_question", "qa_answer"],
};

const ALL_FLAG_TYPES = new Set(
  Object.values(CONNECTION_FLAG_TYPES).flat(),
);

const POLL_MS = 30000;

/**
 * Fetches the in-app notification feed and derives, per connection, which
 * connection-card features have unread activity. Drives the red-dot flags on
 * the Connections nav item and the per-button badges.
 *
 * Returns:
 *  - byConnection: Map<connectionId, Set<type>>
 *  - hasAnyActivity: boolean (any flaggable unread notification exists)
 *  - flagsFor(connectionId): { meetings, dd, qa } booleans
 *  - markFeatureRead(connectionId, feature): clears that feature's flag
 *  - refresh(): re-fetch now
 */
export const useConnectionNotifications = () => {
  const { authStatus } = useAuth();
  const isReady = authStatus === AUTH_STATUS.AUTHENTICATED_READY;
  const [notifications, setNotifications] = useState([]);
  const mountedRef = useRef(true);

  const refresh = useCallback(async () => {
    if (!isReady) return;
    const result = await apiService.getNotifications();
    if (!mountedRef.current || !result.success) return;
    const list = result.data?.data || [];
    setNotifications(list.filter((n) => ALL_FLAG_TYPES.has(n.type)));
  }, [isReady]);

  useEffect(() => {
    mountedRef.current = true;
    refresh();
    const interval = setInterval(refresh, POLL_MS);
    return () => {
      mountedRef.current = false;
      clearInterval(interval);
    };
  }, [refresh]);

  const byConnection = new Map();
  for (const n of notifications) {
    const connectionId = n.data?.connectionId;
    if (!connectionId) continue;
    const key = String(connectionId);
    if (!byConnection.has(key)) byConnection.set(key, new Set());
    byConnection.get(key).add(n.type);
  }

  const flagsFor = (connectionId) => {
    const types = byConnection.get(String(connectionId)) || new Set();
    return {
      meetings: CONNECTION_FLAG_TYPES.meetings.some((t) => types.has(t)),
      dd: CONNECTION_FLAG_TYPES.dd.some((t) => types.has(t)),
      qa: CONNECTION_FLAG_TYPES.qa.some((t) => types.has(t)),
    };
  };

  // Optimistically clear a feature's flag for a connection and mark the
  // underlying notifications read on the server.
  const markFeatureRead = useCallback(
    (connectionId, feature) => {
      const wantedTypes = new Set(CONNECTION_FLAG_TYPES[feature] || []);
      const toClear = notifications.filter(
        (n) =>
          String(n.data?.connectionId) === String(connectionId) &&
          wantedTypes.has(n.type),
      );
      if (toClear.length === 0) return;

      setNotifications((prev) =>
        prev.filter((n) => !toClear.some((c) => c.key === n.key)),
      );
      for (const n of toClear) {
        apiService.markNotificationRead(n.key).catch(() => undefined);
      }
    },
    [notifications],
  );

  return {
    byConnection,
    hasAnyActivity: byConnection.size > 0,
    flagsFor,
    markFeatureRead,
    refresh,
  };
};

export default useConnectionNotifications;
