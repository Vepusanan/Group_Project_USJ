import express from "express";
import { protect } from "../middleware/auth.js";
import { requireProfileComplete } from "../middleware/requireProfileComplete.js";
import {
  getInAppNotifications,
  markNotificationAsRead,
} from "../controllers/inappNotificationController.js";

const router = express.Router();

router.use(protect, requireProfileComplete);

router.get("/", getInAppNotifications);
router.post("/read", markNotificationAsRead);

export default router;
