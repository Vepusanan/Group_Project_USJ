import express from "express";
import { protect } from "../middleware/auth.js";
import { requireInvestor } from "../middleware/roles.js";
import {
  getDealPipeline,
  moveDealPipelineCard,
  updateDealPipelineNotes,
  dealPipelineErrorHandler,
} from "../controllers/dealPipelineController.js";

const router = express.Router();

router.use(protect, requireInvestor);

router.get("/", getDealPipeline);
router.patch("/cards/:cardId/stage", moveDealPipelineCard);
router.patch("/cards/:cardId/notes", updateDealPipelineNotes);

router.use(dealPipelineErrorHandler);

export default router;
