import express from "express";
import { protect } from "../middleware/auth.js";
import {
  getRealtimeToken,
  updatePresence,
} from "../controllers/realtimeController.js";

const router = express.Router();

router.use(protect);

router.get("/token", getRealtimeToken);
router.post("/presence", updatePresence);

export default router;
