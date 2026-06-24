import * as MessageRepository from "../repositories/messageRepository.js";
import {
  getUserById,
  isUsersConnected,
} from "../repositories/ConnectionRepository.js";
import { sendNewMessageEmail } from "../utils/emailServices.js";
import { isUserRecentlyActive } from "../utils/userPresence.js";
import { assertAllowedMessageAttachmentUrl } from "../utils/messageAttachmentUrl.js";

// Send a new message
export const sendMessage = async (req, res) => {
  const senderId = req.user.id; // From 'protect' middleware
  const { receiverId, text, attachmentUrl } = req.body;

  // Basic Validation
  if (!receiverId || (!text && !attachmentUrl)) {
    return res.status(400).json({
      success: false,
      error: "Receiver ID and either message text or attachment are required.",
    });
  }

  if (senderId === receiverId) {
    return res.status(400).json({
      success: false,
      error: "Cannot send message to yourself.",
    });
  }

  try {
    const connected = await isUsersConnected(senderId, receiverId);
    if (!connected) {
      return res.status(403).json({
        success: false,
        error: "You can only message users you are connected with.",
      });
    }

    if (attachmentUrl) {
      try {
        assertAllowedMessageAttachmentUrl(attachmentUrl, senderId);
      } catch (attachmentError) {
        return res.status(attachmentError.statusCode || 400).json({
          success: false,
          error: attachmentError.message,
        });
      }
    }

    const messageData = await MessageRepository.createAndStoreMessage({
      senderId,
      receiverId,
      text: (text || "").trim(),
      attachmentUrl,
    });

    // Email the recipient when they have not been active recently (Realtime presence).
    if (!(await isUserRecentlyActive(receiverId))) {
      (async () => {
        try {
          const [sender, receiver] = await Promise.all([
            getUserById(senderId),
            getUserById(receiverId),
          ]);
          if (receiver?.email) {
            await sendNewMessageEmail(
              receiver.email,
              receiver.full_name,
              sender?.full_name || "A connection",
              messageData.text,
            );
          }
        } catch (emailError) {
          console.error(
            "Failed to send new-message email:",
            emailError.message,
          );
        }
      })();
    }

    res.status(201).json({
      success: true,
      message: "Message sent successfully.",
      data: messageData,
    });
  } catch (error) {
    console.error("Send message error:", error);
    res.status(500).json({
      success: false,
      error: "Server error while sending message.",
    });
  }
};

// Upload message attachment
export const uploadMessageAttachment = async (req, res) => {
  try {
    if (!req.attachmentUrl) {
      return res.status(400).json({
        success: false,
        error: "No attachment URL generated",
      });
    }

    return res.status(201).json({
      success: true,
      attachmentUrl: req.attachmentUrl,
    });
  } catch (error) {
    console.error("Upload message attachment error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to upload message attachment",
    });
  }
};

// Get list of conversations
export const getConversations = async (req, res) => {
  const userId = req.user.id;

  try {
    const conversations =
      await MessageRepository.getConversationsByUserId(userId);

    res.status(200).json({
      success: true,
      count: conversations.length,
      conversations: conversations,
    });
  } catch (error) {
    console.error("Get conversations error:", error);
    res.status(500).json({
      success: false,
      error: "Server error while retrieving conversations.",
    });
  }
};

// Get messages for a specific conversation
export const getConversationMessages = async (req, res) => {
  const userId = req.user.id;
  const conversationId = req.params.id;

  // Pagination defaults
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const offset = (page - 1) * limit;

  try {
    const messages = await MessageRepository.getConversationMessagesAndMarkRead(
      {
        conversationId,
        userId,
        limit,
        offset,
      },
    );

    res.status(200).json({
      success: true,
      messages: messages,
      page: page,
      limit: limit,
    });
  } catch (error) {
    console.error("Get messages error:", error);

    if (error.message === "AccessDenied") {
      return res.status(403).json({
        success: false,
        error: "Access denied. You are not a participant in this conversation.",
      });
    }

    res.status(500).json({
      success: false,
      error: "Server error while retrieving messages.",
    });
  }
};
