import pool from "../config/database.js";

// Helper to ensure consistent user ordering for conversation lookups
const getCanonicalUserIds = (id1, id2) => {
  const strId1 = id1.toString();
  const strId2 = id2.toString();

  if (strId1 < strId2) {
    return { user1_id: strId1, user2_id: strId2 };
  } else {
    return { user1_id: strId2, user2_id: strId1 };
  }
};

/**
 * Creates a message and ensures a conversation exists between the two users.
 * Uses a transaction to ensure data integrity.
 * INCLUDES: Mark prior received messages as read upon reply.
 */
export async function createAndStoreMessage({
  senderId,
  receiverId,
  text,
  attachmentUrl,
}) {
  let client;
  try {
    client = await pool.connect();
    await client.query("BEGIN");

    const { user1_id, user2_id } = getCanonicalUserIds(senderId, receiverId);
    let conversationId;

    // 1. Check if conversation exists
    const convResult = await client.query(
      `SELECT id FROM conversations 
             WHERE user1_id = $1 AND user2_id = $2`,
      [user1_id, user2_id]
    );

    if (convResult.rows.length > 0) {
      conversationId = convResult.rows[0].id;
    } else {
      // 2. Create new conversation if none exists
      const newConvResult = await client.query(
        `INSERT INTO conversations (user1_id, user2_id) 
                 VALUES ($1, $2) RETURNING id`,
        [user1_id, user2_id]
      );
      conversationId = newConvResult.rows[0].id;
    }

    // --- FIX: Mark old received messages as read before sending reply ---
    // This marks all messages sent by the 'receiver' (who is currently waiting for a reply)
    // as read by the 'sender' (who is currently typing).
    await client.query(
      `UPDATE messages 
             SET read_at = NOW()
             WHERE conversation_id = $1 
               AND receiver_id = $2   
               AND sender_id = $3     
               AND read_at IS NULL`,
      // $1=Conversation ID, $2=Current Sender (the one viewing/replying), $3=Current Receiver (the one whose messages are now read)
      [conversationId, senderId, receiverId]
    );
    // --- END FIX ---

    // 3. Store the new message
    const messageResult = await client.query(
      `INSERT INTO messages (conversation_id, sender_id, receiver_id, text, attachment_url)
             VALUES ($1, $2, $3, $4, $5) 
             RETURNING id, created_at, text, attachment_url, sender_id, receiver_id`,
      [conversationId, senderId, receiverId, text, attachmentUrl]
    );

    // 4. Update the conversation's 'last_message_at' timestamp
    await client.query(
      `UPDATE conversations SET last_message_at = NOW() WHERE id = $1`,
      [conversationId]
    );

    await client.query("COMMIT");

    return {
      ...messageResult.rows[0],
      conversationId: conversationId,
    };
  } catch (error) {
    if (client) await client.query("ROLLBACK");
    throw error;
  } finally {
    if (client) client.release();
  }
}

/**
 * Fetches the list of conversations for a user.
 * Includes the last message preview and unread count for each chat.
 */
export async function getConversationsByUserId(userId) {
  const query = `
        WITH UserMessages AS (
            -- Get the latest message for every conversation
            SELECT DISTINCT ON (m.conversation_id)
                m.conversation_id,
                m.text AS last_message_preview,
                m.created_at AS last_message_time
            FROM messages m
            ORDER BY m.conversation_id, m.created_at DESC
        ),
        UnreadCounts AS (
            -- Count unread messages where the current user is the receiver
            SELECT
                conversation_id,
                COUNT(id) AS unread_count
            FROM messages
            WHERE receiver_id = $1 AND read_at IS NULL
            GROUP BY conversation_id
        )
        SELECT
            c.id AS conversation_id,
            -- Determine the "other" user in the conversation
            CASE
                WHEN c.user1_id = $1 THEN u2.id
                ELSE u1.id
            END AS other_user_id,
            CASE
                WHEN c.user1_id = $1 THEN u2.full_name
                ELSE u1.full_name
            END AS other_user_name,
            CASE
                WHEN c.user1_id = $1 THEN COALESCE(ip2.photo_url, sp2.logo_url)
                ELSE COALESCE(ip1.photo_url, sp1.logo_url)
            END AS other_user_photo_url,
            -- Data from CTEs
            UM.last_message_preview,
            COALESCE(UC.unread_count, 0) AS unread_count,
            UM.last_message_time
        FROM conversations c
        JOIN users u1 ON c.user1_id = u1.id
        JOIN users u2 ON c.user2_id = u2.id
        JOIN UserMessages UM ON c.id = UM.conversation_id
        LEFT JOIN UnreadCounts UC ON c.id = UC.conversation_id
        LEFT JOIN investor_profiles ip1 ON ip1.user_id = u1.id AND u1.user_type = 'investor'
        LEFT JOIN startup_profiles sp1 ON sp1.user_id = u1.id AND u1.user_type = 'startup'
        LEFT JOIN investor_profiles ip2 ON ip2.user_id = u2.id AND u2.user_type = 'investor'
        LEFT JOIN startup_profiles sp2 ON sp2.user_id = u2.id AND u2.user_type = 'startup'
        WHERE c.user1_id = $1 OR c.user2_id = $1
        ORDER BY UM.last_message_time DESC;
    `;

  const result = await pool.query(query, [userId]);
  return result.rows;
}

/**
 * Fetches messages for a specific conversation and marks them as read.
 * Validates that the user is a participant.
 */
export async function getConversationMessagesAndMarkRead({
  conversationId,
  userId,
  limit,
  offset,
}) {
  let client;
  try {
    client = await pool.connect();
    await client.query("BEGIN");

    // 1. Verify user is a participant
    const participantCheck = await client.query(
      `SELECT id FROM conversations 
             WHERE id = $1 AND (user1_id = $2 OR user2_id = $2)`,
      [conversationId, userId]
    );

    if (participantCheck.rows.length === 0) {
      throw new Error("AccessDenied");
    }

    // 2. Mark unread messages as read (only those sent TO the current user)
    await client.query(
      `UPDATE messages 
             SET read_at = NOW()
             WHERE conversation_id = $1 AND receiver_id = $2 AND read_at IS NULL`,
      [conversationId, userId]
    );

    // 3. Fetch messages (newest first for pagination)
    const messages = await client.query(
      `SELECT 
                id, sender_id, receiver_id, text, attachment_url, read_at, created_at 
             FROM messages 
             WHERE conversation_id = $1
             ORDER BY created_at DESC
             LIMIT $2 OFFSET $3`,
      [conversationId, limit, offset]
    );

    await client.query("COMMIT");

    return messages.rows;
  } catch (error) {
    if (client) await client.query("ROLLBACK");
    throw error;
  } finally {
    if (client) client.release();
  }
}
