import express from "express";
import { protect } from "../middleware/auth.js";
import { requireInvestor } from "../middleware/roles.js";
import { requireProfileComplete } from "../middleware/requireProfileComplete.js";
import {
  listMyIntents,
  setConnectionIntent,
  setProfileIntent,
  passStartupFromDiscovery,
  unpassStartupFromDiscovery,
  investorIntentErrorHandler,
} from "../controllers/investorIntentController.js";

const router = express.Router();

router.use(protect, requireInvestor, requireProfileComplete);

router.get("/", listMyIntents);
router.put("/connection/:connectionId", setConnectionIntent);
router.put("/startup/:startupProfileId", setProfileIntent);
router.post("/pass/:startupProfileId", passStartupFromDiscovery);
router.delete("/pass/:startupProfileId", unpassStartupFromDiscovery);

router.use(investorIntentErrorHandler);

export default router;
