import express from "express";
import { protect } from "../middleware/auth.js";
import { upload } from "../utils/fileUpload.js";
import { handleStartupLogoUpload } from "../middleware/startupLogoUpload.js";
import { handleTeamPhotoUpload } from "../middleware/teamPhotoUpload.js";
import { handleDocumentUploads } from "../middleware/documentUpload.js";
import {
  createProfile,
  updateProfile,
  getProfile,
  getMyStartupProfile,
  getProfileCompletion,
} from "../controllers/profileController.js";

const router = express.Router();

// Routes:
// POST   /api/startups/profile        -> Create a startup profile (requires auth, startup user)
// PUT    /api/startups/profile/:id    -> Update an existing profile (owner only)
// GET    /api/startups/profile/:id    -> Get public (or owner) profile
// GET    /api/startups/profile/me     -> Get current user's profile

// Keep legacy upload fields accepted so older clients do not fail with unexpected field errors.
const multerFields = upload.fields([
  { name: "logo", maxCount: 1 },
  { name: "documents", maxCount: 6 },
]);

router.post("/", protect, handleStartupLogoUpload, handleDocumentUploads, handleTeamPhotoUpload, multerFields, createProfile);
router.get("/me", protect, getMyStartupProfile); // Must be BEFORE /:id route
router.get("/completion", protect, getProfileCompletion); // Profile completion status
router.put("/:id", protect, handleStartupLogoUpload, handleDocumentUploads, handleTeamPhotoUpload, multerFields, updateProfile);
router.get("/:id", protect, getProfile);

export default router;
