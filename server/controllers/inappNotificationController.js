import pool from "../config/database.js";
import {
  getPendingReceivedRequestsForUser,
  getRecentlyAcceptedConnectionsForUser,
} from "../repositories/ConnectionRepository.js";
import { buildProfileUrl } from "../utils/connectionProfileUrl.js";
import { getConversationsByUserId } from "../repositories/messageRepository.js";
import { listRecentAccessGrantsForInvestor } from "../repositories/DataRoomRepository.js";
import { listSharedChecklistsForStartup, listRecentDdResponsesForInvestor } from "../repositories/DdChecklistRepository.js";
import { listUnansweredQuestionsForStartup, listRecentQaAnswersForInvestor } from "../repositories/ConnectionQaRepository.js";
import { listRecentMeetingUpdatesForUser } from "../repositories/MeetingRepository.js";

// Table creation lives in migration 20260324_create_user_notification_reads.sql.
// The previous code ran CREATE TABLE IF NOT EXISTS on every request, which
// added needless information_schema work and a brief lock on a hot path
// (Header polls notifications every 30s per session).

export const getInAppNotifications = async (req, res) => {
  try {
    const userId = req.user.id;

    const [pendingReceived, recentlyAccepted, conversations, dataRoomGrants, pendingMeetings, meetingUpdates, ddShared, ddResponses, qaQuestions, qaAnswers] =
      await Promise.all([
        getPendingReceivedRequestsForUser(userId),
        getRecentlyAcceptedConnectionsForUser(userId),
        getConversationsByUserId(userId),
        req.user.user_type === "investor"
          ? listRecentAccessGrantsForInvestor(userId)
          : Promise.resolve([]),
        req.user.user_type === "startup"
          ? pool.query(
              `
                SELECT m.id, m.connection_id, m.proposed_at, m.agenda, m.created_at, u.full_name AS requester_name
                FROM public.connection_meetings m
                JOIN public.connections c ON c.id = m.connection_id
                JOIN public.users u ON u.id = m.requested_by
                WHERE c.startup_id = $1 AND m.status = 'pending'
                ORDER BY m.created_at DESC
                LIMIT 10
              `,
              [userId],
            )
          : Promise.resolve({ rows: [] }),
        listRecentMeetingUpdatesForUser(userId),
        req.user.user_type === "startup"
          ? listSharedChecklistsForStartup(userId)
          : Promise.resolve([]),
        req.user.user_type === "investor"
          ? listRecentDdResponsesForInvestor(userId)
          : Promise.resolve([]),
        req.user.user_type === "startup"
          ? listUnansweredQuestionsForStartup(userId)
          : Promise.resolve([]),
        req.user.user_type === "investor"
          ? listRecentQaAnswersForInvestor(userId)
          : Promise.resolve([]),
      ]);

    const notifications = [];

    for (const request of pendingReceived) {
      const profileUrl = buildProfileUrl(
        request.requester_user_type,
        request.requester_profile_id,
      );
      const messagePreview = request.message
        ? `: "${String(request.message).slice(0, 120)}${request.message.length > 120 ? "…" : ""}"`
        : "";

      notifications.push({
        key: `connection-request:${request.id}`,
        type: "connection_request",
        title: "New connection request",
        message: `${request.requester_name || "A user"} sent you a connection request${messagePreview}`,
        createdAt: request.created_at,
        data: {
          connectionId: request.id,
          requesterUserId: request.requester_user_id,
          requesterName: request.requester_name,
          requesterPhotoUrl: request.other_user_photo_url || null,
          requesterProfileUrl: profileUrl,
          requestMessage: request.message || null,
        },
      });
    }

    for (const connection of recentlyAccepted) {
      const profileUrl = buildProfileUrl(
        connection.other_user_type,
        connection.other_user_profile_id,
      );
      const isRequester =
        String(connection.requester_id) === String(userId);

      notifications.push({
        key: `connection-accepted:${connection.id}:${connection.updated_at}`,
        type: "connection_accepted",
        title: "Connection accepted",
        message: isRequester
          ? `${connection.other_user_name || "A user"} accepted your connection request`
          : `You are now connected with ${connection.other_user_name || "a user"}`,
        createdAt: connection.updated_at,
        data: {
          connectionId: connection.id,
          otherUserId: connection.other_user_id,
          otherUserName: connection.other_user_name,
          otherUserPhotoUrl: connection.other_user_photo_url || null,
          otherUserProfileUrl: profileUrl,
        },
      });
    }

    for (const meeting of pendingMeetings.rows || []) {
      notifications.push({
        key: `meeting-request:${meeting.id}`,
        type: "meeting_request",
        title: "Meeting request",
        message: `${meeting.requester_name || "An investor"} requested a meeting`,
        createdAt: meeting.created_at,
        data: {
          meetingId: meeting.id,
          connectionId: meeting.connection_id,
        },
      });
    }

    for (const meeting of meetingUpdates) {
      const accepted = meeting.status === "accepted";
      notifications.push({
        key: `meeting-update:${meeting.id}:${meeting.responded_at}`,
        type: accepted ? "meeting_confirmed" : "meeting_declined",
        title: accepted ? "Meeting confirmed" : "Meeting declined",
        message: accepted
          ? `Meeting with ${meeting.other_party_name || "your connection"} confirmed for ${new Date(meeting.proposed_at).toLocaleString()}`
          : `${meeting.other_party_name || "Your connection"} declined a meeting request`,
        createdAt: meeting.responded_at,
        data: {
          meetingId: meeting.id,
          connectionId: meeting.connection_id,
        },
      });
    }

    for (const grant of dataRoomGrants) {
      notifications.push({
        key: `data-room-access:${grant.id}`,
        type: "data_room_access",
        title: "Data room access granted",
        message: `${grant.company_name || "A startup"} granted you access to their private data room`,
        createdAt: grant.granted_at,
        data: {
          grantId: grant.id,
          startupProfileId: grant.startup_profile_id,
          companyName: grant.company_name,
        },
      });
    }

    for (const shared of ddShared) {
      notifications.push({
        key: `dd-checklist-shared:${shared.checklist_id}`,
        type: "dd_checklist_shared",
        title: "Due diligence checklist shared",
        message: `${shared.investor_name || "An investor"} shared a due diligence checklist with you`,
        createdAt: shared.shared_at,
        data: { connectionId: shared.connection_id },
      });
    }

    for (const response of ddResponses) {
      notifications.push({
        key: `dd-checklist-response:${response.item_id}`,
        type: "dd_checklist_response",
        title: "Checklist item response",
        message: `${response.company_name || "A startup"} responded to a due diligence item`,
        createdAt: response.response_submitted_at,
        data: { connectionId: response.connection_id, itemId: response.item_id },
      });
    }

    for (const question of qaQuestions) {
      notifications.push({
        key: `qa-question:${question.id}`,
        type: "qa_question",
        title: "New investor question",
        message: `${question.investor_name || "An investor"} asked a ${String(question.category || "").toLowerCase()} question`,
        createdAt: question.asked_at,
        data: { connectionId: question.connection_id, threadId: question.id },
      });
    }

    for (const answer of qaAnswers) {
      notifications.push({
        key: `qa-answer:${answer.id}`,
        type: "qa_answer",
        title: "Q&A response received",
        message: `${answer.company_name || "A startup"} answered your ${String(answer.category || "").toLowerCase()} question`,
        createdAt: answer.answered_at,
        data: { connectionId: answer.connection_id, threadId: answer.id },
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
