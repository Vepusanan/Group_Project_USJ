import express from "express";
import { protect } from "../middleware/auth.js";
import {
  getInAppNotifications,
  markNotificationAsRead,
  unsubscribeEmail,
} from "../controllers/inappNotificationController.js";

const router = express.Router();

// Public — clicked from an email link, no auth required. Must be registered
// BEFORE router.use(protect).
router.get("/unsubscribe", unsubscribeEmail);

router.use(protect);

router.get("/", getInAppNotifications);
router.post("/read", markNotificationAsRead);

export default router;
