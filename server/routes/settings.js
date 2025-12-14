import express from "express";
import {
  getPrivacySettings,
  updatePrivacySettings,
} from "../controllers/privacyController.js";
import {
  getNotificationSettings,
  updateNotificationSettings,
} from "../controllers/notificationController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// All settings routes require authentication

// Privacy settings routes
router.get("/privacy", protect, getPrivacySettings);
router.put("/privacy", protect, updatePrivacySettings);

// Notification settings routes
router.get("/notifications", protect, getNotificationSettings);
router.put("/notifications", protect, updateNotificationSettings);

export default router;
