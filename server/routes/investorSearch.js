import express from "express";
import { optionalAuth } from "../middleware/auth.js";
import { getInvestors } from "../controllers/searchController.js";

const router = express.Router();

// GET /api/investors — browse & search investor profiles (auth optional)
router.get("/", optionalAuth, getInvestors);

export default router;
