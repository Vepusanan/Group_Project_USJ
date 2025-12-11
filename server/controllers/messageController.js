import * as MessageRepository from "../repositories/messageRepository.js";

// Send a new message
export const sendMessage = async (req, res) => {
  const senderId = req.user.id; // From 'protect' middleware
  const { receiverId, text, attachmentUrl } = req.body;

  // Basic Validation
  if (!receiverId || !text) {
    return res.status(400).json({
      success: false,
      error: "Receiver ID and message text are required.",
    });
  }

  if (senderId === receiverId) {
    return res.status(400).json({
      success: false,
      error: "Cannot send message to yourself.",
    });
  }

  try {
    // TODO: Add check here to verify users are "connected" in your system

    const messageData = await MessageRepository.createAndStoreMessage({
      senderId,
      receiverId,
      text,
      attachmentUrl,
    });

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

// Get list of conversations
export const getConversations = async (req, res) => {
  const userId = req.user.id;

  try {
    const conversations = await MessageRepository.getConversationsByUserId(
      userId
    );

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
      }
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
