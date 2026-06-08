import pool from "../config/database.js";
import { getPendingReceivedRequestsForUser } from "../repositories/ConnectionRepository.js";
import { getConversationsByUserId } from "../repositories/messageRepository.js";
import { suppressEmail } from "../utils/notificationQueue.js";

// Table creation lives in migration 20260324_create_user_notification_reads.sql.
// The previous code ran CREATE TABLE IF NOT EXISTS on every request, which
// added needless information_schema work and a brief lock on a hot path
// (Header polls notifications every 30s per session).

export const getInAppNotifications = async (req, res) => {
  try {
    const userId = req.user.id;

    const [pendingReceived, conversations, storedRes] = await Promise.all([
      getPendingReceivedRequestsForUser(userId),
      getConversationsByUserId(userId),
      // T1.5 — persisted notifications (V2 events: deck uploaded, round closing,
      // verification approved, ...). Unread = read_at IS NULL. Best-effort: if the
      // table isn't migrated yet, fall back to an empty set.
      pool
        .query(
          `SELECT id, type, title, body, data, link, created_at
             FROM public.notifications
            WHERE user_id = $1 AND read_at IS NULL
            ORDER BY created_at DESC
            LIMIT 50`,
          [userId],
        )
        .catch((err) => {
          if (err.code !== "42P01") {
            console.error("stored notifications query failed:", err.message);
          }
          return { rows: [] };
        }),
    ]);

    const notifications = [];

    // Stored (V2) notifications first — keyed by their own id.
    for (const row of storedRes.rows) {
      notifications.push({
        key: `notification:${row.id}`,
        type: row.type,
        title: row.title,
        message: row.body || row.title,
        createdAt: row.created_at,
        data: { notificationId: row.id, link: row.link, ...(row.data || {}) },
      });
    }

    for (const request of pendingReceived) {
      notifications.push({
        key: `connection-request:${request.id}`,
        type: "connection_request",
        title: "New connection request",
        message: `${request.requester_name || "A user"} sent you a connection request`,
        createdAt: request.created_at,
        data: {
          connectionId: request.id,
          requesterUserId: request.requester_user_id,
        },
      });
    }

    for (const conversation of conversations) {
      const unreadCount = Number(conversation.unread_count || 0);
      if (unreadCount <= 0) continue;

      notifications.push({
        key: `unread-conversation:${conversation.conversation_id}:${conversation.last_message_time || "latest"}`,
        type: "unread_message",
        title: "Unread messages",
        message: `${conversation.other_user_name || "A user"} sent ${unreadCount} unread message${unreadCount > 1 ? "s" : ""}`,
        createdAt: conversation.last_message_time,
        data: {
          conversationId: conversation.conversation_id,
          otherUserId: conversation.other_user_id,
          unreadCount,
        },
      });
    }

    const readResult = await pool.query(
      "SELECT notification_key FROM user_notification_reads WHERE user_id = $1",
      [userId],
    );
    const readKeys = new Set(
      readResult.rows.map((row) => row.notification_key),
    );

    const unreadNotifications = notifications
      .filter((item) => !readKeys.has(item.key))
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    res.json({
      success: true,
      count: unreadNotifications.length,
      data: unreadNotifications,
    });
  } catch (error) {
    console.error("Get in-app notifications error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch notifications",
    });
  }
};

// T1.5 — Public one-click unsubscribe (clicked from an email, possibly while
// logged out). Adds the address to the suppression list so the worker skips it.
export const unsubscribeEmail = async (req, res) => {
  const email = req.query.email;
  if (!email || typeof email !== "string") {
    return res.status(400).send("Missing email.");
  }
  await suppressEmail(email, "unsubscribed");
  return res
    .status(200)
    .send(
      "You have been unsubscribed from StartHub notification emails. You can re-enable them anytime in Settings.",
    );
};

export const markNotificationAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { notificationKey } = req.body;

    if (!notificationKey || typeof notificationKey !== "string") {
      return res.status(400).json({
        success: false,
        error: "notificationKey is required",
      });
    }

    // Stored (T1.5) notifications carry a "notification:<uuid>" key — mark the
    // row's read_at directly so it stays read. Derived notifications (connection
    // requests, unread messages) use the user_notification_reads dismissal set.
    const storedMatch = /^notification:(.+)$/.exec(notificationKey);
    if (storedMatch) {
      await pool.query(
        `UPDATE public.notifications SET read_at = NOW()
           WHERE id = $1 AND user_id = $2 AND read_at IS NULL`,
        [storedMatch[1], userId],
      );
    } else {
      await pool.query(
        `
          INSERT INTO user_notification_reads (user_id, notification_key)
          VALUES ($1, $2)
          ON CONFLICT (user_id, notification_key)
          DO UPDATE SET read_at = NOW()
        `,
        [userId, notificationKey],
      );
    }

    res.json({
      success: true,
      message: "Notification marked as read",
    });
  } catch (error) {
    console.error("Mark notification as read error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update notification",
    });
  }
};
