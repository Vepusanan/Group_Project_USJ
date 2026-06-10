import express from "express";
import { protect } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/admin.js";
import {
  approveVerificationRequest,
  listPendingVerifications,
  rejectVerificationRequest,
} from "../controllers/adminVerificationController.js";
import { getPlatformAnalytics } from "../controllers/adminAnalyticsController.js";

const router = express.Router();

router.use(protect, requireAdmin);

router.get("/analytics", getPlatformAnalytics);
router.get("/verification-requests", listPendingVerifications);
router.post("/verification-requests/:requestId/approve", approveVerificationRequest);
router.post("/verification-requests/:requestId/reject", rejectVerificationRequest);

export default router;
