import express from "express";
import { protect } from "../middleware/auth.js";
import { requireInvestor } from "../middleware/roles.js";
import {
  compareStartups,
  getSnapshots,
  removeSnapshot,
  saveSnapshot,
} from "../controllers/comparisonController.js";

const router = express.Router();

router.use(protect, requireInvestor);

router.post("/compare", compareStartups);
router.get("/snapshots", getSnapshots);
router.post("/snapshots", saveSnapshot);
router.delete("/snapshots/:snapshotId", removeSnapshot);

export default router;
