import express from "express";
import { protect } from "../middleware/auth.js";
import { upload } from "../utils/fileUpload.js";
import {
  createInvestorProfileController,
  updateInvestorProfileController,
  getInvestorProfileController,
  getMyInvestorProfile,
  getProfileCompletion,
} from "../controllers/profileController.js";

const router = express.Router();

// Routes:
// POST   /api/investors/profile        -> Create an investor profile (requires auth, investor user)
// PUT    /api/investors/profile/:id    -> Update an existing profile (owner only)
// GET    /api/investors/profile/:id    -> Get public (or owner) profile
// GET    /api/investors/profile/me     -> Get current user's profile

// Keep legacy upload field accepted so older clients do not fail with unexpected field errors.
const multerFields = upload.fields([{ name: "photo", maxCount: 1 }]);

router.post("/", protect, multerFields, createInvestorProfileController);
router.get("/me", protect, getMyInvestorProfile); // Must be BEFORE /:id route
router.get("/completion", protect, getProfileCompletion); // Profile completion status
router.put("/:id", protect, multerFields, updateInvestorProfileController);
router.get("/:id", protect, getInvestorProfileController);

export default router;
