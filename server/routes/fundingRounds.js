import express from "express";
import { protect } from "../middleware/auth.js";
import { requireStartup } from "../middleware/roles.js";
import {
  closeFundingRoundHandler,
  createFundingRoundHandler,
  getMyFundingRound,
  getStartupFundingRound,
  updateFundingRoundHandler,
  fundingRoundErrorHandler,
} from "../controllers/fundingRoundController.js";

const router = express.Router();

router.use(protect);

router.get("/me", requireStartup, getMyFundingRound);
router.get("/startup/:startupProfileId", getStartupFundingRound);
router.post("/", requireStartup, createFundingRoundHandler);
router.put("/:roundId", requireStartup, updateFundingRoundHandler);
router.post("/:roundId/close", requireStartup, closeFundingRoundHandler);

router.use(fundingRoundErrorHandler);

export default router;
