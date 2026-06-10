import express from "express";
import { protect } from "../middleware/auth.js";
import {
  createStartupMilestone,
  deleteStartupMilestone,
  listStartupMilestones,
  updateStartupMilestone,
} from "../controllers/milestoneController.js";

const router = express.Router();

router.get("/startup/:startupProfileId", listStartupMilestones);

router.use(protect);

router.post("/", createStartupMilestone);
router.patch("/:milestoneId", updateStartupMilestone);
router.delete("/:milestoneId", deleteStartupMilestone);

export default router;
