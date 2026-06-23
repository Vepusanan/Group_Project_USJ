import express from "express";
import { protect } from "../middleware/auth.js";
import { upload, videoUpload } from "../utils/fileUpload.js";
import {
  createProfile,
  updateProfile,
  getProfile,
  getMyStartupProfile,
  getProfileCompletion,
  getStartupMatchExplanation,
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
  { name: "pitch_deck", maxCount: 1 },
  { name: "business_plan", maxCount: 1 },
  { name: "documents", maxCount: 6 },
  { name: "founder_video_thumbnail", maxCount: 1 },
]);

const videoMulterFields = videoUpload.fields([
  { name: "founder_video", maxCount: 1 },
]);

const runMulter = (req, res, next) => {
  multerFields(req, res, (err) => {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          error: "File is too large. Maximum upload size is 15 MB.",
        });
      }
      return res.status(400).json({
        error: err.message || "File upload failed",
      });
    }

    videoMulterFields(req, res, (videoErr) => {
      if (videoErr) {
        if (videoErr.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({
            error: "Founder video is too large. Maximum size is 100 MB.",
          });
        }
        return res.status(400).json({
          error: videoErr.message || "Video upload failed",
        });
      }
      next();
    });
  });
};

router.post("/", protect, runMulter, createProfile);
router.get("/me", protect, getMyStartupProfile); // Must be BEFORE /:id route
router.get("/completion", protect, getProfileCompletion); // Profile completion status
router.get("/:id/match-explanation", protect, getStartupMatchExplanation);
router.put("/:id", protect, runMulter, updateProfile);
router.get("/:id", protect, getProfile);

export default router;
