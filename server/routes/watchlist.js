import express from "express";
import { protect } from "../middleware/auth.js";
import { requireInvestor } from "../middleware/roles.js";
import { requireProfileComplete } from "../middleware/requireProfileComplete.js";
import {
  addWatchlistItem,
  getMyWatchlist,
  removeWatchlistItem,
} from "../controllers/watchlistController.js";

const router = express.Router();

router.use(protect, requireInvestor, requireProfileComplete);

router.get("/", getMyWatchlist);
router.post("/", addWatchlistItem);
router.delete("/:startupProfileId", removeWatchlistItem);

export default router;
