import express from "express";
import { optionalAuth, protect } from "../middleware/auth.js";
import { aiLimiter } from "../middleware/rateLimiter.js";
import {
  getStartups,
  parseNaturalLanguageSearch,
} from "../controllers/searchController.js";

const router = express.Router();

// GET /startups
// Query params: page, limit, q, industry, current_stage, funding_stage, revenue_status, sort
router.get("/", optionalAuth, getStartups);
router.post("/natural-language", protect, aiLimiter, parseNaturalLanguageSearch);

export default router;
