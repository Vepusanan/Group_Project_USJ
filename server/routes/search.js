import express from "express";
import { optionalAuth } from "../middleware/auth.js";
import { getStartups } from "../controllers/searchController.js";

const router = express.Router();

// GET /startups
// Query params: page, limit, q, industry, current_stage, funding_stage, revenue_status, sort
router.get("/", optionalAuth, getStartups);

export default router;
