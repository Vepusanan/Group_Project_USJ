import express from "express";
import { protect } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/admin.js";
import {
  approveVerificationRequest,
  listPendingVerifications,
  rejectVerificationRequest,
} from "../controllers/adminVerificationController.js";
import { getPlatformAnalytics } from "../controllers/adminAnalyticsController.js";
import {
  listFraudReports,
  dismissFraudReport,
  suspendUserAccount,
  deactivateUserAccount,
  reactivateUserAccount,
} from "../controllers/adminFraudController.js";

const router = express.Router();

router.use(protect, requireAdmin);

router.get("/analytics", getPlatformAnalytics);
router.get("/verification-requests", listPendingVerifications);
router.post("/verification-requests/:requestId/approve", approveVerificationRequest);
router.post("/verification-requests/:requestId/reject", rejectVerificationRequest);

router.get("/reports", listFraudReports);
router.post("/reports/:id/dismiss", dismissFraudReport);
router.post("/users/:userId/suspend", suspendUserAccount);
router.post("/users/:userId/deactivate", deactivateUserAccount);
router.post("/users/:userId/reactivate", reactivateUserAccount);

export default router;
