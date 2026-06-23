import express from "express";
import { protect } from "../middleware/auth.js";
import { reportProfile } from "../controllers/profileReportController.js";

const router = express.Router();

router.use(protect);
router.post("/:userId", reportProfile);

export default router;
