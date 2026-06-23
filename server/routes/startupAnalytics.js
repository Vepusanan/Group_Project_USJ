import express from "express";
import { protect } from "../middleware/auth.js";
import { requireStartup } from "../middleware/roles.js";
import { getMyStartupAnalytics } from "../controllers/startupAnalyticsController.js";

const router = express.Router();

router.use(protect, requireStartup);

router.get("/me", getMyStartupAnalytics);

export default router;
