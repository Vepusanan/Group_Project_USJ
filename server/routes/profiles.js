import express from "express";
import { protect } from "../middleware/auth.js";
import { profileUpload, PROFILE_FILE_LIMITS } from "../utils/fileUpload.js";
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

// A multipart body can only be parsed once, so logo/document fields and the
// founder video are handled by a single parser. Chaining two multer instances
// drains the stream on the first pass and makes the second throw
// "Unexpected end of form". Keep legacy upload fields accepted so older clients
// do not fail with unexpected-field errors.
const multerFields = profileUpload.fields([
  { name: "logo", maxCount: 1 },
  { name: "pitch_deck", maxCount: 1 },
  { name: "business_plan", maxCount: 1 },
  { name: "documents", maxCount: 6 },
  { name: "founder_video_thumbnail", maxCount: 1 },
  { name: "founder_video", maxCount: 1 },
]);

// multer's fileSize limit is global to the request and set to the video cap, so
// non-video files are size-checked here to keep the 15 MB ceiling for them.
const enforcePerFieldSizeLimits = (req) => {
  const files = req.files || {};
  for (const [field, list] of Object.entries(files)) {
    if (field === "founder_video") continue;
    for (const file of list) {
      if (file.size > PROFILE_FILE_LIMITS.GENERAL_FILE_MAX) {
        return "File is too large. Maximum upload size is 15 MB.";
      }
    }
  }
  return null;
};

const runMulter = (req, res, next) => {
  multerFields(req, res, (err) => {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          error: "Founder video is too large. Maximum size is 100 MB.",
        });
      }
      return res.status(400).json({
        error: err.message || "File upload failed",
      });
    }

    const sizeError = enforcePerFieldSizeLimits(req);
    if (sizeError) {
      return res.status(400).json({ error: sizeError });
    }

    next();
  });
};

router.post("/", protect, runMulter, createProfile);
router.get("/me", protect, getMyStartupProfile); // Must be BEFORE /:id route
router.get("/completion", protect, getProfileCompletion); // Profile completion status
router.get("/:id/match-explanation", protect, getStartupMatchExplanation);
router.put("/:id", protect, runMulter, updateProfile);
router.get("/:id", protect, getProfile);

export default router;
