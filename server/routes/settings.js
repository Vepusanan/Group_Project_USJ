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
import { requireProfileComplete } from "../middleware/requireProfileComplete.js";

const router = express.Router();

// All settings routes require authentication

// Privacy settings require completed onboarding (profile visibility features)
router.get("/privacy", protect, requireProfileComplete, getPrivacySettings);
router.put("/privacy", protect, requireProfileComplete, updatePrivacySettings);

// Notification settings routes
router.get("/notifications", protect, getNotificationSettings);
router.put("/notifications", protect, updateNotificationSettings);

export default router;
