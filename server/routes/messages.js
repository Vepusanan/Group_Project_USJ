import express from "express";
import { protect } from "../middleware/auth.js"; // Ensure correct path to your auth middleware
import {
  sendMessage,
  getConversations,
  getConversationMessages,
} from "../controllers/messageController.js";

const router = express.Router();

// All message routes require authentication
router.use(protect);

// POST /api/messages - Send a message
router.post("/", sendMessage);

// GET /api/messages/conversations - Get list of conversations
router.get("/conversations", getConversations);

// GET /api/messages/conversation/:id - Get specific conversation history
router.get("/conversation/:id", getConversationMessages);

export default router;
