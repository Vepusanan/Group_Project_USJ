import express from "express";
import { protect } from "../middleware/auth.js";
import { upload } from "../utils/fileUpload.js";
import {
  getMyVerificationStatus,
  submitBusinessVerification,
  submitIdentityVerification,
} from "../controllers/verificationController.js";

const router = express.Router();

router.use(protect);

router.get("/me", getMyVerificationStatus);
router.post("/identity", submitIdentityVerification);
router.post(
  "/business",
  (req, res, next) => {
    upload.single("document")(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          error: err.message || "File upload failed",
        });
      }
      next();
    });
  },
  submitBusinessVerification,
);

export default router;
