import express from "express";
import { protect } from "../middleware/auth.js";
import { requireProfileComplete } from "../middleware/requireProfileComplete.js";
import {
  createStartupMilestone,
  deleteStartupMilestone,
  listStartupMilestones,
  updateStartupMilestone,
} from "../controllers/milestoneController.js";

const router = express.Router();

router.use(protect, requireProfileComplete);

router.get("/startup/:startupProfileId", listStartupMilestones);
router.post("/", createStartupMilestone);
router.patch("/:milestoneId", updateStartupMilestone);
router.delete("/:milestoneId", deleteStartupMilestone);

export default router;
