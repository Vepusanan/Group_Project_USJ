import express from "express";
import { protect } from "../middleware/auth.js";
import {
  getInAppNotifications,
  markNotificationAsRead,
} from "../controllers/inappNotificationController.js";

const router = express.Router();

router.use(protect);

router.get("/", getInAppNotifications);
router.post("/read", markNotificationAsRead);

export default router;
