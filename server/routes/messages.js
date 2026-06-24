import express from "express";
import { protect } from "../middleware/auth.js"; // Ensure correct path to your auth middleware
import { requireProfileComplete } from "../middleware/requireProfileComplete.js";
import {
  sendMessage,
  getConversations,
  getConversationMessages,
  uploadMessageAttachment,
} from "../controllers/messageController.js";
import { handleMessageAttachment } from "../middleware/messageUpload.js";

const router = express.Router();

// All message routes require authentication and completed onboarding
router.use(protect, requireProfileComplete);

// POST /api/messages - Send a message
router.post("/", sendMessage);

// POST /api/messages/attachments - Upload message attachment
router.post("/attachments", handleMessageAttachment, uploadMessageAttachment);

// GET /api/messages/conversations - Get list of conversations
router.get("/conversations", getConversations);

// GET /api/messages/conversation/:id - Get specific conversation history
router.get("/conversation/:id", getConversationMessages);

export default router;
