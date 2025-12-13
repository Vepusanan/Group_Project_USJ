import express from "express";
import {
  getPrivacySettings,
  updatePrivacySettings,
} from "../controllers/privacyController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// All privacy settings routes require authentication
router.get("/privacy", protect, getPrivacySettings);
router.put("/privacy", protect, updatePrivacySettings);

export default router;
