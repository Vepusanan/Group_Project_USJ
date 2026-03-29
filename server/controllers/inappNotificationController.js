import pool from "../config/database.js";
import { getPendingReceivedRequestsForUser } from "../repositories/ConnectionRepository.js";
import { getConversationsByUserId } from "../repositories/messageRepository.js";

const ensureNotificationReadTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_notification_reads (
      user_id UUID NOT NULL,
      notification_key TEXT NOT NULL,
      read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (user_id, notification_key)
    )
  `);
};

export const getInAppNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    await ensureNotificationReadTable();

    const [pendingReceived, conversations] = await Promise.all([
      getPendingReceivedRequestsForUser(userId),
      getConversationsByUserId(userId),
    ]);

    const notifications = [];

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

    await ensureNotificationReadTable();
    await pool.query(
      `
        INSERT INTO user_notification_reads (user_id, notification_key)
        VALUES ($1, $2)
        ON CONFLICT (user_id, notification_key)
        DO UPDATE SET read_at = NOW()
      `,
      [userId, notificationKey],
    );

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
