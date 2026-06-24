import express from "express";
import { protect } from "../middleware/auth.js";
import { requireInvestor } from "../middleware/roles.js";
import { requireProfileComplete } from "../middleware/requireProfileComplete.js";
import {
  compareStartups,
  getSnapshots,
  removeSnapshot,
  saveSnapshot,
} from "../controllers/comparisonController.js";

const router = express.Router();

router.use(protect, requireInvestor, requireProfileComplete);

router.post("/compare", compareStartups);
router.get("/snapshots", getSnapshots);
router.post("/snapshots", saveSnapshot);
router.delete("/snapshots/:snapshotId", removeSnapshot);

export default router;
