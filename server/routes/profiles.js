import express from "express";
import { protect } from "../middleware/auth.js";
import { upload } from "../utils/fileUpload.js";
import {
	createProfile,
	updateProfile,
	getProfile,
	getMyStartupProfile,
	deleteDocument,
	uploadDocuments,
	getProfileCompletion,
} from "../controllers/profileController.js";

const router = express.Router();

// Routes:
// POST   /api/startups/profile        -> Create a startup profile (requires auth, startup user)
// PUT    /api/startups/profile/:id    -> Update an existing profile (owner only)
// GET    /api/startups/profile/:id    -> Get public (or owner) profile
// GET    /api/startups/profile/me     -> Get current user's profile

// Use multer fields: logo (single), documents (array)
const multerFields = upload.fields([
	{ name: "logo", maxCount: 1 },
	{ name: "documents", maxCount: 6 },
]);

router.post("/", protect, multerFields, createProfile);
router.get("/me", protect, getMyStartupProfile); // Must be BEFORE /:id route
router.get("/completion", protect, getProfileCompletion); // Profile completion status
router.put("/:id", protect, multerFields, updateProfile);
router.get("/:id", getProfile);

// Document management routes
router.delete("/:profileId/documents/:documentIndex", protect, deleteDocument);
router.post("/:profileId/documents", protect, upload.array("documents", 6), uploadDocuments);

export default router;