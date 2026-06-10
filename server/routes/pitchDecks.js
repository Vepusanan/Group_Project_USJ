import express from "express";
import { protect } from "../middleware/auth.js";
import { aiLimiter, pitchDeckSessionLimiter } from "../middleware/rateLimiter.js";
import {
  analyzePitchDeck,
  completePitchDeckSession,
  getPitchDeckMeta,
  pitchDeckErrorHandler,
  startPitchDeckSession,
  streamPitchDeck,
  updatePitchDeckSession,
} from "../controllers/pitchDeckController.js";

const router = express.Router();

router.get("/:startupProfileId/meta", protect, getPitchDeckMeta);
router.get("/:startupProfileId/file", protect, streamPitchDeck);
router.post("/:startupProfileId/analyze", protect, aiLimiter, analyzePitchDeck);
router.post(
  "/:startupProfileId/sessions",
  protect,
  pitchDeckSessionLimiter,
  startPitchDeckSession,
);
router.patch(
  "/sessions/:sessionId",
  protect,
  pitchDeckSessionLimiter,
  updatePitchDeckSession,
);
router.post(
  "/sessions/:sessionId/complete",
  protect,
  pitchDeckSessionLimiter,
  completePitchDeckSession,
);

router.use(pitchDeckErrorHandler);

export default router;
